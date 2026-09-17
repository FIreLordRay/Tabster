importScripts("rules.js");

let sortTimer = null;
let sortInFlight = null;
let sortAgainRequested = false;

function scheduleSort(delayMs = 700) {
  if (sortTimer) clearTimeout(sortTimer);
  sortTimer = setTimeout(() => {
    sortTimer = null;
    runSort();
  }, delayMs);
}

// Auto-sort (debounced) and a manual "Sort now" can otherwise overlap: both
// snapshot chrome.tabGroups.query() before either finishes creating a group,
// so each creates its own same-titled group instead of sharing one. Coalesce
// concurrent calls into a single run, queuing at most one more after it.
function runSort() {
  if (sortInFlight) {
    sortAgainRequested = true;
    return sortInFlight;
  }
  sortInFlight = sortAllWindows().finally(() => {
    sortInFlight = null;
    if (sortAgainRequested) {
      sortAgainRequested = false;
      runSort();
    }
  });
  return sortInFlight;
}

// Tab groups are window-scoped in Chrome, so scaling to many tabs/windows
// means grouping per-window and batching one chrome.tabs.group() call per
// category per window, instead of one call per tab.
async function sortAllWindows() {
  const settings = await getSettings();
  const windows = await chrome.windows.getAll({ populate: true });

  for (const win of windows) {
    if (win.type !== "normal") continue;
    await sortWindow(win.id, win.tabs, settings);
  }
}

async function sortWindow(windowId, tabs, settings) {
  const byCategory = new Map();
  for (const tab of tabs) {
    if (tab.pinned) continue;
    const category = categorizeTab(tab.url, tab.title, settings.rules);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(tab.id);
  }

  const existingGroups = await chrome.tabGroups.query({ windowId });
  const groupByTitle = new Map(existingGroups.map((g) => [g.title, g.id]));

  for (const [category, tabIds] of byCategory) {
    if (tabIds.length === 0) continue;
    const existingGroupId = groupByTitle.get(category);
    try {
      if (existingGroupId != null) {
        await chrome.tabs.group({ tabIds, groupId: existingGroupId });
      } else {
        const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
        await chrome.tabGroups.update(groupId, {
          title: category,
          color: colorForCategory(category, settings.rules),
        });
      }
    } catch (err) {
      // A tab can vanish mid-batch (closed by the user); skip and keep going.
      console.warn("Tabster: failed to group", category, err);
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings); // materializes defaults on first install
});

chrome.tabs.onCreated.addListener(async () => {
  const { autoSort } = await getSettings();
  if (autoSort) scheduleSort();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete" && !changeInfo.url) return;
  const { autoSort } = await getSettings();
  if (autoSort) scheduleSort();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SORT_NOW") {
    runSort().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
  if (message.type === "GET_TAB_SUMMARY") {
    getTabSummary().then(sendResponse);
    return true;
  }
});

async function getTabSummary() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});
  const groups = new Map();

  for (const tab of tabs) {
    if (tab.pinned) continue;
    const category = categorizeTab(tab.url, tab.title, settings.rules);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title || tab.url || "Untitled",
      url: tab.url || "",
      favIconUrl: tab.favIconUrl || "",
    });
  }

  const result = Array.from(groups.entries()).map(([category, items]) => ({
    category,
    color: colorForCategory(category, settings.rules),
    tabs: items,
  }));
  result.sort((a, b) => b.tabs.length - a.tabs.length);
  return { groups: result, total: tabs.length, autoSort: settings.autoSort };
}
