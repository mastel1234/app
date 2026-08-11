import { useEffect, useRef } from 'react';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function showNotification(title, options = {}) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    // Prefer service worker notification (works on mobile even when tab is backgrounded)
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, { icon: '/icon-192.png', badge: '/icon-192.png', ...options }))
        .catch((err) => {
          console.warn('SW showNotification failed, falling back to Notification()', err);
          try {
            new Notification(title, { icon: '/icon-192.png', ...options });
          } catch (fallbackErr) {
            console.warn('Fallback Notification() failed', fallbackErr);
          }
        });
    } else {
      new Notification(title, { icon: '/icon-192.png', ...options });
    }
  } catch (err) {
    console.warn('showNotification failed', err);
  }
}

/**
 * Watches category spending and fires notifications when crossing 80% / 100%
 * of the monthly limit. Notifies only once per category-month-threshold.
 */
export function useBudgetNotifications(finance) {
  const { data, monthly, selectedMonth, markThresholdNotified } = finance;
  const lastCheck = useRef(null);

  useEffect(() => {
    if (!data.notificationsEnabled) return;
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;

    const notified = data.notifiedThresholds || {};

    monthly.byCategory.forEach((cat) => {
      if (cat.monthlyLimit <= 0) return;
      const key = `${selectedMonth}_${cat.id}`;
      const already = notified[key] || [];
      const pct = cat.percent;

      // 100% threshold
      if (pct >= 100 && !already.includes(100)) {
        showNotification(`⚠️ Límite excedido: ${cat.name}`, {
          body: `Has gastado el 100% del límite mensual en "${cat.name}".`,
          tag: `over-${cat.id}-${selectedMonth}`,
        });
        markThresholdNotified(selectedMonth, cat.id, 100);
        return;
      }

      // 80% threshold
      if (pct >= 80 && pct < 100 && !already.includes(80)) {
        showNotification(`⚡ Alerta 80%: ${cat.name}`, {
          body: `Ya usaste el ${Math.round(pct)}% de tu límite en "${cat.name}".`,
          tag: `warn-${cat.id}-${selectedMonth}`,
        });
        markThresholdNotified(selectedMonth, cat.id, 80);
      }
    });

    lastCheck.current = Date.now();
  }, [data.notificationsEnabled, data.notifiedThresholds, monthly.byCategory, selectedMonth, markThresholdNotified]);
}
