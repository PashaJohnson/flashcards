// Vocab — Word of the Day
// Scriptable widget for Pasha's personal vocab deck.
// Setup: install Scriptable (App Store) → new script → paste this in →
// add a Scriptable widget to the home screen → choose this script.
// Medium size recommended (fits the definition). Tapping opens the app.

const DECK_URL = "https://pashajohnson.github.io/flashcards/vocab.json";
const APP_URL = "https://pashajohnson.github.io/flashcards/personal-vocab.html";

// App palette
const BG = new Color("#EDE7DC");
const CARD = new Color("#1D1D1F");
const GOLD = new Color("#C9982F");
const INK_SOFT = new Color("#17171A", 0.62);

const words = await loadWords();
const { word, def, index, total } = wordOfTheDay(words);

const widget = makeWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();

/* ---------------- data ---------------- */

async function loadWords() {
  const fm = FileManager.local();
  const cachePath = fm.joinPath(fm.cacheDirectory(), "vocab-cache.json");
  try {
    const data = await new Request(DECK_URL).loadJSON();
    if (Array.isArray(data) && data.length) {
      fm.writeString(cachePath, JSON.stringify(data));
      return data;
    }
    throw new Error("empty deck");
  } catch (e) {
    if (fm.fileExists(cachePath)) return JSON.parse(fm.readString(cachePath));
    return [["Offline", "Couldn't load the vocab list — check your connection and tap to retry."]];
  }
}

function wordOfTheDay(list) {
  // Deterministic shuffle with a fixed seed: the daily sequence feels random
  // but every word appears exactly once before the deck cycles.
  const shuffled = seededShuffle(list, 20260712);
  const now = new Date();
  // days since epoch in LOCAL time, so the word flips at local midnight
  const days = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  const i = days % shuffled.length;
  return { word: shuffled[i][0], def: shuffled[i][1], index: i + 1, total: shuffled.length };
}

function seededShuffle(list, seed) {
  const rand = mulberry32(seed);
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- UI ---------------- */

function makeWidget() {
  const family = config.widgetFamily || "medium";
  const small = family === "small";

  const w = new ListWidget();
  w.backgroundColor = CARD;
  w.url = APP_URL;
  w.setPadding(small ? 12 : 16, small ? 12 : 18, small ? 12 : 16, small ? 12 : 18);

  // refresh at next local midnight
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  w.refreshAfterDate = tomorrow;

  const header = w.addStack();
  header.centerAlignContent();
  const label = header.addText("WORD OF THE DAY");
  label.font = Font.boldSystemFont(small ? 8 : 9);
  label.textColor = GOLD;
  if (!small) {
    header.addSpacer();
    const count = header.addText(index + " / " + total);
    count.font = Font.mediumSystemFont(9);
    count.textColor = new Color("#F3EEE4", 0.42);
  }

  w.addSpacer(small ? 6 : 8);

  const wordText = w.addText(word);
  wordText.font = Font.heavySystemFont(small ? 20 : 26);
  wordText.textColor = new Color("#F3EEE4");
  wordText.minimumScaleFactor = 0.6;
  wordText.lineLimit = 1;

  w.addSpacer(small ? 4 : 6);

  const defText = w.addText(def);
  defText.font = Font.mediumSystemFont(small ? 10 : 12);
  defText.textColor = new Color("#F3EEE4", 0.72);
  defText.minimumScaleFactor = 0.75;
  defText.lineLimit = small ? 4 : 3;

  w.addSpacer();
  return w;
}
