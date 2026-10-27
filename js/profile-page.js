/* In-page SupaChess profile and sign-in flow. */
(function () {
  "use strict";

  const button = document.getElementById("topbar-profile-btn");
  if (!button) return;

  const firebaseConfig = {
    apiKey: "AIzaSyA8duVGo5Vgzn7VXyDTJcdkvThVElYmTss",
    authDomain: "chessnova.firebaseapp.com",
    projectId: "chessnova",
    storageBucket: "chessnova.firebasestorage.app",
    messagingSenderId: "260734552934",
    appId: "1:260734552934:web:c2bf0995c1dd72d87896a7"
  };

  let auth = null;
  let database = null;
  try {
    if (typeof firebase === "undefined" || !firebase.auth || !firebase.firestore) {
      throw new Error("Les services de compte ne sont pas disponibles.");
    }
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    auth = firebase.auth(app);
    database = firebase.firestore(app);
    if (window.SupaProfiles) window.SupaProfiles.init(auth, database);
  } catch (error) {
    console.error("SupaChess profile initialization failed:", error);
  }

  function closeProfileDialog() {
    const overlay = document.getElementById("profile-modal");
    if (overlay) overlay.remove();
  }

  function makeOverlay(title, body) {
    closeProfileDialog();
    const overlay = document.createElement("div");
    overlay.id = "profile-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title);
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;overflow:auto";
    const box = document.createElement("section");
    box.style.cssText = "background:#1a1f2e;color:#f5f7fa;border:1px solid #4facfe;border-radius:16px;padding:24px;width:min(680px,100%);max-height:90vh;overflow:auto;position:relative;box-shadow:0 18px 60px rgba(0,0,0,.55)";
    box.innerHTML = '<button type="button" data-profile-close aria-label="Fermer le profil" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#bbb;font-size:26px;cursor:pointer">×</button><div data-profile-dialog-content></div>';
    box.querySelector("[data-profile-dialog-content]").append(body);
    overlay.appendChild(box);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeProfileDialog();
    });
    box.querySelector("[data-profile-close]").addEventListener("click", closeProfileDialog);
    document.addEventListener("keydown", onEscape);
    document.body.appendChild(overlay);
    const focusTarget = overlay.querySelector("input,button");
    if (focusTarget) focusTarget.focus();
    return overlay;
  }

  function onEscape(event) {
    if (event.key === "Escape") {
      closeProfileDialog();
      document.removeEventListener("keydown", onEscape);
    }
  }

  function showNotice(message, isError) {
    const target = document.querySelector("#profile-modal [data-profile-error]");
    if (!target) return;
    target.textContent = message;
    target.style.color = isError ? "#ff9292" : "#9be3b1";
  }

  function firebaseErrorMessage(error) {
    const code = error && error.code;
    const messages = {
      "auth/invalid-email": "Vérifie l’adresse e-mail.",
      "auth/user-not-found": "Aucun compte ne correspond à cette adresse.",
      "auth/wrong-password": "Le mot de passe est incorrect.",
      "auth/invalid-credential": "L’adresse e-mail ou le mot de passe est incorrect.",
      "auth/email-already-in-use": "Cette adresse possède déjà un compte.",
      "auth/weak-password": "Choisis un mot de passe d’au moins 6 caractères.",
      "auth/popup-closed-by-user": "La fenêtre Google a été fermée avant la connexion.",
      "auth/network-request-failed": "Connexion impossible. Vérifie ton accès à Internet."
    };
    return messages[code] || "La connexion a échoué. Réessaie dans un instant.";
  }

  function showLoading() {
    const text = document.createElement("p");
    text.textContent = "Chargement du profil…";
    text.setAttribute("role", "status");
    makeOverlay("Mon profil SupaChess", text);
  }

  function waitForCurrentUser() {
    if (!auth) return Promise.resolve(null);
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolve) => {
      let settled = false;
      let unsubscribe = function () {};
      const finish = (user) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(user || null);
      };
      unsubscribe = auth.onAuthStateChanged(finish, () => finish(null));
      window.setTimeout(() => finish(auth.currentUser), 5000);
    });
  }

  function openAccountProfile(user) {
    if (!user || !window.SupaProfiles) {
      renderSignIn();
      return;
    }
    showLoading();
    Promise.resolve(window.SupaProfiles.ensureUserProfile(user))
      .then(() => window.SupaProfiles.getProfile(user.uid))
      .then((profile) => {
        if (profile) window.SupaProfiles.renderProfileModal(profile);
        else window.SupaProfiles.renderOwnProfileFallback(user);
        const overlay = document.getElementById("profile-modal");
        if (overlay) {
          overlay.setAttribute("role", "dialog");
          overlay.setAttribute("aria-modal", "true");
          overlay.setAttribute("aria-label", "Mon profil SupaChess");
        }
      })
      .catch(() => window.SupaProfiles.renderOwnProfileFallback(user));
  }

  function renderSignIn(mode) {
    mode = mode || "login";
    const wrapper = document.createElement("div");
    wrapper.innerHTML = '<div style="text-align:center;padding:8px 8px 16px"><div style="font-size:32px" aria-hidden="true">♞</div><h2 style="margin:4px 0 6px">Profil SupaChess</h2><p style="margin:0;opacity:.78">Connecte-toi pour retrouver ton profil, tes statistiques et ta progression.</p></div>' +
      '<div role="tablist" aria-label="Compte" style="display:flex;gap:8px;margin:0 0 12px">' +
      '<button type="button" data-profile-mode="login" class="btn">Se connecter</button>' +
      '<button type="button" data-profile-mode="register" class="btn">Créer un compte</button></div>' +
      '<form data-profile-form style="display:grid;gap:10px">' +
      '<label>Adresse e-mail<input data-profile-email type="email" autocomplete="email" required style="display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:10px;border-radius:8px"></label>' +
      '<label>Mot de passe<input data-profile-password type="password" autocomplete="current-password" minlength="6" required style="display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:10px;border-radius:8px"></label>' +
      '<button data-profile-submit type="submit" class="btn">Se connecter</button>' +
      '<button data-profile-reset type="button" class="btn">Mot de passe oublié ?</button>' +
      '<div style="display:flex;align-items:center;gap:8px;opacity:.7"><span style="height:1px;background:#777;flex:1"></span><span>ou</span><span style="height:1px;background:#777;flex:1"></span></div>' +
      '<button data-profile-google type="button" class="btn">Continuer avec Google</button>' +
      '<p data-profile-error role="status" aria-live="polite" style="min-height:1.3em;margin:0"></p></form>';
    const overlay = makeOverlay("Connexion au profil SupaChess", wrapper.firstElementChild);
    const content = overlay.querySelector("[data-profile-dialog-content]");
    content.appendChild(wrapper.children[0]);
    const form = content.querySelector("[data-profile-form]");
    const submit = content.querySelector("[data-profile-submit]");
    const tabs = content.querySelectorAll("[data-profile-mode]");

    function setMode(next) {
      mode = next;
      submit.textContent = mode === "login" ? "Se connecter" : "Créer mon compte";
      content.querySelector("[data-profile-reset]").hidden = mode !== "login";
      content.querySelector("[data-profile-password]").autocomplete = mode === "login" ? "current-password" : "new-password";
      tabs.forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab.dataset.profileMode === mode));
      });
      showNotice("", false);
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.profileMode)));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = content.querySelector("[data-profile-email]").value.trim();
      const password = content.querySelector("[data-profile-password]").value;
      if (!auth) {
        showNotice("Le service de compte ne répond pas. Réessaie plus tard.", true);
        return;
      }
      submit.disabled = true;
      const action = mode === "login"
        ? auth.signInWithEmailAndPassword(email, password)
        : auth.createUserWithEmailAndPassword(email, password);
      action.then((credential) => openAccountProfile(credential.user))
        .catch((error) => showNotice(firebaseErrorMessage(error), true))
        .finally(() => { submit.disabled = false; });
    });
    content.querySelector("[data-profile-google]").addEventListener("click", () => {
      if (!auth) {
        showNotice("Le service de compte ne répond pas. Réessaie plus tard.", true);
        return;
      }
      auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then((credential) => openAccountProfile(credential.user))
        .catch((error) => showNotice(firebaseErrorMessage(error), true));
    });
    content.querySelector("[data-profile-reset]").addEventListener("click", () => {
      const email = content.querySelector("[data-profile-email]").value.trim();
      if (!email) {
        showNotice("Saisis ton adresse e-mail pour recevoir le lien de réinitialisation.", true);
        return;
      }
      auth.sendPasswordResetEmail(email)
        .then(() => showNotice("Lien de réinitialisation envoyé.", false))
        .catch((error) => showNotice(firebaseErrorMessage(error), true));
    });
    setMode(mode);
  }

  button.addEventListener("click", (event) => {
    event.preventDefault();
    showLoading();
    waitForCurrentUser().then((user) => {
      if (user) openAccountProfile(user);
      else renderSignIn();
    });
  });
})();
