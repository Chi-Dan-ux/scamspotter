// ===== 1. SETTINGS =====
const DATA_URL = "data/scams.json";
const STORAGE_KEY = "scamspotter-watchlist";
const SITE_NAME = "ScamSpotter";

const channelLabels = {
  sms: "SMS",
  email: "Email",
  whatsapp: "WhatsApp",
  call: "Phone Call"
};

// Simple line icons (our own trusted strings, not user input)
const channelIcons = {
  sms: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h16v12H9l-5 4z"/></svg>',
  whatsapp: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/></svg>',
  email: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  call: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>'
};

// ===== 2. PAGE ELEMENTS =====
const views = document.querySelectorAll("[data-view]");
const statusBox = document.getElementById("status");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchMessage = document.getElementById("search-message");
const filterButtons = document.querySelectorAll(".chip");
const container = document.getElementById("scam-container");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");
const listTitle = document.getElementById("hero-title");

const detailContent = document.getElementById("detail-content");

const watchlistTitle = document.getElementById("watchlist-title");
const watchlistContainer = document.getElementById("watchlist-container");
const watchlistCount = document.getElementById("watchlist-count");
const watchlistEmpty = document.getElementById("watchlist-empty");
const watchlistLink = document.getElementById("watchlist-link");
const watchlistBadge = document.getElementById("watchlist-badge");

const notFoundTitle = document.getElementById("notfound-title");
const notFoundMessage = document.getElementById("notfound-message");

// ===== 3. STATE =====
// Everything that can change lives here, in one place.
let scams = [];             // the loaded data
let loadState = "loading";  // loading | ready | empty | error
let searchText = "";        // what the user typed in the search box
let activeFilter = "all";   // which channel chip is selected
let favourites = loadFavourites(); // ids of saved scams (kept in localStorage)
let hasRendered = false;    // so the first page load does not steal keyboard focus

// ===== 4. SMALL HELPERS =====
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// ===== 5. WATCHLIST (saved scams) =====
// localStorage can fail (for example in private browsing), so every use is wrapped.
function loadFavourites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
  } catch (error) {
    return [];
  }
}

function persistFavourites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  } catch (error) {
    console.error("Could not save the watchlist:", error);
  }
}

function isSaved(id) {
  return favourites.includes(id);
}

function updateBadge() {
  watchlistBadge.textContent = String(favourites.length);
  watchlistBadge.hidden = favourites.length === 0;
}

function setSaveState(button, saved) {
  button.setAttribute("aria-pressed", String(saved));
  button.classList.toggle("is-saved", saved);
  button.textContent = saved ? "\u2713 Saved" : "Save";
}

function toggleFavourite(id) {
  if (isSaved(id)) {
    favourites = favourites.filter(function (savedId) {
      return savedId !== id;
    });
  } else {
    favourites = favourites.concat(id);
  }
  persistFavourites();
  updateBadge();

  // Update every Save button for this scam that is on the page
  document.querySelectorAll('[data-save-id="' + id + '"]').forEach(function (button) {
    setSaveState(button, isSaved(id));
  });

  // On the watchlist page, a removed scam should disappear
  if (parseRoute().name === "watchlist") {
    renderWatchlist();
    watchlistTitle.focus();
  }
}

// ===== 6. COMPONENTS =====
// Each function builds one reusable piece of the page from the data it is given.

function createIcon(channel) {
  const icon = el("div", "card-icon");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = channelIcons[channel] || "";
  return icon;
}

function createTag(severity) {
  return el("span", "tag tag-" + severity.toLowerCase(), severity);
}

function createButton(label, className, onClick) {
  const button = el("button", className, label);
  button.type = "button";
  if (onClick) {
    button.addEventListener("click", onClick);
  }
  return button;
}

function createSaveButton(scam) {
  const button = el("button", "btn-save");
  button.type = "button";
  button.dataset.saveId = String(scam.id);
  button.setAttribute("aria-label", "Save to watchlist: " + scam.name);
  setSaveState(button, isSaved(scam.id));
  button.addEventListener("click", function () {
    toggleFavourite(scam.id);
  });
  return button;
}

function createCard(scam) {
  const card = el("article", "scam-card");
  card.dataset.channel = scam.channel;

  const top = el("div", "card-top");
  top.append(createIcon(scam.channel), el("h3", "card-title", scam.name), createTag(scam.severity));

  const details = el("a", "btn-details", "View details ");
  details.href = "#/scam/" + scam.id;
  details.setAttribute("aria-label", "View details: " + scam.name);
  const arrow = el("span", "", "\u2192");
  arrow.setAttribute("aria-hidden", "true");
  details.append(arrow);

  const actions = el("div", "card-actions");
  actions.append(details, createSaveButton(scam));

  card.append(top, el("p", "card-text", scam.description), actions);
  return card;
}

// Status box: loading, empty and error messages
function clearStatus() {
  statusBox.hidden = true;
  statusBox.replaceChildren();
}

function showStatus(type, message, retryHandler) {
  statusBox.className = "status status-" + type;
  statusBox.replaceChildren(el("p", "", message));

  if (retryHandler) {
    statusBox.append(createButton("Retry", "btn-retry", retryHandler));
  }
  statusBox.hidden = false;
}

// ===== 7. LIST VIEW =====
function getVisibleScams() {
  const query = searchText.toLowerCase();

  return scams.filter(function (scam) {
    const matchesFilter = activeFilter === "all" || scam.channel === activeFilter;
    const searchableText = (
      scam.name + " " + scam.description + " " + (channelLabels[scam.channel] || "")
    ).toLowerCase();
    const matchesSearch = query === "" || searchableText.includes(query);
    return matchesFilter && matchesSearch;
  });
}

function render() {
  const visible = getVisibleScams();

  container.replaceChildren();
  visible.forEach(function (scam) {
    container.append(createCard(scam));
  });

  if (visible.length === 0) {
    noResults.textContent = searchText
      ? 'No scams found for "' + searchText + '". Try another word or choose "All".'
      : "No scams found for this channel.";
    noResults.hidden = false;
    resultCount.textContent = "";
  } else {
    noResults.hidden = true;
    resultCount.textContent = "Showing " + visible.length + " of " + scams.length + " scams";
  }
}

// ===== 8. DETAIL VIEW =====
function renderDetail(scam) {
  detailContent.replaceChildren();

  const title = el("h1", "detail-title", scam.name);
  title.id = "detail-title";
  title.tabIndex = -1;

  const header = el("div", "detail-header");
  header.append(createIcon(scam.channel), title, createTag(scam.severity));

  detailContent.append(
    header,
    el("p", "detail-channel", "Reaches you by: " + channelLabels[scam.channel]),
    el("p", "detail-text", scam.description)
  );

  if (scam.redFlags.length > 0) {
    const list = el("ul", "detail-list");
    scam.redFlags.forEach(function (flag) {
      list.append(el("li", "", flag));
    });
    detailContent.append(el("h2", "detail-heading", "Red flags"), list);
  }

  if (scam.whatToDo) {
    detailContent.append(el("h2", "detail-heading", "What to do"), el("p", "detail-text", scam.whatToDo));
  }

  const actions = el("div", "detail-actions");
  actions.append(createSaveButton(scam));
  detailContent.append(actions);

  return title;
}

// ===== 9. WATCHLIST VIEW =====
function renderWatchlist() {
  const saved = scams.filter(function (scam) {
    return isSaved(scam.id);
  });

  watchlistContainer.replaceChildren();
  saved.forEach(function (scam) {
    watchlistContainer.append(createCard(scam));
  });

  watchlistEmpty.hidden = saved.length > 0;
  watchlistCount.textContent = saved.length > 0 ? saved.length + " saved" : "";
}

// ===== 10. ROUTER =====
// The part of the address after the # decides which view to show:
//   #/             list        #/scam/3     detail for scam 3
//   #/watchlist    watchlist   anything else -> page not found
function parseRoute() {
  const path = window.location.hash.replace(/^#/, "") || "/";

  if (path === "/") {
    return { name: "list" };
  }
  if (path === "/watchlist") {
    return { name: "watchlist" };
  }
  const match = path.match(/^\/scam\/(\d+)$/);
  if (match) {
    return { name: "detail", id: Number(match[1]) };
  }
  return { name: "notfound" };
}

function showView(name) {
  views.forEach(function (view) {
    view.hidden = view.dataset.view !== name;
  });
}

// After a view is shown: set the tab title, scroll up, and move keyboard focus to the heading
function finishNavigation(title, heading) {
  document.title = title === SITE_NAME ? SITE_NAME : title + " | " + SITE_NAME;
  if (hasRendered) {
    window.scrollTo(0, 0);
    heading.focus();
  }
  hasRendered = true;
}

function showNotFound(message) {
  notFoundMessage.textContent = message;
  showView("notfound");
  finishNavigation("Page not found", notFoundTitle);
}

function route() {
  const current = parseRoute();
  watchlistLink.removeAttribute("aria-current");

  // A bad address never needs the data
  if (current.name === "notfound") {
    clearStatus();
    showNotFound("We could not find the page you were looking for.");
    return;
  }

  // Data not ready: the status box explains why (loading, empty or error)
  if (loadState !== "ready") {
    showView(null);
    return;
  }

  if (current.name === "list") {
    showView("list");
    render();
    finishNavigation(SITE_NAME, listTitle);
  } else if (current.name === "watchlist") {
    watchlistLink.setAttribute("aria-current", "page");
    showView("watchlist");
    renderWatchlist();
    finishNavigation("My Watchlist", watchlistTitle);
  } else {
    const scam = scams.find(function (item) {
      return item.id === current.id;
    });
    if (!scam) {
      showNotFound("We could not find that scam. It may have been removed.");
      return;
    }
    const heading = renderDetail(scam);
    showView("detail");
    finishNavigation(scam.name, heading);
  }
}

// ===== 11. LOAD THE DATA =====
// Only keep entries that have everything a card needs, so one bad entry cannot break the page.
function isValidScam(item) {
  return (
    item &&
    Number.isInteger(item.id) &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.severity === "string" &&
    Object.prototype.hasOwnProperty.call(channelLabels, item.channel)
  );
}

// Make sure the optional detail fields always have a safe shape
function normaliseScam(item) {
  return Object.assign({}, item, {
    redFlags: Array.isArray(item.redFlags)
      ? item.redFlags.filter(function (flag) {
          return typeof flag === "string";
        })
      : [],
    whatToDo: typeof item.whatToDo === "string" ? item.whatToDo : ""
  });
}

async function loadScams() {
  // Loading state
  loadState = "loading";
  showStatus("loading", "Loading scams...");
  route();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error("Server answered with status " + response.status);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Data is not a list");
    }

    scams = data.filter(isValidScam).map(normaliseScam);

    // Forget saved ids for scams that no longer exist
    favourites = favourites.filter(function (id) {
      return scams.some(function (scam) {
        return scam.id === id;
      });
    });
    persistFavourites();
    updateBadge();

    // Empty state: the file loaded but has nothing usable in it
    if (scams.length === 0) {
      loadState = "empty";
      showStatus("empty", "No scams are available yet. Please check back soon.");
    } else {
      loadState = "ready";
      clearStatus();
    }
  } catch (error) {
    // Error state, with a way to try again
    console.error("Could not load scams:", error);
    loadState = "error";
    showStatus(
      "error",
      "We could not load the scams. Check your connection and try again.",
      loadScams
    );
  }

  route();
}

// ===== 12. SEARCH =====
function cleanInput(value) {
  return value.trim();
}

searchInput.addEventListener("input", function () {
  searchText = cleanInput(searchInput.value);
  searchMessage.textContent = "";
  render();
});

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  searchText = cleanInput(searchInput.value);

  if (searchText === "") {
    searchInput.value = "";
    searchMessage.textContent = "Please type a keyword to search. Showing all scams.";
  } else {
    searchMessage.textContent = "";
  }
  render();
});

// ===== 13. FILTER =====
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    activeFilter = button.dataset.filter;

    filterButtons.forEach(function (chip) {
      const isSelected = chip === button;
      chip.classList.toggle("is-active", isSelected);
      chip.setAttribute("aria-pressed", String(isSelected));
    });

    render();
  });
});

// ===== 14. START =====
window.addEventListener("hashchange", route);
updateBadge();
loadScams();
