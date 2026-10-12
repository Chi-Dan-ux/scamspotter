// ===== 1. DATA =====
// Week 1: scams live in an array. In Week 2 this moves to a JSON file.
const scams = [
  {
    id: 1,
    name: "Fake Bank Alert SMS",
    channel: "sms",
    severity: "High",
    description: "Scammers send urgent texts about account issues to steal your login details and money."
  },
  {
    id: 2,
    name: "Wrong Number WhatsApp Scam",
    channel: "whatsapp",
    severity: "Medium",
    description: "Scammers use random numbers to start conversations and gain your trust, then ask for money or personal information."
  },
  {
    id: 3,
    name: "Fake Delivery Notice",
    channel: "email",
    severity: "Medium",
    description: "You receive a fake message about a missed delivery, with a link to pay a fee or update your details."
  },
  {
    id: 4,
    name: "Account Suspended Email",
    channel: "email",
    severity: "High",
    description: "An email claims your account will be closed unless you click a link and confirm your password."
  },
  {
    id: 5,
    name: "Tech Support Phone Call",
    channel: "call",
    severity: "High",
    description: "A caller pretends to be from a tech company, says your device has a virus, and asks for remote access or payment."
  },
  {
    id: 6,
    name: "Fake Job Offer",
    channel: "whatsapp",
    severity: "Medium",
    description: "A message offers easy work from home, then asks you to pay a registration fee before you can start."
  }
];

// Names shown to the user for each channel
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

// ===== 3. STATE =====
// The two things the user can change
let searchText = "";
let activeFilter = "all";

// ===== 4. BUILD ONE CARD =====
// One function that builds a card from one scam. Reused for every card.
function createCard(scam) {
  const card = document.createElement("article");
  card.className = "scam-card";
  card.dataset.channel = scam.channel;

  const top = document.createElement("div");
  top.className = "card-top";

  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = channelIcons[scam.channel];

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = scam.name;

  const tag = document.createElement("span");
  tag.className = "tag tag-" + scam.severity.toLowerCase();
  tag.textContent = scam.severity;

  top.append(icon, title, tag);

  const text = document.createElement("p");
  text.className = "card-text";
  text.textContent = scam.description;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-details";
  button.textContent = "View details ";
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "â";
  button.append(arrow);

  card.append(top, text, button);
  return card;
}

// ===== 5. DECIDE WHICH SCAMS TO SHOW =====
function getVisibleScams() {
  // Lowercase so "PHISHING" and "phishing" match
  const query = searchText.toLowerCase();

  return scams.filter(function (scam) {
    const matchesFilter = activeFilter === "all" || scam.channel === activeFilter;

    // Search the name, the description and the channel name
    const searchableText = (
      scam.name + " " + scam.description + " " + channelLabels[scam.channel]
    ).toLowerCase();
    const matchesSearch = query === "" || searchableText.includes(query);

    return matchesFilter && matchesSearch;
  });
}

// ===== 6. DRAW THE PAGE =====
function render() {
  const visible = getVisibleScams();

  container.innerHTML = "";
  visible.forEach(function (scam) {
    container.append(createCard(scam));
  });

  if (visible.length === 0) {
    // Empty result: tell the user what happened and how to fix it.
    // textContent (not innerHTML) keeps whatever they typed safe.
    noResults.textContent = searchText
      ? 'No scams found for "' + searchText + '". Try another word or choose "All".'
      : "No scams found for this channel.";
    noResults.hidden = false;
    resultCount.textContent = "";
  } else {
    noResults.hidden = true;
    resultCount.textContent =
      "Showing " + visible.length + " of " + scams.length + " scams";
  }
}

// ===== 7. SEARCH =====
// Clean what the user typed: trim spaces at the start and end
function cleanInput(value) {
  return value.trim();
}

// Runs while typing
searchInput.addEventListener("input", function () {
  searchText = cleanInput(searchInput.value);
  searchMessage.textContent = "";
  render();
});

// Runs when the user presses Enter / submits the search
searchForm.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading
  searchText = cleanInput(searchInput.value);

  if (searchText === "") {
    // Empty or spaces only
    searchInput.value = "";
    searchMessage.textContent = "Please type a keyword to search. Showing all scams.";
  } else {
    searchMessage.textContent = "";
  }
  render();
});

// ===== 8. FILTER =====
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    activeFilter = button.dataset.filter;

    // Update the look and the screen-reader state of every chip
    filterButtons.forEach(function (chip) {
      const isSelected = chip === button;
      chip.classList.toggle("is-active", isSelected);
      chip.setAttribute("aria-pressed", String(isSelected));
    });

    render();
  });
});

// ===== 9. START =====
render();
