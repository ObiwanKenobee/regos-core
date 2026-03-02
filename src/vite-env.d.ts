/// <reference types="vite/client" />

interface ServiceWorkerRegistration {
  pushManager: PushManager;
}

interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
}

interface PushSubscription {
  endpoint: string;
  toJSON(): PushSubscriptionJSON;
  unsubscribe(): Promise<boolean>;
}

interface PushSubscriptionJSON {
  endpoint?: string;
  keys?: Record<string, string>;
}

interface PushSubscriptionOptionsInit {
  userVisibleOnly?: boolean;
  applicationServerKey?: BufferSource | string | null;
}
