import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DataSource {
  id: string;
  name: string;
  source_type: string;
  endpoint_url: string | null;
  api_key_name: string | null;
  data_type: string | null;
  region_id: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
}

interface SyncResult {
  source_id: string;
  source_name: string;
  success: boolean;
  data_points?: number;
  error?: string;
}

// Simulate fetching data from external endpoints
async function fetchFromEndpoint(
  source: DataSource,
  apiKey?: string
): Promise<{ value: number; data_type: string; region_code: string }[]> {
  // In production, this would make actual HTTP requests
  // For now, we simulate different data sources

  const dataType = source.data_type || 'land';
  
  switch (source.source_type) {
    case 'sensor':
      // Simulate IoT sensor data with slight variations
      return [{
        value: 50 + Math.random() * 40, // 50-90 range
        data_type: dataType,
        region_code: 'GLOBAL',
      }];
      
    case 'satellite':
      // Simulate satellite imagery analysis results
      return [{
        value: 40 + Math.random() * 50, // 40-90 range
        data_type: dataType,
        region_code: 'GLOBAL',
      }];
      
    case 'partner_api':
      // Simulate partner API responses with multiple regions
      return [
        { value: 60 + Math.random() * 30, data_type: dataType, region_code: 'US' },
        { value: 55 + Math.random() * 35, data_type: dataType, region_code: 'EU' },
        { value: 45 + Math.random() * 40, data_type: dataType, region_code: 'ASIA' },
      ];
      
    default:
      return [{
        value: 50 + Math.random() * 30,
        data_type: dataType,
        region_code: 'GLOBAL',
      }];
  }
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

    // Parse request body for optional filters
    let sourceIds: string[] | undefined;
    try {
      const body = await req.json();
      sourceIds = body.source_ids;
    } catch {
      // No body or invalid JSON - sync all active sources
    }

    // Fetch active data sources
    let query = supabase
      .from('data_sources')
      .select('*')
      .eq('status', 'active');

    if (sourceIds && sourceIds.length > 0) {
      query = query.in('id', sourceIds);
    }

    const { data: dataSources, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch data sources: ${fetchError.message}`);
    }

    if (!dataSources || dataSources.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active data sources to sync',
          results: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SyncResult[] = [];

    for (const source of dataSources as DataSource[]) {
      try {
        // Get API key if specified
        let apiKey: string | undefined;
        if (source.api_key_name) {
          apiKey = Deno.env.get(source.api_key_name);
        }

        // Fetch data from the source
        const dataPoints = await fetchFromEndpoint(source, apiKey);

        // Process each data point through the RCI ingestion pipeline
        for (const point of dataPoints) {
          // Check if region exists, create if not
          const { data: existingRegion } = await supabase
            .from('rci_regions')
            .select('id')
            .eq('region_code', point.region_code)
            .single();

          if (!existingRegion) {
            // Create the region first
            await supabase
              .from('rci_regions')
              .insert({
                region_code: point.region_code,
                region_name: point.region_code,
                rci_score: 50,
                land_capacity: 50,
                ocean_capacity: 50,
                human_capacity: 50,
                circular_capacity: 50,
                rci_trend: 'stable',
              });
          }

          // Get current region data
          const { data: region, error: regionError } = await supabase
            .from('rci_regions')
            .select('*')
            .eq('region_code', point.region_code)
            .single();

          if (regionError) {
            console.error(`Error fetching region ${point.region_code}:`, regionError);
            continue;
          }

          // Update the appropriate capacity
          const capacityField = point.data_type === 'health' 
            ? 'human_capacity' 
            : `${point.data_type}_capacity`;

          const updatedCapacities = {
            land_capacity: region.land_capacity || 50,
            ocean_capacity: region.ocean_capacity || 50,
            human_capacity: region.human_capacity || 50,
            circular_capacity: region.circular_capacity || 50,
            [capacityField]: point.value,
          };

          // Calculate new RCI with weighted average
          const weights = { land: 0.3, ocean: 0.25, human: 0.25, circular: 0.2 };
          const newRCI = 
            updatedCapacities.land_capacity * weights.land +
            updatedCapacities.ocean_capacity * weights.ocean +
            updatedCapacities.human_capacity * weights.human +
            updatedCapacities.circular_capacity * weights.circular;

          // Determine trend
          const change = newRCI - region.rci_score;
          const trend = change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable';

          // Update region
          await supabase
            .from('rci_regions')
            .update({
              ...updatedCapacities,
              rci_score: newRCI,
              rci_trend: trend,
              last_updated: new Date().toISOString(),
            })
            .eq('region_code', point.region_code);

          // Log to analytics
          await supabase
            .from('sovereign_analytics')
            .insert({
              region_id: region.id,
              metric_type: `${source.source_type}_${point.data_type}`,
              metric_value: point.value,
              metric_date: new Date().toISOString().split('T')[0],
              metadata: {
                source_id: source.id,
                source_name: source.name,
                sync_timestamp: new Date().toISOString(),
              },
            });
        }

        // Update last_sync for the data source
        await supabase
          .from('data_sources')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', source.id);

        results.push({
          source_id: source.id,
          source_name: source.name,
          success: true,
          data_points: dataPoints.length,
        });

      } catch (err) {
        console.error(`Error syncing source ${source.name}:`, err);
        results.push({
          source_id: source.id,
          source_name: source.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalDataPoints = results
      .filter(r => r.success)
      .reduce((acc, r) => acc + (r.data_points || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        synced_sources: successCount,
        total_sources: dataSources.length,
        total_data_points: totalDataPoints,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync Data Sources Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
