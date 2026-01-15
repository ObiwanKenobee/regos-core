-- Create user_region_assignments table for sovereign region assignments
CREATE TABLE public.user_region_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    region_id UUID NOT NULL REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID,
    UNIQUE (user_id, region_id)
);

-- Enable RLS
ALTER TABLE public.user_region_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assignments" 
ON public.user_region_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assignments" 
ON public.user_region_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create impact_tokens table for minted credits
CREATE TABLE public.impact_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    verification_request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL, -- land, ocean, health, circular
    amount NUMERIC NOT NULL,
    minted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    minted_by UUID NOT NULL,
    transaction_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.impact_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for impact_tokens
CREATE POLICY "Authenticated users can view tokens" 
ON public.impact_tokens 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins and sovereigns can mint tokens" 
ON public.impact_tokens 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sovereign'::app_role));

-- Add sync schedule fields to data_sources
ALTER TABLE public.data_sources 
ADD COLUMN IF NOT EXISTS cron_schedule TEXT DEFAULT '0 */1 * * *',
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;

-- Enable realtime for impact_tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_region_assignments;