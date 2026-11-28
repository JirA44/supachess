/* Configuration VIP SupaChess.
 *
 * Liens de paiement Stripe LIVE (Payment Links crees le 28/11/2026 via l'API
 * Stripe, compte live). Montants alignes sur les offres affichees ci-dessous.
 * Le portail client est gere par Stripe (configuration bpc_1UghNLQ6hTr1mXdff8AvbHEC).
 * L'URL de connexion "no-code" n'est pas exposee par l'API : Hugop doit copier
 * le lien "Portail client" depuis Dashboard Stripe > Settings > Billing > Customer portal.
 */
(function () {
  "use strict";

  window.SupaVipConfig = {
    checkout: {
      monthly: "https://buy.stripe.com/3cIeVf2AUgpddYJeeS6sw00",
      yearly: "https://buy.stripe.com/7sYeVfcbugpdf2N0o26sw01",
      lifetime: "https://buy.stripe.com/8x28wRdfyb4T4o9fiW6sw02",
      portal: "",
    },
    offers: [
      { id: "monthly", label: "SupaChess VIP · mensuel", price: "4,99 € / mois", priceValue: 4.99, period: "mois", badge: "Sans engagement" },
      { id: "yearly", label: "SupaChess VIP · annuel", price: "34,99 € / an", priceValue: 34.99, period: "an", badge: "2 mois offerts" },
      { id: "lifetime", label: "SupaChess VIP · à vie", price: "60 €", priceValue: 60, period: "une fois", badge: "Paiement unique" },
    ],
    features: {
      "champion-metrics": { label: "Analyse de corpus PGN (précision et ACPL)" },
      "detailed-metrics": { label: "Métriques détaillées par demi-coup" },
      "engine-arrows": { label: "Flèches du moteur toujours affichées" },
    },
    legalUrl: "mentions-legales.html",
    supportNote: "SupaChess reste gratuit pour les fonctions essentielles : jeu, revue de partie, leçons et classement.",
  };
})();
