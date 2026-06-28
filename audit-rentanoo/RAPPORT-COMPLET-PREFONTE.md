# RAPPORT COMPLET PRÉ-REFONTE — RENTANOO
*Généré le 2026-06-28 — 5 agents parallèles*

---

## 1. DONNÉES RÉELLES SUPABASE

**Projet** : `tbsgzykqcksmqxpimwry` — eu-west-1

### 1.1 Schéma — 31 tables

| Table | RLS | Lignes | Rôle |
|---|---|---|---|
| `profiles` | ✅ | 30 | Utilisateurs (renter/owner/admin) |
| `vehicles` | ❌ **RLS ABSENT** | 43 | Catalogue véhicules + hébergements |
| `bookings` | ✅ | 82 | Réservations |
| `conversations` | ✅ | 43 | Messagerie |
| `messages` | ✅ | 35 | Messages |
| `vehicle_photos` | ✅ | 181 | Photos produits |
| `checkin_depart` | ❌ **RLS ABSENT** | 2 | EDL départ |
| `checkin_return` | ❌ **RLS ABSENT** | 2 | EDL retour |
| `payments` | ✅ | 0 | Legacy, inutilisée |
| `reviews` | ✅ | 0 | Avis — non lancé |
| `platform_settings` | ✅ | 5 | Taux EUR/MGA, frais, WhatsApp |
| `service_fee_rules` | ✅ | 10 | Frais par type + mode paiement |
| `deposit_category_rules` | ✅ | 5 | Règles caution par type |
| `booking_options` | ✅ | 4 | Options (chauffeur, transport) |
| `site_analytics_events` | ✅ | 2 880 | Analytics custom |
| `listing_owners` | ✅ | 12 | Propriétaires vitrines non-auth |
| `location_areas` | ✅ | 10 | Zones géographiques Nosy Be |
| `admin_booking_drafts` | ❌ **RLS ABSENT** | 0 | Brouillons admin walk-in |
| `parts / suppliers / repairs / repair_parts` | ✅ | 0–2 | Module atelier |
| `booking_claim_charges` | ✅ | 0 | Sinistres/charges caution |
| `cart_submissions` | ✅ | 0 | Soumissions panier |
| `dictionary_entries` | ✅ | 0 | Dictionnaire malgache — non lancé |

**⚠️ Anomalie sécurité** : `vehicles`, `checkin_depart`, `checkin_return`, `admin_booking_drafts` n'ont pas RLS. Les EDL (avec photos et signatures) sont lisibles publiquement.

### 1.2 Inventaire produits

| Type | Count | Prix min | Prix max |
|---|---|---|---|
| Scooter | 22 | 50 000 MGA/j | 50 000 MGA/j |
| Hébergement | 15 | 110 000 MGA/nuit | 900 000 MGA/nuit |
| Quad | 3 | 250 000 MGA/j | 250 000 MGA/j |
| Voiture | 2 | 100 000 MGA/j | 110 000 MGA/j |
| Moto | 1 | 60 000 MGA/j | 60 000 MGA/j |
| **TOTAL** | **43** | — | — |

- 181 photos pour 43 produits (4,2/produit) — aucun produit sans image
- Aucun `license_plate` renseigné dans la DB (colonne vide partout)
- Bug saisie caution scooters : 14 sur 22 ont une caution de 4 881 000 MGA (probable erreur de saisie)
- Taux EUR/MGA actuel en base : 5 000 MGA (mis à jour manuellement le 12/06/2026)
- Bookings actifs : aucun `confirmed` ou `paid` — 68 annulés, 8 refusés, 4 pending, 2 terminés

### 1.3 Storage — 13 buckets

| Bucket | Contenu |
|---|---|
| `vehicle-photos` | Photos produits (principal) |
| `checkin-photos` | Photos EDL départ/retour |
| `email-asset` | Assets emails transactionnels |
| `sinistre caution page` | Legacy (espace dans le nom) |
| `sinistre-caution-page` | Version corrigée |
| `platform-assets` | Logos, photo WhatsApp |
| `listing-owner-avatars` | Avatars propriétaires vitrine |
| `blog` | Images articles |
| `maison` | Images hébergements (source alternative) |
| `photo fondateur` | Photo profil fondateur (hardcodée dans SEO) |
| `repair-photos / scooter-docs / document vehicule` | Module atelier |

Pattern URL : `https://tbsgzykqcksmqxpimwry.supabase.co/storage/v1/object/public/{bucket}/{path}`

### 1.4 Edge Functions

| Fonction | Appelée depuis | Trigger |
|---|---|---|
| `create-checkout-session` | `src/lib/payerLocation.ts` | Paiement en ligne |
| `stripe-webhook` | Stripe (externe) | Events Stripe signés |

### 1.5 Dépendances externes

**Stripe** : Via Edge Functions. Checkout Session → webhook → `bookings.status = 'confirmed'`. Dépôt de garantie via SetupIntent + capture différée. Sinistres via `booking_claim_charges` (capture manuelle admin).

**n8n** (`n8n.srv1285649.hstgr.cloud`) :
| Webhook | Déclencheur |
|---|---|
| `/webhook/profiles-created` | Fin onboarding client |
| `/webhook/welcome-client` | Callback auth (email verification) |
| `/webhook/checkin-depart-updated` | Validation EDL départ |
| `/webhook/7da2e622-bc36-44b3-b716-68e088522a54` | Validation EDL retour |

**AeroDataBox** (RapidAPI) : Horaires vols NOS — côté serveur uniquement (`server/lib/nosyBeFlights.ts`). Dégradé silencieux si clé absente.

**Google Ads** : ID `AW-17959989720`, GA4 `G-WVKC4DHFL3`, GTM `GT-TXZW7HG8`. Labels conversion via env vars **non configurées en prod**. Meta Pixel présent.

**Paramètres plateforme** :
- Frais service : 10% carte, 15% cash
- Transport : hôtel 50 000 MGA, aéroport 80 000 MGA
- WhatsApp : `+33 6 33 70 75 69`

---

## 2. TUNNEL DE CONVERSION — ANALYSE DÉTAILLÉE

### Index — /

**Fichier** : `src/pages/Index.tsx`

**Données** : `vehicles` via `SupabaseVehiclesService.getAvailableVehicles()` / `searchAvailableVehicles()`. États : loading implicite, pas d'état error visible (catch silencieux, toast commenté), empty non géré (grille vide sans message), data.

**Composants** : `SearchBarAirbnb`, `HomeResults` (lazy), `HomeBlogPreview`, `HomeHeroTrustStrip`, `HomeDayContextStrip`, `Footer` (lazy), `Seo`, `LanguageSwitcher`.

**UX Copy** :
- H1 : `t("home.heroTitle", "Louez votre scooter à Nosy Be en quelques clics")` — fallback hardcodé mentionne uniquement "scooter"
- Erreur dates manquantes : `"Veuillez renseigner au moins un critère de recherche"`
- Toast restauration : `"Recherche restaurée"` — utilisé pour 2 événements distincts (confusion UX)

**Incohérences** : Le fallback H1 ne mentionne que "scooter" alors que la plateforme vend aussi voitures, motos, hébergements. 2 `useEffect` lisent `location.search` sans coordination → race condition potentielle.

**Bugs** :
- **9 console.log** en prod (lignes 96–607) — exposent prix calculés et contenu panier
- Toast d'erreur de chargement initial commenté → page blanche sans explication si Supabase échoue

**Complexité refonte** : Complexe — 9 états inter-dépendants, 8 useEffect, restauration localStorage avec délais setTimeout.

**Risque cassure** : 🔴 Critique — bug silencieux si Supabase échoue, données financières exposées en console.

---

### VehicleDetails — /vehicle/:license

**Fichier** : `src/pages/vehicles/VehicleDetails.tsx`

**Données** : `getVehicleByShortId(license)`, `PhotoService.getVehiclePhotos()`, `ProfileService.getCurrentUserProfile()`, `SupabaseBookingsService.createBooking()`. États : loading, error → navigate("/"), data.

**Incohérences** :
- Tutoiement ("Écris-nous sur WhatsApp") vs vouvoiement dans la modale téléphone ("nous avons besoin de votre numéro")
- "Caution : 400€" hardcodé (pas depuis DB)
- "Assurance multirisque fournie par AXA" hardcodé — potentiellement inexact
- `originalRate = Math.round(dailyRate * 1.2)` — faux prix barré +20% arbitraire

**Bugs** :
- **30+ console.log** en prod dont données utilisateur complètes (email, téléphone, nom)
- `isDatePickerOpen` utilisé mais jamais déclaré → **crash runtime garanti** si clic "Réserver" sans dates
- Avis Marie/Jean hardcodés avec note 5.0/24 — **faux avis en prod**

**Complexité refonte** : Très complexe — 30+ états, 6 useEffect, 3 modales, logique cart+booking+draft.

**Risque cassure** : 🔴 Critique — crash `isDatePickerOpen`, données personnelles en console.

---

### MotoVehicleDetails — /moto/:license

**Fichier** : `src/pages/vehicles/MotoVehicleDetails.tsx`

**Données** : `getAvailableVehicles()` (charge **TOUT** le catalogue) puis filtre côté client. Performance dégradée vs VehicleDetails qui fait une requête ciblée.

**Incohérences** :
- `fuelLabels`/`transmissionLabels` en dur français (hors i18n) vs VehicleDetails qui utilise `t()`
- `useTranslation()` sans namespace vs VehicleDetails avec `useTranslation("common")`
- Chargement N véhicules pour en trouver 1

**Bugs** :
- **15+ console.log** en prod incluant données utilisateur
- `isDatePickerOpen` non déclaré → même crash que VehicleDetails

**Complexité refonte** : Très complexe — copier-collé quasi-intégral de VehicleDetails avec divergences silencieuses.

**Risque cassure** : 🔴 Critique.

---

### AccommodationDetails — /hebergement/:license

**Fichier** : `src/pages/vehicles/AccommodationDetails.tsx`

**Même pattern** que MotoVehicleDetails + :
- Log `"🏍️ [DEBUG]"` (emoji moto) pour des hébergements — copier-collé non nettoyé
- `t("motoDetails.loading")` utilisé pour les hébergements — clé sémantiquement incorrecte
- `isDatePickerOpen` non déclaré probable → même crash

**Risque cassure** : 🔴 Critique.

---

### BookingDiscussion — /\*/booking/discussion

**Fichier** : `src/pages/booking/BookingDiscussion.tsx`

**Données** : `getAvailableVehicles()` (catalogue complet), `bookings`, `profiles`, `conversations`, `messages`. Subscriptions Realtime : messages (INSERT+DELETE), conversation (DELETE), booking (UPDATE).

**Bugs critiques** :
- **30+ console.log** en prod (certains hors `import.meta.env.DEV`)
- `bookingData` state React relu immédiatement après `setBookingData` → **fallback sessionStorage ne fonctionne jamais** (async React update)
- Boucle useEffect : `loadConversation` met à jour `currentBooking` → re-déclenche l'effet qui appelle `loadConversation`
- Hauteur fixe `h-[700px]` → **cassé mobile**
- Chemin photo hardcodé en fallback (`exterior_1759781792034_lm9xwpqf8e.jpg`)
- `t("motoDetails.back")` utilisé sur page de discussion générique
- Bouton "Nouvelle réservation" hardcodé en français sans clé i18n

**Complexité refonte** : Très complexe — Realtime multi-canaux, logique de rôle, PaymentFlowModal.

**Risque cassure** : 🔴 Critique.

---

### CartSubmit — /panier/soumettre

**Fichier** : `src/pages/cart/CartSubmit.tsx`

**Données** : `useCart()`, `ProfileService`, RPC `preview_renter_fee`, `SupabaseBookingsService.createBooking()` (boucle séquentielle), table `cart_submissions`, endpoint Express `/api/cart/notify`.

**Incohérences** : **Aucune clé i18n** — entièrement hardcodé en français. Mix tutoiement/vouvoiement selon le contexte (guest vs connecté).

**Bugs** :
- Boucle `for (const item of items)` séquentielle sans rollback — si item 2 échoue, item 1 est déjà créé en base
- `fetch("/api/cart/notify")` silencieux si `VITE_API_URL` absent
- Total peut être `estimatedPrice` sans frais de service si preview pas encore chargée au submit

**Complexité refonte** : Moyen.

**Risque cassure** : 🟡 Moyen — submit partiel possible.

---

### CartConfirmation — /panier/confirmation

**Fichier** : `src/pages/cart/CartConfirmation.tsx`

**Bugs** :
- Bouton "Voir mes réservations" → `/me/owner/bookings` — **route incorrecte pour un locataire** (devrait être `/me/renter/bookings`)
- Prénom "Christopher" hardcodé dans le copy — non paramétrable, non i18n

**Complexité refonte** : Simple.

**Risque cassure** : 🟡 Moyen — route incorrecte visibles par tous les locataires.

---

### PaymentSuccess — /success

**Fichier** : `src/pages/renter/PaymentSuccess.tsx`

**Flow Stripe** : `fetch("/api/stripe/session-details?session_id=...")` → vérification → conversions (GA4 + Meta) → `setTimeout(2000)` (attente webhook) → redirect `/me/renter/bookings` ou admin.

**Bugs** :
- **9 console.log** en prod (URL + session_id)
- `setTimeout(2000)` fixe pour attendre le webhook — fragile si réseau lent
- Pas de `stripe.redirectToCheckout` côté client (redirect via `payerLocation()` en Edge Function)

**Risque cassure** : 🟡 Moyen.

---

### PaymentCancel — /cancel

**Fichier** : `src/pages/renter/PaymentCancel.tsx`

Page statique sans CTA de retry ou retour vers le paiement. UX morte pour l'utilisateur.

**Risque cassure** : 🟢 Faible.

---

### Récapitulatif tunnel

**Flow Stripe complet** : `VehicleDetails → handleConfirmBooking() → createBooking() → navigate("/booking/discussion") → BookingDiscussion → handlePayNow() → PaymentFlowModal → payerLocation() [Edge Function] → Stripe Checkout → /success → redirect /me/renter/bookings`

**console.log tunnel** : ~80+ appels en prod à travers les pages de détail + BookingDiscussion. Données personnelles (email, téléphone, nom) et financières exposées en console navigateur.

**Variable `isDatePickerOpen` non déclarée** : crash runtime garanti sur VehicleDetails et MotoVehicleDetails quand l'utilisateur clique "Réserver" sans dates.

---

## 3. ESPACE OPÉRATEUR + AUTH

### Login — /auth/login

**Fichier** : `src/pages/auth/Login.tsx`

**Bugs** : Comptes démo hardcodés visibles en production (`renter@demo.fr`, `owner@demo.fr`, `admin@demo.fr` / mot de passe `demo`).

**Incohérences** : Banner panier tutoiement ("Connecte-toi") vs CardTitle vouvoiement ("Accédez").

**Risque cassure** : 🟢 Faible — supprimer les comptes démo avant prod.

---

### Register — /auth/register

**Fichier** : `src/pages/auth/Register.tsx`

**Bugs** : Flow post-inscription email incomplet — "J'ai confirmé mon email" redirige vers `/auth/login` sans garantie de passage par `/onboarding/client`.

**Risque cassure** : 🟡 Moyen.

---

### Callback — /auth/callback

**Fichier** : `src/pages/auth/Callback.tsx`

**Données** : `profiles` — SELECT + UPDATE `kyc_status` + UPDATE `welcome_email_sent_at`. Webhook n8n `welcome-client`.

**Bugs** : 14 console.log en prod exposant userId, kyc_status, email. Race condition possible entre `onAuthStateChange` et `tryGetSession` (anti-doublon `hasRunRef` mitige mais ne garantit pas).

**Risque cassure** : 🔴 Critique — point d'entrée KYC. Bug ici = utilisateur bloqué indéfiniment.

---

### ClientOnboarding — /onboarding/client

**Fichier** : `src/pages/onboarding/ClientOnboarding.tsx`

**Bugs** : `"Renvoyer l&apos;email"` dans un Button children JSX — s'affiche littéralement `"Renvoyer l&apos;email"` dans le navigateur pour tous les nouveaux inscrits.

**Risque cassure** : 🟡 Moyen — bug d'affichage visible immédiatement.

---

### Profile — /profile

**Fichier** : `src/pages/Profile.tsx` (2 128 lignes)

**Bugs** :
- Doublon de `window.addEventListener('error', handleError)` (lignes ~827 et ~862) → 2 toasts par erreur JS
- `hasError` state sans reset → page blanche permanente sur toute erreur non critique
- `calculateProfileCompletion()` appelée à chaque render sans `useMemo`
- Section permis partiellement hors i18n

**Risque cassure** : 🔴 Critique — page blanche permanente sur erreur non critique.

---

### OwnerBookings — /me/owner/bookings + OwnerBookingRequests + OwnerBookingDiscussion

**TODO CRITIQUES — 3 occurrences du même bug** :

```typescript
// OwnerBookings.tsx ~L493, OwnerBookingRequests.tsx ~L139, OwnerBookingDiscussion.tsx ~L312
const handleAcceptRequest = async (request) => {
  try {
    // TODO: Implémenter l'acceptation de la demande
    toast({ title: "Demande acceptée", ... }); // Toast affiché
    await loadData(); // Rien en base ne change
  }
};
const handleRejectRequest = async (request) => {
  try {
    // TODO: Implémenter le refus de la demande
    toast({ title: "Demande refusée", ... }); // Toast affiché
    await loadData(); // Rien en base ne change
  }
};
```

**Conséquence** : Un propriétaire ne peut ni accepter ni refuser une demande. L'UPDATE `bookings SET status = 'confirmed'/'refused'` n'est pas implémenté. Aucune notification au locataire. **Toute la confirmation de réservation côté opérateur est non-fonctionnelle.**

**Risque cassure** : 🔴 Critique — impact métier direct, bloquant pour le lancement.

---

### ManageVehicle — /me/owner/vehicles/:vehicleId/manage

**Fichier** : `src/pages/owner/ManageVehicle.tsx`

**Bugs** : 35 console.log. Refacto en cours (commentaires "🆕 REFACTO") — état transitionnel instable.

**Risque cassure** : 🔴 Critique — toucher pendant la refacto en cours = régression garantie.

---

### Checking / CheckinReturn — /checking/:bookingId + /checkin-return/:bookingId

**Flow EDL** :
1. Vérification `rental_contract_signed_at` sur `bookings`
2. Signature contrat → `bookings.rental_contract_signed_at` UPDATE
3. Formulaire EDL multi-sections → `checkin_depart` / `checkin_return` INSERT/UPDATE
4. Photos → Storage `checkin-photos`
5. Signatures canvas base64 → `checkin_depart.owner_signature` + `.renter_signature`

**Bugs** : TODO ligne ~409 dans checkin-return : `saveReturnStep4Interior` non implémentée dans le service.

**Risque cassure** : 🔴 Critique — flux légal avec signatures. Ne pas toucher sans tests bout en bout.

---

### Gestion des rôles Supabase

- Colonne `profiles.role` : string singular (`'renter'` | `'owner'` | `'admin'`)
- Couche applicative : `roles: [profile.role]` — tableau toujours de 1 élément
- Pas de multi-rôles en DB
- Promotion owner : `ProfileService.updateUserRole(userId, "owner")` dans `RentMyCarRegister.tsx`
- Admin : colonnes `is_admin` / `admin_role` séparées (legacy + nouveau système coexistent)

### Flow onboarding opérateur

1. `/rent-my-car` → marketing
2. CTA → `/rent-my-car/register` (redirect login non garanti si non connecté)
3. Formulaire → INSERT `vehicles` + UPDATE `profiles.role = 'owner'`
4. Redirect → `/me/owner/vehicles`
5. **Gap** : aucun KYC obligatoire avant publication (badge avertissement affiché mais ne bloque pas)

### Routes admin /admin/*

35 sous-routes couvrant : bookings, planning, revenue, settings (taux/WhatsApp/pricing), fleet, parts, workshop, reports, analytics, sales, suppliers, maintenance. Layout partagé : `AdminLayout.tsx`.

---

## 4. COMPOSANTS + I18N + DESIGN SYSTEM

### 4.1 Groupes composants

**Groupe 1 — Conserver (11 composants)** : ErrorBoundary, Seo, AutomaticTransmissionIcon, ManualTransmissionIcon, VehicleAvatar, ClientMgaPrice, DualPrice, PriceRows, SignatureCanvas, ZoomableImage, ShareButton, RequireAdmin, TranslatableDescription.

**Groupe 2 — Adapter (55+ composants — skin uniquement via CSS vars + typo)** : vehicle-card, moto-vehicle-card, VehicleCardRentalPricing, InteractiveCalendar, FilterBar, filtres (AdditionalFilters, PriceFilter, VehicleCategoryFilter, VehicleTypeFilter), ExplorerVisualFilters, AccommodationCard, OwnerBookingCard, RenterBookingCard, AdminBookingBadge, PaymentFlowModal, DepositFlowModal, BookingConfirmationModal, CartAddModal, CartDrawer, FuelLevelSlider, ExteriorInspectionAccordionSimple, VehicleOwnerCard, AccommodationHighlights, PaymentMethodSelector, OwnerDualCurrencyInput, LocationAreaSelect, CategoryShowcaseCard, HowItWorksTimeline, WhatsAppFloatingButton, ClientProfileCompletionGuard, LanguageSwitcher, SeoPageLayout, ListingDescriptionContent, SubmitProgressOverlay…

**Groupe 3 — Recréer (10 composants)** :
| Composant | Raison |
|---|---|
| `navbar` | Transparente → blanche au scroll + Space Grotesk — structure dark hero incompatible |
| `footer` | Fond teal profond + 4 colonnes — refonte structurelle complète |
| `HomeHeroTrustStrip` | Remplacé par le strip Live (28°C · Lagon calme · ✈ Vol 14h20) |
| `HomeDayContextStrip` | Même famille — à fusionner avec le nouveau strip |
| `HomeResults` | Grille 2×2 Featured + heading Space Grotesk — layout à refonder |
| `HomeBlogPreview` | Non prévu dans le plan redesign home |
| `search-bar-airbnb` | Searchbar la plus critique — [Arrivée][Départ][Catégorie ▾][Chercher] sur fond ocean-deep |
| `WaveDivider` | Outdated — direction Apple/Linear = transitions directes ou fine ligne |
| `VehicleServiceOptions_new` | Doublon avec `VehicleServiceOptions` — refacto inachevée, à unifier |
| `EmptyCategoryState` | Empty states Linear = illustration + CTA ember |

### 4.2 i18n — Couverture

| Langue | Clés totales | Manquantes | % couverture |
|---|---|---|---|
| FR | 1 158 | 0 | 100% |
| EN | 1 157 | 1 | 99,9% |
| IT | 921 | 237 | 79,5% |
| DE | 921 | 237 | 79,5% |

**Sections absentes en IT/DE** (les plus impactées par la refonte) :

| Section | FR | EN | IT | DE |
|---|---|---|---|---|
| vehicle | ✅ | ✅ | ❌ | ❌ |
| pricing | ✅ | ✅ | ❌ | ❌ |
| accommodationCard | ✅ | ✅ | ❌ | ❌ |
| locationArea | ✅ | ✅ | ❌ | ❌ |
| listingOwner | ✅ | ✅ | ❌ | ❌ |
| listingTerms | ✅ | ✅ | ❌ | ❌ |
| accommodationDetails | ✅ | ✅ | ❌ | ❌ |
| explorerFilters | ✅ | ✅ | ❌ (91%) | ❌ (91%) |
| homeResults | ✅ | ✅ | ❌ (85%) | ❌ (85%) |
| booking | ✅ | ✅ | ⚠️ 15 manq. | ⚠️ 15 manq. |
| ownerVehicles | ✅ | ✅ | ⚠️ 27 manq. | ⚠️ 27 manq. |
| footer | ✅ | ✅ | ⚠️ 4 manq. | ⚠️ 4 manq. |
| home | ✅ | ✅ | ✅ | ✅ |
| motoDetails | ✅ | ✅ | ✅ | ✅ |
| profile / bookings / dictionary / nav / whatsapp / sinistreCaution / meteo / taux / vols | ✅ | ✅ | ✅ | ✅ |

**À noter** : Les sections absentes en IT/DE correspondent exactement aux features les plus récentes. Traduire en parallèle de la refonte.

### 4.3 Design system — Delta actuel → cible

| Token | Actuel | Cible | Action |
|---|---|---|---|
| Primary color | `#0a6c75` (hsl 185,84%,25%) | `#097870` (`--ocean`) | Ajuster légèrement |
| Primary glow | `#45c5cc` | `#0FBFB0` (`--ocean-glow`) | Remplacer |
| Fond hero | `#f5f8f9` (clair) | `#0B1A1F` (`--ocean-deep`) | **Ajouter** — hero dark |
| CTA/Accent | `#f5cabc` (corail pâle) | `#E8622F` (`--ember`) | Remplacer — plus saturé |
| Background light | `#f5f8f9` | `#F4F2EE` (`--sand`) | Ajuster |
| Texte principal | `#191f20` | `#0D1E26` (`--night`) | Harmoniser |
| Texte secondaire | `#697577` | `#6B8A8D` (`--mist`) | Ajuster |
| Font display | **aucune** | Space Grotesk 700/800 | **Ajouter** — priorité absolue |
| Font body | système | DM Sans 400/500 | **Ajouter** |
| Font utility | **aucune** | DM Mono 400 (prix, dates) | **Ajouter** |
| Border radius base | 0.5rem | 0.75–1rem | Augmenter `--radius` |

**Gap critique** : Aucune typographie de marque n'existe. Aucun `@import` Google Fonts ni `@fontsource` dans `index.css` ni dans `tailwind.config`. Les 3 fonts sont à ajouter en priorité absolue.

**Composants shadcn en place** : ~45 composants Radix/shadcn standards (accordion à tooltip). Tous re-skinnables via CSS vars — aucun à remplacer, juste mettre à jour les variables.

---

## 5. SEO + ANNEXES + PERFORMANCE

### 5.1 Pages SEO

**Template** : `SeoCategoryPage.tsx` avec `react-helmet-async`, JSON-LD `FAQPage` + `BreadcrumbList`, fiches produits réelles depuis Supabase.

**Routes définies** :

| Route | Sitemap | État |
|---|---|---|
| `/location-scooter-nosy-be` | ✅ | Opérationnel |
| `/location-moto-nosy-be` | ✅ | Opérationnel |
| `/location-quad-nosy-be` | ✅ | Opérationnel |
| `/location-voiture-nosy-be` | ✅ | Opérationnel |
| `/location-4x4-nosy-be` | ❌ | Absent du sitemap |
| `/location-minibus-nosy-be` | ❌ | Absent du sitemap |
| `/location-vacances-nosy-be` | ✅ | Hub hébergement |
| `/location-appartement-nosy-be` | ✅ | Opérationnel |
| `/location-villa-nosy-be` | ✅ | Opérationnel |
| `/location-bungalow-nosy-be` | ❌ | Absent du sitemap |
| `/meteo-nosy-be` | ✅ | Opérationnel |
| `/taux-change-euro-ariary-madagascar` | ✅ | Opérationnel |
| `/vols-aeroport-nosy-be` | ✅ | Opérationnel |

**Placeholders visibles** :
- `"Photo à venir"` affiché si `primary_photo_url` null — visible utilisateur et potentiellement indexé (pas de problème actuel : 0 produit sans image)
- `/legal` : mention **"cette démonstration"** dans la CardDescription → contenu de démo non retiré
- `/sinistre-caution` : `<Seo noIndex />` — intentionnellement non indexé (à vérifier si définitif)

**Composant `Seo`** : manque `og:url`, `og:type`, `og:locale`.

### 5.2 Pages annexes

| Page | Source données | État |
|---|---|---|
| `/blog` + `/blog/:slug` | Fichier statique `src/data/blogPosts.ts` | **Absent du sitemap** |
| `/contact` | `POST /api/contact` — Zod + RHF | ~20 console.log en prod |
| `/legal` | Contenu réel JSX hardcodé | Mention "démo" à retirer |
| `/politique-annulation` | Contenu réel | OK |
| `/sinistre-caution` | Contenu réel + placeholders illustrations | noIndex actif |
| `/dictionary` + `/:id` | Supabase `DictionaryService` | Table vide — 0 entrées |

### 5.3 Performance

**console.log total** : **854 occurrences** dans `src/`

Top fichiers :
- `Contact.tsx` : ~20+ (expose données réseau utilisateur)
- `ExteriorInspectionAccordionSimple.tsx` : 14
- `useManageVehicle.ts` : 10
- `OwnerBookingCard.tsx` : 9
- `vehicleTemplate.ts` : 9

**Bundle prod** :

| Chunk | Taille |
|---|---|
| `index.js` principal | **929 KB** (très lourd) |
| `jspdf.es.min.js` | 404 KB |
| `Checking.js` | 292 KB |
| `html2canvas.esm.js` | 197 KB |
| `index.css` | 171 KB |

`jspdf` + `html2canvas` = 600 KB → à lazy-loader conditionnellement (uniquement quand l'état des lieux est ouvert).

**Lazy loading routes** : ✅ Toutes les routes non-Home sont lazy-loaded via `React.lazy()` + `Suspense`.

**Images** : 39 `loading="lazy"`, 32 `srcSet`. Pas de `preload` pour les fonts critiques.

### 5.4 Sitemap + robots

**sitemap.xml** : 25 URLs, `lastmod` 2026-06-27. Absences : `/blog`, `/blog/:slug`, `/location-4x4-*`, `/location-minibus-*`, `/location-bungalow-*`, `/dictionary`. Aucune fiche produit individuelle.

**robots.txt** :
```
User-agent: *
Disallow:
Sitemap: https://rentanoo.com/sitemap.xml
```
Tout autorisé. Pas de règles par bot (GPTBot, etc.).

---

## 6. MATRICE DE RISQUES CONSOLIDÉE

| Page / Feature | Risque | Raison | Mitigation |
|---|---|---|---|
| VehicleDetails, MotoVehicleDetails | 🔴 Critique | `isDatePickerOpen` non déclaré → crash runtime | Déclarer le state avant tout |
| Callback auth (`/auth/callback`) | 🔴 Critique | Point d'entrée KYC — bug = utilisateur bloqué | Retry sur UPDATE, retirer console.log |
| OwnerBookings / Requests / Discussion | 🔴 Critique | Accept/Reject sont des TODO vides — aucun UPDATE en base | Implémenter l'UPDATE bookings AVANT tout |
| Profile.tsx | 🔴 Critique | Doublon gestionnaire erreur + hasError sans reset = page blanche | Corriger les 2 bugs avant refonte |
| ManageVehicle | 🔴 Critique | Refacto en cours — état transitionnel | Finaliser extraction hook avant refonte visuelle |
| Checking / CheckinReturn | 🔴 Critique | Flux légal + signatures — step4 return non implémentée | Tests bout en bout obligatoires |
| RentMyCarRegister | 🔴 Critique | Contient la promotion de rôle owner | Ne pas casser cette logique |
| `vehicles` table (RLS absent) | 🔴 Critique | Données catalogue lisibles sans auth | Activer RLS avec policy publique en lecture |
| `checkin_depart / return` (RLS absent) | 🔴 Critique | Signatures et photos EDL publiques | Activer RLS — lecture owner/renter uniquement |
| CartSubmit | 🟡 Moyen | Submit séquentiel sans rollback | Wrapper try/catch par item + UI rollback |
| CartConfirmation | 🟡 Moyen | Route `/me/owner/bookings` pour les locataires | Corriger vers `/me/renter/bookings` |
| Register | 🟡 Moyen | Flow post-inscription incomplet | Ajouter redirect onboarding dans "J'ai confirmé" |
| BookingDiscussion | 🔴 Critique | Boucle useEffect + hauteur fixe mobile | Corriger les dépendances useEffect |
| Bundle JS 929 KB | 🟡 Moyen | jspdf/html2canvas chargés trop tôt | Lazy-loader conditionnellement |
| 854 console.log en prod | 🟡 Moyen | Données utilisateur et financières exposées | Script de suppression automatisée ESLint |
| Caution scooters (erreur saisie) | 🟡 Moyen | 14/22 scooters avec caution 4 881 000 MGA | Corriger via admin panel |
| Comptes démo hardcodés | 🟡 Moyen | Visible en production | Supprimer avant lancement |
| `/legal` mention "démonstration" | 🟡 Moyen | Contenu démo non retiré | Supprimer la phrase |

---

## 7. ORDRE D'ATTAQUE — REFONTE

### Phase 0 — Corrections bloquantes (AVANT toute refonte visuelle)

**Ces bugs doivent être corrigés en priorité absolue — ils bloquent le business aujourd'hui :**

1. **OwnerBookings/Requests/Discussion** — Implémenter `handleAcceptRequest` et `handleRejectRequest` : `UPDATE bookings SET status = 'confirmed'/'declined' WHERE id = bookingId` + notification locataire
2. **VehicleDetails + MotoVehicleDetails** — Déclarer `isDatePickerOpen` : `const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)`
3. **RLS Supabase** — Activer RLS sur `vehicles` (policy : SELECT public), `checkin_depart`, `checkin_return` (policy : SELECT owner OU renter de la réservation)
4. **Caution scooters** — Corriger les 14 scooters avec caution 4 881 000 MGA via admin
5. **`/me/renter/bookings`** — Corriger la route dans CartConfirmation (actuellement redirige vers `/me/owner/bookings`)

### Phase 1 — Design System + Typographie (2–3 jours)

**Prérequis pour tout le reste :**
- Ajouter les 3 fonts : `@fontsource/space-grotesk`, `@fontsource/dm-sans`, `@fontsource/dm-mono` (ou Google Fonts CDN)
- Mettre à jour `tailwind.config.ts` avec les tokens cibles (ocean-deep, ember, sand, mist)
- Mettre à jour les CSS vars dans `index.css`
- Mettre à jour les composants shadcn via les nouvelles CSS vars

**Dépendances bloquantes** : aucune — peut commencer immédiatement
**Tables Supabase nécessaires** : aucune
**Composants** : modifier uniquement les variables

### Phase 2 — Homepage refonte (3–5 jours)

1. **Navbar** (recréer) — transparente sur hero dark, blanche au scroll, Space Grotesk
2. **HomeLive strip** (recréer `HomeHeroTrustStrip`) — dot pulsant DM Mono, données météo/vols
3. **Hero** — fond ocean-deep, H1 "Réserve ton scooter. / Pose tes valises.", searchbar refondée
4. **SearchBarAirbnb** (recréer) — [Arrivée][Départ][Catégorie ▾][Chercher →] sur fond ocean-deep
5. **CategoryCards** — 2 grandes "portes" Véhicules + Hébergements, poids visuel identique
6. **HomeResults/Featured** (recréer) — grille 2×2, 4 listings mix véhicules/hébergements
7. **HowItWorks** — adapter, reskinner numéros ember
8. **Trust section** — adapter stats + testimonials
9. **Footer** (recréer) — fond ocean teal, 4 colonnes, tagline

**Tables nécessaires** : `vehicles`, `vehicle_photos`
**Composants** : vehicle-card (adapter), navbar/footer/searchbar (recréer)

### Phase 3 — Pages détail (5–8 jours)

1. **VehicleDetails** — après correction `isDatePickerOpen` — refonte visuelle layout 2+1 colonnes
2. **MotoVehicleDetails** — unifier avec VehicleDetails (refacto copier-collé)
3. **AccommodationDetails** — idem + nettoyer copier-collé moto
4. **BookingDiscussion** — corriger boucle useEffect et hauteur fixe, puis refonte visuelle

**Tables nécessaires** : `vehicles`, `vehicle_photos`, `bookings`, `conversations`, `messages`, `profiles`

### Phase 4 — Tunnel paiement (2–3 jours)

1. CartSubmit — ajouter i18n, corriger submit séquentiel
2. CartConfirmation — corriger route + retirer "Christopher" hardcodé
3. PaymentSuccess / Cancel — refonte visuelle + ajouter CTA retry sur Cancel

### Phase 5 — Espace opérateur (5–7 jours)

1. Auth pages (Login, Register, Callback, Onboarding) — après corrections
2. Profile — corriger doublon gestionnaire + hasError, puis refonte 2128 lignes
3. OwnerVehicles — corriger vérification `reservations` vs `bookings`
4. ManageVehicle — finaliser extraction hook, puis refonte
5. Checking / CheckinReturn — tests bout en bout obligatoires avant toute modification

### Phase 6 — SEO + Pages annexes (3–4 jours)

1. Pages SEO : retirer "Photo à venir" fallback, ajouter og:url/type/locale
2. `/legal` : retirer "démonstration"
3. Sitemap : ajouter `/blog`, `/blog/:slug`, 4x4/minibus/bungalow
4. robots.txt : ajouter règles GPTBot

### Phase 7 — i18n IT/DE (2–3 jours)

Compléter les 237 clés manquantes par langue, en priorité : `vehicle`, `pricing`, `listingTerms`, `explorerFilters`, `homeResults`.

### Phase 8 — Performance (1–2 jours)

1. Lazy-loader jspdf + html2canvas (conditions d'affichage de l'EDL)
2. Purge des 854 console.log via ESLint rule `no-console: error` en mode prod
3. Ajouter `preload` pour les 3 fonts dans `index.html`

---

## 8. 3 DÉPENDANCES À NE PAS CASSER

### 1. Flow Stripe + Edge Functions

**Chaîne** : `PaymentFlowModal → payerLocation.ts → supabase.functions.invoke("create-checkout-session", { bookingId }) → Stripe → /success → webhook Edge Function "stripe-webhook" → UPDATE bookings.status = 'confirmed'`

**Procédure de vérification post-migration** :
1. Créer une réservation test avec un scooter réel
2. Payer avec carte test Stripe `4242 4242 4242 4242`
3. Vérifier : `bookings.status` passe à `'confirmed'` dans Supabase
4. Vérifier : `/success` s'affiche et redirige vers `/me/renter/bookings`
5. Vérifier : le webhook n'est PAS appelé deux fois (vérifier `site_analytics_events`)

### 2. Authentification Supabase + Promotion de rôle owner

**Chaîne** : `supabase.auth.signUp → callback /auth/callback → UPDATE profiles.kyc_status = 'verified' → webhook n8n welcome-client → RentMyCarRegister → UPDATE profiles.role = 'owner'`

**Procédure de vérification** :
1. Créer un compte avec un email test
2. Confirmer via le lien email → vérifier `profiles.kyc_status = 'verified'` en base
3. S'inscrire comme opérateur via `/rent-my-car/register`
4. Vérifier `profiles.role = 'owner'` en base
5. Vérifier que `/me/owner/vehicles` est accessible avec ce compte

### 3. Flow État des Lieux + Signatures

**Chaîne** : `bookings.rental_contract_signed_at → EtatDesLieuxDepartForm → INSERT checkin_depart (owner_signature base64, renter_signature base64, photos Storage) → webhook n8n checkin-depart-updated → EtatDesLieuxRetourForm → INSERT checkin_return`

**Procédure de vérification** :
1. Utiliser une réservation `confirmed` de test
2. Signer le contrat → vérifier `bookings.rental_contract_signed_at` non null
3. Compléter l'EDL départ → vérifier INSERT dans `checkin_depart` avec les 2 signatures
4. Vérifier les photos dans Storage bucket `checkin-photos`
5. Compléter l'EDL retour → vérifier INSERT dans `checkin_return`
6. Ne pas toucher ces modules sans ce test complet

---

## 9. CHIFFRAGE COMPOSANTS

| Catégorie | Nombre |
|---|---|
| Composants à recréer ex-nihilo | **10** |
| Composants à adapter (skin CSS vars + typo) | **55+** |
| Composants à conserver tels quels | **11** |
| Pages à refondre (UI significative) | **20** |
| Tokens design à modifier/ajouter | **14** |
| Fonts à ajouter | **3** (Space Grotesk, DM Sans, DM Mono) |
| Clés i18n IT manquantes | **237** |
| Clés i18n DE manquantes | **237** |
| console.log à purger | **854** |
| Bugs bloquants à corriger avant refonte | **5** |
| TODO critiques non-implémentés | **3** (accept/reject réservation) |
| Tables sans RLS à sécuriser | **4** (vehicles, checkin_depart, checkin_return, admin_booking_drafts) |
