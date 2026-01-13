-- Create data sources table for sensors, satellites, and partner APIs
CREATE TABLE public.data_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('sensor', 'satellite', 'partner_api')),
    endpoint_url TEXT,
    api_key_name TEXT,
    region_id UUID REFERENCES public.rci_regions(id) ON DELETE SET NULL,
    data_type TEXT CHECK (data_type IN ('land', 'ocean', 'health', 'circular')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_interval_minutes INTEGER DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for steward alerts
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('threshold_alert', 'degradation_alert', 'verification_request', 'verification_approved', 'verification_rejected', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    region_id UUID REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification requests table for multi-signature approval
CREATE TABLE public.verification_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    credit_amount NUMERIC NOT NULL,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('land', 'ocean', 'health', 'circular')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    required_signatures INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    evidence_urls TEXT[],
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification signatures table
CREATE TABLE public.verification_signatures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL,
    signature_type TEXT NOT NULL CHECK (signature_type IN ('approve', 'reject')),
    comment TEXT,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(request_id, signer_id)
);

-- Create RCI history table for timeline visualization
CREATE TABLE public.rci_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    rci_score NUMERIC NOT NULL,
    land_capacity NUMERIC,
    ocean_capacity NUMERIC,
    human_capacity NUMERIC,
    circular_capacity NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rci_history ENABLE ROW LEVEL SECURITY;

-- Data sources policies (admin only for management)
CREATE POLICY "Admins can manage data sources" ON public.data_sources
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view data sources" ON public.data_sources
FOR SELECT USING (auth.role() = 'authenticated');

-- Notifications policies (users see their own)
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins and sovereigns can create notifications" ON public.notifications
FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sovereign'::app_role)
);

-- Verification requests policies
CREATE POLICY "Authenticated users can view verification requests" ON public.verification_requests
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sovereigns and admins can create verification requests" ON public.verification_requests
FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sovereign'::app_role)
);

CREATE POLICY "Admins can update verification requests" ON public.verification_requests
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Verification signatures policies
CREATE POLICY "Authenticated users can view signatures" ON public.verification_signatures
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sovereigns and admins can sign" ON public.verification_signatures
FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'sovereign'::app_role)
);

-- RCI history policies (public read)
CREATE POLICY "Anyone can view RCI history" ON public.rci_history
FOR SELECT USING (true);

CREATE POLICY "Admins can manage RCI history" ON public.rci_history
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to record RCI history on region update
CREATE OR REPLACE FUNCTION public.record_rci_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.rci_history (region_id, rci_score, land_capacity, ocean_capacity, human_capacity, circular_capacity)
    VALUES (NEW.id, NEW.rci_score, NEW.land_capacity, NEW.ocean_capacity, NEW.human_capacity, NEW.circular_capacity);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-record history
CREATE TRIGGER record_rci_history_trigger
AFTER UPDATE ON public.rci_regions
FOR EACH ROW
WHEN (OLD.rci_score IS DISTINCT FROM NEW.rci_score)
EXECUTE FUNCTION public.record_rci_history();

-- Create function to check RCI thresholds and create alerts
CREATE OR REPLACE FUNCTION public.check_rci_thresholds()
RETURNS TRIGGER AS $$
DECLARE
    threshold_low NUMERIC := 40;
    threshold_critical NUMERIC := 25;
    user_rec RECORD;
BEGIN
    -- Check for critical threshold
    IF NEW.rci_score < threshold_critical AND (OLD.rci_score >= threshold_critical OR OLD.rci_score IS NULL) THEN
        FOR user_rec IN SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sovereign') LOOP
            INSERT INTO public.notifications (user_id, type, title, message, region_id, severity)
            VALUES (
                user_rec.user_id,
                'threshold_alert',
                'Critical RCI Alert: ' || NEW.region_name,
                'RCI score has dropped to ' || ROUND(NEW.rci_score, 1) || '%, which is below the critical threshold of 25%.',
                NEW.id,
                'critical'
            );
        END LOOP;
    -- Check for warning threshold
    ELSIF NEW.rci_score < threshold_low AND (OLD.rci_score >= threshold_low OR OLD.rci_score IS NULL) THEN
        FOR user_rec IN SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sovereign') LOOP
            INSERT INTO public.notifications (user_id, type, title, message, region_id, severity)
            VALUES (
                user_rec.user_id,
                'threshold_alert',
                'RCI Warning: ' || NEW.region_name,
                'RCI score has dropped to ' || ROUND(NEW.rci_score, 1) || '%, which is below the warning threshold of 40%.',
                NEW.id,
                'warning'
            );
        END LOOP;
    END IF;
    
    -- Check for degradation (declining trend)
    IF NEW.rci_trend = 'declining' AND OLD.rci_trend != 'declining' THEN
        FOR user_rec IN SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sovereign') LOOP
            INSERT INTO public.notifications (user_id, type, title, message, region_id, severity)
            VALUES (
                user_rec.user_id,
                'degradation_alert',
                'Capacity Degradation: ' || NEW.region_name,
                'RCI trend has shifted to declining. Current score: ' || ROUND(NEW.rci_score, 1) || '%.',
                NEW.id,
                'warning'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for threshold alerts
CREATE TRIGGER check_rci_thresholds_trigger
AFTER UPDATE ON public.rci_regions
FOR EACH ROW
EXECUTE FUNCTION public.check_rci_thresholds();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;

-- Add indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_rci_history_region_id ON public.rci_history(region_id);
CREATE INDEX idx_rci_history_recorded_at ON public.rci_history(recorded_at DESC);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX idx_data_sources_status ON public.data_sources(status);