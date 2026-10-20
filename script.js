// ===== 1. SETTINGS =====
const DATA_URL = "data/scams.json";

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
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchMessage = document.getElementById("search-message");
const filterButtons = document.querySelectorAll(".chip");
const container = document.getElementById("scam-container");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");
const statusBox = document.getElementById("status");

// ===== 3. STATE =====
// All the things that can change live here, in one place.
let scams = [];            // the loaded data
let searchText = "";       // what the user typed
let activeFilter = "all";  // which chip is selected

// ===== 4. COMPONENTS =====
// Each function builds one reusable piece of the page from the data it is given.

function createIcon(channel) {
  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = channelIcons[channel] || "";
  return icon;
}

function createTag(severity) {
  const tag = document.createElement("span");
  tag.className = "tag tag-" + severity.toLowerCase();
  tag.textContent = severity;
  return tag;
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  if (onClick) {
    button.addEventListener("click", onClick);
  }
  return button;
}

function createCard(scam) {
  const card = document.createElement("article");
  card.className = "scam-card";
  card.dataset.channel = scam.channel;

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = scam.name;

  const top = document.createElement("div");
  top.className = "card-top";
  top.append(createIcon(scam.channel), title, createTag(scam.severity));

  const text = document.createElement("p");
  text.className = "card-text";
  text.textContent = scam.description;

  const details = createButton("View details ", "btn-details");
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "\u2192";
  details.append(arrow);

  card.append(top, text, details);
  return card;
}

// ===== 5. STATUS MESSAGES (loading, empty, error) =====
function clearStatus() {
  statusBox.hidden = true;
  statusBox.replaceChildren();
}

function showStatus(type, message, retryHandler) {
  statusBox.className = "status status-" + type;
  statusBox.replaceChildren();

  const text = document.createElement("p");
  text.textContent = message;
  statusBox.append(text);

  // The error state gets a Retry button
  if (retryHandler) {
    statusBox.append(createButton("Retry", "btn-retry", retryHandler));
  }
  statusBox.hidden = false;
}

// ===== 6. DECIDE WHICH SCAMS TO SHOW =====
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

// ===== 7. DRAW THE LIST =====
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

// ===== 8. LOAD THE DATA =====
// Only keep entries that have everything a card needs, so one bad entry cannot break the page.
function isValidScam(item) {
  return (
    item &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.severity === "string" &&
    Object.prototype.hasOwnProperty.call(channelLabels, item.channel)
  );
}

async function loadScams() {
  // Loading state
  container.replaceChildren();
  noResults.hidden = true;
  resultCount.textContent = "";
  showStatus("loading", "Loading scams...");

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error("Server answered with status " + response.status);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Data is not a list");
    }

    scams = data.filter(isValidScam);
    clearStatus();

    // Empty state: the file loaded but has nothing usable in it
    if (scams.length === 0) {
      showStatus("empty", "No scams are available yet. Please check back soon.");
      return;
    }

    render();
  } catch (error) {
    // Error state, with a way to try again
    console.error("Could not load scams:", error);
    showStatus(
      "error",
      "We could not load the scams. Check your connection and try again.",
      loadScams
    );
  }
}

// ===== 9. SEARCH =====
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

// ===== 10. FILTER =====
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

// ===== 11. START =====
loadScams();


