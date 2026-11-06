// Site de Regline : langue, boutons de téléchargement, animations.
// Les fichiers viennent de la dernière « Release » GitHub : rien à modifier ici à chaque nouvelle version.
"use strict";

const REPO = "Leandro526-c/regline";
const RELEASES = `https://github.com/${REPO}/releases`;
const LANGS = ["fr", "en", "de", "it", "es"];
const DICT = window.REGLINE_I18N || {};

// ── Langue ───────────────────────────────────────────────────────────────
const FR = {};  // le texte français est celui de la page
document.querySelectorAll("[data-i18n]").forEach(el => { FR[el.dataset.i18n] = el.innerHTML; });
Object.assign(FR, (DICT.fr || {}));
let lang = "fr";

function T(key) {
  return (DICT[lang] && DICT[lang][key]) || FR[key] || key;
}

function pickLanguage() {
  const asked = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(asked)) return asked;
  try { const saved = localStorage.getItem("regline-lang"); if (LANGS.includes(saved)) return saved; } catch (e) { /* stockage bloqué */ }
  for (const l of navigator.languages || [navigator.language || "fr"]) {
    const short = String(l).slice(0, 2).toLowerCase();
    if (LANGS.includes(short)) return short;
  }
  return "en";
}

function applyLanguage(next) {
  lang = next;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = T(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-label]").forEach(el => el.setAttribute("aria-label", T(el.dataset.i18nLabel)));
  document.title = T("meta.title");
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = T("meta.description");
  document.getElementById("lang").value = lang;
  setVideos();
  renderDownloads();
  renderGallery();
  drawPlot(false);
  formatDigits();
}

document.getElementById("lang").addEventListener("change", event => {
  try { localStorage.setItem("regline-lang", event.target.value); } catch (e) { /* stockage bloqué */ }
  applyLanguage(event.target.value);
});

// ── Téléchargement ───────────────────────────────────────────────────────
const TARGETS = {
  windows: { match: /Windows-Setup\.exe$/i },
  macArm: { match: /Darwin-arm64\.(dmg|zip)$/i },
  macIntel: { match: /Darwin-x86_64\.(dmg|zip)$/i },
  linux: { match: /Linux-x86_64\.tar\.gz$/i },
};
const STORE = "https://apps.microsoft.com/detail/9NDTFSHNBRNZ";
let release = null;
const assets = {};

function detectOS() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "mac";
  if (/Linux|X11/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return "other";
}

// Un Mac Apple Silicon se reconnaît à sa carte graphique « Apple M… » (sinon : on propose les deux versions).
function macChip() {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
    if (/Apple (M\d|GPU)/i.test(renderer)) return "arm";
    if (/Intel|AMD|Radeon/i.test(renderer)) return "intel";
  } catch (e) { /* pas de WebGL */ }
  return "";
}

const OS = detectOS();
const CHIP = OS === "mac" ? macChip() : "";

function mainKeys() {
  if (OS === "mac") return CHIP === "intel" ? ["macIntel", "macArm"] : ["macArm", "macIntel"];
  if (OS === "linux") return ["linux"];
  return ["store"];
}

function downloadButton(key, secondary) {
  const a = document.createElement("a");
  a.className = "download" + (secondary ? " secondary" : "");
  a.href = key === "store" ? STORE : (assets[key] || RELEASES);
  if (key === "store") { a.target = "_blank"; a.rel = "noopener"; }
  a.innerHTML = `${T("dl." + key)}<small>${T("dl." + key + ".s")}</small>`;
  return a;
}

function renderDownloads() {
  const primary = document.getElementById("primary");
  const others = document.getElementById("others");
  const notice = document.getElementById("notice");
  primary.textContent = "";
  others.textContent = "";
  const keys = mainKeys();
  keys.forEach((key, i) => primary.appendChild(downloadButton(key, i > 0 && OS === "mac" && CHIP !== "")));
  if (keys.includes("store")) {
    // Le Store en premier ; l'installateur reste proposé (PC où le Store est bloqué).
    const exe = document.createElement("a");
    exe.className = "exe-link";
    exe.href = assets.windows || RELEASES;
    exe.textContent = T("dl.exe");
    primary.appendChild(exe);
  }
  others.append(T("dl.others"));
  Object.keys(TARGETS).filter(k => !keys.includes(k) && !(k === "windows" && keys.includes("store"))).forEach(key => {
    const a = document.createElement("a");
    a.href = key === "windows" ? STORE : (assets[key] || RELEASES);
    a.textContent = T("dl." + key + ".short");
    others.appendChild(a);
  });
  // Un fichier manque dans la version publiée : on le dit plutôt que d'envoyer vers une page sans explication.
  const missing = release ? keys.filter(k => k !== "store" && !assets[k]) : [];
  notice.hidden = missing.length === 0;
  if (missing.length) notice.innerHTML = T("dl.missing").replace("{name}", missing.map(k => T("dl." + k + ".short")).join(", ")).replace("{url}", RELEASES);
  const version = document.getElementById("version");
  const foot = document.getElementById("foot-version");
  if (release) {
    const number = release.tag_name.replace(/^v/, "");
    const date = new Date(release.published_at || release.created_at);
    const when = isNaN(date) ? "" : " · " + date.toLocaleDateString(lang === "en" ? "en-GB" : lang + "-CH", { day: "numeric", month: "long", year: "numeric" });
    version.innerHTML = `${T("dl.version")} ${number}${when} · <a href="${release.html_url}">${T("dl.notes")}</a>`;
    foot.textContent = `${T("dl.version")} ${number} · `;
  } else {
    version.textContent = "";
    foot.textContent = "";
  }
}

async function loadRelease() {
  try {
    // Liste des versions (et pas seulement « latest ») : les pré-versions comptent aussi.
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`);
    release = response.ok ? (await response.json()).find(r => !r.draft && r.assets.length) || null : null;
    if (release) {
      for (const [key, target] of Object.entries(TARGETS)) {
        const asset = release.assets.find(a => target.match.test(a.name));
        if (asset) assets[key] = asset.browser_download_url;
      }
    }
  } catch (error) { /* sans réseau ou quota GitHub atteint : les boutons mènent à la page des versions */ }
  renderDownloads();
}

// ── Onglets d'installation ───────────────────────────────────────────────
function showPanel(os) {
  document.querySelectorAll("#os-tabs [data-os]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.os === os)));
  document.querySelectorAll("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== os; });
}
document.querySelectorAll("#os-tabs [data-os]").forEach(b => b.addEventListener("click", () => showPanel(b.dataset.os)));
showPanel(OS === "other" ? "windows" : OS);

// ── Vidéos ───────────────────────────────────────────────────────────────
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIDEOS = { "v-coller": "demo-coller", "v-formule": "demo-formule" };

function setVideos() {
  for (const [id, name] of Object.entries(VIDEOS)) {
    const video = document.getElementById(id);
    const base = `media/${lang}/${name}`;
    if (video.dataset.base === base) continue;
    video.dataset.base = base;
    video.poster = base + "-poster.jpg";
    video.innerHTML = `<source src="${base}.mp4" type="video/mp4">`;
    video.load();
    if (reduced) { video.removeAttribute("autoplay"); video.pause(); }
  }
  document.querySelectorAll(".replay").forEach(updateVideoButton);
}

function updateVideoButton(button) {
  const video = document.getElementById(button.dataset.video);
  button.textContent = video.paused ? T("video.play") : T("video.pause");
}

document.querySelectorAll(".replay").forEach(button => {
  const video = document.getElementById(button.dataset.video);
  button.addEventListener("click", () => {
    if (video.paused) { delete video.dataset.userPaused; video.play().catch(() => {}); }
    else { video.dataset.userPaused = "1"; video.pause(); }
  });
  video.addEventListener("play", () => updateVideoButton(button));
  video.addEventListener("pause", () => updateVideoButton(button));
});

// Les vidéos hors de l'écran sont mises en pause (batterie, processeur).
if ("IntersectionObserver" in window && !reduced) {
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) { if (!video.dataset.userPaused) video.play().catch(() => {}); }
    else video.pause();
  }), { threshold: 0.25 });
  Object.keys(VIDEOS).forEach(id => watcher.observe(document.getElementById(id)));
}

// ── Graphique du héros : mesures, barres d'erreur, ajustement qui se dessine ──
const POINTS = [[0.2, 0.83], [0.3, 1.20], [0.4, 1.62], [0.5, 1.99], [0.6, 2.41], [0.7, 2.80], [0.8, 3.18], [0.9, 3.62], [1.0, 3.99]];
const SLOPE = 3.999;

function drawPlot(play) {
  const svg = document.getElementById("plot");
  const X = x => 70 + (x - 0.1) / 1.0 * 410;
  const Y = y => 320 - (y - 0.4) / 4.0 * 290;
  const n = (v, d) => v.toLocaleString(lang === "en" ? "en-GB" : lang + "-CH", { minimumFractionDigits: d, maximumFractionDigits: d });
  let out = `<path class="axis" d="M70 30 V320 H490"/>`;
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(t => { out += `<text class="tick" x="${X(t)}" y="342" text-anchor="middle">${n(t, 1)}</text><path class="axis" d="M${X(t)} 320 v5"/>`; });
  [1, 2, 3, 4].forEach(t => { out += `<text class="tick" x="58" y="${Y(t) + 4}" text-anchor="end">${t}</text><path class="axis" d="M65 ${Y(t)} h5"/>`; });
  out += `<text class="tick" x="490" y="366" text-anchor="end">L [m]</text><text class="tick" x="70" y="20" text-anchor="middle">T² [s²]</text>`;
  out += `<path class="band" d="M${X(0.15)} ${Y(SLOPE * 0.15) - 9} L${X(1.05)} ${Y(SLOPE * 1.05) - 13} L${X(1.05)} ${Y(SLOPE * 1.05) + 13} L${X(0.15)} ${Y(SLOPE * 0.15) + 9}Z"/>`;
  out += `<path class="fit" d="M${X(0.15)} ${Y(SLOPE * 0.15)} L${X(1.05)} ${Y(SLOPE * 1.05)}"/>`;
  POINTS.forEach(([x, y], i) => {
    const e = 0.06 + 0.04 * x;
    const delay = `style="animation-delay:${(0.15 + i * 0.1).toFixed(2)}s"`;
    out += `<path class="bar" ${delay} d="M${X(x)} ${Y(y + e)} V${Y(y - e)} M${X(x) - 5} ${Y(y + e)} h10 M${X(x) - 5} ${Y(y - e)} h10"/>`;
    out += `<circle class="pt" ${delay} cx="${X(x)}" cy="${Y(y)}" r="6"/>`;
  });
  out += `<g class="res"><text class="lab2" x="96" y="56">${T("plot.slope")}</text>`;
  out += `<text class="lab" x="96" y="80">a = (${n(3.999, 3)} ± ${n(0.018, 3)}) s²/m</text>`;
  out += `<rect class="chip" x="96" y="92" width="150" height="26" rx="13"/><text class="chiptext" x="171" y="110" text-anchor="middle">χ²${T("plot.red")} ${n(0.92, 2)}</text>`;
  out += `<text class="lab2" x="486" y="302" text-anchor="end">g = 4π²/a = (${n(9.872, 3)} ± ${n(0.044, 3)}) m/s²</text></g>`;
  svg.innerHTML = out;
  svg.classList.toggle("play", !!play && !reduced);
}

// ── Comparaison des chiffres (verts = justes, rouges = faux) ────────────
function formatDigits() {
  const comma = lang !== "en";
  document.querySelectorAll(".digits[data-value]").forEach(el => {
    const value = el.dataset.value, ref = el.dataset.ref;
    const show = c => (c === "." && comma ? "," : c);
    if (!ref) { el.textContent = [...value].map(show).join(""); return; }
    let wrong = false, html = "";
    [...value].forEach((c, i) => {
      if (c !== ref[i]) wrong = true;
      html += `<span class="${wrong ? "ko" : "ok"}">${show(c)}</span>`;
    });
    el.innerHTML = html;
  });
  document.querySelectorAll(".unc").forEach(el => {
    if (!el.dataset.i18n) el.textContent = comma ? el.textContent.replace(".", ",") : el.textContent.replace(",", ".");
  });
}

// Les chiffres s'écrivent un par un quand la comparaison arrive à l'écran.
function typeDigits() {
  if (reduced) return;
  document.querySelectorAll("#compare .digits").forEach((el, row) => {
    const spans = el.querySelectorAll("span");
    const items = spans.length ? [...spans] : [];
    items.forEach(s => { s.style.visibility = "hidden"; });
    items.forEach((s, i) => setTimeout(() => { s.style.visibility = ""; }, 250 + row * 450 + i * 70));
  });
}

// ── Galerie ──────────────────────────────────────────────────────────────
const GALLERY = ["bode", "enzyme", "hall", "two_methods", "beer_lambert", "stats"];
const SLIDE_MS = 6500;
let current = 0, timer = null, userStopped = false;

function renderGallery() {
  const tabs = document.getElementById("gal-tabs");
  const stage = document.getElementById("stage");
  tabs.textContent = "";
  stage.textContent = "";
  GALLERY.forEach((key, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = T(`gal.${key}.tab`);
    b.addEventListener("click", () => { userStopped = true; show(i); });
    tabs.appendChild(b);
    const fig = document.createElement("figure");
    fig.innerHTML = `<img src="media/${lang}/galerie-${key}.webp" alt="${T(`gal.${key}.t`)}" loading="${i ? "lazy" : "eager"}" width="1200" height="1159">`;
    stage.appendChild(fig);
  });
  show(current);
}

function show(i) {
  current = (i + GALLERY.length) % GALLERY.length;
  const key = GALLERY[current];
  document.querySelectorAll("#gal-tabs button").forEach((b, k) => {
    b.setAttribute("aria-selected", String(k === current));
    b.style.setProperty("--slide", userStopped ? "0s" : SLIDE_MS + "ms");
  });
  document.querySelectorAll("#stage figure").forEach((f, k) => f.classList.toggle("on", k === current));
  document.getElementById("gal-field").textContent = T(`gal.${key}.f`);
  document.getElementById("gal-title").textContent = T(`gal.${key}.t`);
  document.getElementById("gal-desc").textContent = T(`gal.${key}.d`);
  clearTimeout(timer);
  if (!userStopped && !reduced) timer = setTimeout(() => show(current + 1), SLIDE_MS);
}
if (reduced) userStopped = true;
const galleryEl = document.getElementById("galerie");
galleryEl.addEventListener("mouseenter", () => { clearTimeout(timer); galleryEl.classList.add("paused"); });
galleryEl.addEventListener("mouseleave", () => { galleryEl.classList.remove("paused"); if (!userStopped && !reduced) timer = setTimeout(() => show(current + 1), SLIDE_MS / 2); });

// ── Apparitions et barre du haut ─────────────────────────────────────────
if ("IntersectionObserver" in window) {
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("in");
    if (entry.target.id === "compare") typeDigits();
    seen.unobserve(entry.target);
  }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight) seen.observe(el);  // déjà visible au chargement : rien à animer
  });
}
const topBar = document.getElementById("top");
addEventListener("scroll", () => topBar.classList.toggle("scrolled", scrollY > 8), { passive: true });

// ── Démarrage ────────────────────────────────────────────────────────────
applyLanguage(pickLanguage());
drawPlot(true);
loadRelease();
