import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parse } from "parse5";
import { initializeAnalytics } from "../public/analytics-consent.js";

const KEY = "jamula.analytics-consent";
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const receipt = (changes = {}) => ({
  version: 1,
  purpose: "pageviews-contact-intent",
  host: "jamula.net",
  granted: true,
  time: NOW,
  ...changes,
});

class Element extends EventTarget {
  hidden = true;
  disabled = false;
  textContent = "";
  attributes = new Map();
  focused = false;
  removed = false;
  contact = false;
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  focus() {
    this.focused = true;
  }
  closest(selector) {
    assert.equal(selector, "a[data-analytics-contact]");
    return this.contact ? this : null;
  }
  remove() {
    this.removed = true;
  }
}

function harness({
  url = "https://jamula.net/",
  stored,
  gpc = false,
  storage: sharedStorage,
} = {}) {
  const elements = new Map(
    ["consent", "status", "accept", "reject", "preferences", "withdraw"].map((name) => [
      `#analytics-${name}`,
      new Element(),
    ])
  );
  const scripts = [];
  const cookies = [];
  const warnings = [];
  const timers = new Map();
  const storage = sharedStorage ?? new Map(stored === undefined ? [] : [[KEY, stored]]);
  const win = new EventTarget();
  win.location = new URL(url);
  win.reloads = 0;
  win.location.reload = () => win.reloads++;
  win.navigator = { globalPrivacyControl: gpc };
  win.Element = Element;
  win.console = { warn: (...args) => warnings.push(args) };
  win.setTimeout = (callback, delay) => {
    const token = {};
    timers.set(token, { callback, delay });
    return token;
  };
  win.clearTimeout = (token) => timers.delete(token);
  win.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const doc = new EventTarget();
  doc.querySelector = (selector) => elements.get(selector);
  doc.createElement = (tag) => {
    assert.equal(tag, "script");
    return new Element();
  };
  doc.head = { append: (script) => scripts.push(script) };
  Object.defineProperty(doc, "cookie", { set: (value) => cookies.push(value) });
  const click = (name) => elements.get(`#analytics-${name}`).dispatchEvent(new Event("click"));
  const contactClick = (isContact = true) => {
    const target = new Element();
    target.contact = isContact;
    const event = new Event("click");
    Object.defineProperty(event, "target", { value: target });
    doc.dispatchEvent(event);
  };
  const storageEvent = (key = KEY) => {
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    win.dispatchEvent(event);
  };
  return {
    win,
    doc,
    elements,
    scripts,
    cookies,
    warnings,
    timers,
    storage,
    click,
    contactClick,
    storageEvent,
    init: () => initializeAnalytics(win, doc),
    commands: () => (win.dataLayer ?? []).map((args) => [...args]),
    status: () => elements.get("#analytics-status").textContent,
  };
}

test("no choice and rejection never create a Google tag or analytics queue", () => {
  const h = harness();
  h.init();
  h.contactClick();
  assert.equal(h.elements.get("#analytics-consent").hidden, false);
  assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
  assert.equal(h.win.gtag, undefined);
  assert.deepEqual(h.scripts, []);
  assert.deepEqual(h.commands(), []);
  h.click("reject");
  h.contactClick();
  assert.equal(JSON.parse(h.storage.get(KEY)).granted, false);
  assert.deepEqual(h.scripts, []);
  assert.deepEqual(h.commands(), []);
  assert.match(h.status(), /off/);
  const revisit = harness({ stored: h.storage.get(KEY) });
  revisit.init();
  assert.deepEqual(revisit.scripts, []);
  assert.equal(revisit.elements.get("#analytics-consent").hidden, true);
});

test("each approved HTTPS hostname selects only its corresponding measurement ID", async (t) => {
  for (const [label, host, id] of [
    ["net apex", "jamula.net", "G-7JW27J2XSW"],
    ["net www", "www.jamula.net", "G-7JW27J2XSW"],
    ["com apex", "jamula.com", "G-90MTZQ2EXX"],
    ["com www", "www.jamula.com", "G-90MTZQ2EXX"],
  ]) {
    await t.test(label, () => {
      const h = harness({ url: `https://${host}/` });
      h.init();
      assert.equal(h.scripts.length, 0);
      h.click("accept");
      assert.deepEqual(
        h.scripts.map((s) => s.src),
        [`https://www.googletagmanager.com/gtag/js?id=${id}`]
      );
      assert.equal(h.scripts[0].referrerPolicy, "no-referrer");
      assert.equal(h.win[`ga-disable-${id}`], false);
      assert.equal(h.commands().find(([command]) => command === "config")[1], id);
      assert.deepEqual(Object.keys(JSON.parse(h.storage.get(KEY))).sort(), [
        "granted",
        "host",
        "purpose",
        "time",
        "version",
      ]);
      assert.equal(JSON.parse(h.storage.get(KEY)).host, host);
    });
  }
});

test("local preview unknown subdomain HTTP and custom port hosts fail closed", async (t) => {
  for (const [label, url] of [
    ["local", "http://localhost:4321/"],
    ["preview", "https://example-123.azurestaticapps.net/"],
    ["unknown", "https://example.test/"],
    ["subdomain", "https://blog.jamula.net/"],
    ["suffix attack", "https://jamula.net.example.test/"],
    ["HTTP", "http://jamula.net/"],
    ["custom port", "https://jamula.net:4321/"],
  ]) {
    await t.test(label, () => {
      const h = harness({ url });
      h.init();
      h.click("accept");
      h.contactClick();
      assert.equal(h.elements.get("#analytics-accept").disabled, true);
      assert.deepEqual(h.scripts, []);
      assert.deepEqual(h.commands(), []);
      assert.equal(h.storage.size, 0);
    });
  }
});

test("invalid expired future wrong-host version and purpose receipts cannot authorize", async (t) => {
  for (const [label, stored] of [
    ["invalid JSON", "{"],
    ["null", "null"],
    ["wrong version", JSON.stringify(receipt({ version: 2 }))],
    ["wrong purpose", JSON.stringify(receipt({ purpose: "marketing" }))],
    ["wrong host", JSON.stringify(receipt({ host: "www.jamula.net" }))],
    ["expired boundary", JSON.stringify(receipt({ time: NOW - 180 * DAY }))],
    ["future", JSON.stringify(receipt({ time: NOW + DAY }))],
    ["missing timestamp", JSON.stringify(receipt({ time: undefined }))],
    ["string timestamp", JSON.stringify(receipt({ time: String(NOW) }))],
    ["string grant", JSON.stringify(receipt({ granted: "true" }))],
  ]) {
    await t.test(label, () => {
      const h = harness({ stored });
      h.init();
      h.contactClick();
      assert.deepEqual(h.scripts, []);
      assert.equal(h.elements.get("#analytics-consent").hidden, false);
    });
  }
});

test("valid saved consent resumes once and repeated init or accept does not duplicate events", () => {
  const h = harness({
    stored: JSON.stringify(receipt({ time: NOW - 179 * DAY })),
  });
  h.init();
  h.init();
  h.click("accept");
  h.click("accept");
  h.contactClick(false);
  h.contactClick();
  const events = h.commands().filter(([command]) => command === "event");
  assert.equal(h.scripts.length, 1);
  assert.deepEqual(events, [
    ["event", "page_view", { send_to: "G-7JW27J2XSW" }],
    ["event", "contact_click", { send_to: "G-7JW27J2XSW", contact_method: "email" }],
  ]);
});

test("configuration excludes advertising linker and sensitive URLs from all requested events", () => {
  const h = harness({ url: "https://jamula.net/?email=private@example.test#secret" });
  h.init();
  h.click("accept");
  h.contactClick();
  const commands = h.commands();
  assert.deepEqual(commands[0], [
    "consent",
    "default",
    {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  ]);
  assert.deepEqual(
    commands.find(([command]) => command === "config"),
    [
      "config",
      "G-7JW27J2XSW",
      {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: "https://jamula.net/",
        page_title: "Jamula home",
        page_referrer: "",
        ignore_referrer: true,
        cookie_prefix: "jamula",
        cookie_domain: "none",
        cookie_path: "/",
        cookie_expires: 0,
        cookie_update: false,
        cookie_flags: "Secure;SameSite=Lax",
        linker: { domains: [], accept_incoming: false, decorate_forms: false },
      },
    ]
  );
  assert.doesNotMatch(JSON.stringify(commands), /private|example|secret|mailto|spam@|user_id/);
});

test("privacy and arbitrary not-found paths use fixed safe page values", async (t) => {
  for (const [label, path, safePath, title] of [
    ["privacy", "/privacy/", "/privacy/", "Website analytics privacy"],
    ["unknown", "/private@example.test?secret=value", "/404", "Page not found"],
  ]) {
    await t.test(label, () => {
      const h = harness({ url: `https://jamula.net${path}` });
      h.init();
      h.click("accept");
      const config = h.commands().find(([command]) => command === "config")[2];
      assert.equal(config.page_location, `https://jamula.net${safePath}`);
      assert.equal(config.page_title, title);
    });
  }
});

test("withdrawal clears only owned cookies and queued events before unloading the tag", () => {
  const h = harness();
  h.init();
  h.click("accept");
  h.contactClick();
  h.cookies.length = 0;
  h.click("withdraw");
  h.contactClick();
  assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
  assert.deepEqual(h.commands(), []);
  assert.equal(h.scripts[0].removed, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.win.reloads, 1);
  assert.equal(JSON.parse(h.storage.get(KEY)).granted, false);
  assert.deepEqual(h.cookies, [
    "jamula_ga=; Max-Age=0; Path=/; Secure; SameSite=Lax",
    "jamula_ga_7JW27J2XSW=; Max-Age=0; Path=/; Secure; SameSite=Lax",
  ]);
  assert.equal(h.elements.get("#analytics-withdraw").hidden, false);
});

test("reject after acceptance uses the same immediate withdrawal path", () => {
  const h = harness();
  h.init();
  h.click("accept");
  h.click("preferences");
  assert.equal(h.elements.get("#analytics-consent").hidden, false);
  assert.equal(h.elements.get("#analytics-accept").focused, true);
  assert.equal(h.elements.get("#analytics-preferences").attributes.get("aria-expanded"), "true");
  h.click("reject");
  h.contactClick();
  assert.equal(h.win.reloads, 1);
  assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
  assert.deepEqual(h.commands(), []);
});

test("GPC overrides saved consent and blocks attempted opt-in", () => {
  const h = harness({ gpc: true, stored: JSON.stringify(receipt()) });
  h.init();
  h.click("accept");
  h.contactClick();
  assert.equal(h.elements.get("#analytics-accept").disabled, true);
  assert.deepEqual(h.scripts, []);
  assert.match(h.status(), /Global Privacy Control/);
});

test("cross-tab withdrawal clearing expiry and new GPC stop further events", async (t) => {
  for (const label of ["withdrawal", "clear", "expiry", "GPC"]) {
    await t.test(label, () => {
      const h = harness({ stored: JSON.stringify(receipt()) });
      h.init();
      if (label === "withdrawal") {
        h.storage.set(KEY, JSON.stringify(receipt({ granted: false })));
        h.storageEvent();
      } else if (label === "clear") {
        h.storage.clear();
        h.storageEvent(null);
      } else if (label === "expiry") {
        h.storage.set(KEY, JSON.stringify(receipt({ time: NOW - 180 * DAY })));
        [...h.timers.values()][0].callback();
      } else {
        h.win.navigator.globalPrivacyControl = true;
        h.doc.dispatchEvent(new Event("visibilitychange"));
      }
      h.contactClick();
      assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
      assert.deepEqual(h.commands(), []);
      assert.equal(h.scripts[0].removed, true);
    });
  }
});

test("blocked storage reads and failed writes surface errors and never start collection", async (t) => {
  for (const operation of ["getItem", "setItem"]) {
    await t.test(operation, () => {
      const h = harness();
      h.win.localStorage[operation] = () => {
        throw new Error("storage blocked");
      };
      h.init();
      h.click("accept");
      assert.deepEqual(h.scripts, []);
      assert.match(h.status(), /off/);
      assert.ok(h.warnings.length > 0);
    });
  }
});

test("failed rejection writes remove the prior grant before the next page load", async (t) => {
  for (const action of ["withdraw", "reject"]) {
    for (const failure of ["throws", "no-op"]) {
      await t.test(`${action} write ${failure}`, () => {
        const h = harness({ stored: JSON.stringify(receipt()) });
        h.storage.set("unrelated-preference", "preserved");
        h.init();
        h.win.localStorage.setItem = () => {
          if (failure === "throws") throw new Error("write blocked");
        };
        h.click(action);
        h.contactClick();
        assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
        assert.equal(h.scripts[0].removed, true);
        assert.equal(h.timers.size, 0);
        assert.deepEqual(h.commands(), []);
        assert.equal(h.storage.has(KEY), false);
        assert.equal(h.storage.get("unrelated-preference"), "preserved");
        assert.equal(h.win.reloads, 1);
        assert.match(h.status(), /off/);
        assert.doesNotMatch(h.status(), /could not|may resume/);
        const revisit = harness({ storage: h.storage });
        revisit.init();
        revisit.contactClick();
        assert.deepEqual(revisit.scripts, []);
        assert.deepEqual(revisit.commands(), []);
        assert.equal(revisit.elements.get("#analytics-consent").hidden, false);
      });
    }
  }
});

test("unmodifiable withdrawal storage warns that a later load can resume the prior grant", async (t) => {
  for (const writeFailure of ["throws", "no-op"]) {
    for (const removalFailure of ["throws", "no-op"]) {
      await t.test(`write ${writeFailure} removal ${removalFailure}`, () => {
        const priorGrant = JSON.stringify(receipt());
        const h = harness({ stored: priorGrant });
        h.init();
        h.win.localStorage.setItem = () => {
          if (writeFailure === "throws") throw new Error("write blocked");
        };
        h.win.localStorage.removeItem = () => {
          if (removalFailure === "throws") throw new Error("removal blocked");
        };
        h.click("withdraw");
        h.contactClick();
        assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
        assert.equal(h.scripts[0].removed, true);
        assert.equal(h.timers.size, 0);
        assert.deepEqual(h.commands(), []);
        assert.equal(h.win.reloads, 0);
        assert.equal(h.storage.get(KEY), priorGrant);
        assert.equal(h.elements.get("#analytics-consent").hidden, false);
        assert.match(h.status(), /off on this page only/);
        assert.match(h.status(), /withdrawal could not be saved/i);
        assert.match(h.status(), /may resume/);
        assert.match(
          h.status(),
          /clear site data.*before.*reload|clear site data.*before.*return/i
        );
        assert.ok(h.warnings.length >= 2);
        const revisit = harness({ storage: h.storage });
        revisit.init();
        assert.equal(revisit.scripts.length, 1);
        assert.equal(revisit.win["ga-disable-G-7JW27J2XSW"], false);
      });
    }
  }
});

test("unverifiable withdrawal removal does not claim persistent success or reload", () => {
  const h = harness({ stored: JSON.stringify(receipt()) });
  h.init();
  h.win.localStorage.setItem = () => {
    throw new Error("write blocked");
  };
  h.win.localStorage.getItem = () => {
    throw new Error("read blocked");
  };
  h.click("withdraw");
  h.contactClick();
  assert.equal(h.storage.has(KEY), false);
  assert.equal(h.win.reloads, 0);
  assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
  assert.deepEqual(h.commands(), []);
  assert.match(h.status(), /withdrawal could not be saved/i);
  assert.equal(h.elements.get("#analytics-consent").hidden, false);
  const revisit = harness({ storage: h.storage });
  revisit.init();
  assert.deepEqual(revisit.scripts, []);
});

test("tag load failure disables analytics and reports the failure", () => {
  const h = harness();
  h.init();
  h.click("accept");
  h.scripts[0].onerror();
  h.contactClick();
  assert.equal(h.win["ga-disable-G-7JW27J2XSW"], true);
  assert.deepEqual(h.commands(), []);
  assert.match(h.status(), /could not load/);
  h.click("accept");
  assert.equal(h.win.reloads, 1);
  assert.equal(h.scripts.length, 1);
});

test("built pages expose accessible consent controls without unconditional Google resources", async () => {
  for (const page of ["index.html", "privacy/index.html", "404.html"]) {
    const html = await readFile(new URL(`../dist/${page}`, import.meta.url), "utf8");
    const nodes = [];
    function walk(node) {
      nodes.push(node);
      for (const child of node.childNodes ?? []) walk(child);
    }
    walk(parse(html));
    const attrs = (node) => Object.fromEntries((node.attrs ?? []).map((a) => [a.name, a.value]));
    const byId = (id) => nodes.find((node) => attrs(node).id === id);
    for (const id of ["analytics-accept", "analytics-reject", "analytics-withdraw"]) {
      const button = byId(id);
      assert.equal(button.tagName, "button");
      assert.equal(attrs(button).type, "button");
      assert.equal(attrs(button).tabindex, undefined);
    }
    assert.equal(attrs(byId("analytics-consent"))["aria-labelledby"], "analytics-heading");
    assert.equal(attrs(byId("analytics-preferences"))["aria-controls"], "analytics-consent");
    assert.equal(attrs(byId("analytics-status")).role, "status");
    assert.ok(nodes.some((node) => node.tagName === "noscript"));
    assert.doesNotMatch(
      html,
      /(?:src|href)=["']https:\/\/(?:www\.)?(?:googletagmanager|google-analytics)\.com/
    );
    assert.ok(
      nodes.some((node) => node.tagName === "script" && attrs(node).src === "/analytics-consent.js")
    );
  }
});

test("CSP permits only required Google tag and analytics endpoints without advertising hosts", async () => {
  const config = JSON.parse(
    await readFile(new URL("../dist/staticwebapp.config.json", import.meta.url), "utf8")
  );
  const csp = config.globalHeaders["Content-Security-Policy"];
  assert.match(csp, /script-src 'self' https:\/\/www\.googletagmanager\.com;/);
  assert.match(
    csp,
    /connect-src 'self' https:\/\/www\.google-analytics\.com https:\/\/region1\.google-analytics\.com;/
  );
  assert.doesNotMatch(csp, /\*|doubleclick|googleadservices|unsafe-eval/);
});
