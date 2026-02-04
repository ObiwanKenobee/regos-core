import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  region_id: string | null;
  severity: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

interface RCIChange {
  region_name: string;
  rci_score: number;
  previous_score: number;
  change: number;
  timestamp: string;
}

interface RealtimeState {
  rciChanges: RCIChange[];
  notifications: Notification[];
  unreadCount: number;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RealtimeState>({
    rciChanges: [],
    notifications: [],
    unreadCount: 0,
  });

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const unread = data.filter(n => !n.is_read).length;
      setState(prev => ({
        ...prev,
        notifications: data as Notification[],
        unreadCount: unread,
      }));
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to RCI region changes
    const rciChannel = supabase
      .channel("rci-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rci_regions",
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Show toast for significant RCI changes
          const scoreDiff = newData.rci_score - (oldData.rci_score || 0);
          if (Math.abs(scoreDiff) >= 2) {
            toast({
              title: `RCI Update: ${newData.region_name}`,
              description: `Score changed by ${scoreDiff > 0 ? "+" : ""}${scoreDiff.toFixed(1)}%`,
              variant: scoreDiff < 0 ? "destructive" : "default",
            });

            setState(prev => ({
              ...prev,
              rciChanges: [
                {
                  region_name: newData.region_name,
                  rci_score: newData.rci_score,
                  previous_score: oldData.rci_score,
                  change: scoreDiff,
                  timestamp: new Date().toISOString(),
                },
                ...prev.rciChanges.slice(0, 19),
              ],
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to verification request updates
    const verificationChannel = supabase
      .channel("verification-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_requests",
        },
        (payload) => {
          const data = payload.new as any;

          if (payload.eventType === "INSERT") {
            toast({
              title: "New Verification Request",
              description: `${data.credit_type} credit request submitted`,
            });
          } else if (payload.eventType === "UPDATE" && data.status === "approved") {
            toast({
              title: "Verification Approved",
              description: `${data.credit_amount} ${data.credit_type} credits verified`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to user notifications
    const notificationChannel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as Notification;

          toast({
            title: data.title,
            description: data.message,
            variant: data.severity === "critical" ? "destructive" : "default",
          });

          setState(prev => ({
            ...prev,
            notifications: [data, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rciChannel);
      supabase.removeChannel(verificationChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
