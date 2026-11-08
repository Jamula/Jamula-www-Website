const HOSTS = new Map([
  ["jamula.com", "G-90MTZQ2EXX"],
  ["www.jamula.com", "G-90MTZQ2EXX"],
  ["jamula.net", "G-7JW27J2XSW"],
  ["www.jamula.net", "G-7JW27J2XSW"],
]);
const STORAGE_KEY = "jamula.analytics-consent";
const VERSION = 1;
const PURPOSE = "pageviews-contact-intent";
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function initializeAnalytics(win = window, doc = document) {
  if (win.__jamulaAnalyticsInitialized) return;
  win.__jamulaAnalyticsInitialized = true;

  const panel = doc.querySelector("#analytics-consent");
  const status = doc.querySelector("#analytics-status");
  const accept = doc.querySelector("#analytics-accept");
  const reject = doc.querySelector("#analytics-reject");
  const preferences = doc.querySelector("#analytics-preferences");
  const withdraw = doc.querySelector("#analytics-withdraw");
  const releaseVersion = panel.getAttribute("data-release-version");
  const id =
    win.location.protocol === "https:" && !win.location.port
      ? HOSTS.get(win.location.hostname)
      : undefined;
  let active = false;
  let script;
  let timer;
  let storageFailed = false;
  const gpc = () => win.navigator.globalPrivacyControl === true;
  const report = (message) => {
    status.textContent = message;
  };
  const showPanel = (visible) => {
    panel.hidden = !visible;
    preferences.setAttribute("aria-expanded", String(visible));
  };

  function readChoice() {
    let raw;
    try {
      raw = win.localStorage.getItem(STORAGE_KEY);
      storageFailed = false;
    } catch (error) {
      storageFailed = true;
      win.console.warn("Analytics consent storage is unavailable.", error);
      report("Analytics is off because your privacy choice could not be read.");
      return null;
    }
    if (!raw) return null;
    let choice;
    try {
      choice = JSON.parse(raw);
    } catch {
      return null;
    }
    const age = Date.now() - choice?.time;
    return choice?.version === VERSION &&
      choice.purpose === PURPOSE &&
      choice.host === win.location.hostname &&
      typeof choice.granted === "boolean" &&
      Number.isFinite(choice.time) &&
      age >= 0 &&
      age < MAX_AGE
      ? choice
      : null;
  }

  function clearCookies() {
    if (!id) return;
    // Only the two host-only, root-path cookies created by this integration.
    for (const name of ["jamula_ga", `jamula_ga_${id.slice(2)}`]) {
      doc.cookie = `${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
    }
  }

  function stop() {
    const wasActive = active;
    active = false;
    win.clearTimeout(timer);
    if (id) win[`ga-disable-${id}`] = true;
    if (win.dataLayer) win.dataLayer.length = 0;
    if (win.gtag) win.gtag = () => {};
    script?.remove();
    clearCookies();
    return wasActive;
  }

  function permitted() {
    if (!active) return false;
    if (!gpc() && readChoice()?.granted === true) return true;
    stop();
    showPanel(true);
    report("Analytics is off. Your permission expired, changed, or is unavailable.");
    return false;
  }

  function scheduleExpiry() {
    const choice = readChoice();
    if (!permitted() || !choice) return;
    timer = win.setTimeout(
      () => {
        if (permitted()) scheduleExpiry();
      },
      Math.min(choice.time + MAX_AGE - Date.now(), 2147483647)
    );
  }

  function start() {
    if (!id || active || gpc() || readChoice()?.granted !== true) return;
    if (script) {
      win.location.reload();
      return;
    }
    active = true;
    win[`ga-disable-${id}`] = false;
    win.dataLayer = [];
    win.gtag = function () {
      win.dataLayer.push(arguments);
    };
    const page =
      win.location.pathname === "/"
        ? { path: "/", title: "Jamula home" }
        : ["/privacy", "/privacy/"].includes(win.location.pathname)
          ? { path: "/privacy/", title: "Website analytics privacy" }
          : { path: "/404", title: "Page not found" };
    win.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    win.gtag("js", new Date());
    win.gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${win.location.origin}${page.path}`,
      page_title: page.title,
      page_referrer: "",
      ignore_referrer: true,
      cookie_prefix: "jamula",
      cookie_domain: "none",
      cookie_path: "/",
      cookie_expires: 0,
      cookie_update: false,
      cookie_flags: "Secure;SameSite=Lax",
      linker: { domains: [], accept_incoming: false, decorate_forms: false },
    });
    win.gtag("event", "page_view", {
      send_to: id,
      ...(releaseVersion ? { release_version: releaseVersion } : {}),
    });
    script = doc.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.onerror = () => {
      stop();
      report("Analytics could not load and is off. Your choice remains saved.");
    };
    doc.head.append(script);
    scheduleExpiry();
    report("Optional analytics is on for this hostname. You can withdraw at any time.");
  }

  function save(granted) {
    try {
      win.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: VERSION,
          purpose: PURPOSE,
          host: win.location.hostname,
          granted,
          time: Date.now(),
        })
      );
      if (readChoice()?.granted !== granted) throw new Error("Choice was not saved.");
      return true;
    } catch (error) {
      win.console.warn("Analytics consent could not be saved.", error);
      report("Analytics is off. Your choice could not be saved; clear site data before returning.");
      return false;
    }
  }

  function deny() {
    const wasActive = stop();
    let saved = save(false);
    if (!saved) {
      try {
        // Quota-limited storage may still allow the old grant to be removed.
        win.localStorage.removeItem(STORAGE_KEY);
        if (win.localStorage.getItem(STORAGE_KEY) !== null) {
          throw new Error("Prior consent was not removed.");
        }
        saved = true;
      } catch (error) {
        win.console.warn("Analytics consent could not be removed.", error);
        showPanel(true);
        report(
          "Analytics is off on this page only. Your withdrawal could not be saved, so analytics may resume on a later page load. Clear site data in your browser before reloading or returning."
        );
      }
    }
    if (saved) {
      report("Optional analytics is off. This site's analytics cookies have been removed.");
      showPanel(false);
      preferences.focus();
    }
    // Unload Google's running code without sending a denied-consent ping.
    if (wasActive && saved) win.location.reload();
  }

  preferences.hidden = false;
  withdraw.hidden = false;
  preferences.addEventListener("click", () => {
    showPanel(panel.hidden);
    if (!panel.hidden) (accept.disabled ? reject : accept).focus();
  });
  reject.addEventListener("click", deny);
  withdraw.addEventListener("click", deny);
  accept.addEventListener("click", () => {
    if (!id || gpc()) return;
    if (save(true)) {
      start();
      showPanel(false);
      preferences.focus();
    } else {
      stop();
    }
  });
  doc.addEventListener("click", (event) => {
    if (
      event.target instanceof win.Element &&
      event.target.closest("a[data-analytics-contact]") &&
      permitted()
    ) {
      win.gtag("event", "contact_click", {
        send_to: id,
        ...(releaseVersion ? { release_version: releaseVersion } : {}),
        contact_method: "email",
      });
    }
  });
  win.addEventListener("storage", (event) => {
    if ((event.key === STORAGE_KEY || event.key === null) && active) {
      if (!permitted()) report("Analytics is off because your privacy choice changed.");
    }
  });
  doc.addEventListener("visibilitychange", () => {
    if (active) permitted();
  });

  const choice = readChoice();
  accept.disabled = !id || gpc();
  showPanel(!choice);
  if (!id || gpc()) {
    stop();
    report(
      gpc()
        ? "Analytics is off because Global Privacy Control is enabled."
        : "Analytics is unavailable on this host or connection."
    );
  } else if (choice?.granted) {
    start();
  } else {
    stop();
    if (!storageFailed) report("Optional analytics is off.");
  }
}

if (typeof window !== "undefined") initializeAnalytics();
