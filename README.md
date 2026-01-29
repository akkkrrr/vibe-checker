# 🌙 Vibe Checker v1.5 - Negotiation Edition

**Vibe Checker** on intiimi ja tyylikäs kommunikaatiotyökalu, joka on suunniteltu auttamaan kumppaneita löytämään yhteinen sävel ilman painostusta. Sovellus mahdollistaa toiveiden ja rajojen tutkimisen turvallisessa, digitaalisessa ympäristössä reaaliajassa.



## ✨ Uudet ominaisuudet (v1.5)

* **Negotiation Mode:** Kumppani näkee toisen ehdotuksen pohjana ja voi muokata sitä tai hyväksyä sen sellaisenaan (Quick Accept).
* **Cyber-Luxury UI:** Täysin uusittu visuaalinen ilme, jossa hyödynnetään Glassmorphism-efektejä, kultaisia gradientteja ja tummaa teemaa.
* **Älykäs kierrosten hallinta:** Sovellus seuraa neuvottelukierroksia (`round`) ja hakee aina tuoreimman ehdotuksen Firebasesta.
* **Interaktiiviset kortit:** Moodit ja kellonajat on yhtenäistetty visuaalisesti; jokainen valinta hehkuu ja animoituu valittaessa.
* **Prefill-logiikka:** Kun liityt sessioon linkin kautta, sovellus esitäyttää valinnat automaattisesti kumppanin ehdotuksen perusteella.

## 🚀 Tekninen toteutus

* **Frontend:** Vanilla JS (ES6+), HTML5, CSS3 (Custom Variables & Advanced Animations).
* **Backend:** [Google Firebase Firestore](https://firebase.google.com/) - NoSQL-tietokanta reaaliaikaisilla kuuntelijoilla.
* **Hosting:** [Vercel](https://vercel.com/) - Jatkuva julkaisu (CI/CD) suoraan GitHubista.
* **Versionhallinta:** Kehitys pidetty hallittuna GitHub-historian avulla.

## 🛠️ Käyttöönotto

1.  **Repo:** `git clone https://github.com/[KÄYTTÄJÄNIMI]/vibe-checker.git`
2.  **Konfigurointi:** Päivitä oma `firebaseConfig` tiedostoon `app.js`.
3.  **Indeksit:** Jos käytät useita hakuehtoja, varmista että Firestoren indeksit on luotu (linkki löytyy selaimen konsolista virhetilanteessa).

## 📈 Roadmap

- [ ] **v2.0 Gamification:** XP-pisteet ja saavutukset avoimesta kommunikaatiosta.
- [ ] **Kamasutra-kirjasto:** Inspiraatiota ja uusia ideoita kokeiluihin.
- [ ] **Sessiohistoria:** Mahdollisuus tallentaa parhaat Matchit muistoksi.

## 📜 Lisenssi

Tämä projekti on avointa koodia ja tarkoitettu edistämään terveellistä, suostumukseen perustuvaa keskustelua parisuhteissa.

---
*Kehitetty vauhdilla, intohimolla ja ripauksella tekoälyä.*
