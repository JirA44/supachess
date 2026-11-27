/* SupaChess VIP — lecture seule du statut VIP et verrouillage des fonctions avancées.
 *
 * Le statut est lu dans Firestore (document users/{uid}, champ isVip).
 * Aucune écriture n'est faite depuis le navigateur : seul le prestataire de
 * paiement peut faire évoluer ce champ.
 */
(function () {
  "use strict";

  const config = window.SupaVipConfig || { checkout: {}, offers: [], features: {}, legalUrl: "mentions-legales.html" };
  let auth = null;
  let db = null;
  let vip = false;
  let checked = false;

  function isVip() {
    return vip === true;
  }

  function featureLabel(key) {
    const feature = config.features && config.features[key];
    return feature && feature.label ? feature.label : key;
  }

  function setVip(value) {
    vip = value === true;
    checked = true;
    window.isUserVip = vip;
    if (document.body && document.body.classList) document.body.classList.toggle("user-is-vip", vip);
    applyLocks();
    return vip;
  }

  function lockedElements() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-vip-required]"));
  }

  function applyLocks() {
    lockedElements().forEach((element) => {
      const key = element.getAttribute("data-vip-required");
      const locked = !isVip();
      element.setAttribute("data-vip-locked", locked ? "true" : "false");
      if (locked) {
        if (!element.getAttribute("title")) {
          element.setAttribute("title", "Fonction VIP : " + featureLabel(key));
        }
      }
    });
  }

  /* ── Modale d'offre ─────────────────────────────────────────────── */
  function ensureModal() {
    let overlay = document.getElementById("supachess-vip-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "supachess-vip-modal";
    overlay.className = "vip-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "supachess-vip-title");
    overlay.hidden = true;

    const offers = (config.offers || []).map((offer) => (
      '<button type="button" class="vip-offer" data-vip-offer="' + offer.id + '">' +
      '<span class="vip-offer-label">' + offer.label + "</span>" +
      '<span class="vip-offer-price">' + offer.price + "</span>" +
      '<span class="vip-offer-badge">' + offer.badge + "</span>" +
      "</button>"
    )).join("");

    overlay.innerHTML =
      '<div class="vip-modal">' +
      '<button type="button" class="vip-modal-close" data-vip-close aria-label="Fermer">×</button>' +
      '<h2 id="supachess-vip-title">SupaChess VIP</h2>' +
      '<p class="vip-modal-intro">' + (config.supportNote || "") + "</p>" +
      '<p class="vip-modal-feature">Débloqué : <strong data-vip-feature-label>' + featureLabel("champion-metrics") + "</strong></p>" +
      '<div class="vip-offers">' + offers + "</div>" +
      '<label class="vip-terms"><input type="checkbox" data-vip-terms> J\'accepte les <a href="' + config.legalUrl + '" target="_blank" rel="noopener">conditions générales de vente</a> et la politique de confidentialité.</label>' +
      '<button type="button" class="vip-pay" data-vip-pay disabled>Continuer vers le paiement</button>' +
      '<p class="vip-status" data-vip-status role="status" aria-live="polite"></p>' +
      "</div>";

    document.body.appendChild(overlay);

    const terms = overlay.querySelector("[data-vip-terms]");
    const pay = overlay.querySelector("[data-vip-pay]");
    const status = overlay.querySelector("[data-vip-status]");
    let selectedOffer = (config.offers && config.offers[0] && config.offers[0].id) || "";

    overlay.querySelectorAll("[data-vip-offer]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedOffer = button.getAttribute("data-vip-offer");
        overlay.querySelectorAll("[data-vip-offer]").forEach((other) => {
          other.setAttribute("aria-pressed", String(other === button));
        });
        status.textContent = "";
      });
    });
    if (overlay.querySelector('[data-vip-offer="' + selectedOffer + '"]')) {
      overlay.querySelector('[data-vip-offer="' + selectedOffer + '"]').setAttribute("aria-pressed", "true");
    }

    terms.addEventListener("change", () => {
      pay.disabled = !terms.checked;
      if (terms.checked) status.textContent = "";
    });

    pay.addEventListener("click", () => {
      const url = config.checkout && config.checkout[selectedOffer];
      if (!url) {
        status.textContent = "Le paiement n'est pas encore configuré sur cette version du site. Aucune transaction ne peut être lancée pour le moment.";
        return;
      }
      window.open(url, "_blank", "noopener");
    });

    overlay.querySelector("[data-vip-close]").addEventListener("click", () => { overlay.hidden = true; });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.hidden = true;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) overlay.hidden = true;
    });
    return overlay;
  }

  function openModal(featureKey) {
    const overlay = ensureModal();
    const label = overlay.querySelector("[data-vip-feature-label]");
    if (label) label.textContent = featureLabel(featureKey || "champion-metrics");
    overlay.hidden = false;
    const close = overlay.querySelector("[data-vip-close]");
    if (close && typeof close.focus === "function") close.focus();
  }

  /* Une fonction protégée est bloquée tant que l'utilisateur n'est pas VIP. */
  function requireFeature(featureKey) {
    if (isVip()) return true;
    openModal(featureKey);
    return false;
  }

  function bindLockedFeatures() {
    lockedElements().forEach((element) => {
      if (element.getAttribute("data-vip-bound") === "true") return;
      element.setAttribute("data-vip-bound", "true");
      element.addEventListener("click", (event) => {
        if (isVip()) return;
        const key = element.getAttribute("data-vip-required");
        if (element.getAttribute("data-vip-blocked") === "true") {
          event.preventDefault();
          event.stopPropagation();
          openModal(key);
          return;
        }
        // Contrôles de type checkbox / switch : on les neutralise et on ouvre l'offre.
        if (element.tagName === "INPUT" || element.getAttribute("role") === "switch") {
          event.preventDefault();
          event.stopPropagation();
          openModal(key);
        }
      });
    });
    applyLocks();
  }

  /* ── Lecture Firestore (lecture seule) ──────────────────────────── */
  function readVipStatus(user) {
    if (!db || !user || !user.uid) {
      setVip(false);
      return;
    }
    db.collection("users").doc(user.uid).get().then((doc) => {
      setVip(Boolean(doc && doc.exists && doc.data && doc.data().isVip === true));
    }).catch(() => {
      /* Échec silencieux : l'utilisateur reste en mode gratuit, sans erreur visible. */
      setVip(false);
    });
  }

  function connect() {
    const accounts = window.SupaAccounts;
    if (!accounts || !accounts.auth || !accounts.database) return false;
    auth = accounts.auth;
    db = accounts.database;
    return true;
  }

  function start() {
    if (!connect()) {
      setVip(false);
      return;
    }
    try {
      auth.onAuthStateChanged((user) => readVipStatus(user));
    } catch (_) {
      setVip(false);
    }
  }

  window.isUserVip = false;
  window.SupaVip = {
    isVip,
    requireFeature,
    openModal,
    refresh: start,
    isChecked: () => checked,
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target && event.target.closest ? event.target.closest("[data-vip-open]") : null;
    if (!trigger) return;
    event.preventDefault();
    openModal(trigger.getAttribute("data-vip-open") || "champion-metrics");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bindLockedFeatures(); start(); });
  } else {
    bindLockedFeatures();
    start();
  }
})();
