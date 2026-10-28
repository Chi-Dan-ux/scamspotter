import { describe, it, expect } from "vitest";
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
import path from "path";

// ===== Test setup =====
// Small, fixed test data, so the tests do not depend on the real scams.json
const fixture = [
  {
    id: 1,
    name: "Fake Bank Alert SMS",
    channel: "sms",
    severity: "High",
    description: "Urgent texts about account issues.",
    redFlags: ["Urgent wording", "Unknown link", "Asks for your PIN"],
    whatToDo: "Call your bank using the number on your card."
  },
  {
    id: 2,
    name: "Wrong Number WhatsApp Scam",
    channel: "whatsapp",
    severity: "Medium",
    description: "A stranger starts a friendly chat, then asks for money."
  },
  {
    id: 3,
    name: "Phishing Email",
    channel: "email",
    severity: "High",
    description: "Fake emails that try to steal your passwords."
  }
];

const root = process.cwd();
const pageHtml = fs
  .readFileSync(path.join(root, "index.html"), "utf8")
  .replace(/<script[^>]*src="script.js"[^>]*><\/script>/, "");
const pageScript = fs.readFileSync(path.join(root, "script.js"), "utf8");

const wait = () => new Promise((resolve) => setTimeout(resolve, 20));

// Opens the page in a fake browser, runs script.js, and returns the window
async function openApp({ hash = "", fetchImpl, saved } = {}) {
  const dom = new JSDOM(pageHtml, {
    url: "http://localhost/" + hash,
    runScripts: "outside-only",
    virtualConsole: new VirtualConsole() // keeps expected error messages out of the test output
  });
  const { window } = dom;

  if (saved) {
    window.localStorage.setItem("scamspotter-watchlist", saved);
  }
  window.scrollTo = () => {};
  window.fetch =
    fetchImpl ||
    (() => Promise.resolve({ ok: true, json: () => Promise.resolve(fixture) }));

  window.eval(pageScript);
  await wait();
  return window;
}

const cards = (window) => window.document.querySelectorAll("#scam-container .scam-card");
const type = (window, text) => {
  const input = window.document.getElementById("search-input");
  input.value = text;
  input.dispatchEvent(new window.Event("input"));
};

// ===== 1. A component =====
describe("Scam card component", () => {
  it("builds one card per scam, with the name, severity and a details link", async () => {
    const window = await openApp();
    const allCards = cards(window);

    expect(allCards).toHaveLength(3);

    const first = allCards[0];
    expect(first.querySelector(".card-title").textContent).toBe("Fake Bank Alert SMS");
    expect(first.querySelector(".tag").textContent).toBe("High");
    expect(first.querySelector("a.btn-details").getAttribute("href")).toBe("#/scam/1");
  });
});

// ===== 2. User interactions =====
describe("Search and filter", () => {
  it("shows only matching scams, ignoring capital letters and extra spaces", async () => {
    const window = await openApp();

    type(window, "  BANK ");
    expect(cards(window)).toHaveLength(1);
    expect(cards(window)[0].querySelector(".card-title").textContent).toBe("Fake Bank Alert SMS");
  });

  it("shows a helpful message when nothing matches", async () => {
    const window = await openApp();

    type(window, "xyz");
    const message = window.document.getElementById("no-results");

    expect(cards(window)).toHaveLength(0);
    expect(message.hidden).toBe(false);
    expect(message.textContent).toContain("No scams found");
  });

  it("filters by channel and marks the chosen chip as pressed", async () => {
    const window = await openApp();
    const chip = window.document.querySelector('[data-filter="whatsapp"]');

    chip.click();

    expect(cards(window)).toHaveLength(1);
    expect(cards(window)[0].dataset.channel).toBe("whatsapp");
    expect(chip.getAttribute("aria-pressed")).toBe("true");
  });
});

// ===== 3. Data states =====
describe("Data states", () => {
  it("shows an error with a Retry button, and recovers when Retry works", async () => {
    const window = await openApp({ fetchImpl: () => Promise.reject(new Error("offline")) });
    const status = window.document.getElementById("status");

    expect(status.hidden).toBe(false);
    expect(status.textContent).toContain("We could not load the scams");
    expect(cards(window)).toHaveLength(0);

    // The connection comes back, and the user presses Retry
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(fixture) });
    status.querySelector(".btn-retry").click();
    await wait();

    expect(status.hidden).toBe(true);
    expect(cards(window)).toHaveLength(3);
  });

  it("shows an empty message when the data file has no scams", async () => {
    const window = await openApp({
      fetchImpl: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    });
    const status = window.document.getElementById("status");

    expect(status.textContent).toContain("No scams are available yet");
    expect(cards(window)).toHaveLength(0);
  });
});

// ===== 4. Routing and saved state =====
describe("Routing and watchlist", () => {
  it("opens the right scam straight from a deep link, and shows not-found for a bad address", async () => {
    const deep = await openApp({ hash: "#/scam/3" });
    expect(deep.document.getElementById("view-detail").hidden).toBe(false);
    expect(deep.document.querySelector("#detail-content h1").textContent).toBe("Phishing Email");

    const bad = await openApp({ hash: "#/hello" });
    expect(bad.document.getElementById("view-notfound").hidden).toBe(false);
    expect(bad.document.getElementById("view-list").hidden).toBe(true);
  });

  it("saves a scam to the watchlist and keeps it in localStorage", async () => {
    const window = await openApp({ hash: "#/scam/1" });

    window.document.querySelector("#detail-content .btn-save").click();

    expect(window.localStorage.getItem("scamspotter-watchlist")).toBe("[1]");
    expect(window.document.getElementById("watchlist-badge").textContent).toBe("1");
    expect(window.document.querySelector("#detail-content .btn-save").getAttribute("aria-pressed")).toBe("true");
  });
});
