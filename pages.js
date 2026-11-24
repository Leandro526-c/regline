// Pages annexes de regline.ch : retient la langue choisie et propose celle du navigateur (sans rediriger).
"use strict";
(function () {
  const LANGS = ["fr", "en", "de", "it", "es"];
  const HINTS = {"fr": "Lire cette page en français", "en": "Read this page in English", "de": "Diese Seite auf Deutsch lesen", "it": "Leggi questa pagina in italiano", "es": "Leer esta página en español"};
  const lang = document.documentElement.lang;
  const root = document.documentElement.dataset.root || "";
  const page = location.pathname.split("/").pop() || "";
  const read = () => { try { const v = localStorage.getItem("regline-lang"); return LANGS.includes(v) ? v : ""; } catch (e) { return ""; } };
  const save = v => { try { localStorage.setItem("regline-lang", v); } catch (e) { /* stockage bloqué */ } };
  const pageIn = l => root + (l === "fr" ? "" : l + "/") + page + location.hash;

  document.querySelectorAll(".langs a[data-lang]").forEach(a => a.addEventListener("click", () => save(a.dataset.lang)));

  // Arrivée de l'extérieur sur une page française alors qu'une autre langue a été choisie : on y va.
  const fromOutside = !document.referrer || new URL(document.referrer).host !== location.host;
  const saved = read();
  if (lang === "fr" && fromOutside && saved && saved !== "fr") { location.replace(pageIn(saved)); return; }

  let other = "";
  for (const l of navigator.languages || [navigator.language || ""]) {
    const short = String(l).slice(0, 2).toLowerCase();
    if (LANGS.includes(short)) { other = short; break; }
  }
  const bar = document.getElementById("lang-hint");
  if (!bar || saved || !other || other === lang) return;
  bar.innerHTML = `<a href="${pageIn(other)}" lang="${other}">${HINTS[other]}</a><button type="button" aria-label="×">×</button>`;
  bar.querySelector("a").addEventListener("click", () => save(other));
  bar.querySelector("button").addEventListener("click", () => { bar.hidden = true; save(lang); });
  bar.hidden = false;
})();
