-- Create database function to generate notifications on significant RCI changes
CREATE OR REPLACE FUNCTION notify_rci_change()
RETURNS TRIGGER AS $$
DECLARE
  score_diff NUMERIC;
  notification_type TEXT;
  notification_severity TEXT;
  notification_title TEXT;
  notification_message TEXT;
  user_record RECORD;
BEGIN
  -- Calculate score difference
  score_diff := NEW.rci_score - COALESCE(OLD.rci_score, 0);
  
  -- Only create notifications for significant changes (>= 2%)
  IF ABS(score_diff) >= 2 THEN
    -- Determine notification type and severity
    IF NEW.rci_score < 25 THEN
      notification_type := 'threshold_alert';
      notification_severity := 'critical';
      notification_title := 'Critical RCI Alert: ' || NEW.region_name;
      notification_message := 'RCI score has dropped to ' || ROUND(NEW.rci_score, 1) || '%. Immediate attention required.';
    ELSIF NEW.rci_score < 40 THEN
      notification_type := 'threshold_alert';
      notification_severity := 'warning';
      notification_title := 'Warning: ' || NEW.region_name || ' RCI Declining';
      notification_message := 'RCI score is at ' || ROUND(NEW.rci_score, 1) || '%, below the warning threshold of 40%.';
    ELSIF score_diff < 0 THEN
      notification_type := 'degradation_alert';
      notification_severity := 'info';
      notification_title := 'RCI Change: ' || NEW.region_name;
      notification_message := 'RCI score decreased by ' || ROUND(ABS(score_diff), 1) || '% to ' || ROUND(NEW.rci_score, 1) || '%.';
    ELSE
      notification_type := 'system';
      notification_severity := 'info';
      notification_title := 'RCI Improvement: ' || NEW.region_name;
      notification_message := 'RCI score increased by ' || ROUND(score_diff, 1) || '% to ' || ROUND(NEW.rci_score, 1) || '%.';
    END IF;
    
    -- Insert notification for all users assigned to this region
    FOR user_record IN 
      SELECT DISTINCT user_id FROM user_region_assignments WHERE region_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, region_id, severity, metadata)
      VALUES (
        user_record.user_id,
        notification_type,
        notification_title,
        notification_message,
        NEW.id,
        notification_severity,
        jsonb_build_object(
          'previous_score', COALESCE(OLD.rci_score, 0),
          'new_score', NEW.rci_score,
          'change', score_diff,
          'region_code', NEW.region_code
        )
      );
    END LOOP;
    
    -- Also notify all admin users
    FOR user_record IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, region_id, severity, metadata)
      VALUES (
        user_record.user_id,
        notification_type,
        notification_title,
        notification_message,
        NEW.id,
        notification_severity,
        jsonb_build_object(
          'previous_score', COALESCE(OLD.rci_score, 0),
          'new_score', NEW.rci_score,
          'change', score_diff,
          'region_code', NEW.region_code
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for RCI changes
DROP TRIGGER IF EXISTS on_rci_score_change ON rci_regions;
CREATE TRIGGER on_rci_score_change
  AFTER UPDATE OF rci_score ON rci_regions
  FOR EACH ROW
  EXECUTE FUNCTION notify_rci_change();

-- Add verification token column to newsletter_subscriptions
ALTER TABLE newsletter_subscriptions 
ADD COLUMN IF NOT EXISTS verification_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add push subscription table for Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);