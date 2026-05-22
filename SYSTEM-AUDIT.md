# 🔍 Audit Système Release-OnlyMatt

Date: May 22, 2026

## ✅ Points déjà corrigés

### 1. Upload iPhone HEIC → JPEG
- **Problème**: Content-Type mismatch entre HEIC et JPEG après compression
- **Solution**: Force `image/jpeg` après compression
- **Status**: ✅ Corrigé + logging ajouté

---

## ⚠️ Problèmes potentiels identifiés

### 1. 🔴 CORS R2 (CRITIQUE)
**Impact**: Upload bloqué sur tous les navigateurs/mobiles

**Action requise**: Configurer CORS sur Cloudflare R2
```json
[
  {
    "AllowedOrigins": [
      "https://release.onlymatt.ca",
      "https://release-onlymatt.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Où**: Cloudflare Dashboard → R2 → Bucket `release-onlymatt` → Settings → CORS Policy

---

### 2. 🟡 Google Maps API Key manquante
**Impact**: AddressAutocomplete ne fonctionne pas (silencieux)

**Localisation**: `components/AddressAutocomplete.tsx:7`
```typescript
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
```

**Test**: Si `KEY === ""`, l'autocomplete ne charge jamais
**Solution**: 
1. Créer une clé API Google Maps: https://console.cloud.google.com
2. Activer "Places API (New)"
3. Ajouter sur Vercel: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`

**Fallback**: L'input manuel fonctionne, mais pas d'autocomplete

---

### 3. 🟡 Signature Pad sur iOS (touch-action)
**Impact**: Scroll involontaire pendant signature sur iPhone

**Localisation**: `components/SignaturePad.tsx:33`
```typescript
style: { touchAction: "none" }
```

**Status**: ✅ Déjà configuré correctement
**Note**: Nécessite `touch-none` sur le div parent aussi

**Amélioration possible**:
```tsx
<div className="w-full rounded-md border border-input bg-white touch-none overflow-hidden">
```
✅ Déjà présent - OK!

---

### 4. 🟢 Variables d'environnement manquantes (détection)
**Impact**: Erreurs cryptiques si config incomplète

**Variables critiques**:
- ✅ `TURSO_DATABASE_URL` - vérifié dans `lib/db.ts`
- ✅ `TURSO_AUTH_TOKEN` - vérifié dans `lib/db.ts`
- ✅ `R2_ENDPOINT` - vérifié dans `lib/r2.ts`
- ✅ `R2_ACCESS_KEY_ID` - vérifié dans `lib/r2.ts`
- ✅ `R2_SECRET_ACCESS_KEY` - vérifié dans `lib/r2.ts`
- ⚠️ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - pas de vérification (optionnel)
- ✅ `ADMIN_SECRET` - vérifié dans middleware

**Status**: Toutes les variables critiques ont une vérification throw Error

---

### 5. 🟢 API externe (OnlyCard notification)
**Impact**: Si onlymatt.ca est down, le consent est quand même enregistré

**Localisation**: `app/api/consent/submit/route.ts:158`
```typescript
try {
  await fetch(`https://me.onlymatt.ca/api/creators/...`);
} catch {
  // Non-blocking — consent is saved in DB regardless
}
```

**Status**: ✅ Déjà géré avec try-catch non-blocking

---

### 6. 🟢 Validation birthDate (18+)
**Impact**: Vérifier que le modèle a 18+ ans

**Localisation**: `components/ConsentForm.tsx:62`
```typescript
function getEighteenYearsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}
```

**Status**: ✅ Validation client-side OK
**Note**: Pas de validation côté serveur de l'âge minimum

**Amélioration recommandée**:
```typescript
// Dans /api/consent/submit/route.ts
const birthDate = new Date(p.birthDate);
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
if (birthDate > eighteenYearsAgo) {
  return NextResponse.json(
    { error: "Model must be at least 18 years old" },
    { status: 422 }
  );
}
```

---

### 7. 🟡 R2 Object existe déjà (overwrite)
**Impact**: Si 2 uploads rapides, peut écraser

**Localisation**: `components/FileUploadZone.tsx`

**Risque**: Le `contractId` est généré avec `uid` qui change à chaque render, mais si l'utilisateur recharge la page pendant l'upload...

**Status**: ⚠️ Risque faible (edge case)

**Amélioration possible**: Vérifier si l'objet existe avant PUT
- Complexité ajoutée vs bénéfice minimal
- Recommendation: **laisser tel quel**

---

### 8. 🟢 Mobile viewport et zoom
**Impact**: Pinch-to-zoom peut causer problèmes sur formulaires

**Localisation**: `app/layout.tsx`

**Status**: ⚠️ Pas de `viewport` meta configuré

**Amélioration recommandée**:
```typescript
export const metadata: Metadata = {
  title: "OnlyMatt Model Release",
  description: "Digital model release forms and consent management",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};
```

**Note**: `maximum-scale=1` peut nuire à l'accessibilité. Alternative:
```typescript
viewport: "width=device-width, initial-scale=1, user-scalable=yes",
```

---

### 9. 🟢 Network timeout (fetch)
**Impact**: Upload longue durée sur connexion lente = timeout?

**Localisation**: Tous les `fetch()` n'ont pas de timeout explicite

**Status**: ⚠️ Par défaut, pas de timeout sur `fetch()` en browser
- Navigateur gère son propre timeout (généralement 5min+)
- Vercel Edge Function timeout: 25s (hobby) / 60s (pro)

**Amélioration possible**: AbortController avec timeout
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

**Recommendation**: **Pas nécessaire** pour ce use case
- Les images sont compressées < 1MB
- Upload R2 direct est très rapide

---

### 10. 🟡 SignaturePad vide non détecté
**Impact**: Utilisateur peut "signer" sans dessiner

**Localisation**: `components/SignaturePad.tsx:18`

**Status**: ⚠️ `onChange` est appelé même si canvas vide

**Amélioration recommandée**:
```typescript
const handleEnd = useCallback(() => {
  if (sigRef.current?.isEmpty()) {
    onChange("");
    return;
  }
  const dataUrl = sigRef.current?.toDataURL("image/png");
  if (dataUrl) onChange(dataUrl);
}, [onChange]);
```

**Validation côté serveur**: Déjà présente ✅
```typescript
if (!p.signatureData || !p.signatureData.startsWith("data:image/"))
```

---

## 📊 Résumé des priorités

### 🔴 CRITIQUE (à faire MAINTENANT)
1. **Configurer CORS sur R2** - Bloque tous les uploads

### 🟡 IMPORTANT (à faire bientôt)
2. **Ajouter Google Maps API Key** - Améliore UX adresse
3. **Valider âge 18+ côté serveur** - Sécurité légale
4. **Signature vide détection** - Améliore validation

### 🟢 NICE-TO-HAVE (optionnel)
5. Ajouter viewport meta pour mobile
6. Améliorer gestion timeout (edge case)

---

## 🧪 Tests recommandés après CORS

### Sur iPhone Safari:
1. ✅ Prendre photo avec caméra (HEIC)
2. ✅ Uploader photo existante de la galerie
3. ✅ Dessiner signature avec le doigt
4. ✅ Remplir adresse (avec/sans autocomplete)
5. ✅ Soumettre formulaire complet

### Console logs à surveiller:
```
[FileUpload] Compression error: ...
[FileUpload] Presigned URL error: ...
[FileUpload] R2 PUT failed: ...
[sign-url] Generated URL for: ...
```

### Erreurs attendues AVANT CORS:
```
Access to fetch at 'https://...r2.cloudflarestorage.com/...' from origin 'https://release.onlymatt.ca' has been blocked by CORS policy
```

### Succès attendu APRÈS CORS:
```
[sign-url] Generated URL for: contracts/abc-123/recto.jpg type: image/jpeg
✓ Uploaded (Badge vert)
```

---

## ✅ Ce qui fonctionne déjà bien

1. ✅ Compression d'images automatique
2. ✅ Validation formulaire complète
3. ✅ Gestion d'erreurs avec logging
4. ✅ Upload direct vers R2 (pas de serveur intermédiaire)
5. ✅ Auto-création du shoot si inexistant
6. ✅ Upsert contact par email
7. ✅ Protection admin par cookie
8. ✅ Touch-action:none sur signature pad
9. ✅ Dynamic imports pour composants client
10. ✅ Variables d'env vérifiées avec throw Error
