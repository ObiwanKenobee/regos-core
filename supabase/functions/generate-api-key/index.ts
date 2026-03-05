import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'rci_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Unauthorized');

    const { name, organizationId, scopes, rateLimit } = await req.json();
    if (!name || !organizationId) throw new Error('Name and organizationId required');

    // Verify user is admin/owner of org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Generate key
    const fullKey = generateKey();
    const keyPrefix = fullKey.substring(0, 12) + '...';
    const keyHash = await hashKey(fullKey);

    // Store key
    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        created_by: userData.user.id,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: scopes || ['read'],
        rate_limit: rateLimit || 1000,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Return the full key only once
    return new Response(
      JSON.stringify({ key: fullKey, id: apiKey.id, prefix: keyPrefix }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
