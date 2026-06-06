self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Incoming request";
  const options = {
    body: payload.body || "Tap to open YoPartner dashboard",
    tag: payload.tag || (payload.requestId ? `yopartner-request-${payload.requestId}` : "yopartner-request"),
    renotify: false,
    requireInteraction: true,
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    data: {
      url: payload.url || "/partner/dashboard",
      requestId: payload.requestId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/partner/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) continue;
        if (clientUrl.pathname === "/partner/dashboard" && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) continue;
        if ("navigate" in client && "focus" in client) {
          return client.navigate(targetUrl).then((navigatedClient) => {
            return navigatedClient ? navigatedClient.focus() : client.focus();
          });
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
