const clearDevServiceWorkerState = async () => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  } catch {
    // Best-effort dev-only cleanup; ignore failures unregistering service workers.
  }

  if (!("caches" in window)) return;

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  } catch {
    // Best-effort dev-only cleanup; ignore failures clearing caches.
  }
};

const start = async () => {
  if (import.meta.env.DEV) {
    await clearDevServiceWorkerState();
  }

  await import("./main");
};

void start();
