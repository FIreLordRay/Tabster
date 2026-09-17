# Tabster

A browser extension that automatically groups your open tabs into color-coded
categories (Development, Social, AI Tools, Shopping, …) using Chrome's native
Tab Groups, plus a popup widget to browse, jump to, and close tabs by category.

## Install (unpacked, for now)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Pin the extension, then click its icon to open the widget.

## How it works

- **Categorization** is domain/keyword-based (see `rules.js` for the default
  rules) — no AI, no network calls, nothing leaves your browser.
- New tabs and URL changes trigger a debounced re-sort automatically (toggle
  this off from the popup if you'd rather sort manually).
- Rules live in `chrome.storage.sync`, editable from the ⚙ options page — add,
  rename, recolor, or delete categories without touching code.
- Grouping is done per-window in batched calls, so it stays fast regardless of
  how many tabs or windows you have open.

## Files

```
manifest.json     extension manifest (MV3)
rules.js          default categories + the categorization + storage logic (shared)
background.js     service worker: listens for tab events, does the grouping
popup.html/js/css the widget: category breakdown, jump-to-tab, close-tab
options.html/js/css   category/rule editor
```
