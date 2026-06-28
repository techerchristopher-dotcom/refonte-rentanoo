# Plan Redesign — Page d'accueil Rentanoo
> Produit avant le code. Version finale après autocritique.

---

## 1. Ancrage sujet

**Sujet :** Marketplace de réservation à Nosy Be (Madagascar). Véhicules (scooters 10€/j, motos, voitures, quads 50€/j) + hébergements (22–90€/nuit). Livraison aéroport Fascène ou hôtel. Assurance incluse.

**Audience :** Réunionnais 22–45 ans. Nosy Be = destination connue, ~3h de vol depuis Roland Garros. L'enjeu est de réserver à l'avance, depuis la Réunion, avant d'atterrir.

**Job de la page :** Convaincre que Rentanoo est la bonne plateforme pour organiser l'intégralité du séjour (déplacement + hébergement), et déclencher une recherche ou une réservation.

---

## 2. Système de tokens

### Couleurs

| Nom | Hex | Justification |
|-----|-----|---------------|
| `--ocean-deep` | `#0B1A1F` | Fond hero. Pas un noir générique — bleu-vert très sombre, comme la mer de nuit vue depuis l'avion. Différent de tout dark background AI par sa teinte directionnelle. |
| `--ocean` | `#097870` | Teal existant de la marque. **Conservé** : ancré dans le lagon, distinctif, cohérent avec le favicon existant. Ce n'est pas le "vert turquoise tropical" générique — c'est un teal profond. |
| `--ocean-glow` | `#0FBFB0` | Version vive du teal pour hovers, pulsing dot "Live". |
| `--ember` | `#E8622F` | Couchers de soleil volcaniques de Nosy Be. CTA principal + prix d'accroche. Contraste chaud/froid avec le teal. Non-AI : la justification est géographique (les laves/couchers de Nosy Be), pas esthétique. |
| `--sand` | `#F4F2EE` | Fond sections claires. Légèrement plus cool qu'une crème (#F4F1EA serait l'AI-default). Le distinguo est subtil mais réel. |
| `--night` | `#0D1E26` | Texte principal. Pas `#000` — même teinte océan dans les très foncés. |
| `--mist` | `#6B8A8D` | Texte secondaire, légendes. Gris teinté océan. |

### Typographie

| Rôle | Font | Justification |
|------|------|---------------|
| Display | `Space Grotesk` 700/800 | Grotesque géométrique-humaniste. Peu commune dans les marketplaces touristiques (contrairement à Poppins/Montserrat). Polyvalente pour titres courts et forts. Donne un caractère "startup sérieuse" sans corporate. |
| Body | `DM Sans` 400/500 | Humaniste propre, slightly warmer qu'Inter. Complémentaire de Space Grotesk sans créer de friction. |
| Utility | `DM Mono` 400 | Monospace pour : prix (10,00 €), températures (28°C), dates, références. Renforce le côté "données live" du concept Nosy Be Live. |

**Choix délibéré :** L'audit note l'absence totale de typographie de marque. Space Grotesk devient la signature typographique de Rentanoo.

### Échelle de taille

- Hero H1 : `4.5rem` (72px) desktop / `2.5rem` (40px) mobile
- Section H2 : `2rem` (32px) / `1.5rem` (24px)
- Eyebrow : `0.75rem` (12px), monospace, uppercase, letter-spacing élevé
- Prix : `1.25rem` (20px), DM Mono
- Body : `1rem` (16px) / `0.9375rem` (15px)

---

## 3. Layout concept

**Concept en une phrase :** "Un plongeon dans la nuit du lagon, qui remonte vers la lumière de l'île."

Le hero (dark) et la section catégories (dark, seamless) forment un bloc nuit/profondeur. Les sections suivantes (listings, comment ça marche, avis) passent au fond clair — lumière du jour, île au soleil. Le footer revient au teal profond.

```
╔═══════════════════════════════════════════════════════╗  ← ocean-deep
║  NAV transparente → fond white au scroll              ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║  Hero
║  [Live: ● 28°C · Lagon calme · ✈ Vol 14h20 FDU]      ║  ↑
║                                                       ║
║  Réserve ton scooter.                                 ║  H1 huge
║  Pose tes valises.                                    ║  2 lignes
║                                                       ║
║  [Arrivée] [Départ] [Catégorie ▾] [Chercher →]       ║  searchbar
║                                                       ║
║  ░░░░░░░░ [photo lagon, fade-in depuis le bas] ░░░░░  ║  ↓
╠═══════════════════════════════════════════════════════╣
║  ┌─────────────────┐  ┌─────────────────┐            ║  Catégories
║  │  [scooter img]  │  │  [villa img]    │            ║  (dark, 2 grandes
║  │  VÉHICULES      │  │  HÉBERGEMENTS   │            ║   "portes")
║  │  dès 10 €/jour  │  │  dès 22 €/nuit  │            ║
║  └─────────────────┘  └─────────────────┘            ║
╠═══════════════════════════════════════════════════════╣  ← sand/white
║  "Les plus réservés" — 4 cards 2×2 grid              ║  Listings
╠═══════════════════════════════════════════════════════╣
║  Comment ça marche — 3 étapes                        ║
╠═══════════════════════════════════════════════════════╣
║  Confiance — stats + avis                            ║
╠═══════════════════════════════════════════════════════╣  ← ocean (teal)
║  Footer                                              ║
╚═══════════════════════════════════════════════════════╝
```

---

## 4. Signature

**L'élément signature : la barre "Nosy Be Live"**

Une bande fine ancrée en haut du hero, avant le H1 :

```
● LIVE  · 🌡 28°C  ☀  · 💨 Vent 12 km/h  · 🌊 Lagon calme  · ✈ Prochain vol FDU→NOS : 14h20
```

- Typographie `DM Mono`, taille `0.75rem`
- Couleur ambre/ocean-glow (`#0FBFB0`) sur fond `ocean-deep`
- Le point `●` pulse (animation CSS `keyframes pulse`)
- Sur mobile : scrolling ticker horizontal

**Pourquoi c'est le bon choix de signature :**
Aucune marketplace de location à Nosy Be ne fait ça. C'est ancré dans l'usage réel : un Réunionnais qui planifie depuis La Réunion veut savoir si le temps est bon, si le lagon est calme, si son vol atterrit à l'heure. La barre "Live" dit immédiatement : "ce site connaît Nosy Be, il ne vend pas juste des fiches produit."

---

## 5. Copy (UX writing, tutoiement uniforme)

### Navbar
- Logo : `Rentanoo` + sous-label `Nosy Be` (très petit, mist)
- Liens : `Véhicules` | `Hébergements`
- CTA secondaire : `Connexion`
- CTA primaire : `Réserver →` (ember, pill shape)

### Hero
- **Eyebrow** : `Location · Nosy Be, Madagascar`
- **H1 ligne 1** : `Réserve ton scooter.`
- **H1 ligne 2** : `Pose tes valises.`
- **Sous-titre** : `Véhicules et hébergements livrés à l'aéroport Fascène ou à ton hôtel. Assurance incluse.`
- **Searchbar** : labels `Arrivée` / `Départ` / `Qu'est-ce que tu cherches ?` / bouton `Chercher`
- **Hint sous searchbar** : `→ Livraison à l'aéroport · Assurance incluse · Annulation flexible`

### Section catégories
- **Eyebrow** : `Tout Nosy Be en un seul endroit`
- **Card Véhicules** : titre `Véhicules` · sub `Scooter, moto, voiture, quad` · prix `dès 10 €/jour` · CTA `Voir les véhicules →`
- **Card Hébergements** : titre `Hébergements` · sub `Villa, maison, chambre d'hôtes` · prix `dès 22 €/nuit` · CTA `Voir les hébergements →`

### Section featured
- **H2** : `Les plus réservés cette semaine`
- **Badges** : `Véhicule` (ocean-glow) | `Hébergement` (ember/10%)
- **CTA card** : `Réserver` (pas "Commander" — cohérence vocabulaire audit)

### Section how it works
- **H2** : `Comment ça marche ?`
- **Étape 1** : `Tu choisis et tu réserves` — sub : `En ligne, depuis n'importe où. Paiement sécurisé.`
- **Étape 2** : `On livre à ton arrivée` — sub : `À l'aéroport Fascène ou à ton hôtel. Assurance incluse.`
- **Étape 3** : `Tu profites sans galère` — sub : `Nos équipes restent disponibles pendant tout ton séjour.`

### Section trust
- **Stat 1** : `340+` · label `avis clients`
- **Stat 2** : `4,8 / 5` · label `note moyenne`
- **Stat 3** : `30 min` · label `livraison à Fascène`
- **Testimonial 1** : _"Scooter livré à l'aéroport, pile à l'heure. Impeccable."_ — Mathieu R., La Réunion
- **Testimonial 2** : _"La villa était exactement comme sur les photos. Check-in en 2 minutes."_ — Camille D., Paris
- **Testimonial 3** : _"Assurance incluse et prix bien en dessous du marché local."_ — Kevin M., Île Maurice

### Footer
- Tagline : `Nosy Be comme tu l'imagines. Sans les galères.`

---

## 6. Autocritique — est-ce générique ou spécifique à Rentanoo ?

**Test : est-ce que ce plan sortirait pour une "marketplace de location en Thaïlande" ?**

- La barre Live avec conditions météo Nosy Be + vol depuis Roland Garros → ❌ non transférable
- H1 "Réserve ton scooter. Pose tes valises." → ❌ très spécifique à la proposition de valeur Nosy Be (mouvement + repos)
- La justification couleur ember (volcans/couchers Nosy Be) vs teal (lagon) → ❌ non transférable
- `DM Mono` pour les données Live → ✅ pourrait exister ailleurs — c'est une convention de lisibilité, pas un cliché

**Verdict : le plan est suffisamment ancré dans le sujet.** Le seul élément qui pourrait être générique est l'usage de DM Mono pour les données — mais c'est justifié par l'utilité, pas par l'esthétique.

**Ce que j'ai évité :**
- Fond crème + serif terracotta → ❌ évité
- Near-black + acid green → ❌ évité (le dark vient du teal profond, pas du #111)
- Style broadsheet → ❌ évité
- Hero "photo plein écran + overlay blanc + titre + bouton" → ❌ évité (l'image apparaît en bas, le texte sur fond sombre pur)
