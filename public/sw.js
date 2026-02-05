 // Service Worker for Push Notifications
 const CACHE_NAME = 'atlas-sanctum-v1';
 
 self.addEventListener('install', (event) => {
   console.log('Service Worker installed');
   self.skipWaiting();
 });
 
 self.addEventListener('activate', (event) => {
   console.log('Service Worker activated');
   event.waitUntil(clients.claim());
 });
 
 self.addEventListener('push', (event) => {
   console.log('Push notification received:', event);
   
   let data = {
     title: 'Atlas Sanctum Alert',
     body: 'You have a new notification',
     icon: '/favicon.ico',
     badge: '/favicon.ico',
     tag: 'atlas-notification',
     data: { url: '/' }
   };
 
   if (event.data) {
     try {
       const payload = event.data.json();
       data = {
         title: payload.title || data.title,
         body: payload.body || data.body,
         icon: payload.icon || data.icon,
         badge: payload.badge || data.badge,
         tag: payload.tag || data.tag,
         data: payload.data || data.data
       };
     } catch (e) {
       console.error('Error parsing push data:', e);
     }
   }
 
   const options = {
     body: data.body,
     icon: data.icon,
     badge: data.badge,
     tag: data.tag,
     data: data.data,
     vibrate: [100, 50, 100],
     actions: [
       { action: 'view', title: 'View' },
       { action: 'dismiss', title: 'Dismiss' }
     ],
     requireInteraction: data.tag === 'critical-alert'
   };
 
   event.waitUntil(
     self.registration.showNotification(data.title, options)
   );
 });
 
 self.addEventListener('notificationclick', (event) => {
   console.log('Notification clicked:', event);
   event.notification.close();
 
   if (event.action === 'dismiss') {
     return;
   }
 
   const urlToOpen = event.notification.data?.url || '/';
 
   event.waitUntil(
     clients.matchAll({ type: 'window', includeUncontrolled: true })
       .then((clientList) => {
         for (const client of clientList) {
           if (client.url.includes(self.location.origin) && 'focus' in client) {
             client.navigate(urlToOpen);
             return client.focus();
           }
         }
         if (clients.openWindow) {
           return clients.openWindow(urlToOpen);
         }
       })
   );
 });