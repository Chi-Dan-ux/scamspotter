# ScamSpotter

A quick-reference guide to common online scams, built for everyday internet users and small business owners who want to recognise scam messages and calls before they lose money.

**Track:** Frontend Development
**Built by:** Ndabai Daniella Chiderah
**Live site:** https://chi-dan-ux.github.io/scamspotter/

## Stack

HTML, CSS, Bootstrap and plain JavaScript. No frameworks, and no plugins for the search, filter or data logic.

## How to run

1. Clone this repo.
2. Open the folder in VS Code and start it with the **Live Server** extension (right-click `index.html`, then **Open with Live Server**).

Do not open `index.html` by double-clicking it. The page loads its data with `fetch`, and browsers block that for files opened straight from disk.

## Project structure

```
scamspotter/
  data/
    scams.json     the scam data (9 entries)
  index.html       page structure
  style.css        mobile-first styles
  script.js        data loading, components, search and filter
  README.md
```

## Features

### Week 1

**Search.** The search box filters scams as you type. It ignores capital letters and extra spaces, and checks the scam name, description and channel. An empty search shows all scams, and a search with no matches shows a helpful message.

**Channel filter.** The chips (All, SMS, Email, WhatsApp, Phone Call) show only scams from that channel. Search and filter work together.

### Week 2

**Data from a JSON file.** Scams are loaded from `data/scams.json` with `async/await` and `fetch`, instead of being typed into the script.

**Every state is handled:**

| State | When it appears | What the user sees |
|---|---|---|
| Loading | While the file is being fetched | "Loading scams..." |
| Empty | The file loads but has no usable scams | "No scams are available yet. Please check back soon." |
| No results | Search or filter matches nothing | A message showing what was typed, with a suggestion |
| Error | The file is missing or the request fails | A friendly message and a **Retry** button |

**Safe against bad data.** Entries that are missing a name, description, severity or valid channel are skipped, so one broken entry cannot crash the page.

## Component map

Each piece of the page is built by one function that takes data in and returns an element. Nothing is copy-pasted.

| Component | Takes in | Builds | Used by |
|---|---|---|---|
| `createCard(scam)` | one scam object | a full scam card (`article`) | `render()` |
| `createIcon(channel)` | a channel name | the channel icon box | `createCard` |
| `createTag(severity)` | "High" or "Medium" | the coloured severity tag | `createCard` |
| `createButton(label, className, onClick)` | text, a CSS class, a click handler | a `button` | `createCard`, `showStatus` |
| `showStatus(type, message, retryHandler)` | state type, text, optional retry function | the loading, empty or error box | `loadScams()` |

**Other functions**

| Function | Job |
|---|---|
| `loadScams()` | Fetches the JSON file and sets the loading, empty or error state |
| `isValidScam(item)` | Checks one entry has everything a card needs |
| `getVisibleScams()` | Returns the scams that match the search text and selected channel |
| `render()` | Draws the cards and the result count, or the no-results message |

**State** lives in three variables at the top of `script.js`: `scams` (the loaded data), `searchText` and `activeFilter`. Every change updates one of these and then calls `render()`.

## Accessibility

- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`, `button`, `label`
- Labelled search field and visible focus outlines on every interactive element
- Skip link for keyboard users
- Loading, empty and error messages are announced to screen readers (`role="status"`)
- Filter chips use `aria-pressed` to show which one is selected
- Text colours meet at least 4.5:1 contrast on the dark background
- Mobile-first layout: 1 column on phones, 2 on tablets (768px and up), 3 on desktop (992px and up)

## Week 1 feedback and what I changed

No formal feedback was given after the Week 1 demo, Instead I reviewed my own work and fixed what I found:

| What I found | What I changed |
|---|---|
| Filter chips were cut off at 375px wide | Chips now wrap onto a second line |
| Search placeholder text was clipped on phones | Shortened it and added an ellipsis for long text |
| A wrong symbol showed next to the button arrow | Fixed the text encoding (see issue 2) |
| Scam data was hard-coded in the script | Moved it into a JSON file loaded with `fetch` |

## Issue log

| # | Problem | Cause | Options considered | Fix |
|---|---|---|---|---|
| 1 | Console error: `null is not an object` and no cards showed | `index.html` was missing the `scam-container` element the script looks for | Add a null check in the script, or fix the HTML | Fixed the HTML so the ids match the script |
| 2 | A strange "a" and stacked lines appeared next to "View details" | The arrow symbol was read with the wrong text encoding | Replace the arrow with plain ">" or write it as a code | Wrote it as `\u2192` and added `charset="UTF-8"` to the script tag |
| 3 | WhatsApp and Phone Call chips were cut off at 375px | The chip row scrolled sideways and hid items | Make chips smaller, or let them wrap | Used `flex-wrap: wrap` so all chips show |
| 4 | The end of the search placeholder ("phishing") was clipped | The text was too long for the box at 375px | Smaller font, or shorter text | Shortened the placeholder and added `text-overflow: ellipsis` |
| 5 | CSS changes did not appear in Safari | The browser was using a cached copy of the old file | Wait, or force a fresh load | Emptied the cache and did a hard refresh |
| 6 | `git push` said there was no upstream branch | First push needed the branch linked to GitHub | Use the long or short flag | Ran `git push -u origin main` once |

## Declaration

The code was written and tested by me. The visual layout reference was generated with ChatGPT. I used Claude for guidance, explanations and debugging help. Libraries used: Bootstrap 5.3.3 (from a CDN) for the container and utility classes.

## Roadmap

- **Week 3:** scam detail page with red flags and what to do, a "page not found" view, a watchlist saved with `localStorage`, an accessibility check with before and after scores, and automated tests.
