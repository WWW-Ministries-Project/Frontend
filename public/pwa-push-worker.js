(() => {
  const DEFAULT_TITLE = "New notification";
  const DEFAULT_BODY = "You have a new notification.";
  const DEFAULT_URL = "/home/notifications";
  const DEFAULT_ICON = "/pwa/icon-192.png";
  const DEFAULT_BADGE = "/pwa/icon-maskable-192.png";
  const DEFAULT_TAG_PREFIX = "wwm-notification";

  const toRecord = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value;
  };

  const toNonEmptyString = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  };

  const getValueFromRecord = (record, keys) => {
    if (!record) return null;

    for (const key of keys) {
      const value = toNonEmptyString(record[key]);
      if (value) return value;
    }

    return null;
  };

  const isExternalUrl = (value) => /^https?:\/\//i.test(String(value || ""));

  const resolveUrl = (value) => {
    const normalized = toNonEmptyString(value);
    if (!normalized) return DEFAULT_URL;
    if (isExternalUrl(normalized)) return normalized;

    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  const parsePushPayload = (event) => {
    if (!event.data) return null;

    try {
      return event.data.json();
    } catch {
      try {
        return JSON.parse(event.data.text());
      } catch {
        return null;
      }
    }
  };

  const normalizePushPayload = (payload) => {
    const record = toRecord(payload) || {};
    const notificationRecord = toRecord(record.notification) || {};
    const dataRecord = toRecord(record.data) || {};

    const title =
      getValueFromRecord(notificationRecord, ["title", "heading"]) ||
      getValueFromRecord(record, ["title", "heading"]) ||
      DEFAULT_TITLE;

    const body =
      getValueFromRecord(notificationRecord, ["body", "message", "content"]) ||
      getValueFromRecord(record, ["body", "message", "content"]) ||
      getValueFromRecord(dataRecord, ["body", "message", "content"]) ||
      DEFAULT_BODY;

    const actionUrl =
      getValueFromRecord(notificationRecord, ["actionUrl", "action_url", "url", "link"]) ||
      getValueFromRecord(record, ["actionUrl", "action_url", "url", "link"]) ||
      getValueFromRecord(dataRecord, ["actionUrl", "action_url", "url", "link"]) ||
      DEFAULT_URL;

    const dedupeKey =
      getValueFromRecord(notificationRecord, ["id", "notificationId", "notification_id", "dedupeKey", "dedupe_key"]) ||
      getValueFromRecord(record, ["id", "notificationId", "notification_id", "dedupeKey", "dedupe_key"]) ||
      getValueFromRecord(dataRecord, ["id", "notificationId", "notification_id", "dedupeKey", "dedupe_key"]);

    const icon =
      getValueFromRecord(notificationRecord, ["icon", "image"]) ||
      getValueFromRecord(record, ["icon", "image"]) ||
      DEFAULT_ICON;

    const badge =
      getValueFromRecord(notificationRecord, ["badge"]) ||
      getValueFromRecord(record, ["badge"]) ||
      DEFAULT_BADGE;

    const url = resolveUrl(actionUrl);
    const external = isExternalUrl(url);

    return {
      title,
      body,
      icon,
      badge,
      url,
      external,
      tag: dedupeKey ? `wwm:${dedupeKey}` : `${DEFAULT_TAG_PREFIX}:${Date.now()}`,
    };
  };

  self.addEventListener("push", (event) => {
    const rawPayload = parsePushPayload(event);
    const notification = normalizePushPayload(rawPayload);

    event.waitUntil(
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        renotify: true,
        silent: false,
        vibrate: [180, 120, 180],
        data: {
          url: notification.url,
          external: notification.external,
        },
      })
    );
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = resolveUrl(event.notification?.data?.url || DEFAULT_URL);
    const isExternal = Boolean(event.notification?.data?.external);

    event.waitUntil(
      (async () => {
        const windows = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        if (!isExternal) {
          const resolvedTarget = new URL(targetUrl, self.location.origin).toString();

          for (const client of windows) {
            const clientUrl = new URL(client.url, self.location.origin);
            const targetOrigin = new URL(resolvedTarget).origin;

            if (clientUrl.origin !== targetOrigin) continue;

            await client.focus();
            if ("navigate" in client) {
              await client.navigate(resolvedTarget);
            }
            return;
          }
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(targetUrl);
        }
      })()
    );
  });

  self.addEventListener("pushsubscriptionchange", (event) => {
    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((windows) => {
          windows.forEach((client) => {
            client.postMessage({ type: "pushsubscriptionchange" });
          });
        })
    );
  });
})();
