/* Live account and estimated unique-browser counters shared across SupaChess sites. */
(function () {
  "use strict";

  var accountOutput = document.getElementById("registered-members-count");
  var visitorOutput = document.getElementById("unique-visitors-count");
  var labels = {
    accounts: "Comptes inscrits",
    visitors: "Visiteurs uniques estimés"
  };

  function unavailable(output, label) {
    if (output) output.textContent = label + " : indisponible";
  }

  function showCount(output, label, value) {
    if (!output) return;
    if (!Number.isSafeInteger(value) || value < 0) {
      unavailable(output, label);
      return;
    }
    var locale = document.documentElement.lang === "en" ? "en-US" : "fr-FR";
    output.textContent = label + " : " + new Intl.NumberFormat(locale).format(value);
  }

  function trackVisit(database) {
    try {
      if (window.sessionStorage.getItem("cn_visit_tracked")) return;
      window.sessionStorage.setItem("cn_visit_tracked", "1");
    } catch (_error) {
      return;
    }

    var raw = [
      navigator.userAgent || "",
      screen.width + "x" + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      navigator.language || ""
    ].join("|");
    var hash = 0;
    for (var i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    var fingerprint = "v_" + Math.abs(hash).toString(36);
    var counters = database.collection("site_stats").doc("counters");
    counters.set({
      total_visits: firebase.firestore.FieldValue.increment(1)
    }, { merge: true }).catch(function () { });

    var visitor = database.collection("visitors").doc(fingerprint);
    visitor.get().then(function (snapshot) {
      if (snapshot.exists) {
        return visitor.update({
          last_visit: firebase.firestore.FieldValue.serverTimestamp(),
          visit_count: firebase.firestore.FieldValue.increment(1)
        });
      }
      return visitor.set({
        first_visit: firebase.firestore.FieldValue.serverTimestamp(),
        last_visit: firebase.firestore.FieldValue.serverTimestamp(),
        visit_count: 1
      }).then(function () {
        return counters.set({
          unique_visitors: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
      });
    }).catch(function () { });
  }

  try {
    if (typeof firebase === "undefined" || !firebase.firestore) {
      unavailable(accountOutput, labels.accounts);
      unavailable(visitorOutput, labels.visitors);
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
    var database = firebase.firestore(app);
    trackVisit(database);
    database.collection("site_stats").doc("counters").onSnapshot(function (snapshot) {
      if (!snapshot.exists) {
        unavailable(accountOutput, labels.accounts);
        unavailable(visitorOutput, labels.visitors);
        return;
      }
      var data = snapshot.data();
      showCount(accountOutput, labels.accounts, data.registered_users);
      showCount(visitorOutput, labels.visitors, data.unique_visitors);
    }, function () {
      unavailable(accountOutput, labels.accounts);
      unavailable(visitorOutput, labels.visitors);
    });
  } catch (_error) {
    unavailable(accountOutput, labels.accounts);
    unavailable(visitorOutput, labels.visitors);
  }
})();
