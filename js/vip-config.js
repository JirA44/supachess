/* Configuration VIP SupaChess.
 *
 * IMPORTANT — les liens de paiement sont volontairement VIDES.
 * Hugop doit y coller les vrais liens (Payment Links Stripe, PayPal, etc.)
 * avant toute mise en ligne. Tant qu'un lien est vide, le bouton de paiement
 * l'explique honnêtement à l'utilisateur : aucun paiement n'est simulé.
 */
(function () {
  "use strict";

  window.SupaVipConfig = {
    checkout: {
      monthly: "",
      yearly: "",
      lifetime: "",
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
