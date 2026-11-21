/**
 * Curated food photography for Swift Campus Feast.
 *
 * All images are stable images.unsplash.com photo IDs — no backend endpoints,
 * no remote placeholder services. These are illustrative stock photographs,
 * not photos of actual Dunnkayce menu items. FoodImage falls back to
 * FOOD_FALLBACK_SVG if a photo ever fails to load.
 */

const UNSPLASH_BASE = "https://images.unsplash.com/";

const photo = (id, width = 800) => `${UNSPLASH_BASE}${id}?auto=format&fit=crop&w=${width}&q=80`;

export const FOOD_PHOTOS = {
  rice: [
    photo("photo-1512058564366-18510be2db19"),
    photo("photo-1603133872878-684f208fb84b"),
    photo("photo-1589302168068-964664d93dc0"),
    photo("photo-1476124369491-e7addf5db371"),
  ],
  swallow: [
    photo("photo-1504674900247-0877df9cc836"),
    photo("photo-1490645935967-10de6ba17061"),
    photo("photo-1482049016688-2d3e1b311543"),
    photo("photo-1540420773420-3366772f4999"),
  ],
  protein: [
    photo("photo-1555939594-58d7cb561ad1"),
    photo("photo-1529692236671-f1f6cf9683ba"),
    photo("photo-1600891964599-f61ba0e24092"),
    photo("photo-1519708227418-c8fd9a32b7a2"),
  ],
  soup: [
    photo("photo-1547592180-85f173990554"),
    photo("photo-1547592166-23ac45744acd"),
    photo("photo-1604908176997-125f25cc6f3d"),
    photo("photo-1569718212165-3a8278d5f624"),
  ],
  snack: [
    photo("photo-1568901346375-23c9450c58cd"),
    photo("photo-1513104890138-7c749659a591"),
    photo("photo-1551024506-0bccd828d307"),
    photo("photo-1571091718767-18b5b1457add"),
  ],
  drink: [
    photo("photo-1505252585461-04db1eb84625"),
    photo("photo-1544145945-f90425340c7e"),
    photo("photo-1437418747212-8d9709afab22"),
    photo("photo-1495474472287-4d71bcdd2085"),
  ],
};

export const FOOD_HIGHLIGHTS = [
  {
    name: "Jollof Rice",
    category: "rice",
    src: FOOD_PHOTOS.rice[1],
  },
  {
    name: "Grilled Protein",
    category: "protein",
    src: FOOD_PHOTOS.protein[0],
  },
  {
    name: "Egusi Soup",
    category: "soup",
    src: FOOD_PHOTOS.soup[0],
  },
  {
    name: "Pounded Yam",
    category: "swallow",
    src: FOOD_PHOTOS.swallow[0],
  },
  {
    name: "Puff-Puff",
    category: "snack",
    src: FOOD_PHOTOS.snack[2],
  },
  {
    name: "Zobo Drink",
    category: "drink",
    src: FOOD_PHOTOS.drink[0],
  },
];

const CATEGORY_KEYWORDS = {
  rice: ["jollof", "rice", "pilau", "risotto"],
  swallow: ["swallow", "pounded", "yam", "fufu", "eba", "amala", "banku", "cassava", "starch"],
  protein: [
    "chicken",
    "beef",
    "meat",
    "goat",
    "fish",
    "suya",
    "shawarma",
    "turkey",
    "protein",
    "grilled",
  ],
  soup: ["soup", "egusi", "okra", "banga", "stew", "sauce", "pepper soup", "draw soup"],
  snack: [
    "snack",
    "puff",
    "cake",
    "pizza",
    "burger",
    "samosa",
    "plantain",
    "chips",
    "pastry",
    "bread",
  ],
  drink: [
    "drink",
    "zobo",
    "juice",
    "smoothie",
    "tea",
    "coffee",
    "water",
    "soda",
    "beverage",
    "lemonade",
  ],
};

const ALL_PHOTOS = Object.values(FOOD_PHOTOS).flat();

function hashString(value) {
  let hash = 2166136261; // FNV-1a
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Pick a deterministic photo for a food name (or `{ name, seed }` object).
 * The same name always maps to the same image, with or without a seed.
 */
export function getFoodPhoto(foodOrName) {
  const source = typeof foodOrName === "string" ? { name: foodOrName } : (foodOrName ?? {});
  const name = String(source.name ?? source.title ?? source.foodName ?? source.label ?? "").trim();
  const seed = source.seed == null ? "" : String(source.seed);
  const haystack = `${name} ${source.category ?? ""}`.toLowerCase();
  const hash = hashString(`${name.toLowerCase()}|${seed}`);

  const category = Object.entries(CATEGORY_KEYWORDS).find(([, words]) =>
    words.some((word) => haystack.includes(word)),
  )?.[0];

  const pool = category && FOOD_PHOTOS[category]?.length ? FOOD_PHOTOS[category] : ALL_PHOTOS;

  return pool[hash % pool.length];
}

const PLATE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="dk-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef7ee"/>
      <stop offset="1" stop-color="#f8f3df"/>
    </linearGradient>
    <linearGradient id="dk-plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e6eee5"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#dk-bg)"/>
  <ellipse cx="200" cy="164" rx="152" ry="120" fill="#1b5138" opacity="0.08"/>
  <circle cx="200" cy="150" r="118" fill="url(#dk-plate)" stroke="#1b5138" stroke-opacity="0.18" stroke-width="4"/>
  <circle cx="200" cy="150" r="94" fill="none" stroke="#1b5138" stroke-opacity="0.10" stroke-width="2"/>
  <path d="M120 166c8-38 40-63 80-63s72 25 80 63c-20 26-48 38-80 38s-60-12-80-38z" fill="#eec257"/>
  <path d="M137 163c14-24 36-38 63-38s49 14 63 38c-18 16-38 24-63 24s-45-8-63-24z" fill="#f8dc8b"/>
  <path d="M158 138c14-10 30-14 46-12m-52 30c18 8 38 10 56 4" fill="none" stroke="#d3a13b" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
  <path d="M262 108c14-14 32-16 46-6-6 18-22 28-40 26z" fill="#3f9b5c"/>
  <path d="M252 126c16-6 34-2 44 10-14 12-32 12-46 2z" fill="#2f7d4a"/>
  <path d="M104 132c-8-16-4-32 8-42 12 12 14 28 6 42z" fill="#4bab68"/>
  <circle cx="150" cy="112" r="9" fill="#d9534f"/>
  <circle cx="244" cy="182" r="8" fill="#d9534f"/>
  <text x="200" y="278" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#1b5138" opacity="0.55">DUNNKAYCE</text>
</svg>`;

export const FOOD_FALLBACK_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  PLATE_SVG,
)}`;
