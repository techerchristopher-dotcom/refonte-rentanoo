# Audit tracking analytics — refonte Rentanoo
Date : 2026-06-28

## GA4 / Google Ads

- ID GTM : GT-TXZW7HG8 ✓ (chargé dans `index.html` ligne 61 et configuré dans `src/lib/analytics.ts` ligne 7)
- ID GA4 : G-WVKC4DHFL3 ✓ (routé via le conteneur GTM — chargement direct renvoie 404 Google, comportement normal et documenté)
- ID Ads : AW-17959989720 ✓ (présent dans `src/lib/analytics.ts` ligne 10, config différée via `ensureGoogleAdsConfig()`)

### Fonctions trackées (src/lib/analytics.ts)
- `trackGa4PageView(pagePath, pageTitle?)` — page_view manuel SPA
- `trackGa4Event(eventName, params?)` — événements custom
- `sendPurchaseConversion(params)` — conversion Google Ads achat
- `sendDepositConversion(params)` — conversion Google Ads caution
- Déduplication sessionStorage pour conversions (STORAGE_KEY_PURCHASE, STORAGE_KEY_DEPOSIT)
- Déduplication stripe redirect et payment_completed

### Fonctions trackées (src/lib/whatsappAnalytics.ts)
- `trackWhatsAppFabEvent(name, params?)` — events FAB WhatsApp + persistance API interne `/api/public/analytics/event`
- `trackPageViewEvent(pagePath, pageTitle?)` — page_view avec persistance interne
- Events : `whatsapp_fab_click`, `whatsapp_bubble_shown`, `whatsapp_fab_drag`, `whatsapp_pdp_click`

### Fonctions trackées (src/lib/bookingFunnelAnalytics.ts)
- `trackViewItem(params)` — view_item GA4 + ViewContent Meta, dédup sessionStorage
- `trackBeginCheckout(params)` — begin_checkout GA4 + InitiateCheckout Meta
- `trackBookingBlocked(params)` — booking_blocked GA4

## Meta Pixel

- ID : 1027447536915510 ✓ (init dans `index.html` ligne 79, noscript fallback ligne 103)
- Mode chargement : snippet inline asynchrone (standard Meta)

### Events (src/lib/metaPixel.ts)
- `trackMetaPageView()` — PageView (déclenché dans SPA à chaque route)
- `trackMetaViewContent(params)` — ViewContent (dédup par contentId, 1x/session)
- `trackMetaInitiateCheckout(params)` — InitiateCheckout (dédup par dedupId)
- `trackMetaSearchInitiateCheckout(params)` — InitiateCheckout sans dédup (recherches)
- `trackMetaContact()` — Contact (clic WhatsApp FAB ou fiche produit)
- `trackMetaLead()` — Lead (création réservation réussie)
- `trackMetaPurchase(params)` — Purchase (dédup par dedupId, 1x/session)

## Microsoft Clarity

- ID : xbpy3oop7z ✓ (chargé dans `index.html` lignes 85–91)
- Mode : passif (heatmaps, session replay — aucune intégration côté src/)

## Points d'attention post-déploiement

1. **Labels de conversion Google Ads** : `VITE_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE` et `VITE_GOOGLE_ADS_CONVERSION_LABEL_DEPOSIT` doivent être configurés en variables d'environnement. Si absents, les conversions Ads ne partiront pas (warning DEV uniquement).
2. **API interne analytics** : les événements WhatsApp sont envoyés à `/api/public/analytics/event` en plus de GA4. Vérifier que cet endpoint Railway est opérationnel en production.
3. **GA4 routing via GTM** : G-WVKC4DHFL3 ne doit PAS être utilisé directement dans gtag/js (404). Le conteneur GT-TXZW7HG8 route correctement vers GA4 + Google Ads — ne pas modifier.
4. **Déduplication sessionStorage** : les conversions achat/caution et Meta Pixel sont dédupliquées par session. Après un hard refresh, les événements peuvent se déclencher à nouveau — comportement voulu.
5. **WhatsApp tracking iOS** : le handler `onAvatarClick` ouvre le lien via `window.open()` synchrone (dans le même handler de clic) pour éviter que iOS suspende le tab et perde les beacons de tracking — ne pas réfactoriser en `async`.
6. **animate-ping WhatsApp FAB** : supprimé sous `prefers-reduced-motion` via `index.css` (#10.1) — vérifier visuellement sur iOS avec accessibilité "Réduire le mouvement" activée.
