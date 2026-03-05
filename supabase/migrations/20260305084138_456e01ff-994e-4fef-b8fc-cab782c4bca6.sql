
-- Organizations table for multi-tenancy
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  plan text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  max_members integer NOT NULL DEFAULT 5,
  max_api_keys integer NOT NULL DEFAULT 3,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization members
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_email text,
  invited_at timestamptz,
  accepted_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- API keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] DEFAULT ARRAY['read']::text[],
  rate_limit integer NOT NULL DEFAULT 1000,
  last_used_at timestamptz,
  usage_count bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding progress
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_step integer NOT NULL DEFAULT 0,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  role_selected text,
  org_created boolean NOT NULL DEFAULT false,
  tour_completed boolean NOT NULL DEFAULT false,
  first_action_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Organizations: members can view, creators/admins can manage
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND status = 'active')
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Org admins can update organizations" ON public.organizations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
    OR created_by = auth.uid()
  );

-- Organization members
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.status = 'active')
  );

CREATE POLICY "Org admins can manage members" ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'owner'))
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_members.organization_id AND o.created_by = auth.uid())
  );

CREATE POLICY "Org admins can update members" ON public.organization_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'owner'))
  );

CREATE POLICY "Org admins can remove members" ON public.organization_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'owner'))
    OR user_id = auth.uid()
  );

-- API keys
CREATE POLICY "Org members can view API keys" ON public.api_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = api_keys.organization_id AND user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Org admins can manage API keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = api_keys.organization_id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "Org admins can update API keys" ON public.api_keys
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = api_keys.organization_id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "Org admins can delete API keys" ON public.api_keys
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = api_keys.organization_id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Onboarding progress
CREATE POLICY "Users can manage their own onboarding" ON public.onboarding_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-add creator as owner member
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, status, accepted_at)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
