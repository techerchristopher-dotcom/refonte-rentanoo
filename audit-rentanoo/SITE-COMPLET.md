# SITE-COMPLET.md — Audit exhaustif du codebase Rentanoo

> Généré le 2026-06-28 22:32 par 4 agents parallèles
> Projet : Rentanoo — marketplace location Nosy Be (Madagascar)
> Source : /Users/christopher/rentanoo-nosy-be-clean/

---

## TABLE DES MATIÈRES

1. [Partie A — Server / Lib / Utils / Hooks / Integrations / Contexts / Types / Config / Data / Services](#partie-a)
2. [Partie B — Pages](#partie-b)
3. [Partie C — Components](#partie-c)
4. [Partie D — Features / Modules / App.tsx / main.tsx](#partie-d)
5. [Partie E — i18n (4 langues : FR, EN, MG, DE)](#partie-e)

---

# PARTIE A — Server / Lib / Utils / Hooks / Integrations / Contexts / Types / Config / Data / Services

# Audit Codebase Rentanoo — Agent A
## Périmètre : server/, src/lib/, src/utils/, src/hooks/, src/integrations/, src/contexts/, src/types/, src/config/, src/constants/, src/data/, src/services/, src/mappers/, src/mocks/ + fichiers racine

---

## FICHIERS RACINE

### `/Users/christopher/rentanoo-nosy-be-clean/index.html`
**Description** : Point d'entrée HTML de la SPA. Définit les balises <head> complètes, les analytics inline, et les deux portails DOM supplémentaires.
**APIs externes** :
- Google Tag Manager / GA4 : `https://www.googletagmanager.com/gtag/js?id=GT-TXZW7HG8` (inline script)
- Meta Pixel (Facebook) : `https://connect.facebook.net/en_US/fbevents.js` (fbq init `1027447536915510`)
- Microsoft Clarity : `https://www.clarity.ms/tag/xbpy3oop7z`
**Événements trackés** : `PageView` Meta Pixel au chargement, `gtag('config', 'GT-TXZW7HG8')`
**UI texte visible** : `<title>Location scooter, moto, voiture & hébergement à Nosy Be | Rentanoo</title>`, meta description « Réservez en ligne scooter, moto, voiture ou hébergement à Nosy Be. Livraison à l'aéroport Fascène ou à votre hôtel. Assurance incluse. Plateforme 100 % en ligne. »
**Préconnexions** : `www.googletagmanager.com`, `tbsgzykqcksmqxpimwry.supabase.co` (Supabase prod), dns-prefetch `zykwfjxurwmputxwlkxs.supabase.co`
**Schema.org** : `TravelAgency` avec `areaServed: "Nosy Be, Madagascar"`, catalogue 4 types (scooter, moto, voiture, hébergement)
**OG/Twitter** : og:image = `og-rentanoo-nosy-be.webp`, twitter:card = `summary_large_image`, twitter:site = `@rentanoo`
**DOM** : `#root`, `#date-picker-portal`, `#radix-portal-root` (notranslate)
**Exports** : aucun

---

### `/Users/christopher/rentanoo-nosy-be-clean/package.json`
**Description** : Manifeste npm du projet. Monorepo frontend+serveur, Node ≥20, type module.
**Scripts clés** :
- `dev:local` : Express (PORT=3000) + Vite concurrents
- `dev:tenant` / `dev:owner` : contextes Supabase isolés (`VITE_APP_CONTEXT`)
- `start` / `start:prod` : `tsx server/index.ts`
- `prebuild` → `generate-sitemap.js`, `postbuild` → `generate-static-pages.js`
- `i18n:extract` : i18next-scanner
- `test:unit` : `src/utils/rentalPriceFromDates.test.ts`
**Dépendances principales** : `@supabase/supabase-js ^2.58`, `stripe ^19.2`, `@stripe/react-stripe-js ^5.3`, `@tanstack/react-query ^5.83`, `react-router-dom ^6.30`, `react-hook-form ^7.61`, `zod ^3.25`, `i18next ^23.15`, `react-i18next ^15.1`, `date-fns 3.6`, `recharts ^2.15`, `resend ^4.0`, `@google-analytics/data ^6.1`, `html2canvas ^1.4`, `jspdf ^3.0`
**DevDeps** : `express ^5.1`, `tsx ^4.20`, `vite ^5.4`, `@vitejs/plugin-react-swc`, `typescript ^5.8`, `tailwindcss ^3.4`, `sharp ^0.34`

---

### `/Users/christopher/rentanoo-nosy-be-clean/vite.config.ts`
**Description** : Config Vite. Dev server sur port `VITE_DEV_PORT` (défaut 3002). Proxy `/api` → `localhost:3000`. Alias `@` = `./src`.
**Build** : `experimentalMinChunkSize: 20_000` pour éviter 404 Safari mobile sur petits chunks après redéploiement.
**Plugins** : `@vitejs/plugin-react-swc`, `lovable-tagger` (dev uniquement)

---

## SERVER/

### `/Users/christopher/rentanoo-nosy-be-clean/server/index.ts` (1567 lignes)
**Description** : Serveur Express principal. En production, sert la SPA compilée + routes API. En développement, routes API uniquement (Vite dev server séparé).
**APIs externes appelées** :
- Stripe webhook (Stripe → Express) : `stripe.webhooks.constructEvent`
- n8n webhook : `POST https://n8n.instance/webhook/...` (10s timeout) pour contact form
- Resend : `POST https://api.resend.com/emails` pour notifications cart group
- AeroDataBox via RapidAPI (délégué à `nosyBeFlights.ts`)
- Open-Meteo (délégué à `nosyBeWeather.ts`)
- Frankfurter (délégué à `exchangeRateService.ts`)
**Routes exposées** :
- `POST /api/stripe/webhook` — Stripe webhook (signature `STRIPE_WEBHOOK_SECRET`)
  - `checkout.session.completed` : NEUTRALISÉ (log only, Edge Function canonique)
  - `payment_intent.succeeded/failed` : actifs pour claim charges booking
  - Extension payments (`type: "extension"`) : actifs
- `POST /api/deposit/create-setup-intent` — Stripe SetupIntent pour caution
- `POST /api/deposit/attach-payment-method` — Attache PM au customer Stripe
- `POST /api/bookings/:id/force-deposit` — Admin force dépôt
- `POST /api/contact` — Formulaire contact → n8n webhook
- `GET /api/health/email` — Test email (Resend)
- `GET /api/stripe-health` — Santé Stripe
- `GET /api/stripe/session-details` — Détails session Stripe pour page succès
- `POST /api/cart/notify` — Email groupe panier (Resend)
- `POST /api/checkin/start` — Démarrer checkin EDL
- `POST /api/checkin/saveDraft` — Sauvegarder draft EDL
- `POST /api/translate` — Traduction via MyMemory API (fr→en/de/it)
- `GET /api/health` — Santé générale
- `GET /sitemap.xml` — Sitemap dynamique
- Toutes les routes `/api/admin/*` et `/api/public/*` via `registerAdminRoutes()`
**Middleware** :
- OG Bot middleware : injecte og:image/title pour crawlers (Facebook, Twitter, LinkedIn, Slack, Discord, WhatsApp bot, Telegram bot, Google bot, iMessage)
- www → non-www 301 redirect
- `X-Robots-Tag: noindex` pour routes privées (auth, admin, booking flows, owner, profile, etc.)
- Compression gzip, CORS, JSON body parsing (10mb limit pour webhook raw)
- SPA fallback : `index.html` + `Cache-Control: no-store`
**Événements GA4** : aucun direct (tracking côté client)
**Exports** : Fichier d'entrée (non importé)

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/adminAuth.ts`
**Description** : Authentification admin côté serveur. Vérifie les colonnes `profiles.role`, `profiles.is_admin`, `profiles.admin_role` via `supabaseAdmin`.
**Exports** : `requireAdmin(req, supabaseAdmin): Promise<AdminAuthResult>` où `AdminAuthResult = { ok: boolean; userId?: string; error?: string }`
**Dépendances** : `@supabase/supabase-js` (service role client)

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/bookingClaimChargesSync.ts`
**Description** : Synchronisation des charges de réclamation (dommages) depuis les webhooks Stripe PaymentIntent.
**Exports** :
- `updateClaimChargeRowFromPaymentIntent(supabase, paymentIntentId, status, ...)`
- `reconcileClaimChargeFromWebhookPaymentIntent(supabase, paymentIntent)` — handler webhook pour `metadata.rentanoo_charge_type === "booking_claim"`
**Tables Supabase** : `booking_claim_charges`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/depositAuth.ts`
**Description** : Validation du JWT Supabase pour les routes deposit côté Express.
**Exports** : `getAuthUserFromRequest(req): Promise<AuthResult>` — crée un client Supabase éphémère avec le Bearer token, vérifie `getUser()`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/exchangeRateService.ts`
**Description** : Service taux de change EUR/MGA. Scheduler 6h. Persiste dans `platform_settings` (clé `eur_mga_exchange`).
**APIs externes** : `https://api.frankfurter.dev/v1/latest?from=EUR&to=MGA`
**Exports** :
- `fetchFrankfurterEurMga()` — fetch ponctuel
- `fetchFrankfurterEurMgaOnDate(date)` — taux historique
- `loadExchangeSettings(supabase)` / `saveExchangeSettings(supabase, settings)`
- `refreshLiveExchangeRate(supabase)` — force refresh Frankfurter
- `ensureLiveExchangeFresh(supabase)` — refresh si >6h
- `getExchangeRateTrend(supabase)` — tendance 7j (up/down/stable)
- `getExchangeRateHistory(supabase)` — historique 90j
- `startExchangeRateScheduler(supabase)` — interval 6h
**Cache** : 6h pour historique et tendance via variables module

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/ga4DataService.ts`
**Description** : Rapports GA4 via API Data (BetaAnalyticsDataClient). Utilise service account JSON.
**APIs externes** : `@google-analytics/data` (Google Analytics Data API v1 beta)
**Env vars** : `GA4_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`
**Exports** : `fetchGa4Report(days)` → `{ overview, topPages, trafficSources, countries, devices, daily }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/nosyBeFlights.ts`
**Description** : Données vols aéroport Nosy Be Fascène (IATA: NOS). Cache 12h. Forecast 7 jours.
**APIs externes** : `https://aerodatabox.p.rapidapi.com/flights/airports/iata/NOS/...` via RapidAPI
**Env vars** : `AERODATABOX_RAPIDAPI_KEY`
**Exports** : `getNosyBeFlights(date?)` → `{ airportIata, arrivals, departures, nextArrival, nextDeparture, fetchedAt, ... }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/nosyBeWeather.ts`
**Description** : Météo Nosy Be via Open-Meteo (gratuit, sans clé). Coordonnées lat=-13.3128, lon=48.2578. Cache 30min.
**APIs externes** : `https://api.open-meteo.com/v1/forecast`
**Exports** : `getNosyBeWeather()`, `getNosyBeWeatherExtended()` → température actuelle + code WMO + forecast 7j

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/siteAnalyticsService.ts`
**Description** : Analytics maison (WhatsApp FAB clicks, page views). Stockage dans Supabase.
**Tables Supabase** : `site_analytics_events`
**Exports** :
- `insertSiteAnalyticsEvent(supabase, { eventName, pagePath, metadata })` — events autorisés : `whatsapp_fab_click`, `whatsapp_bubble_shown`, `whatsapp_fab_drag`, `page_view`
- `getSiteAnalyticsSummary(supabase, days)` → totaux, conversion rate, top pages, daily breakdown

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/stripe.ts`
**Description** : Singleton Stripe lazy. API version `2025-10-29.clover`.
**Env vars** : `STRIPE_SECRET_KEY`
**Exports** : `getStripe()`, `isStripeConfigured()`, `getStripeKeyType()` → `"TEST" | "LIVE" | "UNKNOWN" | "NOT_CONFIGURED"`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/lib/whatsappContactService.ts`
**Description** : Config contact WhatsApp persistée dans `platform_settings` (clé `whatsapp_contact`). Photos dans bucket `platform-assets`.
**Exports** :
- `loadWhatsAppContact(supabase)`
- `updateWhatsAppPhone(supabase, phone)`
- `uploadWhatsAppProfilePhoto(supabase, file)` — multer, bucket `platform-assets`
- `removeWhatsAppProfilePhoto(supabase)`
- `whatsAppContactToPublicJson(contact)` → `{ phoneE164, phoneDisplay, profilePhotoUrl, waUrl }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/server/routes/adminRoutes.ts` (3261 lignes)
**Description** : Toutes les routes admin et public via `registerAdminRoutes(app, supabaseAdmin)`. Build ID interne : `agency-v2-debug-20260328`.
**Routes publiques** (`/api/public/*`) :
- `GET /api/public/exchange-rate` — taux EUR/MGA courant
- `GET /api/public/exchange-rate/history` — historique 90j
- `GET /api/public/booking-transport-options` — options plateforme transport
- `GET /api/public/whatsapp-contact` — contact WhatsApp public
- `POST /api/public/analytics/event` — persist site event
- `GET /api/public/weather-nosy-be` — météo actuelle
- `GET /api/public/flights-nosy-be` — vols NOS
- `GET /api/public/booking-options` — options réservation DB
**Routes admin** (`/api/admin/*`) — toutes protégées par `requireAdmin()` :
- Settings : exchange-rate GET/PATCH/POST refresh, whatsapp-contact GET/PATCH/POST photo, pricing (fees/deposit/options CRUD)
- Analytics : site events GET, GA4 GET
- Planning : Gantt données avec véhicules + bookings + profils locataires
- Bookings : list (GET), create (POST), get by ID, cancel, move, extend, collect payment, collect extension, pay extension via Stripe Checkout
- Deposit : create-setup-intent (admin mode), attach-payment-method
- Claim charges : list GET, create POST (off-session Stripe PaymentIntent)
- Drafts : CRUD + convert to booking
- Clients : search, walk-in creation, update-phone
- Revenue : rapport par cash/terminal/stripe
**Dépendances** : tous les lib/ du serveur

---

## SRC/LIB/

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/analytics.ts`
**Description** : Helpers analytics GA4 + Google Ads avec déduplication sessionStorage.
**Identifiants** :
- GTM : `GT-TXZW7HG8`
- GA4 Measurement ID : `G-WVKC4DHFL3`
- Google Ads : `AW-17959989720`
**Env vars** : `VITE_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE`, `VITE_GOOGLE_ADS_CONVERSION_LABEL_DEPOSIT`
**Constante** : `ANALYTICS_BOOKING_CURRENCY = "MGA"`
**Exports** :
- `trackGa4PageView(path, title)` — dataLayer push
- `trackGa4Event(name, params)` — dataLayer push
- `sendPurchaseConversion(bookingId, amountMga, rate)` — GA4 + Google Ads, dédup par bookingId
- `sendDepositConversion(bookingId)` — Google Ads, dédup par bookingId

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/bookingFunnelAnalytics.ts`
**Description** : Analytics entonnoir réservation.
**Exports** :
- `trackViewItem({ itemId, itemName, value, currency })` — GA4 `view_item` + Meta `ViewContent`, dédup par itemId
- `trackBeginCheckout({ value, currency, itemName })` — GA4 `begin_checkout` + Meta `InitiateCheckout`
- `trackBookingBlocked({ reason })` — GA4 `booking_blocked` (reasons: `auth_required`, `missing_dates`, `missing_vehicle`)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/metaPixel.ts`
**Description** : Helpers Meta Pixel (fbq) avec déduplication sessionStorage.
**Exports** :
- `trackMetaPageView()` — fbq `PageView` (sans dédup)
- `trackMetaViewContent({ contentId, contentName, value, currency })` — dédup par contentId
- `trackMetaInitiateCheckout({ dedupId, value, currency })` — dédup par dedupId
- `trackMetaSearchInitiateCheckout({ value, currency })` — sans dédup (recherche)
- `trackMetaContact()` — fbq `Contact`
- `trackMetaLead()` — fbq `Lead`
- `trackMetaPurchase({ value, currency, dedupId })` — dédup par dedupId

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/bookingResumeIntent.ts`
**Description** : Sauvegarde/restauration d'intention de réservation dans localStorage. TTL 24h.
**localStorage key** : `lagon_booking_resume_intent`
**Exports** :
- `saveBookingResumeIntent(path, dates, times, pickupLocation)`
- `loadBookingResumeIntent()` → `BookingResumeIntent | null`
- `clearBookingResumeIntent()`
- `buildNavStateFromIntent(intent)` — construit le state React Router

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/config.ts`
**Description** : Configuration globale de l'application.
**Env vars** : `VITE_PUBLIC_SITE_URL`
**Exports** :
- `SITE_URL` — origine du site (localhost en dev, var env en prod)
- `AUTH_CALLBACK_URL = SITE_URL + '/auth/callback'`
- `isDevelopment`, `isProduction`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/depositCaution.ts`
**Description** : Appels API client pour le flux de caution Stripe.
**APIs** : Express routes via fetch avec Bearer token Supabase
**Exports** :
- `createSetupIntentClientSecret(bookingId)` → `POST /api/deposit/create-setup-intent`
- `attachPaymentMethod(bookingId, paymentMethodId)` → `POST /api/deposit/attach-payment-method`
- `forceDepositForOwner(bookingId)` → `POST /api/bookings/:id/force-deposit`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/payerLocation.ts`
**Description** : Initie le paiement Stripe via Supabase Edge Function `create-checkout-session`.
**APIs** : `${VITE_SUPABASE_URL}/functions/v1/create-checkout-session`
**Événements** : GA4 `stripe_redirect` avant redirect
**Exports** : `payerLocation(reservation)` — skip si `cash_on_site`, sinon redirige vers Stripe Checkout URL

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/stripePublicKey.ts`
**Exports** : `STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/utils.ts`
**Description** : Utilitaires généraux.
**Exports** :
- `cn(...inputs)` — clsx + tailwind-merge
- `calculateRentalDays(startDate, endDate)`
- `calculateRentalCost(days, pricePerDay)`
- `createRentalCalculation(...)`
- `createVehicleRentalInfo(...)`
- `isValidRentalCalculation(calc)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/whatsappAnalytics.ts`
**Description** : Tracking WhatsApp events vers GA4 + backend persistance.
**APIs** : `POST /api/public/analytics/event` (keepalive fetch)
**Exports** :
- `trackWhatsAppFabEvent(name, params)` — GA4 + persist
- `trackPageViewEvent(pagePath, pageTitle)` — GA4 page_view + persist
- `trackSiteEvent(name, params)` — filtré aux events autorisés

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/safeRedirectPath.ts`
**Exports** :
- `safeRedirectPath(path)` — valide chemins internes (`/` non `//`)
- `resolvePostAuthRedirect(params)` — query param → booking resume → `/onboarding/client`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/lib/debugRadixPortal.ts`
**Description** : Outil debug pour overlays Radix UI bloquants (activé via `?debugDialogs=1`).
**Exports** : `captureRadixPortalDebug()`, `logRadixPortalDebug()`, `subscribeRadixPortalDebug()`

---

## SRC/CONTEXTS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/contexts/AuthContext.tsx`
**Description** : Gestion état auth Supabase. Écoute `onAuthStateChange`.
**Exports** : `AuthProvider`, `useAuth()` → `{ user, session, loading, signOut, refreshUser }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/contexts/CartContext.tsx`
**Description** : Panier multi-items avec persistance localStorage (`rentanoo_cart_v1`). Max 10 items.
**Types** : `CartVehicleType = "car" | "moto" | "scooter" | "accommodation" | "quad"`
**Interface CartItem** : vehicleId, vehicleType, vehicleLabel, vehicleThumbnail, startDate, endDate, startTime, endTime, selectedOptions, pickupLocation, estimatedPrice, pricePerDay, rentalDays, hotelName
**Exports** : `CartProvider`, `useCart()` → `{ items, count, isFull, isOpen, openCart, closeCart, addItem, removeItem, updateItem, clearCart, isSuggestionModalOpen, lastAddedDates, openSuggestionModal, closeSuggestionModal, isAddedModalOpen, lastAddedItem, openAddedModal, closeAddedModal }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/contexts/ExchangeRateContext.tsx`
**Description** : Contexte taux EUR/MGA. Fetch depuis `/api/public/exchange-rate`. Fournit fonctions de formatage.
**Exports** : `ExchangeRateProvider`, `useExchangeRate()` → `{ rate, config, formatClient, formatAdmin, formatClientInline, formatAdminInline, footnote, loading }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/contexts/WhatsAppContactContext.tsx`
**Description** : Contexte contact WhatsApp dynamique. Fetch depuis `/api/public/whatsapp-contact`.
**Fallback** : `FALLBACK_WHATSAPP_CONTACT` (constante `contact.ts`)
**Exports** : `WhatsAppContactProvider`, `useWhatsAppContact()` → `{ contact, phoneDisplay, waUrl, loading, refresh }`

---

## SRC/INTEGRATIONS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/integrations/supabase/client.ts`
**Description** : Client Supabase singleton avec isolation de session par contexte (tenant/owner). Clé localStorage `sb-<project-ref>-auth-token-<context>`.
**Env vars** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_CONTEXT`
**Exports** : `supabase` (client par défaut)

### `/Users/christopher/rentanoo-nosy-be-clean/src/integrations/supabase/types.ts`
**Description** : Types TypeScript générés automatiquement depuis le schéma Supabase PostgreSQL.
**Tables documentées** : `vehicles`, `bookings`, `profiles`, `vehicle_photos`, `conversations`, `messages`, `notifications`, `checkin_depart`, `checkin_return`, `booking_claim_charges`, `location_areas`, `platform_settings`, `site_analytics_events`, `deposit_category_rules`, `fee_rules` (table `service_fee_rules`), `dictionary_entries`, `admin_booking_drafts`, `booking_options_catalog`, `listing_owners`
**Exports** : `Database`, `Tables<T>`, `TablesUpdate<T>`, `TablesInsert<T>`, `Json`

---

## SRC/TYPES/

### `/Users/christopher/rentanoo-nosy-be-clean/src/types/index.ts`
**Description** : Types TypeScript centraux du domaine métier.
**Types énumérés** :
- `Role = "renter" | "owner" | "admin"`
- `BookingStatus = "pending" | "accepted" | "declined" | "cancelled" | "active" | "closed" | "pending_payment" | "confirmed" | "completed" | "terminated"`
- `PaymentType = "charge" | "refund" | "payout"`
- `PaymentStatus = "requires_action" | "processing" | "succeeded" | "failed" | "refunded"`
- `VehicleStatus = "draft" | "published" | "suspended"`
- `BookingPricingMode = "web" | "admin"`
- `Transmission = "manual" | "automatic"`
- `FuelType = "gasoline" | "diesel" | "electric" | "hybrid"`
- `KycStatus = "pending" | "verified" | "rejected"`
- `PhotoAngle = "driver_side" | "front" | "passenger_side" | "rear" | "top" | "trunk" | "rear_passenger_seat" | "side_passenger" | "side_driver" | "spare_wheel"`
- `ConversationStatus = "active" | "closed" | "archived"`
- `MessageType = "text" | "image" | "file" | "system"`
**Interfaces** : `User`, `Vehicle` (avec ~40 champs services supplémentaires), `Photo`, `Booking`, `Payment`, `Conversation`, `Message`, `Notification`, `RentalCalculation`, `VehicleRentalInfo`, `CheckinDepartSummary`, `CheckinReturnSummary`, `DateRange`, `VehicleFilters`, `VehicleSearchData`, `BookingSummary`, `SelectedService`
**Utilities** : `UserRoleUtils` (hasRole, hasAnyRole, hasAllRoles, addRole, removeRole, getHighestRole, canCreateVehicles, isAdmin)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/types/locationArea.ts`
**Description** : Type quartier géographique Nosy Be (table `location_areas`).
**Exports** : `LocationArea { id, name, slug, active, created_at?, updated_at? }`, `LocationAreaRef = Pick<LocationArea, "id" | "name" | "slug">`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/types/dictionary.ts`
**Description** : Types pour le dictionnaire malgache (table `dictionary_entries`).
**Exports** : `LangCode = "fr" | "en" | "it" | "de"`, `DictionaryEntry { id, word, word_normalized, language_code, part_of_speech, definitions, etymology, pronunciation, tags, related_entry_ids, sources, status, verified, created_by, updated_by, created_at, updated_at }`

---

## SRC/CONFIG/

### `/Users/christopher/rentanoo-nosy-be-clean/src/config/features.ts`
**Description** : Feature flags (const, build-time).
**Exports** :
- `FEATURE_FLAGS.PICKUP_LOCATION_ENABLED = false` — désactivé (en attente partenariats hôtels)
- `FEATURE_FLAGS.PROFILE_ADDRESS_ENABLED = false`
- `FEATURE_FLAGS.PROFILE_DRIVING_LICENSE_ENABLED = false`
- `FEATURES` — alias simplifié

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/config/seoRoutes.ts`
**Description** : URLs et paths SEO canoniques (slugs FR). Routes SEO et hubs hébergement.
**Exports** :
- Paths : `SEO_SCOOTER_PATH = "/location-scooter-nosy-be"`, `SEO_MOTO_PATH`, `SEO_QUAD_PATH`, `SEO_VOITURE_PATH`, `SEO_4X4_PATH`, `SEO_MINIBUS_PATH`
- Utilitaires : `SEO_WEATHER_PATH = "/meteo-nosy-be"`, `SEO_EXCHANGE_PATH = "/taux-change-euro-ariary-madagascar"`, `SEO_FLIGHTS_PATH = "/vols-aeroport-nosy-be"`
- Hubs hébergement : `ACCOMMODATION_SEO_HUBS` (vacances, appartement, villa, bungalow — Phase 2)
- `buildAccommodationAreaSeoPath(areaSlug, categorySlug)` — hub SEO par quartier

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/config/locationAreaFilterConfig.ts`
**Description** : Configuration des filtres par zone géographique (non lue — à auditer).

---

## SRC/CONSTANTS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/constants/contact.ts`
**Description** : Constantes de contact WhatsApp (fallback statique).
**Exports** : `WHATSAPP_NUMBER = "+33633707569"`, `WHATSAPP_DISPLAY`, `FALLBACK_WHATSAPP_E164`, `getWhatsAppUrl()` (@deprecated — préférer `useWhatsAppContact()`)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/constants/platformBookingOptions.ts`
**Description** : Définitions et utilitaires pour les options transport plateforme (aéroport et hôtel). Source de vérité des prix plateforme en MGA.
**Constantes** :
- `PLATFORM_AIRPORT_OPTION_PRICE = 80_000` MGA (~16 €)
- `PLATFORM_HOTEL_OPTION_PRICE = 50_000` MGA (~10 €)
- IDs : `platform-airport-pickup`, `platform-airport-return`, `platform-hotel-pickup`, `platform-hotel-return`
- Labels : `"Aéroport de Nosy Be (Fascène)"`, `"Agence Rentanoo"`
**Exports** :
- `PLATFORM_AIRPORT_PICKUP`, `PLATFORM_AIRPORT_RETURN`, `PLATFORM_HOTEL_PICKUP`, `PLATFORM_HOTEL_RETURN` (PlatformBookingOptionDef)
- `PLATFORM_TRANSPORT_OPTIONS`, `PLATFORM_AIRPORT_OPTIONS`, `PLATFORM_HOTEL_OPTIONS`
- `isPlatformTransportOption(id)`, `isPlatformPickupOption(id)`, `isPlatformReturnOption(id)`
- `buildPlatformOptionPayload(selectedIds)`, `platformOptionsTotal(selectedIds)`
- `resolvePickupExclusion(toggledId, current)`, `resolveReturnExclusion(toggledId, current)`
- `LEGACY_AIRPORT_OPTION_ID_MAP` — migration brouillons localStorage

---

## SRC/DATA/

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/explorerFilterConfig.ts`
**Description** : Configuration des filtres d'exploration (catégories principales + sous-filtres). Utilisé par `explorerFilterUtils.ts` et le composant Explorer.
**Types** : `ExplorerMainCategoryId = "accommodation" | "scooter" | "moto" | "quad" | "car"`, `ExplorerSubFilterKind = "vehicle_category" | "engine_exact" | "engine_min" | "model_keyword"`
**Catégories** avec icônes (lucide-react + react-icons/md) :
- `accommodation` : sous-filtres Appartement, Villa, Bungalow, Maison, Chambre (`vehicle_category`)
- `scooter` : sous-filtres 50cc, 125cc, 150cc, 200cc+ (`engine_exact`/`engine_min`)
- `moto` : sous-filtres 125cc, 150cc, 200cc, 250cc+ 
- `quad` : sous-filtres 300cc, buggy (`model_keyword`)
- `car` : sous-filtres Citadine, SUV, 4x4 (Pick-up), Van (Minibus/Camionnette), Luxe (Berline/Coupé/Cabriolet)
**Exports** : `EXPLORER_MAIN_CATEGORIES`, `getMainCategoryConfig(id)`, `getSubFilterConfig(mainId, subId)`, `resolveEmptyStateConfig(mainId, subId?)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/locations.ts`
**Description** : Lieux Nosy Be pour UI (non-géocodés).
**Exports** :
- `NOSYBE_STRATEGIC_POINTS = ["Aéroport Fascène", "Port de Hell-Ville", "Port d'Andoany"]`
- `NOSYBE_LOCATIONS` — 11 zones/villages
- `NOSYBE_CITIES` — liste complète
- `getLocationIcon(city)`, `isStrategicPoint(city)`, `isCommune(city)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/vehicleCategories.ts`
**Description** : Catégories véhicules avec icônes lucide et exemples de modèles.
**Exports** : `VEHICLE_CATEGORIES: VehicleCategory[]` — 14 catégories (Berline, Break, Cabriolet, Citadine, Coupé, Coupé 4p, Crossover, Minibus, Monospace, Pick-up, Roadster, SUV, Supercar, Utilitaire)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/blogPosts.ts`
**Description** : Articles de blog statiques.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/brands.ts`
**Description** : Marques de véhicules disponibles.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/categoryShowcaseItems.ts`
**Description** : Items showcase catégories pour la homepage.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/colors.ts`
**Description** : Couleurs de véhicules pour formulaires.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/fuelTypes.ts`
**Description** : Types de carburant.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/transmissionTypes.ts`
**Description** : Types de transmission.

### `/Users/christopher/rentanoo-nosy-be-clean/src/data/index.ts`
**Description** : Barrel exports du dossier data.

---

## SRC/UTILS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/serviceFees.ts`
**Description** : Source de vérité des frais de service plateforme (côté frontend).
**Règles** : renter fee = 15% du subtotal, owner fee = 15% du subtotal (commission totale = 30%)
**Exports** :
- `SERVICE_FEE_PERCENT_RENTER = 0.15`, `SERVICE_FEE_PERCENT_OWNER = 0.15`
- `calcServiceFeeRenter(subtotal)`, `calcServiceFeeOwner(subtotal)`, `calcRenterTotal(subtotal)`, `calcOwnerPayout(subtotal)`, `calcPlatformTotalFee(subtotal)`, `validateFeeCalculations(subtotal, ...)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/dualCurrency.ts`
**Description** : Gestion monnaie duale EUR/MGA. Source de vérité = ariary MGA, euro dérivé du taux.
**Constante** : `DEFAULT_EUR_MGA_RATE = 5000`
**Types** : `ExchangeRateMode = "manual" | "live"`, `EurMgaExchangeSettings`, `EurMgaExchangeConfig`, `DualPriceFormatted`
**Exports** :
- `parseExchangeSettings(raw)`, `parseExchangeConfig(raw)`, `toPublicExchangeConfig(settings)`
- `roundAriaryToThousand(mga)`, `eurToAriary(eur, rate)`, `ariaryToEur(mga, rate)`, `ariaryToStripeCents(mga, rate)`
- `formatEur(amount)`, `formatAriary(amount)`
- `formatDualPrice(amountMga, config, variant: "client"|"admin")` → `DualPriceFormatted`
- `formatDualPriceInline(amountMga, config, variant)` → string compact
- `calcServiceFeeMga(subtotalMga, percent?)`, `calcRenterTotalMga(subtotalMga, percent?)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/currency.ts`
**Description** : Formatage monétaire générique.
**Exports** : `formatCurrency(amount, locale?, currency?)` — Intl.NumberFormat

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/rentalPriceFromDates.ts`
**Description** : Calcul des jours facturables et prix de base. Logique calendaire loueur.
**Règle retour** : avant 9h → 0, 9h–12h → 0.5, après 12h → 1 (fraction journée de retour)
**Exports** :
- `combineBookingDateTime(dateInput, timeHm?)` → `Date | null`
- `parseTimeToMinutes(time)`, `computeReturnDayFraction(endTime)` → `0 | 0.5 | 1`
- `computeBillableRentalDays(startDate, endDate, startTime, endTime)` → `number` (décimal)
- `computeRentalPricing(pricePerDay, startDate, endDate, startTime, endTime)` → `RentalPricingResult`
- `computeTrustedBaseRentalPrice(input)` → `TrustedBaseRentalPriceResult` (ok/error)
- `computeBaseRentalPrice(pricePerDay, startDate, endDate, startTime?, endTime?)`
- `getBookingRentalPricing(input: BookingRentalPricingInput)` → `RentalPricingResult | null`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/vehicleType.ts`
**Description** : Helpers type de véhicule et chemins publics.
**Exports** :
- `isMoto(v)`, `isQuad(v)`, `isAccommodation(v)`
- `getListingLicense(vehicle)`, `getPublicListingPath(vehicle)` → `/hebergement/:lic`, `/moto/:lic`, `/vehicle/:lic`
- `getPublicDiscussionPath(vehicle, params?)` — chemin discussion + params
- `getVehicleTypeForChecking(vehicleType)` → `'car' | 'moto'` (quad → car pour EDL)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/vehicleSeo.ts`
**Description** : Génération title, description et canonical SEO pour fiches véhicule/hébergement.
**Exports** :
- `buildVehicleSeoTitle(input, options?)`, `buildVehicleSeoDescription(input)`
- `buildVehicleH1Title(input)` — H1 avec cylindrée
- `buildVehicleCanonical(license, isMoto)` → `https://rentanoo.com/...`
- `getVehicleTypeLabel({ model, vehicleType })`, `getLocationArticle(typeLabel)`
- `buildVehicleBreadcrumbSchema(input)` → JSON-LD BreadcrumbList
- `buildAccommodationSeoTitle(input)`, `buildAccommodationSeoDescription(input)`, `buildAccommodationCanonical(license)` (proxies vers accommodationSeo.ts)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/bookingAdmin.ts`
**Description** : Détection réservations créées par l'admin.
**Exports** : `isAdminCreatedBooking(booking)` → `boolean` (pricing_mode === "admin" ou created_by_admin_id présent)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/bookingLocations.ts`
**Description** : Dérivation des lieux de prise en charge/restitution depuis les options sélectionnées.
**Exports** :
- `sanitizeHotelName(raw)`, `hasPlatformTransportOption(selectedIds)`, `requiresHotelName(selectedIds)`
- `deriveBookingLocations({ selectedOptionIds, hotelName?, forceAgency? })` → `{ pickupLocation, returnLocation }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/bookingOptions.ts`
**Description** : Normalisation des options de réservation depuis Supabase (structure variable).
**Exports** : `normalizeBookingOptions(selectedOptions)` → `NormalizedBookingOption[]` (priorité totalPrice > price > 0)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/bookingOptionSecurity.ts`
**Description** : Sécurisation et recalcul des options avant insertion. Filtre les options inconnues `platform-*`, dédup, recalcule les prix plateforme depuis les constantes.
**Exports** :
- `ALLOWED_PLATFORM_OPTION_IDS` (Set)
- `sanitizeAndRecalculateBookingOptions(rawOptions, basePrice)` → `SanitizedBookingPricing { selectedOptions, optionsTotal, subtotal, serviceFee, totalPrice }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/bookingUpsell.ts`
**Description** : Logique d'affichage de la modale services complémentaires (upsell transport).
**Exports** :
- `draftHasPlatformTransportOption()` — vérifie localStorage draft
- `shouldShowComplementaryServicesModal()` — true si pas déjà refusé ET pas d'option transport

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/renterPaymentFromBooking.ts`
**Description** : Extraction des données de paiement locataire depuis un booking DB brut.
**Types** : `RenterPaymentMethod = "card_online" | "cash_on_site" | string`
**Exports** :
- `getPaymentMethodFromBooking(booking)`, `isCashOnSitePayment(method)`
- `getRenterPaymentAmountsFromBooking(booking)` → `{ subtotal, serviceFeeRenter, amountTotalExpected, serviceFeePercentApplied, paymentMethod }`
- `buildReservationPaymentFromBooking(booking, display)` → `ReservationPayment`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/explorerFilterUtils.ts`
**Description** : Logique de filtrage des listings (correspondance catégorie principale + sous-filtre + comptage).
**Exports** :
- `isCarVehicle(v)`, `matchesMainCategory(v, categoryId)`, `matchesSubFilter(v, mainId, sub)`
- `countForMainCategory(vehicles, categoryId)`, `countForSubFilter(vehicles, mainId, sub)`
- `applyExplorerFilters(vehicles, mainCategory, subFilterId)` → `Vehicle[]` filtré
- `computeExplorerFilterCounts(vehicles)` → `{ main: Record, sub: Record }`
- `isExplorerMainCategoryId(value)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/resolvePhotoUrl.ts`
**Description** : Résolution URL photos depuis objet photo. Priorité : publicUrl > url > storagePath (via Supabase Storage getPublicUrl). Bucket `checkin-photos`.
**Exports** : `resolvePhotoUrl(photo)` → `string`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/listingTerminology.ts`
**Description** : Terminologie UI i18n selon le type de listing (car/moto/accommodation). Hook `useListingTerms`.
**Types** : `ListingKind = "accommodation" | "moto" | "car"`
**Exports** :
- `getListingKind(v)`, `getListingKindFromFilter(filter)`
- `formatListingTitle(kind, brand, model)`
- `getHomeToastKeys(filter)` → clés i18n toast résultats/no-results
- `useListingTerms(kind)` — hook React avec `useTranslation`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/nosyBeDates.ts`
**Description** : Helpers dates dans le fuseau horaire Nosy Be.
**Constante** : `NOSY_BE_TIMEZONE = "Indian/Antananarivo"`
**Exports** : `todayYmdNosyBe()`, `addDaysYmd(ymd, days)`, `formatYmdLabel(ymd, locale, opts?)` (gère "Aujourd'hui"/"Demain")

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/imageOptimization.ts`
**Description** : Génération URLs Supabase Storage optimisées (srcset responsive). NOTE : `object/public` → no-op (transformations désactivées → 403). Seul `render/image/public` supporte les params.
**Exports** :
- `getOptimizedImageUrl(originalUrl, width, height?, quality?)` → string
- `generateSrcSet(originalUrl, widths)` → string srcset
- `generateSizes(breakpoints?)` → string sizes
- `IMAGE_SIZES = { CARD_GRID, DETAIL_MAIN, THUMBNAIL }`
- `IMAGE_WIDTHS = { CARD: [400, 800], DETAIL: [800, 1200], THUMBNAIL: [150, 300] }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/locationAreaSlug.ts`
**Description** : Génération de slugs SEO depuis nom de quartier.
**Exports** :
- `slugifyLocationAreaName(name)` → kebab-case normalisé sans accents
- `buildLocationAreaSeoHubPath(areaSlug, categorySlug?)` → `/location-{cat}-{slug}`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/weatherCodes.ts`
**Description** : Catégorisation des codes WMO Open-Meteo en catégories affichables. Logique contextuelle pluie/bruine.
**Types** : `WeatherCategory = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "storm" | "snow"`
**Exports** :
- `resolveWeatherCategory({ weatherCode, precipitationMm?, precipitationProbMax? })` — avec logique contexte (bruine < 2.5mm → cloudy)
- `weatherCodeCategory(code)` — compat sans contexte

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/logger.ts`
**Exports** : `isDev`, `debug(...args)` (dev uniquement), `warn(...args)` (dev uniquement)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/utils/formatVehicleCardRental.ts`
**Description** : Ligne compacte résumé prix/durée pour cartes véhicules.
**Exports** : `getVehicleCardTotalSummary(t, rentalInfo, formatEurPrimary)` → `"2 jours · 20,49 € total"` ou null

---

### Autres utils (synopsis) :

- **`accommodationSchema.ts`** : Schema Zod validation hébergement
- **`accommodationSeo.ts`** : Helpers SEO dédiés hébergements (title, description, canonical)
- **`authProfileMetadata.ts`** : Extraction champs profil depuis metadata auth Supabase (Google OIDC, email)
- **`cartFlyAnimation.ts`** : Animation fly-to-cart (position DOM → position icône panier)
- **`compressForUpload.ts`** : Compression images avant upload (canvas)
- **`engineCapacity.ts`** : Parsing cylindrée (ex. "125cc" → 125)
- **`formatDuration.ts`** : Formatage durée jours/heures (billable) avec i18n
- **`formatLegacyFormattedPrice.ts`** : Compat ancien format prix
- **`getCapacityBadge.ts`** : Badge nb places véhicule
- **`getCylindreeBadge.ts`** : Badge cylindrée
- **`imageCompression.ts`** : Compression client avec Sharp ou canvas
- **`lcpLogger.ts`** : Logger LCP (Largest Contentful Paint) dev
- **`normalizeWord.ts`** : Normalisation mots (diacritiques, casse)
- **`removeChildDiagnostic.ts`** : Diagnostic React "removeChild" erreurs DOM
- **`rentalPriceFromDates.test.ts`** : Tests unitaires `computeBillableRentalDays` (tsx --test)
- **`resolveListingLocation.ts`** : Résout le nom de lieu affiché d'un listing (location_areas.name ou fallback)
- **`vehicleEquipment.ts`** : Mapping équipements véhicule Supabase → Vehicle interface
- **`vehicleSchema.ts`** : Schema Zod validation véhicule
- **`whatsappContact.ts`** : Helpers contact WhatsApp (format E164, display)

---

## SRC/HOOKS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/hooks/useNosyBeFlights.ts`
**Description** : Hook React pour les données de vol aéroport NOS.
**APIs** : `GET /api/public/flights-nosy-be?date=...`
**Exports** : `useNosyBeFlights(date?)` → `{ data: NosyBeFlightsData | null, loading, error, configured, refresh }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/hooks/useRenterFeePreview.ts`
**Description** : Charge en parallèle les previews frais `card_online` et `cash_on_site` via RPC Postgres `preview_renter_fee`.
**Exports** : `useRenterFeePreview(subtotal, vehicleType?)` → `{ cardPreview, cashPreview, loading, error, savingsMga, previewFor(method) }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/hooks/useExchangeRateHistory.ts`
**Description** : Historique taux EUR/MGA (90 jours).
**APIs** : `GET /api/public/exchange-rate/history`
**Exports** : `useExchangeRateHistory()` → `{ history: ExchangeRateHistoryPoint[], loading, error, refresh }`

---

### Autres hooks (synopsis) :

- **`use-auth-store.ts`** : Store Zustand ou context wrapper pour auth
- **`use-mobile-breakpoint.tsx`** : Breakpoint mobile (≤768px) via matchMedia
- **`use-mobile.tsx`** : Hook mobile simplifié
- **`use-toast.ts`** : Hook toast (sonner)
- **`useBookingOptionsCatalog.ts`** : Fetch catalog options réservation depuis `/api/public/booking-options`
- **`useCategoryShowcase.tsx`** : Items showcase catégories homepage
- **`useExplorerFilterCounts.ts`** : Comptage filtres explorer (appelle `computeExplorerFilterCounts`)
- **`useNosyBeLocalTime.ts`** : Heure locale actuelle Nosy Be (Indian/Antananarivo)
- **`useNosyBeWeather.ts`** : Météo actuelle — `GET /api/public/weather-nosy-be`
- **`useNosyBeWeatherExtended.ts`** : Météo étendue (forecast 7j)
- **`usePlatformTransportOptions.ts`** : Options transport plateforme depuis API publique
- **`useWhatsAppBubbleTrigger.ts`** : Déclenchement bulle WhatsApp (scroll/timer)

---

## SRC/SERVICES/

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabase/vehicles.ts`
**Description** : Service Supabase pour les véhicules (ancienne classe statique — interface simplifiée).
**Classe** : `SupabaseVehiclesService` (méthodes statiques)
**Méthodes** : `getAllVehicles()`, `getVehicleById(id)`, `getVehicleByLicense(license)` (TODO: colonne license manquante — utilise id), `getVehiclesByOwner(ownerId)`, `searchVehicles(params)`, `createVehicle(vehicle)`, `updateVehicle(id, updates)`, `deleteVehicle(id)`, `incrementRentalCount(id)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabase/bookings.ts`
**Description** : Service Supabase réservations. Création via RPC SECURITY DEFINER `create_web_booking` (recalcul montants côté serveur Postgres).
**Classe** : `SupabaseBookingsService`
**Méthodes** :
- `createBooking(bookingData)` — RPC 9-arg `create_web_booking`, vérifie téléphone avant
- `getRenterBookings(renterId, options?)` — avec join `checkin_depart`
- `getOwnerBookings(ownerId, options?)` — avec join `checkin_depart` + `checkin_return`
- `updateBookingStatus(bookingId, status)`
- `updateBookingStatusWithReason(bookingId, status, reason?)`
- `updateBookingToPendingPaymentWithDepositSnapshot(bookingId, vehicleId)` — lit `deposit_category_rules`
- `cancelBooking(bookingId)`, `getBookingByReferenceNumber(ref)`, `checkAvailability(vehicleId, start, end)`
- `cancelExpiredPayments()` — annule `pending_payment` >24h (skip admin bookings)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabase/renterFeePreview.ts`
**Description** : Preview frais locataire via RPC Postgres `preview_renter_fee` (source de vérité DB).
**Exports** :
- `previewRenterFee(subtotal, paymentMethod, vehicleType?)` → `RenterFeePreview | null`
- `feePercentLabel(feePercent)` → `number` (ex. 0.1 → 10)
**Interface** : `RenterFeePreview { subtotal, fee_percent, payment_method, service_fee_renter, amount_total_expected }`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabase/profile.ts`
**Description** : Service profils utilisateur Supabase. Backfill automatique depuis metadata auth (Google OIDC).
**Classe** : `ProfileService`
**Méthodes** :
- `getCurrentUserProfile()` — crée le profil si absent (PGRST116)
- `getUserProfile(userId)`, `updateProfile(updateData)`, `createUserProfile(authUserId, userData)`
- `uploadDriverLicenseFile(file)` — bucket `driver-licenses`
- `uploadProfileImage(file)` — bucket `avatars`, path `avatars/{userId}-{ts}.ext`
- `hasRole(userId, role)`, `updateUserRole(userId, newRole)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabase/locationAreas.ts`
**Description** : CRUD quartiers géographiques Nosy Be (table `location_areas`).
**Exports** : `LocationAreasService.listActive()`, `LocationAreasService.createByName(name)` (génère slug, gère unicité 23505)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/adminApi.ts`
**Description** : Client fetch admin complet. Toutes les routes `/api/admin/*` avec Bearer token Supabase.
**Résolution URL** : `VITE_API_URL` (prod) ou `/api/...` (dev via proxy Vite). Corrige automatiquement les URLs terminant par `/api`.
**Exports** (fonctions) :
- Clients : `adminSearchClients(q, limit?)`, `adminCreateWalkInClient(payload)`, `adminUpdateRenterPhone(userId, phone)`
- Bookings : `adminCreateBooking(payload)`, `adminGetBooking(id)`, `adminCancelBooking(id)`, `adminListBookings(params)`, `adminMoveBooking(id, payload)`, `adminUpdateOfflinePaymentMethod(id, method)`, `adminCollectPayment(id, payload)`, `adminPreviewExtendBooking(id, payload)`, `adminExtendBooking(id, payload)`, `adminCollectExtensionPayment(id, payload)`, `adminPayExtensionStripe(id)`
- Claim charges : `adminListBookingClaimCharges(bookingId)`, `adminCreateClaimCharge(bookingId, payload)`
- Revenue : `adminGetRevenue(params)` → `{ bookings, summary: { total, totalCash, totalCardTerminal, totalStripe, totalOther } }`
- Exchange rate : `adminGetExchangeRate()`, `adminUpdateExchangeRate(payload)`, `adminRefreshExchangeRate()`
- WhatsApp : `adminGetWhatsAppContact()`, `adminUpdateWhatsAppPhone(phone)`, `adminRemoveWhatsAppPhoto()`, `adminUploadWhatsAppPhoto(file)` (multipart FormData)
- Analytics : `adminGetSiteAnalytics(days?)`, `adminGetGa4Analytics(days?)`
- Pricing : `adminGetPricingConfig()`, `adminSaveFeeRules(rules)`, `adminSaveDepositRules(rules)`, `adminCreateBookingOption(payload)`, `adminUpdateBookingOption(id, payload)`, `adminDeleteBookingOption(id)`

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/checkinDepartService.ts`
**Description** : Service métier état des lieux de départ (EDL départ). Appel direct Supabase (remplace ancienne route Express).
**Interfaces** : `Step1IdentificationPayload` (identification conducteur, permis, photos), `Step2Payload` (relevés km/carburant, photos tableau de bord)
**Types importés** : `Step3Payload` (extérieur + coffre), `Step4Payload` (intérieur) depuis `@/types/step3` et `@/types/step4`
**Dépendances** : `SupabaseCheckinService`, `checkinDepartPdfService` (import dynamique pour éviter chargement jsPDF)

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/checkinReturnService.ts`
**Description** : Service métier état des lieux de retour. Crée ou récupère un draft `checkin_return`.
**Méthodes** : `checkinReturnService.createOrGetCheckinReturn(params)`, + méthodes step2/step3/step4 de sauvegarde
**Calcul dommages** : `computeDamageFlags(data)` → `{ has_new_damage, new_damage_count }` depuis JSONB step3.sections + step4.interior

---

### `/Users/christopher/rentanoo-nosy-be-clean/src/services/supabaseVehiclesService.ts`
**Description** : Service véhicules actif (remplace l'ancien `supabase/vehicles.ts`). Sélection avec `location_areas` et `vehicle_photos` joints.
**Interface Vehicle** : ~40 champs (id, owner_id, brand, model, color, year, mileage, price_per_day, price_per_day_agency, status, has_ac, has_pool, near_beach, has_wifi, ..., vehicle_type, vehicle_category, listing_owner_id, deposit_amount, airport/barge/home_delivery/baby_seat/additional_driver services, low_season_discount, high_season_surcharge, long_duration_discount_14/60)
**Exports** : `Vehicle`, `SupabaseVehiclesService` (classe statique identique à `supabase/vehicles.ts` mais avec le bon select)

---

### Autres services (synopsis) :

- **`adminDraftsApi.ts`** : CRUD brouillons admin via `/api/admin/drafts/*` + conversion en booking
- **`adminPlanningApi.ts`** : Données planning Gantt `/api/admin/planning`
- **`bookings.ts`** (services/index) : Barrel exports
- **`checkinDepartPdfService.ts`** : Génération PDF EDL départ (html2canvas + jsPDF)
- **`checkinReturnPdfService.ts`** : Génération PDF EDL retour
- **`checkinReturnSnapshotService.ts`** : Snapshot légal état des lieux retour
- **`rentalContractPdfService.ts`** : Génération contrat de location PDF
- **`supabaseCheckinService.ts`** : CRUD Supabase table `checkin_depart`
- **`supabaseCheckinReturnService.ts`** : CRUD Supabase table `checkin_return`
- **`services/supabase/checkinPhotos.ts`** : Upload/gestion photos EDL (bucket `checkin-photos`)
- **`services/supabase/conversations.ts`** : CRUD conversations/messages
- **`services/supabase/dictionary.ts`** : CRUD dictionnaire malgache
- **`services/supabase/listingOwnerAvatars.ts`** : Avatars propriétaires listing
- **`services/supabase/listingOwners.ts`** : Profils propriétaires de listings
- **`services/supabase/messages.ts`** : CRUD messages conversations
- **`services/supabase/photos.ts`** : Upload photos véhicules (bucket `vehicle-photos`)
- **`services/supabase/vehicleOwner.ts`** : Profil propriétaire d'un véhicule
- **`services/localStorage/bookingStorage.ts`** : Draft réservation localStorage (`lagon_booking_draft`). Gère les options, totaux, lieux dérivés. Fonctions : `saveBookingDraft`, `getBookingDraft`, `clearBookingDraft`, `createBookingDraft`, `updateBookingOptions`, `finalizeBookingDraftForCheckout`, `applyComplementaryServicesToDraft`, `updateBookingComplementaryMeta`. Logique : détecte refresh page via `lagon_page_refresh_flag` sessionStorage.
- **`services/localStorage/searchStorage.ts`** : Persistance paramètres recherche

---

## SRC/MAPPERS/

### `/Users/christopher/rentanoo-nosy-be-clean/src/mappers/vehicleMappers.ts`
**Description** : Mapping entre `SupabaseVehicle` (DB) et `Vehicle` (types domaine).
**Exports** :
- `mapToCarVehicle(vehicle: SupabaseVehicle)` → `Vehicle` (voitures)
- `mapToMotoVehicle(vehicle: SupabaseVehicle)` → `Vehicle` (motos/scooters)
- Helpers : `normalizeTransmission(value)`, `mapLocationAreaFromRow(vehicle)`
**Note** : La colonne `license` n'existe pas encore en DB — utilise `id.substring(0, 8).toUpperCase()` temporairement

---

## RÉCAPITULATIF TECHNIQUE

### APIs externes intégrées
| Service | Clé/Config | Usage |
|---------|-----------|-------|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiements, SetupIntent caution, off-session claims |
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | DB + Auth + Storage + Edge Functions |
| Frankfurter | (aucune clé) | Taux EUR/MGA live |
| AeroDataBox via RapidAPI | `AERODATABOX_RAPIDAPI_KEY` | Vols NOS |
| Open-Meteo | (aucune clé) | Météo Nosy Be |
| MyMemory | (aucune clé) | Traduction fr→en/de/it |
| GA4 Data API | `GA4_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID` | Rapports analytics admin |
| GTM / GA4 | `GT-TXZW7HG8` (frontend) | Tracking pages et events |
| Google Ads | `AW-17959989720` + `VITE_GOOGLE_ADS_CONVERSION_LABEL_*` | Conversions |
| Meta Pixel | `1027447536915510` (hardcodé dans index.html) | Tracking Meta |
| Microsoft Clarity | `xbpy3oop7z` (hardcodé dans index.html) | Heatmaps |
| n8n | URL webhook env var | Emails contact |
| Resend | `RESEND_API_KEY` | Emails cart group |

### Stockage local (frontend)
| Clé | Contenu | TTL |
|-----|---------|-----|
| `rentanoo_cart_v1` | Panier multi-items | Session browser |
| `lagon_booking_draft` | Brouillon réservation en cours | 24h |
| `lagon_booking_resume_intent` | Intention reprise réservation | 24h |
| `sb-<ref>-auth-token-<ctx>` | JWT Supabase par contexte | Supabase managed |
| `fbq_*_sent` | Déduplication Meta Pixel | Session browser |
| `ga4_conversion_*` | Déduplication GA4/Google Ads | Session browser |

### RPC Postgres clés
| RPC | Usage |
|-----|-------|
| `create_web_booking` | Création réservation (9 args, SECURITY DEFINER, recalcul montants) |
| `preview_renter_fee` | Preview frais locataire par méthode paiement + type véhicule |
| `increment_rental_count` | Incrémente compteur locations véhicule |

### Règles pricing
- Renter service fee : 15% du subtotal (web, `card_online` par défaut ; configurable via `service_fee_rules`)
- Cash on site : frais potentiellement différents (DB `service_fee_rules` par `payment_method`)
- Owner payout : subtotal - 15% owner fee
- Commission totale plateforme : 30% du subtotal
- Source de vérité montants : **Postgres** (RPC `create_web_booking`, `preview_renter_fee`)
- Dépôt caution : montant depuis `vehicles.deposit_amount`, activable par catégorie via `deposit_category_rules`

### Checkin / EDL workflow
1. **Départ** : Step1 (identification + permis) → Step2 (km + carburant + photos tableau bord) → Step3 (extérieur + coffre, photos par angle) → Step4 (intérieur) → Finalisation → PDF légal (`checkin_depart`)
2. **Retour** : Step1 (relevés comparatifs) → Step2 (km retour + carburant) → Step3 (sections extérieures — isSameAsDepart + newDamages) → Step4 (intérieur) → Finalisation → PDF légal + calcul `has_new_damage`/`new_damage_count` (`checkin_return`)

### Variables d'environnement clés
**Frontend (VITE_*)** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PUBLIC_SITE_URL`, `VITE_API_URL`, `VITE_APP_CONTEXT`, `VITE_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE`, `VITE_GOOGLE_ADS_CONVERSION_LABEL_DEPOSIT`, `VITE_DEV_PORT`
**Serveur** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `AERODATABOX_RAPIDAPI_KEY`, `GA4_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`, `PORT`, `NODE_ENV`

---

# PARTIE B — Pages

# Agent B — Pages

## src/pages/Index.tsx
**Route :** /
**Fonction :** Page d'accueil principale. Affiche un hero avec formulaire de recherche de véhicules (dates + catégorie), des résultats de véhicules disponibles, et du contenu éditorial (comment ça marche, destinations, etc.). Lazy loading de Footer et HomeResults.
**APIs externes :** Supabase (SupabaseVehiclesService.getAvailableVehicles), useExchangeRate
**Events :** trackGa4Event("view_item_list"), trackMetaLead (sur recherche), localStorage pour persistance critères de recherche
**Textes UI :** H1 via i18n (home.hero.title), CTA "Rechercher", filtres catégories Voiture/Scooter/Moto/Quad/Hébergement
**Interactions :** Sélection dates, sélection catégorie, bouton recherche, navigation vers fiches véhicule
**State :** searchCriteria (dates, category), vehicles, loading, exchangeRate
**Composants utilisés :** HomeResults (lazy), Footer (lazy), SearchForm, VehicleCard, HowItWorks, Suspense

---

## src/pages/NotFound.tsx
**Route :** * (catch-all 404)
**Fonction :** Page 404 statique. Affiche message d'erreur et lien retour accueil.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** "404", "Page non trouvée", "Retour à l'accueil"
**Interactions :** Clic "Retour à l'accueil" → /
**State :** Aucun
**Composants utilisés :** Link

---

## src/pages/Contact.tsx
**Route :** /contact
**Fonction :** Formulaire de contact avec champs nom, email, message. Envoi via Supabase ou service email. Affiche confirmation après envoi.
**APIs externes :** Supabase (insertion table contacts)
**Events :** Aucun
**Textes UI :** H1 "Contactez-nous", labels "Nom", "Email", "Message", CTA "Envoyer", "Message envoyé !"
**Interactions :** Saisie formulaire, soumission
**State :** form (name, email, message), loading, success
**Composants utilisés :** Input, Textarea, Button, Card

---

## src/pages/Checking.tsx
**Route :** /checking
**Fonction :** Formulaire d'état de départ véhicule (check-out). Permet de documenter l'état du véhicule lors du départ du locataire.
**APIs externes :** Supabase (bookings, vehicle_states)
**Events :** Aucun
**Textes UI :** H1 "État de départ", champs état carburant, kilométrage, observations, photos
**Interactions :** Upload photos, saisie état, validation formulaire
**State :** form data, loading, photos
**Composants utilisés :** PhotoUploader, Input, Textarea, Button

---

## src/pages/Profile.tsx
**Route :** /me/profile ou /profile
**Fonction :** Page de profil utilisateur complète. Gestion infos personnelles (nom, téléphone, photo), KYC (vérification identité), préférences, suppression compte. Affiche statut KYC (pending/verified).
**APIs externes :** Supabase (profiles table, storage pour avatar), ProfileService.getCurrentUserProfile(), ProfileService.updateProfile()
**Events :** Aucun tracking explicite
**Textes UI :** H1 "Mon profil", sections "Informations personnelles", "Vérification d'identité", labels Prénom/Nom/Téléphone/Email, CTA "Sauvegarder", statut KYC "En attente de vérification" / "Vérifié"
**Interactions :** Édition champs, upload avatar, soumission formulaire, upload documents KYC
**State :** profile, loading, saving, kycStatus, avatarFile
**Composants utilisés :** Input, Button, Avatar, Badge, Card, FileUpload

---

## src/pages/ProfileTest.tsx
**Route :** /profile-test
**Fonction :** Page de test développeur pour le profil. Affiche données brutes du profil courant.
**APIs externes :** Supabase (ProfileService)
**Events :** Aucun
**Textes UI :** "Profile Test Page", données JSON affichées
**Interactions :** Aucune
**State :** profile
**Composants utilisés :** Aucun spécifique

---

## src/pages/SimpleTest.tsx
**Route :** /simple-test
**Fonction :** Page de test développeur minimaliste. Vérifie rendu React de base.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** "Simple Test"
**Interactions :** Aucune
**State :** Aucun
**Composants utilisés :** Aucun

---

## src/pages/__I18nDebug.tsx
**Route :** /__i18n-debug (dev only)
**Fonction :** Page de diagnostic i18n. Affiche toutes les clés de traduction chargées, leur valeur, et permet de tester des clés manuellement.
**APIs externes :** Aucune (i18next local)
**Events :** Aucun
**Textes UI :** "i18n Debug", liste clés/valeurs
**Interactions :** Saisie clé de test, affichage résultat
**State :** testKey, result
**Composants utilisés :** useTranslation, Input, Button

---

## src/pages/AirportServicesDemo.tsx
**Route :** /airport-demo (dev)
**Fonction :** Page de démonstration des composants services aéroport. Affiche les options de transfert aéroport dans différentes configurations.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** "Airport Services Demo", labels services aéroport
**Interactions :** Aucune
**State :** Aucun
**Composants utilisés :** AirportServicesPanel (composant demo)

---

## src/pages/PickerDemo.tsx
**Route :** /picker-demo (dev)
**Fonction :** Page de démonstration du composant date picker. Teste DateRangePicker en isolation.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** "Picker Demo"
**Interactions :** Sélection dates
**State :** dateRange
**Composants utilisés :** DateRangePicker

---

## src/pages/auth/Login.tsx
**Route :** /auth/login
**Fonction :** Page de connexion. Formulaire email + mot de passe, lien vers inscription, lien mot de passe oublié. Gestion post-auth redirect via resolvePostAuthRedirect(). Lien magic link optionnel.
**APIs externes :** Supabase Auth (signInWithPassword, signInWithOtp)
**Events :** Aucun tracking explicite
**Textes UI :** H1 "Connexion", label "Email", label "Mot de passe", CTA "Se connecter", "Pas encore de compte ? S'inscrire", "Mot de passe oublié ?", erreurs "Email ou mot de passe incorrect", "Veuillez remplir tous les champs"
**Interactions :** Saisie email/password, soumission, clic inscription, clic mot de passe oublié
**State :** email, password, loading, error
**Composants utilisés :** Input, Button, Link, useAuth, useNavigate

---

## src/pages/auth/Register.tsx
**Route :** /auth/register
**Fonction :** Page d'inscription. Formulaire email + mot de passe + confirmation + prénom/nom. Après création compte : envoi webhook n8n (VITE_N8N_WELCOME_WEBHOOK_URL, VITE_N8N_PROFILES_CREATED_WEBHOOK_URL). Redirection vers onboarding ou post-auth redirect.
**APIs externes :** Supabase Auth (signUp), n8n webhook (VITE_N8N_WELCOME_WEBHOOK_URL, VITE_N8N_PROFILES_CREATED_WEBHOOK_URL)
**Events :** Aucun tracking pixel explicite (mais Meta Pixel peut être déclenché via onboarding)
**Textes UI :** H1 "Créer un compte", labels "Prénom", "Nom", "Email", "Mot de passe", "Confirmer le mot de passe", CTA "S'inscrire", "Déjà un compte ? Se connecter", erreurs "Les mots de passe ne correspondent pas", "Email déjà utilisé"
**Interactions :** Saisie formulaire, soumission, navigation vers login
**State :** form (firstName, lastName, email, password, confirmPassword), loading, error
**Composants utilisés :** Input, Button, Link, useAuth, useNavigate, buildAuthCallbackUrl

---

## src/pages/auth/Callback.tsx
**Route :** /auth/callback
**Fonction :** Handler OAuth callback. Récupère session Supabase depuis URL hash/params, résout post-auth redirect via resolvePostAuthRedirect(), charge booking resume intent via loadBookingResumeIntent() si présent. Redirige vers destination finale ou /.
**APIs externes :** Supabase Auth (getSession, exchangeCodeForSession)
**Events :** Aucun
**Textes UI :** "Connexion en cours...", "Redirection..."
**Interactions :** Aucune (automatique)
**State :** loading, error
**Composants utilisés :** useNavigate, useSearchParams, resolvePostAuthRedirect, loadBookingResumeIntent, buildAuthCallbackUrl

---

## src/pages/blog/BlogIndex.tsx
**Route :** /blog
**Fonction :** Liste des articles de blog. Affiche les articles publiés avec titre, date, extrait, image. Pagination ou scroll infini.
**APIs externes :** Supabase (table blog_posts)
**Events :** Aucun
**Textes UI :** H1 "Blog", "Aucun article disponible", date en fr locale
**Interactions :** Clic article → /blog/:slug
**State :** posts, loading
**Composants utilisés :** Link, Card, Seo

---

## src/pages/blog/BlogPost.tsx
**Route :** /blog/:slug
**Fonction :** Article de blog individuel. Charge article depuis Supabase par slug. Affiche contenu HTML, auteur, date, tags.
**APIs externes :** Supabase (blog_posts table)
**Events :** Aucun
**Textes UI :** H1 = article.title, date formatée fr, "Retour au blog"
**Interactions :** Clic "Retour au blog" → /blog, liens internes article
**State :** post, loading, notFound
**Composants utilisés :** useParams, Seo, Link, dangerouslySetInnerHTML

---

## src/pages/booking/BookingDiscussion.tsx
**Route :** /booking/:bookingId/discussion ou /me/renter/bookings/:bookingId/discussion
**Fonction :** Interface de messagerie en temps réel entre locataire et propriétaire pour une réservation. Affiche historique messages, formulaire envoi, statut réservation. Supabase Realtime via channel subscription pour messages en direct.
**APIs externes :** Supabase (messages table, bookings table, realtime channel subscription)
**Events :** Aucun
**Textes UI :** H1 "Discussion", placeholder "Votre message...", CTA "Envoyer", "Aucun message", statuts réservation traduits
**Interactions :** Saisie message, envoi, scroll automatique vers dernier message
**State :** messages[], newMessage, loading, booking, channel (realtime)
**Composants utilisés :** useParams, useAuth, supabase.channel(), Input, Button, ScrollArea

---

## src/pages/booking/MessageToOwners.tsx
**Route :** /booking/message (legacy)
**Fonction :** Ancienne page de messagerie propriétaires (legacy). Permet d'envoyer un message groupé aux propriétaires d'une sélection de véhicules. Remplacée par BookingDiscussion.
**APIs externes :** Supabase (bookings, messages)
**Events :** Aucun
**Textes UI :** H1 "Contacter les propriétaires", placeholder "Message...", CTA "Envoyer"
**Interactions :** Saisie message, sélection destinataires, envoi
**State :** message, recipients, loading
**Composants utilisés :** Textarea, Button, Checkbox

---

## src/pages/cart/CartConfirmation.tsx
**Route :** /cart/confirmation
**Fonction :** Page de confirmation après soumission panier. Affiche récapitulatif des demandes de réservation envoyées, instructions paiement, prochaines étapes. Lit données depuis sessionStorage. Tracking GA4 + Meta Pixel purchase si paiement confirmé.
**APIs externes :** Supabase (bookings pour vérification), /api/stripe/session-details (vérification Stripe)
**Events :** trackGa4Event("purchase"), trackMetaPurchase, sendPurchaseConversion (Google Ads), markPurchaseConversionSent (localStorage anti-double)
**Textes UI :** H1 "Demande envoyée !", "Vos demandes ont été transmises aux propriétaires", "Prochaines étapes", "Retour à l'accueil"
**Interactions :** Clic "Retour à l'accueil" → /, lien vers réservations /me/renter/bookings
**State :** cartData (depuis sessionStorage), sessionId (URL param)
**Composants utilisés :** useSearchParams, useNavigate, trackGa4Event, trackMetaPurchase

---

## src/pages/cart/CartSubmit.tsx
**Route :** /cart/submit
**Fonction :** Page de soumission du panier groupé. Affiche récapitulatif du panier (véhicules, dates, options, prix total), formulaire de paiement, sélection mode paiement. Crée les réservations en batch via Supabase. Si paiement Stripe requis, redirige vers Stripe. Tracking GA4 begin_checkout.
**APIs externes :** Supabase (bookings table, cart items), Stripe (via payerLocation() → Stripe Checkout)
**Events :** trackGa4Event("begin_checkout"), trackMetaSearchInitiateCheckout, trackGa4Event("add_payment_info")
**Textes UI :** H1 "Confirmer ma demande", "Récapitulatif", "Total estimé", "Mode de paiement", options "Payer en ligne (carte)" / "Payer sur place", CTA "Confirmer et envoyer", erreurs de validation
**Interactions :** Révision panier, sélection paiement, confirmation, annulation (→ /)
**State :** cartItems (useCart), paymentMethod, loading, error
**Composants utilisés :** useCart, useAuth, DualPrice, PaymentFlowModal, useNavigate

---

## src/pages/checkin-return/[bookingId].tsx
**Route :** /checkin-return/:bookingId
**Fonction :** Wrapper de la page de formulaire de retour véhicule. Charge la réservation par ID et affiche le formulaire de restitution (état retour, photos, kilométrage, carburant, dommages constatés).
**APIs externes :** Supabase (bookings, vehicle_states, vehicle_photos)
**Events :** Aucun
**Textes UI :** H1 "État de retour", champs état, "Sauvegarder l'état de retour"
**Interactions :** Upload photos, saisie état véhicule, soumission
**State :** booking, form, photos, loading
**Composants utilisés :** useParams, PhotoUploader, CheckinReturnForm

---

## src/pages/renter/PaymentCancel.tsx
**Route :** /payment/cancel ou /me/renter/payment-cancel
**Fonction :** Page statique affichée quand l'utilisateur annule le paiement Stripe. Propose de retourner aux réservations ou à l'accueil.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** H1 "Paiement annulé", "Votre paiement a été annulé. Aucun montant n'a été prélevé.", "Retour aux réservations", "Retour à l'accueil"
**Interactions :** Clic "Retour aux réservations" → /me/renter/bookings, clic "Retour à l'accueil" → /
**State :** Aucun
**Composants utilisés :** Link, Button

---

## src/pages/renter/PaymentSuccess.tsx
**Route :** /payment/success?session_id=...
**Fonction :** Handler post-paiement Stripe. Vérifie session via /api/stripe/session-details, déclenche conversions GA4 + Google Ads + Meta Pixel purchase (anti-double via localStorage). Attend 2s webhook puis redirige : si admin → /admin/bookings/:id?afterPayment=1, sinon → /me/renter/bookings?afterPayment=1.
**APIs externes :** /api/stripe/session-details (vérification paiement), Supabase (bookings select), adminGetBooking (détection mode admin)
**Events :** sendPurchaseConversion (Google Ads, avec markPurchaseConversionSent anti-double), trackMetaPurchase, trackGa4Event("purchase"), trackGa4Event("payment_completed")
**Textes UI :** H1 "✅ Paiement confirmé", "Merci ! Ton paiement a bien été reçu.", "Vérification en cours...", "Tu peux maintenant finaliser ta réservation en bloquant ta caution.", "Redirection en cours...", erreur "Erreur lors de la vérification du paiement. Veuillez rafraîchir la page.", "Retour aux réservations"
**Interactions :** Automatique (pas d'interaction utilisateur), bouton retour si erreur
**State :** isVerifying, error
**Composants utilisés :** useSearchParams, useNavigate, sendPurchaseConversion, trackMetaPurchase, trackGa4Event, adminGetBooking

---

## src/pages/renter/RenterBookings.tsx
**Route :** /me/renter/bookings
**Fonction :** Liste des réservations du locataire connecté. Affiche toutes ses réservations avec statut, dates, véhicule, prix. Lien vers discussion par réservation. ?afterPayment=1 déclenche toast de confirmation paiement. Persistance des éléments expandés en sessionStorage.
**APIs externes :** Supabase (bookings table avec join véhicule + propriétaire)
**Events :** Aucun tracking
**Textes UI :** H1 "Mes réservations", statuts traduits (En attente/Confirmé/Actif/Terminé/Annulé), "Aucune réservation", "Voir la discussion", dates formatées fr
**Interactions :** Expand/collapse réservation, clic discussion → /booking/:id/discussion, clic paiement si applicable
**State :** bookings[], expanded (sessionStorage), loading
**Composants utilisés :** useAuth, useNavigate, useSearchParams, DepositFlowModal, DualPrice

---

## src/pages/legal/Legal.tsx
**Route :** /legal ou /mentions-legales
**Fonction :** Page mentions légales statiques. Affiche informations société, hébergeur, éditeur, propriété intellectuelle, RGPD.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** H1 "Mentions légales", sections "Éditeur", "Hébergeur", "Propriété intellectuelle", "Données personnelles"
**Interactions :** Aucune
**State :** Aucun
**Composants utilisés :** Seo

---

## src/pages/legal/PolitiqueAnnulation.tsx
**Route :** /politique-annulation
**Fonction :** Page politique d'annulation statique. Détaille les conditions de remboursement selon délai d'annulation.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** H1 "Politique d'annulation", "100% remboursé si annulation >48h", "50% entre 24h et 48h", "Aucun remboursement <24h", "Frais de service non remboursables"
**Interactions :** Aucune
**State :** Aucun
**Composants utilisés :** Seo

---

## src/pages/onboarding/ClientOnboarding.tsx
**Route :** /onboarding/client
**Fonction :** Onboarding locataire en 4 étapes : (1) Bienvenue + profil de base, (2) Téléphone, (3) Préférences location, (4) Confirmation. Met à jour profile Supabase à chaque étape. Tracking Meta Pixel Lead à la fin.
**APIs externes :** Supabase (profiles update via ProfileService), n8n webhook (VITE_N8N_PROFILES_CREATED_WEBHOOK_URL)
**Events :** trackMetaLead (étape finale)
**Textes UI :** Étape 1 "Bienvenue sur Rentanoo !", "Comment vous appelez-vous ?", labels Prénom/Nom ; Étape 2 "Votre numéro de téléphone", placeholder "+261..." ; Étape 3 "Vos préférences" ; Étape 4 "Vous êtes prêt !", CTA "Suivant", "Terminer", "Passer"
**Interactions :** Navigation entre étapes, saisie données, soumission finale
**State :** step (1-4), profile data, loading
**Composants utilisés :** useAuth, ProfileService, Input, Button, Progress

---

## src/pages/owner/Dashboard.tsx
**Route :** /me/owner/dashboard
**Fonction :** Tableau de bord propriétaire. Affiche KPIs : revenus, réservations actives, taux d'occupation, évaluations. Graphiques revenus sur période. Accès rapide vers véhicules et réservations.
**APIs externes :** Supabase (bookings, vehicles filtrés par owner_id)
**Events :** Aucun
**Textes UI :** H1 "Mon tableau de bord", cards "Revenus ce mois", "Réservations actives", "Taux d'occupation", "Évaluations", liens "Mes véhicules", "Mes réservations"
**Interactions :** Sélection période, navigation vers véhicules/réservations
**State :** stats, period, loading
**Composants utilisés :** useAuth, DualPrice, Card, Chart

---

## src/pages/owner/OwnerBookings.tsx
**Route :** /me/owner/bookings
**Fonction :** Liste des réservations reçues par le propriétaire. Filtre par statut. Affiche demandes avec détails locataire, dates, véhicule, prix. Actions : accepter/refuser depuis cette vue.
**APIs externes :** Supabase (bookings join locataire + véhicule, filtre owner_id)
**Events :** Aucun
**Textes UI :** H1 "Mes réservations", filtres statuts, "Aucune réservation", "Accepter", "Refuser", dates fr
**Interactions :** Filtrage statut, accepter/refuser réservation, voir discussion
**State :** bookings[], statusFilter, loading
**Composants utilisés :** useAuth, Select, Badge, Button, DualPrice

---

## src/pages/owner/OwnerVehicles.tsx
**Route :** /me/owner/vehicles
**Fonction :** Liste des véhicules du propriétaire. Affiche chaque véhicule avec photo, titre, statut (actif/inactif), prix, actions. Boutons : ajouter véhicule, gérer, voir fiche publique.
**APIs externes :** Supabase (vehicles filtrés par owner_id, vehicle_photos)
**Events :** Aucun
**Textes UI :** H1 "Mes véhicules", "Ajouter un véhicule", "Gérer", "Voir la fiche", "Actif" / "Inactif", "Aucun véhicule"
**Interactions :** Clic "Ajouter" → /me/owner/vehicles/add, clic "Gérer" → /me/owner/vehicles/:id/manage, toggle actif/inactif
**State :** vehicles[], loading
**Composants utilisés :** useAuth, DualPrice, Badge, Button, Link

---

## src/pages/owner/AddVehicle.tsx
**Route :** /me/owner/vehicles/add
**Fonction :** Formulaire d'ajout voiture en 3 étapes : (1) Type véhicule (Voiture/Moto/Scooter/Quad/Hébergement), (2) Détails du véhicule, (3) Photos. Redirige vers RentMyCarRegister pour voitures, vers AddMotoPlaceholder pour les autres types.
**APIs externes :** Aucune (navigation uniquement)
**Events :** Aucun
**Textes UI :** H1 "Ajouter un véhicule", options type, "Suivant", "Annuler"
**Interactions :** Sélection type, navigation
**State :** vehicleType
**Composants utilisés :** Button, RadioGroup, useNavigate

---

## src/pages/owner/ManageVehicle.tsx
**Route :** /me/owner/vehicles/:vehicleId/manage
**Fonction :** Page de gestion complète d'un véhicule propriétaire (4802 lignes). Onglets : Infos de base, Tarification, Annonce, Photos, Aperçu. Sauvegarde en plusieurs passes (champs de base, champs optionnels, remises, équipements hébergement, zones pickup, services aéroport, barge Petite/Grande Terre, livraison domicile, siège bébé, conducteur additionnel). ListingOwnerService.syncForVehicle(). Auto-translate FR→EN/DE/IT via /api/translate. Détection de modifications non sauvegardées (hasChanges).
**APIs externes :** Supabase (SupabaseVehiclesService.updateVehicle x multiples passes, PhotoService, ListingOwnersService), /api/translate (auto-traduction descriptions)
**Events :** Aucun tracking
**Textes UI :** H1 = vehicle.brand + " " + vehicle.model, toast "Succès"+"Véhicule mis à jour avec succès", toast "Erreur"+"Impossible de sauvegarder les modifications: {msg}", toast "Attention"+"Les informations de base ont été sauvegardées, mais les remises n'ont pas pu être mises à jour.", "Véhicule non trouvé" + "Retour à mes véhicules", badge "Actif" (vert) / "Inactif" (rouge), onglets Infos de base / Tarification / Annonce / Photos / Aperçu
**Interactions :** Édition de tous les champs véhicule, toggle disponibilité, upload/réorganisation photos, sauvegarde, navigation onglets, détection changements non sauvegardés
**State :** vehicle, formData (40+ champs), loading, saving, hasChanges, activeTab, photos
**Composants utilisés :** useManageVehicle hook, OwnerDualCurrencyInput, DualPrice, Switch, Tabs, PhotoManager, useAuth, useNavigate, Footer

---

## src/pages/owner/OwnerBookingRequests.tsx
**Route :** /me/owner/booking-requests
**Fonction :** Liste des demandes de réservation reçues par le propriétaire (statut pending). Permet d'accepter ou refuser chaque demande. Distinct de OwnerBookings (qui liste toutes).
**APIs externes :** Supabase (bookings filtre owner_id + status=pending)
**Events :** Aucun
**Textes UI :** H1 "Demandes de réservation", "Accepter", "Refuser", "Aucune demande en attente", dates fr
**Interactions :** Accepter → update booking status=accepted, Refuser → status=declined
**State :** requests[], loading, processingId
**Composants utilisés :** useAuth, Button, Card, DualPrice

---

## src/pages/owner/OwnerBookingDiscussion.tsx
**Route :** /me/owner/bookings/:bookingId/discussion
**Fonction :** Interface de messagerie propriétaire pour une réservation. Identique à BookingDiscussion côté locataire mais vue propriétaire. Realtime Supabase.
**APIs externes :** Supabase (messages, bookings, realtime channel)
**Events :** Aucun
**Textes UI :** H1 "Discussion", placeholder "Votre message...", "Envoyer", "Aucun message"
**Interactions :** Saisie + envoi message, scroll automatique
**State :** messages[], newMessage, channel, booking
**Composants utilisés :** useParams, useAuth, supabase.channel(), ScrollArea

---

## src/pages/owner/RentMyCarLanding.tsx
**Route :** /rent-my-car
**Fonction :** Landing page "Louer ma voiture". Présente les avantages de devenir propriétaire sur Rentanoo. Sections : hero, avantages, comment ça marche, témoignages, CTA inscription. Lien vers /rent-my-car/register.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** H1 "Louer ma voiture à Nosy Be", avantages "Revenus supplémentaires", "Gestion simplifiée", "Assurance incluse", CTA "Commencer maintenant", "En savoir plus"
**Interactions :** CTA → /rent-my-car/register, scroll vers sections
**State :** Aucun
**Composants utilisés :** Button, Link, Seo, HowItWorks

---

## src/pages/owner/RentMyCarRegister.tsx
**Route :** /rent-my-car/register (+ ?existingOwner=true)
**Fonction :** Formulaire complet d'ajout d'une voiture en tant que propriétaire. Crée le véhicule + upload photos + met à jour le rôle utilisateur en "owner" si nouveau. Navigation vers /me/owner/vehicles en cas de succès.
**APIs externes :** Supabase (ProfileService.getCurrentUserProfile, ProfileService.updateUserRole, SupabaseVehiclesService.createVehicle, PhotoService.uploadMultiplePhotos, SupabaseVehiclesService.updateVehicleImage)
**Events :** Aucun
**Textes UI :** CardTitle "Ajouter une voiture" (Car icon), sections Catégorie (6 boutons : Citadine/SUV-4x4/Berline/Monospace-Minibus/Pick-up/Van-Utilitaire), Marque*, Modèle*, Année*, Kilométrage, Carburant* (Essence/Diesel/Électrique/Hybride), Boîte* (Manuelle/Automatique), Places (4/5/7/9), Portes (3/5), Couleur, Immatriculation (optionnel), Prix/jour* (hint "Saisissez en Ariary ou en € — équivalent affiché selon le taux du jour"), Localisation (10 zones), Équipements (10 toggles), Services (Aéroport Fascène, Barges, Livraison domicile, Siège bébé, Conducteur sup.), Description ; toasts : "Fichier image requis.", "Photo max 10 MB.", "Photo ajoutée", "Champs manquants"+"Marque, modèle, année, carburant, boîte et prix sont requis.", "Photo requise"+"Ajoutez au moins une photo du véhicule.", "Année invalide.", "Prix invalide (min 1 000 Ar).", "Vous devez être connecté.", "Véhicule publié !"+"Gérez-le depuis votre tableau de bord." ; boutons "Annuler" → /me/owner/vehicles, "Publier le véhicule" / "Création en cours..."
**Interactions :** Sélection catégorie, saisie formulaire, upload 1-6 photos (principale + profil gauche + intérieur + 3 optionnelles), toggle équipements/services, soumission
**State :** formData (catégorie, marque, modèle, année, km, carburant, boîte, places, portes, couleur, immat, prix, localisation, équipements, services, description), photos[], uploading, loading
**Composants utilisés :** OwnerDualCurrencyInput, Switch, Checkbox, Input, Textarea, Button, Card, useAuth, useNavigate

---

## src/pages/owner/AddMotoPlaceholder.tsx
**Route :** /me/owner/vehicles/add-moto (?kind=accommodation → hébergement, ?kind=quad → quad)
**Fonction :** Formulaire d'ajout moto/scooter, hébergement, ou quad. Trois modes selon param ?kind. DEBUG banner fixe en bas gauche "Build: ADD-MOTO v2.0-diagnostic".
**APIs externes :** Supabase (SupabaseVehiclesService.createVehicle avec vehicle_type=accommodation|scooter|moto|quad, uploadVehiclePhotos)
**Events :** Aucun
**Textes UI :** Mode moto/scooter : CardTitle "Ajouter une moto / scooter" (Bike icon) ; mode accommodation : "Ajouter un hébergement" (Hotel icon) ; mode quad : "Ajouter un quad / buggy" (MdTerrain icon). Champs hébergement : Type (Villa/Bungalow/Maison/Chambre/Appartement), Quartier/Localisation*, Nom hébergement (placeholder "Ex : Villa les Flamboyants"), Capacité voyageurs, Prix par nuit (arPlaceholder 100000, eurPlaceholder 20), Description. Champs moto : Marque (placeholder "Ex : Honda"), Modèle (placeholder "Ex : PCX 125"), Année, Kilométrage, Type (Moto/Scooter ou Quad/Buggy), Cylindrée (placeholder "125"), Immatriculation, Places, Carburant, Boîte, Prix par jour. Photos : 3 principales + jusqu'à 3 additionnelles. Hints photos : "Avant gauche – angle recommandé", "Vue de côté pour bien voir la ligne", "Compteur, selle, top case...". Boutons : "Annuler" → /me/owner/vehicles, "Créer le véhicule" / "Créer l'hébergement" / "Création en cours..."
**Interactions :** Saisie formulaire selon mode, upload photos, soumission, annulation
**State :** formData, photos[], kind (accommodation|moto|quad), loading
**Composants utilisés :** OwnerDualCurrencyInput, Select, Switch, Input, Textarea, Button, Card, useSearchParams, useNavigate

---

## src/pages/sinistre-caution/SinistreCaution.tsx
**Route :** /sinistre-caution
**Fonction :** Page SEO informative sur sinistres et caution (noIndex: true). Sections : hero avec 2 CTAs (ancres #process et #contact), processus en 3 étapes, info caution, assurance, documents requis, FAQ (7 items Accordion), section contact.
**APIs externes :** Supabase Storage (images statiques depuis tbsgzykqcksmqxpimwry.supabase.co/storage/v1/object/public/sinistre-caution-page/)
**Events :** Aucun
**Textes UI :** Via i18n keys sinistreCaution.*, H1 = t("sinistreCaution.hero.title"), CTAs t("sinistreCaution.hero.ctaProcess") + t("sinistreCaution.hero.ctaContact"), images : couple-serein.webp/timeline.webp/justificatif.webp/assurance.webp/devis-facture.webp/relax.webp, contact mailto:support@rentanoo.com?subject=..., "Retour à l'accueil" → /
**Interactions :** Clic ancre #process, clic ancre #contact, ouverture accordion FAQ, clic email, clic retour accueil
**State :** Aucun
**Composants utilisés :** Seo (canonical, noIndex:true), SeoPageShell, Accordion, useTranslation

---

## src/pages/dictionary/DictionaryIndex.tsx
**Route :** /dictionary
**Fonction :** Index du dictionnaire malgache. Barre de recherche, liste des entrées trouvées. Charge via DictionaryService.searchEntries avec React Query.
**APIs externes :** DictionaryService.searchEntries (Supabase dictionary_entries table)
**Events :** Aucun
**Textes UI :** H1 = t("dictionary.title"), placeholder = t("dictionary.searchPlaceholder"), bouton t("common.search"), états t("common.loading") / t("common.error") / t("dictionary.noResults"), affiche entry.word + entry.part_of_speech + entry.definitions[0].text (tronqué 2 lignes)
**Interactions :** Saisie recherche, clic entrée → /dictionary/:id
**State :** query, résultats via useQuery
**Composants utilisés :** useQuery, DictionaryService, Input, Button, Card, Link, useTranslation

---

## src/pages/dictionary/DictionaryEntry.tsx
**Route :** /dictionary/:id
**Fonction :** Page détail d'une entrée dictionnaire. Affiche mot, prononciation, partie du discours, définitions (ordonnées), étymologie (origine/dérivation/mots liés), sources.
**APIs externes :** DictionaryService.getEntryById (Supabase)
**Events :** Aucun
**Textes UI :** Bouton "← t(dictionary.back)", H1 = entry.word, prononciation entre /slashes/, H2 t("dictionary.definitionsTitle"), H2 t("dictionary.etymologyTitle"), H2 t("dictionary.sourcesTitle"), états loading/error/empty via i18n
**Interactions :** Clic retour → /dictionary, navigation navigateur
**State :** via useQuery (entry, isLoading, isError)
**Composants utilisés :** useParams, useQuery, DictionaryService, useTranslation

---

## src/pages/vehicles/VehicleDetails.tsx
**Route :** /vehicle/:license
**Fonction :** Fiche détail véhicule (voiture). Auto-redirect si type=accommodation → /hebergement/:license, si moto → /moto/:license. Sections collapsibles : description, caractéristiques techniques (Moteur/Transmission/Kilométrage/Portes/Places/Couleur), options/accessoires, évaluations (statiques : Marie + Jean), assurance AXA (multirisque, assistance 24/7, collision, caution 400€), avantages (prolongation, 30min marge, support 7j/7), infos précontractuelles (liens CGU). Phone gate dialog si pas de téléphone. Sticky bottom mobile avec DualPrice + CTA. JSON-LD schemas produit + breadcrumb.
**APIs externes :** Supabase (SupabaseVehiclesService.getVehicleByShortId, PhotoService.getVehiclePhotos, ProfileService.getCurrentUserProfile, ProfileService.updateProfile)
**Events :** trackGa4Event("view_item"), trackGa4Event("begin_checkout"), trackGa4Event("booking_blocked"), trackMetaLead (implicit), viewItemSentRef (anti-double)
**Textes UI :** H1 = buildVehicleH1Title(), toast "Connexion requise"+"Vous devez être connecté pour réserver un véhicule.", "Véhicule non trouvé"+"Ce véhicule n'existe pas ou n'est plus disponible.", "Erreur"+"Impossible de charger...", "Panier plein (10/10)"+"Soumets d'abord ta demande actuelle...", dialog "Numéro de téléphone requis", label "Numéro de téléphone", placeholder "Numéro de téléphone", error "Le numéro de téléphone doit contenir au moins 6 caractères", boutons "Annuler" / "Enregistrer et poursuivre ma réservation" / "Enregistrement...", sections "Description du véhicule" / "Caractéristiques techniques" / "Options et accessoires" / "Évaluations" / "Assurance incluse" / "Avantages à chaque location" / "Informations précontractuelles", mobile CTA "Simuler mon tarif gratuitement" / "Panier plein", "Conditions générales" / "En savoir plus"
**Interactions :** Navigation photos (carousel), toggle sections collapsibles, saisie dates, ajout au panier, dialog téléphone (saisie + enregistrement), modale cart, modale services complémentaires, modale confirmation, modale multi-véhicule
**State :** vehicle, photos, vehiclePhotos, currentUser, loading, showMultiVehicleModal, showConfirmationModal, showComplementaryModal, showPhoneRequiredModal, phoneGateSource, phone, isSavingPhone, phoneError, selectedPhotoIndex, expandedSections, isCartAddModalOpen, lastAddedCartItemId, viewItemSentRef
**Composants utilisés :** CartAddModal, ComplementaryServicesModal, BookingConfirmationModal, MultiVehicleModal, PhoneRequiredDialog, DualPrice, buildVehicleBreadcrumbSchema, buildVehicleProductSchema, Seo, useCart, useAuth

---

## src/pages/vehicles/MotoVehicleDetails.tsx
**Route :** /moto/:license
**Fonction :** Fiche détail moto/scooter. Structure identique à VehicleDetails. Charge via getAvailableVehicles() puis recherche par prefix shortId (pas getVehicleByShortId). Guard : isMoto() sinon toast motoDetails.errors.vehicleIncompatible + navigate("/"). Caution hardcodée "Caution : 400€". Prix mobile via t("par_jour"). Sections via i18n keys motoDetails.*.
**APIs externes :** Supabase (getAvailableVehicles, PhotoService, ProfileService)
**Events :** trackGa4Event("view_item"), trackGa4Event("begin_checkout"), trackGa4Event("booking_blocked"), viewItemSentRef anti-double
**Textes UI :** Via i18n motoDetails.*, H1 via buildVehicleH1Title(), sections motoDetails.technical.engine/mileage, motoDetails.reviews.title, motoDetails.insurance.title/items/coverageTitle/conditionsTitle/coverage.collision, motoDetails.benefits.title/items, motoDetails.legal.title/paragraph1/paragraph2/ctaConditions/ctaMore, "Caution : 400€", t("par_jour"), toasts motoDetails.errors.vehicleIncompatible, motoDetails.errors.vehicleNotFound
**Interactions :** Identiques VehicleDetails : carousel photos, sections collapsibles, ajout panier, phone gate, modales
**State :** vehicle, photos, currentUser, loading, showModals, phone, expandedSections, viewItemSentRef
**Composants utilisés :** CartAddModal, ComplementaryServicesModal, BookingConfirmationModal, MultiVehicleModal, PhoneRequiredDialog, DualPrice, Seo, useCart, useAuth, useTranslation

---

## src/pages/vehicles/AccommodationDetails.tsx
**Route :** /hebergement/:license
**Fonction :** Fiche détail hébergement. Guard : isAccommodation() sinon toast + navigate("/"). Terminologie dynamique via useListingTerms("accommodation"). Amenities affichées en badges colorés : Gardien (Shield, emerald), Proche commercial (ShoppingBag, purple), Vie nocturne (Music, rose), Cuisine équipée (UtensilsCrossed, amber), Solaire (Sun, yellow), Femme ménage (Sparkles, fuchsia), Blanchisserie (Shirt, sky), Télétravail (Laptop, slate), Canal+ (Tv, red). Pas de ComplementaryServicesModal. Prix mobile t("pricing.perNightShort", "par nuit").
**APIs externes :** Supabase (SupabaseVehiclesService, PhotoService, ProfileService)
**Events :** trackGa4Event("view_item"), trackGa4Event("begin_checkout"), viewItemSentRef anti-double
**Textes UI :** H1 = buildAccommodationH1Title(), badges amenities (Gardien sur place, Proche centre commercial, Proche activités nocturnes, Cuisine équipée, Panneau solaire, Femme de ménage, Blanchisserie, Télétravail possible, Canal+), "par nuit", toast "Panier plein (10/10)"+"Soumets d'abord ta demande actuelle avant d'ajouter un autre élément."
**Interactions :** Carousel photos, sections collapsibles, ajout panier, phone gate, modale cart, modale confirmation
**State :** vehicle, photos, currentUser, loading, showConfirmationModal, showPhoneRequiredModal, phone, expandedSections, viewItemSentRef
**Composants utilisés :** AccommodationHighlights, ListingDescriptionContent, CartAddModal, BookingConfirmationModal, PhoneRequiredDialog, DualPrice, useListingTerms, buildAccommodationVacationRentalSchema, buildAccommodationBreadcrumbSchema, Seo, useCart, useAuth

---

## src/pages/seo/SeoCategoryPage.tsx
**Route :** Composant réutilisable (pas de route propre)
**Fonction :** Template SEO générique pour pages catégorie véhicule. Reçoit props (seoTitle, canonical, hero, vehicleType/subCategory, content, highlights[], FAQ, CTA, relatedLinks[], breadcrumbs[]). Fetche SupabaseVehiclesService.getAvailableVehicles({limit:40}) filtré par type/subCategory, affiche max 6 listings (MiniListingCard : photo, brand+model, prix Ar/jour ou Ar/nuit, "Voir la fiche →"). Schémas JSON-LD FAQPage + BreadcrumbList.
**APIs externes :** Supabase (getAvailableVehicles)
**Events :** Aucun
**Textes UI :** Props passées : seoTitle, heroTitle, heroIntro, contentTitle, contentBody, highlights[], faqItems[{q,a}], ctaTitle, ctaText, ctaLabel, relatedLinks[{label,href}] ; placeholder photo "Photo à venir"
**Interactions :** Clic listing → fiche véhicule, clic CTA → ctaHref, clic related links
**State :** listings[], loading
**Composants utilisés :** Seo, SeoPageShell, SeoPageHero, SeoContentSection, SeoCtaPanel, SeoFaqSection, MiniListingCard, ClientMgaPrice

---

## src/pages/seo/LocationScooterNosyBePage.tsx
**Route :** /location-scooter-nosy-be
**Fonction :** Page SEO avancée location scooter (custom, pas SeoCategoryPage). Carrousel scooters depuis Supabase. Dialog annulation. Badge cylindrée (getCylindreeBadge). FAQ hardcodée 5 items : permis/casque/livraison aéroport/prix/paiement en ligne.
**APIs externes :** Supabase (getAvailableVehicles vehicleType=scooter, vehicle_photos direct query)
**Events :** Aucun
**Textes UI :** H1 "Location scooter à Nosy Be", FAQ : "Quel permis faut-il..." / "Le casque est-il fourni..." / "La livraison à l'aéroport..." / "Quel est le prix..." / "Peut-on payer en ligne..."
**Interactions :** Carrousel scooters, dialog politique annulation, accordion FAQ, clic listing → fiche
**State :** listings[], photos, cancellationOpen, heroBg
**Composants utilisés :** Carousel, WaveDivider, HowItWorksTimeline, Dialog, Accordion, ClientMgaPrice, getCylindreeBadge, Seo

---

## src/pages/seo/TauxChangeMadagascarPage.tsx
**Route :** /taux-change-madagascar (SEO_EXCHANGE_URL)
**Fonction :** Page SEO taux de change EUR/MGA en direct. Affiche taux actuel (useExchangeRate), historique (useExchangeRateHistory), badge tendance (TrendBadge avec TrendingUp/TrendingDown/Equal), FAQ depuis i18n (t("tauxChangePage.faq.items", {returnObjects:true})). JSON-LD FAQPage.
**APIs externes :** useExchangeRate (Supabase exchange_rates table), useExchangeRateHistory (Supabase)
**Events :** Aucun
**Textes UI :** H1 "Taux de change Euro / Ariary Madagascar", tableau historique avec dates, badge tendance
**Interactions :** Aucune
**State :** rate, history (via hooks)
**Composants utilisés :** useExchangeRate, useExchangeRateHistory, TrendBadge, Seo, SeoPageShell, SeoFaqSection

---

## src/pages/seo/MeteoNosyBePage.tsx
**Route :** /meteo-nosy-be (SEO_WEATHER_URL)
**Fonction :** Page SEO météo Nosy Be en direct. useNosyBeWeatherExtended() (Open-Meteo API), useNosyBeLocalTime(). WeatherIcon selon catégories (clear/fog/drizzle/rain/storm/snow/default). SeoForecastDayCard par jour. FAQ depuis i18n.
**APIs externes :** Open-Meteo API (via useNosyBeWeatherExtended hook)
**Events :** Aucun
**Textes UI :** H1 "Météo à Nosy Be", prévisions par jour, heure locale Nosy Be, FAQ depuis i18n meteoNosyBePage.faq.items
**Interactions :** Aucune
**State :** weather, localTime (via hooks)
**Composants utilisés :** useNosyBeWeatherExtended, useNosyBeLocalTime, WeatherIcon, SeoForecastDayCard, Seo, SeoFaqSection

---

## src/pages/seo/VolsNosyBePage.tsx
**Route :** /vols-nosy-be (SEO_FLIGHTS_URL)
**Fonction :** Page SEO vols Nosy Be en direct. useNosyBeFlights() → AeroDataBox API. Sélection date via SeaDayPills, date par défaut todayYmdNosyBe(). FlightTable : colonnes Heure/Vol/Compagnie/De(ou Vers)/Statut. Lien externe NOSY_BE_OFFICIAL_FLIGHTS_URL. FAQ depuis i18n.
**APIs externes :** AeroDataBox API (via useNosyBeFlights hook)
**Events :** Aucun
**Textes UI :** H1 "Vols Nosy Be", colonnes i18n volsNosyBePage.tableTime/tableFlight/tableAirline/tableFrom/tableTo/tableStatus, FAQ volsNosyBePage.faq.items
**Interactions :** Sélection date (SeaDayPills), clic lien officiel aéroport
**State :** selectedDate, flights (via hook)
**Composants utilisés :** useNosyBeFlights, SeaDayPills, FlightTable, todayYmdNosyBe, Seo, SeoFaqSection

---

## src/pages/seo/LocationVoitureNosyBePage.tsx
**Route :** /location-voiture-nosy-be
**Fonction :** Page SEO location voiture Nosy Be. Wrapper SeoCategoryPage. vehicleType="car".
**APIs externes :** Supabase (via SeoCategoryPage)
**Events :** Aucun
**Textes UI :** seoTitle "Location voiture à Nosy Be – SUV, pick-up, 4x4 | Rentanoo", H1 "Location voiture à Nosy Be", heroIntro "SUV, pick-up et berlines disponibles...", highlights ["SUV & 4x4 disponibles","Climatisation","Livraison aéroport","Permis B suffisant","Familles & groupes","Réservation en ligne"], FAQ 5 items (permis/routes/côté conduite/chauffeur/coût), CTA "Voir les voitures disponibles" → /?cat=car, related ["Location scooter Nosy Be","Hébergements Nosy Be"]
**Interactions :** Via SeoCategoryPage
**State :** Via SeoCategoryPage
**Composants utilisés :** SeoCategoryPage

---

## src/pages/seo/LocationMotoNosyBePage.tsx
**Route :** /location-moto-nosy-be
**Fonction :** Page SEO location moto Nosy Be. Wrapper SeoCategoryPage. vehicleType="moto".
**APIs externes :** Supabase (via SeoCategoryPage)
**Events :** Aucun
**Textes UI :** seoTitle "Location moto à Nosy Be – Deux-roues puissants | Rentanoo", H1 "Location moto à Nosy Be", highlights ["250cc à 400cc","Livraison aéroport","Permis A requis","Assurance incluse","Caution par CB","Réservation en ligne"], FAQ 5 items (permis A/pistes/tarif/caution/longue durée), CTA "Voir les motos disponibles" → /?cat=moto
**Interactions :** Via SeoCategoryPage
**State :** Via SeoCategoryPage
**Composants utilisés :** SeoCategoryPage

---

## src/pages/seo/Location4x4NosyBePage.tsx
**Route :** /location-4x4-nosy-be
**Fonction :** Page SEO location 4x4 Nosy Be. Wrapper SeoCategoryPage. vehicleType="car", vehicleSubCategory="SUV".
**APIs externes :** Supabase (via SeoCategoryPage)
**Events :** Aucun
**Textes UI :** seoTitle "Location 4x4 à Nosy Be – SUV tout-terrain | Rentanoo", H1 "Location 4x4 à Nosy Be", highlights ["SUV & 4x4 tout-terrain","Pistes accessibles","Climatisation","Livraison aéroport","Familles & groupes","Permis B suffisant"], FAQ 5 items (nécessité 4x4/pistes saison/permis/livraison aéroport/chauffeur), CTA "Voir les 4x4 disponibles" → /?cat=car, breadcrumb 3 niveaux
**Interactions :** Via SeoCategoryPage
**State :** Via SeoCategoryPage
**Composants utilisés :** SeoCategoryPage

---

## src/pages/seo/LocationMinibusNosyBePage.tsx
**Route :** /location-minibus-nosy-be
**Fonction :** Page SEO location minibus Nosy Be. Wrapper SeoCategoryPage. vehicleType="car", vehicleSubCategory="Minibus".
**APIs externes :** Supabase (via SeoCategoryPage)
**Events :** Aucun
**Textes UI :** seoTitle "Location minibus à Nosy Be – Groupes & transferts | Rentanoo", H1 "Location minibus à Nosy Be", highlights ["7 à 9 places","Climatisation","Groupes & familles","Livraison aéroport","Option chauffeur","Excursions & transferts"], FAQ 5 items (capacité/chauffeur/pistes/tarif/transfert aéroport), CTA "Voir les minibus disponibles" → /?cat=car
**Interactions :** Via SeoCategoryPage
**State :** Via SeoCategoryPage
**Composants utilisés :** SeoCategoryPage

---

## src/pages/seo/LocationVacancesNosyBePage.tsx
**Route :** /location-vacances-nosy-be
**Fonction :** Page SEO location vacances hébergement Nosy Be. Wrapper SeoHebergementPageTemplate. FAQ 3 items (paiement/annulation/vérification), related links 7 liens hébergements+scooter.
**APIs externes :** Supabase (via SeoHebergementPageTemplate)
**Events :** Aucun
**Textes UI :** seoTitle "Location vacances Nosy Be – Appartements, villas, bungalows | Rentanoo", H1 "Trouvez votre hébergement de vacances à Nosy Be", subtitle "Appartements, villas et bungalows vérifiés sur place...", CTA "Voir tous les hébergements" → /?cat=accommodation, panel "Appartements, villas, bungalows. Disponibilité en temps réel, réservation sécurisée.", FAQ : paiement (acompte+solde sur place) / annulation (100%>48h, 50% 24-48h, 0%<24h) / vérification (équipe locale)
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationAppartementNosyBePage.tsx
**Route :** /location-appartement-nosy-be
**Fonction :** Page SEO location appartement Nosy Be. Wrapper SeoHebergementPageTemplate. vehicleSubCategory="Appartement".
**APIs externes :** Supabase (via SeoHebergementPageTemplate)
**Events :** Aucun
**Textes UI :** seoTitle "Location appartement à Nosy Be – Ambatoloaka & Madirokely | Rentanoo", H1 "Trouvez votre appartement idéal à Nosy Be", CTA "Voir les appartements" → /?cat=accommodation, panel "Confirmation immédiate. Prix clairs. Proche de la plage."
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationBungalowNosyBePage.tsx
**Route :** /location-bungalow-nosy-be
**Fonction :** Page SEO location bungalow Nosy Be. Wrapper SeoHebergementPageTemplate. vehicleSubCategory="Bungalow".
**APIs externes :** Supabase (via SeoHebergementPageTemplate)
**Events :** Aucun
**Textes UI :** seoTitle "Location bungalow à Nosy Be – Authentique & proche mer | Rentanoo", H1 "Trouvez votre bungalow idéal à Nosy Be", CTA "Voir les bungalows" → /?cat=accommodation, panel "Authenticité tropicale à prix maîtrisé. Réservation sécurisée en ligne."
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationVillaNosyBePage.tsx
**Route :** /location-villa-nosy-be
**Fonction :** Page SEO location villa Nosy Be. Wrapper SeoHebergementPageTemplate. vehicleSubCategory="Villa".
**APIs externes :** Supabase (via SeoHebergementPageTemplate)
**Events :** Aucun
**Textes UI :** seoTitle "Location villa à Nosy Be – Avec piscine & vue mer | Rentanoo", H1 "Trouvez votre villa idéale à Nosy Be", CTA "Voir les villas" → /?cat=accommodation, panel "Espaces, piscine, vue mer. Réservation sécurisée en ligne."
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationVillaBordDeMerNosyBePage.tsx
**Route :** /location-villa-bord-de-mer-nosy-be
**Fonction :** Page SEO villa bord de mer Nosy Be. Wrapper SeoHebergementPageTemplate. nearBeach=true (filtre Supabase). Pas de vehicleSubCategory.
**APIs externes :** Supabase (via SeoHebergementPageTemplate, filtré nearBeach=true)
**Events :** Aucun
**Textes UI :** seoTitle "Villa en bord de mer à Nosy Be — Réservation vérifiée | Rentanoo", H1 "Trouvez votre villa en bord de mer à Nosy Be", CTA "Voir les hébergements bord de mer" → /?cat=accommodation, panel "Villas, bungalows, appartements proches de la plage. Réservation sécurisée en ligne."
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationVillaPiscineNosyBePage.tsx
**Route :** /location-villa-piscine-nosy-be
**Fonction :** Page SEO villa avec piscine Nosy Be. Wrapper SeoHebergementPageTemplate. hasPool=true (filtre Supabase). Pas de vehicleSubCategory.
**APIs externes :** Supabase (via SeoHebergementPageTemplate, filtré hasPool=true)
**Events :** Aucun
**Textes UI :** seoTitle "Villa avec piscine à Nosy Be — Réservation vérifiée | Rentanoo", H1 "Trouvez votre villa avec piscine idéale à Nosy Be", CTA "Voir les hébergements avec piscine" → /?cat=accommodation, panel "Villas, bungalows, appartements avec piscine. Réservation sécurisée en ligne."
**Interactions :** Via SeoHebergementPageTemplate
**State :** Via SeoHebergementPageTemplate
**Composants utilisés :** SeoHebergementPageTemplate

---

## src/pages/seo/LocationHebergementNosyBePage.tsx
**Route :** /location-hebergement-nosy-be
**Fonction :** Page SEO avancée hébergement Nosy Be (custom, 723 lignes). Fetche accommodation depuis Supabase, sélection de 6 logements selon algo : 2 PINNED_SHORT_IDS (285a520f, da287e92), 2-3 capacité 3-5 places, 1 grande capacité 8+ places, remplissage si nécessaire. ListingCard avec mini-carrousel (max 5 photos, ChevronLeft/Right, dots). AmenitiesList (near_beach, has_pool, seats, location_area, has_wifi, near_nightlife, near_shopping_center). Trust chips : "Vérifiés sur place par notre équipe" / "Prix clairs, aucune surprise" / "Acompte sécurisé, solde sur place". useScrollReveal (IntersectionObserver). HowItWorksTimeline. WaveDivider. FAQ 3 items (paiement/annulation/vérification). JSON-LD FAQPage + BreadcrumbList. Hero dynamique (photo du 1er logement en fond).
**APIs externes :** Supabase (getAvailableVehicles vehicleType=accommodation limit=20, vehicle_photos batch query direct)
**Events :** Aucun
**Textes UI :** Seo title "Hébergement à Nosy Be — Réservation en ligne vérifiée | Rentanoo", H1 "Trouvez votre hébergement idéal à Nosy Be", subtitle "Hébergements vérifiés sur place par notre équipe locale...", trust chips (Vérifiés sur place/Prix clairs/Acompte sécurisé), compteur "{N} hébergement(s) disponible(s) cette semaine à Nosy Be", H2 "Annonces disponibles", carte → "Voir la fiche", aria-label "Photo précédente" / "Photo suivante", "Photo à venir", prix "/nuit"
**Interactions :** Carrousel photos par carte (prev/next), clic carte → fiche hébergement, accordion FAQ, clic CTA
**State :** listings[], photosByVehicle, heroBg, cancellationOpen, trustVisible (IntersectionObserver)
**Composants utilisés :** Seo, SeoPageShell, SeoContentSection, SeoCtaPanel, SeoFaqSection, WaveDivider, HowItWorksTimeline, Dialog, Accordion, Carousel, ClientMgaPrice, getCapacityBadge, getPublicListingPath

---

## src/pages/seo/LocationQuadNosyBePage.tsx
**Route :** /location-quad-nosy-be
**Fonction :** Page SEO avancée location quad Nosy Be (custom, 600+ lignes). Fetche quads depuis Supabase triés par année décroissante. QuadCard avec mini-carrousel (max 5 photos, gestion erreur image via failedUrls Set), badge "300 cc" + badge "Quad neuf" si isNew. Trust strip : "Casque inclus" / "Assurance incluse" / "Livraison aéroport Fascène" / "Permis voiture (B) requis" / "Acompte sécurisé". FAQ 4 items (permis B pour quad/casque fourni/paiement en ligne/zones). useScrollReveal. HowItWorksTimeline. Dialog annulation.
**APIs externes :** Supabase (getAvailableVehicles vehicleType=quad limit=40, vehicle_photos direct query .not("photo_url","ilike","%.heic%") sorted by display_order + created_at)
**Events :** Aucun
**Textes UI :** Seo title "Location quad à Nosy Be...", H1 "Location quad à Nosy Be", trust strip (Casque inclus/Assurance incluse/Livraison aéroport Fascène/Permis voiture (B) requis/Acompte sécurisé), FAQ : "Ai-je besoin d'un permis..." / "Le casque est-il fourni..." / "Peut-on payer en ligne..." / "Quelles zones peut-on explorer...", "Quad neuf" badge, "Photo à venir", aria-labels "Photo précédente" / "Photo suivante", prix "/jour"
**Interactions :** Carrousel photos par carte (prev/next avec failedUrls), clic carte → fiche véhicule, accordion FAQ, dialog annulation, CTA
**State :** listings[], photosByVehicle, heroBg, cancellationOpen, trustVisible, failedUrls (par carte)
**Composants utilisés :** Seo, SeoPageShell, SeoContentSection, SeoCtaPanel, WaveDivider, HowItWorksTimeline, Dialog, Accordion, Carousel, ClientMgaPrice, getPublicListingPath

---

## src/pages/admin/AdminDashboard.tsx
**Route :** /admin
**Fonction :** Tableau de bord administration. KPIs plateforme : total utilisateurs, véhicules publiés, réservations en attente, total réservations. Raccourcis rapides vers sections admin.
**APIs externes :** Supabase (UsersService.getAllUsers, VehiclesService.getAllVehicles, BookingsService.getAllBookings)
**Events :** Aucun
**Textes UI :** H1 "Administration", subtitle "Tableau de bord et gestion de la plateforme Rentanoo", cards "Utilisateurs" (Users icon)/total comptes, "Véhicules publiés" (Car)/disponibles à la location, "Réservations en attente" (Calendar)/pending, "Total réservations" (BarChart3), liens "Nouvelle réservation (agence)" → /admin/bookings/new, "Mes brouillons" → /admin/drafts, "Planning" → /admin/planning, "Toutes les réservations" → /admin/bookings
**Interactions :** Navigation vers sections admin
**State :** stats (users, vehicles, bookings), loading
**Composants utilisés :** Card, UsersService, VehiclesService, BookingsService, Link

---

## src/pages/admin/AdminLayout.tsx
**Route :** /admin/* (layout wrapper)
**Fonction :** Layout back-office. Wraps RequireAdmin HOC + BackOfficeSidebar + Outlet. Full screen avec Footer.
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** Aucun texte propre (sidebar + outlet)
**Interactions :** Navigation sidebar
**State :** Aucun
**Composants utilisés :** RequireAdmin, BackOfficeSidebar, Outlet, Footer

---

## src/pages/admin/AdminPlaceholders.tsx
**Route :** /admin/users, /admin/vehicles-admin, /admin/payments (placeholders)
**Fonction :** Pages placeholder admin en attente d'implémentation. Affichent titre section + message "Bientôt disponible".
**APIs externes :** Aucune
**Events :** Aucun
**Textes UI :** AdminPlaceholderUsers : H1 "Utilisateurs", CardTitle "Bientôt disponible" ; AdminPlaceholderVehicles : H1 "Véhicules" ; AdminPlaceholderBookings : H1 "Réservations" + lien "Nouvelle réservation (agence)" + "Liste et filtres à brancher plus tard." ; AdminPlaceholderPayments : H1 "Paiements"
**Interactions :** Lien "Nouvelle réservation" → /admin/bookings/new
**State :** Aucun
**Composants utilisés :** Card, CardTitle, Link

---

## src/pages/admin/analytics/AdminSiteAnalytics.tsx
**Route :** /admin/analytics
**Fonction :** Dashboard analytics back-office. Données GA4 et analytics maison (WhatsApp triggers). Sélecteur période 7j/30j. Onglets WhatsApp/GA4. Lien externe GA4.
**APIs externes :** adminGetGa4Analytics(), adminGetSiteAnalytics() (Supabase via adminApi)
**Events :** Aucun
**Textes UI :** Boutons "7 jours" / "30 jours", onglets WhatsApp/GA4, labels triggers WhatsApp (Scroll/2+ pages visitées/Fiche véhicule 12s/Inconnu), lien "Ouvrir Google Analytics" → GA4_URL="https://analytics.google.com/analytics/web/"
**Interactions :** Sélection période, navigation onglets, lien externe GA4
**State :** period, activeTab, ga4Data, siteData, loading
**Composants utilisés :** Tabs, Button, adminGetGa4Analytics, adminGetSiteAnalytics

---

## src/pages/admin/bookings/AdminBookingDetail.tsx
**Route :** /admin/bookings/:bookingId
**Fonction :** Fiche détail réservation admin. Affiche toutes données réservation, historique paiements, actions : collecter paiement cash, collecter paiement extension, annuler, prolonger, créer charge sinistre, payer extension Stripe. ?afterPayment=1 auto-ouvre DepositFlowModal. payerLocation() pour redirect Stripe.
**APIs externes :** Supabase (adminGetBooking, adminCollectPayment, adminCollectExtensionPayment, adminCancelBooking, adminExtendBooking, adminCreateClaimCharge, adminListBookingClaimCharges, adminPayExtensionStripe), Stripe (via payerLocation())
**Events :** Aucun
**Textes UI :** Dialog sinistre : title "Montant (€)" (Input), "Raison" (Textarea), Checkbox confirmation, boutons sinistre/annulation/prolongation
**Interactions :** Ouvrir DepositFlowModal, BookingExtendModal, BookingCollectCashDialog, dialog sinistre (saisie montant+raison+confirm), payer Stripe
**State :** booking, claimCharges, depositOpen (depuis ?afterPayment=1), claimDialogOpen, claimAmount, claimReason, claimConfirm
**Composants utilisés :** DepositFlowModal, BookingExtendModal, BookingCollectCashDialog, Dialog, Input, Textarea, Checkbox, adminApi, payerLocation

---

## src/pages/admin/bookings/AdminBookingNew.tsx
**Route :** /admin/bookings/new (?draftId=, ?vehicleId=)
**Fonction :** Création réservation agence (pricing_mode=admin). Sélection véhicule, dates/heures (YYYY-MM-DD), options transport (PLATFORM_TRANSPORT_OPTIONS), client (existant via adminSearchClients ou walk-in via adminCreateWalkInClient). Gestion brouillons (adminDraftCreate/Get/Update/Convert). computeBaseRentalPrice pour calcul prix. agencyPricePerDayFromVehicle(). requiresHotelName() pour champ nom hôtel.
**APIs externes :** Supabase (adminCreateBooking, adminCreateWalkInClient, adminSearchClients, adminUpdateRenterPhone, adminDraftCreate, adminDraftGet, adminDraftUpdate, adminDraftConvert)
**Events :** Aucun
**Textes UI :** H1 "Nouvelle réservation (agence)", sélection véhicule, dates début/fin (inputs date), transport options, section client (recherche/walk-in), champ téléphone, champ nom hôtel (conditionnel requiresHotelName()), prix calculé, CTA "Créer la réservation" / "Sauvegarder brouillon"
**Interactions :** Sélection véhicule, saisie dates/heures, sélection client (recherche autocomplete ou walk-in), saisie téléphone, saisie hôtel, calcul prix auto, création/sauvegarde brouillon, soumission
**State :** vehicleId, dateFrom, dateTo, transport, renter (existant ou walk-in), price, draftId, loading
**Composants utilisés :** adminApi, computeBaseRentalPrice, agencyPricePerDayFromVehicle, requiresHotelName, PLATFORM_TRANSPORT_OPTIONS, Input, Select, Button

---

## src/pages/admin/bookings/AdminBookingsList.tsx
**Route :** /admin/bookings
**Fonction :** Liste toutes les réservations (PAGE_SIZE=50). Filtres statut + recherche texte. paymentLabel() → FR. sourceLabel() → "AG"(admin)/"WEB"(web)/"—". Lien vers fiche réservation.
**APIs externes :** Supabase (adminListBookings())
**Events :** Aucun
**Textes UI :** H1 "Réservations", STATUS_OPTIONS : Tous les statuts/pending/pending_payment/confirmed/accepted/active/completed/cancelled/declined/rejected/terminated, sourceLabel "AG" / "WEB" / "—", placeholder recherche, lien "Nouvelle réservation (agence)"
**Interactions :** Filtrage statut, recherche texte, clic ligne → /admin/bookings/:id
**State :** bookings[], statusFilter, searchQuery, loading
**Composants utilisés :** adminListBookings, Select, Input, Table, Link

---

## src/pages/admin/drafts/AdminDrafts.tsx
**Route :** /admin/drafts
**Fonction :** Liste des brouillons de réservation admin. Affiche brouillons avec ID (8 chars), statut, période, client hint, véhicule hint, date modification. Actions : Ouvrir (→ /admin/bookings/new?draftId=...), Convertir (adminDraftConvert → /admin/bookings/:bookingId, toast avec mot de passe si client créé à la conversion), Supprimer (adminDraftDelete).
**APIs externes :** Supabase (adminDraftsList, adminDraftConvert, adminDraftDelete via adminDraftsApi)
**Events :** Aucun
**Textes UI :** H1 "Mes brouillons", subtitle "Brouillons visibles uniquement par vous. Conversion = création d'une vraie réservation agence.", liens "← Tableau de bord" → /admin, "Nouvelle réservation" → /admin/bookings/new, CardTitle "Liste", CardDescription "{N} brouillon(s)" / "Chargement…", "Aucun brouillon pour le moment.", affichage "Brouillon {id.slice(0,8)}… · {status}", "{period} · {clientHint} · {vehicleHint}", "Modifié: {date}", toasts "Brouillon supprimé" / "Suppression impossible" / "Chargement impossible" / "Conversion OK: Réservation {id}…" / "Client créé à la conversion: Mot de passe généré (à transmettre) : {password}" / "Conversion impossible", bouton "Actualiser", boutons par brouillon "Ouvrir" / "Convertir" / "Supprimer"
**Interactions :** Actualiser liste, ouvrir brouillon dans formulaire réservation, convertir en réservation, supprimer
**State :** drafts[], loading, busyId
**Composants utilisés :** adminDraftsList, adminDraftConvert, adminDraftDelete, Card, Button, Link, useNavigate, useToast

---

## src/pages/admin/fleet/FleetList.tsx
**Route :** /admin/fleet
**Fonction :** Liste du parc scooters back-office. Filtre par operational_status, recherche texte (code/marque/modèle/immat). Compteur subtitle. Lien "Nouveau scooter" → /admin/fleet/new.
**APIs externes :** Supabase (useScooters hook)
**Events :** Aucun
**Textes UI :** H1 "Parc scooters", subtitle "{N} scooter(s)", placeholder "Code, marque, modèle, immat...", "Nouveau scooter" (Plus icon), filtre operational_status via OPERATIONAL_STATUS_LABELS, "Aucun scooter"
**Interactions :** Recherche texte, filtre statut, clic ligne → /admin/fleet/:id, clic "Nouveau scooter" → /admin/fleet/new
**State :** search, statusFilter, scooters (useScooters hook)
**Composants utilisés :** useScooters, VehicleAvatar, StatusBadge, Input, Select, Button, Link

---

## src/pages/admin/fleet/FleetDetail.tsx
**Route :** /admin/fleet/:id
**Fonction :** Fiche détail scooter back-office. H1 = brand + " " + model, subtitle = internal_code. Onglets : infos véhicule, états (historique vehicle_states), réparations. Select statut opérationnel (OPERATIONAL_STATUS_LABELS). Toast "Statut mis à jour" / "Erreur"+"Échec".
**APIs externes :** Supabase (useScooter, useScooterStats, useVehicleStates, useRepairs, useUpdateScooterStatus)
**Events :** Aucun
**Textes UI :** H1 = scooter.brand + " " + scooter.model, subtitle = internal_code, onglets (véhicule/états/réparations), Select statuts OPERATIONAL_STATUS_LABELS, toast "Statut mis à jour", "Erreur"+"Échec"
**Interactions :** Navigation onglets, changement statut, liens vers états/réparations
**State :** scooter, stats, states, repairs, loading
**Composants utilisés :** useScooter, useScooterStats, useVehicleStates, useRepairs, useUpdateScooterStatus, Tabs, Select

---

## src/pages/admin/fleet/FleetForm.tsx
**Route :** /admin/fleet/new ou /admin/fleet/:id/edit
**Fonction :** Formulaire création/édition scooter. Champs : internal_code, brand, model, year, color, license_plate, vin, mileage, purchase_date, purchase_price, price_per_day (défaut 15), operational_status, internal_notes.
**APIs externes :** Supabase (useCreateScooter, useUpdateScooter)
**Events :** Aucun
**Textes UI :** H1 "Nouveau scooter" / "Modifier", labels pour chaque champ, CTA "Créer" / "Enregistrer"
**Interactions :** Saisie formulaire, soumission
**State :** form (tous champs)
**Composants utilisés :** useCreateScooter, useUpdateScooter, Input, Select, Button

---

## src/pages/admin/fleet/VehicleStateForm.tsx
**Route :** /admin/fleet/:id/state/new
**Fonction :** Formulaire état véhicule (inspection, départ, retour). Champs : state_type (VEHICLE_STATE_TYPE), kilométrage, niveau carburant, état général, zones de dommages (tableau damage zone/severity/description). Upload photos via PhotoUploader (uploadVehiclePhoto service).
**APIs externes :** Supabase (useCreateVehicleState, uploadVehiclePhoto)
**Events :** Aucun
**Textes UI :** H1 "Nouvel état", labels state_type (VEHICLE_STATE_LABELS), mileage, fuel_level, general_condition, zones dommages, CTA "Enregistrer l'état"
**Interactions :** Sélection type état, saisie champs, ajout zones dommages, upload photos, soumission
**State :** form (state_type, mileage, fuel_level, general_condition), damages[], photos[]
**Composants utilisés :** useCreateVehicleState, PhotoUploader, Select, Input, Button, VEHICLE_STATE_LABELS, VEHICLE_STATE_TYPE

---

## src/pages/admin/maintenance/MaintenancePage.tsx
**Route :** /admin/maintenance
**Fonction :** Gestion règles de maintenance et alertes. Tableau alertes (STATUS_COLORS: ok=vert/soon=amber/overdue=rouge). Formulaire règle : vehicle_id (select scooters), model_filter, maintenance_type (InterventionType), interval_km (défaut 1000), interval_days. Toast "Règle créée".
**APIs externes :** Supabase (useCreateMaintenanceRule, useMaintenanceAlerts, useMaintenanceRules, useScooters)
**Events :** Aucun
**Textes UI :** H1 "Maintenance", sections "Alertes" / "Règles", couleurs STATUS_COLORS (ok/soon/overdue), INTERVENTION_TYPE_LABELS, toast "Règle créée", "Nouvelle règle", labels interval_km, interval_days
**Interactions :** Créer règle (formulaire), voir alertes avec statut coloré
**State :** form (vehicle_id, model_filter, maintenance_type, interval_km, interval_days), alertes[], règles[]
**Composants utilisés :** useCreateMaintenanceRule, useMaintenanceAlerts, useMaintenanceRules, useScooters, INTERVENTION_TYPE_LABELS, Select, Input, Button

---

## src/pages/admin/parts/PartsList.tsx
**Route :** /admin/parts
**Fonction :** Liste pièces détachées. H1 "Pièces détachées", subtitle "{N} référence(s)". Alerte stock bas (amber, AlertTriangle). Table : SKU/Nom/Catégorie/Stock/Prix achat/Prix vente/Actions. Liens "Mouvements" → /admin/parts/movements, "Nouvelle pièce" → /admin/parts/new.
**APIs externes :** Supabase (useParts hook)
**Events :** Aucun
**Textes UI :** H1 "Pièces détachées", subtitle, alerte "{N} pièce(s) en stock bas", colonnes SKU/Nom/Catégorie/Stock/Prix achat/Prix vente, "Mouvements", "Nouvelle pièce"
**Interactions :** Navigation vers mouvement/nouvelle pièce, clic ligne → /admin/parts/:id
**State :** parts[], loading (via useParts)
**Composants utilisés :** useParts, LowStockBadge, Table, Link, Button, AlertTriangle

---

## src/pages/admin/parts/PartDetail.tsx
**Route :** /admin/parts/:id
**Fonction :** Fiche détail pièce. StockInDialog : modal "Entrée de stock" avec Quantité + Coût unitaire + Raison. Toast "Entrée de stock enregistrée". Affiche historique mouvements stock.
**APIs externes :** Supabase (usePart, useStockIn, useStockMovements)
**Events :** Aucun
**Textes UI :** H1 = part.name, CardTitle "Entrée de stock", labels Quantité/Coût unitaire/Raison, CTA "Enregistrer", toast "Entrée de stock enregistrée", STOCK_MOVEMENT_LABELS
**Interactions :** Ouvrir dialog stock-in, saisie qté+coût+raison, enregistrement
**State :** part, stockMovements, stockInForm, dialogOpen
**Composants utilisés :** usePart, useStockIn, useStockMovements, LowStockBadge, MoneyInput, Dialog, STOCK_MOVEMENT_LABELS

---

## src/pages/admin/parts/PartForm.tsx
**Route :** /admin/parts/new ou /admin/parts/:id/edit
**Fonction :** Formulaire création/édition pièce détachée. Champs : sku, name, category (PART_CATEGORIES), description, unit (défaut "unité"), quantity_min, purchase_price, sale_price, location, compatible_models (virgule-séparés), supplier_id.
**APIs externes :** Supabase (useCreatePart, useUpdatePart, useSuppliers)
**Events :** Aucun
**Textes UI :** H1 "Nouvelle pièce" / "Modifier", labels chaque champ, Select catégorie (PART_CATEGORIES), Select fournisseur, CTA "Créer" / "Enregistrer"
**Interactions :** Saisie formulaire, soumission
**State :** form (tous champs)
**Composants utilisés :** useCreatePart, useUpdatePart, useSuppliers, Input, Select, Textarea, Button

---

## src/pages/admin/parts/StockMovementsList.tsx
**Route :** /admin/parts/movements
**Fonction :** Historique global mouvements stock (lecture seule). Filtre par type mouvement. H1 "Mouvements de stock", subtitle "Historique global (lecture seule)".
**APIs externes :** Supabase (useStockMovements({movement_type, limit: 100}))
**Events :** Aucun
**Textes UI :** H1 "Mouvements de stock", subtitle "Historique global (lecture seule)", filtre type (all + STOCK_MOVEMENT_LABELS keys)
**Interactions :** Filtre par type mouvement
**State :** movement_type filter, mouvements[] (useStockMovements)
**Composants utilisés :** useStockMovements, STOCK_MOVEMENT_LABELS, Select, Table

---

## src/pages/admin/planning/AdminPlanning.tsx
**Route :** /admin/planning
**Fonction :** Planning/Gantt des réservations. Navigation mois (ChevronLeft/Right). Recherche véhicule (Input). Bouton rafraîchir (RefreshCw). Drag pour déplacer réservations (adminMoveBooking). Tooltip détails réservation. PlanningBookingSheet pour édition. eachDayOfInterval/startOfMonth/endOfMonth (date-fns fr locale). BookingStyle type (className + label).
**APIs externes :** Supabase (adminGetPlanning(), adminMoveBooking())
**Events :** Aucun
**Textes UI :** H1 "Planning", navigation mois, recherche placeholder, bouton "Actualiser"
**Interactions :** Navigation mois prev/next, recherche véhicule, drag réservation (adminMoveBooking), clic réservation → PlanningBookingSheet, rafraîchir
**State :** currentMonth, search, bookings[], dragging, loading
**Composants utilisés :** adminGetPlanning, adminMoveBooking, PlanningBookingSheet, Tooltip, ChevronLeft, ChevronRight, RefreshCw, date-fns fr locale

---

## src/pages/admin/reports/ReportsDashboard.tsx
**Route :** /admin/reports
**Fonction :** Dashboard rapports atelier et stock. 4 KPI cards : "Scooters disponibles" / "En panne / maintenance" (amber) / "Stock bas" (red) / "Coût réparations (30j)". 2 cards summary : "Valeur du stock" / "Ventes pièces (mois en cours)".
**APIs externes :** Supabase (useReportsSummary hook)
**Events :** Aucun
**Textes UI :** H1 "Rapports & indicateurs", subtitle "Vue d'ensemble de l'activité atelier et stock", cards "Scooters disponibles" / "En panne / maintenance" / "Stock bas" / "Coût réparations (30j)" / "Valeur du stock" / "Ventes pièces (mois en cours)"
**Interactions :** Aucune
**State :** summary (useReportsSummary)
**Composants utilisés :** useReportsSummary, Card

---

## src/pages/admin/revenue/AdminRevenue.tsx
**Route :** /admin/revenue
**Fonction :** Recettes back-office. Filtre date (dateFrom/dateTo, défaut=aujourd'hui). adminGetRevenue(). DualPrice variant="admin", formatAdminInline. paymentLabel() : "Espèces" / "CB (terminal)" / "Stripe" / "—". Résumé total + par méthode paiement. Note de change depuis useExchangeRate().
**APIs externes :** Supabase (adminGetRevenue via adminApi), useExchangeRate (taux EUR/MGA)
**Events :** Aucun
**Textes UI :** H1 "Recettes", labels date "Du" / "Au", colonnes tableau, paymentLabel "Espèces" / "CB (terminal)" / "Stripe", "Total", note taux change
**Interactions :** Sélection plage dates, rafraîchissement automatique
**State :** dateFrom, dateTo, revenue[], loading
**Composants utilisés :** adminGetRevenue, DualPrice, formatAdminInline, useExchangeRate, Input(date), Table

---

## src/pages/admin/sales/SalesList.tsx
**Route :** /admin/sales
**Fonction :** Liste ventes comptoir pièces. H1 "Ventes comptoir", subtitle "Pièces vendues aux clients". Table : Date/Client/Total/Marge/Paiement (PAYMENT_LABELS: unpaid→Impayé/partial→Partiel/paid→Payé). Lien "Nouvelle vente" → /admin/sales/new. Empty "Aucune vente".
**APIs externes :** Supabase (useSales hook)
**Events :** Aucun
**Textes UI :** H1 "Ventes comptoir", subtitle "Pièces vendues aux clients", colonnes Date/Client/Total/Marge/Paiement, PAYMENT_LABELS (Impayé/Partiel/Payé), "Nouvelle vente", "Aucune vente"
**Interactions :** Clic ligne → /admin/sales/:id, clic "Nouvelle vente" → /admin/sales/new
**State :** sales[] (useSales)
**Composants utilisés :** useSales, Table, Link, Button, PAYMENT_LABELS

---

## src/pages/admin/sales/SaleForm.tsx
**Route :** /admin/sales/new
**Fonction :** Formulaire nouvelle vente comptoir. Champs : customerName, discount, amountPaid, paymentMethod (cash/etc). Recherche pièce (searchParts(q) → résultats), clic pour addLine. Lines avec quantité + unit_sale_price. subtotal = lines.reduce(). Création via useCreateSale.
**APIs externes :** Supabase (useCreateSale, searchParts)
**Events :** Aucun
**Textes UI :** H1 "Nouvelle vente", labels customerName/discount/amountPaid/paymentMethod, recherche pièce (placeholder "Rechercher une pièce..."), colonnes lignes Pièce/Qté/Prix unitaire/Total, "Ajouter", sous-total, CTA "Créer la vente"
**Interactions :** Saisie client, recherche pièce, ajout ligne, saisie qté+prix, calcul sous-total auto, soumission
**State :** form (customerName, discount, amountPaid, paymentMethod), partQuery, partResults[], lines[]
**Composants utilisés :** useCreateSale, searchParts, Input, Select, Button, Table

---

## src/pages/admin/sales/SaleDetail.tsx
**Route :** /admin/sales/:id
**Fonction :** Fiche vente comptoir. Génération PDF reçu via jsPDF ("Reçu — Rentanoo Nosy Be" header, download `recu-${id.slice(0,8)}.pdf`). Annulation avec confirm() ("Annuler cette vente et restaurer le stock ?"). Toast "Vente annulée".
**APIs externes :** Supabase (useSale, useCancelSale)
**Events :** Aucun
**Textes UI :** H1 = vente title/id, bouton "Télécharger le reçu", bouton "Annuler la vente", confirm "Annuler cette vente et restaurer le stock ?", toast "Vente annulée", PDF header "Reçu — Rentanoo Nosy Be"
**Interactions :** Télécharger PDF (jsPDF), annuler vente (confirm + useCancelSale), navigation retour
**State :** sale (useSale), loading
**Composants utilisés :** useSale, useCancelSale, jsPDF, Button

---

## src/pages/admin/settings/AdminExchangeSettings.tsx
**Route :** /admin/settings/exchange
**Fonction :** Gestion taux de change EUR/MGA. RadioGroup mode "manual"/"live". Input taux (string → parseFloat), input effectiveFrom (date). liveMeta : lastFetchedAt, lastLiveRate. Bouton "Rafraîchir depuis la source live". Après save : useExchangeRate.refresh() pour sync contexte public.
**APIs externes :** Supabase (adminGetExchangeRate, adminUpdateExchangeRate, adminRefreshExchangeRate via adminApi)
**Events :** Aucun
**Textes UI :** H1 "Taux de change", RadioGroup "manuel" / "live", label "Taux EUR/MGA", label "Effectif depuis", bouton "Enregistrer", bouton "Rafraîchir depuis la source live", toast "Chargement impossible", affichage lastFetchedAt/lastLiveRate en mode live
**Interactions :** Sélection mode, saisie taux, saisie date, save, rafraîchir live
**State :** mode, rate, effectiveFrom, liveMeta, loading, saving, refreshing
**Composants utilisés :** adminGetExchangeRate, adminUpdateExchangeRate, adminRefreshExchangeRate, useExchangeRate, RadioGroup, Input, Button

---

## src/pages/admin/settings/AdminPricingSettings.tsx
**Route :** /admin/settings/pricing
**Fonction :** Configuration tarification et options. Section "Frais de service par catégorie" : grille vehicleType × paymentMethod (% input). CATEGORY_LABELS (Voiture/Moto/Scooter/Quad/Hébergement), PAYMENT_LABELS (Carte en ligne/Espèces sur place). Section "Caution" : Switch par catégorie (depositGrid). Section "Options de réservation" : table options existantes (toggle active, prix MGA éditable, catégories checkboxes, bouton supprimer), formulaire nouvelle option (optionKey, name, description, priceMga, pricingMode flat/per_day, categories multicheck). Toasts : "Frais de service enregistrés" / "Réglages caution enregistrés" / "Prix mis à jour" / "Option créée" / "Option supprimée" / "Champs requis manquants" / "Pourcentage invalide: Entre 0 et 100%."
**APIs externes :** Supabase (adminGetPricingConfig, adminSaveFeeRules, adminSaveDepositRules, adminCreateBookingOption, adminUpdateBookingOption, adminDeleteBookingOption via adminApi)
**Events :** Aucun
**Textes UI :** H1 "Tarification & options", subtitle "Frais de service, catalogue d'options et caution, configurables par catégorie de bien. Les changements se reflètent immédiatement côté client (nouvelles réservations).", CardTitle "Frais de service par catégorie", CardDescription "% appliqué au sous-total client selon la catégorie du bien et le mode de paiement.", confirm `Supprimer l'option "{name}" ?`
**Interactions :** Édition grille fees (inputs %), toggle caution par catégorie, save fees, save deposit, toggle option active, éditer prix option, toggle catégorie option, supprimer option (confirm), créer nouvelle option
**State :** config, feeGrid, depositGrid, options[], newOption, loading, savingFees, savingDeposit, creatingOption
**Composants utilisés :** adminGetPricingConfig, adminSaveFeeRules, adminSaveDepositRules, adminCreateBookingOption, adminUpdateBookingOption, adminDeleteBookingOption, Table, Switch, Checkbox, Input, Button, Card

---

## src/pages/admin/settings/AdminWhatsAppSettings.tsx
**Route :** /admin/settings/whatsapp
**Fonction :** Configuration contact WhatsApp back-office. Section "Numéro WhatsApp" : Input tel (placeholder "+33 6 33 70 75 69"), bouton "Enregistrer le numéro" / "Enregistrement…". Section "Photo de profil (bouton mobile)" : aperçu photo (rond 64px, fond #25D366 si pas de photo + WhatsAppIcon), bouton "Ajouter une photo" / "Changer la photo" / "Envoi…", bouton "Supprimer" / "Suppression…". Après save : refreshPublicContact() du WhatsAppContactContext. Toasts : "Numéro WhatsApp enregistré" / "Photo de profil enregistrée" / "Photo supprimée: L'icône WhatsApp par défaut est rétablie." / "Upload impossible" / "Erreur" / "Chargement impossible". Note "JPG, PNG ou WebP — max 2 Mo."
**APIs externes :** Supabase (adminGetWhatsAppContact, adminUpdateWhatsAppPhone, adminUploadWhatsAppPhoto, adminRemoveWhatsAppPhoto via adminApi)
**Events :** Aucun
**Textes UI :** H1 "Contact WhatsApp", subtitle "Numéro WhatsApp Business et photo affichée sur le bouton flottant mobile.", CardTitle "Numéro WhatsApp", CardDescription "Utilisé dans le bandeau desktop et le bouton flottant mobile. Format international recommandé.", label "Numéro", placeholder "+33 6 33 70 75 69", CardTitle "Photo de profil (bouton mobile)", CardDescription "Remplace l'icône WhatsApp sur le bouton flottant. Sans photo, l'icône verte par défaut s'affiche.", "JPG, PNG ou WebP — max 2 Mo."
**Interactions :** Saisie numéro, save numéro, upload photo (input file hidden + button), supprimer photo
**State :** phone, profilePhotoUrl, loading, savingPhone, uploadingPhoto, removingPhoto
**Composants utilisés :** adminGetWhatsAppContact, adminUpdateWhatsAppPhone, adminUploadWhatsAppPhoto, adminRemoveWhatsAppPhoto, useWhatsAppContact, WhatsAppIcon, Input, Button, Card, fileInputRef

---

## src/pages/admin/suppliers/SuppliersList.tsx
**Route :** /admin/suppliers
**Fonction :** Liste fournisseurs. H1 "Fournisseurs", subtitle "{N} fournisseur(s)". Table : Nom/Téléphone/Email/Ville/Actions (bouton "Voir" → /admin/suppliers/:id). Bouton "Nouveau fournisseur" → /admin/suppliers/new.
**APIs externes :** Supabase (useSuppliers hook)
**Events :** Aucun
**Textes UI :** H1 "Fournisseurs", "{N} fournisseur(s)", colonnes Nom/Téléphone/Email/Ville, "Nouveau fournisseur", "Voir", "Aucun fournisseur"
**Interactions :** Clic "Voir" → fiche fournisseur, clic "Nouveau fournisseur"
**State :** suppliers[] (useSuppliers)
**Composants utilisés :** useSuppliers, Table, Link, Button, PageLoader

---

## src/pages/admin/suppliers/SupplierForm.tsx
**Route :** /admin/suppliers/new ou /admin/suppliers/:id (vue édition + détail)
**Fonction :** Formulaire création/édition fournisseur. Champs : Nom*, Téléphone, Email, Adresse, Ville, Pays (défaut "Madagascar"), Notes. Si édition : sections additionnelles "Pièces fournies" (liste liens vers /admin/parts/:id) et "Historique entrées stock" (table Date/Qté/Pièce/Coût). React Query pour pièces (getSupplierParts) et historique (getSupplierStockHistory). Toasts : "Nom requis" / "Fournisseur mis à jour" / "Fournisseur créé" / "Erreur"+"Échec". Après création → /admin/suppliers/:id.
**APIs externes :** Supabase (useSupplier, useCreateSupplier, useUpdateSupplier, getSupplierParts, getSupplierStockHistory via suppliersService)
**Events :** Aucun
**Textes UI :** H1 "Fournisseur" (edit) / "Nouveau fournisseur" (new), CardTitle "Coordonnées", labels Nom*/Téléphone/Email/Adresse/Ville/Pays/Notes, CTA "Enregistrer" / "Créer", "Retour", CardTitle "Pièces fournies", "Aucune pièce liée", CardTitle "Historique entrées stock", colonnes Date/Qté/Pièce/Coût
**Interactions :** Saisie formulaire, soumission, navigation retour, clic pièce → /admin/parts/:id
**State :** form (name, phone, email, address, city, country, notes), isEdit
**Composants utilisés :** useSupplier, useCreateSupplier, useUpdateSupplier, getSupplierParts, getSupplierStockHistory, useQuery, formatMoney, Input, Textarea, Button, Card, Table, Link, PageLoader

---

## src/pages/admin/workshop/WorkshopList.tsx
**Route :** /admin/workshop
**Fonction :** Liste ateliers/réparations. H1 "Atelier — Réparations", subtitle "{N} intervention(s)". Filtre statut (Select : Tous les statuts + REPAIR_STATUS_LABELS). Table : Date/Scooter/Type/Titre (link → /admin/workshop/:id)/Statut/Coût. Bouton "Nouvelle intervention" → /admin/workshop/new. Empty "Aucune réparation".
**APIs externes :** Supabase (useRepairs({status}) hook)
**Events :** Aucun
**Textes UI :** H1 "Atelier — Réparations", "{N} intervention(s)", "Tous les statuts", REPAIR_STATUS_LABELS, INTERVENTION_TYPE_LABELS, colonnes Date/Scooter/Type/Titre/Statut/Coût, "Nouvelle intervention", "Aucune réparation"
**Interactions :** Filtre statut, clic titre → /admin/workshop/:id, clic "Nouvelle intervention" → /admin/workshop/new
**State :** status filter, repairs[] (useRepairs)
**Composants utilisés :** useRepairs, INTERVENTION_TYPE_LABELS, REPAIR_STATUS_LABELS, formatMoney, Select, Table, Link, Button, PageLoader

---

## src/pages/admin/workshop/RepairForm.tsx
**Route :** /admin/workshop/new (?vehicle=vehicleId)
**Fonction :** Formulaire nouvelle intervention atelier. ?vehicle= pré-sélectionne scooter. Champs : Scooter* (Select via useScooters, affiche internal_code/license_plate/brand model), Type d'intervention (Select INTERVENTION_TYPE_LABELS, défaut "autre"), Titre*, Kilométrage (number), Main-d'œuvre (MoneyInput), Description (Textarea), Notes (Textarea). Toast "Scooter et titre requis" si validation échoue. Toast "Intervention créée". Redirige → /admin/workshop/:id après création.
**APIs externes :** Supabase (useCreateRepair, useScooters)
**Events :** Aucun
**Textes UI :** H1 "Nouvelle intervention", CardTitle "Détails", labels Scooter*/Type d'intervention/Titre*/Kilométrage/Main-d'œuvre/Description/Notes, placeholder Select "Choisir un scooter...", CTA "Créer", "Retour" → /admin/workshop, toasts "Scooter et titre requis" / "Intervention créée" / "Erreur"+"Échec"
**Interactions :** Sélection scooter, sélection type, saisie titre/km/coût/description/notes, soumission
**State :** form (vehicle_id, intervention_type, title, description, mileage_at_repair, labor_cost, notes)
**Composants utilisés :** useCreateRepair, useScooters, INTERVENTION_TYPE_LABELS, MoneyInput, Select, Input, Textarea, Button, Link

---

## src/pages/admin/workshop/RepairDetail.tsx
**Route :** /admin/workshop/:id
**Fonction :** Fiche détail réparation. H1 = repair.title, sous-titre = vehicle code + INTERVENTION_TYPE_LABELS + REPAIR_STATUS_LABELS. 3 KPI cards : Pièces (parts_cost) / Main-d'œuvre (MoneyInput si non clôturé, sinon valeur) / Total (total_cost). Table pièces consommées (sku/name/qté/coût/total). RepairPartsLineEditor pour ajouter pièces. Boutons "Clôturer" (CheckCircle, handleClose : update labor_cost + closeRepair) et "Annuler" (XCircle, confirm + cancelRepair). Toasts : "Pièces consommées" / "Erreur stock"+"Échec" / "Intervention clôturée" / "Erreur"+"Échec" / "Réparation annulée" / "Erreur"+"Échec".
**APIs externes :** Supabase (useRepair, useUpdateRepair, useCloseRepair, useCancelRepair, useConsumePartsForRepair)
**Events :** Aucun
**Textes UI :** H1 = repair.title, INTERVENTION_TYPE_LABELS + REPAIR_STATUS_LABELS, CardTitle "Pièces" / "Main-d'œuvre" / "Total", CardTitle "Pièces utilisées", colonnes Pièce/Qté/Coût unit./Total, boutons "Clôturer" / "Annuler", confirm "Annuler cette réparation et restaurer le stock ?"
**Interactions :** Éditer main-d'œuvre (MoneyInput), ajouter lignes pièces (RepairPartsLineEditor), consommer pièces, clôturer intervention, annuler avec confirm
**State :** repair, partLines[], laborCost, isClosed
**Composants utilisés :** useRepair, useUpdateRepair, useCloseRepair, useCancelRepair, useConsumePartsForRepair, RepairPartsLineEditor, MoneyInput, formatMoney, INTERVENTION_TYPE_LABELS, REPAIR_STATUS_LABELS, CheckCircle, XCircle, Table, Card, PageLoader

---

# PARTIE C — Components

# Audit Agent C — src/components/ — Rentanoo Nosy Be

> Projet : `/Users/christopher/rentanoo-nosy-be-clean/`  
> Périmètre : tous les fichiers dans `src/components/`  
> Date : 2026-06-28

---

## src/components/AdminBookingBadge.tsx

**Fonction** : Badge ambre inline "Résa admin" signalant qu'une réservation a été créée manuellement par un administrateur.

**Props** : aucune

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Résa admin"

**Interactions** : aucune (display-only)

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/BookingMoreActionsMenu.tsx

**Fonction** : Menu déroulant (DropdownMenu) pour les actions secondaires d'une réservation. Affiche les documents d'état des lieux (checkin départ / checkin retour) et permet de voir les détails ou le véhicule. Génère des URLs Supabase Storage pour les photos d'état des lieux.

**Props** :
- `checkinDepart` : object (optional) — données du checkin départ
- `onViewDetails` : () => void (required) — ouvre modal détails
- `onViewVehicle` : () => void (optional) — navigue vers listing véhicule

**APIs externes** :
- Supabase Storage : `supabase.storage.from('checkin-photos').getPublicUrl(path)` — récupère URLs publiques pour photos EDL

**Events** : aucun

**Textes UI** : "Plus d'actions", "Voir les détails", "Voir le véhicule", "Documents", "État des lieux départ", "État des lieux retour", "Aucun document"

**Interactions** : clic sur le menu pour dérouler, clic pour ouvrir chaque document dans un nouvel onglet

**Bugs/TODO** :
- TODO SÉCURITÉ : le bucket `checkin-photos` est public → les URLs sont accessibles sans authentification

**Hooks** : `useState`

---

## src/components/ClientProfileCompletionGuard.tsx

**Fonction** : Guard de route React. Redirige vers `/onboarding/client` si le profil utilisateur est incomplet (phone, firstName, lastName manquants). Certains chemins sont exemptés.

**Props** :
- `children` : ReactNode (required)

**APIs externes** :
- Supabase (via AuthContext) : profil utilisateur chargé depuis `useAuth()`

**Events** : aucun

**Textes UI** : aucun visible

**Interactions** : redirection automatique silencieuse

**Bugs/TODO** : Chemins exemptés hardcodés : `/auth`, `/onboarding/client`, `/profile`, `/admin`, `/me/owner`, `/me/dashboard`, `/rent-my-car`, `/panier/`

**Hooks** : `useAuth`, `useNavigate`, `useLocation`

---

## src/components/DepositFlowModal.tsx

**Fonction** : Modal Stripe pour enregistrer une carte bancaire comme caution (SetupIntent). Affiche les champs Stripe Elements, collecte et confirme le SetupIntent. Déclenche la conversion Google Ads une seule fois (module-level flag).

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `bookingId` : string (required)
- `depositAmount` : number (required) — montant en MGA
- `onSuccess` : () => void (optional)

**APIs externes** :
- Stripe : `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`, `stripe.confirmCardSetup()`, `elements.getElement(CardElement)`
- Supabase : crée un SetupIntent via Edge Function ou RPC (indirect via service)
- Google Ads : `sendDepositConversion()`, `hasDepositConversionBeenSent()`, `markDepositConversionSent()`

**Events** :
- Google Ads conversion : `sendDepositConversion` (une seule fois par session)

**Textes UI** : "Enregistrer votre carte comme caution", "Caution requise :", "Votre carte ne sera pas débitée maintenant", "Confirmer la caution", "Annuler", "Traitement en cours...", "Sécurisé par Stripe"

**Interactions** : formulaire Stripe CardElement, bouton confirmer, bouton annuler

**Bugs/TODO** :
- `console.log` au niveau module pour vérifier la présence de la clé Stripe (debug non supprimé)

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/ErrorBoundary.tsx

**Fonction** : Composant React de classe pour capturer les erreurs de rendu, les promesses rejetées, et les ressources manquantes. Affiche une UI de fallback. Auto-reload silencieux sur chunks Vite périmés (une seule fois via sessionStorage). Ignore les erreurs de scripts tiers.

**Props** :
- `children` : ReactNode (required)
- `fallback` : ReactNode (optional) — UI de remplacement personnalisée

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Erreur dans l'état des lieux", "Une erreur est survenue lors du chargement de l'application.", "Réessayer", "Rafraîchir la page", "Voir la stack trace", "Message d'erreur :", "L'erreur a été loggée dans la console du navigateur (F12 → Console) pour faciliter le diagnostic."

**Interactions** : bouton "Réessayer" (réinitialise l'état), bouton "Rafraîchir la page" (window.location.reload), détails stack trace expandables

**Bugs/TODO** : aucun

**Hooks** : aucun (classe)

---

## src/components/ExteriorInspectionAccordionSimple.tsx

**Fonction** : Step 3 du formulaire EDL (État des Lieux). Inspection extérieure du véhicule en 6 zones (Avant, Arrière, Côté conducteur, Côté passager, Toit, Jantes). Pour chaque zone : photos (upload Supabase Storage `checkin-photos`), toggle dégâts, rapports de dégâts avec types et commentaires. Bouton final pour sauvegarder et passer à l'étape suivante. 1965 lignes.

**Props** :
- `bookingId` : string (required)
- `bookingReferenceNumber` : string (required)
- `onComplete` : () => void (required) — callback fin d'étape
- `vehicleInfo` : object (optional) — marque/modèle/plaque

**APIs externes** :
- Supabase Storage : upload photos dans bucket `checkin-photos` via `uploadZonePhoto()` et `uploadDamagePhoto()`
- Compression : `compressForUpload()` (2 passes, garde-fou taille)

**Events** : aucun

**Textes UI** : "Inspection extérieure", "Avant", "Arrière", "Côté conducteur", "Côté passager", "Toit", "Jantes", "Dégâts visibles ?", "Ajouter un dégât", "Supprimer", "Type de dégât", "Précisions", "Photos du dégât", "Terminer l'inspection extérieure", "Inspection extérieure complète", "📤 Upload des photos en cours...", "🔄 Sauvegarde en cours..."

**Interactions** : accordion collapsible par zone, upload photo par zone, toggle ON/OFF dégâts, formulaire par dégât (type multi-select, commentaire textarea, photo), bouton navigation zone suivante, bouton fin d'étape

**Bugs/TODO** :
- **BUG CRITIQUE (React Hooks)** : `useRef` appelé à l'intérieur de `steps.map()` (callback), ce qui viole les Rules of Hooks (ligne ~1071). Les hooks ne peuvent pas être appelés dans des boucles ou callbacks.
- `WHEEL_DAMAGE_TYPES` hardcodé : ["Rayure", "Bosse", "Fissure", "Éclat", "Déformation", "Autre"]
- Performance : `performance.now()` et logs dev restent dans le bundle (conditionnels sur `NODE_ENV`)
- `UPLOAD_CONCURRENCY = 2` (mapLimit)

**Hooks** : `useFormContext`, `useState`, `useRef`, `useCallback`, `useEffect`

---

## src/components/FuelLevelSlider.tsx

**Fonction** : Slider 0-100% pour indiquer le niveau de carburant ou de batterie. Affiche une icône contextuelle (batterie pour électrique, pompe sinon). Segmenté visuellement avec couleurs selon niveau.

**Props** :
- `value` : number (required) — 0 à 100
- `onChange` : (value: number) => void (required)
- `label` : string (optional) — label affiché
- `isElectric` : boolean (optional, default false)
- `disabled` : boolean (optional, default false)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : label dynamique, "%" suffix

**Interactions** : glisser le slider

**Bugs/TODO** : aucun

**Hooks** : aucun (composant pur)

---

## src/components/OwnerBookingCard.tsx

**Fonction** : Carte de gestion des réservations pour le propriétaire (1808 lignes). Affiche les réservations en accordéon avec détails complets, actions (accepter/refuser/annuler/marquer complété), génération PDF (html2canvas + jsPDF), messagerie temps réel (Supabase Realtime sur la table `messages`), initiation de l'état des lieux (EDL), gestion des paiements cash, badge admin.

**Props** :
- `booking` : Booking (required)
- `onBookingUpdated` : (id: string) => void (optional)
- `onBookingDeleted` : (id: string) => void (optional)
- `onRequestDeposit` : (booking: Booking) => void (optional)
- `expandedBookingId` : string | null (optional)
- `toggleExpanded` : (id: string) => void (required)
- `isExpanded` : boolean (required)

**APIs externes** :
- Supabase : `profiles` (chargement locataire), `messages` (count non lus, subscription Realtime)
- SupabaseBookingsService : `updateBookingStatus()`, `updateBookingStatusWithReason()`
- ConversationsService : `getConversationByBookingId()`
- ProfileService : `getUserProfile()`, `getCurrentUserProfile()`
- html2canvas + jsPDF : génération PDF

**Events** :
- `trackGa4Event("owner_booking_action", { action })` — actions propriétaire

**Textes UI** : "Accepter", "Refuser", "Annuler", "Marquer comme complété", "Démarrer l'état des lieux", "Télécharger PDF", "Payer ma location", "Message", "TOTAL À PAYER", "Durée :", "Départ", "Retour", "Options sélectionnées", "Sous-total", "Frais de service", "Zone de prise en charge", "Informations client", "Réservation annulée", "PDF téléchargé"

**Interactions** : accordéon expand/collapse, accepter/refuser/annuler (avec motif) réservation, modal annulation avec RadioGroup + Textarea, messagerie via navigate, génération PDF, initiation EDL

**Bugs/TODO** :
- `console.log` debug pour état de la réservation (ligne ~748)
- TODO(i18n) : plusieurs textes hardcodés ("Départ", "Retour", "Durée :", "TOTAL À PAYER", etc.)

**Hooks** : `useState`, `useEffect`, `useNavigate`, `useTranslation`, `useExchangeRate`, `useToast`, `useAuth`

---

## src/components/PaymentFlowModal.tsx

**Fonction** : Modal de paiement en 2 étapes : (1) sélection méthode (card_online / cash_on_site), (2) paiement Stripe Elements. Affiche le récapitulatif des options, le total avec frais de service.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `reservation` : ReservationPayment (required)
- `onSuccess` : () => void (optional)

**APIs externes** :
- Stripe : `loadStripe`, `CardElement`, `stripe.confirmCardPayment()`
- Supabase : création PaymentIntent via service

**Events** : `trackGa4Event("payment_initiated", {...})`

**Textes UI** : "Confirmer votre paiement", "Par carte bancaire", "En agence (espèces)", "Total à payer", "Payer maintenant", "Annuler", "Traitement...", "Sécurisé par Stripe"

**Interactions** : sélection méthode paiement, formulaire carte Stripe, confirmation paiement

**Bugs/TODO** : aucun visible

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/RenterBookingCard.tsx

**Fonction** : Carte de réservation pour le locataire (~1682 lignes). Accordéon avec photo véhicule, statut enrichi, CTA de paiement ou de caution Stripe, détails étendus (dates/durée/prix/options), messagerie propriétaire (Realtime), génération PDF (html2canvas + jsPDF), modal annulation avec motif, modal détails de réservation.

**Props** :
- `booking` : Booking (required)
- `onBookingUpdated` : (id: string) => void (optional)
- `onBookingDeleted` : (id: string) => void (optional)
- `onRequestPay` : (reservation: ReservationPayment) => void (optional)
- `onRequestDeposit` : (booking: Booking) => void (optional)
- `expandedBookingId` : string | null (optional)
- `toggleExpanded` : (id: string) => void (required)
- `isExpanded` : boolean (required)

**APIs externes** :
- Supabase : `profiles` table (chargement propriétaire + locataire), `messages` table (count non lus, Realtime subscription)
- SupabaseBookingsService : `updateBookingStatus()`, `updateBookingStatusWithReason()`
- ConversationsService : `getConversationByBookingId()`
- ProfileService : `getUserProfile()`, `getCurrentUserProfile()`
- html2canvas + jsPDF : génération PDF

**Events** : aucun

**Textes UI** : "Payer ma location", "Activer la caution", "Message", "Détails", "Voir le véhicule", "TOTAL À PAYER", "Durée :", "Départ", "Retour", "Options sélectionnées", "Sous-total", "Frais de service", "Annuler", "Confirmer", "Télécharger PDF", "Réservation annulée", "PDF téléchargé", "Aucun paiement en ligne n'est nécessaire", "Règlement lors de la remise des clés à l'agence.", "Caution : activée", "Caution : à activer", "Caution : aucune"

**Interactions** : accordéon, paiement en ligne (Stripe), activation caution (DepositFlowModal), messagerie (navigate), génération PDF, annulation avec motif (RadioGroup + Textarea), modal détails

**Bugs/TODO** :
- `console.log` debug ligne ~748 : `"BOOKING RENTER CARD 👉"` avec données sensibles (IDs, statuts, clés Stripe) — à supprimer en prod
- TODO(i18n) : "Départ", "Retour", "Durée :", "TOTAL À PAYER", "Options sélectionnées"
- TODO : confirmation de réservation (status 'accepted') non implémentée — toast "Fonctionnalité à venir"

**Hooks** : `useState`, `useEffect`, `useNavigate`, `useTranslation`, `useExchangeRate`, `useToast`, `useAuth`, `useI18n`

---

## src/components/VehicleOwnerCard.tsx

**Fonction** : Carte profil propriétaire avec statut KYC (badge coloré), avatar, nom, note, bouton contact WhatsApp.

**Props** :
- `owner` : User (required)
- `vehicleId` : string (optional)

**APIs externes** : aucune directe

**Events** : aucun

**Textes UI** : "Propriétaire", statut KYC traduit, "Contacter", "Vérifié", "En attente"

**Interactions** : clic sur WhatsApp ouvre `buildWhatsAppUrl` dans nouvel onglet

**Bugs/TODO** : aucun

**Hooks** : `useTranslation`, `useWhatsAppContact`

---

## src/components/ZoomableImage.tsx

**Fonction** : Miniature cliquable qui ouvre une image en plein écran dans un Dialog Radix.

**Props** :
- `src` : string (required)
- `alt` : string (required)
- `className` : string (optional)
- `thumbnailClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : aucun (texte alternatif dynamique)

**Interactions** : clic sur miniature pour ouvrir Dialog, clic outside/Escape pour fermer

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/accommodation/AccommodationCard.tsx

**Fonction** : Carte d'hébergement (location vacation). Affiche photo principale (avec fallback Supabase `vehicle_photos` table), badge caution, amenities (14 types), prix/nuit, localisation. Utilise `getOptimizedImageUrl` et `generateSrcSet` pour les images.

**Props** :
- `accommodation` : Accommodation (required)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)
- `onClick` : () => void (optional)
- `className` : string (optional)

**APIs externes** :
- Supabase : `vehicle_photos` table — requête `select('url').eq('vehicle_id', accommodation.id).order('order_index').limit(1)` pour photo de fallback

**Events** : aucun

**Textes UI** : prix "/nuit", badge amenities (Piscine, WiFi, Climatisation, Cuisine, Parking, Vue mer, Jardin, Terrasse, TV, Lave-linge, Animaux, Barbecue, Jacuzzi, Salle de sport)

**Interactions** : clic sur la carte

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/accommodation/AccommodationHighlights.tsx

**Fonction** : Affiche 3 pills d'info : localisation, capacité (n personnes), type d'hébergement.

**Props** :
- `location` : string (optional)
- `capacity` : number (optional)
- `type` : string (optional)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "{n} personnes", type dynamique

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/admin/RequireAdmin.tsx

**Fonction** : Guard de route qui redirige vers `/` si l'utilisateur n'a pas le rôle admin.

**Props** :
- `children` : ReactNode (required)

**APIs externes** : AuthContext

**Events** : aucun

**Textes UI** : aucun

**Interactions** : redirection automatique

**Bugs/TODO** : aucun

**Hooks** : `useAuth`, `useNavigate`

---

## src/components/booking/BookingConfirmationModal.tsx

**Fonction** : Modal de confirmation de réservation (step final). Affiche récapitulatif véhicule/dates/prix, sélection méthode de paiement, notes/hotel, soumission finale. Panel DEV de debug i18n en mode développement.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `vehicle` : Vehicle (required)
- `startDate` : Date (required)
- `endDate` : Date (required)
- `onConfirm` : (data: ConfirmData) => Promise<void> (required)
- `selectedOptions` : ServiceOption[] (optional)
- `startTime` : string (optional)
- `endTime` : string (optional)

**APIs externes** : aucune directe

**Events** :
- `trackGa4Event("payment_method_selected", { method: "card_online" | "cash_on_site" })`

**Textes UI** : "Confirmer la réservation", "Récapitulatif", "Méthode de paiement", "Payer en ligne par carte", "Payer en agence (espèces)", "Note / hôtel", "Saisir votre hôtel ou note", "Confirmer", "Annuler", "Frais de service", "Total"

**Interactions** : sélection méthode paiement, saisie note/hôtel, bouton confirmer, bouton annuler

**Bugs/TODO** :
- TODO : subtitle "Rapide" non implémenté
- Panel DEV i18n conditionnel (non visible en prod)

**Hooks** : `useState`, `useTranslation`, `useExchangeRate`

---

## src/components/booking/CartAddModal.tsx

**Fonction** : Modal d'ajout au panier en 2 étapes : (1) sélection de dates + heures via LazyDatePicker, (2) sélection des options/services. Utilise `createPortal` vers `radix-portal-root`. Constantes `START_TIME="06:30"`, `END_TIME="06:00"`.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `vehicle` : Vehicle (required)
- `onAddToCart` : (data: CartItem) => void (required)

**APIs externes** : aucune directe (LazyDatePicker charge react-datepicker)

**Events** : `trackGa4Event("add_to_cart", { vehicle_id, ...})`

**Textes UI** : "Ajouter au panier", "Sélectionner vos dates", "Départ", "Retour", "Heure de départ", "Heure de retour", "Suivant", "Ajouter au panier", "Annuler", "Options", "Valider"

**Interactions** : calendrier date range, sélection heures, toggle options/services, bouton ajouter

**Bugs/TODO** : `START_TIME` et `END_TIME` hardcodés (pas configurables depuis l'UI)

**Hooks** : `useState`, `useEffect`, `useTranslation`, `useExchangeRate`

---

## src/components/booking/ComplementaryServicesModal.tsx

**Fonction** : Modal upsell pour options de transport (aéroport, barge). Lit/écrit un draft dans localStorage. Permet sélection/déselection d'options supplémentaires.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `vehicleId` : string (required)
- `onConfirm` : (options: ServiceOption[]) => void (required)

**APIs externes** : localStorage (draft)

**Events** : aucun

**Textes UI** : "Services complémentaires", "Prise en charge à l'aéroport", "Restitution à l'aéroport", etc.

**Interactions** : toggle options, confirmer, annuler

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/booking/PaymentMethodSelector.tsx

**Fonction** : Composant de sélection méthode de paiement : radio "card_online" vs "cash_on_site".

**Props** :
- `value` : "card_online" | "cash_on_site" (required)
- `onChange` : (value: string) => void (required)
- `disabled` : boolean (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Par carte bancaire (en ligne)", "En agence (espèces)"

**Interactions** : sélection radio

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/cart/AddedToCartModal.tsx

**Fonction** : Modal post-ajout au panier avec animation de secousse. Ne peut pas être fermée par clic extérieur ou Escape (intentionnel).

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `vehicleName` : string (required)
- `onContinue` : () => void (required)
- `onGoToCart` : () => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Ajouté au panier !", "{vehicleName} a été ajouté à votre panier.", "Continuer mes achats", "Voir mon panier"

**Interactions** : boutons "Continuer" ou "Voir le panier"

**Bugs/TODO** : `onOpenChange` ignoré (fermeture empêchée délibérément)

**Hooks** : `useState`, `useEffect`

---

## src/components/cart/CartDrawer.tsx

**Fonction** : Tiroir latéral droit (Sheet) affichant le contenu du panier. Calcule le total (items + options), affiche chaque véhicule avec dates, permet suppression, navigue vers `/panier/soumettre`.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)

**APIs externes** : CartContext

**Events** : aucun

**Textes UI** : "Votre panier", "Vide", "Total", "Passer commande", "Supprimer", "Continuer"

**Interactions** : supprimer article, naviguer vers soumission

**Bugs/TODO** : aucun

**Hooks** : `useCart`, `useNavigate`, `useExchangeRate`

---

## src/components/cart/CategorySuggestionModal.tsx

**Fonction** : Modal en 3 étapes suggérant une autre catégorie de location après ajout au panier. Navigue vers `/?cat={cat}&start={start}&end={end}` avec les dates actuelles.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `currentCategory` : string (required)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)

**APIs externes** : aucune

**Events** : `trackGa4Event("category_suggestion_accepted", { from, to })`

**Textes UI** : "Vous avez pensé à...", noms de catégories, "Explorer cette catégorie", "Non merci"

**Interactions** : étapes suivant/précédent, accepter/refuser suggestion

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useNavigate`, `useTranslation`

---

## src/components/cart/SubmitProgressOverlay.tsx

**Fonction** : Overlay plein écran pendant la soumission du panier. 4 étapes de progression : "Vérification disponibilités", "Réservation en cours", "Confirmation", "Finalisation".

**Props** :
- `isVisible` : boolean (required)
- `currentStep` : number (required) — 0 à 3
- `error` : string | null (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Soumission en cours...", "Vérification des disponibilités", "Création de la réservation", "Confirmation", "Finalisation", labels des étapes

**Interactions** : aucune (overlay non interactif)

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/categories/CategoryShowcaseCard.tsx

**Fonction** : Bouton/carte individuelle pour une catégorie de location (Voiture, Moto, Hébergement, etc.).

**Props** :
- `category` : CategoryItem (required)
- `onSelect` : () => void (required)
- `isSelected` : boolean (optional)

**APIs externes** : aucune

**Events** : aucun (événement dans CategoryShowcaseModal)

**Textes UI** : nom de catégorie dynamique

**Interactions** : clic pour sélectionner

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/categories/CategoryShowcaseModal.tsx

**Fonction** : Modal listant toutes les catégories disponibles et "bientôt disponibles". Pour les catégories disponibles → navigue vers Explorer. Pour les catégories "coming-soon" → ouvre WhatsApp.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)

**APIs externes** : WhatsAppContactContext

**Events** :
- `trackGa4Event("category_select", { category })` — catégorie disponible sélectionnée
- `trackGa4Event("category_interest", { category })` — catégorie coming-soon (intérêt)

**Textes UI** : "Catégories de location", "Disponible", "Bientôt disponible", noms de catégories

**Interactions** : clic catégorie disponible → navigation, clic catégorie coming-soon → WhatsApp

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useNavigate`, `useWhatsAppContact`

---

## src/components/categories/ExploreCategoriesButton.tsx

**Fonction** : Bouton ghost "Explorer les catégories" qui ouvre CategoryShowcaseModal.

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Explorer les catégories"

**Interactions** : clic ouvre CategoryShowcaseModal

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/checkin/FinalizeCheckinProgressModal.tsx

**Fonction** : Modal plein écran avec cercle SVG de progression (stroke-dashoffset animé) pendant la finalisation du checkin/EDL. Anti-stall micro-creep (incréments visuels factices pour éviter perception de blocage).

**Props** :
- `isOpen` : boolean (required)
- `progress` : number (required) — 0 à 100
- `message` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : message dynamique, pourcentage, "Finalisation en cours..."

**Interactions** : aucune (non-dismissable)

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/checkin/SignatureCanvas.tsx

**Fonction** : Pad de signature HTML Canvas. Enregistre les traits à la souris/touch. Couleur de trait : `#065F6B`. Peut exporter en base64 PNG.

**Props** :
- `onSignature` : (dataUrl: string) => void (required)
- `width` : number (optional, default 400)
- `height` : number (optional, default 200)
- `className` : string (optional)

**APIs externes** : Canvas API

**Events** : aucun

**Textes UI** : "Signez ici", "Effacer"

**Interactions** : dessiner signature (mouse/touch), effacer, valider

**Bugs/TODO** : aucun

**Hooks** : `useRef`, `useEffect`, `useState`

---

## src/components/currency/ClientMgaPrice.tsx

**Fonction** : Affiche un prix en EUR (primaire) avec prix Ar en secondaire. Utilise ExchangeRateContext.

**Props** :
- `amountMga` : number (required)
- `className` : string (optional)
- `primaryClassName` : string (optional)
- `secondaryClassName` : string (optional)

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : prix formatés EUR + Ar

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useExchangeRate`

---

## src/components/currency/DualPrice.tsx

**Fonction** : Affiche un prix en double devise (client : EUR primaire + Ar secondaire ; admin : Ar primaire + EUR secondaire). Variantes inline ou stacked.

**Props** :
- `amountMga` : number (required)
- `variant` : "client" | "admin" (optional, default "client")
- `inline` : boolean (optional)
- `className` : string (optional)
- `primaryClassName` : string (optional)
- `secondaryClassName` : string (optional)

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : prix formatés dynamiques

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useExchangeRate`

---

## src/components/currency/OwnerDualCurrencyInput.tsx

**Fonction** : Input bidirectionnel Ar ↔ EUR synchronisé via taux de change. Saisie dans un champ met à jour l'autre automatiquement.

**Props** :
- `id` : string (required)
- `label` : string (required)
- `valueMga` : number | null (required)
- `onChangeMga` : (value: number | null) => void (required)
- `required` : boolean (optional)
- `minMga` : number (optional)
- `error` : string (optional)
- `showValidIcon` : boolean (optional)
- `arPlaceholder` : string (optional)
- `eurPlaceholder` : string (optional)
- `hint` : string (optional)
- `allowEmpty` : boolean (optional)

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : labels dynamiques, "Ar", "€", placeholders configurables

**Interactions** : saisie dans champ Ar ou EUR → synchronisation automatique

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/currency/PriceRows.tsx

**Fonction** : Deux composants layout : `ClientPriceRow` (ligne label + prix client) et `AdminPriceRow` (ligne label + prix admin). Utilisés dans les récapitulatifs de prix.

**Props** :
- `label` : string (required)
- `amountMga` : number (required)
- `bold` : boolean (optional)
- `className` : string (optional)

**APIs externes** : ExchangeRateContext (via DualPrice)

**Events** : aucun

**Textes UI** : label dynamique + prix formaté

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun (utilise DualPrice)

---

## src/components/explorer/EmptyCategoryState.tsx

**Fonction** : État vide quand aucun résultat ne correspond aux filtres. Affiche un CTA WhatsApp avec tracking GA4 et Meta.

**Props** :
- `category` : string (optional)
- `onReset` : () => void (optional)

**APIs externes** : WhatsAppContactContext

**Events** :
- `trackGa4Event("filter_empty_request", { category })`

**Textes UI** : "Aucun résultat", "Modifiez vos filtres ou contactez-nous", "Contacter via WhatsApp", "Réinitialiser les filtres"

**Interactions** : clic WhatsApp (avec tracking), clic reset filtres

**Bugs/TODO** : aucun

**Hooks** : `useWhatsAppContact`, `useTranslation`

---

## src/components/explorer/ExplorerVisualFilters.tsx

**Fonction** : Filtres visuels à deux niveaux : cards de catégorie principale + chips de sous-filtres. Sur mobile, les sous-filtres s'affichent dans un Drawer Radix.

**Props** :
- `categories` : CategoryFilter[] (required)
- `selectedCategory` : string | null (required)
- `onCategoryChange` : (cat: string | null) => void (required)
- `subFilters` : SubFilter[] (optional)
- `selectedSubFilter` : string | null (optional)
- `onSubFilterChange` : (sf: string | null) => void (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : noms de catégories dynamiques, "Tous", "Filtres"

**Interactions** : clic catégorie, clic sous-filtre, Drawer mobile

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/filters/FilterBar.tsx

**Fonction** : Barre de filtres sticky avec 4 filtres en Drawer : Prix, Catégorie véhicule, Type véhicule, Filtres additionnels. Label "Filtres:" hardcodé en français.

**Props** :
- `filters` : FilterState (required)
- `onFiltersChange` : (filters: FilterState) => void (required)
- `vehicleCount` : number (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Filtres:", "Prix", "Catégorie", "Type", "Plus de filtres", "{n} véhicule(s)"

**Interactions** : ouvrir/fermer chaque Drawer, appliquer filtres

**Bugs/TODO** : "Filtres:" hardcodé (pas traduit)

**Hooks** : `useState`

---

## src/components/filters/PriceFilter.tsx

**Fonction** : Filtre de prix avec slider range et histogramme de 10 bins. Affiche min/max en EUR.

**Props** :
- `minPrice` : number (required)
- `maxPrice` : number (required)
- `currentMin` : number (required)
- `currentMax` : number (required)
- `onChange` : (min: number, max: number) => void (required)
- `priceData` : number[] (optional) — données pour histogramme

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : prix min/max formatés, "€/jour"

**Interactions** : glisser slider range

**Bugs/TODO** : aucun

**Hooks** : `useMemo`, `useExchangeRate`

---

## src/components/filters/AdditionalFilters.tsx

**Fonction** : Filtres additionnels : checkboxes équipements (AC, GPS, Bluetooth…), selects carburant et transmission.

**Props** :
- `filters` : AdditionalFilterState (required)
- `onChange` : (filters: AdditionalFilterState) => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Climatisation", "GPS", "Bluetooth", "CarPlay", "USB", "Carburant", "Transmission", options dynamiques

**Interactions** : checkboxes, selects

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/filters/VehicleCategoryFilter.tsx

**Fonction** : Grille de filtres par catégorie de carrosserie : Citadine, Berline, SUV, Break, Coupé, Cabriolet, Utilitaire, Camionnette, Minibus, Pick-up, Autres.

**Props** :
- `selected` : string[] (required)
- `onChange` : (selected: string[]) => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Citadine", "Berline", "SUV", "Break", "Coupé", "Cabriolet", "Utilitaire", "Camionnette", "Minibus", "Pick-up", "Autres"

**Interactions** : clic pour sélectionner/déselectionner

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/filters/VehicleTypeFilter.tsx

**Fonction** : Grille de filtres par type : Utilitaire, Citadine, Berline, Familiale, Minibus, 4x4, Cabriolet, Coupé, Collection, Van aménagé, SUV.

**Props** :
- `selected` : string[] (required)
- `onChange` : (selected: string[]) => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Utilitaire", "Citadine", "Berline", "Familiale", "Minibus", "4x4", "Cabriolet", "Coupé", "Collection", "Van aménagé", "SUV"

**Interactions** : clic pour sélectionner/déselectionner

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/forms/DriverLicenseForm.tsx

**Fonction** : Formulaire de saisie du permis de conduire (numéro, pays émission, date expiration) avec IOSPicker. Soumission via `handleSubmit`.

**Props** :
- `onSuccess` : () => void (optional)
- `userId` : string (required)

**APIs externes** : aucune (BUG : soumission uniquement console.log)

**Events** : aucun

**Textes UI** : "Permis de conduire", "Numéro de permis", "Pays d'émission", "Date d'expiration", "Enregistrer"

**Interactions** : saisie formulaire, sélection IOSPicker, soumission

**Bugs/TODO** :
- **BUG** : `handleSubmit` ne fait qu'un `console.log` des données, aucun appel API réel — le permis n'est jamais sauvegardé

**Hooks** : `useState`, `useForm`

---

## src/components/home/HomeBlogPreview.tsx

**Fonction** : Aperçu des 3 premiers articles de blog (depuis constante `BLOG_POSTS`). Lien vers `/blog`.

**Props** :
- `className` : string (optional)

**APIs externes** : aucune (données statiques)

**Events** : aucun

**Textes UI** : "Blog", "Voir tous les articles", titres/excerpts des posts

**Interactions** : navigation vers articles et page blog

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/home/HomeDayContextStrip.tsx

**Fonction** : Bande de contexte affichant 4 chips : météo (Open Meteo), vols (aviation API), taux de change, heure locale. Variantes "hero" (sombre) et "results" (clair).

**Props** :
- `variant` : "hero" | "results" (optional, default "hero")
- `className` : string (optional)

**APIs externes** :
- Open Meteo API : via `useNosyBeWeather` hook
- Aviation/flights API : via `useNosyBeFlights` hook
- ExchangeRateContext : taux EUR/MGA

**Events** : aucun

**Textes UI** : température °C, description météo, "Vols", "1 EUR = X Ar", heure locale "HH:mm"

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useNosyBeWeather`, `useNosyBeFlights`, `useExchangeRate`, `useState`, `useEffect`

---

## src/components/home/HomeHeroTrustStrip.tsx

**Fonction** : Bande de confiance sous le hero affichant nb de véhicules et prix minimum.

**Props** :
- `vehicleCount` : number (optional)
- `minPrice` : number (optional)
- `className` : string (optional)

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : "{n} véhicules disponibles", "À partir de {price}/jour", "Paiement sécurisé", "Assistance 24h/24"

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useExchangeRate`

---

## src/components/home/HomeResults.tsx

**Fonction** : Section résultats principale. `PAGE_SIZE=9`. Affiche les cartes VehicleCard, MotoVehicleCard ou AccommodationCard selon la catégorie. Gère la pagination, les filtres actifs et l'état vide.

**Props** :
- `vehicles` : Vehicle[] (required)
- `category` : string (optional)
- `isLoading` : boolean (optional)
- `totalCount` : number (optional)
- `onLoadMore` : () => void (optional)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)

**APIs externes** : aucune directe

**Events** : `trackGa4Event("view_item_list", { category, count })` au montage

**Textes UI** : "{n} résultat(s)", "Charger plus", "Aucun résultat"

**Interactions** : clic véhicule (navigate), pagination "Charger plus"

**Bugs/TODO** : aucun

**Hooks** : `useEffect`, `useNavigate`, `useExchangeRate`

---

## src/components/i18n/LanguageSwitcher.tsx

**Fonction** : Dropdown de sélection de langue : FR, EN, IT, DE. Persiste le choix via `i18n.changeLanguage()`.

**Props** :
- `className` : string (optional)

**APIs externes** : i18next

**Events** : aucun

**Textes UI** : "Français", "English", "Italiano", "Deutsch", codes langue "FR", "EN", "IT", "DE"

**Interactions** : clic pour changer de langue

**Bugs/TODO** : aucun

**Hooks** : `useTranslation`

---

## src/components/icons/AutomaticTransmissionIcon.tsx

**Fonction** : SVG inline représentant un sélecteur de vitesses automatique (positions P/R/N/D/L).

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "P", "R", "N", "D", "L" (labels SVG)

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/icons/ManualTransmissionIcon.tsx

**Fonction** : SVG inline représentant un schéma de boîte de vitesses manuelle (H-pattern).

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : numéros de vitesses en SVG ("1" à "6", "R")

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/layout/WhatsAppFloatingButton.tsx

**Fonction** : Bouton flottant mobile (FAB) WhatsApp draggable. Apparaît uniquement sur mobile (`md:hidden`). Draggable avec Pointer Events API. Bulle de message auto-masquée après 5000ms. Position persistée dans localStorage (`rentanoo_whatsapp_fab_pos`). Hint de drag persisté dans localStorage (`rentanoo_whatsapp_drag_hint_seen`). État de dismissal dans sessionStorage.

**Props** : aucune

**APIs externes** :
- WhatsAppContactContext : `waUrl`, `phoneDisplay`, `contact`
- localStorage : position FAB, hint drag vu
- sessionStorage : bulle dismissée

**Events** :
- `trackWhatsAppFabEvent("whatsapp_bubble_shown", { page_path, trigger })` — bulle apparaît
- `trackWhatsAppFabEvent("whatsapp_fab_drag", { page_path })` — drag FAB
- `trackWhatsAppFabEvent("whatsapp_fab_click", { page_path, bubble_visible })` — clic FAB
- `trackMetaContact()` — Meta Pixel
- `trackGa4Event("contact", { method: "whatsapp" })` — GA4

**Textes UI** : "Bonjour ! Je suis Chris, le gérant de Rentanoo. Je suis disponible pour répondre à vos questions.", "Réponse habituelle sous 2 h.", "Maintenir pour déplacer"

**Interactions** : drag (Pointer Events), clic (ouvre WhatsApp dans nouvel onglet), dismiss bulle

**Bugs/TODO** :
- `console.log` debug ligne ~217 : `"[WA] onAvatarClick — fbq/gtag check"` — à supprimer en prod

**Hooks** : `useState`, `useEffect`, `useRef`, `useCallback`, `useLocation`, `useTranslation`, `useWhatsAppContact`, `useWhatsAppBubbleTrigger`

---

## src/components/layout/WhatsAppHeader.tsx

**Fonction** : Header sticky desktop-only (masqué sur mobile `hidden md:block`). Affiche 3 contacts : WhatsApp, ligne directe tel:, email. Se masque quand on scrolle (> 8px) et réapparaît en haut. Téléphone fixe : +261373437912.

**Props** : aucune

**APIs externes** :
- WhatsAppContactContext : `waUrl`, `phoneDisplay`

**Events** :
- `trackMetaContact()` — Meta Pixel (clic WhatsApp)
- `trackGa4Event("contact", { method: "whatsapp" })` — GA4

**Textes UI** : `phoneDisplay` (dynamique), "+261 37 34 379 12" (direct), "Contact WhatsApp uniquement", "WhatsApp uniquement", "Ligne directe", "Appelez-nous", "Envoyez un email"

**Interactions** : clic WhatsApp (window.open), clic téléphone (`tel:` href), clic email (Link vers /contact)

**Bugs/TODO** :
- `console.log` debug lignes 35-36 et 40 : vérification fbq/gtag — à supprimer en prod

**Hooks** : `useState`, `useEffect`, `useTranslation`, `useWhatsAppContact`

---

## src/components/layout/WhatsAppIcon.tsx

**Fonction** : SVG logo WhatsApp pur (path SVG).

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : aucun

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/layout/navbar.tsx

**Fonction** : Navbar principale. Charge le profil utilisateur courant via `ProfileService.getCurrentUserProfile()`. Affiche menu selon rôle (admin, owner, renter). Icône panier avec badge count. Menu mobile hamburger. Logo Rentanoo lien vers `/`.

**Props** : aucune

**APIs externes** :
- ProfileService : `getCurrentUserProfile()`
- AuthContext : `user`, `signOut`, `loading`
- CartContext : items count

**Events** : `trackGa4Event("logout")` (déconnexion)

**Textes UI** : "Rentanoo", "Explorer", "Mes réservations", "Mon espace", "Tableau de bord", "Administration", "Louer mon véhicule", "Connexion", "Déconnexion", "Profil", "Panier"

**Interactions** : navigation, déconnexion, ouverture panier (Sheet), menu mobile

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useNavigate`, `useAuth`, `useCart`, `useTranslation`

---

## src/components/layout/footer.tsx

**Fonction** : Pied de page 4 colonnes avec navigation (Explorer, À propos, Légal) et liens sociaux. Mention © Rentanoo.

**Props** : aucune

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rentanoo", "La location de voitures à Nosy Be", "Explorer", "Location de voitures", "Location de motos", "Hébergements", "À propos", "Blog", "Contact", "Devenir loueur", "Légal", "CGU", "Politique de confidentialité", "Politique d'annulation", "© {year} Rentanoo. Tous droits réservés."

**Interactions** : liens de navigation

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/listing/ListingDescriptionContent.tsx

**Fonction** : Renderer Markdown léger pour la description d'annonce. Supporte `### titres`, `**gras**`, lignes commençant par `✅` (listes), et bullets emoji.

**Props** :
- `description` : string (required)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : texte dynamique (description)

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useMemo`

---

## src/components/location/LocationAreaSelect.tsx

**Fonction** : Select + création inline de zones géographiques. Charge les zones actives via `LocationAreasService.listActive()`, permet en créer une nouvelle via `createByName()`.

**Props** :
- `value` : string (required)
- `onChange` : (value: string) => void (required)
- `label` : string (optional)
- `required` : boolean (optional)

**APIs externes** :
- LocationAreasService : `listActive()` (Supabase `location_areas` table), `createByName()` (INSERT)

**Events** : aucun

**Textes UI** : label dynamique, "Ajouter '{value}'", "Aucune zone disponible"

**Interactions** : sélection zone, création nouvelle zone

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/owner/VehicleTypeModal.tsx

**Fonction** : Dialog de sélection du type d'annonce à créer : Voiture, Moto/Scooter, Quad/Buggy, Hébergement.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `onSelect` : (type: "car" | "moto" | "quad" | "hebergement") => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Quel type de bien souhaitez-vous louer ?", "Voiture", "Moto / Scooter", "Quad / Buggy", "Hébergement"

**Interactions** : clic sur type → callback + ferme dialog

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/seo/HowItWorksTimeline.tsx

**Fonction** : Timeline 5 étapes "Comment ça marche ?" pour les hébergements. Desktop horizontal, mobile vertical. Textes 100% hardcodés en français.

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** :
1. "Choisissez votre logement" / "Sélectionnez vos dates et options"
2. "Envoyez votre demande" / "Aucun engagement à cette étape"
3. "Nous vérifions la disponibilité" / "Notre équipe contacte directement le propriétaire"
4. "Vous recevez notre réponse" / "Par email ou WhatsApp, sous 24h"
5. "Réglez votre acompte" / "50% via Orange Money ou CB, le reste sur place"

**Interactions** : aucune

**Bugs/TODO** : aucun texte i18n — 100% hardcodé en français

**Hooks** : aucun

---

## src/components/seo/Seo.tsx

**Fonction** : Composant SEO via react-helmet-async. Injecte `<title>`, `<meta description>`, Open Graph, Twitter Card, canonical URL. Supporte JSON-LD structuré (FAQPage, BreadcrumbList, etc.).

**Props** :
- `title` : string (required)
- `description` : string (optional)
- `canonical` : string (optional)
- `image` : string (optional)
- `jsonLd` : object | object[] (optional)
- `noindex` : boolean (optional)
- `lang` : string (optional)

**APIs externes** : react-helmet-async

**Events** : aucun

**Textes UI** : aucun visible (meta tags uniquement)

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/seo/SeoHebergementPageTemplate.tsx

**Fonction** : Template complet pour pages SEO hébergements. Fetch des 20 premiers hébergements Supabase (table `vehicles` + photos). JSON-LD FAQPage + BreadcrumbList. Carrousel Embla. IntersectionObserver pour scroll-reveal. Modal politique d'annulation.

**Props** :
- `slug` : string (required)
- `title` : string (required)
- `description` : string (required)
- `hero` : HeroConfig (required)
- `faqs` : FAQ[] (required)
- `breadcrumbs` : Breadcrumb[] (optional)
- `highlights` : string[] (optional)

**APIs externes** :
- Supabase : `vehicles` table (filter `category=hebergement`, limit 20), `vehicle_photos` join

**Events** : aucun

**Textes UI** : titres/descriptions dynamiques, "Comment ça marche ?", "FAQ", "Politique d'annulation", "Annuler"

**Interactions** : carrousel Embla (swipe/boutons), accordion FAQ, modal politique annulation, scroll-reveal animations

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useRef`, `useExchangeRate`

---

## src/components/seo/SeoPageLayout.tsx

**Fonction** : 16 primitives de layout pour les pages SEO : `SeoSection`, `SeoGrid`, `SeoCard`, `SeoHeading`, `SeoParagraph`, `SeoList`, `SeoListItem`, `SeoHighlight`, `SeoCallout`, `SeoBreadcrumb`, `SeoHero`, `SeoFAQ`, `SeoStats`, `SeoFeatures`, `SeoPricing`, `SeoContact`.

**Props** : props génériques (className, children, etc.) selon le composant

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : contenu dynamique (slots)

**Interactions** : aucune (layout seulement)

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/seo/WaveDivider.tsx

**Fonction** : Divider SVG décoratif en forme de vague.

**Props** :
- `className` : string (optional)
- `flip` : boolean (optional)
- `color` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : aucun

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/seo/index.ts

**Fonction** : Re-exports depuis `Seo.tsx` (`Seo`, default export).

**Props** : N/A

**APIs externes** : N/A

**Events** : N/A

**Textes UI** : N/A

**Interactions** : N/A

**Bugs/TODO** : aucun

**Hooks** : N/A

---

## src/components/shared/ShareButton.tsx

**Fonction** : Bouton dropdown avec 3 actions de partage : copier le lien, partager sur Facebook, partager sur WhatsApp.

**Props** :
- `url` : string (required)
- `title` : string (optional)
- `className` : string (optional)

**APIs externes** :
- `navigator.clipboard.writeText()` — copie lien
- Ouverture window.open vers Facebook et WhatsApp

**Events** : aucun

**Textes UI** : "Partager", "Copier le lien", "Partager sur Facebook", "Partager sur WhatsApp", "Lien copié !"

**Interactions** : copier, partager Facebook, partager WhatsApp

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/shared/TranslatableDescription.tsx

**Fonction** : Affiche la description FR par défaut. Appelle `POST /api/translate` (n8n ou Edge Function) pour traduction EN/DE/IT. Affiche une description traduite stockée (champs EN/IT/DE) si disponible.

**Props** :
- `descriptionFr` : string (required)
- `descriptionEn` : string (optional)
- `descriptionIt` : string (optional)
- `descriptionDe` : string (optional)
- `vehicleId` : string (optional)

**APIs externes** :
- `POST /api/translate` — traduction machine (n8n ou Edge Function Supabase)

**Events** : aucun

**Textes UI** : texte de description dynamique, "Traduire", "Traduction en cours...", "Voir l'original"

**Interactions** : clic "Traduire" (appel API), toggle original/traduit

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useTranslation`, `i18n`

---

## src/components/vehicles/VehicleCardRentalPricing.tsx

**Fonction** : Affiche le prix journalier et le total de location calculé selon la durée.

**Props** :
- `vehicle` : Vehicle (required)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)
- `className` : string (optional)

**APIs externes** : ExchangeRateContext

**Events** : aucun

**Textes UI** : prix/jour, total dynamique, "Total pour {n} jours"

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useExchangeRate`, `useMemo`

---

## src/components/vehicles/VehicleServiceOptions.tsx

**Fonction** : Checkboxes de sélection des services optionnels (aéroport pickup/dropoff, barge, livraison, siège bébé, conducteur additionnel). Lit/écrit dans localStorage (draft). Résout les exclusions pickup/return. Contient des `console.log` debug extensifs.

**Props** :
- `vehicleId` : string (required)
- `vehicle` : Vehicle (optional)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)
- `onOptionsChange` : (options: ServiceOption[]) => void (required)
- `selectedOptions` : ServiceOption[] (optional)

**APIs externes** : localStorage

**Events** : aucun

**Textes UI** : "Services optionnels", "Prise en charge à l'aéroport", "Restitution à l'aéroport", "Récupération Barge Grande Terre", "Retour Barge Grande Terre", "Récupération Barge Petite Terre", "Retour Barge Petite Terre", "Livraison à domicile (aller)", "Livraison à domicile (retour)", "Siège bébé", "Conducteur additionnel"

**Interactions** : checkboxes de sélection d'options

**Bugs/TODO** :
- `console.log` debug extensifs (résolution exclusions, état des options) — à supprimer en prod

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/vehicles/VehicleServiceOptions_new.tsx

**Fonction** : Fichier vide (1 ligne). Vestige non utilisé.

**Props** : N/A

**APIs externes** : N/A

**Events** : N/A

**Textes UI** : N/A

**Interactions** : N/A

**Bugs/TODO** : Fichier vide — à supprimer

**Hooks** : N/A

---

## src/components/vehicles/InteractiveCalendar.tsx

**Fonction** : Calendrier propriétaire drag-select pour marquer les disponibilités. Option de répétition sur 3 mois. Contient des `console.log` debug.

**Props** :
- `availableDates` : string[] (required)
- `onChange` : (dates: string[]) => void (required)
- `vehicleId` : string (required)
- `readOnly` : boolean (optional)

**APIs externes** : date-fns (locale fr)

**Events** : aucun

**Textes UI** : noms des mois, jours de la semaine, "Répéter sur 3 mois", "Enregistrer les disponibilités"

**Interactions** : clic pour toggle jour, drag pour sélection multiple, bouton répéter

**Bugs/TODO** :
- `console.log` debug — à supprimer en prod

**Hooks** : `useState`, `useRef`, `useCallback`, `useMemo`

---

## src/components/vehicles/MultiVehicleModal.tsx

**Fonction** : Modal upsell proposant d'ajouter d'autres véhicules. Charge d'autres véhicules depuis Supabase. Contient des `console.log` debug extensifs. Navigue vers "/" pour explorer plus.

**Props** :
- `open` : boolean (required)
- `onOpenChange` : (open: boolean) => void (required)
- `currentVehicleId` : string (required)
- `onAddVehicle` : (vehicle: Vehicle) => void (required)

**APIs externes** :
- Supabase : requête véhicules `vehicles` table (exclusion véhicule courant, limit 6)

**Events** : `trackGa4Event("multi_vehicle_suggestion_shown")`, `trackGa4Event("multi_vehicle_accepted", { vehicleId })`

**Textes UI** : "Combiner plusieurs véhicules", "Explorer plus de véhicules", "Ajouter", "Non merci"

**Interactions** : ajouter véhicule, naviguer vers explorer, fermer

**Bugs/TODO** :
- `console.log` debug extensifs — à supprimer en prod

**Hooks** : `useState`, `useEffect`, `useNavigate`, `useExchangeRate`

---

## src/components/vehicles/VehicleAvatar.tsx

**Fonction** : Deux exports : `VehicleAvatar` (miniature ronde avec image principale du véhicule, fallback initiales) et `VehiclePhotoLightbox` (overlay plein écran pour visualiser la photo).

**Props** (VehicleAvatar) :
- `vehicle` : Vehicle (required)
- `size` : "sm" | "md" | "lg" (optional)
- `className` : string (optional)
- `onClick` : () => void (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : aucun

**Interactions** : clic pour ouvrir lightbox

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/vehicles/moto-vehicle-card.tsx

**Fonction** : Carte moto/scooter. Affiche badge permis requis, marque/modèle, cylindrée, vitesses, localisation, prix. Charge photo principale depuis `PhotoService` avec fallback.

**Props** :
- `vehicle` : Vehicle (required)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)
- `onClick` : () => void (optional)

**APIs externes** :
- PhotoService : charge photo principale (Supabase `vehicle_photos` table)

**Events** : aucun

**Textes UI** : "Permis requis", marque/modèle dynamique, "cc", vitesses, localisation, prix "/jour"

**Interactions** : clic sur carte

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/vehicles/vehicle-card.tsx

**Fonction** : Carte voiture. Affiche badge permis, badge AC, marque/modèle, specs (places, portes, transmission, carburant), zones de prise en charge, prix. Charge photo principale depuis `PhotoService`.

**Props** :
- `vehicle` : Vehicle (required)
- `startDate` : Date | null (optional)
- `endDate` : Date | null (optional)
- `onClick` : () => void (optional)

**APIs externes** :
- PhotoService : charge photo principale (Supabase `vehicle_photos` table)

**Events** : aucun

**Textes UI** : "Avec permis", badge "AC", marque/modèle, specs dynamiques, zones, prix "/jour"

**Interactions** : clic sur carte

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useExchangeRate`

---

## src/components/ui/status-badge.tsx

**Fonction** : Badge de statut coloré pour les entités booking/payment/vehicle/KYC. Taille configurable. Diagnostic i18n en mode DEV (`console.info` si traduction manquante).

**Props** :
- `status` : string (required)
- `size` : "sm" | "md" | "lg" (optional)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : statuts traduits dynamiquement (pending, confirmed, active, completed, cancelled, rejected, etc.)

**Interactions** : aucune

**Bugs/TODO** : `console.info` diagnostic i18n en DEV — acceptable (conditionnel)

**Hooks** : `useTranslation`

---

## src/components/ui/user-avatar.tsx

**Fonction** : Avatar utilisateur depuis `user_metadata.avatar_url`, fallback initiales (firstName[0] + lastName[0]).

**Props** :
- `user` : User | null (optional)
- `size` : "sm" | "md" | "lg" | "xl" (optional)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : initiales dynamiques

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/payment-countdown.tsx

**Fonction** : Compte à rebours live (update chaque seconde) depuis `confirmedAt` + 48h. Rouge si < 4h, orange sinon.

**Props** :
- `confirmedAt` : Date (required)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "HH:MM:SS" formaté, "Expiré"

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect` (interval 1s)

---

## src/components/ui/PhotoCaptureField.tsx

**Fonction** : Champ de capture photo (camera/galerie). Compresse les images (maxWidth:1280, quality:0.72, maxSizeMB:0.3) avant output. Supporte output File[] ou base64. Limit concurrente 2 (mapLimit).

**Props** :
- `label` : string (required)
- `description` : string (optional)
- `value` : string | string[] | null (optional) — URLs existantes
- `onChange` : (value: string | string[]) => void (required)
- `onFileChange` : (files: File[]) => void (optional) — output File direct
- `multiple` : boolean (optional)
- `className` : string (optional)

**APIs externes** :
- `compressImage()` — compression locale (canvas)

**Events** : aucun

**Textes UI** : label dynamique, description dynamique, "Prendre une photo", "Choisir dans la galerie", "Supprimer"

**Interactions** : capture camera, sélection galerie, suppression photo, prévisualisation

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useRef`, `useCallback`

---

## src/components/ui/BrandCombobox.tsx

**Fonction** : Combobox de sélection de marque de véhicule avec recherche filtrée (Popover + Input).

**Props** :
- `value` : string (required)
- `onChange` : (v: string) => void (required)
- `options` : string[] (required)
- `placeholder` : string (optional, default "Sélectionner")
- `buttonClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rechercher une marque...", "Aucun résultat"

**Interactions** : ouverture Popover, saisie pour filtrer, clic pour sélectionner

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useMemo`

---

## src/components/ui/ColorCombobox.tsx

**Fonction** : Combobox de sélection de couleur de véhicule avec chip couleur visuel (hex background).

**Props** :
- `value` : string (required)
- `onChange` : (v: string) => void (required)
- `options` : ColorOption[] (required) — `{ name: string; hex: string }`
- `placeholder` : string (optional)
- `buttonClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rechercher une couleur...", "Aucun résultat"

**Interactions** : ouverture Popover, filtrage, sélection avec aperçu couleur

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useMemo`

---

## src/components/ui/FuelTypeCombobox.tsx

**Fonction** : Combobox de sélection du type de carburant avec icône et description.

**Props** :
- `value` : string (required)
- `onChange` : (v: string) => void (required)
- `options` : FuelType[] (required) — `{ value, label, icon, description? }`
- `placeholder` : string (optional)
- `buttonClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rechercher un carburant...", "Aucun résultat"

**Interactions** : ouverture Popover, filtrage, sélection

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useMemo`

---

## src/components/ui/TransmissionTypeCombobox.tsx

**Fonction** : Combobox de sélection du type de transmission avec icône et description.

**Props** :
- `value` : string (required)
- `onChange` : (v: string) => void (required)
- `options` : TransmissionType[] (required)
- `placeholder` : string (optional)
- `buttonClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rechercher une transmission...", "Aucun résultat"

**Interactions** : ouverture Popover, filtrage, sélection

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useMemo`

---

## src/components/ui/VehicleCategoryCombobox.tsx

**Fonction** : Combobox de sélection de catégorie de véhicule avec icône et exemples.

**Props** :
- `value` : string (required)
- `onChange` : (v: string) => void (required)
- `options` : VehicleCategory[] (required)
- `placeholder` : string (optional)
- `buttonClassName` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Rechercher une catégorie...", "Aucun résultat", "ex: {exemples}"

**Interactions** : ouverture Popover, filtrage, sélection

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useMemo`

---

## src/components/ui/equipment-modal.tsx

**Fonction** : Dialog de sélection d'équipements véhicule. Équipements essentiels (6 : Climatisation, GPS, Bluetooth, CarPlay, USB, Grand coffre) + options supplémentaires (13) expandables. "Tout sélectionner", "Tout effacer". Actions save/cancel.

**Props** :
- `selectedEquipment` : string[] (required)
- `onEquipmentChange` : (equipment: string[]) => void (required)
- `trigger` : ReactNode (optional)
- `open` : boolean (optional)
- `onOpenChange` : (open: boolean) => void (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Équipements du véhicule", "Sélectionnez les équipements disponibles", "équipement(s) sélectionné(s)", "Tout sélectionner", "Tout effacer", "Équipements essentiels", "Voir plus d'options ({n})", "Voir moins d'options", "Options supplémentaires", "Annuler", "Valider ({n})"

**Interactions** : sélection/déselection individuelle, sélection en masse, toggle "plus d'options", save/cancel

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `useRef`

---

## src/components/ui/equipment-selector.tsx

**Fonction** : Sélecteur d'équipements avec affichage badge des sélections et bouton "Modifier". Wrapper autour de `EquipmentModal`.

**Props** :
- `equipment` : EquipmentObject (required) — objet avec 19 clés booléennes (hasAC, hasGPS, etc.)
- `onEquipmentChange` : (equipment: EquipmentObject) => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Équipements", "{n} sélectionné(s)", "Aucun équipement sélectionné", "Ajouter des équipements", "Modifier les équipements"

**Interactions** : supprimer badge individuel, ouvrir modal EquipmentModal

**Bugs/TODO** : aucun

**Hooks** : aucun (composant pur calculé)

---

## src/components/ui/airport-services.tsx

**Fonction** : Configuration des services aéroport pour un loueur. Switch global "Service Aéroport", puis deux ServiceCard (Retrait/Restitution) chacun avec switch, toggle Gratuit/Payant, et input prix. Prix par défaut payant : 25€.

**Props** :
- `data` : AirportServiceData (required)
- `onChange` : (data: AirportServiceData) => void (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Service Aéroport", "Prise en charge et retour à l'aéroport", "Retrait", "Le client récupère le véhicule", "Restitution", "Le client dépose le véhicule", "Tarification", "Gratuit", "Payant", "Prix du service", "Standard: 25€"

**Interactions** : switches on/off, toggle Gratuit/Payant, input prix

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/airport-services-simple.tsx

**Fonction** : Composant de test simplifié du service aéroport (stub de développement, non utilisé en production).

**Props** : aucune

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Service Aéroport - Version Simple", "Test du composant simplifié", "Bouton de test"

**Interactions** : aucune

**Bugs/TODO** : Fichier de test/stub — à supprimer en production

**Hooks** : aucun

---

## src/components/ui/pickup-zones-modal.tsx

**Fonction** : Dialog de sélection des zones de prise en charge pour un loueur. Points stratégiques (grid 1-col) + Communes (grid 2-col). "Tout sélectionner", "Tout effacer". Actions save/cancel.

**Props** :
- `selectedZones` : string[] (required)
- `onZonesChange` : (zones: string[]) => void (required)
- `trigger` : ReactNode (optional)
- `open` : boolean (optional)
- `onOpenChange` : (open: boolean) => void (optional)

**APIs externes** : données depuis `NOSYBE_STRATEGIC_POINTS` et `NOSYBE_LOCATIONS` (constantes)

**Events** : aucun

**Textes UI** : "Zones de prise en charge", "Sélectionnez les zones où vous acceptez de prendre en charge vos clients", "{n} zone(s) sélectionnée(s)", "Tout sélectionner", "Tout effacer", "Zones sélectionnées", "Points stratégiques", "Communes", "Annuler", "Valider ({n})"

**Interactions** : toggle zones, badges avec suppression, sélection masse, save/cancel

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/ui/search-bar-airbnb.tsx

**Fonction** : Barre de recherche style Airbnb. Champs : lieu de prise en charge (feature flag `FEATURES.pickupLocationEnabled`), dates de départ/retour, heures. Charge lazy : `SingleLocationModal`, `SearchBarDatePickerModal`, `SearchBarTimePickerModal`. Locale date-fns chargée dynamiquement selon i18n.language. Bouton reset si critères sélectionnés.

**Props** :
- `searchText` : string (required)
- `onSearchTextChange` : (text: string) => void (required)
- `startDate` : Date | null (required)
- `endDate` : Date | null (required)
- `onStartDateChange` : (date: Date | null) => void (required)
- `onEndDateChange` : (date: Date | null) => void (required)
- `startTime` : string (required)
- `endTime` : string (required)
- `onStartTimeChange` : (time: string) => void (required)
- `onEndTimeChange` : (time: string) => void (required)
- `onSearch` : () => void (required)
- `searching` : boolean (optional, default false)
- `onResetSearch` : () => void (optional)

**APIs externes** : aucune directe

**Events** : aucun

**Textes UI** : "Départ", "Retour", "Date", "Heure", "Sélectionner", "--:--", "Je lance la recherche", "Recherche en cours…", "Réinitialiser", "Lieu de prise en charge", "Rechercher une ville de prise en charge"

**Interactions** : clic départ → SearchBarDatePickerModal, clic heure → SearchBarTimePickerModal, puis retour automatiquement, clic search, clic reset

**Bugs/TODO** :
- `onValidate` dans SearchBarDatePickerModal force `setShowTimePicker(true)` inconditionnellement (`if (openTimeAfterDates || true)`) — la condition `|| true` rend le flag `openTimeAfterDates` inutile

**Hooks** : `useState`, `useEffect`, `useTranslation`

---

## src/components/ui/search-bar-date-picker-modal.tsx

**Fonction** : Modal calendrier date range via `createPortal` vers `radix-portal-root`. 1 mois sur mobile, 2 mois sur desktop (MediaQuery). Bouton "Valider mes dates" apparu seulement quand startDate ET endDate sélectionnées.

**Props** :
- `startDate` : Date | null (required)
- `endDate` : Date | null (required)
- `onStartDateChange`, `onEndDateChange` : handlers (required)
- `dateLocale` : Locale (required)
- `onClose` : () => void (required)
- `onValidate` : () => void (required)
- `t` : TFunction (required)

**APIs externes** : LazyDatePicker (react-datepicker)

**Events** : aucun

**Textes UI** : "Sélectionner des dates", "Fermer", "Valider mes dates"

**Interactions** : sélection date range, fermer, valider

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/ui/search-bar-time-picker-modal.tsx

**Fonction** : Modal de sélection d'heures (départ + retour) via `createPortal`. Deux Selects (00:00 à 23:00).

**Props** :
- `startTime` : string (required)
- `endTime` : string (required)
- `onStartTimeChange`, `onEndTimeChange` : handlers (required)
- `onClose` : () => void (required)
- `t` : TFunction (required)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Sélectionner les heures", "Heure de départ", "Heure de retour", "Valider mes heures", "Fermer"

**Interactions** : sélection heure départ/retour, valider (= fermer)

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/time-picker.tsx

**Fonction** : Sélecteur heure:minute avec deux Selects (heures 00-23, minutes 00/15/30/45). Variante `highlighted` avec animation pulse.

**Props** :
- `value` : string (required) — format "HH:MM"
- `onChange` : (time: string) => void (required)
- `highlighted` : boolean (optional, default false)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Heure :"

**Interactions** : sélection heure, sélection minute

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/ios-picker.tsx

**Fonction** : Deux exports : `IOSPicker` (single column) et `MultiColumnIOSPicker` (multi-colonnes). Style scroll-snap simulant le picker iOS. Bottom sheet avec backdrop. Toolbar "Terminé".

**Props** (IOSPicker) :
- `items` : PickerItem[] (required) — `{ value, label }`
- `selectedValue` : string (optional)
- `onSelect` : (value: string) => void (required)
- `placeholder` : string (optional)
- `className` : string (optional)
- `disabled` : boolean (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Terminé", "‹", "›", placeholder dynamique

**Interactions** : scroll pour naviguer dans la liste, clic pour sélectionner, clic "Terminé" pour fermer, clic backdrop pour fermer

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useRef`, `useEffect`

---

## src/components/ui/lazy-date-picker.tsx

**Fonction** : Wrapper lazy pour react-datepicker. Charge le composant + CSS uniquement au premier rendu (lazy import). Fallback spinner.

**Props** : étend `ReactDatePickerProps`

**APIs externes** : react-datepicker (lazy)

**Events** : aucun

**Textes UI** : (spinner) "Chargement..."

**Interactions** : toutes les interactions DatePicker passées en props

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `lazy`, `Suspense`

---

## src/components/ui/lazy-phone-input.tsx

**Fonction** : Wrapper lazy pour react-phone-number-input. Charge le composant + CSS uniquement à la demande. Fallback "Chargement...".

**Props** : étend `PhoneInputProps`

**APIs externes** : react-phone-number-input (lazy)

**Events** : aucun

**Textes UI** : "Chargement..."

**Interactions** : toutes les interactions PhoneInput passées en props

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`, `lazy`, `Suspense`

---

## src/components/ui/location-dropdown.tsx

**Fonction** : Input autocomplete pour sélection de ville/zone Nosy Be (côté client). Dropdown avec liste complète ou filtrée. Navigation clavier (ArrowUp/Down, Enter, Escape). Bouton reset optionnel. Source de données : constante `NOSYBE_CITIES`.

**Props** :
- `value` : string (required)
- `onChange` : (location: string) => void (required)
- `placeholder` : string (optional)
- `className` : string (optional)
- `disabled` : boolean (optional)
- `showResetButton` : boolean (optional)
- `onReset` : () => void (optional)
- `onEnter` : () => void (optional)

**APIs externes** : aucune (données statiques `NOSYBE_CITIES`)

**Events** : aucun

**Textes UI** : "Toutes les zones de Nosy Be", "Suggestions", "Cliquez sur une ville pour la sélectionner", "Utilisez ↑/↓ pour naviguer"

**Interactions** : saisie filtrée, bouton dropdown liste complète, navigation clavier, sélection ville, reset

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useRef`, `useEffect`, `forwardRef`

---

## src/components/ui/owner-location-dropdown.tsx

**Fonction** : Identique à `LocationDropdown` mais pour les propriétaires. Filtre 3 villes non pertinentes pour loueurs : "Aéroport", "Barge Petite Terre", "Barge Grande Terre". Label header "Zones de Nosy Be (Loueurs)".

**Props** : identiques à LocationDropdown

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Zones de Nosy Be (Loueurs)", "Suggestions", "Cliquez sur une ville pour la sélectionner", "Utilisez ↑/↓ pour naviguer"

**Interactions** : identiques à LocationDropdown

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useRef`, `useEffect`, `forwardRef`

---

## src/components/ui/single-location-modal.tsx

**Fonction** : Dialog de sélection d'un seul lieu de prise en charge (radio-style). Points stratégiques + Communes. Actions Annuler/Valider (désactivé si aucune sélection). Bouton "Effacer".

**Props** :
- `selectedLocation` : string (required)
- `onLocationChange` : (location: string) => void (required)
- `trigger` : ReactNode (required)
- `placeholder` : string (optional)

**APIs externes** : données constantes `NOSYBE_STRATEGIC_POINTS`, `NOSYBE_LOCATIONS`

**Events** : aucun

**Textes UI** : "Lieu de prise en charge", "Sélectionnez le lieu où vous souhaitez récupérer votre véhicule", "Lieu sélectionné : {location}", "Effacer", "Points stratégiques", "Communes", "Annuler", "Valider"

**Interactions** : sélection radio lieu, effacer sélection, annuler, valider

**Bugs/TODO** : aucun

**Hooks** : `useState`

---

## src/components/ui/mobile-date-picker.tsx

**Fonction** : Dialog de sélection de date avec 3 selects (Jour/Mois/Année) style mobile. Prévisualisation de la date sélectionnée. Range années : currentYear+5 à currentYear-125.

**Props** :
- `value` : Date (optional)
- `onChange` : (date: Date | undefined) => void (required)
- `placeholder` : string (optional, default "Sélectionner une date")
- `disabled` : boolean (optional)
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Sélectionner une date", "Jour", "Mois", "Année", "Date sélectionnée", "Annuler", "Confirmer"

**Interactions** : trigger bouton, sélection jour/mois/année, annuler, confirmer

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/ui/date-range-picker.tsx

**Fonction** : Sélecteur de plage de dates Airbnb-style (2 LazyDatePicker inline). Champs date départ + date retour, avec affichage heure associée. Locale FR fixe.

**Props** :
- `startDate`, `endDate` : Date | null (required)
- `onStartDateChange`, `onEndDateChange` : handlers (required)
- `startTime`, `endTime` : string (optional)
- `onStartTimeChange`, `onEndTimeChange` : handlers (optional)

**APIs externes** : LazyDatePicker

**Events** : aucun

**Textes UI** : "Date de départ", "Date de retour", "mer 1 oct.", "dim 19 oct." (placeholders)

**Interactions** : sélection date départ, sélection date retour

**Bugs/TODO** : locale FR hardcodée (pas i18n)

**Hooks** : `useState`, `forwardRef`

---

## src/components/ui/page-loader.tsx

**Fonction** : Loader plein-écran avec spinner Loader2 et texte "Chargement...". Utilisé comme fallback Suspense des routes lazy.

**Props** : aucune

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Chargement..."

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/social-icons.tsx

**Fonction** : SVG icons sociaux : `GoogleIcon`, `FacebookIcon`, `AppleIcon`. Couleurs hardcodées (Google multicolor, Facebook #1877F2, Apple #000000).

**Props** :
- `className` : string (optional)

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : aucun

**Interactions** : aucune

**Bugs/TODO** : aucun

**Hooks** : aucun

---

## src/components/ui/multi-city-selector.tsx

**Fonction** : Sélecteur de villes multiples (max configurable). Recherche full-text, sélection/désélection individuelle, select-all visible, clear-all, message si limite atteinte. Sections "Points stratégiques" et "Communes" avec option expand.

**Props** :
- `selectedCities` : string[] (required)
- `onChange` : (cities: string[]) => void (required)
- `maxSelections` : number (optional, default 25)
- `className` : string (optional)

**APIs externes** : données constantes `NOSYBE_CITIES`, `NOSYBE_STRATEGIC_POINTS`, `NOSYBE_LOCATIONS`

**Events** : aucun

**Textes UI** : "{n} / {max} villes sélectionnées", "Tout sélectionner", "Tout effacer", "Villes sélectionnées", "Points stratégiques", "Communes", "Voir tout", "Masquer", "Aucune ville trouvée pour '{term}'", "Limite atteinte", "Vous avez sélectionné le maximum de {n} villes"

**Interactions** : recherche texte, sélection/désélection, supprimer badge, sélection masse, expand/collapse communes, clear all

**Bugs/TODO** : aucun

**Hooks** : `useState`, `useEffect`

---

## src/components/ui/carte-grise-mapper.tsx

**Fonction** : Composant informatif mappant les champs véhicule aux champs de la carte grise française (A, B, D.1, D.3, J.1, J.3, P.3, S.1). Affiche badges "Sur carte grise" / "Info supplémentaire" avec tooltips explicatifs.

**Props** :
- `vehicleData` : CarteGriseData (required) — licensePlate, brand, model, color, year, vehicleCategory, mileage, fuel, transmission, seats, doors

**APIs externes** : aucune

**Events** : aucun

**Textes UI** : "Mapping Carte Grise", "{n} champs sur carte grise", "{n} champs supplémentaires", "Sur carte grise", "Info supplémentaire", "Résumé du mapping", noms des champs de carte grise (A, B, D.1, D.3, J.1, J.3, P.3, S.1)

**Interactions** : tooltips hover sur Info icon

**Bugs/TODO** : composant probablement interne/debug (pas d'usage dans un flux utilisateur visible)

**Hooks** : aucun

---

## src/components/ui/index.ts

**Fonction** : Re-exports sélectifs : `LocationDropdown`, `OwnerLocationDropdown`, `MultiCitySelector`, `Button`, `Input`, `Card`, `CardContent`, `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`.

**Props** : N/A

**APIs externes** : N/A

**Events** : N/A

**Textes UI** : N/A

**Interactions** : N/A

**Bugs/TODO** : aucun

**Hooks** : N/A

---

## src/components/ui/ios-picker.tsx (MultiColumnIOSPicker)

→ Documenté avec `IOSPicker` ci-dessus (même fichier, 2 exports).

---

# RÉSUMÉ DES BUGS ET POINTS CRITIQUES

## Bugs critiques

1. **ExteriorInspectionAccordionSimple.tsx** (~ligne 1071) : `useRef` appelé à l'intérieur de `steps.map()` callback → violation des React Rules of Hooks. Provoque des comportements indéterministes.

2. **DriverLicenseForm.tsx** : `handleSubmit` ne fait que `console.log` — aucun appel API. Le permis de conduire saisi n'est jamais enregistré.

## Sécurité

3. **BookingMoreActionsMenu.tsx** : bucket Supabase `checkin-photos` public → les URLs sont accessibles sans authentification. TODO non résolu dans le code.

## Console.log de debug en production

4. **DepositFlowModal.tsx** : `console.log` pour la clé Stripe (niveau module)
5. **WhatsAppFloatingButton.tsx** : logs fbq/gtag dans `onAvatarClick`
6. **WhatsAppHeader.tsx** : logs fbq/gtag dans `handleWhatsAppClick`
7. **RenterBookingCard.tsx** : log complet de l'objet booking avec données sensibles (~ligne 748)
8. **VehicleServiceOptions.tsx** : logs debug extensifs des exclusions d'options
9. **InteractiveCalendar.tsx** : logs debug
10. **MultiVehicleModal.tsx** : logs debug extensifs

## Fichiers vestigiaux

11. **VehicleServiceOptions_new.tsx** : fichier vide (1 ligne)
12. **airport-services-simple.tsx** : stub de test (non utilisé)

## Internationalisation incomplète

13. **RenterBookingCard.tsx** + **OwnerBookingCard.tsx** : textes hardcodés "Départ", "Retour", "Durée :", "TOTAL À PAYER" (TODO(i18n) commentés dans le code)
14. **FilterBar.tsx** : "Filtres:" hardcodé en français
15. **HowItWorksTimeline.tsx** : 100% hardcodé en français

## Logique

16. **SearchBarAirbnb.tsx** : condition `if (openTimeAfterDates || true)` rend le flag `openTimeAfterDates` totalement inutile — la modal d'heure s'ouvre TOUJOURS après validation des dates.

## TODO fonctionnel

17. **RenterBookingCard.tsx** : confirmation de réservation (status 'accepted') → toast "Fonctionnalité à venir" — non implémentée
18. **BookingConfirmationModal.tsx** : subtitle "Rapide" non implémenté (TODO dans le code)

---

# PARTIE D — Features / Modules / App.tsx / main.tsx

# Agent D — Features / Modules / App

---

## src/App.tsx

**Fonction :** Point d'entrée React de l'application SPA. Déclare tous les providers, le routing React Router DOM, et toutes les routes de l'application. Toutes les pages non-Home sont lazy-loaded via `React.lazy()` + `Suspense`. Inclut deux composants utilitaires : `RouteChangeTracker` (envoie GA4 + Meta Pixel PageView à chaque changement de route hors 1re page) et `ScrollToTop` (réinitialise le scroll en haut de page à chaque navigation, sauf si hash présent). Inclut un `ErrorBoundary` global, un `ClientProfileCompletionGuard`, et un `LanguageSwitcher` flottant.

**APIs externes :**
- GA4 : `trackPageViewEvent()` à chaque changement de route
- Meta Pixel : `trackMetaPageView()` à chaque changement de route

**Events :**
- `page_view` GA4 envoyé à chaque navigation SPA (hors première page)
- `fbq PageView` Meta Pixel à chaque navigation SPA (hors première page)

**Providers wrapés (du plus externe au plus interne) :**
1. `ErrorBoundary` (global)
2. `QueryClientProvider` (React Query — client unique instancié à l'extérieur du composant)
3. `AuthProvider` (AuthContext)
4. `ExchangeRateProvider` (ExchangeRateContext)
5. `WhatsAppContactProvider` (WhatsAppContactContext)
6. `CartProvider` (CartContext)
7. `TooltipProvider` (Radix)
8. `BrowserRouter` (React Router)
9. `CategoryShowcaseProvider` (useCategoryShowcase)

**Composants globaux montés hors routes :**
- `Toaster` (shadcn/ui)
- `Sonner` (notifications sonner)
- `CartDrawer` (panier latéral)
- `CategorySuggestionModal`
- `AddedToCartModal`
- `RouteChangeTracker`
- `ScrollToTop`
- `ClientProfileCompletionGuard`
- `LanguageSwitcher` (fixe, bottom-4 left-4 md:right-4, z-50)
- `WhatsAppFloatingButton`
- `CategoryShowcaseModal`
- `Navbar`

**Routes définies :**

| Chemin | Composant | Notes |
|--------|-----------|-------|
| `/` | `Index` | Import direct (non lazy) |
| `/auth/login` | `Login` | lazy |
| `/auth/register` | `Register` | lazy |
| `/auth/callback` | `Callback` | lazy |
| `/onboarding/client` | `ClientOnboarding` | lazy |
| `/profile` | `Profile` | lazy + ErrorBoundary |
| `/profile-test` | `ProfileTest` | lazy |
| `/vehicle/:license/booking/discussion` | `BookingDiscussion` | lazy |
| `/moto/:license/booking/discussion` | `BookingDiscussion` | lazy |
| `/hebergement/:license/booking/discussion` | `BookingDiscussion` | lazy |
| `/booking/message` | `MessageToOwners` | lazy |
| `/panier/soumettre` | `CartSubmit` | lazy |
| `/panier/confirmation` | `CartConfirmation` | lazy |
| `/legal` | `Legal` | lazy |
| `/politique-annulation` | `PolitiqueAnnulation` | lazy |
| `/sinistre-caution` | `SinistreCaution` | lazy |
| `/meteo-nosy-be` | `MeteoNosyBePage` | lazy |
| `/taux-change-euro-ariary-madagascar` | `TauxChangeMadagascarPage` | lazy |
| `/vols-aeroport-nosy-be` | `VolsNosyBePage` | lazy |
| `/location-scooter-nosy-be` | `LocationScooterNosyBePage` | lazy |
| `/location-moto-nosy-be` | `LocationMotoNosyBePage` | lazy |
| `/location-quad-nosy-be` | `LocationQuadNosyBePage` | lazy |
| `/location-voiture-nosy-be` | `LocationVoitureNosyBePage` | lazy |
| `/location-hebergement-nosy-be` | `LocationHebergementNosyBePage` | lazy |
| `/location-vacances-nosy-be` | `LocationVacancesNosyBePage` | lazy |
| `/location-appartement-nosy-be` | `LocationAppartementNosyBePage` | lazy |
| `/location-villa-nosy-be` | `LocationVillaNosyBePage` | lazy |
| `/location-villa-bord-de-mer-nosy-be` | `LocationVillaBordDeMerNosyBePage` | lazy |
| `/location-villa-piscine-nosy-be` | `LocationVillaPiscineNosyBePage` | lazy |
| `/location-bungalow-nosy-be` | `LocationBungalowNosyBePage` | lazy |
| `/location-4x4-nosy-be` | `Location4x4NosyBePage` | lazy |
| `/location-minibus-nosy-be` | `LocationMinibusNosyBePage` | lazy |
| `/blog` | `BlogIndex` | lazy |
| `/blog/:slug` | `BlogPost` | lazy |
| `/contact` | `Contact` | lazy |
| `/vehicle/:license` | `VehicleDetails` | lazy |
| `/moto/:license` | `MotoVehicleDetails` | lazy |
| `/hebergement/:license` | `AccommodationDetails` | lazy |
| `/me/dashboard` | `Dashboard` | lazy |
| `/me/renter/bookings` | `RenterBookings` | lazy |
| `/success` | `PaymentSuccess` | lazy |
| `/cancel` | `PaymentCancel` | lazy |
| `/me/owner/vehicles` | `OwnerVehicles` | lazy |
| `/me/owner/bookings` | `OwnerBookings` | lazy |
| `/me/owner/requests` | `OwnerBookingRequests` | lazy |
| `/me/owner/requests/:conversationId/discussion` | `OwnerBookingDiscussion` | lazy |
| `/me/owner/vehicles/add` | `AddVehicle` | lazy |
| `/me/owner/vehicles/add-moto` | `AddMotoPlaceholder` | lazy |
| `/me/owner/vehicles/:vehicleId/manage` | `ManageVehicle` | lazy |
| `/rent-my-car` | `RentMyCarLanding` | lazy |
| `/rent-my-car/register` | `RentMyCarRegister` | lazy |
| `/admin` (layout) | `AdminLayout` | lazy, imbriqué |
| `/admin` (index) | `AdminDashboard` | lazy |
| `/admin/users` | `AdminPlaceholderUsers` | lazy |
| `/admin/vehicles` | `AdminPlaceholderVehicles` | lazy |
| `/admin/bookings` | `AdminBookingsList` | lazy |
| `/admin/bookings/new` | `AdminBookingNew` | lazy |
| `/admin/bookings/:bookingId` | `AdminBookingDetail` | lazy |
| `/admin/drafts` | `AdminDrafts` | lazy |
| `/admin/planning` | `AdminPlanning` | lazy |
| `/admin/payments` | `AdminPlaceholderPayments` | lazy |
| `/admin/revenue` | `AdminRevenue` | lazy |
| `/admin/settings/exchange` | `AdminExchangeSettings` | lazy |
| `/admin/settings/whatsapp` | `AdminWhatsAppSettings` | lazy |
| `/admin/settings/pricing` | `AdminPricingSettings` | lazy |
| `/admin/fleet` | `FleetList` | lazy |
| `/admin/fleet/new` | `FleetForm` | lazy |
| `/admin/fleet/:id` | `FleetDetail` | lazy |
| `/admin/fleet/:id/edit` | `FleetForm` | lazy |
| `/admin/fleet/:id/state/new` | `VehicleStateForm` | lazy |
| `/admin/parts` | `PartsList` | lazy |
| `/admin/parts/new` | `PartForm` | lazy |
| `/admin/parts/movements` | `StockMovementsList` | lazy |
| `/admin/parts/:id` | `PartDetail` | lazy |
| `/admin/parts/:id/edit` | `PartForm` | lazy |
| `/admin/workshop` | `WorkshopList` | lazy |
| `/admin/workshop/new` | `RepairForm` | lazy |
| `/admin/workshop/:id` | `RepairDetail` | lazy |
| `/admin/reports` | `ReportsDashboard` | lazy |
| `/admin/analytics/site` | `AdminSiteAnalytics` | lazy |
| `/admin/sales` | `SalesList` | lazy |
| `/admin/sales/new` | `SaleForm` | lazy |
| `/admin/sales/:id` | `SaleDetail` | lazy |
| `/admin/suppliers` | `SuppliersList` | lazy |
| `/admin/suppliers/new` | `SupplierForm` | lazy |
| `/admin/suppliers/:id` | `SupplierForm` | lazy |
| `/admin/maintenance` | `MaintenancePage` | lazy |
| `/checking/:bookingId` | `Checking` | lazy (état des lieux départ) |
| `/checkin-return/:bookingId` | `CheckinReturnPage` | lazy (état des lieux retour) |
| `/dictionary` | `DictionaryIndex` | lazy |
| `/dictionary/:id` | `DictionaryEntryPage` | lazy |
| `/picker-demo` | `PickerDemo` | lazy |
| `/airport-services-demo` | `AirportServicesDemo` | lazy |
| `/simple-test` | `SimpleTest` | lazy |
| `/__i18n_debug` | `I18nDebug` | lazy, DEV uniquement |
| `*` | `NotFound` | catch-all |

**Bugs/TODO :**
- `ChunkLoadError` géré via `sessionStorage` (`rentanoo:chunk-reload-attempt`) avec auto-reload unique — si Safari privé, sessionStorage indisponible et un reload peut boucler.
- Le commentaire indique que `hydrateRoot` a été abandonné au profit de `createRoot` à cause d'un mismatch avec du HTML pré-rendu SEO statique : ce contenu statique est remplacé au montage JS (pas de vrai SSR).
- `LanguageSwitcher` est qualifié de "Dev-only floating language switcher" dans les commentaires mais est monté en production.

---

## src/main.tsx

**Fonction :** Point d'entrée React. Monte l'application avec `createRoot()` dans `#root`. Initialise `HelmetProvider`, `i18n`, le logger LCP, et un diagnostic `removeChild` (DEV). Gère les `ChunkLoadError` (reload unique via sessionStorage).

**APIs externes :** Aucune directe.

**Events :** Aucun analytics direct.

**Bugs/TODO :**
- Le TODO `setupRemoveChildDiagnostic` existe encore en DEV — indique un problème de démontage DOM non résolu.
- Commentaire : "Le HTML pré-rendu par generate-static-pages.js n'injecte qu'un bloc SEO caché" — confirme approche pseudo-SSR uniquement pour crawlers.

---

## src/App.css

**Fonction :** CSS hérité du template Vite (non utilisé significativement dans le projet). Contient styles `#root`, `.logo`, `@keyframes logo-spin`, `.card`, `.read-the-docs`.

**Note :** Vestige du boilerplate Vite — ne devrait pas impacter l'UI Rentanoo.

---

## src/index.css

**Fonction :** Fichier CSS global principal. Importe Tailwind (`@tailwind base/components/utilities`). Définit le design system "Rentanoo Lagoon" en variables CSS HSL. Contient toutes les animations CSS personnalisées de l'application.

**Design system :**
- Thème primaire : `--primary: 185 84% 25%` (bleu-teal lagon)
- Secondaire : `--secondary: 35 25% 92%` (beige sableux)
- Accent : `--accent: 15 75% 85%` (corail)
- Success : `--success: 165 85% 35%` (vert tropical)
- Warning : `--warning: 25 95% 55%` (orange coucher de soleil)
- Gradients nommés : `--gradient-lagoon`, `--gradient-sunset`, `--gradient-soft`
- Shadows nommées : `--shadow-lagoon`, `--shadow-soft`, `--shadow-card`
- Dark mode : Variables `.dark { ... }` pour toutes les couleurs

**Animations CSS définies :**
- `dropdownSlideIn` / `dropdownSlideOut` — Dropdown ville (0.3s / 0.2s cubic-bezier)
- `listItemSlideIn` — Éléments de liste (0.4s)
- `mapPinPulse` — Icône MapPin (2s infinite)
- `shimmer` — Effet brillance hover (2s infinite)
- `buttonBounce` — Bouton hover (0.6s)
- `glow` — Éléments actifs (2s infinite, vert)
- `premium-float` — Flottement lent (8s infinite)
- `premium-shimmer-slide` — Bandeau premium
- `whatsapp-float` (3.5s infinite), `whatsapp-halo` (2.2s infinite), `whatsapp-bubble-enter/exit`
- `cart-badge-pulse` (500ms), `cart-glow-pulse` (2s)
- `modal-shake` (500ms)

**Classes utilitaires CSS :**
- `.dropdown-enter`, `.dropdown-exit`
- `.list-item-enter`
- `.map-pin-pulse`
- `.shimmer-effect`
- `.button-bounce:hover`
- `.glow-effect`
- `.premium-mesh`, `.premium-glass-dark`, `.premium-glass-light`, `.premium-card-shine`, `.premium-accent-top`, `.premium-section-title`, `.premium-cta-panel`, `.premium-float-slow`
- `.whatsapp-fab-float`, `.whatsapp-fab-halo`, `.whatsapp-bubble-enter`, `.whatsapp-bubble-exit`
- `.animate-cart-badge-pulse`, `.animate-cart-glow`, `.animate-modal-shake`

**Fix CSS notable :**
```css
[data-dialog-overlay="true"][data-state="closed"],
[data-alert-dialog-overlay="true"][data-state="closed"] {
  pointer-events: none !important;
  opacity: 0 !important;
  display: none !important;
}
```
Correction d'un bug Radix Dialog où l'overlay reste interactif après fermeture (prod — modale détails locataire).

**`prefers-reduced-motion` :** Appliqué sur whatsapp-fab, modal-shake, cart-badge-pulse, cart-glow.

---

## src/features/admin-bookings/components/BookingActionsBar.tsx

**Fonction :** Barre d'actions admin pour une réservation. Affiche les actions de paiement (espèces ou CB/Stripe), de caution, d'opérations (prolonger, état des lieux départ/retour) et d'annulation. Gère également le flux de paiement de supplément pour les prolongations en attente.

**APIs externes :** Stripe (via callbacks `onPayCard`, `onPayExtensionStripe` — la barre délègue les appels)

**Textes UI exacts :**
- "Supplément prolongation"
- "à encaisser"
- "Ouverture Stripe…" (état chargement)
- "Payer le supplément par CB"
- "Encaissement…" (état chargement)
- "Encaisser le supplément en espèces"
- "Actions" (titre card)
- "Paiement" (section)
- "Comment le client règle ?"
- "Encaisser en espèces"
- "Payer par CB"
- "Encaisse le montant et confirme la réservation automatiquement."
- "Ouvre la page Stripe pour le paiement en ligne."
- "Paiement en ligne via Stripe."
- "Aucune action de paiement disponible pour ce statut."
- "Caution" (section)
- "Prendre la caution"
- "Opérations" (section)
- "Prolonger"
- "État des lieux départ" (lien vers `/checking/:bookingId`)
- "État des lieux retour" (lien vers `/checkin-return/:bookingId`)
- "Annuler la réservation"
- "Annulation…" (état chargement)
- "Espèces" (radio)
- "Carte bancaire" (radio)
- Textes conditionnels sur la caution : "Enregistrez d'abord une carte (flux caution).", "Pas de caution sur cette réservation.", "Plafond entièrement utilisé."

**Interactions utilisateur :**
- Radio "Espèces" / "Carte bancaire" pour choisir la méthode de paiement
- Bouton "Encaisser en espèces" → `onCollectCash()`
- Bouton "Payer par CB" → `onPayCard()`
- Bouton "Prendre la caution" → `onTakeDeposit()`
- Bouton "Prolonger" → `onExtend()`
- Lien "État des lieux départ" → `/checking/:bookingId`
- Lien "État des lieux retour" → `/checkin-return/:bookingId`
- Bouton "Annuler la réservation" → `onCancel()`
- Bouton "Encaisser le supplément en espèces" → `onCollectExtensionCash()`
- Bouton "Payer le supplément par CB" → `onPayExtensionStripe()`

---

## src/features/admin-bookings/components/BookingClientVehicleCards.tsx

**Fonction :** Affiche deux cartes côte à côte : informations locataire (nom/prénom, email, téléphone) et informations véhicule (marque, modèle, prix/jour, badge "Créée par l'admin"). Optionnellement une troisième carte "Remarque admin" pleine largeur.

**APIs externes :** Aucune (composant purement d'affichage).

**Textes UI exacts :**
- "Locataire" (titre carte)
- "Locataire non renseigné"
- "Véhicule" (titre carte)
- "€ / jour" (suffixe prix)
- "Créée par l'admin" (badge amber)
- "Véhicule non renseigné"
- "Remarque admin" (titre carte)

---

## src/features/admin-bookings/components/BookingCollectCashDialog.tsx

**Fonction :** Dialog pour encaisser un paiement en espèces. Présente deux boutons : encaisser en euros (avec équivalent ariary) ou en ariary (valeur arrondie). Utilise le taux de change du contexte `ExchangeRateContext`.

**APIs externes :** Aucune directe. Utilise `ExchangeRateContext` pour le taux EUR/MGA.

**Textes UI exacts :**
- "Encaisser en espèces" (titre par défaut, prop `title`)
- "Choisissez la devise encaissée à l'agence."
- "Encaissement en euros (≈ {formatAriary(mgaRounded)})" (sous-label bouton EUR)
- "Encaissement en ariary (référence)" (sous-label bouton MGA)
- "Annuler"
- `{footnote}` — texte taux de change dynamique depuis le contexte

**Interactions :**
- Bouton EUR → `onConfirmEur()`
- Bouton MGA → `onConfirmAriary(mgaRounded)`
- Bouton "Annuler" → ferme le dialog

---

## src/features/admin-bookings/components/BookingDepositCard.tsx

**Fonction :** Carte admin affichant les informations de caution/prélèvement Stripe : montant max, carte enregistrée, montant déjà prélevé, reste disponible, et historique des prélèvements sous forme de tableau.

**APIs externes :** Stripe (affichage des `stripe_payment_intent_id` et liens `receipt_url` vers Stripe)

**Textes UI exacts :**
- "Prélèvements / caution" (titre)
- "Prélèvements sur la carte enregistrée, plafonnés par la caution contractuelle."
- "Caution max"
- "Carte enregistrée"
- "Oui" / "Non" / "Non (incohérent)"
- "Déjà prélevé"
- "Reste disponible"
- "Carte marquée enregistrée sans identifiant Stripe — enregistrez une carte via le flux caution."
- "Prélever sur la caution"
- "Enregistrez d'abord une carte (flux caution)."
- "Pas de caution sur cette réservation."
- "Plafond entièrement utilisé."
- "Historique" (sous-section)
- Headers tableau : "Date", "Montant", "Statut", "Motif", "Stripe"
- Statuts : "Réussi", "En cours", "Échoué", "Annulé"
- "Reçu" (lien externe)
- "Aucun prélèvement enregistré."

---

## src/features/admin-bookings/components/BookingDetailHeader.tsx

**Fonction :** En-tête d'une page de détail de réservation admin. Affiche le numéro de référence (format "AG #N"), le statut, les dates de début/fin avec heures, le total locataire en dual price (EUR + MGA), et les lieux de prise/retour. Navigation en fil d'Ariane vers Planning, toutes les réservations, et nouvelle réservation.

**APIs externes :** Aucune directe. Utilise `ExchangeRateContext` pour le footnote taux.

**Textes UI exacts :**
- "Planning" (lien retour vers `/admin/planning`)
- "Toutes les réservations" (lien `/admin/bookings`)
- "Nouvelle réservation" (lien `/admin/bookings/new`)
- "Total locataire" (label montant)
- "Prise : {pickupLocation}" (lieu de prise)
- "Retour : {returnLocation}" (lieu de retour)
- Flèche `→` entre les dates

---

## src/features/admin-bookings/components/BookingExtendModal.tsx

**Fonction :** Modal pour prolonger une réservation. Permet de choisir une nouvelle date et heure de retour (minimum J+1 de la date actuelle). Appelle `adminPreviewExtendBooking` (API Supabase/Edge function) avec debounce 400ms pour calculer le supplément en temps réel. Affiche : jours ajoutés, supplément TTC, nouveau total TTC.

**APIs externes :** `adminPreviewExtendBooking` (adminApi) — Edge Function Supabase/backend.

**Textes UI exacts :**
- "Prolonger la location" (titre)
- "Fin actuelle : {date} à {heure}. Choisissez une nouvelle date de retour."
- "Nouvelle date de fin" (label)
- "Heure de retour" (label)
- "Calcul en cours…" (état preview chargement)
- "Jours ajoutés"
- "Supplément"
- "Nouveau total TTC"
- "Sélectionnez une date postérieure à la fin actuelle."
- "Annuler"
- "Prolongation…" (état chargement)
- "Confirmer la prolongation"
- "+1 jour" / "+N j" (label durée)
- `{previewError}` (message d'erreur dynamique)

---

## src/features/admin-bookings/components/BookingFinancialCard.tsx

**Fonction :** Carte de détail financier d'une réservation admin. Affiche : prix de location, liste des options avec prix unitaire, total options, sous-total, frais de service (0 si tarif admin, 15% si web), total TTC locataire. Tous les montants en dual price EUR+MGA.

**APIs externes :** Aucune directe. Utilise `ExchangeRateContext`.

**Textes UI exacts :**
- "Détail financier" (titre)
- "Prix de location"
- "Options"
- "Aucune" (si pas d'options)
- "Total options"
- "Sous-total"
- "Frais de service plateforme" (si tarif admin)
- "Frais de service (15 %)" (si tarif web)
- "—" (si pas de frais admin)
- "Total TTC locataire" (gras)

---

## src/features/admin-bookings/components/BookingStatusBadge.tsx

**Fonction :** Badge de statut de réservation avec couleurs codées. Mapping statuts → labels + couleurs.

**Statuts/Labels/Couleurs :**
- `pending` → "En attente" (amber)
- `pending_payment` → "En attente de paiement" (violet)
- `confirmed` → "Confirmée" (emerald)
- `active` → "En cours" (sky)
- `accepted` → "Acceptée" (teal)
- `completed` → "Terminée" (muted)
- `cancelled` → "Annulée" (red)
- `terminated` → "Résiliée" (orange)
- Fallback : affiche la valeur brute du statut (muted)

---

## src/features/admin-bookings/components/PlanningBookingSheet.tsx

**Fonction :** Sheet (panneau latéral) d'aperçu rapide d'une réservation depuis le planning. Affiche : dates + lieu prise, total locataire en dual price, nom/email locataire, marque/modèle véhicule. Lien vers la fiche complète.

**APIs externes :** Aucune directe.

**Textes UI exacts :**
- "Aperçu rapide — actions complètes sur la fiche réservation."
- "Total locataire"
- "Locataire"
- "Véhicule"
- "Prise : {pickup_location}"
- "Voir la fiche complète"
- "Fermer"

---

## src/features/admin-bookings/utils/bookingDisplay.ts

**Fonction :** Utilitaires de formatage pour l'affichage des réservations admin.
- `formatBookingRef(referenceNumber)` → `"AG #N"` ou `"Réservation"`
- `formatDateFr(ymd, time)` → date française "J MMM AAAA · HH:MM"
- `formatRentalDuration(startDate, endDate, startTime, endTime)` → "1 jour" / "N jours" / "N,n j"

---

## src/features/admin-bookings/utils/bookingFinancials.ts

**Fonction :** Calcul des financières d'une réservation admin à partir des données brutes Supabase. Extrait les options, calcule sous-total, frais de service (0 si admin, 15% si web via `calcServiceFeeRenter`), et total TTC. Gère la rétrocompatibilité avec les anciens formats d'options JSON.

**Types exportés :** `BookingFinancials`

---

## src/features/admin-bookings/utils/extensionMeta.ts

**Fonction :** Utilitaires pour gérer les métadonnées de prolongation. Type `ExtensionPending` (delta financiers, anciennes dates, stripePaymentIntentId). Fonctions : `getOptionsItems`, `getExtensionPending`, `wrapSelectedOptionsWithExtension`, `clearExtensionPending`.

---

## src/features/admin-bookings/utils/paymentFlow.ts

**Fonction :** Utilitaires pour l'affichage du flux de paiement.
- `todayCollectIso()` → date ISO actuelle à midi UTC
- `formatPaymentSummary(booking, status)` → chaîne lisible : "Payé par CB (Stripe) le JJ/MM/AAAA", "Payé en espèces le JJ/MM/AAAA", "Payé par CB terminal le JJ/MM/AAAA", "Encaissé le JJ/MM/AAAA", "Réservation confirmée"

---

## src/features/back-office/components/BackOfficeSidebar.tsx

**Fonction :** Sidebar de navigation du back-office admin. Version desktop (aside fixe, 56px) + version mobile (Sheet drawer). Liens actifs détectés via `useLocation()`.

**Structure de navigation (groupes/items) :**

Groupe "Général" :
- "Tableau de bord" → `/admin`
- "Nouvelle réservation" → `/admin/bookings/new`
- "Réservations" → `/admin/bookings`
- "Planning" → `/admin/planning`
- "Encaissements" → `/admin/revenue`

Groupe "Flotte" :
- "Scooters" → `/admin/fleet`

Groupe "Atelier" :
- "Réparations" → `/admin/workshop`
- "Maintenance prév." → `/admin/maintenance`

Groupe "Stock" :
- "Pièces" → `/admin/parts`
- "Mouvements" → `/admin/parts/movements`
- "Fournisseurs" → `/admin/suppliers`
- "Ventes comptoir" → `/admin/sales`

Groupe "Paramètres" :
- "Taux EUR / Ar" → `/admin/settings/exchange`
- "Contact WhatsApp" → `/admin/settings/whatsapp`
- "Tarification & options" → `/admin/settings/pricing`

Groupe "Rapports" :
- "Indicateurs atelier" → `/admin/reports`
- "Statistiques site" → `/admin/analytics/site`

**Textes UI exacts :**
- "Menu back-office" (bouton mobile)
- "Général", "Flotte", "Atelier", "Stock", "Paramètres", "Rapports" (labels groupes)

---

## src/features/back-office/components/LowStockBadge.tsx

**Fonction :** Badge destructif affiché si `part.quantity_on_hand <= part.quantity_min`.

**Texte UI exact :** "Stock bas ({quantity_on_hand}/{quantity_min})"

---

## src/features/back-office/components/MoneyInput.tsx

**Fonction :** Input numérique avec suffixe "€". Formatter `formatMoney` exporte le formatage euro fr-FR.

---

## src/features/back-office/components/PhotoUploader.tsx

**Fonction :** Bouton d'upload de fichier (input file caché). Accepte `image/*` par défaut. Appelle `onUpload(file)` async au changement. Reset l'input après upload.

**Texte UI exact (défaut) :** "Ajouter une photo"

---

## src/features/back-office/components/RepairPartsLineEditor.tsx

**Fonction :** Éditeur de lignes de pièces pour une réparation. Recherche de pièces par SKU/nom via `searchParts` (Supabase) avec seuil 2 caractères. Ajout/suppression/modification quantité.

**APIs externes :** Supabase (table `parts`, via `searchParts`)

**Textes UI exacts :**
- "Rechercher une pièce" (label)
- "SKU ou nom..." (placeholder)
- "{p.sku} — {p.name} ({p.quantity_on_hand} en stock)" (item liste résultats)
- "Ajoutez des pièces via la recherche" (état vide)
- `{p.sku} — {p.name} (stock: {p.quantity_on_hand})` (label ligne ajoutée)

---

## src/features/back-office/components/StaffRoleGate.tsx

**Fonction :** Guard de rôle basé sur `profiles.staff_role`. Les admins (`is_admin = true`) passent toujours. Les autres sont filtrés par `allowedRoles`. Pendant le chargement, rend `null`.

**APIs externes :** Supabase (`supabase.auth.getUser()`, `supabase.from("profiles").select("is_admin, staff_role")`)

---

## src/features/back-office/components/StatusBadge.tsx

**Fonction :** Badge de statut opérationnel d'un véhicule.

**Statuts/Labels/Couleurs :**
- `available` → "Disponible" (vert)
- `rented` → "En location" (bleu)
- `reserved` → "Réservé" (violet)
- `maintenance` → "En entretien" (amber)
- `broken` → "En panne" (rouge)
- `accident` → "Accidenté" (orange)
- `retired` → "Retiré" (gris)

---

## src/features/back-office/constants.ts

**Fonction :** Constantes du back-office.
- `BACK_OFFICE_QUERY_KEYS` — clés React Query pour : scooters, parts, repairs, stockMovements, vehicleStates, suppliers, sales, maintenanceRules, reports.
- `PART_CATEGORIES` — ["pneu", "batterie", "freins", "huile", "filtre", "courroie", "carrosserie", "éclairage", "autre"]

---

## src/features/back-office/types.ts

**Fonction :** Types TypeScript du back-office mappés depuis Supabase. Définit : `Scooter`, `Part`, `StockMovement`, `Repair`, `RepairPart`, `VehicleState`, `Supplier`, `Sale`, `SaleLine`, `MaintenanceRule`, `MaintenanceAlert`, `ReportsSummary`, etc.

**Labels exportés (constantes d'affichage) :**
- `OPERATIONAL_STATUS_LABELS` : available→"Disponible", rented→"En location", reserved→"Réservé", maintenance→"En entretien", broken→"En panne", accident→"Accidenté", retired→"Retiré"
- `INTERVENTION_TYPE_LABELS` : vidange→"Vidange", pneus→"Pneus", freins→"Freins", batterie→"Batterie", moteur→"Moteur", courroie→"Courroie", carrosserie→"Carrosserie", accident→"Accident", diagnostic→"Diagnostic", autre→"Autre"
- `REPAIR_STATUS_LABELS` : open→"Ouverte", in_progress→"En cours", done→"Terminée", cancelled→"Annulée"
- `STOCK_MOVEMENT_LABELS` : stock_in→"Entrée", internal_use→"Usage interne", customer_sale→"Vente client", adjustment→"Ajustement", return→"Retour"
- `VEHICLE_STATE_LABELS` : checkin→"Avant location", checkout→"Après retour", inspection→"Inspection", accident→"Accident", repair_before→"Avant réparation", repair_after→"Après réparation"

---

## src/features/back-office/hooks/useMaintenance.ts

**Fonction :** Hooks React Query pour les règles de maintenance.
- `useMaintenanceRules()` — liste les règles actives
- `useMaintenanceAlerts()` — calcule les alertes
- `useCreateMaintenanceRule()` — mutation création

---

## src/features/back-office/hooks/useParts.ts

**Fonction :** Hooks React Query pour les pièces.
- `useParts(options?)` — liste (activeOnly, lowStockOnly)
- `usePart(id)` — détail
- `useCreatePart()` — mutation création
- `useUpdatePart()` — mutation mise à jour

---

## src/features/back-office/hooks/useRepairs.ts

**Fonction :** Hooks React Query pour les réparations.
- `useRepairs(filters)` — liste avec vehicle
- `useRepair(id)` — détail avec pièces
- `useCreateRepair()` — mutation
- `useUpdateRepair()` — mutation
- `useCloseRepair()` — mutation (status → "done")
- `useCancelRepair()` — mutation (via RPC Supabase `rpc_cancel_repair`)
- `useConsumePartsForRepair()` — mutation (via RPC `rpc_consume_parts_for_repair`)

---

## src/features/back-office/hooks/useReports.ts

**Fonction :** Hook React Query pour le résumé des rapports.
- `useReportsSummary()` — agrège toutes les métriques workshop

---

## src/features/back-office/hooks/useSales.ts

**Fonction :** Hooks React Query pour les ventes comptoir.
- `useSales()`, `useSale(id)`, `useCreateSale()`, `useCancelSale()`

---

## src/features/back-office/hooks/useScooters.ts

**Fonction :** Hooks React Query pour les scooters de la flotte.
- `useScooters(filters)`, `useScooter(id)`, `useScooterStats(id)`, `useCreateScooter()`, `useUpdateScooter()`, `useUpdateScooterStatus()`

---

## src/features/back-office/hooks/useStock.ts

**Fonction :** Hooks React Query pour les mouvements de stock.
- `useStockMovements(filters)`, `useStockIn()`, `useStockAdjustment()`

---

## src/features/back-office/hooks/useSuppliers.ts

**Fonction :** Hooks React Query pour les fournisseurs.
- `useSuppliers()`, `useSupplier(id)`, `useCreateSupplier()`, `useUpdateSupplier()`

---

## src/features/back-office/hooks/useVehicleStates.ts

**Fonction :** Hooks React Query pour les états véhicule.
- `useVehicleStates(vehicleId)`, `useCreateVehicleState()` (met aussi à jour `vehicles.mileage` après création)

---

## src/features/back-office/services/maintenanceService.ts

**Fonction :** Service Supabase pour les règles de maintenance préventive. `getMaintenanceAlerts()` calcule les alertes en croisant règles, véhicules, et réparations terminées. Détermine statut : "ok", "soon" (< 10% du seuil restant), "overdue" (dépassé). Supporte intervals km et jours.

**APIs externes :** Supabase (tables : `maintenance_rules`, `vehicles`, `repairs`)

---

## src/features/back-office/services/partsService.ts

**Fonction :** CRUD Supabase pour la table `parts`. Inclut `searchParts(query)` (ilike sur sku et name) et `isLowStock(part)` (quantity_on_hand <= quantity_min).

**APIs externes :** Supabase (table `parts`)

---

## src/features/back-office/services/photosService.ts

**Fonction :** Upload de fichiers vers Supabase Storage. Trois fonctions :
- `uploadScooterDoc(vehicleId, docType, file)` → bucket `scooter-docs`
- `uploadRepairPhoto(repairId, file)` → bucket `repair-photos`
- `uploadVehiclePhoto(vehicleId, file)` → bucket `vehicle-photos` + insertion dans `vehicle_photos`

**APIs externes :** Supabase Storage (3 buckets : `scooter-docs`, `repair-photos`, `vehicle-photos`)

---

## src/features/back-office/services/repairsService.ts

**Fonction :** CRUD Supabase pour les réparations.
- `listRepairsWithVehicle()` — jointure avec `vehicles`
- `getRepairWithParts()` — jointure avec `repair_parts + parts + vehicles`
- `cancelRepair()` — RPC `rpc_cancel_repair`
- `consumePartsForRepair()` — RPC `rpc_consume_parts_for_repair` (décrémente le stock)

**APIs externes :** Supabase (tables `repairs`, `repair_parts`, RPC `rpc_cancel_repair`, `rpc_consume_parts_for_repair`)

---

## src/features/back-office/services/reportsService.ts

**Fonction :** Agrégation de métriques workshop. `getReportsSummary()` exécute 6 requêtes Supabase en parallèle et calcule : véhicules disponibles/total/en maintenance, stock bas, coût réparations 30j, date dernière maintenance, valeur stock, ventes/marge du mois, top 10 véhicules coûteux, top 10 pièces utilisées, top 10 pièces vendues.

**APIs externes :** Supabase (tables : `vehicles`, `parts`, `repairs`, `sales`, `repair_parts`, `sale_lines`)

---

## src/features/back-office/services/salesService.ts

**Fonction :** CRUD Supabase pour les ventes comptoir.
- `createSale()` — via RPC `rpc_create_part_sale`
- `cancelSale()` — via RPC `rpc_cancel_part_sale`
- `getSale()` — jointure `sale_lines + parts`

**APIs externes :** Supabase (tables `sales`, `sale_lines`, RPC `rpc_create_part_sale`, `rpc_cancel_part_sale`)

---

## src/features/back-office/services/scootersService.ts

**Fonction :** CRUD Supabase pour les scooters (`vehicle_type = "scooter"`). Inclut `getScooterStats()` (coût total réparations, nb réparations, dernière maintenance, dernier état). `listScooters()` inclut les photos et sélectionne l'URL primaire (hors HEIC).

**APIs externes :** Supabase (tables `vehicles`, `vehicle_photos`, `repairs`, `vehicle_states`)

---

## src/features/back-office/services/stockService.ts

**Fonction :** Mouvements de stock via RPCs Supabase.
- `stockIn()` → RPC `rpc_stock_in`
- `adjustStock()` → RPC `rpc_stock_adjustment`
- `listMovementsWithParts()` — jointure `stock_movements + parts`

**APIs externes :** Supabase (table `stock_movements`, RPC `rpc_stock_in`, `rpc_stock_adjustment`)

---

## src/features/back-office/services/suppliersService.ts

**Fonction :** CRUD Supabase pour les fournisseurs. `getSupplierStockHistory()` — historique des entrées stock liées au fournisseur. `getSupplierParts()` — pièces associées.

**APIs externes :** Supabase (tables `suppliers`, `parts`, `stock_movements`)

---

## src/features/back-office/services/vehicleStatesService.ts

**Fonction :** CRUD Supabase pour les états de véhicules. `createVehicleState()` met automatiquement à jour `vehicles.mileage` si un kilométrage est fourni.

**APIs externes :** Supabase (tables `vehicle_states`, `vehicles`)

---

## src/features/owner-portal/components/OwnerSidebar.tsx

**Fonction :** Sidebar de navigation pour le portail propriétaire. Version desktop (aside 56px) + mobile (Sheet drawer).

**Structure de navigation :**

Groupe "Général" :
- "Tableau de bord" → `/me/dashboard`

Groupe "Mes locations" :
- "Mes véhicules" → `/me/owner/vehicles`
- "Mes réservations" → `/me/owner/bookings`
- "Demandes" → `/me/owner/requests`

Groupe "En tant que locataire" :
- "Mes réservations" → `/me/renter/bookings`

**Texte UI exact :** "Mon espace" (bouton mobile)

---

## src/features/vehicle-management/components/tabs/VehicleBasicInfoTab.tsx

**Fonction :** Onglet d'informations de base d'un véhicule (lecture seule, pas d'édition). Affiche : marque, modèle, année, couleur, kilométrage, carburant, transmission, places, portes. Puis section équipements avec badges colorés pour chaque équipement activé.

**Textes UI exacts :**
- "Informations véhicule" (titre)
- "Ces informations sont liées à votre véhicule et ne peuvent pas être modifiées."
- "Informations générales"
- "Marque", "Modèle", "Année", "Couleur"
- "Caractéristiques techniques"
- "Kilométrage" (format "{N} km")
- "Carburant" : "Essence" / "Diesel" / "Électrique" / "Hybride" / "Non spécifié"
- "Transmission" : "Manuelle" / "Automatique" / "Non spécifiée"
- "Nombre de places", "Nombre de portes"
- "Équipements & Options"
- Badges équipements : "Climatisation", "GPS", "Régulateur", "Bluetooth", "CarPlay", "Android Auto", "Entrée audio", "Caméra de recul", "Port USB", "Sièges cuir", "Toit ouvrant", "Audio premium", "Chargeur sans fil", "Capteurs parking", "ABS"

---

## src/features/vehicle-management/hooks/useManageVehicle.ts

**Fonction :** Hook pour charger et gérer le formulaire de gestion d'un véhicule propriétaire. `loadVehicle()` charge le véhicule depuis Supabase (via `SupabaseVehiclesService.getVehicleById` et `ListingOwnersService.getById`), mappe toutes les propriétés vers `VehicleFormData`, active automatiquement les services correspondant aux zones de pickup.

**APIs externes :** Supabase (via `SupabaseVehiclesService`, `ListingOwnersService`)

**Bugs/TODO :**
- Nombreux `console.log` de debug présents avec emojis (✅, ❌, 🆕, 🔢) — à nettoyer en prod.
- Commentaire "NOTE: La logique pendingConfigurations reste dans le composant pour l'instant" — extraction incomplète.
- `as any` utilisé pour certains champs non typés (`fuel_type`, `has_private_bathroom`, etc.).

---

## src/features/vehicle-management/types/vehicle-form.types.ts

**Fonction :** Types TypeScript pour le formulaire de gestion véhicule. `VehicleFormData` comprend 90+ champs couvrant : infos de base, remises, équipements, zones de pickup, conditions de réservation, services aéroport/barge/livraison/siège bébé/conducteur additionnel, listing owner. Valeurs initiales dans `initialFormData`.

**Valeurs initiales notables :**
- `depositAmount: "1000"` (€)
- `minAdvanceHours: "24"`
- `minRentalDays: "1"`
- Prix services aéroport défaut : 25€ (gratuit par défaut)
- Prix services barge : 15€ (gratuit par défaut)
- Prix livraison domicile : 20€ (gratuit par défaut)
- Prix siège bébé : 1€ (payant par défaut)
- Prix conducteur additionnel : 15€ (payant par défaut)

---

## src/modules/etatDesLieuxDepart/EtatDesLieuxDepartForm.tsx

**Fonction :** Formulaire principal d'état des lieux départ (voiture). Formulaire multi-étapes (7 étapes) avec barre de progression. Gère : chargement des données de booking/profil/véhicule depuis Supabase, détection et reprise de draft existant (modal de choix), hydratation du formulaire RHF depuis un draft, auto-save progressif par étape, suppression de draft avec nettoyage Storage.

**APIs externes :**
- Supabase : tables `bookings`, `vehicles`, `profiles`, `checkin_depart`
- Supabase Storage : bucket `checkin-photos` (suppression batch lors de restart)
- `SupabaseCheckinService.getCheckinById()` (polling statut)

**Étapes du formulaire :**
1. "Identification" — Section1Identification
2. "Relevés" — Section2Releves
3. "Extérieur & Coffre" — ExteriorInspectionAccordionSimple
4. "Intérieur" — Section4Interieur
5. "Accessoires & Équipements" — Section5Accessoires
6. "Remarques & Observations" — Section6Remarques
7. "Validation & Signature" — Section8Validation

**Textes UI exacts (modal draft) :**
- "Brouillon d'état des lieux détecté" (titre)
- "Un état des lieux est déjà en cours pour cette réservation. Que souhaitez-vous faire ?"
- "📅 Créé le : {date}"
- "🕐 Dernière modification : {date}"
- "📊 Progression :"
- "Étape {N} — {label}" + "(en cours)" si courante
- "📄 Reprendre à l'étape {N} — {label}" (bouton principal)
- "🔄 Suppression en cours..." / "🗑️ Redémarrer à zéro" (bouton secondaire)
- "⚠️ 'Redémarrer à zéro' supprimera définitivement toutes les données et photos du brouillon"

**Textes UI exacts (formulaire) :**
- "Étape {N} sur {M}"
- "{N}%" (progression)
- Labels étapes : "Identification", "Relevés", "Extérieur & Coffre", "Intérieur", "Accessoires & Équipements", "Remarques & Observations", "Validation & Signature"
- "Chargement des informations du conducteur..."
- "Précédent" / "Suivant"
- "Valider l'état des lieux" (bouton final)
- "Chargement de l'état des lieux..." / "Veuillez choisir une option dans la fenêtre ci-dessus"
- "⚠️ État des lieux finalisé" (toast si completed)
- "Cet état des lieux est finalisé et ne peut plus être modifié."
- "✅ Brouillon repris" (toast)
- "Reprise à l'étape {N} — {label}" (toast description)
- "✅ Brouillon supprimé" + "{N} fichier(s) supprimé(s). Vous repartez de zéro."
- "⚠️ Suppression partielle" + "Le brouillon a été supprimé, mais certains fichiers peuvent rester."
- "❌ Erreur lors de la suppression"

**Textes UI Dev Mode :**
- "🔧 Dev mode" (détails flottants bottom-right en non-production)
- "Dev Mode" (toast lors navigation)
- "Navigation vers l'étape {N}: {label}"

**Interactions utilisateur :**
- Modal draft : "Reprendre" → hydrate formulaire + navigue à la bonne étape
- Modal draft : "Redémarrer à zéro" → supprime draft + fichiers Storage + reset form
- Navigation "Précédent" / "Suivant" entre étapes
- Bouton final "Valider l'état des lieux" → `handleFinalSubmit()` (actuellement log console, pas d'appel API — voir TODO)
- Dev mode : navigation directe entre étapes

**Bugs/TODO critiques :**
- `handleFinalSubmit()` ne fait qu'un `console.log` du payload final et un toast — l'appel `/api/checkin/submit` est commenté. **La soumission finale n'est pas implémentée dans ce composant.**
- Nombreux `console.log` de debug avec emojis.
- Mapping pays partiel (`mapCountryNameToCode`) : seulement ~13 pays mappés.
- `bookingReferenceNumberProp` marqué "⭐ NOUVEAU" dans plusieurs commentaires — feature récente.
- `methods.setValue("step5", step5)` et `"step6"` — stockage de données hors schéma Zod (champs non déclarés dans `FormSchema`).

---

## src/modules/etatDesLieuxDepart/components/CoffreCard.tsx

**Fonction :** Carte d'inspection du coffre dans l'accordéon extérieur.

---

## src/modules/etatDesLieuxDepart/components/ExteriorInspectionAccordion.tsx / ExteriorInspectionSection.tsx / ExteriorZoneRecapCard.tsx / ZoneCard.tsx

**Fonction :** Composants de l'inspection extérieure zone par zone.

---

## src/modules/etatDesLieuxDepart/config/zones.ts

**Fonction :** Configuration centralisée des zones d'inspection extérieure. Évite les incohérences de clés entre les étapes.

**Zones extérieures :**
- `avant` → "1. Avant du véhicule"
- `droit` → "2. Côté droit"
- `arriere` → "3. Arrière du véhicule" (SANS accent dans la clé)
- `coffre` → "4. Coffre et équipement"
- `gauche` → "5. Côté gauche"

**Jantes :**
- `janteAvDroit` → "Jante avant droite"
- `janteArDroit` → "Jante arrière droite"
- `janteAvGauche` → "Jante avant gauche"
- `janteArGauche` → "Jante arrière gauche"

**Note bug potentiel :** Le commentaire "⚠️ SANS ACCENT pour éviter les bugs" sur `arriere` indique un historique d'incohérence de clés.

---

## src/modules/etatDesLieuxDepart/helpers/step3Helpers.ts

**Fonction :** Helpers upload photos extérieur vers Supabase Storage. 4 fonctions : `uploadZonePhoto`, `uploadWheelPhoto`, `uploadTrunkPhoto`, `uploadDamagePhoto`. Accepte File (direct) ou base64 (rétrocompatibilité). Instrumentation performance DEV (temps conversion + upload).

**APIs externes :** Supabase Storage via `CheckinPhotoService`

---

## src/modules/etatDesLieuxDepart/helpers/step4Helpers.ts

**Fonction :** Helpers upload photos intérieur vers Supabase Storage. 3 fonctions : `uploadInteriorSeatsPhoto`, `uploadInteriorCleanlinessPhoto`, `uploadInteriorDamagePhoto`.

**APIs externes :** Supabase Storage via `CheckinPhotoService`

---

## src/modules/etatDesLieuxDepart/schemas/inspectionExterieureSchema.ts

**Fonction :** Schema Zod pour l'inspection extérieure structurée par zone. Zones : `avant`, `cote_droit`, `arriere`, `coffre`, `cote_gauche`. Sous-schemas : `zoneDegatsSchema` (photo + degat_present boolean nullable + description + photos), `zoneDegatsAvecJantesSchema` (+ photos jantes), `coffreSchema` (photo_coffre_ouvert + gilet_triangle + roue_secours enum ["roue","kit","aucun"] + cable_recharge enum ["oui","non","na"]).

---

## src/modules/etatDesLieuxDepart/sections/Section1Identification.test-flags.ts

**Fonction :** Flags de test booléens pour désactiver sélectivement des composants lors du diagnostic du bug `removeChild`. Tous à `false` (désactivés). `DEBUG_MODE` activé en DEV uniquement.

**Bugs/TODO :** L'existence de ce fichier confirme un bug de démontage DOM React (probable Radix Select + Portal) encore en investigation.

---

## src/modules/etatDesLieuxDepart/sections/Section1Identification.tsx

**Fonction :** Étape 1 de l'état des lieux départ. Formulaire d'identification du conducteur : nom, prénom, numéro de permis, pays d'émission (Select), dates de délivrance/expiration, catégorie de permis (Select). Upload photos permis recto/verso via `PhotoCaptureField` (base64 → File → Supabase Storage). Auto-save après validation via `saveStep1Draft`.

**APIs externes :**
- Supabase Storage : `CheckinPhotoService.uploadLicenseRecto/Verso` → bucket `checkin-photos`
- Supabase BDD : `saveStep1Draft` (via `checkinDepartService`)

**Textes UI exacts (labels/toasts) :**
- "Identification incomplète" (toast erreur titre)
- "Champs manquants : {liste}" (toast erreur description)
- "Veuillez remplir tous les champs obligatoires"
- "Impossible d'uploader : ID de réservation manquant"
- "📸 Photo recto uploadée avec succès"
- "📸 Photo verso uploadée avec succès"
- "Erreur d'upload photo recto" / "Erreur d'upload photo verso"
- "Erreur inattendue lors de l'upload"
- Champs requis : "Nom", "Prénom", "Numéro de permis", "Pays d'émission", "Date de délivrance", "Date d'expiration", "Catégorie de permis"

**Bugs/TODO :**
- Fix `removeChild` : fermeture forcée des Select (état React) avant navigation.
- Fix `removeChild` : vérification `firstError.isConnected && document.body.contains(firstError)` avant `scrollIntoView`.

---

## src/modules/etatDesLieuxDepart/sections/Section2Releves.tsx

**Fonction :** Étape 2. Relevés kilométriques et niveau carburant. Upload photos tableau de bord. Slider carburant (`FuelLevelSlider`). Auto-save via `saveStep2Draft`.

**APIs externes :**
- Supabase Storage : `CheckinPhotoService` (photos dashboard)
- Supabase BDD : `saveStep2Draft`

---

## src/modules/etatDesLieuxDepart/sections/Section3Exterieur.tsx

**Fonction :** Étape 3. Inspection extérieure voiture (non utilisée directement — remplacée par `ExteriorInspectionAccordionSimple`).

---

## src/modules/etatDesLieuxDepart/sections/Section4Interieur.tsx

**Fonction :** Étape 4. Inspection intérieure : propreté générale, état sièges, équipements (radio/AC/verrouillage centralisé/vitres). Upload photos. Auto-save.

---

## src/modules/etatDesLieuxDepart/sections/Section5Accessoires.tsx

**Fonction :** Étape 5. Checklist accessoires : gilet, triangle, roue de secours, cric, clé, câble, manuel, carte carburant. Commentaire libre. Auto-save.

---

## src/modules/etatDesLieuxDepart/sections/Section6Remarques.tsx

**Fonction :** Étape 6. Zone de texte libre pour observations générales. Auto-save.

---

## src/modules/etatDesLieuxDepart/sections/Section7Signatures.tsx

**Fonction :** Étape 7 (ancienne numérotation — désormais remplacée par Section8Validation dans le form principal).

---

## src/modules/etatDesLieuxDepart/sections/Section8Validation.tsx

**Fonction :** Étape finale (step 7 dans le formulaire). Récapitulatif complet de l'état des lieux : infos conducteur, véhicule, relevés, inspection extérieure avec photos par zone et dégâts, inspection intérieure, accessoires. Signatures propriétaire + locataire via `SignatureCanvas`. Appelle `finalizeCheckinDepart` pour finalisation en Supabase.

**APIs externes :**
- Supabase BDD : `finalizeCheckinDepart` (via `checkinDepartService`)
- `SupabaseCheckinService.getCheckinById()` (lecture statut)

**Interactions :**
- Clic photo → zoom via Dialog Radix
- Signature propriétaire + locataire (canvas)
- Supprimer signature (Trash2)
- Bouton finalisation

---

## src/modules/etatDesLieuxDepartMoto/EtatDesLieuxDepartFormMoto.tsx

**Fonction :** Variante moto du formulaire d'état des lieux départ. 6 étapes visibles (1, 2, 3, 5, 6, 7 — étape 4 masquée car pas d'intérieur pour une moto). Réutilise les sections de voiture compatibles (Section1, Section2, Section6) et utilise des sections spécifiques moto (Section3ExterieurMoto, Section5AccessoiresMoto, Section8ValidationMoto).

**APIs externes :** Supabase (identique au formulaire voiture)

**Steps visibles :** "Identification", "Relevés", "Extérieur moto", "Accessoires", "Remarques", "Validation & Signature"

---

## src/modules/etatDesLieuxDepartMoto/schemas/formSchemaMoto.ts

**Fonction :** Schema Zod spécifique moto. Structure similaire à la voiture mais sans section intérieure.

---

## src/modules/etatDesLieuxDepartMoto/sections/

**Fichiers :** Section1IdentificationMoto.tsx, Section2RelevesMoto.tsx, Section3ExterieurMoto.tsx, Section5AccessoiresMoto.tsx, Section6RemarquesMoto.tsx, Section8ValidationMoto.tsx

**Fonction :** Sections spécifiques à l'état des lieux moto. Section3 adapte l'inspection extérieure (pas de coffre, jantes différentes). Section5 adapte les accessoires moto (casque, antivol, etc.).

---

## src/modules/etatDesLieuxDepartMoto/types/step3Moto.ts

**Fonction :** Types TypeScript pour l'inspection extérieure moto (step3).

---

## src/modules/etatDesLieuxRetour/EtatDesLieuxRetourForm.tsx

**Fonction :** Formulaire multi-étapes d'état des lieux retour. 7 étapes : récapitulatif départ, relevés retour, extérieur retour, intérieur retour, accessoires retour, remarques retour, validation retour. Charge les données du check-in départ (`SupabaseCheckinService`) et du check-in retour (`checkinReturnService`). Inclut une modale de progression de finalisation.

**APIs externes :**
- Supabase : `SupabaseCheckinService` (lecture checkin départ)
- Supabase : `checkinReturnService` (lecture/écriture checkin retour)

---

## src/modules/etatDesLieuxRetour/steps/Step1DepartRecap.tsx

**Fonction :** Récapitulatif de l'état des lieux départ pour comparaison au retour.

---

## src/modules/etatDesLieuxRetour/steps/Step2RelevesRetour.tsx

**Fonction :** Saisie kilométrage et niveau carburant au retour. Comparaison avec valeurs départ.

---

## src/modules/etatDesLieuxRetour/steps/Step3ExterieurRetour.tsx

**Fonction :** Inspection extérieure au retour. Comparaison avec l'état au départ.

---

## src/modules/etatDesLieuxRetour/steps/Step4InterieurRetour.tsx

**Fonction :** Inspection intérieure au retour.

---

## src/modules/etatDesLieuxRetour/steps/Step5AccessoiresRetour.tsx

**Fonction :** Vérification des accessoires au retour.

---

## src/modules/etatDesLieuxRetour/steps/Step6RemarquesRetour.tsx

**Fonction :** Remarques et observations au retour. Zone de texte libre.

---

## src/modules/etatDesLieuxRetour/steps/Step7ValidationRetour.tsx

**Fonction :** Signatures et validation finale du retour. Comparaison départ/retour pour chaque zone. Calcul des dégâts nouveaux.

---

## src/modules/rentalContract/RentalContractPanel.tsx

**Fonction :** Panneau de signature du contrat de location. Charge les données de booking via `getRentalContractPayload()`. Affiche le contrat HTML scrollable. Pré-remplit les champs KYC depuis le profil (modifiables avant signature). Signature propriétaire + locataire via `SignatureCanvas`. Appelle `generateAndStoreRentalContractPdf()` pour générer et stocker le PDF.

**APIs externes :**
- Supabase : `getRentalContractPayload()` (tables `bookings`, `vehicles`, `profiles`)
- `generateAndStoreRentalContractPdf()` — génération PDF + stockage
- `ExchangeRateContext` (taux de change)

**Textes UI exacts :**
- "La signature du locataire est requise." (toast erreur)
- "La signature du propriétaire du véhicule est requise." (toast erreur)
- Labels champs KYC : "Date de naissance", "Adresse", "Code postal", "Ville", "Pays", "Numéro de permis", "Date de délivrance permis"

**Interactions :**
- Modification des champs KYC avant signature
- Signature locataire + propriétaire (canvas)
- Bouton signature/validation → génération PDF

---

## src/modules/rentalContract/constants.ts

**Fonction :** Constantes du contrat de location.
- `RENTAL_CONTRACT_TEMPLATE_VERSION = "7.0.0"` — version du template PDF
- `RENTAL_CONTRACT_SINISTER_DECLARATION_HOURS = 48` — délai déclaration sinistre (article 6 du contrat)

---

## src/modules/rentalContract/contractTemplateHtml.ts

**Fonction :** Template HTML du contrat de location V7. Génère le HTML du contrat à partir du `RentalContractPayload`. Contient le texte juridique complet du contrat. Utilise `formatDualPrice` (EUR + MGA), `formatDateFR`, `formatMoneyEUR`.

**APIs externes :** Aucune directe (génération locale).

---

## src/modules/rentalContract/rentalContractPayload.ts

**Fonction :** Assemblage des données du contrat de location depuis Supabase. `getRentalContractPayload(bookingId)` fait une jointure booking → véhicule → profils (locataire + propriétaire). Vérifie l'authentification. Exige que l'utilisateur connecté soit l'un ou l'autre des signataires. Retourne `RentalContractPayload` incluant snapshot du montant caution.

**APIs externes :** Supabase (tables `bookings`, `vehicles`, `profiles`, `auth`)

---

# Résumé global — APIs externes identifiées

| API | Usage |
|-----|-------|
| **Supabase BDD** | Tables : `bookings`, `vehicles`, `profiles`, `checkin_depart`, `checkin_return`, `parts`, `repairs`, `repair_parts`, `sales`, `sale_lines`, `stock_movements`, `suppliers`, `vehicle_states`, `vehicle_photos`, `maintenance_rules`, `vehicles` |
| **Supabase Storage** | Buckets : `checkin-photos`, `vehicle-photos`, `scooter-docs`, `repair-photos` |
| **Supabase RPC** | `rpc_cancel_repair`, `rpc_consume_parts_for_repair`, `rpc_create_part_sale`, `rpc_cancel_part_sale`, `rpc_stock_in`, `rpc_stock_adjustment` |
| **Supabase Auth** | `getUser()` dans plusieurs services |
| **Stripe** | Paiements via callbacks (liens Stripe dashboard dans `BookingDepositCard`), `stripe_payment_intent_id` stocké |
| **GA4** | `trackPageViewEvent()` à chaque navigation SPA |
| **Meta Pixel (fbq)** | `trackMetaPageView()` à chaque navigation SPA |

---

# Résumé global — Bugs et TODO critiques identifiés

1. **Soumission finale EDL départ non implémentée** (`EtatDesLieuxDepartForm.tsx` L.1653-1669) — `handleFinalSubmit()` ne fait qu'un `console.log`. L'appel `/api/checkin/submit` est commenté.
2. **Bug `removeChild` Radix** — Test flags encore actifs (`Section1Identification.test-flags.ts`), multiples workarounds dans Section1, contournement CSS global dans `index.css`.
3. **LanguageSwitcher qualifié "Dev-only" mais monté en production**.
4. **Nombreux `console.log` de debug** avec emojis (✅, ❌, 🆕, etc.) dans les hooks et services.
5. **Mapping pays incomplet** — seulement ~13 pays mappés dans `mapCountryNameToCode`.
6. **`as any` dans useManageVehicle.ts** pour contourner des types Supabase non définis.
7. **Données hors-schéma Zod** dans `EtatDesLieuxDepartForm.tsx` (`setValue("step5", ...)`, `setValue("step6", ...)`).
8. **Contrat PDF template version 7.0.0** — incrémenter en cas de changement juridique (risque d'oubli).

---

# PARTIE E — i18n (4 langues : FR, EN, MG, DE)

# SECTION 4 — I18N INTÉGRAL (4 LANGUES)

**Langues** : FR | EN | IT | DE  |  **Total clés uniques** : 1159

## ACCOMMODATIONCARD

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `filterLabel` | Hébergement | Accommodation | ❌ `Hébergement` | ❌ `Hébergement` |
| `typeFallback` | Hébergement | Accommodation | ❌ `Hébergement` | ❌ `Hébergement` |

## ACCOMMODATIONDETAILS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `back` | Retour | Back | ❌ `Retour` | ❌ `Retour` |
| `descriptionHeading` | Location de {{name}} à Nosy Be | Rent {{name}} in Nosy Be | ❌ `Location de {{name}} à Nosy Be` | ❌ `Location de {{name}} à Nosy Be` |
| `descriptionTitle` | Description | Description | ❌ `Description` | ❌ `Description` |
| `errors.bookingError.description` | Impossible de créer la demande de réservation. | Unable to create the booking request. | ❌ `Impossible de créer la demande de réservation.` | ❌ `Impossible de créer la demande de réservation.` |
| `errors.bookingError.title` | Erreur de réservation | Booking error | ❌ `Erreur de réservation` | ❌ `Erreur de réservation` |
| `errors.loadError.description` | Impossible de charger cet hébergement. | Unable to load this accommodation. | ❌ `Impossible de charger cet hébergement.` | ❌ `Impossible de charger cet hébergement.` |
| `errors.loadError.title` | Erreur de chargement | Loading error | ❌ `Erreur de chargement` | ❌ `Erreur de chargement` |
| `errors.loginRequired.description` | Connectez-vous pour réserver cet hébergement. | Sign in to book this accommodation. | ❌ `Connectez-vous pour réserver cet hébergement.` | ❌ `Connectez-vous pour réserver cet hébergement.` |
| `errors.loginRequired.title` | Connexion requise | Login required | ❌ `Connexion requise` | ❌ `Connexion requise` |
| `errors.unexpectedError.description` | Une erreur inattendue s'est produite. | An unexpected error occurred. | ❌ `Une erreur inattendue s'est produite.` | ❌ `Une erreur inattendue s'est produite.` |
| `errors.unexpectedError.title` | Erreur | Error | ❌ `Erreur` | ❌ `Erreur` |
| `errors.vehicleIncompatible.description` | Cette page est réservée aux hébergements. | This page is for accommodations only. | ❌ `Cette page est réservée aux hébergements.` | ❌ `Cette page est réservée aux hébergements.` |
| `errors.vehicleIncompatible.title` | Annonce incompatible | Incompatible listing | ❌ `Annonce incompatible` | ❌ `Annonce incompatible` |
| `errors.vehicleNotFound.description` | Cet hébergement n'est plus disponible. | This accommodation is no longer available. | ❌ `Cet hébergement n'est plus disponible.` | ❌ `Cet hébergement n'est plus disponible.` |
| `errors.vehicleNotFound.title` | Hébergement introuvable | Accommodation not found | ❌ `Hébergement introuvable` | ❌ `Hébergement introuvable` |
| `loading` | Chargement de l'hébergement... | Loading accommodation... | ❌ `Chargement de l'hébergement...` | ❌ `Chargement de l'hébergement...` |

## BOOKING

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `baseRateLabel` | Tarif de base* : | Base rate*: | Tariffa base*: | Grundpreis*: |
| `benefits.freeCancellationHint` | Gratuite 48h | Free 48h | Gratuita 48h | Kostenlos 48h |
| `benefits.quickConfirmation` | Confirmation rapide | Quick confirmation | Conferma rapida | Schnelle Bestätigung |
| `benefits.quickResponse` | Réponse rapide | Quick response | Risposta rapida | Schnelle Antwort |
| `benefits.quickResponseHint` | Sous 24h | Within 24h | Entro 24h | Innerhalb von 24h |
| `benefits.safePayment` | Paiement sûr | Secure payment | Pagamento sicuro | Sichere Zahlung |
| `benefits.safePaymentHint` | Après validation | After validation | Dopo la validazione | Nach Validierung |
| `complementaryServices.continueWithServices` | Continuer avec les services sélectionnés | Continue with selected services | Continua con i servizi selezionati | Mit ausgewählten Leistungen fortfahren |
| `complementaryServices.declineAgency` | Non merci, je viendrai à l'agence | No thanks, I'll come to the agency | No grazie, verrò in agenzia | Nein danke, ich komme zur Agentur |
| `complementaryServices.hotelNameLabel` | Nom de l'hôtel | Hotel name | Nome dell'hotel | Hotelname |
| `complementaryServices.hotelNamePlaceholder` | Ex. Royal Beach Hotel | e.g. Royal Beach Hotel | Es. Royal Beach Hotel | z. B. Royal Beach Hotel |
| `complementaryServices.hotelRequiredDescription` | Indiquez le nom de votre hôtel pour la livraison ou la restitution. | Please enter your hotel name for delivery or return. | Indica il nome del tuo hotel per la consegna o la restituzione. | Bitte geben Sie Ihren Hotelnamen für Lieferung oder Rückgabe an. |
| `complementaryServices.hotelRequiredTitle` | Nom d'hôtel requis | Hotel name required | Nome hotel obbligatorio | Hotelname erforderlich |
| `complementaryServices.optionsTotal` | Total des services | Services total | Totale servizi | Gesamt der Leistungen |
| `complementaryServices.subtitle` | Simplifiez votre arrivée et votre départ avec nos options de transport. | Make your arrival and departure easier with our transport options. | Semplifica arrivo e partenza con le nostre opzioni di trasporto. | Vereinfachen Sie An- und Abreise mit unseren Transportoptionen. |
| `complementaryServices.title` | Services complémentaires | Complementary services | Servizi complementari | Zusatzleistungen |
| `confirmBooking` | Je confirme ma demande de réservation | I confirm my booking request | Confermo la mia richiesta di prenotazione | Ich bestätige meine Buchungsanfrage |
| `confirmation.returnLocation` | Lieu de restitution | Return location | Luogo di restituzione | Rückgabeort |
| `confirmation.subtitle` | Vérifiez les détails ci-dessous avant de confirmer | Please review the details below before confirming | Controlla i dettagli qui sotto prima di confermare | Bitte überprüfen Sie die unten stehenden Details vor der Bestätigung |
| `confirmation.title` | Confirmation de votre réservation | Confirm your booking | Conferma la tua prenotazione | Bestätigung Ihrer Buchung |
| `discussion.additionalOptions` | Options supplémentaires : | Additional options: | Opzioni aggiuntive: | Zusätzliche Optionen: |
| `discussion.confirmAvailability.owner` | Merci de confirmer votre disponibilité ! | Please confirm your availability! | Conferma la tua disponibilità! | Bitte bestätigen Sie Ihre Verfügbarkeit! |
| `discussion.confirmAvailability.renter` | Pouvez-vous confirmer la disponibilité ? Merci ! | Can you confirm availability? Thank you! | Puoi confermare la disponibilità? Grazie! | Können Sie die Verfügbarkeit bestätigen? Vielen Dank! |
| `discussion.conversationCancelled` | Vous ne pouvez plus discuter. La demande de réservation a ét... | You can no longer chat. The booking request has been cancelled or completed. ❌ | Non puoi più chattare. La richiesta di prenotazione è stata ... | Sie können nicht mehr chatten. Die Buchungsanfrage wurde sto... |
| `discussion.conversationCancelledShort` | Vous ne pouvez plus discuter. La demande de réservation a été annulée. | You can no longer chat. The booking request has been cancelled. | Non puoi più chattare. La richiesta di prenotazione è stata annullata. | Sie können nicht mehr chatten. Die Buchungsanfrage wurde storniert. |
| `discussion.dateRange` | Du {{startDate}} au {{endDate}} | From {{startDate}} to {{endDate}} | Dal {{startDate}} al {{endDate}} | Vom {{startDate}} bis {{endDate}} |
| `discussion.departureTime` | Départ à {{startTime}} | Departure at {{startTime}} | Partenza alle {{startTime}} | Abfahrt um {{startTime}} |
| `discussion.initialMessage.owner` | Bonjour ! Vous avez une nouvelle demande de réservation. Voici les détails : | Hello! You have a new booking request. Here are the details: | Ciao! Hai una nuova richiesta di prenotazione. Ecco i dettagli: | Hallo! Sie haben eine neue Buchungsanfrage. Hier sind die Details: |
| `discussion.initialMessage.renter` | Bonjour ! Je suis intéressé par la location de votre véhicul... | Hello! I'm interested in renting your vehicle. Here are the details: | Ciao! Sono interessato al noleggio del tuo veicolo. Ecco i dettagli: | Hallo! Ich bin an der Miete Ihres Fahrzeugs interessiert. Hier sind die Details: |
| `discussion.messagePlaceholder` | Tapez votre message... | Type your message... | Scrivi il tuo messaggio... | Geben Sie Ihre Nachricht ein... |
| `discussion.optionsTotal` | Dont {{optionsTotal}} d'options | Including {{optionsTotal}} of options | Inclusi {{optionsTotal}} di opzioni | Einschließlich {{optionsTotal}} Optionen |
| `discussion.payRental` | Payer ma location | Pay my rental | Paga il mio noleggio | Meine Miete bezahlen |
| `discussion.pickupLocation` | Prise en charge : {{pickupLocation}} | Pickup: {{pickupLocation}} | Ritiro: {{pickupLocation}} | Abholung: {{pickupLocation}} |
| `discussion.returnLocation` | Restitution : {{returnLocation}} | Return: {{returnLocation}} | Restituzione: {{returnLocation}} | Rückgabe: {{returnLocation}} |
| `discussion.role.owner` | Vous êtes le propriétaire | You are the owner | Sei il proprietario | Sie sind der Eigentümer |
| `discussion.role.renter` | Vous êtes le locataire | You are the renter | Sei il locatario | Sie sind der Mieter |
| `discussion.toasts.bookingCancelled.description` | Cette réservation a été supprimée par le locataire. | This booking has been deleted by the renter. | Questa prenotazione è stata eliminata dal locatario. | Diese Buchung wurde vom Mieter gelöscht. |
| `discussion.toasts.bookingCancelled.title` | Réservation annulée | Booking cancelled | Prenotazione annullata | Buchung storniert |
| `discussion.toasts.loadBookingError` | Impossible de récupérer les informations de réservation | Unable to retrieve booking information | Impossibile recuperare le informazioni sulla prenotazione | Buchungsinformationen konnten nicht abgerufen werden |
| `discussion.toasts.messageSent.description` | Votre message a été envoyé au propriétaire | Your message has been sent to the owner | Il tuo messaggio è stato inviato al proprietario | Ihre Nachricht wurde an den Eigentümer gesendet |
| `discussion.toasts.messageSent.title` | Message envoyé | Message sent | Messaggio inviato | Nachricht gesendet |
| `discussion.toasts.paymentError.description` | Impossible de démarrer le paiement | Unable to start payment | Impossibile avviare il pagamento | Zahlung konnte nicht gestartet werden |
| `discussion.toasts.paymentError.title` | Erreur paiement | Payment error | Errore di pagamento | Zahlungsfehler |
| `discussion.toasts.sendMessageError` | Impossible d'envoyer le message | Unable to send message | Impossibile inviare il messaggio | Nachricht konnte nicht gesendet werden |
| `discussion.toasts.unexpectedError` | Une erreur est survenue | An error occurred | Si è verificato un errore | Ein Fehler ist aufgetreten |
| `discussion.viewBookingDetails` | Voir les détails de ma réservation | View my booking details | Visualizza i dettagli della mia prenotazione | Details meiner Buchung anzeigen |
| `discussion.withOwner` | Discussion avec le propriétaire | Discussion with owner | Discussione con il proprietario | Diskussion mit Eigentümer |
| `discussion.withRenter` | Discussion avec le locataire | Discussion with renter | Discussione con il locatario | Diskussion mit Mieter |
| `durationLabel` | Durée : | Duration: | Durata: | Dauer: |
| `excludingFeesNote` | * Hors options et frais de service | * Excluding options and service fees | * Escluse opzioni e commissioni di servizio | * Ohne Optionen und Servicegebühren |
| `freeCancellation` | Annulation gratuite | Free cancellation | Cancellazione gratuita | Kostenlose Stornierung |
| `funnel.missingDates.description` | Sélectionnez vos dates sur la page d'accueil, puis revenez s... | Select your dates on the homepage, then return to this listing to book. | Seleziona le date sulla homepage, poi torna a questa scheda per prenotare. | Wählen Sie Ihre Daten auf der Startseite und kehren Sie dann... |
| `funnel.missingDates.title` | Dates requises | Dates required | Date obbligatorie | Daten erforderlich |
| `included.extraDrivers` | Conducteurs additionnels gratuits | Free additional drivers | Conducenti aggiuntivi gratuiti | Kostenlose zusätzliche Fahrer |
| `included.insurance` | Assurance multirisque | Comprehensive insurance | Assicurazione completa | Vollkaskoversicherung |
| `included.roadside` | Assistance routière 24/7 | 24/7 roadside assistance | Assistenza stradale 24/7 | 24/7 Pannenhilfe |
| `includedInPrice` | Inclus dans le prix | Included in the price | Incluso nel prezzo | Im Preis enthalten |
| `optionsSubtotal` | Sous-total options | Options subtotal | Subtotale opzioni | Optionen Zwischensumme |
| `paymentMethod.cardOnline.hint` | Paiement sécurisé Stripe | Secure payment via Stripe | ❌ `Paiement sécurisé Stripe` | ❌ `Paiement sécurisé Stripe` |
| `paymentMethod.cardOnline.label` | Payer en ligne par carte | Pay online by card | ❌ `Payer en ligne par carte` | ❌ `Payer en ligne par carte` |
| `paymentMethod.cashOnSite.accommodation.hint` | Règlement à votre arrivée auprès de l'établissement | Payment upon arrival at the property | ❌ `Règlement à votre arrivée auprès de l'établissement` | ❌ `Règlement à votre arrivée auprès de l'établissement` |
| `paymentMethod.cashOnSite.accommodation.label` | Paiement sur place | Pay on arrival | ❌ `Paiement sur place` | ❌ `Paiement sur place` |
| `paymentMethod.cashOnSite.badge` | Paiement à l'agence | Pay at the agency | ❌ `Paiement à l'agence` | ❌ `Paiement à l'agence` |
| `paymentMethod.cashOnSite.hint` | Règlement lors de la remise des clés | Payment when keys are handed over | ❌ `Règlement lors de la remise des clés` | ❌ `Règlement lors de la remise des clés` |
| `paymentMethod.cashOnSite.label` | Paiement à l'agence | Pay at the agency | ❌ `Paiement à l'agence` | ❌ `Paiement à l'agence` |
| `paymentMethod.cashOnSite.modalHint` | Règlement lors de la remise des clés à l'agence. | Payment when keys are handed over at the agency. | ❌ `Règlement lors de la remise des clés à l'agence.` | ❌ `Règlement lors de la remise des clés à l'agence.` |
| `paymentMethod.noOnlinePaymentRequired` | Aucun paiement en ligne n'est nécessaire | No online payment is required | ❌ `Aucun paiement en ligne n'est nécessaire` | ❌ `Aucun paiement en ligne n'est nécessaire` |
| `paymentMethod.previewError` | Les frais de réservation n’ont pas pu être chargés. Le paiem... | Booking fees could not be loaded. Online card payment is applied by default. | ❌ `Les frais de réservation n’ont pas pu être chargés. Le paiem...` | ❌ `Les frais de réservation n’ont pas pu être chargés. Le paiem...` |
| `paymentMethod.recommended` | Recommandé | Recommended | ❌ `Recommandé` | ❌ `Recommandé` |
| `paymentMethod.savingsAmount` | Économisez {{amount}} | Save {{amount}} | ❌ `Économisez {{amount}}` | ❌ `Économisez {{amount}}` |
| `paymentMethod.serviceFeeGeneric` | Frais de service | Service fee | ❌ `Frais de service` | ❌ `Frais de service` |
| `paymentMethod.title` | Mode de paiement | Payment method | ❌ `Mode de paiement` | ❌ `Mode de paiement` |
| `reservationFee` | Frais de réservation ({{percent}}%) | Booking fee ({{percent}}%) | ❌ `Frais de réservation ({{percent}}%)` | ❌ `Frais de réservation ({{percent}}%)` |
| `reserve` | Réserver | Reserve | Prenota | Buchen |
| `selectedOptions` | Options sélectionnées | Selected options | Opzioni selezionate | Ausgewählte Optionen |
| `serviceFee` | Frais de service ({{percent}}%) | Service fee ({{percent}}%) | Tariffa di servizio ({{percent}}%) | Servicegebühr ({{percent}}%) |
| `subtotal` | Sous-total | Subtotal | Subtotale | Zwischensumme |
| `totalToPay` | TOTAL À PAYER | TOTAL TO PAY | TOTALE DA PAGARE | GESAMT ZU ZAHLEN |
| `vehicleRental` | Location véhicule | Vehicle rental | Noleggio veicolo | Fahrzeugmiete |

## BOOKINGS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `cancel.back` | Retour | Back | Indietro | Zurück |
| `cancel.confirm` | Confirmer | Confirm | Conferma | Bestätigen |
| `cancel.description` | Sélectionnez un motif ou rédigez votre message. | Select a reason or write your message. | Seleziona un motivo o scrivi il tuo messaggio. | Wählen Sie einen Grund oder schreiben Sie Ihre Nachricht. |
| `cancel.processing` | Annulation... | Cancelling... | Annullamento... | Stornierung... |
| `cancel.reason.bookingError` | Erreur de réservation | Booking error | Errore di prenotazione | Buchungsfehler |
| `cancel.reason.custom` | Autre raison (personnalisée) | Other reason (custom) | Altro motivo (personalizzato) | Anderer Grund (benutzerdefiniert) |
| `cancel.reason.dateChange` | Changement de dates | Date change | Cambio data | Terminänderung |
| `cancel.reason.otherOption` | Trouvé une autre option | Found another option | Trovata un'altra opzione | Andere Option gefunden |
| `cancel.reason.personalIssue` | Imprévu personnel | Personal issue | Imprevisto personale | Persönliches Problem |
| `cancel.reasonLabel` | Expliquez votre motif | Explain your reason | Spiega il tuo motivo | Erklären Sie Ihren Grund |
| `cancel.reasonPlaceholder` | Ex: Mon planning a changé... | Ex: My schedule changed... | Es: Il mio programma è cambiato... | Z.B.: Mein Zeitplan hat sich geändert... |
| `cancel.title` | Annuler la réservation | Cancel booking | Annulla prenotazione | Buchung stornieren |
| `card.activateDeposit` | Activer la caution | Activate deposit | Attiva cauzione | Kaution aktivieren |
| `card.confirm` | Confirmer | Confirm | Conferma | Bestätigen |
| `card.endLabel` | Fin: | End: | Fine: | Ende: |
| `card.finalizeBooking` | Finaliser ma réservation | Finalize my booking | Finalizza la mia prenotazione | Buchung abschließen |
| `card.messageButton` | Message | Message | Messaggio | Nachricht |
| `card.messageTooltip` | Bonjour {{ownerName}}, cliquez ici pour discuter avec moi | Hello {{ownerName}}, click here to chat with me | Ciao {{ownerName}}, clicca qui per chattare con me | Hallo {{ownerName}}, klicken Sie hier, um mit mir zu chatten |
| `card.ownerFallback` | Propriétaire | Owner | Proprietario | Eigentümer |
| `card.servicesTitle` | Services supplémentaires: | Additional services: | Servizi aggiuntivi: | Zusätzliche Dienstleistungen: |
| `card.startLabel` | Début: | Start: | Inizio: | Beginn: |
| `card.totalLabel` | Total: | Total: | Totale: | Gesamt: |
| `card.vehicleDeleted` | Véhicule supprimé | Vehicle deleted | Veicolo eliminato | Fahrzeug gelöscht |
| `deposit.status.activated` | Caution : activée | Deposit: activated | Cauzione: attivata | Kaution: aktiviert |
| `deposit.status.none` | Caution : aucune | No deposit | Nessuna cauzione | Keine Kaution |
| `deposit.status.todo` | Caution : à activer | Deposit: to activate | Cauzione: da attivare | Kaution: zu aktivieren |
| `deposit.toastPayFirst` | Paiement requis | Payment required | ❌ `Paiement requis` | ❌ `Paiement requis` |
| `deposit.toastPayFirstDesc` | Vous pourrez activer la caution après paiement de la location. | You can activate the deposit after paying for the rental. | ❌ `Vous pourrez activer la caution après paiement de la location.` | ❌ `Vous pourrez activer la caution après paiement de la location.` |
| `details.baseRate` | Tarif de base | Base rate | Tariffa base | Grundpreis |
| `details.clientInfo` | Informations client | Client information | Informazioni cliente | Kundeninformationen |
| `details.close` | Fermer | Close | Chiudi | Schließen |
| `details.createdAt` | Créée le {{date}} | Created on {{date}} | Creata il {{date}} | Erstellt am {{date}} |
| `details.downloadPdf` | Télécharger en PDF | Download PDF | Scarica PDF | PDF herunterladen |
| `details.email` | Email | Email | Email | E-Mail |
| `details.firstName` | Prénom | First name | Nome | Vorname |
| `details.hotelName` | Hôtel | Hotel | Hotel | Hotel |
| `details.lastName` | Nom | Last name | Cognome | Nachname |
| `details.notProvided` | Non renseigné | Not provided | Non fornito | Nicht angegeben |
| `details.notSpecified` | Non spécifiée | Not specified | Non specificata | Nicht angegeben |
| `details.notes` | Notes | Notes | Note | Notizen |
| `details.phone` | Téléphone | Phone | Telefono | Telefon |
| `details.pickupZone` | Zone de prise en charge | Pickup zone | Zona di ritiro | Abholzone |
| `details.pricePerDayFormat` | {{price}}/jour × {{duration}} | {{price}}/day × {{duration}} | {{price}}/giorno × {{duration}} | {{price}}/Tag × {{duration}} |
| `details.referenceNumber` | Réservation #{{referenceNumber}} | Booking #{{referenceNumber}} | Prenotazione #{{referenceNumber}} | Buchung #{{referenceNumber}} |
| `details.rentalDates` | Dates de location | Rental dates | Date di noleggio | Mietdaten |
| `details.returnZone` | Zone de restitution | Return zone | Zona di restituzione | Rückgabezone |
| `details.title` | Détails de votre réservation | Your booking details | Dettagli della tua prenotazione | Ihre Buchungsdetails |
| `details.yearLabel` | Année {{year}} | Year {{year}} | Anno {{year}} | Jahr {{year}} |
| `empty.cta` | Faire une réservation | Make a booking | Effettua una prenotazione | Eine Buchung vornehmen |
| `empty.description` | Vous n'avez pas encore effectué de réservation. Découvrez no... | You haven't made any bookings yet. Discover our available vehicles! | Non hai ancora effettuato prenotazioni. Scopri i nostri veicoli disponibili! | Sie haben noch keine Buchung vorgenommen. Entdecken Sie unse... |
| `empty.title` | Aucune réservation | No bookings | Nessuna prenotazione | Keine Buchung |
| `emptyFiltered.description` | Aucune réservation ne correspond au filtre sélectionné. Essayez un autre filtre. | No bookings match the selected filter. Try another filter. | Nessuna prenotazione corrisponde al filtro selezionato. Prova un altro filtro. | Keine Buchung entspricht dem ausgewählten Filter. Versuchen ... |
| `emptyFiltered.reset` | Voir toutes les réservations | View all bookings | Vedi tutte le prenotazioni | Alle Buchungen anzeigen |
| `emptyFiltered.title` | Aucune réservation {{filter}} | No {{filter}} bookings | Nessuna prenotazione {{filter}} | Keine {{filter}} Buchungen |
| `filters.active` | En cours | Ongoing | In corso | Laufend |
| `filters.all` | Toutes | All | Tutte | Alle |
| `filters.cancelled` | Annulées | Cancelled | Annullate | Storniert |
| `filters.past` | Terminées | Completed | Concluse | Abgeschlossen |
| `filters.pending` | En attente | Pending | In attesa | Ausstehend |
| `filters.refused` | Refusées | Refused | Rifiutate | Abgelehnt |
| `filters.upcoming` | À venir | Upcoming | In arrivo | Bevorstehend |
| `header.newBooking` | Nouvelle réservation | New booking | Nuova prenotazione | Neue Buchung |
| `header.subtitle` | Gérez vos locations de véhicules | Manage your vehicle rentals | Gestisci i tuoi noleggi di veicoli | Verwalten Sie Ihre Fahrzeugmieten |
| `header.title` | Mes réservations | My bookings | Le mie prenotazioni | Meine Buchungen |
| `status.accepted` | Acceptée | Accepted | Accettato | Angenommen |
| `status.active` | En cours | Ongoing | In corso | Laufend |
| `status.cancelled` | Annulée | Cancelled | Annullata | Storniert |
| `status.closed` | Clôturée | Closed | Chiuso | Geschlossen |
| `status.completed` | Terminé | Completed | Completato | Abgeschlossen |
| `status.confirmed` | Confirmée | Confirmed | Confermato | Bestätigt |
| `status.declined` | Refusée | Declined | Rifiutato | Abgelehnt |
| `status.depositPending` | En attente de la caution | Deposit pending | Deposito in attesa | Kaution ausstehend |
| `status.paymentConfirmed` | Paiement confirmé | Payment confirmed | Pagamento confermato | Zahlung bestätigt |
| `status.paymentDepositValidated` | Paiement et caution validés | Payment and deposit validated | Pagamento e deposito convalidati | Zahlung und Kaution bestätigt |
| `status.pending` | En attente | Pending | In attesa | Ausstehend |
| `status.pending_payment` | En attente de paiement | Pending payment | Pagamento in attesa | Zahlung ausstehend |
| `status.readyToGo` | Prêt à partir | Ready to go | Pronto a partire | Bereit zum Start |
| `status.rejected` | Rejetée | Rejected | Rifiutato | Abgelehnt |
| `status.terminated` | Terminée | Terminated | Terminata | Beendet |
| `toasts.cancelError` | Impossible d'annuler la réservation: {{error}} | Unable to cancel booking: {{error}} | Impossibile annullare la prenotazione: {{error}} | Buchung kann nicht storniert werden: {{error}} |
| `toasts.cancelledDescription` | Votre réservation a été annulée. Le propriétaire sera notifié. | Your booking has been cancelled. The owner will be notified. | La tua prenotazione è stata annullata. Il proprietario sarà informato. | Ihre Buchung wurde storniert. Der Eigentümer wird benachrichtigt. |
| `toasts.cancelledSimple` | Votre réservation a été annulée. | Your booking has been cancelled. | La tua prenotazione è stata annullata. | Ihre Buchung wurde storniert. |
| `toasts.comingSoon` | Fonctionnalité à venir | Coming soon | Funzionalità in arrivo | Bald verfügbar |
| `toasts.comingSoonDescription` | La confirmation de réservation sera bientôt disponible | Booking confirmation will be available soon | La conferma della prenotazione sarà presto disponibile | Die Buchungsbestätigung wird bald verfügbar sein |
| `toasts.reasonRequired` | Motif requis | Reason required | Motivo richiesto | Grund erforderlich |
| `toasts.reasonRequiredDescription` | Veuillez sélectionner un motif ou saisir un message. | Please select a reason or enter a message. | Seleziona un motivo o inserisci un messaggio. | Bitte wählen Sie einen Grund oder geben Sie eine Nachricht ein. |
| `toasts.unexpectedError` | Une erreur est survenue | An error occurred | Si è verificato un errore | Ein Fehler ist aufgetreten |

## CATEGORYSHOWCASE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `badgeAvailable` | Disponible maintenant | Available now | Disponibile ora | Jetzt verfügbar |
| `badgeComingSoon` | Prochainement | Coming soon | Prossimamente | Demnächst |
| `button` | Explorer | Explore | Esplora | Entdecken |
| `items.accommodation.label` | Hébergement | Accommodation | Alloggio | Unterkunft |
| `items.accommodation.waPrefillMessage` | Bonjour Rentanoo,  Je suis intéressé(e) par les hébergements... | Hello Rentanoo,  I'm interested in the accommodations offere... | Ciao Rentanoo,  Sono interessato/a agli alloggi proposti su ... | Hallo Rentanoo,  Ich interessiere mich für die auf Rentanoo ... |
| `items.boat.label` | Bateau | Boat | Barca | Boot |
| `items.boat.waPrefillMessage` | Bonjour Rentanoo,  Je suis intéressé(e) par la location de b... | Hello Rentanoo,  I'm interested in renting a boat in Nosy Be... | Ciao Rentanoo,  Sono interessato/a al noleggio di barche a N... | Hallo Rentanoo,  Ich interessiere mich für die Miete eines B... |
| `items.moto.label` | Moto | Motorbike | Moto | Motorrad |
| `items.quad.label` | Quad | Quad | Quad | Quad |
| `items.quad.waPrefillMessage` | Bonjour Rentanoo,  Je suis intéressé(e) par la location de q... | Hello Rentanoo,  I'm interested in renting a quad in Nosy Be... | Ciao Rentanoo,  Sono interessato/a al noleggio di quad a Nos... | Hallo Rentanoo,  Ich interessiere mich für die Miete eines Q... |
| `items.scooter.label` | Scooter | Scooter | Scooter | Roller |
| `sectionAvailable` | Disponible maintenant | Available now | Disponibile ora | Jetzt verfügbar |
| `sectionComingSoon` | Prochainement | Coming soon | Prossimamente | Demnächst |
| `subtitle` | Découvrez nos solutions de location disponibles aujourd'hui ... | Discover our rental solutions available today and those coming soon. | Scopri le nostre soluzioni di noleggio disponibili oggi e quelle in arrivo. | Entdecken Sie unsere Mietangebote, die heute verfügbar sind,... |
| `title` | Que souhaitez-vous louer à Nosy Be ? | What would you like to rent in Nosy Be? | Cosa vuoi noleggiare a Nosy Be? | Was möchten Sie in Nosy Be mieten? |
| `viewAllAvailable` | Voir toutes les locations disponibles | View all available rentals | Vedi tutti i noleggi disponibili | Alle verfügbaren Mietangebote ansehen |

## COMMON

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `2024_maycar_tous_droits_rservs_une_initiative_pour` | © 2025 Rentanoo. Tous droits réservés. Plateforme de location à Nosy Be. | © 2025 Rentanoo. All rights reserved. Scooter rental in Nosy Be. | © 2025 Rentanoo. Tutti i diritti riservati. Noleggio scooter a Nosy Be. | © 2025 Rentanoo. Alle Rechte vorbehalten. Rollervermietung in Nosy Be. |
| `actualiser_la_page` | Actualiser la page | Refresh page | Aggiorna la pagina | Seite aktualisieren |
| `addDates` | Ajouter des dates | Add dates | Aggiungi le date | Daten hinzufügen |
| `annuler` | Annuler | Cancel | Annulla | Abbrechen |
| `aucun_vhicule_disponible_pour_le_moment` | Aucun véhicule disponible pour le moment. | No vehicles available at the moment. | Nessun veicolo disponibile al momento. | Derzeit sind keine Fahrzeuge verfügbar. |
| `automatique` | Automatique | Automatic | Automatica | Automatik |
| `berline` | Berline | Sedan | Berlina | Limousine |
| `break_sw` | Break (SW) | Estate (SW) | Station wagon | Kombi |
| `cabriolet` | Cabriolet | Convertible | Cabriolet | Cabrio |
| `citadine` | Citadine | City car | Utilitaria | Stadtauto |
| `comingSoon` | Bientôt disponible | Coming soon | Disponibile a breve | Bald verfügbar |
| `communes` | __STRING_NOT_TRANSLATED__ | __STRING_NOT_TRANSLATED__ | Comuni | Gemeinden |
| `conditions_dutilisation` | Conditions d'utilisation | Terms of Service | Condizioni d'uso | Nutzungsbedingungen |
| `connexion` | Connexion | __STRING_NOT_TRANSLATED__ | Accesso | Anmeldung |
| `coup` | Coupé | Coupe | Coupé | Coupé |
| `crossover` | Crossover | Crossover | Crossover | Crossover |
| `dates` | Dates | Dates | Date | Daten |
| `default_location` | Nosy Be, Madagascar | Nosy Be, Madagascar | ❌ `Nosy Be, Madagascar` | ❌ `Nosy Be, Madagascar` |
| `demandes_de_location` | Demandes de location | Rental requests | Richieste di noleggio | Mietanfragen |
| `devenir_loueur` | Devenir loueur | Become a host | Diventa host | Werde Host |
| `devenir_propritaire` | Devenir propriétaire | Become an owner | Diventa proprietario | Werde Eigentümer |
| `diesel` | Diesel | Diesel | Diesel | Diesel |
| `dpart` | Départ | Departure | Partenza | Abfahrt |
| `duration.day_one` | {{count}} jour | {{count}} day | {{count}} giorno | {{count}} Tag |
| `duration.day_other` | {{count}} jours | {{count}} days | {{count}} giorni | {{count}} Tage |
| `duration.half_day` | demi-journée | half day | mezza giornata | halber Tag |
| `duration.half_day_suffix` | et demi | and a half | e mezzo | und halb |
| `duration.hour_one` | {{count}} heure | {{count}} hour | {{count}} ora | {{count}} Stunde |
| `duration.hour_other` | {{count}} heures | {{count}} hours | {{count}} ore | {{count}} Stunden |
| `duration.separator` |  +  |  +  |  +  |  +  |
| `error` | Erreur | Error | Errore | Fehler |
| `essence` | Essence | Gasoline | Benzina | Benzin |
| `filtres` | Filtres : | Filters: | Filtri: | Filter: |
| `heure_de_dpart` | Heure de départ | Departure time | Orario di partenza | Abfahrtszeit |
| `heure_de_retour` | Heure de retour | Return time | Orario di ritorno | Rückgabezeit |
| `heures` | Heures | Times | Orari | Zeiten |
| `hybride` | Hybride | Hybrid | Ibrida | Hybrid |
| `inscription` | Inscription | Sign up | Registrazione | Registrierung |
| `la_plateforme_dautopartage_de_mayotte_louez_et_par` | Réservez scooter, moto, voiture ou hébergement à Nosy Be. 100 % en ligne. | Rent your scooter in Nosy Be. 100% online booking, delivery ... | Noleggia il tuo scooter a Nosy Be. Prenotazione 100 % online... | Mieten Sie Ihren Roller in Nosy Be. 100 % Online-Buchung, Li... |
| `lectrique` | Électrique | Electric | Elettrica | Elektrisch |
| `lgal` | Légal | Legal | Legale | Rechtliches |
| `lieu_de_prise_en_charge` | Lieu de prise en charge | Pickup location | Luogo di ritiro | Abholort |
| `loading` | Chargement... | Loading... | Caricamento... | Laden... |
| `louez_des_vhicules_entre_particuliers_dans_le_plus` | Louez scooter, moto, voiture ou hébergement à Nosy Be et exp... | Rent scooters in Nosy Be and explore the island at your leisure | Noleggia scooter a Nosy Be e esplora l'isola in libertà | Mieten Sie Roller in Nosy Be und erkunden Sie die Insel in aller Ruhe. |
| `made_with_pour_le_101me_dpartement_franais` | Made with ❤️ pour le 101ème département français | Made with ❤️ for the 101st French department | Realizzato con ❤️ per il 101° dipartimento francese. | Mit ❤️ gemacht für das 101. französische Überseegebiet. |
| `manuelle` | Manuelle | Manual | Manuale | Manuell |
| `maycar` | Rentanoo | Rentanoo | Rentanoo | Rentanoo |
| `mayotte` | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagaskar |
| `mayotte_france` | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagaskar |
| `mentions_lgales` | Mentions légales | Legal Notice | Note legali | Impressum |
| `mes_rservations` | Mes réservations | My bookings | Le mie prenotazioni | Meine Buchungen |
| `mes_vhicules` | Mes véhicules | My vehicles | I miei veicoli | Meine Fahrzeuge |
| `minibus` | Minibus | Minibus | Minibus | Minibus |
| `modifier_mon_profil` | Modifier mon profil | Edit my profile | Modifica il mio profilo | Mein Profil bearbeiten |
| `modify` | Modifier | Modify | Modifica | Ändern |
| `mon_dashboard` | Mon Dashboard | My dashboard | La mia dashboard | Mein Dashboard |
| `mon_espace` | Mon espace | My space | Il mio spazio | Mein Bereich |
| `monospace` | Monospace | MPV | Monovolume | Van |
| `navigation` | Navigation | Navigation | Navigazione | Navigation |
| `nosy_be` | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagaskar |
| `par_jour` | par jour | per day | al giorno | pro Tag |
| `partagez_la_route_mayotte` | Explorez Nosy Be — scooter, moto, voiture ou hébergement | Explore Nosy Be by scooter | Esplora Nosy Be in scooter | Erkunden Sie Nosy Be mit dem Roller |
| `pickup` | Pick-up | Pickup | Pick-up | Pick-up |
| `points_stratgiques` | __STRING_NOT_TRANSLATED__ | __STRING_NOT_TRANSLATED__ | Punti strategici | Strategische Punkte |
| `politique_de_confidentialit` | Politique de confidentialité | Privacy Policy | Informativa sulla privacy | Datenschutzerklärung |
| `pricing.cardTotalSummary` | ❌ | ❌ | {{duration}} · {{total}} totale | {{duration}} · {{total}} gesamt |
| `pricing.perDayShort` | jour | day | giorno | Tag |
| `pricing.totalExcludingOptions` | soit {{total}} (hors options supplémentaires) | total {{total}} (excluding additional options) | ossia {{total}} (escluse opzioni aggiuntive) | also {{total}} (ohne Zusatzoptionen) |
| `pricing.total_for_duration` | soit {{total}} ({{duration}}) | total {{total}} ({{duration}}) | totale {{total}} ({{duration}}) | gesamt {{total}} ({{duration}}) |
| `rechercher_un_vhicule` | Rechercher un véhicule | Search for a vehicle | Cerca un veicolo | Fahrzeug suchen |
| `rechercher_une_ville_de_prise_en_charge` | Rechercher une ville de prise en charge | Search for a pickup location | Cerca un luogo di ritiro | Nach einem Abholort suchen |
| `retour` | Retour | Return | Ritorno | Rückgabe |
| `rinitialiser` | Réinitialiser | Reset | Reimposta | Zurücksetzen |
| `rinitialiser_les_filtres` | Réinitialiser les filtres | Reset filters | Reimposta filtri | Filter zurücksetzen |
| `roadster` | Roadster | Roadster | Roadster | Roadster |
| `se_connecter` | Se connecter | Sign in | Accedi | Anmelden |
| `se_dconnecter` | Se déconnecter | Log out | Disconnettersi | Abmelden |
| `search` | Rechercher | Search | Cerca | Suchen |
| `searchBar.date` | Date | Date | Data | Datum |
| `searchBar.departure` | Départ | Departure | Partenza | Abfahrt |
| `searchBar.launchSearch` | Je lance la recherche | Start my search | Avvio la ricerca | Suche starten |
| `searchBar.return` | Retour | Return | Ritorno | Rückgabe |
| `searchBar.searching` | Recherche en cours… | Searching… | Ricerca in corso… | Suche läuft… |
| `searchBar.time` | Heure | Time | Ora | Uhrzeit |
| `selectDates` | Sélectionner des dates | Select dates | Seleziona le date | Daten auswählen |
| `sinistre_caution` | Sinistre & caution | Damage & deposit | Danni e cauzione | Schaden & Kaution |
| `slectionner_les_dates` | Sélectionner les dates | Select dates | Seleziona le date | Daten auswählen |
| `slectionner_les_heures` | Sélectionner les heures | Select times | Seleziona gli orari | Zeiten auswählen |
| `slectionnez_le_lieu_o_vous_souhaitez_rcuprer_votre` | Sélectionnez le lieu où vous souhaitez récupérer votre véhicule | Select the location where you want to pick up your vehicle | Seleziona il luogo in cui desideri ritirare il veicolo | Wählen Sie den Ort aus, an dem Sie Ihr Fahrzeug abholen möchten |
| `suv` | SUV | SUV | SUV | SUV |
| `utilisateur_connect` | Utilisateur connecté | Logged in user | Utente connesso | Angemeldeter Benutzer |
| `valider` | Valider | Confirm | Conferma | Bestätigen |
| `valider_mes_dates` | Valider mes dates | Confirm dates | Conferma le mie date | Meine Daten bestätigen |
| `valider_mes_heures` | Valider mes heures | Confirm times | Conferma gli orari | Meine Zeiten bestätigen |
| `vehicle.fuel.diesel` | Diesel | Diesel | Diesel | Diesel |
| `vehicle.fuel.electric` | Électrique | Electric | Elettrico | Elektrisch |
| `vehicle.fuel.gasoline` | Essence | Gasoline | Benzina | Benzin |
| `vehicle.fuel.hybrid` | Hybride | Hybrid | Ibrido | Hybrid |
| `vehicle.places` | {{count}} places | {{count}} seats | ❌ `{{count}} places` | ❌ `{{count}} places` |
| `vehicle.places_one` | {{count}} place | {{count}} seat | {{count}} posto | {{count}} Sitzplatz |
| `vehicle.places_other` | {{count}} places | {{count}} seats | {{count}} posti | {{count}} Sitzplätze |
| `vehicle.transmission.automatic` | Automatique | Automatic | Automatico | Automatik |
| `vehicle.transmission.manual` | Manuelle | Manual | Manuale | Manuell |
| `vhicules_disponibles` | Véhicules disponibles | Available vehicles | Veicoli disponibili | Verfügbare Fahrzeuge |
| `voir_la_fiche` | Voir la fiche | View details | Vedi scheda | Details anzeigen |

## CONTACT

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `attachment` | Pièce jointe | Attachment | Allegato | Anhang |
| `attachmentHint` | Formats acceptés: PDF, JPG, PNG, DOC, DOCX (max 10MB) | Accepted formats: PDF, JPG, PNG, DOC, DOCX (max 10MB) | Formati accettati: PDF, JPG, PNG, DOC, DOCX (max 10MB) | Akzeptierte Formate: PDF, JPG, PNG, DOC, DOCX (max 10MB) |
| `email` | Adresse email | Email address | Indirizzo email | E-Mail-Adresse |
| `emailPlaceholder` | votre@email.com | your@email.com | tua@email.com | ihre@email.com |
| `error` | Erreur | Error | Errore | Fehler |
| `errorGeneric` | Erreur, réessayez. | Error, please try again. | Errore, riprova. | Fehler, bitte versuchen Sie es erneut. |
| `errorNetwork` | Impossible de contacter le serveur. Vérifiez votre connexion internet. | Unable to contact the server. Please check your internet connection. | ❌ `Impossible de contacter le serveur. Vérifiez votre connexion internet.` | ❌ `Impossible de contacter le serveur. Vérifiez votre connexion internet.` |
| `errorTimeout` | La requête a pris trop de temps. Veuillez réessayer. | The request took too long. Please try again. | ❌ `La requête a pris trop de temps. Veuillez réessayer.` | ❌ `La requête a pris trop de temps. Veuillez réessayer.` |
| `fileTooLarge` | Le fichier ne doit pas dépasser 10MB | File must not exceed 10MB | Il file non deve superare 10MB | Die Datei darf 10MB nicht überschreiten |
| `formDescription` | Tous les champs marqués d'un astérisque (*) sont obligatoires. | All fields marked with an asterisk (*) are required. | Tutti i campi contrassegnati con un asterisco (*) sono obbligatori. | Alle mit einem Sternchen (*) markierten Felder sind Pflichtfelder. |
| `formTitle` | Formulaire de contact | Contact form | Modulo di contatto | Kontaktformular |
| `fullName` | Nom Prénom | Full Name | Nome Cognome | Vor- und Nachname |
| `fullNamePlaceholder` | Votre nom complet | Your full name | Il tuo nome completo | Ihr vollständiger Name |
| `intro` | Vous préférez nous écrire ? Remplissez le formulaire ci-dessous. | Prefer to write to us? Fill out the form below. | Preferisci scriverci? Compila il modulo qui sotto. | Möchten Sie uns lieber schreiben? Füllen Sie das untenstehende Formular aus. |
| `message` | Message | Message | Messaggio | Nachricht |
| `messagePlaceholder` | Votre message... | Your message... | Il tuo messaggio... | Ihre Nachricht... |
| `optional` | optionnel | optional | opzionale | optional |
| `phone` | Numéro de téléphone | Phone number | Numero di telefono | Telefonnummer |
| `phonePlaceholder` | +33 6 12 34 56 78 | +33 6 12 34 56 78 | +33 6 12 34 56 78 | +33 6 12 34 56 78 |
| `send` | Envoyer | Send | Invia | Senden |
| `sending` | Envoi en cours... | Sending... | Invio in corso... | Wird gesendet... |
| `subject` | Objet | Subject | Oggetto | Betreff |
| `subjectPlaceholder` | Objet de votre message | Subject of your message | Oggetto del tuo messaggio | Betreff Ihrer Nachricht |
| `success` | Message envoyé ! | Message sent! | Messaggio inviato! | Nachricht gesendet! |
| `successDescription` | Votre message a été envoyé avec succès. Nous vous répondrons... | Your message has been sent successfully. We will reply as soon as possible. | Il tuo messaggio è stato inviato con successo. Ti rispondere... | Ihre Nachricht wurde erfolgreich gesendet. Wir werden Ihnen ... |
| `title` | Nous contacter | Contact us | Contattaci | Kontaktieren Sie uns |

## DEPOSITMODAL

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `amountLabel` | Montant de la caution : {{amount}} | Deposit amount: {{amount}} | Importo della cauzione: {{amount}} | Kaution: {{amount}} |
| `cancel` | Annuler | Cancel | Annulla | Abbrechen |
| `description` | Aucun débit immédiat.  Vous enregistrez simplement votre car... | No immediate charge.  You are simply registering your card t... | Nessun addebito immediato.  Registri semplicemente la tua ca... | Keine sofortige Belastung.  Sie registrieren einfach Ihre Ka... |
| `learnMore` | En savoir plus sur la caution et les sinistres | Learn more about deposit and damage | Scopri di più su cauzione e danni | Mehr über Kaution und Schäden erfahren |
| `loading` | Chargement du formulaire... | Loading form... | Caricamento modulo... | Formular wird geladen... |
| `submit` | Enregistrer ma carte | Register my card | Registra la mia carta | Meine Karte registrieren |
| `submitting` | Enregistrement... | Registering... | Registrazione... | Registrierung... |
| `title` | Activer la caution | Activate deposit | Attiva cauzione | Kaution aktivieren |

## DICTIONARY

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `back` | Retour au dictionnaire | Back to dictionary | Torna al dizionario | Zurück zum Wörterbuch |
| `definitionsTitle` | Définitions | Definitions | Definizioni | Definitionen |
| `derivationLabel` | Dérivation : | Derivation: | Derivazione: | Ableitung: |
| `etymologyTitle` | Étymologie | Etymology | Etimologia | Etymologie |
| `noResults` | Aucun résultat pour cette recherche. | No results for this search. | Nessun risultato per questa ricerca. | Keine Ergebnisse für diese Suche. |
| `originLabel` | Origine : | Origin: | Origine: | Herkunft: |
| `relatedWordsLabel` | Mots apparentés : | Related words: | Parole correlate: | Verwandte Wörter: |
| `searchPlaceholder` | Rechercher un mot... | Search for a word... | Cerca una parola... | Nach einem Wort suchen... |
| `sourcesTitle` | Sources | Sources | Fonti | Quellen |
| `title` | Dictionnaire | Dictionary | Dizionario | Wörterbuch |

## EXPLORERFILTERS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `categories.accommodation` | Hébergements | Accommodation | ❌ `Hébergements` | ❌ `Hébergements` |
| `categories.car` | Voitures | Cars | ❌ `Voitures` | ❌ `Voitures` |
| `categories.moto` | Motos | Motorcycles | ❌ `Motos` | ❌ `Motos` |
| `categories.quad` | Quads / Buggys | Quads / Buggys | Quad / Buggy | Quads / Buggys |
| `categories.scooter` | Scooters | Scooters | ❌ `Scooters` | ❌ `Scooters` |
| `comingSoon` | Bientôt disponible | Coming soon | ❌ `Bientôt disponible` | ❌ `Bientôt disponible` |
| `empty.accommodation.appartement.description` | Nous enrichissons actuellement notre catalogue d'appartements. | We are currently expanding our apartment catalogue. | ❌ `Nous enrichissons actuellement notre catalogue d'appartements.` | ❌ `Nous enrichissons actuellement notre catalogue d'appartements.` |
| `empty.accommodation.appartement.title` | Appartements bientôt disponibles | Apartments coming soon | ❌ `Appartements bientôt disponibles` | ❌ `Appartements bientôt disponibles` |
| `empty.accommodation.bungalow.description` | Revenez bientôt pour découvrir nos nouveaux hébergements. | Come back soon to discover our new accommodations. | ❌ `Revenez bientôt pour découvrir nos nouveaux hébergements.` | ❌ `Revenez bientôt pour découvrir nos nouveaux hébergements.` |
| `empty.accommodation.bungalow.title` | Bungalows bientôt disponibles | Bungalows coming soon | ❌ `Bungalows bientôt disponibles` | ❌ `Bungalows bientôt disponibles` |
| `empty.accommodation.chambre.description` | Nous enrichissons actuellement notre catalogue de chambres. | We are currently expanding our room catalogue. | ❌ `Nous enrichissons actuellement notre catalogue de chambres.` | ❌ `Nous enrichissons actuellement notre catalogue de chambres.` |
| `empty.accommodation.chambre.title` | Chambres bientôt disponibles | Rooms coming soon | ❌ `Chambres bientôt disponibles` | ❌ `Chambres bientôt disponibles` |
| `empty.accommodation.description` | Nous enrichissons actuellement notre catalogue d'hébergements à Nosy Be. | We are currently expanding our accommodation catalogue in Nosy Be. | ❌ `Nous enrichissons actuellement notre catalogue d'hébergements à Nosy Be.` | ❌ `Nous enrichissons actuellement notre catalogue d'hébergements à Nosy Be.` |
| `empty.accommodation.maison.description` | Nous enrichissons actuellement notre catalogue de maisons. | We are currently expanding our house catalogue. | ❌ `Nous enrichissons actuellement notre catalogue de maisons.` | ❌ `Nous enrichissons actuellement notre catalogue de maisons.` |
| `empty.accommodation.maison.title` | Maisons bientôt disponibles | Houses coming soon | ❌ `Maisons bientôt disponibles` | ❌ `Maisons bientôt disponibles` |
| `empty.accommodation.title` | Hébergements bientôt enrichis | More accommodation coming soon | ❌ `Hébergements bientôt enrichis` | ❌ `Hébergements bientôt enrichis` |
| `empty.accommodation.villa.description` | Nous enrichissons actuellement notre catalogue d'hébergements. | We are currently expanding our accommodation catalogue. | ❌ `Nous enrichissons actuellement notre catalogue d'hébergements.` | ❌ `Nous enrichissons actuellement notre catalogue d'hébergements.` |
| `empty.accommodation.villa.title` | Villas bientôt disponibles | Villas coming soon | ❌ `Villas bientôt disponibles` | ❌ `Villas bientôt disponibles` |
| `empty.car.description` | Nous préparons actuellement notre offre de véhicules. Revene... | We are preparing our vehicle offer. Check back soon or conta... | ❌ `Nous préparons actuellement notre offre de véhicules. Revene...` | ❌ `Nous préparons actuellement notre offre de véhicules. Revene...` |
| `empty.car.title` | Voitures bientôt disponibles | Cars coming soon | ❌ `Voitures bientôt disponibles` | ❌ `Voitures bientôt disponibles` |
| `empty.cta.request` | Faire une demande | Send a request | ❌ `Faire une demande` | ❌ `Faire une demande` |
| `empty.moto.description` | Cette catégorie sera disponible prochainement sur Rentanoo. | This category will be available soon on Rentanoo. | ❌ `Cette catégorie sera disponible prochainement sur Rentanoo.` | ❌ `Cette catégorie sera disponible prochainement sur Rentanoo.` |
| `empty.moto.title` | Motos bientôt disponibles | Motorcycles coming soon | ❌ `Motos bientôt disponibles` | ❌ `Motos bientôt disponibles` |
| `empty.quad.description` | Explorez Nosy Be autrement — louez un quad ou buggy avec Rentanoo. | Explore Nosy Be differently — rent a quad or buggy with Rentanoo. | Scopri Nosy Be in modo diverso — noleggia un quad o buggy con Rentanoo. | Entdecken Sie Nosy Be auf andere Weise – mieten Sie ein Quad... |
| `empty.quad.title` | Quads & Buggys disponibles | Quads & Buggys available | Quad & Buggy disponibili | Quads & Buggys verfügbar |
| `empty.scooter.50cc.description` | Nous préparons des scooters 50cc pour Nosy Be. Revenez prochainement. | We are preparing 50cc scooters for Nosy Be. Check back soon. | ❌ `Nous préparons des scooters 50cc pour Nosy Be. Revenez prochainement.` | ❌ `Nous préparons des scooters 50cc pour Nosy Be. Revenez prochainement.` |
| `empty.scooter.50cc.title` | Scooters 50cc bientôt disponibles | 50cc scooters coming soon | ❌ `Scooters 50cc bientôt disponibles` | ❌ `Scooters 50cc bientôt disponibles` |
| `empty.scooter.description` | Cette sélection sera disponible prochainement sur Rentanoo. | This selection will be available soon on Rentanoo. | ❌ `Cette sélection sera disponible prochainement sur Rentanoo.` | ❌ `Cette sélection sera disponible prochainement sur Rentanoo.` |
| `empty.scooter.title` | Scooters bientôt disponibles | Scooters coming soon | ❌ `Scooters bientôt disponibles` | ❌ `Scooters bientôt disponibles` |
| `empty.waPrefill.accommodation.appartement` | Bonjour Rentanoo,  Je recherche un appartement à Nosy Be. Me... | Hello Rentanoo,  I am looking for an apartment in Nosy Be. P... | ❌ `Bonjour Rentanoo,  Je recherche un appartement à Nosy Be. Me...` | ❌ `Bonjour Rentanoo,  Je recherche un appartement à Nosy Be. Me...` |
| `empty.waPrefill.accommodation.bungalow` | Bonjour Rentanoo,  Je recherche un bungalow à Nosy Be. Reven... | Hello Rentanoo,  I am looking for a bungalow in Nosy Be. Ple... | ❌ `Bonjour Rentanoo,  Je recherche un bungalow à Nosy Be. Reven...` | ❌ `Bonjour Rentanoo,  Je recherche un bungalow à Nosy Be. Reven...` |
| `empty.waPrefill.accommodation.chambre` | Bonjour Rentanoo,  Je recherche une chambre à Nosy Be. Merci... | Hello Rentanoo,  I am looking for a room in Nosy Be. Please ... | ❌ `Bonjour Rentanoo,  Je recherche une chambre à Nosy Be. Merci...` | ❌ `Bonjour Rentanoo,  Je recherche une chambre à Nosy Be. Merci...` |
| `empty.waPrefill.accommodation.generic` | Bonjour Rentanoo,  Je recherche un hébergement à Nosy Be. Me... | Hello Rentanoo,  I am looking for accommodation in Nosy Be. ... | ❌ `Bonjour Rentanoo,  Je recherche un hébergement à Nosy Be. Me...` | ❌ `Bonjour Rentanoo,  Je recherche un hébergement à Nosy Be. Me...` |
| `empty.waPrefill.accommodation.maison` | Bonjour Rentanoo,  Je recherche une maison à Nosy Be. Merci ... | Hello Rentanoo,  I am looking for a house in Nosy Be. Please... | ❌ `Bonjour Rentanoo,  Je recherche une maison à Nosy Be. Merci ...` | ❌ `Bonjour Rentanoo,  Je recherche une maison à Nosy Be. Merci ...` |
| `empty.waPrefill.accommodation.villa` | Bonjour Rentanoo,  Je recherche une villa à Nosy Be. Merci d... | Hello Rentanoo,  I am looking for a villa in Nosy Be. Please... | ❌ `Bonjour Rentanoo,  Je recherche une villa à Nosy Be. Merci d...` | ❌ `Bonjour Rentanoo,  Je recherche une villa à Nosy Be. Merci d...` |
| `empty.waPrefill.car` | Bonjour Rentanoo,  Je souhaite louer une voiture à Nosy Be. ... | Hello Rentanoo,  I would like to rent a car in Nosy Be. Plea... | ❌ `Bonjour Rentanoo,  Je souhaite louer une voiture à Nosy Be. ...` | ❌ `Bonjour Rentanoo,  Je souhaite louer une voiture à Nosy Be. ...` |
| `empty.waPrefill.moto` | Bonjour Rentanoo,  Je souhaite louer une moto à Nosy Be. Pou... | Hello Rentanoo,  I would like to rent a motorcycle in Nosy B... | ❌ `Bonjour Rentanoo,  Je souhaite louer une moto à Nosy Be. Pou...` | ❌ `Bonjour Rentanoo,  Je souhaite louer une moto à Nosy Be. Pou...` |
| `empty.waPrefill.quad` | Bonjour Rentanoo,  Je souhaite louer un quad ou buggy à Nosy... | Hello Rentanoo,  I would like to rent a quad or buggy in Nos... | Ciao Rentanoo,  Vorrei noleggiare un quad o buggy a Nosy Be.... | Hallo Rentanoo,  Ich möchte ein Quad oder Buggy in Nosy Be m... |
| `empty.waPrefill.scooter` | Bonjour Rentanoo,  Je souhaite louer un scooter à Nosy Be. P... | Hello Rentanoo,  I would like to rent a scooter in Nosy Be. ... | ❌ `Bonjour Rentanoo,  Je souhaite louer un scooter à Nosy Be. P...` | ❌ `Bonjour Rentanoo,  Je souhaite louer un scooter à Nosy Be. P...` |
| `listingsCount` | {{count}} annonces | {{count}} listings | ❌ `{{count}} annonces` | ❌ `{{count}} annonces` |
| `listingsCount_one` | {{count}} annonce | {{count}} listing | ❌ `{{count}} annonce` | ❌ `{{count}} annonce` |
| `mainCategoryAria` | {{label}}, {{count}} annonces disponibles, filtrer | {{label}}, {{count}} listings available, filter | ❌ `{{label}}, {{count}} annonces disponibles, filtrer` | ❌ `{{label}}, {{count}} annonces disponibles, filtrer` |
| `moreFilters` | Plus de filtres | More filters | ❌ `Plus de filtres` | ❌ `Plus de filtres` |
| `reset` | Réinitialiser | Reset | ❌ `Réinitialiser` | ❌ `Réinitialiser` |
| `sub.accommodation.appartement` | Appartement | Apartment | ❌ `Appartement` | ❌ `Appartement` |
| `sub.accommodation.bungalow` | Bungalow | Bungalow | ❌ `Bungalow` | ❌ `Bungalow` |
| `sub.accommodation.chambre` | Chambre | Room | ❌ `Chambre` | ❌ `Chambre` |
| `sub.accommodation.maison` | Maison | House | ❌ `Maison` | ❌ `Maison` |
| `sub.accommodation.villa` | Villa | Villa | ❌ `Villa` | ❌ `Villa` |
| `sub.car.4x4` | 4x4 | 4x4 | ❌ `4x4` | ❌ `4x4` |
| `sub.car.citadine` | Citadine | City car | ❌ `Citadine` | ❌ `Citadine` |
| `sub.car.luxe` | Luxe | Luxury | ❌ `Luxe` | ❌ `Luxe` |
| `sub.car.suv` | SUV | SUV | ❌ `SUV` | ❌ `SUV` |
| `sub.car.van` | Van | Van | ❌ `Van` | ❌ `Van` |
| `sub.engine.125cc` | 125cc | 125cc | ❌ `125cc` | ❌ `125cc` |
| `sub.engine.150cc` | 150cc | 150cc | ❌ `150cc` | ❌ `150cc` |
| `sub.engine.200cc` | 200cc | 200cc | ❌ `200cc` | ❌ `200cc` |
| `sub.engine.200plus` | 200cc+ | 200cc+ | ❌ `200cc+` | ❌ `200cc+` |
| `sub.engine.250plus` | 250cc+ | 250cc+ | ❌ `250cc+` | ❌ `250cc+` |
| `sub.engine.300cc` | 300cc | 300cc | ❌ `300cc` | ❌ `300cc` |
| `sub.engine.50cc` | 50cc | 50cc | ❌ `50cc` | ❌ `50cc` |
| `sub.quad.300cc` | 300cc | 300cc | 300cc | 300cc |
| `sub.quad.buggy` | Buggy | Buggy | Buggy | Buggy |
| `subFilterAria` | {{label}}, {{count}} annonces disponibles, filtrer | {{label}}, {{count}} listings available, filter | ❌ `{{label}}, {{count}} annonces disponibles, filtrer` | ❌ `{{label}}, {{count}} annonces disponibles, filtrer` |
| `viewResults` | Voir les résultats | View results | ❌ `Voir les résultats` | ❌ `Voir les résultats` |

## FOOTER

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `brand` | RENTANOO | RENTANOO | ❌ `RENTANOO` | ❌ `RENTANOO` |
| `copyright` | © 2025 RENTANOO. Tous droits réservés. | © 2025 RENTANOO. All rights reserved. | ❌ `© 2025 RENTANOO. Tous droits réservés.` | ❌ `© 2025 RENTANOO. Tous droits réservés.` |
| `description` | Plateforme de location à Nosy Be : scooter, moto, voiture et... | Rental platform in Nosy Be: scooter, motorcycle, car and acc... | Piattaforma di noleggio a Nosy Be: scooter, moto, auto e all... | Mietplattform in Nosy Be: Roller, Motorrad, Auto und Unterku... |
| `location` | Nosy Be, Madagascar | Nosy Be, Madagascar | ❌ `Nosy Be, Madagascar` | ❌ `Nosy Be, Madagascar` |
| `madeWith` | Made with ❤️ in Nosy Be | Made with ❤️ in Nosy Be | ❌ `Made with ❤️ in Nosy Be` | ❌ `Made with ❤️ in Nosy Be` |
| `nav.accommodation` | Hébergements | Accommodations | Alloggi | Unterkünfte |
| `nav.cars` | Voitures | Cars | Auto | Autos |
| `nav.scooters` | Scooters & motos | Scooters & motorcycles | Scooter & moto | Roller & Motorräder |

## HOME

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `catalogCta` | Voir les {{count}} véhicules disponibles | View {{count}} available vehicles | Vedi {{count}} veicoli disponibili | {{count}} verfügbare Fahrzeuge ansehen |
| `catalogCtaAria` | Faire défiler jusqu'au catalogue de véhicules | Scroll to the vehicle catalog | Scorri fino al catalogo veicoli | Zum Fahrzeugkatalog scrollen |
| `catalogCtaLoading` | Voir les véhicules disponibles | View available vehicles | Vedi i veicoli disponibili | Verfügbare Fahrzeuge ansehen |
| `catalogCta_one` | Voir le véhicule disponible | View the available vehicle | Vedi il veicolo disponibile | Verfügbares Fahrzeug ansehen |
| `dayContext.ariaLabel` | Météo et taux de change du jour à Nosy Be | Today's weather and exchange rate in Nosy Be | Meteo e tasso di cambio di oggi a Nosy Be | Wetter und Wechselkurs heute in Nosy Be |
| `dayContext.exchangeLabel` | Taux | Rate | Cambio | Kurs |
| `dayContext.exchangeLinkLabel` | Voir le taux de change Euro Ariary Madagascar | View Euro to Ariary exchange rate in Madagascar | Vedi tasso di cambio Euro Ariary Madagascar | Euro-Ariary-Wechselkurs Madagaskar ansehen |
| `dayContext.exchangeLive` | 1 € = {{rate}} Ar (taux du jour) | 1 € = {{rate}} Ar (today's rate) | 1 € = {{rate}} Ar (tasso del giorno) | 1 € = {{rate}} Ar (Tageskurs) |
| `dayContext.exchangeLiveHint` | Taux du jour | Today's rate | Tasso del giorno | Tageskurs |
| `dayContext.exchangeManual` | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar |
| `dayContext.exchangeShort` | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar | 1 € = {{rate}} Ar |
| `dayContext.flightsLabel` | Vols | Flights | Voli | Flüge |
| `dayContext.flightsLinkLabel` | Voir les horaires de vols à l'aéroport de Nosy Be | View flight schedules at Nosy Be airport | Vedi orari voli aeroporto Nosy Be | Flugzeiten Flughafen Nosy Be ansehen |
| `dayContext.flightsToday` | Prochains vols aujourd'hui | Next flights today | Prossimi voli oggi | Nächste Flüge heute |
| `dayContext.flightsTomorrow` | Prochains vols demain | Next flights tomorrow | Prossimi voli domani | Nächste Flüge morgen |
| `dayContext.loading` | Chargement en cours | Loading | Caricamento | Wird geladen |
| `dayContext.pricesHint` | Tarifs de référence en ariary — équivalent € selon le taux du jour | Reference prices in ariary — € equivalent at today's rate | Prezzi di riferimento in ariary — equivalente € al tasso del giorno | Referenzpreise in Ariary — €-Äquivalent zum Tageskurs |
| `dayContext.rateTrend.down` | Taux en baisse par rapport à hier | Rate down compared to yesterday | Tasso in calo rispetto a ieri | Kurs gefallen gegenüber gestern |
| `dayContext.rateTrend.stable` | Taux stable par rapport à hier | Rate stable compared to yesterday | Tasso stabile rispetto a ieri | Kurs unverändert gegenüber gestern |
| `dayContext.rateTrend.up` | Taux en hausse par rapport à hier | Rate up compared to yesterday | Tasso in aumento rispetto a ieri | Kurs gestiegen gegenüber gestern |
| `dayContext.rateTrendShort.down` | En baisse vs hier | Down vs yesterday | In calo vs ieri | Gefallen vs gestern |
| `dayContext.rateTrendShort.stable` | Stable vs hier | Stable vs yesterday | Stabile vs ieri | Stabil vs gestern |
| `dayContext.rateTrendShort.up` | En hausse vs hier | Up vs yesterday | In aumento vs ieri | Gestiegen vs gestern |
| `dayContext.timeLabel` | Heure locale | Local time | Ora locale | Ortszeit |
| `dayContext.timeSub` | Madagascar · UTC+3 | Madagascar · UTC+3 | Madagascar · UTC+3 | Madagaskar · UTC+3 |
| `dayContext.title` | Nosy Be aujourd'hui | Nosy Be today | Nosy Be oggi | Nosy Be heute |
| `dayContext.weather.clear` | Ensoleillé | Sunny | Soleggiato | Sonnig |
| `dayContext.weather.cloudy` | Nuageux | Cloudy | Nuvoloso | Bewölkt |
| `dayContext.weather.drizzle` | Bruine légère | Light drizzle | Pioggerella leggera | Leichter Nieselregen |
| `dayContext.weather.fog` | Brume | Foggy | Nebbia | Nebel |
| `dayContext.weather.rain` | Pluie | Rain | Pioggia | Regen |
| `dayContext.weather.snow` | Neige | Snow | Neve | Schnee |
| `dayContext.weather.storm` | Orages | Storms | Temporali | Gewitter |
| `dayContext.weatherLabel` | Météo | Weather | Meteo | Wetter |
| `dayContext.weatherLinkLabel` | Voir la météo détaillée à Nosy Be | View detailed weather in Nosy Be | Vedi meteo dettagliata a Nosy Be | Detaillierte Wettervorhersage Nosy Be ansehen |
| `dayContext.weatherUnavailable` | Météo indisponible | Weather unavailable | Meteo non disponibile | Wetter nicht verfügbar |
| `heroSubtitle` | RENTANOO, la plateforme de location 100 % en ligne — deux-ro... | RENTANOO, the 100% online rental platform — two-wheelers, ca... | RENTANOO — la piattaforma di prenotazione 100% online per du... | RENTANOO — die 100 % online Buchungsplattform für Zweiräder ... |
| `heroTitle` | Louez scooter, moto, voiture ou hébergement à Nosy Be | Rent scooter, motorbike, car or accommodation in Nosy Be | Noleggio scooter, moto, auto & alloggio a Nosy Be \| Rentanoo | Roller, Motorrad, Auto & Unterkunft in Nosy Be mieten \| Rentanoo |
| `seoBlock` | Rentanoo vous aide à réserver votre séjour à Nosy Be en quel... | Rentanoo helps you book your stay in Nosy Be in just a few c... | Rentanoo ti aiuta a prenotare un noleggio scooter a Nosy Be ... | Rentanoo hilft Ihnen, eine Rollervermietung in Nosy Be in we... |
| `seoBlockTitle` | Location scooter, moto et hébergement à Nosy Be | Scooter, motorbike and accommodation rental in Nosy Be | Noleggio scooter a Nosy Be: semplice, veloce, sicuro | Rollervermietung in Nosy Be: einfach, schnell, sicher |
| `toasts.criteriaReset.description` | Tous vos critères de recherche ont été effacés. | All your search criteria have been cleared. | Tutti i criteri di ricerca sono stati cancellati. | Alle Suchkriterien wurden gelöscht. |
| `toasts.criteriaReset.title` | Critères réinitialisés | Criteria reset | Criteri reimpostati | Kriterien zurückgesetzt |
| `toasts.errorSearch.description` | Impossible d'effectuer la recherche | Unable to run the search | Impossibile eseguire la ricerca | Die Suche konnte nicht ausgeführt werden |
| `toasts.errorSearch.title` | Erreur | Error | Errore | Fehler |
| `toasts.errorSearchAuto.description` | Impossible d'effectuer la recherche automatique | Unable to run the automatic search | Impossibile eseguire la ricerca automatica | Die automatische Suche konnte nicht ausgeführt werden |
| `toasts.errorSearchAuto.title` | Erreur | Error | Errore | Fehler |
| `toasts.incompleteDates.description` | Veuillez sélectionner une date de début ET une date de fin | Please select both a start date and an end date | Seleziona sia una data di inizio che una data di fine | Bitte wähle sowohl ein Start- als auch ein Enddatum |
| `toasts.incompleteDates.title` | Dates incomplètes | Incomplete dates | Date incomplete | Unvollständige Daten |
| `toasts.invalidDates.description` | La date de début doit être antérieure à la date de fin | Start date must be before end date | La data di inizio deve essere precedente alla data di fine | Das Startdatum muss vor dem Enddatum liegen |
| `toasts.invalidDates.title` | Dates invalides | Invalid dates | Date non valide | Ungültige Daten |
| `toasts.noResults.description` | Aucun véhicule disponible pour ces critères | No vehicles available for these criteria | Nessun veicolo disponibile per questi criteri | Für diese Kriterien sind keine Fahrzeuge verfügbar |
| `toasts.noResults.title` | Aucun résultat | No results | Nessun risultato | Keine Ergebnisse |
| `toasts.requiredFields.description` | Veuillez renseigner au moins un critère de recherche | Please provide at least one search criteria | Inserisci almeno un criterio di ricerca | Bitte gib mindestens ein Suchkriterium an |
| `toasts.requiredFields.title` | Champs requis | Required fields | Campi obbligatori | Pflichtfelder |
| `toasts.resultsFound_one` | {{count}} véhicule trouvé | {{count}} vehicle found | {{count}} veicolo trovato | {{count}} Fahrzeug gefunden |
| `toasts.resultsFound_other` | {{count}} véhicules trouvés | {{count}} vehicles found | {{count}} veicoli trovati | {{count}} Fahrzeuge gefunden |
| `toasts.searchDone.title` | Recherche effectuée | Search completed | Ricerca completata | Suche abgeschlossen |
| `toasts.searchRestored.description` | Vos critères de recherche ont été rechargés et la recherche relancée. | Your saved search criteria have been restored and the search was re-run. | I criteri salvati sono stati ripristinati e la ricerca è stata rieseguita. | Deine gespeicherten Suchkriterien wurden wiederhergestellt u... |
| `toasts.searchRestored.title` | Recherche restaurée | Search restored | Ricerca ripristinata | Suche wiederhergestellt |
| `trustStrip.accommodationAvailable` | Hébergements disponibles | Accommodations available | Alloggi disponibili | Unterkünfte verfügbar |
| `trustStrip.airportDelivery` | Livraison aéroport | Airport delivery | Consegna aeroporto | Flughafen-Lieferung |
| `trustStrip.ariaLabel` | Points forts Rentanoo | Rentanoo highlights | Punti di forza Rentanoo | Rentanoo Vorteile |
| `trustStrip.fromPrice` | Dès {{price}}/jour | From {{price}}/day | Da {{price}}/giorno | Ab {{price}}/Tag |
| `trustStrip.helmetIncluded` | Casque inclus | Helmet included | Casco incluso | Helm inklusive |
| `trustStrip.insuranceIncluded` | Assurance incluse | Insurance included | Assicurazione inclusa | Versicherung inklusive |
| `trustStrip.secureBooking` | Réservation sécurisée | Secure booking | Prenotazione sicura | Sichere Buchung |
| `trustStrip.vehicleCount` | {{count}} véhicules disponibles | {{count}} vehicles available | {{count}} veicoli disponibili | {{count}} Fahrzeuge verfügbar |
| `trustStrip.vehicleCount_one` | 1 véhicule disponible | 1 vehicle available | 1 veicolo disponibile | 1 Fahrzeug verfügbar |

## HOMEFILTERS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `area.all` | Tous les quartiers | All neighborhoods | ❌ `Tous les quartiers` | ❌ `Tous les quartiers` |

## HOMERESULTS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `countAccommodation` | {{count}} hébergement(s) | {{count}} accommodation(s) | ❌ `{{count}} hébergement(s)` | ❌ `{{count}} hébergement(s)` |
| `countAll` | {{count}} annonce(s) | {{count}} listing(s) | ❌ `{{count}} annonce(s)` | ❌ `{{count}} annonce(s)` |
| `countCar` | {{count}} voiture(s) | {{count}} car(s) | ❌ `{{count}} voiture(s)` | ❌ `{{count}} voiture(s)` |
| `countMoto` | {{count}} moto(s) | {{count}} motorcycle(s) | ❌ `{{count}} moto(s)` | ❌ `{{count}} moto(s)` |
| `countQuad` | {{count}} quad(s) | {{count}} quad(s) | {{count}} quad | {{count}} Quad(s) |
| `countScooter` | {{count}} scooter(s) | {{count}} scooter(s) | ❌ `{{count}} scooter(s)` | ❌ `{{count}} scooter(s)` |
| `emptyAccommodation` | Aucun hébergement disponible pour le moment. | No accommodation available at the moment. | ❌ `Aucun hébergement disponible pour le moment.` | ❌ `Aucun hébergement disponible pour le moment.` |
| `emptyAll` | Aucune annonce disponible pour le moment. | No listings available at the moment. | ❌ `Aucune annonce disponible pour le moment.` | ❌ `Aucune annonce disponible pour le moment.` |
| `noMatchAccommodation` | Aucun hébergement ne correspond à vos filtres. | No accommodation matches your filters. | ❌ `Aucun hébergement ne correspond à vos filtres.` | ❌ `Aucun hébergement ne correspond à vos filtres.` |
| `noMatchAll` | Aucune annonce ne correspond à vos filtres. | No listings match your filters. | ❌ `Aucune annonce ne correspond à vos filtres.` | ❌ `Aucune annonce ne correspond à vos filtres.` |
| `noMatchCar` | Aucune voiture ne correspond à vos filtres. | No car matches your filters. | ❌ `Aucune voiture ne correspond à vos filtres.` | ❌ `Aucune voiture ne correspond à vos filtres.` |
| `noMatchMoto` | Aucune moto ne correspond à vos filtres. | No motorcycle matches your filters. | ❌ `Aucune moto ne correspond à vos filtres.` | ❌ `Aucune moto ne correspond à vos filtres.` |
| `noMatchQuad` | Aucun quad ne correspond à vos filtres. | No quad matches your filters. | Nessun quad corrisponde ai tuoi filtri. | Kein Quad entspricht Ihren Filtern. |
| `noMatchScooter` | Aucun scooter ne correspond à vos filtres. | No scooter matches your filters. | ❌ `Aucun scooter ne correspond à vos filtres.` | ❌ `Aucun scooter ne correspond à vos filtres.` |
| `titleAccommodation` | Hébergements disponibles | Available accommodation | ❌ `Hébergements disponibles` | ❌ `Hébergements disponibles` |
| `titleAll` | Toutes les locations disponibles | All available rentals | ❌ `Toutes les locations disponibles` | ❌ `Toutes les locations disponibles` |
| `titleCar` | Voitures disponibles | Available cars | ❌ `Voitures disponibles` | ❌ `Voitures disponibles` |
| `titleMoto` | Motos disponibles | Available motorcycles | ❌ `Motos disponibles` | ❌ `Motos disponibles` |
| `titleQuad` | Quads & Buggys disponibles | Available quads & buggys | Quad & Buggy disponibili | Verfügbare Quads & Buggys |
| `titleScooter` | Scooters disponibles | Available scooters | ❌ `Scooters disponibles` | ❌ `Scooters disponibles` |

## LISTINGOWNER

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `chooseFile` | Choisir un fichier | Choose a file | ❌ `Choisir un fichier` | ❌ `Choisir un fichier` |
| `displayName` | Nom affiché | Display name | ❌ `Nom affiché` | ❌ `Nom affiché` |
| `displayNamePlaceholder` | Ex. Résidence Ambatoloaka, Jean Dupont… | E.g. Ambatoloaka Residence, John Doe… | ❌ `Ex. Résidence Ambatoloaka, Jean Dupont…` | ❌ `Ex. Résidence Ambatoloaka, Jean Dupont…` |
| `intro` | Identité affichée publiquement sur la fiche. Laissez vide po... | Public identity shown on the listing. Leave blank to use the... | ❌ `Identité affichée publiquement sur la fiche. Laissez vide po...` | ❌ `Identité affichée publiquement sur la fiche. Laissez vide po...` |
| `ownerType` | Type de propriétaire | Owner type | ❌ `Type de propriétaire` | ❌ `Type de propriétaire` |
| `photo` | Logo ou photo du propriétaire | Owner photo or logo | ❌ `Logo ou photo du propriétaire` | ❌ `Logo ou photo du propriétaire` |
| `photoHelper` | Formats acceptés : JPG, PNG, WebP. Taille max : 5 Mo | Accepted formats: JPG, PNG, WebP. Max size: 5 MB | ❌ `Formats acceptés : JPG, PNG, WebP. Taille max : 5 Mo` | ❌ `Formats acceptés : JPG, PNG, WebP. Taille max : 5 Mo` |
| `previewHint` | Aperçu du propriétaire affiché | Displayed owner preview | ❌ `Aperçu du propriétaire affiché` | ❌ `Aperçu du propriétaire affiché` |
| `removePhoto` | Supprimer | Remove | ❌ `Supprimer` | ❌ `Supprimer` |
| `stats.listings` | Annonces | Listings | ❌ `Annonces` | ❌ `Annonces` |
| `stats.thisListing` | Cette annonce | This listing | ❌ `Cette annonce` | ❌ `Cette annonce` |
| `tab` | Propriétaire | Owner | ❌ `Propriétaire` | ❌ `Propriétaire` |
| `tabShort` | Proprio | Owner | ❌ `Proprio` | ❌ `Proprio` |
| `toasts.nameRequired` | Renseignez d'abord le nom affiché avant d'ajouter une photo. | Enter a display name before adding a photo. | ❌ `Renseignez d'abord le nom affiché avant d'ajouter une photo.` | ❌ `Renseignez d'abord le nom affiché avant d'ajouter une photo.` |
| `toasts.removeSuccess` | Photo du propriétaire supprimée. | Owner photo removed. | ❌ `Photo du propriétaire supprimée.` | ❌ `Photo du propriétaire supprimée.` |
| `toasts.uploadError` | Impossible d'uploader la photo du propriétaire. | Could not upload the owner photo. | ❌ `Impossible d'uploader la photo du propriétaire.` | ❌ `Impossible d'uploader la photo du propriétaire.` |
| `toasts.uploadSuccess` | Photo du propriétaire enregistrée. | Owner photo saved. | ❌ `Photo du propriétaire enregistrée.` | ❌ `Photo du propriétaire enregistrée.` |
| `types.agency` | Agence | Agency | ❌ `Agence` | ❌ `Agence` |
| `types.individual` | Particulier | Individual | ❌ `Particulier` | ❌ `Particulier` |
| `types.platformManaged` | Géré par la plateforme | Platform managed | ❌ `Géré par la plateforme` | ❌ `Géré par la plateforme` |
| `types.residence` | Résidence / hébergement | Residence / accommodation | ❌ `Résidence / hébergement` | ❌ `Résidence / hébergement` |
| `uploading` | Upload en cours… | Uploading… | ❌ `Upload en cours…` | ❌ `Upload en cours…` |

## LISTINGTERMS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `accommodation.endDateLabel` | Départ | Check-out | ❌ `Départ` | ❌ `Départ` |
| `accommodation.perNight` | par nuit | per night | ❌ `par nuit` | ❌ `par nuit` |
| `accommodation.pickupLocation` | Lieu d'arrivée | Check-in location | ❌ `Lieu d'arrivée` | ❌ `Lieu d'arrivée` |
| `accommodation.rentalLabel` | Location hébergement | Accommodation rental | ❌ `Location hébergement` | ❌ `Location hébergement` |
| `accommodation.returnLocation` | Lieu de départ | Check-out location | ❌ `Lieu de départ` | ❌ `Lieu de départ` |
| `accommodation.reviews.sample1.meta` | Il y a 2 semaines • 3 jours de séjour | 2 weeks ago • 3-night stay | ❌ `Il y a 2 semaines • 3 jours de séjour` | ❌ `Il y a 2 semaines • 3 jours de séjour` |
| `accommodation.reviews.sample1.text` | Hébergement impeccable, très propre et bien situé. L'hôte es... | Impeccable accommodation, very clean and well located. The h... | ❌ `Hébergement impeccable, très propre et bien situé. L'hôte es...` | ❌ `Hébergement impeccable, très propre et bien situé. L'hôte es...` |
| `accommodation.reviews.sample2.meta` | Il y a 1 mois • 5 jours de séjour | 1 month ago • 5-night stay | ❌ `Il y a 1 mois • 5 jours de séjour` | ❌ `Il y a 1 mois • 5 jours de séjour` |
| `accommodation.reviews.sample2.text` | Excellent logement pour découvrir Nosy Be. Confortable et ca... | Excellent place to discover Nosy Be. Comfortable and quiet. ... | ❌ `Excellent logement pour découvrir Nosy Be. Confortable et ca...` | ❌ `Excellent logement pour découvrir Nosy Be. Confortable et ca...` |
| `accommodation.startDateLabel` | Arrivée | Check-in | ❌ `Arrivée` | ❌ `Arrivée` |
| `accommodation.statsThis` | Cet hébergement | This accommodation | ❌ `Cet hébergement` | ❌ `Cet hébergement` |
| `accommodation.statsVehicles` | Hébergements | Accommodations | ❌ `Hébergements` | ❌ `Hébergements` |
| `car.endDateLabel` | Retour | Return | ❌ `Retour` | ❌ `Retour` |
| `car.perNight` | par jour | per day | ❌ `par jour` | ❌ `par jour` |
| `car.pickupLocation` | Lieu de prise en charge | Pickup location | ❌ `Lieu de prise en charge` | ❌ `Lieu de prise en charge` |
| `car.rentalLabel` | Location véhicule | Vehicle rental | ❌ `Location véhicule` | ❌ `Location véhicule` |
| `car.returnLocation` | Lieu de restitution | Return location | ❌ `Lieu de restitution` | ❌ `Lieu de restitution` |
| `car.reviews.sample1.meta` | Il y a 2 semaines • 3 jours de location | 2 weeks ago • 3-day rental | ❌ `Il y a 2 semaines • 3 jours de location` | ❌ `Il y a 2 semaines • 3 jours de location` |
| `car.reviews.sample1.text` | Véhicule en parfait état, très propre. Pierre est un hôte at... | Vehicle in perfect condition, very clean. Pierre is a though... | ❌ `Véhicule en parfait état, très propre. Pierre est un hôte at...` | ❌ `Véhicule en parfait état, très propre. Pierre est un hôte at...` |
| `car.reviews.sample2.meta` | Il y a 1 mois • 5 jours de location | 1 month ago • 5-day rental | ❌ `Il y a 1 mois • 5 jours de location` | ❌ `Il y a 1 mois • 5 jours de location` |
| `car.reviews.sample2.text` | Excellent véhicule pour découvrir l'île. Économique et fiabl... | Excellent vehicle to explore the island. Economical and reli... | ❌ `Excellent véhicule pour découvrir l'île. Économique et fiabl...` | ❌ `Excellent véhicule pour découvrir l'île. Économique et fiabl...` |
| `car.startDateLabel` | Départ | Pick-up | ❌ `Départ` | ❌ `Départ` |
| `car.statsThis` | Cette voiture | This car | ❌ `Cette voiture` | ❌ `Cette voiture` |
| `car.statsVehicles` | Véhicules | Vehicles | ❌ `Véhicules` | ❌ `Véhicules` |
| `moto.endDateLabel` | Retour | Return | ❌ `Retour` | ❌ `Retour` |
| `moto.perNight` | par jour | per day | ❌ `par jour` | ❌ `par jour` |
| `moto.pickupLocation` | Lieu de prise en charge | Pickup location | ❌ `Lieu de prise en charge` | ❌ `Lieu de prise en charge` |
| `moto.rentalLabel` | Location véhicule | Vehicle rental | ❌ `Location véhicule` | ❌ `Location véhicule` |
| `moto.returnLocation` | Lieu de restitution | Return location | ❌ `Lieu de restitution` | ❌ `Lieu de restitution` |
| `moto.reviews.sample1.meta` | Il y a 2 semaines • 3 jours de location | 2 weeks ago • 3-day rental | ❌ `Il y a 2 semaines • 3 jours de location` | ❌ `Il y a 2 semaines • 3 jours de location` |
| `moto.reviews.sample1.text` | Véhicule en parfait état, très propre. Pierre est un hôte at... | Vehicle in perfect condition, very clean. Pierre is a though... | ❌ `Véhicule en parfait état, très propre. Pierre est un hôte at...` | ❌ `Véhicule en parfait état, très propre. Pierre est un hôte at...` |
| `moto.reviews.sample2.meta` | Il y a 1 mois • 5 jours de location | 1 month ago • 5-day rental | ❌ `Il y a 1 mois • 5 jours de location` | ❌ `Il y a 1 mois • 5 jours de location` |
| `moto.reviews.sample2.text` | Excellent véhicule pour découvrir l'île. Économique et fiabl... | Excellent vehicle to explore the island. Economical and reli... | ❌ `Excellent véhicule pour découvrir l'île. Économique et fiabl...` | ❌ `Excellent véhicule pour découvrir l'île. Économique et fiabl...` |
| `moto.startDateLabel` | Départ | Pick-up | ❌ `Départ` | ❌ `Départ` |
| `moto.statsThis` | Cette moto | This motorbike | ❌ `Cette moto` | ❌ `Cette moto` |
| `moto.statsVehicles` | Véhicules | Vehicles | ❌ `Véhicules` | ❌ `Véhicules` |

## LOCATIONAREA

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `addNew` | Ajouter une nouvelle localisation | Add a new location | ❌ `Ajouter une nouvelle localisation` | ❌ `Ajouter une nouvelle localisation` |
| `create` | Ajouter | Add | ❌ `Ajouter` | ❌ `Ajouter` |
| `createdDescription` | {{name}} est maintenant sélectionné. | {{name}} is now selected. | ❌ `{{name}} est maintenant sélectionné.` | ❌ `{{name}} est maintenant sélectionné.` |
| `createdTitle` | Quartier ajouté | Area added | ❌ `Quartier ajouté` | ❌ `Quartier ajouté` |
| `creating` | Ajout… | Adding… | ❌ `Ajout…` | ❌ `Ajout…` |
| `errors.createTitle` | Impossible d'ajouter le quartier | Could not add area | ❌ `Impossible d'ajouter le quartier` | ❌ `Impossible d'ajouter le quartier` |
| `errors.createUnknown` | Erreur inconnue | Unknown error | ❌ `Erreur inconnue` | ❌ `Erreur inconnue` |
| `errors.loadTitle` | Erreur | Error | ❌ `Erreur` | ❌ `Erreur` |
| `errors.required` | Le quartier est obligatoire pour un hébergement disponible. | Neighborhood is required for an available accommodation listing. | ❌ `Le quartier est obligatoire pour un hébergement disponible.` | ❌ `Le quartier est obligatoire pour un hébergement disponible.` |
| `errors.requiredTitle` | Quartier requis | Area required | ❌ `Quartier requis` | ❌ `Quartier requis` |
| `label` | Quartier | Neighborhood | ❌ `Quartier` | ❌ `Quartier` |
| `loading` | Chargement… | Loading… | ❌ `Chargement…` | ❌ `Chargement…` |
| `newNamePlaceholder` | Ex. Ambatoloaka | e.g. Ambatoloaka | ❌ `Ex. Ambatoloaka` | ❌ `Ex. Ambatoloaka` |
| `placeholder` | Sélectionner un quartier | Select an area | ❌ `Sélectionner un quartier` | ❌ `Sélectionner un quartier` |

## METEONOSYBEPAGE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `ctaExchange` | Taux Euro / Ariary | Euro / Ariary rate | Cambio Euro / Ariary | Euro / Ariary Kurs |
| `ctaRent` | Louer un scooter | Rent a scooter | Noleggia uno scooter | Roller mieten |
| `ctaText` | Louez un scooter en ligne avec Rentanoo : réservation rapide... | Rent a scooter online with Rentanoo: fast booking, airport o... | Noleggia uno scooter online con Rentanoo: prenotazione rapid... | Roller online bei Rentanoo buchen: schnelle Reservierung, Li... |
| `ctaTitle` | Prêt à explorer Nosy Be ? | Ready to explore Nosy Be? | Pronto a esplorare Nosy Be? | Nosy Be entdecken? |
| `eyebrow` | Madagascar · Nosy Be | Madagascar · Nosy Be | Madagascar · Nosy Be | Madagaskar · Nosy Be |
| `faq.items` | [{'q': 'Quelle est la meilleure période pour visiter Nosy Be... | [{'q': 'What is the best time to visit Nosy Be?', 'a': 'High... | [{'q': 'Periodo migliore per visitare Nosy Be?', 'a': 'Stagi... | [{'q': 'Beste Reisezeit für Nosy Be?', 'a': 'Trockenzeit (Ma... |
| `faqTitle` | Questions fréquentes — météo Nosy Be | FAQ — Nosy Be weather | FAQ — Meteo Nosy Be | FAQ — Wetter Nosy Be |
| `forecastTitle` | Prévisions météo 7 jours à Nosy Be | 7-day weather forecast in Nosy Be | Previsioni meteo 7 giorni a Nosy Be | 7-Tage-Wettervorhersage Nosy Be |
| `intro` | Consultez la météo en direct à Nosy Be et les prévisions sur... | Check live weather in Nosy Be and the 7-day forecast to plan... | Meteo in diretta a Nosy Be e previsioni su 7 giorni per orga... | Aktuelles Wetter in Nosy Be und 7-Tage-Vorhersage für Ihre R... |
| `liveLabel` | Température actuelle | Current temperature | Temperatura attuale | Aktuelle Temperatur |
| `localTime` | Heure locale | Local time | Ora locale | Ortszeit |
| `seoBlock` | Nosy Be bénéficie d'un climat tropical avec une saison sèche... | Nosy Be has a tropical climate with a dry season from May to... | Nosy Be ha clima tropicale con stagione secca (maggio–novemb... | Nosy Be hat tropisches Klima mit Trockenzeit (Mai–November) ... |
| `seoBlockTitle` | Climat et saisons à Nosy Be | Climate and seasons in Nosy Be | Clima e stagioni a Nosy Be | Klima und Jahreszeiten in Nosy Be |
| `sourceNote` | Source : modèles numériques Open-Meteo. Peut différer des bu... | Source: Open-Meteo numerical models. May differ from Météo M... | Fonte: modelli numerici Open-Meteo. Può differire da Météo M... | Quelle: Open-Meteo-Numerikmodelle. Kann von Météo Madagascar... |
| `tableCondition` | Conditions | Conditions | Condizioni | Bedingungen |
| `tableDay` | Jour | Day | Giorno | Tag |
| `tableTemp` | Min / Max | Min / Max | Min / Max | Min / Max |
| `timezone` | Fuseau Indian/Antananarivo (UTC+3) | Indian/Antananarivo timezone (UTC+3) | Fuso Indian/Antananarivo (UTC+3) | Zeitzone Indian/Antananarivo (UTC+3) |
| `title` | Météo Nosy Be aujourd'hui | Nosy Be weather today | Meteo Nosy Be oggi | Wetter Nosy Be heute |

## MOTODETAILS

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `back` | Retour | Back | Indietro | Zurück |
| `benefits.items.extension` | Prolongation facile | Easy extension | Prolungamento facile | Einfache Verlängerung |
| `benefits.items.lateReturn` | 30 minutes de marge pour les retours tardifs | 30 minutes grace period for late returns | 30 minuti di tolleranza per i ritardi | 30 Minuten Kulanz bei verspäteter Rückgabe |
| `benefits.items.support` | Support client 7j/7 | Customer support 7 days a week | Assistenza clienti 7 giorni su 7 | Kundensupport 7 Tage die Woche |
| `benefits.title` | Avantages à chaque location | Benefits with every rental | Vantaggi per ogni noleggio | Vorteile bei jeder Miete |
| `descriptionTitle` | Description du véhicule | Vehicle description | Descrizione del veicolo | Fahrzeugbeschreibung |
| `errors.bookingError.description` | Impossible de créer la réservation | Unable to create the booking | Impossibile creare la prenotazione | Buchung konnte nicht erstellt werden |
| `errors.bookingError.title` | Erreur de réservation | Booking error | Errore di prenotazione | Buchungsfehler |
| `errors.loadError.description` | Impossible de charger les informations du véhicule. | Unable to load vehicle information. | Impossibile caricare le informazioni del veicolo. | Fahrzeuginformationen konnten nicht geladen werden. |
| `errors.loadError.title` | Erreur | Error | Errore | Fehler |
| `errors.loginRequired.description` | Vous devez être connecté pour réserver un véhicule. | You must be logged in to book a vehicle. | Devi essere connesso per prenotare un veicolo. | Sie müssen angemeldet sein, um ein Fahrzeug zu buchen. |
| `errors.loginRequired.title` | Connexion requise | Login required | Accesso richiesto | Anmeldung erforderlich |
| `errors.missingInfo.description` | Veuillez sélectionner des dates de location. | Please select rental dates. | Seleziona le date di noleggio. | Bitte wählen Sie Mietdaten aus. |
| `errors.missingInfo.title` | Informations manquantes | Missing information | Informazioni mancanti | Fehlende Informationen |
| `errors.unexpectedError.description` | Une erreur est survenue lors de la création de la réservation | An error occurred while creating the booking | Si è verificato un errore durante la creazione della prenotazione | Beim Erstellen der Buchung ist ein Fehler aufgetreten |
| `errors.unexpectedError.title` | Erreur inattendue | Unexpected error | Errore imprevisto | Unerwarteter Fehler |
| `errors.vehicleIncompatible.description` | Cette page est réservée aux motos. Redirection vers l'accueil. | This page is reserved for motorcycles. Redirecting to home. | Questa pagina è riservata alle moto. Reindirizzamento alla home. | Diese Seite ist für Motorräder reserviert. Weiterleitung zur Startseite. |
| `errors.vehicleIncompatible.title` | Véhicule incompatible | Incompatible vehicle | Veicolo incompatibile | Inkompatibles Fahrzeug |
| `errors.vehicleNotFound.description` | Ce véhicule n'existe pas ou n'est plus disponible. | This vehicle does not exist or is no longer available. | Questo veicolo non esiste o non è più disponibile. | Dieses Fahrzeug existiert nicht oder ist nicht mehr verfügbar. |
| `errors.vehicleNotFound.title` | Véhicule non trouvé | Vehicle not found | Veicolo non trovato | Fahrzeug nicht gefunden |
| `insurance.conditions.deductible` | Franchise : 800€ | Excess: €800 | Franchigia: 800€ | Selbstbeteiligung: 800€ |
| `insurance.conditions.deposit` | Caution : 1000€ | Deposit: €1000 | Deposito cauzionale: 1000€ | Kaution: 1000€ |
| `insurance.conditions.licenseYears` | Permis depuis 2 ans | Driving license held for 2 years | Patente da almeno 2 anni | Führerschein seit 2 Jahren |
| `insurance.conditions.minAge` | Âge minimum : 21 ans | Minimum age: 21 | Età minima: 21 anni | Mindestalter: 21 Jahre |
| `insurance.conditionsTitle` | Conditions : | Conditions: | Condizioni: | Bedingungen: |
| `insurance.coverage.collision` | Dommages collision | Collision damage | Danni da collisione | Kollisionsschäden |
| `insurance.coverage.fire` | Incendie | Fire | Incendio | Brand |
| `insurance.coverage.glass` | Bris de glace | Glass breakage | Rottura dei vetri | Glasschäden |
| `insurance.coverage.theft` | Vol et vandalisme | Theft and vandalism | Furto e atti vandalici | Diebstahl und Vandalismus |
| `insurance.coverageTitle` | Ce que prend en charge l'assurance : | What the insurance covers: | Cosa copre l'assicurazione: | Was die Versicherung abdeckt: |
| `insurance.items.axa` | Assurance multirisque fournie par AXA | Comprehensive insurance provided by AXA | Assicurazione completa fornita da AXA | Vollkaskoversicherung von AXA |
| `insurance.items.roadside` | Assistance routière 24/7 | 24/7 roadside assistance | Assistenza stradale 24/7 | Pannenhilfe rund um die Uhr |
| `insurance.title` | Assurance incluse | Included insurance | Assicurazione inclusa | Inklusive Versicherung |
| `legal.ctaConditions` | Conditions générales | Terms and conditions | Condizioni generali | Allgemeine Geschäftsbedingungen |
| `legal.ctaMore` | En savoir plus | Learn more | Scopri di più | Mehr erfahren |
| `legal.paragraph1` | Conformément à l'article L.221-18 du Code de la consommation... | In accordance with Article L.221-18 of the French Consumer C... | Ai sensi dell'articolo L.221-18 del Codice del consumo franc... | Gemäß Artikel L.221-18 des französischen Verbrauchergesetzbu... |
| `legal.paragraph2` | En cas de litige, vous pouvez recourir à la médiation de la ... | In case of dispute, you can use consumer mediation or take t... | In caso di controversia puoi ricorrere alla mediazione del c... | Im Streitfall können Sie eine Verbraucherschlichtung in Ansp... |
| `legal.title` | Informations précontractuelles | Pre-contractual information | Informazioni precontrattuali | Vorvertragliche Informationen |
| `loading` | Chargement du véhicule... | Loading vehicle... | Caricamento del veicolo... | Fahrzeug wird geladen... |
| `notSpecified` | Non spécifié | Not specified | Non specificato | Nicht angegeben |
| `owner.howItWorks` | Comment ça marche ? | How does it work? | Come funziona? | Wie funktioniert das? |
| `owner.keyHandover` | Récupération des clés : Directement auprès de {{ownerName}} ... | Key pickup: Directly from {{ownerName}} to get all the advice. | Consegna delle chiavi: Direttamente da {{ownerName}} per ott... | Schlüsselübergabe: Direkt von {{ownerName}}, um alle Ratschläge zu erhalten. |
| `owner.loadError` | Impossible de charger les informations du propriétaire | Unable to load owner information | Impossibile caricare le informazioni del proprietario | Vermieterinformationen konnten nicht geladen werden |
| `owner.memberSince` | Membre depuis {{date}} | Member since {{date}} | Membro da {{date}} | Mitglied seit {{date}} |
| `owner.pending` | En attente | Pending | In attesa | Ausstehend |
| `owner.stats.rentals` | Locations | Rentals | Noleggi | Mieten |
| `owner.stats.thisCar` | Cette voiture | This car | Questa auto | Dieses Auto |
| `owner.stats.thisMoto` | Cette moto | This motorbike | Questa moto | Dieses Motorrad |
| `owner.stats.vehicles` | Véhicules | Vehicles | Veicoli | Fahrzeuge |
| `owner.title` | Propriétaire | Owner | Proprietario | Vermieter |
| `owner.verified` | Vérifié | Verified | Verificato | Verifiziert |
| `reviews.sample1.meta` | Il y a 2 semaines • 3 jours de location | 2 weeks ago • 3-day rental | 2 settimane fa • 3 giorni di noleggio | Vor 2 Wochen • 3 Tage Miete |
| `reviews.sample1.text` | Véhicule en parfait état, très propre. Pierre est un hôte at... | Vehicle in perfect condition, very clean. Pierre is a caring... | Veicolo in perfette condizioni, molto pulito. Pierre è un ho... | Fahrzeug in einwandfreiem Zustand, sehr sauber. Pierre ist e... |
| `reviews.sample2.meta` | Il y a 1 mois • 5 jours de location | 1 month ago • 5-day rental | 1 mese fa • 5 giorni di noleggio | Vor 1 Monat • 5 Tage Miete |
| `reviews.sample2.text` | Excellent véhicule pour découvrir l'île. Économique et fiabl... | Excellent vehicle to explore the island. Economical and reli... | Ottimo veicolo per scoprire l'isola. Economico e affidabile.... | Ausgezeichnetes Fahrzeug, um die Insel zu entdecken. Sparsam... |
| `reviews.title` | Évaluations | Reviews | Valutazioni | Bewertungen |
| `technical.color` | Couleur | Color | Colore | Farbe |
| `technical.engine` | Cylindrée | Engine capacity | Cilindrata | Hubraum |
| `technical.fuel` | Carburant | Fuel | Carburante | Kraftstoff |
| `technical.mileage` | Kilométrage | Mileage | Chilometraggio | Kilometerstand |
| `technical.seats` | Places | Seats | Posti | Sitzplätze |
| `technical.transmission` | Transmission | Transmission | Cambio | Getriebe |
| `technicalTitle` | Caractéristiques techniques | Technical specifications | Caratteristiche tecniche | Technische Daten |

## NAV

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `dashboard` | Tableau de bord | Dashboard | Dashboard | Dashboard |
| `dictionary` | Dictionnaire | Dictionary | Dizionario | Wörterbuch |
| `home` | Accueil | Home | Home | Startseite |
| `login` | Connexion | Login | Accedi | Anmelden |

## OWNERVEHICLES

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `accessDenied.description` | Vous devez être connecté pour accéder à cette page. | You must be logged in to access this page. | Devi essere connesso per accedere a questa pagina. | Sie müssen angemeldet sein, um auf diese Seite zuzugreifen. |
| `accessDenied.login` | Se connecter | Log in | Accedi | Anmelden |
| `accessDenied.title` | Accès refusé | Access denied | Accesso negato | Zugriff verweigert |
| `accommodationForm.capacity` | Capacité voyageurs | Guest capacity | ❌ `Capacité voyageurs` | ❌ `Capacité voyageurs` |
| `accommodationForm.category` | Type d'hébergement | Accommodation type | ❌ `Type d'hébergement` | ❌ `Type d'hébergement` |
| `accommodationForm.categoryAppartement` | Appartement | Apartment | ❌ `Appartement` | ❌ `Appartement` |
| `accommodationForm.categoryBungalow` | Bungalow | Bungalow | ❌ `Bungalow` | ❌ `Bungalow` |
| `accommodationForm.categoryChambre` | Chambre | Room | ❌ `Chambre` | ❌ `Chambre` |
| `accommodationForm.categoryMaison` | Maison | House | ❌ `Maison` | ❌ `Maison` |
| `accommodationForm.categoryPlaceholder` | Sélectionner | Select | ❌ `Sélectionner` | ❌ `Sélectionner` |
| `accommodationForm.categoryVilla` | Villa | Villa | ❌ `Villa` | ❌ `Villa` |
| `accommodationForm.description` | Description | Description | ❌ `Description` | ❌ `Description` |
| `accommodationForm.descriptionPlaceholder` | Décrivez votre hébergement, les équipements, la localisation... | Describe your accommodation, amenities, location... | ❌ `Décrivez votre hébergement, les équipements, la localisation...` | ❌ `Décrivez votre hébergement, les équipements, la localisation...` |
| `accommodationForm.errors.capacity` | Merci de saisir une capacité entre 1 et 20 voyageurs. | Please enter a capacity between 1 and 20 guests. | ❌ `Merci de saisir une capacité entre 1 et 20 voyageurs.` | ❌ `Merci de saisir une capacité entre 1 et 20 voyageurs.` |
| `accommodationForm.errors.generic` | Impossible de créer l'hébergement. Veuillez réessayer. | Unable to create the accommodation. Please try again. | ❌ `Impossible de créer l'hébergement. Veuillez réessayer.` | ❌ `Impossible de créer l'hébergement. Veuillez réessayer.` |
| `accommodationForm.errors.price` | Merci de saisir un prix par nuit valide (minimum 1 000 Ar). | Please enter a valid price per night (minimum 1,000 Ar). | ❌ `Merci de saisir un prix par nuit valide (minimum 1 000 Ar).` | ❌ `Merci de saisir un prix par nuit valide (minimum 1 000 Ar).` |
| `accommodationForm.errors.required` | Merci de renseigner le type, le nom, la capacité et le prix par nuit. | Please fill in type, name, capacity and price per night. | ❌ `Merci de renseigner le type, le nom, la capacité et le prix par nuit.` | ❌ `Merci de renseigner le type, le nom, la capacité et le prix par nuit.` |
| `accommodationForm.name` | Nom de l'hébergement | Accommodation name | ❌ `Nom de l'hébergement` | ❌ `Nom de l'hébergement` |
| `accommodationForm.namePlaceholder` | Ex : Villa les Flamboyants | e.g. Flamboyants Villa | ❌ `Ex : Villa les Flamboyants` | ❌ `Ex : Villa les Flamboyants` |
| `accommodationForm.nightlyPrice` | Prix par nuit | Price per night | ❌ `Prix par nuit` | ❌ `Prix par nuit` |
| `accommodationForm.nightlyPriceHint` | Saisissez l'un ou l'autre — équivalent € affiché aux voyageu... | Enter either amount — € equivalent shown to travelers at today's rate | ❌ `Saisissez l'un ou l'autre — équivalent € affiché aux voyageu...` | ❌ `Saisissez l'un ou l'autre — équivalent € affiché aux voyageu...` |
| `accommodationForm.photos.minRequired` | Veuillez ajouter au moins une photo de votre hébergement. | Please add at least one photo of your accommodation. | ❌ `Veuillez ajouter au moins une photo de votre hébergement.` | ❌ `Veuillez ajouter au moins une photo de votre hébergement.` |
| `accommodationForm.photos.sectionSubtitle` | Ajoutez au moins une photo pour mettre en valeur votre hébergement. | Add at least one photo to showcase your accommodation. | ❌ `Ajoutez au moins une photo pour mettre en valeur votre hébergement.` | ❌ `Ajoutez au moins une photo pour mettre en valeur votre hébergement.` |
| `accommodationForm.photos.sectionTitle` | Photos de l'hébergement | Accommodation photos | ❌ `Photos de l'hébergement` | ❌ `Photos de l'hébergement` |
| `accommodationForm.saving` | Création en cours... | Creating... | ❌ `Création en cours...` | ❌ `Création en cours...` |
| `accommodationForm.submit` | Créer l'hébergement | Create accommodation | ❌ `Créer l'hébergement` | ❌ `Créer l'hébergement` |
| `accommodationForm.successDescription` | Votre annonce a été créée. Vous pouvez la gérer dans la liste de vos véhicules. | Your listing has been created. You can manage it in your vehicles list. | ❌ `Votre annonce a été créée. Vous pouvez la gérer dans la liste de vos véhicules.` | ❌ `Votre annonce a été créée. Vous pouvez la gérer dans la liste de vos véhicules.` |
| `accommodationForm.successTitle` | Hébergement ajouté avec succès | Accommodation added successfully | ❌ `Hébergement ajouté avec succès` | ❌ `Hébergement ajouté avec succès` |
| `accommodationForm.title` | Ajouter un hébergement | Add accommodation | ❌ `Ajouter un hébergement` | ❌ `Ajouter un hébergement` |
| `addCard.badge` | Nouveau véhicule | New vehicle | Nuovo veicolo | Neues Fahrzeug |
| `addCard.description` | Cliquez ici pour ajouter un nouveau véhicule à votre flotte ... | Click here to add a new vehicle to your fleet and start renting it | Clicca qui per aggiungere un nuovo veicolo alla tua flotta e... | Klicken Sie hier, um ein neues Fahrzeug zu Ihrer Flotte hinz... |
| `addCard.title` | Ajouter un véhicule | Add a vehicle | Aggiungi un veicolo | Fahrzeug hinzufügen |
| `availabilityDialog.cancel` | Annuler | Cancel | Annulla | Abbrechen |
| `availabilityDialog.confirm` | Confirmer la désactivation | Confirm deactivation | Conferma disattivazione | Deaktivierung bestätigen |
| `availabilityDialog.confirmQuestion` | Êtes-vous sûr de vouloir continuer ? | Are you sure you want to continue? | Sei sicuro di voler continuare? | Sind Sie sicher, dass Sie fortfahren möchten? |
| `availabilityDialog.intro` | En désactivant la disponibilité de votre véhicule : | By disabling your vehicle's availability: | Disattivando la disponibilità del tuo veicolo: | Wenn Sie die Verfügbarkeit Ihres Fahrzeugs deaktivieren: |
| `availabilityDialog.point1` | Il ne sera plus visible dans les résultats de recherche | It will no longer appear in search results | Non sarà più visibile nei risultati di ricerca | Wird es nicht mehr in den Suchergebnissen angezeigt |
| `availabilityDialog.point2` | Les clients ne pourront plus effectuer de nouvelles réservations | Customers will no longer be able to make new bookings | I clienti non potranno più effettuare nuove prenotazioni | Können Kunden keine neuen Buchungen mehr vornehmen |
| `availabilityDialog.point3` | Les réservations existantes restent valides | Existing bookings remain valid | Le prenotazioni esistenti restano valide | Bleiben bestehende Buchungen gültig |
| `availabilityDialog.title` | Confirmer la modification de disponibilité | Confirm availability change | Conferma modifica disponibilità | Änderung der Verfügbarkeit bestätigen |
| `card.actions.manage` | Gérer le véhicule | Manage vehicle | Gestisci veicolo | Fahrzeug verwalten |
| `card.actions.viewPublic` | Voir la fiche publique | View public listing | Vedi scheda pubblica | Öffentliches Profil anzeigen |
| `card.fuel` | Carburant | Fuel | Carburante | Kraftstoff |
| `card.pricePerDay` | Prix/jour | Price/day | Prezzo/giorno | Preis/Tag |
| `card.year` | Année | Year | Anno | Jahr |
| `empty.description` | Commencez par ajouter votre premier véhicule à la plateforme. | Start by adding your first vehicle to the platform. | Inizia aggiungendo il tuo primo veicolo alla piattaforma. | Fügen Sie zunächst Ihr erstes Fahrzeug zur Plattform hinzu. |
| `empty.title` | Aucun véhicule | No vehicles | Nessun veicolo | Keine Fahrzeuge |
| `header.subtitle` | Gérez vos véhicules et vos réservations | Manage your vehicles and your bookings | Gestisci i tuoi veicoli e le tue prenotazioni | Verwalten Sie Ihre Fahrzeuge und Ihre Buchungen |
| `header.title` | Mes véhicules | My vehicles | I miei veicoli | Meine Fahrzeuge |
| `kycRequired.description` | Pour publier vos véhicules, vous devez compléter votre vérification d'identité. | To publish your vehicles, you must complete your identity verification. | Per pubblicare i tuoi veicoli, devi completare la verifica della tua identità. | Um Ihre Fahrzeuge zu veröffentlichen, müssen Sie Ihre Identi... |
| `kycRequired.title` | Vérification KYC requise | KYC verification required | Verifica KYC richiesta | KYC-Verifizierung erforderlich |
| `loading` | Chargement... | Loading... | Caricamento... | Wird geladen... |
| `motoForm.brand` | Marque | Brand | Marca | Marke |
| `motoForm.brandPlaceholder` | Ex : Honda | e.g. Honda | Es: Honda | Z. B. Honda |
| `motoForm.cancel` | Annuler | Cancel | Annulla | Abbrechen |
| `motoForm.dailyPrice` | Prix par jour (€) | Price per day (€) | Prezzo al giorno (€) | Preis pro Tag (€) |
| `motoForm.description` | Description (optionnel) | Description (optional) | Descrizione (opzionale) | Beschreibung (optional) |
| `motoForm.descriptionPlaceholder` | Décrivez l'état de la moto, les équipements fournis (casque, top case, etc.)... | Describe the condition of the bike, included equipment (helm... | Descrivi lo stato della moto, le dotazioni incluse (casco, top case, ecc.)... | Beschreiben Sie den Zustand des Fahrzeugs und die enthaltene... |
| `motoForm.engineCapacity` | Cylindrée (cc) | Engine capacity (cc) | Cilindrata (cc) | Hubraum (ccm) |
| `motoForm.errors.generic` | Impossible de créer le véhicule. Veuillez réessayer. | Unable to create the vehicle. Please try again. | Impossibile creare il veicolo. Riprova. | Das Fahrzeug konnte nicht erstellt werden. Bitte versuchen Sie es erneut. |
| `motoForm.errors.price` | Merci de saisir un prix par jour valide. | Please enter a valid daily price. | Inserisci un prezzo al giorno valido. | Bitte geben Sie einen gültigen Tagespreis ein. |
| `motoForm.errors.required` | Merci de renseigner au minimum la marque, le modèle, l'année... | Please fill at least brand, model, year and daily price. | Compila almeno marca, modello, anno e prezzo al giorno. | Bitte geben Sie mindestens Marke, Modell, Baujahr und Tagespreis an. |
| `motoForm.errors.year` | Merci de saisir une année valide. | Please enter a valid year. | Inserisci un anno valido. | Bitte geben Sie ein gültiges Baujahr ein. |
| `motoForm.fuel` | Carburant | Fuel | Carburante | Kraftstoff |
| `motoForm.fuelPlaceholder` | Sélectionner | Select | Seleziona | Auswählen |
| `motoForm.kind` | Type | Type | Tipo | Typ |
| `motoForm.kindMoto` | Moto | Motorbike | Moto | Motorrad |
| `motoForm.kindPlaceholder` | Sélectionner | Select | Seleziona | Auswählen |
| `motoForm.kindScooter` | Scooter | Scooter | Scooter | Roller |
| `motoForm.licensePlate` | Immatriculation (optionnel) | Licence plate (optional) | Targa (opzionale) | Kennzeichen (optional) |
| `motoForm.mileage` | Kilométrage (approx.) | Mileage (approx.) | Chilometraggio (approx.) | Kilometerstand (ca.) |
| `motoForm.model` | Modèle | Model | Modello | Modell |
| `motoForm.modelPlaceholder` | Ex : PCX 125 | e.g. PCX 125 | Es: PCX 125 | Z. B. PCX 125 |
| `motoForm.photos.addMore` | Ajouter des photos | Add photos | Aggiungi foto | Weitere Fotos hinzufügen |
| `motoForm.photos.addMoreLimit` | Limite atteinte (3 photos supplémentaires) | Limit reached (3 extra photos) | Limite raggiunto (3 foto aggiuntive) | Limit erreicht (3 zusätzliche Fotos) |
| `motoForm.photos.added` | Photo ajoutée | Photo added | Foto aggiunta | Foto hinzugefügt |
| `motoForm.photos.addedDescription` | Votre photo a été ajoutée avec succès. | Your photo has been added successfully. | La tua foto è stata aggiunta con successo. | Ihr Foto wurde erfolgreich hinzugefügt. |
| `motoForm.photos.addedTitle` | Photo ajoutée | Photo added | Foto aggiunta | Foto hinzugefügt |
| `motoForm.photos.additionalAdded` | Photo supplémentaire ajoutée | Additional photo added | Foto aggiuntiva aggiunta | Zusätzliches Foto hinzugefügt |
| `motoForm.photos.additionalAddedDescription` | Votre photo supplémentaire a été ajoutée avec succès. | Your additional photo has been added successfully. | La tua foto aggiuntiva è stata aggiunta con successo. | Ihr zusätzliches Foto wurde erfolgreich hinzugefügt. |
| `motoForm.photos.changePhoto` | Changer ma photo | Change photo | Cambia foto | Foto ändern |
| `motoForm.photos.deletePhoto` | Supprimer | Delete | Elimina | Löschen |
| `motoForm.photos.interiorHint` | Par exemple : compteur, selle, top case, rangements... | For example: dashboard, seat, top case, storage, etc. | Ad esempio: cruscotto, sella, top case, vani portaoggetti... | Zum Beispiel: Armaturenbrett, Sitz, Topcase, Staufächer... |
| `motoForm.photos.interiorLabel` | Détails / Équipements | Details / Equipment | Dettagli / Dotazioni | Details / Ausstattung |
| `motoForm.photos.invalidType` | Veuillez sélectionner un fichier image valide. | Please select a valid image file. | Seleziona un file immagine valido. | Bitte wählen Sie eine gültige Bilddatei aus. |
| `motoForm.photos.minRequired` | Veuillez ajouter au moins une photo de votre moto ou scooter. | Please add at least one photo of your motorbike or scooter. | Aggiungi almeno una foto della tua moto o scooter. | Bitte fügen Sie mindestens ein Foto Ihres Motorrads oder Rollers hinzu. |
| `motoForm.photos.primaryHint` | Avant gauche – angle recommandé pour mettre en valeur votre moto/scooter | Front-left – recommended angle to highlight your motorbike/scooter | Anteriore sinistra – angolo consigliato per valorizzare la moto/scooter | Vorne links – empfohlener Winkel, um Ihr Motorrad/Roller hervorzuheben |
| `motoForm.photos.primaryLabel` | Photo principale | Main photo | Foto principale | Hauptfoto |
| `motoForm.photos.profileHint` | Vue de côté pour bien voir la ligne de la moto/scooter | Side view to clearly show the bike’s profile | Vista laterale per mostrare bene la linea della moto/scooter | Seitenansicht, um das Profil des Fahrzeugs gut zu zeigen |
| `motoForm.photos.profileLabel` | Profil gauche | Side view | Profilo sinistro | Seitenansicht |
| `motoForm.photos.removed` | Photo supprimée | Photo removed | Foto eliminata | Foto gelöscht |
| `motoForm.photos.removedDescription` | La photo a été supprimée avec succès. | The photo has been removed successfully. | La foto è stata eliminata con successo. | Das Foto wurde erfolgreich gelöscht. |
| `motoForm.photos.removedTitle` | Photo supprimée | Photo removed | Foto eliminata | Foto gelöscht |
| `motoForm.photos.sectionSubtitle` | Ajoutez au moins une photo de votre moto ou scooter pour don... | Add at least one photo of your motorbike or scooter to attract more renters. | Aggiungi almeno una foto della tua moto o scooter per attirare più locatari. | Fügen Sie mindestens ein Foto Ihres Motorrads oder Rollers h... |
| `motoForm.photos.sectionTitle` | Photos du véhicule | Vehicle photos | Foto del veicolo | Fahrzeugfotos |
| `motoForm.photos.slotLabel` | Photo {{index}} | Photo {{index}} | Foto {{index}} | Foto {{index}} |
| `motoForm.photos.slotOptional` | Optionnel | Optional | Opzionale | Optional |
| `motoForm.photos.tooLarge` | La photo doit faire moins de 10MB. | The photo must be smaller than 10MB. | La foto deve essere inferiore a 10MB. | Das Foto darf nicht größer als 10MB sein. |
| `motoForm.saving` | Création en cours... | Creating... | Creazione in corso... | Wird erstellt... |
| `motoForm.seats` | Nombre de places | Number of seats | Numero di posti | Anzahl der Plätze |
| `motoForm.submit` | Créer le véhicule | Create vehicle | Crea veicolo | Fahrzeug erstellen |
| `motoForm.successDescription` | Votre véhicule a été créé. Vous pouvez maintenant le gérer d... | Your vehicle has been created. You can now manage it in your vehicles list. | Il tuo veicolo è stato creato. Ora puoi gestirlo nell'elenco dei tuoi veicoli. | Ihr Fahrzeug wurde erstellt. Sie können es jetzt in Ihrer Fa... |
| `motoForm.successTitle` | Moto / scooter ajouté avec succès | Motorbike / scooter added successfully | Moto / scooter aggiunto con successo | Motorrad / Roller erfolgreich hinzugefügt |
| `motoForm.title` | Ajouter une moto / scooter | Add a motorbike / scooter | Aggiungi una moto / scooter | Motorrad / Roller hinzufügen |
| `motoForm.transmission` | Boîte | Transmission | Cambio | Getriebe |
| `motoForm.transmissionPlaceholder` | Sélectionner | Select | Seleziona | Auswählen |
| `motoForm.year` | Année | Year | Anno | Baujahr |
| `motoPlaceholder.backToVehicles` | Retour à mes véhicules | Back to my vehicles | Torna ai miei veicoli | Zurück zu meinen Fahrzeugen |
| `motoPlaceholder.description` | Le formulaire pour ajouter une moto ou un scooter sera bientôt disponible. | The form to add a motorbike or scooter will be available soon. | Il modulo per aggiungere una moto o uno scooter sarà disponibile a breve. | Das Formular zum Hinzufügen eines Motorrads oder Rollers wir... |
| `motoPlaceholder.title` | Moto / Scooter | Moto / Scooter | Moto / Scooter | Motorrad / Roller |
| `toasts.cannotDisable.description` | Ce véhicule a des réservations actives ou futures. Annulez d... | This vehicle has active or future bookings. Cancel those bookings first. | Questo veicolo ha prenotazioni attive o future. Annulla prima tali prenotazioni. | Dieses Fahrzeug hat aktive oder zukünftige Buchungen. Storni... |
| `toasts.cannotDisable.title` | Impossible de désactiver | Cannot disable | Impossibile disattivare | Deaktivierung nicht möglich |
| `toasts.genericError.description` | Une erreur est survenue lors de la sauvegarde. | An error occurred while saving. | Si è verificato un errore durante il salvataggio. | Beim Speichern ist ein Fehler aufgetreten. |
| `toasts.genericError.title` | Erreur | Error | Errore | Fehler |
| `toasts.loadVehiclesError.description` | Impossible de charger vos véhicules | Unable to load your vehicles | Impossibile caricare i tuoi veicoli | Ihre Fahrzeuge konnten nicht geladen werden |
| `toasts.loadVehiclesError.title` | Erreur | Error | Errore | Fehler |
| `toasts.mustBeLoggedIn.description` | Vous devez être connecté pour accéder à cette page | You must be logged in to access this page | Devi essere connesso per accedere a questa pagina | Sie müssen angemeldet sein, um auf diese Seite zuzugreifen |
| `toasts.mustBeLoggedIn.title` | Erreur | Error | Errore | Fehler |
| `toasts.saveStatusError.description` | Impossible de sauvegarder le statut : {{message}} | Unable to save status: {{message}} | Impossibile salvare lo stato: {{message}} | Status konnte nicht gespeichert werden: {{message}} |
| `toasts.saveStatusError.title` | Erreur | Error | Errore | Fehler |
| `toasts.statusUpdated.available` | Le véhicule est maintenant disponible | The vehicle is now available | Il veicolo è ora disponibile | Das Fahrzeug ist jetzt verfügbar |
| `toasts.statusUpdated.title` | Statut mis à jour | Status updated | Stato aggiornato | Status aktualisiert |
| `toasts.statusUpdated.unavailable` | Le véhicule est maintenant indisponible | The vehicle is now unavailable | Il veicolo è ora non disponibile | Das Fahrzeug ist jetzt nicht verfügbar |
| `vehicleTypeModal.accommodationLabel` | Hébergement | Accommodation | ❌ `Hébergement` | ❌ `Hébergement` |
| `vehicleTypeModal.cancel` | Annuler | Cancel | Annulla | Abbrechen |
| `vehicleTypeModal.carLabel` | Voiture | Car | Auto | Auto |
| `vehicleTypeModal.description` | Choisissez le type de véhicule que vous voulez publier sur la plateforme. | Choose the type of vehicle you want to publish on the platform. | Scegli il tipo di veicolo che vuoi pubblicare sulla piattaforma. | Wählen Sie den Fahrzeugtyp, den Sie auf der Plattform veröffentlichen möchten. |
| `vehicleTypeModal.motoLabel` | Moto / Scooter | Moto / Scooter | Moto / Scooter | Motorrad / Roller |
| `vehicleTypeModal.title` | Quel type de véhicule souhaitez-vous ajouter ? | Which type of vehicle would you like to add? | Che tipo di veicolo desideri aggiungere? | Welchen Fahrzeugtyp möchten Sie hinzufügen? |

## PRICING

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `cardTotalSummary` | {{duration}} · {{total}} total | {{duration}} · {{total}} total | ❌ `{{duration}} · {{total}} total` | ❌ `{{duration}} · {{total}} total` |
| `perDayShort` | jour | day | ❌ `jour` | ❌ `jour` |
| `perNightShort` | nuit | night | ❌ `nuit` | ❌ `nuit` |
| `totalExcludingOptions` | soit {{total}} (hors options supplémentaires) | total {{total}} (excluding additional options) | ❌ `soit {{total}} (hors options supplémentaires)` | ❌ `soit {{total}} (hors options supplémentaires)` |
| `total_for_duration` | soit {{total}} ({{duration}}) | total {{total}} ({{duration}}) | ❌ `soit {{total}} ({{duration}})` | ❌ `soit {{total}} ({{duration}})` |

## PROFILE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `badges.kyc.pending` | ⏳ En attente | ⏳ Pending | ⏳ In attesa | ⏳ Ausstehend |
| `badges.kyc.unverified` | ❌ Non vérifié | ❌ Not verified | ❌ Non verificato | ❌ Nicht verifiziert |
| `badges.kyc.verified` | ✅ Vérifié | ✅ Verified | ✅ Verificato | ✅ Verifiziert |
| `badges.role.admin` | ⚙️ Administrateur | ⚙️ Administrator | ⚙️ Amministratore | ⚙️ Administrator |
| `badges.role.owner` | 🏠 Propriétaire | 🏠 Owner | 🏠 Proprietario | 🏠 Eigentümer |
| `badges.role.renter` | 👤 Locataire | 👤 Renter | 👤 Locatario | 👤 Mieter |
| `banner.description` | {{percent}}% du profil complété. Cliquez pour sauvegarder to... | {{percent}}% of the profile completed. Click to save all changes. | {{percent}}% del profilo completato. Clicca per salvare tutte le modifiche. | {{percent}}% des Profils ausgefüllt. Klicken Sie, um alle Än... |
| `banner.title` | Profil {{percent}}% complété | Profile {{percent}}% completed | Profilo completato al {{percent}}% | Profil zu {{percent}}% ausgefüllt |
| `buttons.avatar.changePhoto` | Changer la photo | ❌ | ❌ `Changer la photo` | ❌ `Changer la photo` |
| `buttons.license.change` | Changer | Change | Modifica | Ändern |
| `buttons.license.choose` | Choisir un fichier | Choose a file | Scegli un file | Datei auswählen |
| `buttons.license.delete` | Supprimer | Delete | Elimina | Löschen |
| `buttons.saveAddress` | Sauvegarder mon adresse | Save my address | Salva il mio indirizzo | Meine Adresse speichern |
| `buttons.saveAddressChanges` | Sauvegarder mes modifications | Save my changes | Salva le mie modifiche | Meine Änderungen speichern |
| `buttons.saveAll` | Sauvegarder tout le profil | Save the whole profile | Salva l'intero profilo | Gesamtes Profil speichern |
| `buttons.saveBasicChanges` | Sauvegarder mes modifications | Save my changes | Salva le mie modifiche | Meine Änderungen speichern |
| `buttons.saveBasicInfo` | Sauvegarder mes informations | Save my information | Salva le mie informazioni | Meine Informationen speichern |
| `buttons.saveLicense` | Sauvegarder mes infos du permis | Save my licence details | Salva i dati della mia patente | Meine Führerscheindaten speichern |
| `buttons.saveLicenseChanges` | Sauvegarder mes modifications | Save my changes | Salva le mie modifiche | Meine Änderungen speichern |
| `buttons.saveSection` | Sauvegarder cette section | Save this section | Salva questa sezione | Diesen Abschnitt speichern |
| `buttons.saving` | Sauvegarde... | Saving... | Salvataggio... | Speichern... |
| `buttons.uploading` | Upload en cours... | Uploading... | Caricamento... | Wird hochgeladen... |
| `common.learnMore` | En savoir plus... | Learn more... | Scopri di più... | Mehr erfahren... |
| `completion.full` | Profil complet ✓ | Profile complete ✓ | Profilo completo ✓ | Profil vollständig ✓ |
| `completion.partial` | Profil {{percent}}% complété | Profile {{percent}}% completed | Profilo completato al {{percent}}% | Profil zu {{percent}}% ausgefüllt |
| `countries.belgium` | Belgique | Belgium | Belgio | Belgien |
| `countries.france` | France | France | Francia | Frankreich |
| `countries.germany` | Allemagne | Germany | Germania | Deutschland |
| `countries.guadeloupe` | Guadeloupe | Guadeloupe | Guadalupa | Guadeloupe |
| `countries.guyane` | Guyane | Guyane | Guyana francese | Französisch-Guayana |
| `countries.italy` | Italie | Italy | Italia | Italien |
| `countries.martinique` | Martinique | Martinique | Martinica | Martinique |
| `countries.mayotte` | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagascar | Nosy Be, Madagaskar |
| `countries.reunion` | La Réunion | La Réunion | La Réunion | La Réunion |
| `countries.spain` | Espagne | Spain | Spagna | Spanien |
| `countries.switzerland` | Suisse | Switzerland | Svizzera | Schweiz |
| `error.description` | Une erreur s'est produite lors du chargement du profil. | An error occurred while loading the profile. | Si è verificato un errore durante il caricamento del profilo. | Beim Laden des Profils ist ein Fehler aufgetreten. |
| `error.reload` | Recharger la page | Reload the page | Ricarica la pagina | Seite neu laden |
| `error.title` | Erreur | Error | Errore | Fehler |
| `form.address.city.label` | Ville | City | Città | Stadt |
| `form.address.city.placeholder` | Saint-Denis | Saint-Denis | Saint-Denis | Saint-Denis |
| `form.address.country.label` | Pays | Country | Paese | Land |
| `form.address.country.placeholder` | Sélectionner un pays | Select a country | Seleziona un paese | Land auswählen |
| `form.address.postalCode.label` | Code postal | Postcode | CAP | Postleitzahl |
| `form.address.postalCode.placeholder` | 97400 | 97400 | 97400 | 97400 |
| `form.address.street.label` | Adresse | Address | Indirizzo | Adresse |
| `form.address.street.placeholder` | Numéro et nom de rue | Street number and name | Numero civico e nome della via | Straßennummer und -name |
| `form.avatar.helper` | Formats acceptés : JPG, PNG. Taille max : 5MB | Accepted formats: JPG, PNG. Max size: 5MB | Formati accettati: JPG, PNG. Dimensione max: 5MB | Zulässige Formate: JPG, PNG. Max. Größe: 5MB |
| `form.avatar.loading` | Téléchargement en cours... | Uploading... | Caricamento in corso... | Upload läuft... |
| `form.bio.counter` | {{count}}/500 caractères | {{count}}/500 characters | {{count}}/500 caratteri | {{count}}/500 Zeichen |
| `form.bio.label` | Présentez-vous en quelques mots | Introduce yourself in a few words | Presentati in poche parole | Stellen Sie sich in wenigen Worten vor |
| `form.bio.placeholder` | Parlez-nous de vous, de vos passions, de votre style de cond... | Tell us about yourself, your passions, your driving style...... | Parlaci di te, delle tue passioni, del tuo stile di guida...... | Erzählen Sie uns von sich, Ihren Leidenschaften und Ihrem Fa... |
| `form.birthDate.day.placeholder` | Jour | Day | Giorno | Tag |
| `form.birthDate.label` | Date de naissance | Date of birth | Data di nascita | Geburtsdatum |
| `form.birthDate.month.placeholder` | Mois | Month | Mese | Monat |
| `form.birthDate.placeholder` | Sélectionner une date | Select a date | Seleziona una data | Datum auswählen |
| `form.birthDate.year.placeholder` | Année | Year | Anno | Jahr |
| `form.birthPlace.label` | Lieu de naissance | Place of birth | Luogo di nascita | Geburtsort |
| `form.birthPlace.placeholder` | Ville, Pays | City, Country | Città, Paese | Stadt, Land |
| `form.email.helper` | L'email ne peut pas être modifié | The email cannot be changed | L'email non può essere modificata | Die E-Mail-Adresse kann nicht geändert werden |
| `form.email.label` | Email | Email | Email | E-Mail |
| `form.email.placeholder` | votre.email@exemple.com | your.email@example.com | tua.email@esempio.com | ihre.email@beispiel.de |
| `form.firstName.label` | Prénom | First name | Nome | Vorname |
| `form.firstName.placeholder` | Votre prénom | Your first name | Il tuo nome | Ihr Vorname |
| `form.lastName.label` | Nom | Last name | Cognome | Nachname |
| `form.lastName.placeholder` | Votre nom | Your last name | Il tuo cognome | Ihr Nachname |
| `form.license.category.helper` | Catégorie du permis (par défaut : B pour voiture) | Licence category (default: B for car) | Categoria della patente (predefinita: B per auto) | Führerscheinklasse (Standard: B für Auto) |
| `form.license.category.label` | Catégorie du permis | Licence category | Categoria della patente | Führerscheinklasse |
| `form.license.category.placeholder` | Ex: B | e.g. B | Es: B | z. B. B |
| `form.license.country.label` | Pays d'émission | Issuing country | Paese di emissione | Ausstellungsland |
| `form.license.country.placeholder` | Sélectionner un pays | Select a country | Seleziona un paese | Land auswählen |
| `form.license.document.empty.helper` | Formats acceptés : PDF, JPG, PNG. Taille max : 10MB | Accepted formats: PDF, JPG, PNG. Max size: 10MB | Formati accettati: PDF, JPG, PNG. Dimensione max: 10MB | Zulässige Formate: PDF, JPG, PNG. Max. Größe: 10MB |
| `form.license.document.empty.title` | Cliquez pour uploader votre permis de conduire | Click to upload your driving licence | Clicca per caricare la tua patente di guida | Klicken Sie, um Ihren Führerschein hochzuladen |
| `form.license.document.label` | Document du permis | Licence document | Documento della patente | Führerscheindokument |
| `form.license.document.type.image` | Image | Image | Immagine | Bild |
| `form.license.document.type.pdf` | Document PDF | PDF document | Documento PDF | PDF-Dokument |
| `form.license.document.uploaded` | ✓ Fichier uploadé avec succès | ✓ Licence file uploaded successfully | ✓ File della patente caricato con successo | ✓ Führerscheindatei erfolgreich hochgeladen |
| `form.license.expirationDate.label` | Date d'expiration | Expiry date | Data di scadenza | Ablaufdatum |
| `form.license.expirationDate.placeholder` | Sélectionner une date | Select a date | Seleziona una data | Datum auswählen |
| `form.license.issueDate.day.placeholder` | Jour | Day | Giorno | Tag |
| `form.license.issueDate.helper` | Pour un permis européen, sa date de début de validité pour l... | For a European licence, its start of validity date for category B vehicles. | Per una patente europea, la data di inizio validità per i ve... | Bei einem europäischen Führerschein das Beginn-Datum der Gül... |
| `form.license.issueDate.label` | Date d'obtention | Issue date | Data di rilascio | Ausstellungsdatum |
| `form.license.issueDate.month.placeholder` | Mois | Month | Mese | Monat |
| `form.license.issueDate.placeholder` | Sélectionner une date | Select a date | Seleziona una data | Datum auswählen |
| `form.license.issueDate.year.placeholder` | Année | Year | Anno | Jahr |
| `form.license.number.helper` | Pour un permis européen, le numéro indiqué dans la section 5. | For a European licence, the number shown in section 5. | Per una patente europea, il numero indicato nella sezione 5. | Bei einem europäischen Führerschein die in Feld 5 angegebene Nummer. |
| `form.license.number.label` | Numéro de permis | Licence number | Numero della patente | Führerscheinnummer |
| `form.license.number.placeholder` | ex : 121075012XXX | e.g. 121075012XXX | es: 121075012XXX | z. B. 121075012XXX |
| `form.optional` | (optionnel) | (optional) | (opzionale) | (optional) |
| `form.phone.label` | Numéro de téléphone | Phone number | Numero di telefono | Telefonnummer |
| `form.phone.placeholder` | Numéro de téléphone | Phone number | Numero di telefono | Telefonnummer |
| `hero.back` | Retour à l'accueil | Back to home | Torna alla home | Zurück zur Startseite |
| `hero.subtitle` | Gérez vos informations personnelles et personnalisez votre expérience | Manage your personal information and customize your experience | Gestisci le tue informazioni personali e personalizza la tua esperienza | Verwalten Sie Ihre persönlichen Daten und personalisieren Sie Ihr Erlebnis |
| `hero.title` | Mon Profil | My profile | Il mio profilo | Mein Profil |
| `loading` | Chargement de votre profil... | Loading your profile... | Caricamento del tuo profilo... | Ihr Profil wird geladen... |
| `modal.licensePreview.alt` | Permis de conduire | Driving licence | Patente di guida | Führerschein |
| `modal.licensePreview.errorDescription` | Vérifiez que le fichier est bien uploadé et accessible | Check that the file is correctly uploaded and accessible. | Verifica che il file sia stato caricato correttamente e sia accessibile. | Stellen Sie sicher, dass die Datei korrekt hochgeladen und zugänglich ist. |
| `modal.licensePreview.errorTitle` | Impossible de charger l'image | Unable to load the image | Impossibile caricare l'immagine | Bild kann nicht geladen werden |
| `modal.licensePreview.title` | Aperçu du permis de conduire | Driving licence preview | Anteprima della patente di guida | Führerschein-Vorschau |
| `months.april` | avril | April | aprile | April |
| `months.august` | août | August | agosto | August |
| `months.december` | décembre | December | dicembre | Dezember |
| `months.february` | février | February | febbraio | Februar |
| `months.january` | janvier | January | gennaio | Januar |
| `months.july` | juillet | July | luglio | Juli |
| `months.june` | juin | June | giugno | Juni |
| `months.march` | mars | March | marzo | März |
| `months.may` | mai | May | maggio | Mai |
| `months.november` | novembre | November | novembre | November |
| `months.october` | octobre | October | ottobre | Oktober |
| `months.september` | septembre | September | settembre | September |
| `sections.address.saved` | Sauvegardé | Saved | Salvato | Gespeichert |
| `sections.address.step` | Étape 2/3 | Step 2/3 | Passo 2/3 | Schritt 2/3 |
| `sections.address.subtitle` | Votre adresse pour les livraisons et la localisation | Your address for deliveries and location | Il tuo indirizzo per consegne e localizzazione | Ihre Adresse für Lieferungen und Standort |
| `sections.address.title` | Adresse | Address | Indirizzo | Adresse |
| `sections.basic.bio.title` | Présentation personnelle | Personal introduction | Presentazione personale | Persönliche Vorstellung |
| `sections.basic.contact.title` | Contact | Contact | Contatti | Kontakt |
| `sections.basic.identity.title` | Identité | Identity | Identità | Identität |
| `sections.basic.personal.title` | Informations personnelles | Personal information | Informazioni personali | Persönliche Daten |
| `sections.basic.phone.title` | Téléphone | Phone | Telefono | Telefon |
| `sections.basic.saved` | Sauvegardé | Saved | Salvato | Gespeichert |
| `sections.basic.status.title` | Statut de votre compte | Account status | Stato dell'account | Kontostatus |
| `sections.basic.step` | Étape 1/3 | Step 1/3 | Passo 1/3 | Schritt 1/3 |
| `sections.basic.subtitle` | Vos informations de base pour personnaliser votre expérience | Your basic information to personalize your experience | Le tue informazioni di base per personalizzare la tua esperienza | Ihre Basisinformationen zur Personalisierung Ihres Erlebnisses |
| `sections.basic.title` | Informations personnelles | Personal information | Informazioni personali | Persönliche Daten |
| `sections.license.saved` | Sauvegardé | Saved | Salvato | Gespeichert |
| `sections.license.step` | Étape 3/3 | Step 3/3 | Passo 3/3 | Schritt 3/3 |
| `sections.license.subtitle` | Votre permis pour louer des véhicules en toute sécurité | Your licence to rent vehicles safely | La tua patente per noleggiare veicoli in sicurezza | Ihr Führerschein, um Fahrzeuge sicher zu mieten |
| `sections.license.title` | Permis de conduire | Driving licence | Patente di guida | Führerschein |
| `tabs.address` | Adresse | Address | Indirizzo | Adresse |
| `tabs.basic` | Informations de base | Basic information | Informazioni di base | Basisinformationen |
| `tabs.license` | Permis de conduire | Driving licence | Patente di guida | Führerschein |
| `toasts.avatarTooLarge.description` | L'image ne doit pas dépasser 5MB. | The image must not exceed 5MB. | L'immagine non deve superare i 5MB. | Das Bild darf 5MB nicht überschreiten. |
| `toasts.avatarTooLarge.title` | Erreur | Error | Errore | Fehler |
| `toasts.avatarTypeError.description` | Veuillez sélectionner un fichier image valide. | Please select a valid image file. | Seleziona un file immagine valido. | Bitte wählen Sie eine gültige Bilddatei. |
| `toasts.avatarTypeError.title` | Erreur | Error | Errore | Fehler |
| `toasts.avatarUpdateError.description` | Erreur lors de la mise à jour : {{error}} | Error while updating: {{error}} | Errore durante l'aggiornamento: {{error}} | Fehler beim Aktualisieren: {{error}} |
| `toasts.avatarUpdateError.title` | Erreur | Error | Errore | Fehler |
| `toasts.avatarUploadError.description` | Erreur lors de l'upload : {{error}} | Error while uploading: {{error}} | Errore durante il caricamento: {{error}} | Fehler beim Hochladen: {{error}} |
| `toasts.avatarUploadError.title` | Erreur | Error | Errore | Fehler |
| `toasts.avatarUploadSuccess.description` | Photo de profil mise à jour avec succès. | Profile picture updated successfully. | Foto profilo aggiornata con successo. | Profilbild erfolgreich aktualisiert. |
| `toasts.avatarUploadSuccess.title` | Succès | Success | Successo | Erfolg |
| `toasts.avatarUploadUnexpectedError.description` | Une erreur est survenue lors de l'upload de l'image. | An error occurred while uploading the image. | Si è verificato un errore durante il caricamento dell'immagine. | Beim Hochladen des Bildes ist ein Fehler aufgetreten. |
| `toasts.avatarUploadUnexpectedError.title` | Erreur | Error | Errore | Fehler |
| `toasts.globalError.description` | Une erreur inattendue s'est produite. Veuillez recharger la page. | An unexpected error occurred. Please reload the page. | Si è verificato un errore imprevisto. Ricarica la pagina. | Es ist ein unerwarteter Fehler aufgetreten. Bitte laden Sie die Seite neu. |
| `toasts.globalError.title` | Erreur | Error | Errore | Fehler |
| `toasts.globalSaveError.description` | Une erreur de sauvegarde s'est produite. Veuillez réessayer. | A save error occurred. Please try again. | Si è verificato un errore di salvataggio. Riprova. | Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut. |
| `toasts.globalSaveError.title` | Erreur | Error | Errore | Fehler |
| `toasts.javascriptError.description` | Une erreur inattendue s'est produite. Veuillez recharger la page. | An unexpected error occurred. Please reload the page. | Si è verificato un errore imprevisto. Ricarica la pagina. | Es ist ein unerwarteter Fehler aufgetreten. Bitte laden Sie die Seite neu. |
| `toasts.javascriptError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseFileTooLarge.description` | Le fichier ne doit pas dépasser 10MB. | The file must not exceed 10MB. | Il file non deve superare i 10MB. | Die Datei darf 10MB nicht überschreiten. |
| `toasts.licenseFileTooLarge.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseFileTypeError.description` | Veuillez sélectionner un fichier PDF, JPG ou PNG. | Please select a PDF, JPG or PNG file. | Seleziona un file PDF, JPG o PNG. | Bitte wählen Sie eine PDF-, JPG- oder PNG-Datei. |
| `toasts.licenseFileTypeError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseRemoveError.description` | Erreur lors de la suppression : {{error}} | Error while deleting: {{error}} | Errore durante l'eliminazione: {{error}} | Fehler beim Löschen: {{error}} |
| `toasts.licenseRemoveError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseRemoveSuccess.description` | Fichier permis supprimé avec succès. | Licence file deleted successfully. | File della patente eliminato con successo. | Führerscheindatei erfolgreich gelöscht. |
| `toasts.licenseRemoveSuccess.title` | Succès | Success | Successo | Erfolg |
| `toasts.licenseRemoveUnexpectedError.description` | Une erreur est survenue lors de la suppression. | An error occurred while deleting the file. | Si è verificato un errore durante l'eliminazione. | Beim Löschen der Datei ist ein Fehler aufgetreten. |
| `toasts.licenseRemoveUnexpectedError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseUpdateError.description` | Erreur lors de la mise à jour : {{error}} | Error while updating: {{error}} | Errore durante l'aggiornamento: {{error}} | Fehler beim Aktualisieren: {{error}} |
| `toasts.licenseUpdateError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseUploadError.description` | Erreur lors de l'upload : {{error}} | Error while uploading: {{error}} | Errore durante il caricamento: {{error}} | Fehler beim Hochladen: {{error}} |
| `toasts.licenseUploadError.title` | Erreur | Error | Errore | Fehler |
| `toasts.licenseUploadSuccess.description` | Fichier permis uploadé avec succès. | Licence file uploaded successfully. | File della patente caricato con successo. | Führerscheindatei erfolgreich hochgeladen. |
| `toasts.licenseUploadSuccess.title` | Succès | Success | Successo | Erfolg |
| `toasts.licenseUploadUnexpectedError.description` | Une erreur est survenue lors de l'upload du fichier. | An error occurred while uploading the file. | Si è verificato un errore durante il caricamento del file. | Beim Hochladen der Datei ist ein Fehler aufgetreten. |
| `toasts.licenseUploadUnexpectedError.title` | Erreur | Error | Errore | Fehler |
| `toasts.loadError.description` | Impossible de charger le profil : {{error}} | Unable to load profile: {{error}} | Impossibile caricare il profilo: {{error}} | Profil konnte nicht geladen werden: {{error}} |
| `toasts.loadError.title` | Erreur | Error | Errore | Fehler |
| `toasts.profileUpdateError.description` | Erreur lors de la mise à jour : {{error}} | Error while updating: {{error}} | Errore durante l'aggiornamento: {{error}} | Fehler beim Aktualisieren: {{error}} |
| `toasts.profileUpdateError.title` | Erreur | Error | Errore | Fehler |
| `toasts.profileUpdateSuccess.description` | Toutes vos informations ont été sauvegardées avec succès. | All your information has been saved successfully. | Tutte le tue informazioni sono state salvate con successo. | Alle Ihre Informationen wurden erfolgreich gespeichert. |
| `toasts.profileUpdateSuccess.title` | Profil complet mis à jour | Profile updated | Profilo aggiornato | Profil aktualisiert |
| `toasts.profileUpdateUnexpectedError.description` | Erreur lors de la mise à jour du profil : {{error}} | Error while updating the profile: {{error}} | Errore durante l'aggiornamento del profilo: {{error}} | Fehler bei der Aktualisierung des Profils: {{error}} |
| `toasts.profileUpdateUnexpectedError.title` | Erreur | Error | Errore | Fehler |
| `toasts.sectionSaveError.description` | Erreur lors de la sauvegarde : {{error}} | Error while saving: {{error}} | Errore durante il salvataggio: {{error}} | Fehler beim Speichern: {{error}} |
| `toasts.sectionSaveError.title` | Erreur | Error | Errore | Fehler |
| `toasts.sectionSaveSuccess.address` | Vos informations d'adresse ont été sauvegardées. | Your address information has been saved. | Le informazioni di indirizzo sono state salvate. | Ihre Adressinformationen wurden gespeichert. |
| `toasts.sectionSaveSuccess.basic` | Vos informations de base ont été sauvegardées. | Your basic information has been saved. | Le tue informazioni di base sono state salvate. | Ihre Basisinformationen wurden gespeichert. |
| `toasts.sectionSaveSuccess.license` | Vos informations de permis ont été sauvegardées. | Your licence information has been saved. | Le informazioni della patente sono state salvate. | Ihre Führerscheininformationen wurden gespeichert. |
| `toasts.sectionSaveSuccess.title` | Section sauvegardée | Section saved | Sezione salvata | Abschnitt gespeichert |
| `toasts.sectionSaveUnexpectedError.description` | Erreur lors de la sauvegarde : {{error}} | Error while saving: {{error}} | Errore durante il salvataggio: {{error}} | Fehler beim Speichern: {{error}} |
| `toasts.sectionSaveUnexpectedError.title` | Erreur | Error | Errore | Fehler |
| `toasts.unexpectedLoadError.description` | Une erreur est survenue lors du chargement du profil. | An error occurred while loading the profile. | Si è verificato un errore durante il caricamento del profilo. | Beim Laden des Profils ist ein Fehler aufgetreten. |
| `toasts.unexpectedLoadError.title` | Erreur | Error | Errore | Fehler |

## SEO

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `accommodationHubs.appartement.title` | Location appartement Nosy Be | Apartment rental Nosy Be | ❌ `Location appartement Nosy Be` | ❌ `Location appartement Nosy Be` |
| `accommodationHubs.bungalow.title` | Location bungalow Nosy Be | Bungalow rental Nosy Be | ❌ `Location bungalow Nosy Be` | ❌ `Location bungalow Nosy Be` |
| `accommodationHubs.vacances.title` | Location vacances Nosy Be | Vacation rentals Nosy Be | ❌ `Location vacances Nosy Be` | ❌ `Location vacances Nosy Be` |
| `accommodationHubs.villa.title` | Location villa Nosy Be | Villa rental Nosy Be | ❌ `Location villa Nosy Be` | ❌ `Location villa Nosy Be` |
| `contact.description` | Une question sur votre location scooter à Nosy Be ? Contacte... | Questions about your scooter rental in Nosy Be? Contact Rent... | Domande sul tuo noleggio scooter a Nosy Be? Contatta Rentano... | Fragen zu Ihrer Rollervermietung in Nosy Be? Kontaktieren Si... |
| `contact.title` | Contact – Location scooter Nosy Be \| Rentanoo | Contact – Scooter rental Nosy Be \| Rentanoo | Contatti – Noleggio scooter Nosy Be \| Rentanoo | Kontakt – Rollervermietung Nosy Be \| Rentanoo |
| `home.description` | Louez scooter, moto ou hébergement à Nosy Be en quelques cli... | Rent a scooter, motorbike or accommodation in Nosy Be in a f... | Noleggia il tuo scooter a Nosy Be in pochi clic. Consegna in... | Mieten Sie Ihren Roller in Nosy Be in wenigen Klicks. Liefer... |
| `home.title` | Location Nosy Be – Scooters, motos & hébergements \| Rentanoo | Nosy Be rentals – Scooters, motorbikes & accommodations \| Rentanoo | Noleggio scooter Nosy Be – Prenotazione online \| Rentanoo | Rollervermietung Nosy Be – Online-Buchung \| Rentanoo |
| `legal.description` | Mentions légales, CGU et politique de confidentialité de Ren... | Legal notice, terms of use and privacy policy of Rentanoo, s... | Note legali, condizioni d'uso e privacy policy di Rentanoo, ... | Impressum, AGB und Datenschutzerklärung von Rentanoo, Roller... |
| `legal.title` | Mentions légales – Rentanoo Nosy Be | Legal notice – Rentanoo Nosy Be | Note legali – Rentanoo Nosy Be | Impressum – Rentanoo Nosy Be |
| `meteoNosyBe.description` | Météo en direct à Nosy Be : température actuelle, prévisions... | Live weather in Nosy Be: current temperature, 7-day forecast... | Meteo in diretta a Nosy Be: temperatura attuale, previsioni ... | Live-Wetter in Nosy Be: aktuelle Temperatur, 7-Tage-Prognose... |
| `meteoNosyBe.title` | Météo Nosy Be aujourd'hui – Prévisions 7 jours \| Rentanoo | Nosy Be weather today – 7-day forecast \| Rentanoo | Meteo Nosy Be oggi – Previsioni 7 giorni \| Rentanoo | Wetter Nosy Be heute – 7-Tage-Vorhersage \| Rentanoo |
| `notFound.description` | Cette page n'existe pas. Retournez à l'accueil pour louer un... | This page does not exist. Return to the homepage to rent a s... | Questa pagina non esiste. Torna alla home per noleggiare uno... | Diese Seite existiert nicht. Kehren Sie zur Startseite zurüc... |
| `notFound.title` | Page introuvable – Rentanoo | Page not found – Rentanoo | Pagina non trovata – Rentanoo | Seite nicht gefunden – Rentanoo |
| `rentMyCar.description` | Mettez votre scooter ou voiture en location à Nosy Be avec R... | List your scooter or car for rent in Nosy Be with Rentanoo. ... | Metti il tuo scooter o la tua auto in noleggio a Nosy Be con... | Vermieten Sie Ihren Roller oder Ihr Auto in Nosy Be mit Rent... |
| `rentMyCar.title` | Devenir loueur – Scooter ou voiture à Nosy Be \| Rentanoo | Become an owner – Scooter or car in Nosy Be \| Rentanoo | Diventa proprietario – Scooter o auto a Nosy Be \| Rentanoo | Vermieter werden – Roller oder Auto in Nosy Be \| Rentanoo |
| `rentMyCarRegister.description` | Créez votre compte loueur Rentanoo et mettez votre véhicule ... | Create your Rentanoo owner account and list your vehicle for... | Crea il tuo account proprietario Rentanoo e metti il tuo vei... | Erstellen Sie Ihr Rentanoo-Vermieterkonto und stellen Sie Ih... |
| `rentMyCarRegister.title` | Inscription loueur – Nosy Be \| Rentanoo | Owner registration – Nosy Be \| Rentanoo | Registrazione proprietario – Nosy Be \| Rentanoo | Vermieter-Anmeldung – Nosy Be \| Rentanoo |
| `sinistreCaution.description` | En cas de sinistre pendant votre location scooter à Nosy Be ... | In case of incident during your scooter rental in Nosy Be: p... | In caso di incidente durante il noleggio scooter a Nosy Be: ... | Bei Schaden während Ihrer Rollervermietung in Nosy Be: Verfa... |
| `sinistreCaution.title` | Sinistre & caution – Location scooter Nosy Be \| Rentanoo | Damage & deposit – Scooter rental Nosy Be \| Rentanoo | Danni e cauzione – Noleggio scooter Nosy Be \| Rentanoo | Schaden & Kaution – Rollervermietung Nosy Be \| Rentanoo |
| `tauxChange.description` | Cours EUR/MGA en direct pour Madagascar : taux du jour, évol... | Live EUR/MGA rate for Madagascar: today's rate, 14-day trend... | Cambio EUR/MGA in diretta per il Madagascar: tasso del giorn... | Live EUR/MGA-Kurs für Madagaskar: Tageskurs, 14-Tage-Verlauf... |
| `tauxChange.title` | Taux de change Euro Ariary Madagascar aujourd'hui \| Rentanoo | Euro to Ariary exchange rate Madagascar today \| Rentanoo | Cambio Euro Ariary Madagascar oggi \| Rentanoo | Euro Ariary Wechselkurs Madagaskar heute \| Rentanoo |
| `vehicleLoading.description` | Louez votre scooter à Nosy Be en quelques clics. Livraison à... | Rent your scooter in Nosy Be in a few clicks. Delivery to ai... | Noleggia il tuo scooter a Nosy Be in pochi clic. Consegna in... | Mieten Sie Ihren Roller in Nosy Be in wenigen Klicks. Liefer... |
| `vehicleLoading.title` | Chargement… \| Rentanoo | Loading… \| Rentanoo | Caricamento… \| Rentanoo | Laden… \| Rentanoo |
| `vehicleNotFound.description` | Ce véhicule n'existe pas ou n'est plus disponible. Retournez... | This vehicle does not exist or is no longer available. Retur... | Questo veicolo non esiste o non è più disponibile. Torna all... | Dieses Fahrzeug existiert nicht oder ist nicht mehr verfügba... |
| `vehicleNotFound.title` | Véhicule introuvable – Rentanoo | Vehicle not found – Rentanoo | Veicolo non trovato – Rentanoo | Fahrzeug nicht gefunden – Rentanoo |
| `volsNosyBe.description` | Horaires des vols à l'aéroport de Nosy Be Fascène (NOS) : ar... | Flight schedules at Nosy Be Fascène airport (NOS): today's a... | Orari voli aeroporto Nosy Be Fascène (NOS): arrivi e partenze del giorno. | Flugplan Flughafen Nosy Be Fascène (NOS): Ankünfte und Abflüge des Tages. |
| `volsNosyBe.title` | Vols Nosy Be aujourd'hui – Arrivées et départs Fascène \| Rentanoo | Nosy Be flights today – Fascène arrivals & departures \| Rentanoo | Voli Nosy Be oggi – Arrivi e partenze Fascène \| Rentanoo | Flüge Nosy Be heute – Ankünfte & Abflüge Fascène \| Rentanoo |

## SINISTRECAUTION

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `assurance.card` | La caution peut servir à avancer les frais, puis vous pouvez... | The deposit can serve to advance costs, then you can request... | La cauzione può servire ad anticipare i costi, poi puoi rich... | Die Kaution kann dazu dienen, Kosten vorzuschießen; dann kön... |
| `assurance.note` | (On ne remplace pas votre assurance : on vous aide à constit... | (We don't replace your insurance: we help you build a clear file.) | (Non sostituiamo la tua assicurazione: ti aiutiamo a costitu... | (Wir ersetzen nicht Ihre Versicherung: wir helfen Ihnen, ein... |
| `assurance.subtitle` | Dans beaucoup de cas, vous pouvez faire jouer l'assurance de... | In many cases, you can use your card insurance (or travel/personal insurance). | In molti casi puoi fare valere l'assicurazione della tua car... | In vielen Fällen können Sie Ihre Kartenversicherung (oder Re... |
| `assurance.title` | Paiement par carte bancaire : un vrai avantage | Card payment: a real advantage | Pagamento con carta: un vero vantaggio | Kartenzahlung: ein echter Vorteil |
| `caution.bullet1` | Pas de débit automatique | No automatic charge | Nessun addebito automatico | Keine automatische Belastung |
| `caution.bullet2` | Si retenue : uniquement sur frais justifiés | If withheld: only for justified costs | Se trattenuta: solo su costi giustificati | Bei Einbehalt: nur für begründete Kosten |
| `caution.bullet3` | Jamais au-delà du montant de réparation | Never beyond the repair amount | Mai oltre l'importo della riparazione | Niemals über den Reparaturbetrag hinaus |
| `caution.note` | Important : si les dégâts sont inférieurs au montant de la c... | Important: if damages are below the deposit amount, the rema... | Importante: se i danni sono inferiori all'importo della cauz... | Wichtig: Liegen die Schäden unter dem Kautionbetrag, wird de... |
| `caution.subtitle` | La caution n'est pas là pour "punir". Elle sert surtout à av... | The deposit isn't there to "punish". It mainly serves to adv... | La cauzione non è lì per "punire". Serve soprattutto ad anti... | Die Kaution ist nicht dazu da zu "bestrafen". Sie dient vor ... |
| `caution.title` | La caution : à quoi elle sert (vraiment) | The deposit: what it's really for | La cauzione: a cosa serve davvero | Die Kaution: wofür sie wirklich dient |
| `contact.description` | Si quelque chose n'est pas clair, contactez-nous : on vous r... | If something isn't clear, contact us: we reply quickly, and always calmly. | Se qualcosa non è chiaro, contattaci: rispondiamo rapidament... | Wenn etwas unklar ist, kontaktieren Sie uns: wir antworten s... |
| `contact.emailCta` | Écrire au support | Email support | Scrivere al supporto | Support per E-Mail |
| `contact.homeCta` | Retour à l'accueil | Back to home | Torna alla home | Zurück zur Startseite |
| `contact.tip` | Conseil : dans votre message, indiquez votre référence de ré... | Tip: in your message, include your booking reference if you have it. | Consiglio: nel tuo messaggio, indica il riferimento della pr... | Tipp: Fügen Sie in Ihrer Nachricht Ihre Buchungsreferenz hinzu, falls vorhanden. |
| `contact.title` | Une question ? On est là. | A question? We're here. | Una domanda? Siamo qui. | Eine Frage? Wir sind für Sie da. |
| `cta.bullet1` | Aucun débit immédiat : rien n'est prélevé "automatiquement". | No immediate charge: nothing is taken "automatically". | Nessun addebito immediato: nulla viene prelevato "automaticamente". | Keine sofortige Belastung: es wird nichts "automatisch" abgebucht. |
| `cta.bullet2` | La caution sert seulement d'avance si nécessaire. | The deposit only serves as an advance if needed. | La cauzione serve solo da anticipo se necessario. | Die Kaution dient nur bei Bedarf als Vorschuss. |
| `cta.bullet3` | Jamais au-delà du montant réel et justifié des réparations. | Never beyond the real and justified repair amount. | Mai oltre l'importo reale e giustificato delle riparazioni. | Niemals über den tatsächlichen und begründeten Reparaturbetrag hinaus. |
| `cta.bullet4` | On vous fournira facture + justificatifs pour votre assurance (CB / voyage). | We'll provide invoice + documents for your insurance (card / travel). | Ti forniremo fattura + giustificativi per la tua assicurazio... | Wir liefern Rechnung + Nachweise für Ihre Versicherung (Karte / Reise). |
| `cta.bullet5` | Le loueur a jusqu'à 48h pour chiffrer, puis Rentanoo vérifie. | The owner has up to 48h to quote, then Rentanoo verifies. | Il proprietario ha fino a 48h per fare il preventivo, poi Rentanoo verifica. | Der Vermieter hat bis zu 48h zum Schätzen, dann prüft Rentanoo. |
| `cta.button` | Contacter Rentanoo | Contact Rentanoo | Contattare Rentanoo | Rentanoo kontaktieren |
| `cta.subtitle` | En résumé : pas de panique, on gère ça sereinement. | In short: don't panic, we handle this calmly. | In sintesi: niente panico, gestiamo tutto con serenità. | Kurz: Keine Panik, wir regeln das gelassen. |
| `cta.title` | Rappel des points clés (on reste zen) | Key points reminder (stay calm) | Promemoria punti chiave (restiamo calmi) | Erinnerung an die wichtigsten Punkte (ruhig bleiben) |
| `documents.bullet1` | Facture / justificatifs | Invoice / supporting documents | Fattura / giustificativi | Rechnung / Nachweise |
| `documents.bullet2` | Éléments du dossier (photos si besoin) | File elements (photos if needed) | Elementi del fascicolo (foto se necessario) | Aktenunterlagen (Fotos bei Bedarf) |
| `documents.bullet3` | Références de la réservation | Booking references | Riferimenti della prenotazione | Buchungsreferenzen |
| `documents.subtitle` | Rentanoo mettra à disposition les pièces nécessaires pour vo... | Rentanoo will provide the documents needed for your file (in... | Rentanoo metterà a disposizione i documenti necessari per il... | Rentanoo stellt die für Ihre Akte nötigen Unterlagen bereit ... |
| `documents.title` | Les documents : on vous facilite la vie | Documents: we make it easy for you | I documenti: te ne facilitiamo la vita | Dokumente: wir machen es Ihnen einfach |
| `faq.a1` | Non. S'il y a des réparations, seule la partie correspondant... | No. If there are repairs, only the part corresponding to rea... | No. Se ci sono riparazioni, solo la parte corrispondente ai ... | Nein. Bei Reparaturen kann nur der Teil einbehalten werden, ... |
| `faq.a2` | Uniquement si un dommage est confirmé et chiffré (devis/fact... | Only if damage is confirmed and quoted (estimate/invoice), t... | Solo se un danno è confermato e quotato (preventivo/fattura)... | Nur wenn ein Schaden bestätigt und geschätzt ist (Kostenvora... |
| `faq.a3` | Selon les cas, l'assurance du véhicule peut impliquer des dé... | Depending on the case, vehicle insurance may involve specifi... | A seconda dei casi, l'assicurazione del veicolo può implicar... | Je nach Fall kann die Fahrzeugversicherung bestimmte Abläufe... |
| `faq.a4` | Souvent oui. Beaucoup de cartes incluent une couverture (con... | Often yes. Many cards include coverage (conditions vary). Ca... | Spesso sì. Molte carte includono una copertura (condizioni v... | Oft ja. Viele Karten bieten Deckung (Bedingungen variieren).... |
| `faq.a5` | Selon le cas : facture, justificatifs, éléments du dossier e... | Depending on the case: invoice, supporting documents, file e... | A seconda del caso: fattura, giustificativi, elementi del fa... | Je nach Fall: Rechnung, Nachweise, Aktenunterlagen und nützl... |
| `faq.a6` | Vous pourrez nous répondre et échanger avec l'équipe. L'obje... | You can reply and discuss with the team. The goal: a fair, d... | Potrai rispondere e discutere con il team. L'obiettivo: una ... | Sie können antworten und mit dem Team besprechen. Das Ziel: ... |
| `faq.a7` | Le loueur a jusqu'à 48h pour chiffrer. Ensuite, Rentanoo vér... | The owner has up to 48h to quote. Then Rentanoo verifies the... | Il proprietario ha fino a 48h per fare il preventivo. Poi Re... | Der Vermieter hat bis zu 48h zum Schätzen. Dann prüft Rentan... |
| `faq.intro` | Questions fréquentes — on répond simplement. | Frequently asked questions — we answer simply. | Domande frequenti — rispondiamo in modo semplice. | Häufig gestellte Fragen — wir antworten einfach. |
| `faq.q1` | Vais-je être débité de toute ma caution ? | Will my entire deposit be charged? | Sarà addebitata tutta la mia cauzione? | Wird meine gesamte Kaution abgebucht? |
| `faq.q2` | Quand est-ce qu'un montant peut être retenu ? | When can an amount be withheld? | Quando può essere trattenuto un importo? | Wann kann ein Betrag einbehalten werden? |
| `faq.q3` | Pourquoi ne pas passer directement par l'assurance du véhicule ? | Why not go directly through the vehicle insurance? | Perché non passare direttamente dall'assicurazione del veicolo? | Warum nicht direkt über die Fahrzeugversicherung? |
| `faq.q4` | Puis-je faire jouer l'assurance de ma carte bancaire ? | Can I use my card insurance? | Posso fare valere l'assicurazione della mia carta? | Kann ich meine Kartenversicherung nutzen? |
| `faq.q5` | Quels documents vais-je recevoir ? | What documents will I receive? | Quali documenti riceverò? | Welche Dokumente erhalte ich? |
| `faq.q6` | Et si je ne suis pas d'accord avec le montant ? | What if I disagree with the amount? | E se non sono d'accordo con l'importo? | Was, wenn ich mit dem Betrag nicht einverstanden bin? |
| `faq.q7` | Quels sont les délais ? | What are the deadlines? | Quali sono i termini? | Welche Fristen gelten? |
| `hero.bullet1` | Aucun débit immédiat | No immediate charge | Nessun addebito immediato | Keine sofortige Belastung |
| `hero.bullet2` | La caution n'est pas prélevée automatiquement | The deposit is not charged automatically | La cauzione non viene addebitata automaticamente | Die Kaution wird nicht automatisch abgebucht |
| `hero.bullet3` | Elle sert uniquement (si besoin) à avancer les frais réels | It only serves (if needed) to advance real costs | Serve solo (se necessario) ad anticipare i costi reali | Sie dient nur (falls nötig) dazu, die tatsächlichen Kosten vorzuschießen |
| `hero.bullet4` | Jamais au-delà du montant justifié | Never beyond the justified amount | Mai oltre l'importo giustificato | Niemals über den begründeten Betrag hinaus |
| `hero.ctaContact` | Contacter Rentanoo | Contact Rentanoo | Contattare Rentanoo | Rentanoo kontaktieren |
| `hero.ctaProcess` | Comprendre la procédure | Understand the procedure | Comprendere la procedura | Das Verfahren verstehen |
| `hero.description` | Un petit incident peut arriver pendant une location. Ici, on... | A small incident can happen during a rental. Here we explain... | Un piccolo incidente può capitare durante un noleggio. Qui t... | Ein kleiner Unfall kann während einer Miete passieren. Hier ... |
| `hero.subtitle` | Sinistre & caution | Damage & deposit | Danni e cauzione | Schaden & Kaution |
| `hero.tip` | Astuce : gardez ce lien, il est prévu pour être partagé depuis nos emails. | Tip: keep this link, it's meant to be shared from our emails. | Consiglio: tieni questo link, è pensato per essere condiviso dalle nostre email. | Tipp: Behalten Sie diesen Link, er ist zum Teilen aus unseren E-Mails gedacht. |
| `hero.title` | Pas de panique : on reste zen, et on avance étape par étape. | Don't panic: we stay calm and take it step by step. | Niente panico: restiamo calmi e procediamo passo dopo passo. | Keine Panik: Wir bleiben gelassen und gehen Schritt für Schritt vor. |
| `illustration.assurance` | Illustration assurance (carte bancaire / protection) | Insurance illustration (card / protection) | Illustrazione assicurazione (carta / protezione) | Versicherung-Illustration (Karte / Schutz) |
| `illustration.caution` | Illustration caution (montant justifié) | Deposit illustration (justified amount) | Illustrazione cauzione (importo giustificato) | Kaution-Illustration (begründeter Betrag) |
| `illustration.cta` | Illustration zen + process (locataire) | Zen + process illustration (renter) | Illustrazione zen + processo (noleggiatore) | Zen + Prozess-Illustration (Mieter) |
| `illustration.documents` | Illustration documents (facture / pièces) | Documents illustration (invoice / papers) | Illustrazione documenti (fattura / pratiche) | Dokumente-Illustration (Rechnung / Unterlagen) |
| `illustration.faq` | Illustration FAQ / assistance | FAQ / support illustration | Illustrazione FAQ / assistenza | FAQ / Support-Illustration |
| `illustration.hero` | Illustration header (couple zen + scooter, Nosy Be) | Header illustration (relaxed couple + scooter, Nosy Be) | Illustrazione header (coppia rilassata + scooter, Nosy Be) | Header-Illustration (entspanntes Paar + Roller, Nosy Be) |
| `illustration.process` | Illustration process (timeline / étapes) | Process illustration (timeline / steps) | Illustrazione processo (timeline / tappe) | Prozess-Illustration (Zeitplan / Schritte) |
| `illustrationComingSoon` | Illustration à venir (nous l'ajouterons ensuite) | Illustration coming soon (we'll add it later) | Illustrazione in arrivo (la aggiungeremo successivamente) | Illustration in Kürze (wir fügen sie später hinzu) |
| `mailSubject` | Petit point suite à votre état des lieux de retour | Quick update following your return inspection | Breve aggiornamento dopo il tuo stato di consegna | Kurze Zusammenfassung nach Ihrer Rückgabebesichtigung |
| `metaDescription` | En cas d'incident pendant votre location : procédure sinistr... | In case of incident during your rental: damage and deposit p... | In caso di incidente durante il noleggio: procedura sinistro... | Bei Schaden während Ihrer Miete: Verfahren, Kaution, Kartenv... |
| `metaTitle` | Sinistre & caution \| RENTANOO - Location Nosy Be | Damage & deposit \| RENTANOO - Nosy Be rental | Danni e cauzione \| RENTANOO - Noleggio Nosy Be | Schaden & Kaution \| RENTANOO - Vermietung Nosy Be |
| `process.step1Desc` | Le loueur estime précisément les réparations nécessaires. | The owner estimates the repairs needed precisely. | Il proprietario stima precisamente le riparazioni necessarie. | Der Vermieter schätzt die erforderlichen Reparaturen genau ab. |
| `process.step1Title` | 1) Chiffrage du loueur (48h max) | 1) Owner's quote (48h max) | 1) Preventivo del proprietario (max 48h) | 1) Schätzung des Vermieters (max. 48h) |
| `process.step2Desc` | On s'assure que les montants sont cohérents, justifiés et documentés. | We ensure amounts are consistent, justified and documented. | Ci assicuriamo che gli importi siano coerenti, giustificati e documentati. | Wir stellen sicher, dass die Beträge stimmig, begründet und dokumentiert sind. |
| `process.step2Title` | 2) Vérification Rentanoo | 2) Rentanoo verification | 2) Verifica Rentanoo | 2) Rentanoo-Prüfung |
| `process.step3Desc` | Rien ne se fait "dans votre dos". On vous tient au courant avant toute action. | Nothing happens "behind your back". We keep you informed before any action. | Niente si fa "alle tue spalle". Ti teniamo aggiornato prima di ogni azione. | Nichts passiert "hinter Ihrem Rücken". Wir halten Sie vor je... |
| `process.step3Title` | 3) Information + suite | 3) Information + next steps | 3) Informazione + prossimi passi | 3) Information + nächste Schritte |
| `process.subtitle` | On garde les choses simples : le loueur chiffre, Rentanoo vé... | We keep things simple: the owner quotes, Rentanoo verifies, ... | Teniamo le cose semplici: il proprietario fa il preventivo, ... | Wir halten es einfach: Der Vermieter schätzt, Rentanoo prüft... |
| `process.title` | Comment ça se passe, très concrètement | How it works, in concrete terms | Come funziona, concretamente | So funktioniert es, ganz konkret |

## TAUXCHANGEPAGE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `ctaRent` | Voir les scooters | Browse scooters | Vedi gli scooter | Roller ansehen |
| `ctaText` | Comparez les modèles disponibles et confirmez en ligne — liv... | Compare available models and confirm online — delivery to Fa... | Confronta i modelli e conferma online — consegna aeroporto F... | Modelle vergleichen und online bestätigen — Lieferung Flugha... |
| `ctaTitle` | Réservez votre scooter avec prix en € et Ar | Book your scooter with € and Ar prices | Prenota lo scooter con prezzi in € e Ar | Roller mit €- und Ar-Preisen buchen |
| `ctaWeather` | Météo Nosy Be | Nosy Be weather | Meteo Nosy Be | Wetter Nosy Be |
| `eyebrow` | Madagascar · MGA | Madagascar · MGA | Madagascar · MGA | Madagaskar · MGA |
| `faq.items` | [{'q': "Quel est le taux Euro Ariary aujourd'hui à Madagasca... | [{'q': "What is today's Euro Ariary rate in Madagascar?", 'a... | [{'q': 'Qual è il cambio Euro Ariary oggi?', 'a': 'Aggiornat... | [{'q': 'Aktueller Euro-Ariary-Kurs?', 'a': 'Täglich über Fra... |
| `faqTitle` | Questions fréquentes — change Madagascar | FAQ — Madagascar exchange rate | FAQ — Cambio Madagascar | FAQ — Wechselkurs Madagaskar |
| `historyHint` | Données Frankfurter — le taux réel en bureau de change ou ba... | Frankfurter data — actual exchange office or bank rates may vary slightly. | Dati Frankfurter — i cambi locali possono variare leggermente. | Frankfurter-Daten — Wechselstuben können leicht abweichen. |
| `historyTitle` | Évolution du taux EUR → Ariary (14 derniers jours) | EUR → Ariary trend (last 14 days) | Andamento EUR → Ariary (14 giorni) | EUR → Ariary Verlauf (14 Tage) |
| `intro` | Suivez le cours EUR/MGA utilisé pour vos achats à Madagascar... | Track the EUR/MGA rate for your spending in Madagascar: toda... | Segui il cambio EUR/MGA per le spese in Madagascar: tasso de... | EUR/MGA-Kurs für Ausgaben in Madagaskar: Tageskurs, Verlauf ... |
| `liveLabel` | Taux du jour | Today's rate | Tasso del giorno | Tageskurs |
| `liveSource` | Taux de référence Frankfurter (mise à jour quotidienne). | Frankfurter reference rate (updated daily). | Tasso di riferimento Frankfurter (aggiornamento quotidiano). | Frankfurter-Referenzkurs (täglich aktualisiert). |
| `manualSource` | Taux indicatif configuré par Rentanoo pour l'affichage des prix. | Indicative rate set by Rentanoo for price display. | Tasso indicativo Rentanoo per la visualizzazione dei prezzi. | Indikativer Kurs von Rentanoo für die Preisanzeige. |
| `seoBlock` | L'ariary (MGA) est la monnaie officielle de Madagascar. Le t... | The ariary (MGA) is Madagascar's official currency. The Euro... | L'ariary (MGA) è la moneta ufficiale. A Nosy Be gli euro son... | Der Ariary (MGA) ist die offizielle Währung. In Nosy Be werd... |
| `seoBlockTitle` | Comprendre le change Euro Ariary à Madagascar | Understanding Euro Ariary exchange in Madagascar | Capire il cambio Euro Ariary a Madagascar | Euro Ariary in Madagaskar verstehen |
| `tableDate` | Date | Date | Data | Datum |
| `tableRate` | 1 € en Ariary (MGA) | 1 € in Ariary (MGA) | 1 € in Ariary (MGA) | 1 € in Ariary (MGA) |
| `title` | Taux de change Euro / Ariary Madagascar | Euro to Ariary exchange rate Madagascar | Cambio Euro / Ariary Madagascar | Euro Ariary Wechselkurs Madagaskar |

## VEHICLE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `fuel.diesel` | Diesel | Diesel | ❌ `Diesel` | ❌ `Diesel` |
| `fuel.electric` | Électrique | Electric | ❌ `Électrique` | ❌ `Électrique` |
| `fuel.gasoline` | Essence | Gasoline | ❌ `Essence` | ❌ `Essence` |
| `fuel.hybrid` | Hybride | Hybrid | ❌ `Hybride` | ❌ `Hybride` |
| `places` | {{count}} places | {{count}} seats | ❌ `{{count}} places` | ❌ `{{count}} places` |
| `places_one` | {{count}} place | {{count}} seat | ❌ `{{count}} place` | ❌ `{{count}} place` |
| `places_other` | {{count}} places | {{count}} seats | ❌ `{{count}} places` | ❌ `{{count}} places` |
| `transmission.automatic` | Automatique | Automatic | ❌ `Automatique` | ❌ `Automatique` |
| `transmission.manual` | Manuelle | Manual | ❌ `Manuelle` | ❌ `Manuelle` |

## VOLSNOSYBEPAGE

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `arrivalsTitle` | Arrivées | Arrivals | Arrivi | Ankünfte |
| `ctaExchange` | Taux Euro / Ariary | Euro / Ariary rate | Cambio Euro / Ariary | Euro / Ariary Kurs |
| `ctaRent` | Louer un scooter | Rent a scooter | Noleggia uno scooter | Roller mieten |
| `ctaText` | Réservez votre scooter avec livraison aéroport — casque incl... | Book your scooter with airport delivery — helmet included, 100% online booking. | Prenota lo scooter con consegna in aeroporto. | Scooter mit Flughafen-Lieferung buchen. |
| `ctaTitle` | Atterrissez sereinement à Nosy Be | Land in Nosy Be with peace of mind | Atterra sereno a Nosy Be | Sorgenfrei in Nosy Be landen |
| `ctaWeather` | Météo Nosy Be | Nosy Be weather | Meteo Nosy Be | Wetter Nosy Be |
| `dayToday` | Aujourd'hui | Today | Oggi | Heute |
| `dayTomorrow` | Demain | Tomorrow | Domani | Morgen |
| `departuresTitle` | Départs | Departures | Partenze | Abflüge |
| `eyebrow` | Aéroport Fascène · NOS | Fascène Airport · NOS | Aeroporto Fascène · NOS | Flughafen Fascène · NOS |
| `faq.items` | [{'q': "Quel est le code IATA de l'aéroport de Nosy Be ?", '... | [{'q': 'What is Nosy Be airport IATA code?', 'a': 'NOS (Fasc... | [{'q': 'Codice IATA Nosy Be?', 'a': 'NOS (Fascène).'}, {'q':... | [{'q': 'IATA-Code Nosy Be?', 'a': 'NOS (Fascène).'}, {'q': '... |
| `faqTitle` | Questions fréquentes — vols Nosy Be | FAQ — Nosy Be flights | FAQ — Voli Nosy Be | FAQ — Flüge Nosy Be |
| `forecastHint` | Programme sur 7 jours à partir d'aujourd'hui (heure Nosy Be)... | 7-day schedule from today (Nosy Be time). Data refreshed twice daily. | Programma su 7 giorni da oggi (ora Nosy Be). Dati aggiornati 2 volte al giorno. | 7-Tage-Programm ab heute (Nosy-Be-Zeit). Daten 2× täglich aktualisiert. |
| `forecastTitle` | Choisir un jour | Pick a day | Scegli un giorno | Tag wählen |
| `intro` | Consultez les horaires des vols à l'aéroport de Nosy Be Fasc... | Check flight schedules at Nosy Be Fascène airport: upcoming ... | Orari voli all'aeroporto Fascène: prossimi arrivi e partenze... | Flugzeiten am Flughafen Nosy Be Fascène: nächste Ankünfte un... |
| `nextArrival` | Prochaine arrivée | Next arrival | Prossimo arrivo | Nächste Ankunft |
| `nextDeparture` | Prochain départ | Next departure | Prossima partenza | Nächster Abflug |
| `noFlights` | Aucun vol prévu dans la fenêtre affichée | No flights in the displayed window | Nessun volo nella finestra visualizzata | Keine Flüge im angezeigten Zeitraum |
| `notConfigured` | Les horaires de vols seront affichés dès activation de la so... | Flight schedules will appear once the data source (AeroDataBox) is activated. | Gli orari voli saranno mostrati dopo l'attivazione di AeroDataBox. | Flugzeiten werden angezeigt, sobald AeroDataBox aktiviert ist. |
| `officialDisclaimerLink` | Horaires officiels sur nosybe-airport.aero | Official schedules on nosybe-airport.aero | Orari ufficiali su nosybe-airport.aero | Offizielle Flugzeiten auf nosybe-airport.aero |
| `officialDisclaimerText` | Les horaires affichés ici proviennent d'une source tierce (A... | Schedules shown here come from a third-party source (AeroDat... | Gli orari mostrati provengono da una fonte terza (AeroDataBo... | Die hier angezeigten Zeiten stammen von einer Drittquelle (A... |
| `officialDisclaimerTitle` | Horaires indicatifs — vérifiez sur le site officiel | Indicative times — check the official airport site | Orari indicativi — consulta il sito ufficiale | Indikative Zeiten — offizielle Flughafenseite prüfen |
| `seoBlock` | L'aéroport Fascène dessert Nosy Be avec des liaisons princip... | Fascène airport serves Nosy Be with connections mainly from ... | Rentanoo consegna il tuo scooter direttamente in aeroporto — prenota online. | Rentanoo liefert Ihren Roller direkt am Flughafen Fascène — ... |
| `seoBlockTitle` | L'aéroport de Nosy Be Fascène (NOS) | Nosy Be Fascène Airport (NOS) | Aeroporto Nosy Be Fascène (NOS) | Flughafen Nosy Be Fascène (NOS) |
| `sourceNote` | Source : AeroDataBox. Horaires indicatifs actualisés 2 fois ... | Source: AeroDataBox. Indicative times refreshed twice daily ... | Fonte: AeroDataBox. Orari indicativi, aggiornati 2 volte al ... | Quelle: AeroDataBox. Indikative Zeiten, 2× täglich aktualisi... |
| `tableAirline` | Compagnie | Airline | Compagnia | Airline |
| `tableFlight` | Vol | Flight | Volo | Flug |
| `tableFrom` | Provenance | From | Provenienza | Von |
| `tableStatus` | Statut | Status | Stato | Status |
| `tableTime` | Heure | Time | Ora | Zeit |
| `tableTo` | Destination | To | Destinazione | Nach |
| `title` | Vols Nosy Be — arrivées et départs | Nosy Be flights — arrivals & departures | Voli Nosy Be — arrivi e partenze | Flüge Nosy Be — Ankünfte & Abflüge |
| `unavailable` | Horaires vols temporairement indisponibles | Flight schedules temporarily unavailable | Orari voli temporaneamente non disponibili | Flugdaten vorübergehend nicht verfügbar |

## WHATSAPP

| Clé | FR | EN | IT | DE |
|-----|----|----|----|----|
| `contactOnly` | Contact WhatsApp uniquement | WhatsApp contact only | Contatto solo WhatsApp | Nur WhatsApp-Kontakt |
| `contactOnlyShort` | WhatsApp uniquement | WhatsApp only | Solo WhatsApp | Nur WhatsApp |
| `directLine` | Ligne directe | Direct line | Linea diretta | Direkte Linie |
| `directLineAria` | Appelez-nous au +261 37 34 379 12 | Call us at +261 37 34 379 12 | Chiamaci al +261 37 34 379 12 | Rufen Sie uns an unter +261 37 34 379 12 |
| `directLineShort` | Appelez-nous | Call us | Chiamaci | Rufen Sie uns an |
| `floatingBubbleMessage` | Bonjour ! Je suis Chris, le gérant de Rentanoo. Je suis disp... | Hello! I'm Chris, the manager of Rentanoo. I'm here to answer your questions. | Ciao! Sono Chris, il responsabile di Rentanoo. Sono disponib... | Hallo! Ich bin Chris, der Leiter von Rentanoo. Ich beantworte gerne Ihre Fragen. |
| `floatingBubbleResponseHint` | Réponse habituelle sous 2 h. | Typical reply within 2 hours. | Risposta di solito entro 2 ore. | Antwort in der Regel innerhalb von 2 Stunden. |
| `floatingButtonAria` | Contacter Rentanoo sur WhatsApp | Contact Rentanoo on WhatsApp | Contatta Rentanoo su WhatsApp | Rentanoo über WhatsApp kontaktieren |
| `floatingDragHint` | Maintenir pour déplacer | Hold to move | Tenere premuto per spostare | Gedrückt halten zum Verschieben |
| `sendEmail` | Envoyez un email | Send an email | Invia un'email | E-Mail senden |

## RÉSUMÉ

### Nombre de clés par langue

| Langue | Clés présentes | Clés manquantes |
|--------|---------------|-----------------|
| FR | 1158 | 1 |
| EN | 1157 | 2 |
| IT | 921 | 238 |
| DE | 921 | 238 |

### Clés manquantes par section — IT

- **accommodationCard** : 2 clés manquantes
- **accommodationDetails** : 16 clés manquantes
- **booking** : 15 clés manquantes
- **bookings** : 2 clés manquantes
- **common** : 2 clés manquantes
- **contact** : 2 clés manquantes
- **explorerFilters** : 59 clés manquantes
- **footer** : 4 clés manquantes
- **homeFilters** : 1 clés manquantes
- **homeResults** : 17 clés manquantes
- **listingOwner** : 22 clés manquantes
- **listingTerms** : 36 clés manquantes
- **locationArea** : 14 clés manquantes
- **ownerVehicles** : 27 clés manquantes
- **pricing** : 5 clés manquantes
- **profile** : 1 clés manquantes
- **seo** : 4 clés manquantes
- **vehicle** : 9 clés manquantes

### Clés manquantes par section — DE

- **accommodationCard** : 2 clés manquantes
- **accommodationDetails** : 16 clés manquantes
- **booking** : 15 clés manquantes
- **bookings** : 2 clés manquantes
- **common** : 2 clés manquantes
- **contact** : 2 clés manquantes
- **explorerFilters** : 59 clés manquantes
- **footer** : 4 clés manquantes
- **homeFilters** : 1 clés manquantes
- **homeResults** : 17 clés manquantes
- **listingOwner** : 22 clés manquantes
- **listingTerms** : 36 clés manquantes
- **locationArea** : 14 clés manquantes
- **ownerVehicles** : 27 clés manquantes
- **pricing** : 5 clés manquantes
- **profile** : 1 clés manquantes
- **seo** : 4 clés manquantes
- **vehicle** : 9 clés manquantes

### Top 10 clés prioritaires manquantes (absent IT + DE, présent FR)

- `accommodationCard.filterLabel` : Hébergement
- `explorerFilters.empty.accommodation.bungalow.description` : Revenez bientôt pour découvrir nos nouveaux hébergements.
- `footer.copyright` : © 2025 RENTANOO. Tous droits réservés.
- `explorerFilters.empty.cta.request` : Faire une demande
- `explorerFilters.empty.scooter.description` : Cette sélection sera disponible prochainement sur Rentanoo.
- `explorerFilters.comingSoon` : Bientôt disponible
- `explorerFilters.sub.car.luxe` : Luxe
- `explorerFilters.sub.accommodation.appartement` : Appartement
- `contact.errorNetwork` : Impossible de contacter le serveur. Vérifiez votre connexion internet.
- `accommodationDetails.errors.bookingError.title` : Erreur de réservation
