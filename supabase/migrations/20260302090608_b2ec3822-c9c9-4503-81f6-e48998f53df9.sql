
-- Create function to notify on bond status changes
CREATE OR REPLACE FUNCTION public.notify_bond_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Only fire if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Create in-app notification for the bond creator
    INSERT INTO public.notifications (user_id, type, title, message, region_id, severity, metadata)
    VALUES (
      NEW.created_by,
      'bond_update',
      'Bond "' || NEW.bond_name || '" — ' || NEW.status,
      'Your sovereign bond status changed from ' || OLD.status || ' to ' || NEW.status || '.',
      NEW.region_id,
      CASE WHEN NEW.status = 'rejected' THEN 'warning' ELSE 'info' END,
      jsonb_build_object(
        'bond_id', NEW.id,
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'bond_type', NEW.bond_type,
        'principal_amount', NEW.principal_amount
      )
    );

    -- Also notify admins
    FOR user_rec IN SELECT user_id FROM user_roles WHERE role = 'admin' AND user_id != NEW.created_by LOOP
      INSERT INTO public.notifications (user_id, type, title, message, region_id, severity, metadata)
      VALUES (
        user_rec.user_id,
        'bond_update',
        'Bond "' || NEW.bond_name || '" — ' || NEW.status,
        'Sovereign bond status changed from ' || OLD.status || ' to ' || NEW.status || '.',
        NEW.region_id,
        'info',
        jsonb_build_object('bond_id', NEW.id, 'previous_status', OLD.status, 'new_status', NEW.status)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for bond status changes
CREATE TRIGGER on_bond_status_change
  AFTER UPDATE ON public.sovereign_bonds
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_bond_status_change();

-- Create function to notify on verification request status changes
CREATE OR REPLACE FUNCTION public.notify_verification_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Notify the creator
    INSERT INTO public.notifications (user_id, type, title, message, region_id, severity, metadata)
    VALUES (
      NEW.created_by,
      'verification_update',
      CASE WHEN NEW.status = 'approved' THEN '✅ Verification Approved' ELSE '❌ Verification Rejected' END,
      'Your ' || NEW.credit_type || ' verification request has been ' || NEW.status || '.',
      NEW.region_id,
      CASE WHEN NEW.status = 'rejected' THEN 'warning' ELSE 'info' END,
      jsonb_build_object(
        'request_id', NEW.id,
        'credit_type', NEW.credit_type,
        'credit_amount', NEW.credit_amount,
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for verification status changes
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_verification_status_change();
