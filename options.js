const categoriesEl = document.getElementById("categories");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const savedNote = document.getElementById("savedNote");

let rules = [];

function renderCard(rule) {
  const card = document.createElement("div");
  card.className = "category-card";
  card.innerHTML = `
    <div class="row">
      <span class="dot c-${rule.color}"></span>
      <input type="text" class="name-input" value="${escapeAttr(rule.category)}" placeholder="Category name" />
      <select class="color-select">
        ${VALID_GROUP_COLORS.map((c) => `<option value="${c}" ${c === rule.color ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <button class="remove-btn" title="Remove category">✕</button>
    </div>
    <div class="field-label">Domains (one per line)</div>
    <textarea class="domains-input">${escapeHtml(rule.domains.join("\n"))}</textarea>
    <div class="field-label">Keywords (optional, one per line)</div>
    <textarea class="keywords-input">${escapeHtml(rule.keywords.join("\n"))}</textarea>
  `;

  card.querySelector(".remove-btn").addEventListener("click", () => {
    card.remove();
  });
  card.querySelector(".color-select").addEventListener("change", (e) => {
    card.querySelector(".dot").className = `dot c-${e.target.value}`;
  });

  return card;
}

function loadRules() {
  getSettings().then((settings) => {
    rules = settings.rules;
    categoriesEl.innerHTML = "";
    rules.forEach((rule) => categoriesEl.appendChild(renderCard(rule)));
  });
}

function collectRulesFromDom() {
  return Array.from(categoriesEl.querySelectorAll(".category-card"))
    .map((card) => {
      const name = card.querySelector(".name-input").value.trim();
      if (!name) return null;
      const domains = card
        .querySelector(".domains-input").value
        .split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const keywords = card
        .querySelector(".keywords-input").value
        .split("\n").map((s) => s.trim()).filter(Boolean);
      const color = card.querySelector(".color-select").value;
      return { category: name, color, domains, keywords };
    })
    .filter(Boolean);
}

addCategoryBtn.addEventListener("click", () => {
  const newRule = { category: "New Category", color: "grey", domains: [], keywords: [] };
  const card = renderCard(newRule);
  categoriesEl.appendChild(card);
  card.querySelector(".name-input").focus();
  card.querySelector(".name-input").select();
});

saveBtn.addEventListener("click", () => {
  const updated = collectRulesFromDom();
  saveSettings({ rules: updated }).then(() => {
    savedNote.hidden = false;
    setTimeout(() => (savedNote.hidden = true), 1500);
  });
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Reset all categories to the built-in defaults? This discards your custom rules.")) return;
  saveSettings({ rules: DEFAULT_RULES }).then(loadRules);
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;");
}

loadRules();
