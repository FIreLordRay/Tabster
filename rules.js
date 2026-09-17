// Shared between background.js, popup.js, and options.js (classic scripts, no bundler).
// Rules are data, not code — new categories/domains are added by editing storage
// (via the options page), never by touching this logic.

const DEFAULT_RULES = [
  { category: "Development", color: "blue", domains: ["github.com", "gitlab.com", "stackoverflow.com", "npmjs.com", "developer.mozilla.org", "codepen.io", "replit.com", "bitbucket.org"], keywords: ["localhost", "127.0.0.1"] },
  { category: "AI Tools", color: "purple", domains: ["chatgpt.com", "claude.ai", "openai.com", "anthropic.com", "perplexity.ai", "gemini.google.com"], keywords: [] },
  { category: "Social", color: "pink", domains: ["twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com", "tiktok.com", "linkedin.com"], keywords: [] },
  { category: "Video & Media", color: "red", domains: ["youtube.com", "netflix.com", "twitch.tv", "hulu.com", "vimeo.com", "spotify.com"], keywords: [] },
  { category: "Shopping", color: "orange", domains: ["amazon.com", "ebay.com", "etsy.com", "walmart.com", "target.com"], keywords: [] },
  { category: "Productivity", color: "green", domains: ["docs.google.com", "drive.google.com", "notion.so", "trello.com", "slack.com", "calendar.google.com", "asana.com"], keywords: [] },
  { category: "Email", color: "yellow", domains: ["mail.google.com", "outlook.com", "outlook.office.com", "gmail.com"], keywords: [] },
  { category: "News", color: "cyan", domains: ["cnn.com", "nytimes.com", "bbc.com", "reuters.com", "apnews.com"], keywords: [] },
];

const DEFAULT_SETTINGS = { rules: DEFAULT_RULES, autoSort: true };

const VALID_GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, resolve);
  });
}

// Longest-matching-domain wins, so "mail.google.com" beats a hypothetical
// bare "google.com" rule instead of being shadowed by it.
function categorizeTab(url, title, rules) {
  if (!url) return "Other";
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }

  let best = null;
  for (const rule of rules) {
    for (const domain of rule.domains) {
      if (host === domain || host.endsWith("." + domain)) {
        if (!best || domain.length > best.domain.length) {
          best = { category: rule.category, domain };
        }
      }
    }
  }
  if (best) return best.category;

  const haystack = (host + " " + (title || "")).toLowerCase();
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (keyword && haystack.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return "Other";
}

function colorForCategory(category, rules) {
  const rule = rules.find((r) => r.category === category);
  return rule ? rule.color : "grey";
}
