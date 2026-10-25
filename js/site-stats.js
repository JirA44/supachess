/* Affiche le compteur global de comptes créés dans le Hub SupaChess. */
(function () {
  "use strict";

  var output = document.getElementById("registered-members-count");
  if (!output) return;

  function unavailable() {
    output.textContent = "Membres inscrits : indisponible";
  }

  try {
    if (typeof firebase === "undefined" || !firebase.firestore) {
      unavailable();
      return;
    }

    var config = {
      apiKey: "AIzaSyA8duVGo5Vgzn7VXyDTJcdkvThVElYmTss",
      authDomain: "chessnova.firebaseapp.com",
      projectId: "chessnova",
      storageBucket: "chessnova.firebasestorage.app",
      messagingSenderId: "260734552934",
      appId: "1:260734552934:web:c2bf0995c1dd72d87896a7"
    };

    var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    firebase.firestore(app).collection("site_stats").doc("counters").onSnapshot(function (snapshot) {
      var count = snapshot.exists ? snapshot.data().registered_users : null;
      if (!Number.isSafeInteger(count) || count < 0) {
        unavailable();
        return;
      }
      output.textContent = "Membres inscrits : " + new Intl.NumberFormat("fr-FR").format(count);
    }, unavailable);
  } catch (_error) {
    unavailable();
  }
})();
