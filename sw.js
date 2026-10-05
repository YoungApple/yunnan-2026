const CACHE_NAME = "yunnan-2026-bespoke-v10";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/tailwindcss.min.js",
  "./vendor/leaflet.css",
  "./vendor/leaflet.js",
  "./photos/manifest.json",
  "./photos/d1_lijiang_ancient_town.svg",
  "./photos/d2_baisha_shambhala.svg",
  "./photos/d3_laoyaoshan_hutiaoxia.svg",
  "./photos/d4_haba_black_lake.svg",
  "./photos/d6_wudihu_alpine_lake.svg",
  "./photos/d7_balagezong_canyon.svg",
  "./photos/d9_meili_sunrise_kongqueshan.svg",
  "./photos/d10_nanjiluo_nine_lakes.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("vibe_status.json") || event.request.url.includes("custom_tracks.json") || event.request.url.includes("ntfy.sh")) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
