self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const windowClients = await self.clients.matchAll({ type: "window" });
        await self.registration.unregister();
        for (const client of windowClients) {
          try {
            client.navigate(client.url);
          } catch {
            // no-op
          }
        }
      } catch {
        // no-op
      }
    })(),
  );
});
