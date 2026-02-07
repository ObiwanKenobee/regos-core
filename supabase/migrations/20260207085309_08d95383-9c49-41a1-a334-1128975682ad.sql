-- Create sovereign_bonds table for bond issuance tracking
CREATE TABLE public.sovereign_bonds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.rci_regions(id) ON DELETE CASCADE,
    bond_name TEXT NOT NULL,
    bond_type TEXT NOT NULL DEFAULT 'green', -- green, climate, sustainability, transition
    principal_amount NUMERIC NOT NULL,
    coupon_rate NUMERIC NOT NULL DEFAULT 0,
    maturity_date DATE NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, active, matured, cancelled
    rci_linked BOOLEAN NOT NULL DEFAULT true,
    rci_threshold NUMERIC DEFAULT 70, -- RCI must stay above this for full coupon
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bond_transactions table for tracking bond activities
CREATE TABLE public.bond_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bond_id UUID NOT NULL REFERENCES public.sovereign_bonds(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- issuance, coupon_payment, redemption, transfer
    amount NUMERIC NOT NULL,
    counterparty TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sovereign_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sovereign_bonds
CREATE POLICY "Authenticated users can view bonds"
ON public.sovereign_bonds
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Sovereigns and admins can create bonds"
ON public.sovereign_bonds
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sovereign'::app_role));

CREATE POLICY "Sovereigns and admins can update their bonds"
ON public.sovereign_bonds
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'sovereign'::app_role) AND created_by = auth.uid()));

-- RLS Policies for bond_transactions
CREATE POLICY "Authenticated users can view transactions"
ON public.bond_transactions
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and sovereigns can create transactions"
ON public.bond_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sovereign'::app_role));

-- Create updated_at trigger for sovereign_bonds
CREATE TRIGGER update_sovereign_bonds_updated_at
    BEFORE UPDATE ON public.sovereign_bonds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sovereign operations
ALTER PUBLICATION supabase_realtime ADD TABLE public.sovereign_bonds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bond_transactions;