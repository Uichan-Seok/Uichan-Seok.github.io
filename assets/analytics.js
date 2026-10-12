(() => {
  'use strict';
  if (window.__academicAnalyticsInitialized) return;
  window.__academicAnalyticsInitialized = true;

  // Add the verified GA4 web-stream ID only after account and deployment approval.
  // A measurement ID is public configuration, never an API key or credential.
  const measurementId = 'G-F2C8614CVS';
  const productionHost = 'uichan-seok.github.io';
  const storageKey = 'academic-analytics-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const banner = document.getElementById('analytics-consent');
  const settings = document.getElementById('analytics-settings');
  const status = document.getElementById('analytics-status');
  let started = false;
  let consent = readConsent();

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && ['granted', 'denied'].includes(saved.choice) &&
          Number.isFinite(saved.time) && saved.time <= Date.now() &&
          Date.now() - saved.time < lifetime) return saved.choice;
    } catch (_) { /* Unavailable storage means no remembered permission. */ }
    return null;
  }

  function clearAnalyticsCookies() {
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', `; domain=${productionHost}`, `; domain=.${productionHost}`]) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
      }
    }
  }

  function startAnalytics() {
    if (started || consent !== 'granted' || !/^G-[A-Z0-9]+$/.test(measurementId) ||
        location.hostname !== productionHost || location.protocol !== 'https:') return;
    started = true;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', false);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      page_location: location.origin + location.pathname,
      page_referrer: '',
      page_title: 'Uichan Seok | Research Fellow',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: productionHost,
      cookie_expires: lifetime / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    const script = document.createElement('script');
    script.id = 'academic-ga4-tag';
    script.async = true;
    // Avoid sending the full document URL as the script request's referrer.
    script.referrerPolicy = 'no-referrer';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function choose(choice) {
    consent = choice;
    try { localStorage.setItem(storageKey, JSON.stringify({ choice, time: Date.now() })); }
    catch (_) { /* The choice applies to this page even without storage. */ }
    banner.hidden = true;
    status.textContent = choice === 'granted' ? 'Optional analytics allowed.' : 'Optional analytics declined.';
    if (choice === 'granted') startAnalytics();
    else {
      window[`ga-disable-${measurementId}`] = true;
      clearAnalyticsCookies();
      // Reload to remove all Google code and pending listeners. Do not send a
      // consent-update ping after withdrawal in this basic consent implementation.
      if (started) location.reload();
    }
    settings.focus();
  }

  document.getElementById('analytics-accept').addEventListener('click', () => choose('granted'));
  document.getElementById('analytics-decline').addEventListener('click', () => choose('denied'));
  settings.addEventListener('click', () => {
    banner.hidden = false;
    document.getElementById('analytics-decline').focus();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    consent = readConsent();
    // A withdrawal or expired choice in another tab stops this tab as well.
    if (started && consent !== 'granted') {
      window[`ga-disable-${measurementId}`] = true;
      clearAnalyticsCookies();
      location.reload();
    } else if (consent === 'granted') {
      banner.hidden = true;
      startAnalytics();
    } else banner.hidden = consent === 'denied';
  });
  // Expiry also applies to a tab left open beyond the consent period.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (started && readConsent() !== 'granted') {
      window[`ga-disable-${measurementId}`] = true;
      clearAnalyticsCookies();
      location.reload();
    }
  });
  banner.hidden = consent !== null;
  if (consent !== 'granted') clearAnalyticsCookies();
  startAnalytics();
})();
