const clearDevServiceWorkerState = async () => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  } catch (error) {
    console.warn("Unable to unregister service workers in development.", error);
  }

  if (!("caches" in window)) return;

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  } catch (error) {
    console.warn("Unable to clear caches in development.", error);
  }
};

const start = async () => {
  if (import.meta.env.DEV) {
    await clearDevServiceWorkerState();
  }

  await import("./main");
};

void start();
