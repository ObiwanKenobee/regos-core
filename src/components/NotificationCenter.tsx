 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   Bell,
   AlertTriangle,
   AlertCircle,
   Info,
   CheckCircle2,
   XCircle,
   TrendingDown,
   Shield,
   X,
 } from "lucide-react";
 import { toast } from "@/hooks/use-toast";
 import { formatDistanceToNow } from "date-fns";
 
 interface Notification {
   id: string;
   user_id: string;
   type: string;
   title: string;
   message: string;
   region_id: string | null;
   severity: "info" | "warning" | "critical";
   is_read: boolean;
   metadata: Record<string, unknown>;
   created_at: string;
 }
 
 const severityConfig = {
   info: {
     icon: Info,
     color: "text-blue-400",
     bg: "bg-blue-400/10",
     border: "border-blue-400/30",
   },
   warning: {
     icon: AlertTriangle,
     color: "text-amber-400",
     bg: "bg-amber-400/10",
     border: "border-amber-400/30",
   },
   critical: {
     icon: AlertCircle,
     color: "text-destructive",
     bg: "bg-destructive/10",
     border: "border-destructive/30",
   },
 };
 
 const typeIcons: Record<string, React.ElementType> = {
   threshold_alert: AlertCircle,
   degradation_alert: TrendingDown,
   verification_request: Shield,
   verification_approved: CheckCircle2,
   verification_rejected: XCircle,
   system: Info,
 };
 
 const NotificationCenter = () => {
   const { user } = useAuth();
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
 
   const unreadCount = notifications.filter((n) => !n.is_read).length;
 
   useEffect(() => {
     if (user) {
       fetchNotifications();
       setupRealtimeSubscription();
     }
   }, [user]);
 
   const fetchNotifications = async () => {
     if (!user) return;
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(50);
 
       if (error) throw error;
       setNotifications((data || []) as Notification[]);
     } catch (error: any) {
       console.error("Error fetching notifications:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const setupRealtimeSubscription = () => {
     if (!user) return;
 
     const channel = supabase
       .channel("notifications-realtime")
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "notifications",
           filter: `user_id=eq.${user.id}`,
         },
         (payload) => {
           const newNotification = payload.new as Notification;
           setNotifications((prev) => [newNotification, ...prev]);
           
           // Show toast for new notifications
           toast({
             title: newNotification.title,
             description: newNotification.message,
             variant: newNotification.severity === "critical" ? "destructive" : "default",
           });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   };
 
   const markAsRead = async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) =>
         prev.map((n) =>
           n.id === notificationId ? { ...n, is_read: true } : n
         )
       );
     } catch (error: any) {
       console.error("Error marking notification as read:", error);
     }
   };
 
   const markAllAsRead = async () => {
     if (!user) return;
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("user_id", user.id)
         .eq("is_read", false);
 
       if (error) throw error;
 
       setNotifications((prev) =>
         prev.map((n) => ({ ...n, is_read: true }))
       );
 
       toast({
         title: "All notifications marked as read",
       });
     } catch (error: any) {
       console.error("Error marking all as read:", error);
     }
   };
 
   if (!user) return null;
 
   return (
     <Popover open={isOpen} onOpenChange={setIsOpen}>
       <PopoverTrigger asChild>
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="w-5 h-5" />
           {unreadCount > 0 && (
             <motion.span
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center"
             >
               {unreadCount > 9 ? "9+" : unreadCount}
             </motion.span>
           )}
         </Button>
       </PopoverTrigger>
       <PopoverContent align="end" className="w-[380px] p-0 glass-strong">
         <div className="flex items-center justify-between p-4 border-b border-border/50">
           <h3 className="font-display font-semibold text-foreground">
             Notifications
           </h3>
           {unreadCount > 0 && (
             <Button variant="ghost" size="sm" onClick={markAllAsRead}>
               Mark all read
             </Button>
           )}
         </div>
 
         <ScrollArea className="h-[400px]">
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
           ) : notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
               <Bell className="w-12 h-12 mb-4 opacity-50" />
               <p>No notifications yet</p>
             </div>
           ) : (
             <AnimatePresence>
               {notifications.map((notification, index) => {
                 const config = severityConfig[notification.severity];
                 const TypeIcon = typeIcons[notification.type] || Info;
 
                 return (
                   <motion.div
                     key={notification.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     transition={{ delay: index * 0.05 }}
                     className={`p-4 border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer ${
                       !notification.is_read ? "bg-secondary/20" : ""
                     }`}
                     onClick={() => markAsRead(notification.id)}
                   >
                     <div className="flex gap-3">
                       <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                         <TypeIcon className={`w-4 h-4 ${config.color}`} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-2">
                           <h4 className={`font-medium text-sm ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                             {notification.title}
                           </h4>
                           {!notification.is_read && (
                             <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                           )}
                         </div>
                         <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                           {notification.message}
                         </p>
                         <p className="text-xs text-muted-foreground/70 mt-2">
                           {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                         </p>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           )}
         </ScrollArea>
       </PopoverContent>
     </Popover>
   );
 };
 
 export default NotificationCenter;