# ⚡ QUICK START - v2.6 DEPLOYMENT

## 📥 **TIEDOSTOT VALMIINA:**

1. ✅ `index.html` - Mobile-optimized, no PWA
2. ✅ `app.js` - On-demand Firebase, Vibe Story prep
3. ✅ `style.css` - iOS safe areas

## 🚀 **DEPLOY (3 ASKELTA):**

```bash
# 1. KORVAA TIEDOSTOT
# Lataa /mnt/user-data/outputs/ -hakemistosta:
# - index.html
# - app.js  
# - style.css

# 2. GIT PUSH
git add index.html app.js style.css
git commit -m "v2.6-stable: On-demand Firebase + iOS safe areas"
git push

# 3. WAIT (~2min)
# Vercel/Netlify deployaa automaattisesti
```

---

## 🧪 **TESTAA HETI:**

### **Test 1: Ei onSnapshot**
```
Avaa DevTools → Network tab
Luo sessio → Ei pitkäaikaisia yhteyksiä ✅
```

### **Test 2: Manual refresh**
```
Partner A: Luo + lähetä
Partner B: Avaa linkki → Klikkaa "Tarkista päivitykset" ✅
```

### **Test 3: Mobile (iOS)**
```
Avaa iPhonella
Scrollaa alas → Footer ei peitä nappeja ✅
```

---

## 🎯 **MITÄ MUUTTUI:**

### **BEFORE:**
❌ onSnapshot → Selain blokkaa
❌ Service Worker → Konfliktit
❌ Footer peittää napit (mobile)

### **AFTER:**
✅ .get() on-demand → Ei blokkauksia
✅ No SW → Ei konflikteja  
✅ Safe areas → Napit näkyvissä

---

## 📱 **USER WORKFLOW:**

```
Partner A:
1. Luo sessio
2. Täytä lomake
3. Lähetä
4. Klikkaa "Tarkista päivitykset" (manuaalisesti)

Partner B:
1. Avaa linkki
2. Lomake esitäytetty
3. Muokkaa/Hyväksy
4. Lähetä
5. Klikkaa "Tarkista päivitykset"

Match:
→ Results screen
→ Vibe Story data valmis (Phase 2.7)
```

---

## 🐛 **JOS ONGELMIA:**

### **Ei näy "Tarkista päivitykset" nappia:**
```javascript
// Tarkista Console:
const btn = document.getElementById('check-updates-btn');
console.log(btn); // Pitäisi näyttää elementin

// Jos null → ID-virhe HTML:ssä
```

### **"Safe area ei toimi":**
```css
/* Tarkista meta tag (index.html): */
<meta name="viewport" content="... viewport-fit=cover">

/* Tarkista CSS: */
:root {
    --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}
```

### **"onSnapshot vielä käytössä":**
```bash
# Tarkista että app.js on päivitetty:
grep "onSnapshot" app.js
# Ei pitäisi löytyä (paitsi kommentissa)
```

---

## ✅ **VAHVISTUS TUOTANNOSSA:**

```bash
# 1. Avaa Console (F12)
# 2. Luo sessio
# 3. Tarkista:

console.log(state.vibeStoryParams);
// Pitäisi näyttää objekti (ei undefined)

console.log(state.vibeStoryReady);
// false (ennen matchia)
// true (matchin jälkeen)
```

---

## 🎉 **KUN TOIMII:**

**Seuraavat askeleet:**
1. ✅ Testaa tuotannossa
2. ✅ Vahvista että Edge/Firefox toimii
3. ✅ Testaa iOS Safari
4. ✅ Kun kaikki OK → Phase 2.7 (Vibe Story AI)

---

**VALMIS DEPLOYATTAVAKSI! 🚀**

