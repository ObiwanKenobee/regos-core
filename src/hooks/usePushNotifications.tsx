 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 import { toast } from "./use-toast";
 
 interface PushNotificationState {
   isSupported: boolean;
   isSubscribed: boolean;
   permission: NotificationPermission;
   isLoading: boolean;
 }
 
 export const usePushNotifications = () => {
   const { user } = useAuth();
   const [state, setState] = useState<PushNotificationState>({
     isSupported: false,
     isSubscribed: false,
     permission: "default",
     isLoading: false,
   });
 
   useEffect(() => {
     const isSupported = "serviceWorker" in navigator && "PushManager" in window;
     const permission = isSupported ? Notification.permission : "default";
     
     setState(prev => ({
       ...prev,
       isSupported,
       permission,
     }));
 
     if (isSupported) {
       checkSubscription();
     }
   }, [user]);
 
   const checkSubscription = async () => {
     if (!user) return;
     
     try {
       const registration = await navigator.serviceWorker.ready;
       const subscription = await registration.pushManager.getSubscription();
       
       setState(prev => ({
         ...prev,
         isSubscribed: !!subscription,
       }));
     } catch (error) {
       console.error("Error checking push subscription:", error);
     }
   };
 
   const registerServiceWorker = async () => {
     if (!("serviceWorker" in navigator)) {
       throw new Error("Service workers not supported");
     }
     
     const registration = await navigator.serviceWorker.register("/sw.js");
     await navigator.serviceWorker.ready;
     return registration;
   };
 
   const subscribe = useCallback(async () => {
     if (!user) {
       toast({
         title: "Please sign in",
         description: "You need to be signed in to enable push notifications.",
         variant: "destructive",
       });
       return;
     }
 
     setState(prev => ({ ...prev, isLoading: true }));
 
     try {
       // Request permission
       const permission = await Notification.requestPermission();
       setState(prev => ({ ...prev, permission }));
 
       if (permission !== "granted") {
         toast({
           title: "Permission Denied",
           description: "Please enable notifications in your browser settings.",
           variant: "destructive",
         });
         return;
       }
 
       // Register service worker
       const registration = await registerServiceWorker();
 
       // Subscribe to push
       // Note: In production, you'd use VAPID keys from environment
       const subscription = await registration.pushManager.subscribe({
         userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
           // This is a placeholder - in production, use real VAPID public key
           "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ) as BufferSource,
       });
 
       // Save subscription to database
       const { error } = await supabase
         .from("push_subscriptions")
         .upsert({
           user_id: user.id,
           endpoint: subscription.endpoint,
           keys: {
             p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
             auth: arrayBufferToBase64(subscription.getKey("auth")),
           },
         }, {
           onConflict: "user_id,endpoint",
         });
 
       if (error) throw error;
 
       setState(prev => ({ ...prev, isSubscribed: true }));
       
       toast({
         title: "Push Notifications Enabled",
         description: "You'll receive critical alerts even when the app is closed.",
       });
     } catch (error: any) {
       console.error("Error subscribing to push:", error);
       toast({
         title: "Failed to enable notifications",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setState(prev => ({ ...prev, isLoading: false }));
     }
   }, [user]);
 
   const unsubscribe = useCallback(async () => {
     if (!user) return;
 
     setState(prev => ({ ...prev, isLoading: true }));
 
     try {
       const registration = await navigator.serviceWorker.ready;
       const subscription = await registration.pushManager.getSubscription();
 
       if (subscription) {
         await subscription.unsubscribe();
 
         // Remove from database
         await supabase
           .from("push_subscriptions")
           .delete()
           .eq("user_id", user.id)
           .eq("endpoint", subscription.endpoint);
       }
 
       setState(prev => ({ ...prev, isSubscribed: false }));
       
       toast({
         title: "Push Notifications Disabled",
         description: "You won't receive push notifications anymore.",
       });
     } catch (error: any) {
       console.error("Error unsubscribing:", error);
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setState(prev => ({ ...prev, isLoading: false }));
     }
   }, [user]);
 
   return {
     ...state,
     subscribe,
     unsubscribe,
   };
 };
 
 // Helper functions
 function urlBase64ToUint8Array(base64String: string): Uint8Array {
   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
   const base64 = (base64String + padding)
     .replace(/-/g, "+")
     .replace(/_/g, "/");
 
   const rawData = window.atob(base64);
   const outputArray = new Uint8Array(rawData.length);
 
   for (let i = 0; i < rawData.length; ++i) {
     outputArray[i] = rawData.charCodeAt(i);
   }
   return outputArray;
 }
 
 function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
   if (!buffer) return "";
   const bytes = new Uint8Array(buffer);
   let binary = "";
   for (let i = 0; i < bytes.byteLength; i++) {
     binary += String.fromCharCode(bytes[i]);
   }
   return window.btoa(binary);
 }