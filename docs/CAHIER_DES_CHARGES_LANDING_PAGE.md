# Cahier des charges — Page landing Rentanoo
> Template de référence · Basé sur les bugs réels rencontrés lors des Phases 14–16

---

## 1. Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `src/pages/seo/LocationXxxNosyBePage.tsx` | Créer |
| `src/App.tsx` | Ajouter route + lazy import |
| `scripts/generate-sitemap.js` | Ajouter entrée (priorité 0.9, changefreq weekly) |
| `src/components/seo/SeoHebergementPageTemplate.tsx` | Ajouter dans `RELATED_LINKS` de toutes les pages existantes |

Route App.tsx : toujours utiliser `React.lazy(() => import(...))` — jamais d'import statique.

---

## 2. Fetch des véhicules

### 2.1 — Limit = 40 minimum ⚠️ BUG VÉCU
Avec 22 scooters en base, `limit: 20` coupait le catalogue.
Toujours mettre `limit: 40` ou plus. Ne jamais supposer qu'il y a moins de 20 véhicules d'un type.

### 2.2 — Guard React 18 StrictMode ⚠️ BUG VÉCU
Sans guard, le `useEffect` se déclenche 2× en développement.

```tsx
const fetchedRef = useRef(false);
// Début du useEffect :
if (fetchedRef.current) return;
fetchedRef.current = true;
```

### 2.3 — Véhicule épinglé : UUID complet, requête séparée ⚠️ BUG VÉCU

- Ne jamais utiliser le champ `license` (absent en base — fallback sur `id.substring(0,8)`)
- Ne jamais utiliser `.ilike("id", "prefix%")` — échoue silencieusement sur les colonnes UUID en PostgREST
- Toujours hardcoder l'UUID complet et utiliser une requête dédiée parallèle :

```tsx
const PINNED_UUID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

// Dans Promise.all() avec les autres fetches :
const fetchPinned = (supabase as any)
  .from("vehicles")
  .select("*, location_areas(id, name, slug, active)")
  .eq("id", PINNED_UUID)
  .limit(1)
  .then((res: any) => res.data?.[0] ?? null);
```

---

## 3. Fetch des photos

### 3.1 — Filtre HEIC + tri created_at DESC ⚠️ BUG VÉCU
Les fichiers HEIC ne s'affichent pas dans le navigateur.
Trier par `created_at DESC` en secondaire pour que les nouvelles photos uploadées apparaissent avant les éventuels fantômes.

```tsx
supabase
  .from("vehicle_photos")
  .select("vehicle_id, photo_url")
  .in("vehicle_id", ids)
  .not("photo_url", "ilike", "%.heic%")
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: false })
```

### 3.2 — Photos du véhicule épinglé : fetch séparé ⚠️ BUG VÉCU
Le `.in("vehicle_id", ids)` peut rater l'ID du véhicule épinglé selon le typage Supabase.
Toujours ajouter un fetch dédié et fusionner :

```tsx
const pinnedPhotoRows = await supabase
  .from("vehicle_photos")
  .select("vehicle_id, photo_url")
  .eq("vehicle_id", PINNED_UUID)
  .not("photo_url", "ilike", "%.heic%")
  .order("created_at", { ascending: false })
  .then(r => r.data ?? []);

// Fusion sans doublons :
const allRows = [...(rows ?? []), ...pinnedPhotoRows.filter(r => !rows?.some(x => x.photo_url === r.photo_url))];
```

### 3.3 — onError sur chaque `<img>` ⚠️ REQUIS
Si une photo est supprimée du storage mais que le row BD existe encore, l'image 404 doit être silencieusement retirée du carrousel.

```tsx
const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
const validPhotos = photos.filter(url => !failedUrls.has(url));

// Sur chaque <img> :
<img
  src={url}
  onError={() => setFailedUrls(prev => new Set([...prev, url]))}
  alt="..."
/>
```

### 3.4 — `key={url}` sur CarouselItem, pas `key={i}` ⚠️ BUG VÉCU
Quand une photo est retirée par `onError`, React doit rekeyer les slides restants avec l'URL (stable) et non l'index (qui change).

---

## 4. Suppression de photos (PhotoService)

### 4.1 — deletePhoto() doit supprimer Storage ET BD en parallèle ⚠️ BUG CRITIQUE
Supprimer uniquement le fichier storage crée des "fantômes" en BD.
La landing page charge ensuite des URLs 404 et affiche des images cassées.

```ts
const [storageResult, dbResult] = await Promise.all([
  supabase.storage.from(BUCKET_NAME).remove([fullPath]),
  supabase.from("vehicle_photos").delete().eq("photo_url", photoUrl),
]);
```

---

## 5. Contenu statique

### 5.1 — Photo fondateur : URL unique, projet Supabase correct ⚠️ BUG VÉCU
L'ancienne URL (`ovfvtbcz…supabase.co`) est un projet désactivé.

```
https://tbsgzykqcksmqxpimwry.supabase.co/storage/v1/object/public/photo%20fondateur/photo%20techer%20christopher%20.png
```

Dimensions : `width={160} height={160}`, classe `h-24 w-24 md:h-44 md:w-44`.

### 5.2 — Prix dans la FAQ : vérifier en base avant de rédiger ⚠️ BUG VÉCU
Les prix hardcodés dans la FAQ étaient faux (25–50 €/j au lieu de 10 €/j).
Toujours vérifier le prix réel via Supabase MCP (projet `tbsgzykqcksmqxpimwry`) avant de rédiger la réponse FAQ.

---

## 6. Structure de la page (ordre des sections)

```
1. Hero gradient + compteur véhicules disponibles
2. Grille cards véhicules (carrousel + badges + prix EUR + Ar)
3. Trust strip (3 badges réassurance)
4. Section fondateur (photo + texte)
5. HowItWorksTimeline
6. FAQ + modal annulation
7. SeoCtaPanel
8. Liens SEO discrets (bas de page, style texte)  ← PAS de boutons outline
9. Footer
10. Sticky CTA mobile
```

### 6.1 — Liens SEO : style texte discret uniquement ⚠️ BUG VÉCU
Ne jamais utiliser `Button variant="outline"` pour les `RELATED_LINKS` sur les pages landing.

```tsx
<nav aria-label="Pages connexes Rentanoo" className="mt-10 border-t border-border/40 pt-6">
  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
    Découvrir aussi à Nosy Be
  </p>
  <div className="flex flex-wrap gap-x-5 gap-y-2">
    {RELATED_LINKS.map((l) => (
      <Link key={l.href} to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
        {l.label}
      </Link>
    ))}
  </div>
</nav>
```

---

## 7. Checklist de validation avant push

- [ ] `npm run build` passe sans erreur TypeScript
- [ ] Route ajoutée dans App.tsx + lazy import
- [ ] Sitemap mis à jour (priorité 0.9, changefreq weekly)
- [ ] `RELATED_LINKS` de toutes les pages existantes mis à jour
- [ ] UUID complet du véhicule épinglé vérifié via Supabase MCP
- [ ] Prix FAQ vérifiés en base (pas hardcodés)
- [ ] URL photo fondateur = projet `tbsgzykqcksmqxpimwry`
- [ ] `fetchedRef` guard présent dans useEffect
- [ ] `onError` présent sur tous les `<img>` du carrousel
- [ ] `key={url}` sur CarouselItem (pas `key={i}`)
- [ ] `deletePhoto()` supprime Storage + BD en parallèle
- [ ] Liens SEO en bas de page, style texte discret (pas de boutons)

---

## 8. Informations projet

- Supabase project ID : `tbsgzykqcksmqxpimwry`
- Déploiement : Railway (auto-deploy sur push `main`)
- Stack : React 18 + Vite + TypeScript + Tailwind + React Router v6
- `getListingLicense(v)` = `(v.license ?? v.id.substring(0, 8)).toUpperCase()` — champ `license` absent en base, toujours fallback UUID prefix
