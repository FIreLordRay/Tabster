// Shared between background.js, popup.js, and options.js (classic scripts, no bundler).
// Rules are data, not code — new categories/domains are added by editing storage
// (via the options page), never by touching this logic.

const DEFAULT_RULES = [
  { category: "Development", color: "blue", domains: [
    "github.com", "gitlab.com", "stackoverflow.com", "npmjs.com", "developer.mozilla.org",
    "codepen.io", "replit.com", "bitbucket.org", "dev.to", "hashnode.com", "vercel.com",
    "netlify.com", "digitalocean.com", "aws.amazon.com", "console.cloud.google.com",
    "portal.azure.com", "docker.com", "hub.docker.com", "kubernetes.io", "postman.com",
    "figma.com", "jsfiddle.net", "codesandbox.io", "atlassian.com", "sourceforge.net",
    "pypi.org", "rubygems.org", "crates.io", "news.ycombinator.com", "w3schools.com",
    "geeksforgeeks.org", "leetcode.com", "hackerrank.com", "realpython.com",
  ], keywords: ["localhost", "127.0.0.1"] },
  { category: "AI Tools", color: "purple", domains: [
    "chatgpt.com", "claude.ai", "openai.com", "anthropic.com", "perplexity.ai",
    "gemini.google.com", "huggingface.co", "poe.com", "you.com", "copilot.microsoft.com",
    "character.ai", "midjourney.com", "stability.ai", "runwayml.com",
  ], keywords: [] },
  { category: "Social", color: "pink", domains: [
    "twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com", "tiktok.com",
    "linkedin.com", "pinterest.com", "snapchat.com", "threads.net", "quora.com", "tumblr.com",
  ], keywords: [] },
  { category: "Video & Media", color: "red", domains: [
    "youtube.com", "netflix.com", "twitch.tv", "hulu.com", "vimeo.com", "spotify.com",
    "disneyplus.com", "max.com", "primevideo.com", "soundcloud.com", "pandora.com",
    "tunein.com", "dailymotion.com",
  ], keywords: [] },
  { category: "Shopping", color: "orange", domains: [
    "amazon.com", "ebay.com", "etsy.com", "walmart.com", "target.com", "bestbuy.com",
    "wayfair.com", "aliexpress.com", "costco.com", "homedepot.com", "chewy.com",
  ], keywords: [] },
  { category: "Productivity", color: "green", domains: [
    "docs.google.com", "calendar.google.com", "notion.so", "trello.com", "asana.com",
    "monday.com", "clickup.com", "airtable.com", "miro.com", "todoist.com", "evernote.com",
    "canva.com", "sheets.google.com", "slides.google.com",
  ], keywords: [] },
  { category: "Communication", color: "grey", domains: [
    "slack.com", "zoom.us", "teams.microsoft.com", "discord.com", "web.whatsapp.com",
    "web.telegram.org", "skype.com", "meet.google.com",
  ], keywords: [] },
  { category: "Cloud Storage", color: "green", domains: [
    "drive.google.com", "dropbox.com", "onedrive.live.com", "icloud.com", "box.com", "mega.nz",
    "sharepoint.com", "officeapps.live.com",
  ], keywords: [] },
  { category: "Finance", color: "yellow", domains: [
    "paypal.com", "venmo.com", "chase.com", "bankofamerica.com", "wellsfargo.com",
    "capitalone.com", "coinbase.com", "robinhood.com", "mint.intuit.com", "creditkarma.com",
    "americanexpress.com",
  ], keywords: [] },
  { category: "Travel & Maps", color: "orange", domains: [
    "maps.google.com", "booking.com", "airbnb.com", "expedia.com", "kayak.com", "uber.com",
    "lyft.com", "tripadvisor.com", "southwest.com", "delta.com", "united.com",
  ], keywords: [] },
  { category: "Learning & Reference", color: "purple", domains: [
    "wikipedia.org", "coursera.org", "udemy.com", "edx.org", "freecodecamp.org",
    "khanacademy.org", "brilliant.org", "duolingo.com",
  ], keywords: [] },
  { category: "Email", color: "yellow", domains: [
    "mail.google.com", "gmail.com", "outlook.com", "outlook.office.com", "outlook.office365.com",
    "outlook.live.com", "mail.yahoo.com", "protonmail.com",
  ], keywords: [] },
  { category: "News", color: "cyan", domains: [
    "cnn.com", "nytimes.com", "bbc.com", "reuters.com", "apnews.com", "theguardian.com",
    "washingtonpost.com", "foxnews.com", "npr.org", "bloomberg.com", "techcrunch.com",
    "theverge.com", "wired.com", "arstechnica.com",
  ], keywords: [] },
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
