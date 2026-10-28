# ScamSpotter

A quick-reference guide to common online scams, built for everyday internet users and small business owners who want to recognise scam messages and calls before they lose money.

**Track:** Frontend Development (BuildLab)
**Built by:** Ndabai Daniella Chiderah
**Live site:** https://chi-dan-ux.github.io/scamspotter/
**Walkthrough video:** https://drive.google.com/file/d/1_I68i1BImjWpBSBMJLdD36-LXk99zrcD/view?usp=drivesdk

## The problem

People lose money to scam messages because they cannot tell a real message from a fake one, and they do not know what to do after receiving one. Advice exists, but it is spread across bank notices, news articles and government pages, and it is rarely quick to scan on a phone.

## What it does

- Browse common scams and filter them by channel (SMS, email, WhatsApp, phone call)
- Search by name, description or channel
- Open any scam to see how to spot it (red flags) and what to do
- Save scams to a personal watchlist that is remembered after the page is closed
- Open a scam directly from its address, for example `#/scam/3`

## Stack

HTML, CSS, Bootstrap 5.3.3 (from a CDN, used only for the container and a few utility classes) and plain JavaScript. There are no frameworks, and no plugins for the search, filter, routing or data logic. Tests use Vitest and jsdom.

## Setup and how to run

1. Clone this repo.
2. Open the folder in VS Code and start it with the **Live Server** extension (right-click `index.html`, then **Open with Live Server**).

Do not open `index.html` by double-clicking it. The page loads its data with `fetch`, and browsers block that for files opened straight from disk.

### Run the tests

1. Run `npm install` once.
2. Run `npm test`.

All 8 tests should pass.

## Project structure

```
scamspotter/
  data/
    scams.json         the scam data (9 entries)
  tests/
    app.test.js        automated tests (Vitest + jsdom)
  index.html           page structure and the four views
  style.css            mobile-first styles
  script.js            data loading, components, routing, search, filter, watchlist
  package.json         test setup
  README.md
```

## Architecture

```
scams.json --fetch--> loadScams() --> scams (state)
                                         |
user actions --> searchText / activeFilter / favourites (state)
                                         |
URL hash --> route() --> shows one of four views and draws it
```

**Four views** share one page, and `route()` shows one at a time based on the address after the `#`:

| Address | View |
|---|---|
| `#/` | List with search and filter |
| `#/scam/3` | Detail page for scam 3 (works as a direct link) |
| `#/watchlist` | Saved scams |
| anything else | "Page not found" |

**State** is kept in a few variables at the top of `script.js`: `scams` (the loaded data), `loadState` (loading, ready, empty or error), `searchText`, `activeFilter` and `favourites` (the saved ids, mirrored in `localStorage`). Every change updates one of these and then redraws the affected view.

### Component map

Each piece of the page is built by one function that takes data in and returns an element. Nothing is copy-pasted.

| Component | Takes in | Builds | Used by |
|---|---|---|---|
| `createCard(scam)` | one scam | a scam card (`article`) | list and watchlist views |
| `createIcon(channel)` | a channel name | the channel icon box | `createCard`, `renderDetail` |
| `createTag(severity)` | "High" or "Medium" | the severity tag | `createCard`, `renderDetail` |
| `createSaveButton(scam)` | one scam | the Save / Saved toggle button | `createCard`, `renderDetail` |
| `createButton(label, className, onClick)` | text, class, handler | a `button` | `showStatus` |
| `showStatus(type, message, retryHandler)` | state type, text, optional retry | the loading, empty or error box | `loadScams()` |
| `renderDetail(scam)` | one scam | the full detail page content | `route()` |
| `renderWatchlist()` | nothing (reads state) | the saved cards or the empty message | `route()` |

**Logic functions:** `loadScams()` fetches and checks the data, `isValidScam()` and `normaliseScam()` keep bad entries from breaking the page, `getVisibleScams()` applies search and filter, `render()` draws the list, `parseRoute()` and `route()` handle navigation, and `toggleFavourite()` updates the watchlist.

## Every state is handled

| State | When it appears | What the user sees |
|---|---|---|
| Loading | While the data is being fetched | "Loading scams..." |
| Empty | The file loads but has no usable scams | "No scams are available yet." |
| No results | Search or filter matches nothing | A message showing what was typed, with a suggestion |
| Error | The file is missing or the request fails | A friendly message and a **Retry** button |
| Empty watchlist | Nothing saved yet | A message and a link back to the list |
| Not found | A bad address, or a scam that does not exist | "Page not found" with a link back |

## Key decisions

- **Plain JavaScript, no framework.** The project is small, and building the routing and state by hand made it clear how they work.
- **Hash routing (`#/scam/3`).** GitHub Pages is a static host with no server rules, so addresses with a `#` work as direct links without any extra setup.
- **Data in a JSON file.** Content can be edited without touching the code, and the same data feeds the list, the detail page and the watchlist.
- **Safe rendering.** Cards are built with `textContent`, not by pasting strings into HTML, so nothing typed by a user can inject markup.
- **Defensive data and storage.** Entries missing required fields are skipped, and every `localStorage` call is wrapped so private browsing or corrupted data cannot crash the page.
- **Real links for navigation.** "View details" is an `<a>` link, so it works with the keyboard and can be opened in a new tab.
- **Focus management.** After changing view, keyboard focus moves to the new heading and the tab title updates.

## Accessibility

- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`, `button`, `label`
- Labelled search field, skip link, and visible focus outlines on every interactive element
- Loading, empty and error messages are announced to screen readers (`role="status"`)
- Filter chips and Save buttons use `aria-pressed`; the current page is marked with `aria-current`
- Text colours meet at least 4.5:1 contrast on the dark background
- Mobile-first layout: 1 column on phones, 2 on tablets (768px and up), 3 on desktop (992px and up)

### Results

| Check | Before | After |
|---|---|---|
| PageSpeed Insights (Lighthouse), mobile accessibility | 100 | 100 |
| PageSpeed Insights (Lighthouse), desktop accessibility | 100 | 100 |
| Keyboard-only walkthrough of the whole flow | Passed | Passed |

The automated score was already 100 before any extra fixes, so it could not improve. Automated tools only catch part of the problems, so I also tested the full flow with the keyboard alone: skip link, search, filter, opening a scam, saving it, the watchlist, and back.

## Tests

8 automated tests run with Vitest and jsdom against the real `index.html` and `script.js`, using their own small set of test data.

| Area | What is checked |
|---|---|
| Component | `createCard` builds a card with the name, severity and a link to the right detail address |
| Interaction | Search ignores capitals and extra spaces; "no results" message; channel filter and `aria-pressed` |
| Data states | Error with Retry (and recovery after Retry); empty data message |
| Routing and state | A direct link opens the right scam; a bad address shows "Page not found"; saving updates `localStorage` and the nav badge |

## Known limitations

- The scam content is general awareness advice, not legal or financial advice, and it can go out of date because it is a static file.
- The watchlist is saved in the browser only, so it does not follow the user to another device.
- Performance: PageSpeed reports render-blocking CSS (mostly Bootstrap from a CDN) and unused CSS. Bootstrap is used for very little, so removing it is the next optimisation. GitHub Pages controls server speed and caching.
- Automated checks and a keyboard-only test were done, but a full screen-reader test is still to do.
- Hash addresses are less tidy than normal paths and are not ideal for search engines.
- Only 9 scams and English-only content.

## Week 1 feedback and what I changed

No formal feedback was given after the Week 1 demo, and the mentor advised me to continue. Instead I reviewed my own work and fixed what I found:

| What I found | What I changed |
|---|---|
| Filter chips were cut off at 375px wide | Chips now wrap onto a second line |
| Search placeholder text was clipped on phones | Shortened it and added an ellipsis for long text |
| A wrong symbol showed next to the button arrow | Fixed the text encoding (issue 2) |
| Scam data was hard-coded in the script | Moved it into a JSON file loaded with `fetch` |

## Issue log

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | Console error `null is not an object`, and no cards showed | `index.html` was missing the element the script looks for | Fixed the HTML so the ids match the script |
| 2 | A strange symbol appeared next to "View details" | The arrow was read with the wrong text encoding | Wrote it as `\u2192` and added `charset="UTF-8"` to the script tag |
| 3 | WhatsApp and Phone Call chips cut off at 375px | The chip row scrolled sideways and hid items | Used `flex-wrap` so all chips show |
| 4 | The end of the search placeholder was clipped | Text too long for the box at 375px | Shortened it and added `text-overflow: ellipsis` |
| 5 | CSS changes did not appear in Safari | The browser used a cached copy | Emptied the cache and did a hard refresh |
| 6 | `git push` said there was no upstream branch | First push needed the branch linked to GitHub | Ran `git push -u origin main` once |
| 7 | The skip link would have broken the router | It changes the `#` address, which the router reads as a bad page | The skip link now moves focus without changing the address |
| 8 | First test run: the watchlist badge test failed | The test looked for the wrong element id | Corrected the id in the test; the app was fine |

## Technical reflection

[Paste your final technical reflection here. A draft is in your Week 3 document.]

## Declaration

I used Claude (Anthropic) throughout this project for planning, explanations, debugging, and for drafting parts of the code and tests, which I reviewed, ran and adapted. The visual layout reference was generated with ChatGPT. The scam descriptions and advice are general awareness content written from commonly published guidance. Libraries and tools: Bootstrap 5.3.3 (CDN), Vitest and jsdom (testing).
