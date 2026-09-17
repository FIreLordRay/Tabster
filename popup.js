const groupsEl = document.getElementById("groups");
const totalCountEl = document.getElementById("totalCount");
const emptyStateEl = document.getElementById("emptyState");
const autoSortToggle = document.getElementById("autoSortToggle");
const sortNowBtn = document.getElementById("sortNowBtn");
const optionsBtn = document.getElementById("optionsBtn");

const collapsedCategories = new Set();

function render(summary) {
  groupsEl.innerHTML = "";
  totalCountEl.textContent = summary.total ? `${summary.total} tabs` : "";
  autoSortToggle.checked = !!summary.autoSort;
  emptyStateEl.hidden = summary.groups.length > 0;

  for (const group of summary.groups) {
    const groupEl = document.createElement("div");
    groupEl.className = "group" + (collapsedCategories.has(group.category) ? " collapsed" : "");

    const header = document.createElement("div");
    header.className = "group-header";
    header.innerHTML = `
      <span class="dot c-${group.color}"></span>
      <span class="group-name">${escapeHtml(group.category)}</span>
      <span class="group-count">${group.tabs.length}</span>
      <span class="chevron">▾</span>
    `;
    header.addEventListener("click", () => {
      groupEl.classList.toggle("collapsed");
      if (groupEl.classList.contains("collapsed")) {
        collapsedCategories.add(group.category);
      } else {
        collapsedCategories.delete(group.category);
      }
    });

    const list = document.createElement("div");
    list.className = "tab-list";
    for (const tab of group.tabs) {
      const row = document.createElement("div");
      row.className = "tab-row";

      // Built via DOM properties, not innerHTML — favIconUrl and title come
      // from the page itself (attacker-controlled), and property assignment
      // (unlike string-concatenated HTML) never re-parses their content.
      const icon = document.createElement(tab.favIconUrl ? "img" : "span");
      icon.className = "favicon";
      if (tab.favIconUrl) icon.src = tab.favIconUrl;

      const titleSpan = document.createElement("span");
      titleSpan.className = "tab-title";
      titleSpan.textContent = tab.title;

      const closeBtn = document.createElement("button");
      closeBtn.className = "close-btn";
      closeBtn.title = "Close tab";
      closeBtn.textContent = "✕";

      row.append(icon, titleSpan, closeBtn);
      row.addEventListener("click", (e) => {
        if (e.target === closeBtn) return;
        activateTab(tab);
      });
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.tabs.remove(tab.id);
        row.remove();
      });
      list.appendChild(row);
    }

    groupEl.appendChild(header);
    groupEl.appendChild(list);
    groupsEl.appendChild(groupEl);
  }
}

function activateTab(tab) {
  chrome.tabs.update(tab.id, { active: true });
  chrome.windows.update(tab.windowId, { focused: true });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function refresh() {
  chrome.runtime.sendMessage({ type: "GET_TAB_SUMMARY" }, render);
}

sortNowBtn.addEventListener("click", () => {
  sortNowBtn.textContent = "Sorting…";
  chrome.runtime.sendMessage({ type: "SORT_NOW" }, () => {
    sortNowBtn.textContent = "Sort now";
    refresh();
  });
});

autoSortToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ autoSort: autoSortToggle.checked });
});

optionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

refresh();
