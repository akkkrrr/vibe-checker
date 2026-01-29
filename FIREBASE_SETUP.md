# 🔥 FIREBASE SETUP - TARKISTUSLISTA

## ✅ VAIHE 1: Tarkista Security Rules

1. Mene: https://console.firebase.google.com
2. Valitse projekti: **vibechecker-e4823**
3. Vasen valikko: **Firestore Database**
4. Ylhäällä: **Rules**-välilehti

### Oikeat säännöt (testausvaihe):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Sessions-kokoelma
    match /sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Proposals-kokoelma
    match /proposals/{proposalId} {
      allow read, write: if true;
    }
  }
}
```

### Jos näkyy jotain muuta:
- Korvaa KOKO Rules-osio yllä olevalla
- Klikkaa: **Publish**

---

## ✅ VAIHE 2: Tarkista että kokoelmat luodaan

1. Firestore Database → **Data**-välilehti
2. Kun luot ensimmäisen session, pitäisi ilmestyä:
   - `sessions` (kokoelma)
   - `proposals` (kokoelma)

### Jos ei ilmesty:
- Tarkista Console (F12) → Näkyykö virheitä?
- Tarkista että Security Rules on julkaistu

---

## ✅ VAIHE 3: Testaa toimivuus

### Testi 1: Luo sessio
```
1. Avaa: https://vibe-checkerv6.netlify.app
2. Klikkaa: "Luo kutsu"
3. → Session ID ilmestyy (esim. ABC123)
4. Firebase Consolessa: sessions/ABC123 pitäisi näkyä
```

### Testi 2: Lähetä valinnat
```
1. Valitse: Tunnelma + Fokus + Ajankohta
2. Klikkaa: "Lähetä valintani"
3. → Firebase: proposals/ABC123_partner_a_round1 pitäisi näkyä
```

### Testi 3: Realtime-päivitys
```
1. Laite A: Luo sessio + lähetä valinnat
2. Laite B: Avaa sama session-linkki
3. → Laite B näkee Partner A:n ehdotuksen ✅
```

---

## ⚠️ YLEISIMMÄT ONGELMAT:

### Ongelma: "Missing or insufficient permissions"
**Ratkaisu:** Security Rules on väärät → Vaihda `if false` → `if true`

### Ongelma: "Firestore is not defined"
**Ratkaisu:** Firebase CDN puuttuu → Tarkista index.html

### Ongelma: "Session ID not found"
**Ratkaisu:** Sessions-dokumenttia ei luotu → Tarkista createSession() funktio

---

## 📊 MITÄ TALLENNETAAN:

### sessions/{sessionId}
```json
{
  "status": "waiting" | "matched" | "cancelled",
  "currentRound": 1,
  "createdAt": timestamp
}
```

### proposals/{sessionId_userRole_roundN}
```json
{
  "sessionId": "ABC123",
  "userRole": "partner_a",
  "round": 1,
  "status": "pending" | "accepted" | "modified",
  "mood": "villi",
  "focus": "molemmat",
  "tempo": "energinen",
  "intensity": "intensiivinen",
  "control": "yhdessa-paatamme",
  "role": "vuorotellen",
  "time": "evening",
  "timeDisplay": "20:00",
  "details": {
    "communication": ["dirty-talk", "kuiskailu"],
    "toys": ["vibrator"],
    ...
  },
  "changes": null,
  "respondedTo": null,
  "createdAt": timestamp
}
```

---

## ✅ VALMIS!

Kun kaikki yllä olevat askeleet on tehty, Firebase-integraatio toimii täydellisesti!
