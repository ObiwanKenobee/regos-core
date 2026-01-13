import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SensorData {
  source: 'sensor' | 'satellite' | 'partner_api';
  region_code: string;
  data_type: 'land' | 'ocean' | 'health' | 'circular';
  value: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

interface IngestionPayload {
  api_key?: string;
  data: SensorData | SensorData[];
}

// Normalize capacity value to 0-100 scale
function normalizeValue(value: number, dataType: string): number {
  // Different normalization based on data type
  switch (dataType) {
    case 'land':
      // Assume land values come as percentage (0-100)
      return Math.min(100, Math.max(0, value));
    case 'ocean':
      // Ocean health index typically 0-1, scale to 0-100
      return Math.min(100, Math.max(0, value * 100));
    case 'health':
      // Human development index style (0-1 or 0-100)
      return value > 1 ? Math.min(100, value) : value * 100;
    case 'circular':
      // Circularity rate as percentage
      return Math.min(100, Math.max(0, value));
    default:
      return Math.min(100, Math.max(0, value));
  }
}

// Calculate composite RCI score from capacities
function calculateRCI(land: number, ocean: number, health: number, circular: number): number {
  // Weighted average with emphasis on ecological capacities
  const weights = { land: 0.3, ocean: 0.25, health: 0.25, circular: 0.2 };
  return (
    land * weights.land +
    ocean * weights.ocean +
    health * weights.health +
    circular * weights.circular
  );
}

// Determine trend based on previous and current RCI
function determineTrend(previousRCI: number, currentRCI: number): string {
  const change = currentRCI - previousRCI;
  if (change > 2) return 'improving';
  if (change < -2) return 'declining';
  return 'stable';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: IngestionPayload = await req.json();
    
    // Validate payload
    if (!payload.data) {
      return new Response(
        JSON.stringify({ error: 'Missing data field in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single or batch data
    const dataArray = Array.isArray(payload.data) ? payload.data : [payload.data];
    
    const results = [];
    const errors = [];

    for (const sensorData of dataArray) {
      try {
        // Validate required fields
        if (!sensorData.region_code || !sensorData.data_type || sensorData.value === undefined) {
          errors.push({
            data: sensorData,
            error: 'Missing required fields: region_code, data_type, or value'
          });
          continue;
        }

        // Normalize the incoming value
        const normalizedValue = normalizeValue(sensorData.value, sensorData.data_type);

        // Get current region data
        const { data: existingRegion, error: fetchError } = await supabase
          .from('rci_regions')
          .select('*')
          .eq('region_code', sensorData.region_code)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        let updatedRegion;

        if (existingRegion) {
          // Update existing region with new capacity data
          const capacityField = `${sensorData.data_type}_capacity`;
          const updatedCapacities = {
            land_capacity: existingRegion.land_capacity,
            ocean_capacity: existingRegion.ocean_capacity,
            human_capacity: existingRegion.human_capacity,
            circular_capacity: existingRegion.circular_capacity,
            [capacityField]: normalizedValue,
          };

          // Calculate new RCI
          const newRCI = calculateRCI(
            updatedCapacities.land_capacity,
            updatedCapacities.ocean_capacity,
            updatedCapacities.human_capacity,
            updatedCapacities.circular_capacity
          );

          // Determine trend
          const trend = determineTrend(existingRegion.rci_score, newRCI);

          const { data: updated, error: updateError } = await supabase
            .from('rci_regions')
            .update({
              ...updatedCapacities,
              rci_score: newRCI,
              rci_trend: trend,
              last_updated: new Date().toISOString(),
            })
            .eq('region_code', sensorData.region_code)
            .select()
            .single();

          if (updateError) throw updateError;
          updatedRegion = updated;

        } else {
          // Create new region
          const initialCapacities = {
            land_capacity: sensorData.data_type === 'land' ? normalizedValue : 50,
            ocean_capacity: sensorData.data_type === 'ocean' ? normalizedValue : 50,
            human_capacity: sensorData.data_type === 'health' ? normalizedValue : 50,
            circular_capacity: sensorData.data_type === 'circular' ? normalizedValue : 50,
          };

          const initialRCI = calculateRCI(
            initialCapacities.land_capacity,
            initialCapacities.ocean_capacity,
            initialCapacities.human_capacity,
            initialCapacities.circular_capacity
          );

          const { data: created, error: createError } = await supabase
            .from('rci_regions')
            .insert({
              region_code: sensorData.region_code,
              region_name: sensorData.region_code.toUpperCase(),
              ...initialCapacities,
              rci_score: initialRCI,
              rci_trend: 'stable',
            })
            .select()
            .single();

          if (createError) throw createError;
          updatedRegion = created;
        }

        // Log to analytics
        await supabase
          .from('sovereign_analytics')
          .insert({
            region_id: updatedRegion.id,
            metric_type: `${sensorData.source}_${sensorData.data_type}`,
            metric_value: normalizedValue,
            metric_date: sensorData.timestamp ? new Date(sensorData.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            metadata: {
              source: sensorData.source,
              raw_value: sensorData.value,
              normalized_value: normalizedValue,
              ...sensorData.metadata,
            },
          });

        results.push({
          region_code: sensorData.region_code,
          data_type: sensorData.data_type,
          processed_value: normalizedValue,
          new_rci: updatedRegion.rci_score,
          trend: updatedRegion.rci_trend,
        });

      } catch (err) {
        errors.push({
          data: sensorData,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        status: errors.length > 0 && results.length === 0 ? 400 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('RCI Data Ingestion Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
