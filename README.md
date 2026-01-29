🥂 Vibe Checker ✨

Vibe Checker on intiimin kommunikaation työkalu, joka on suunniteltu poistamaan painostus ja väärinkäsitykset toiveiden ilmaisusta. Se mahdollistaa turvallisen ja leikkisän tavan neuvotella yhteisistä hetkistä reaaliajassa.
🚀 Kehityshistoria & Päivitykset (Changelog)
v1.0 - v1.4: Perusta

    Firebase Integration: Otettu käyttöön Firestore-tietokanta reaaliaikaista datan siirtoa varten.

    Session Management: Luotu "Kutsu kumppani" -järjestelmä uniikeilla ID-linkeillä.

    Selection Grid: Toteutettu perusvalinnat (Tunnelma, Fokus, Mausteet).

v1.5: Neuvottelumoodi (Negotiation Mode)

    Partner B Logic: Lisätty mahdollisuus vastaanottaa ehdotus, muokata sitä tai hyväksyä se "Quick Accept" -toiminnolla.

    LocalStorage History: Ensimmäinen versio historiasta, joka tallentaa toteutuneet sessiot selaimeen.

    Visual Overhaul: Lasimainen (Glassmorphism) tumma teema rose-gold -korostuksilla.

v1.6: "The Transparency Update" (Nykyinen vaihe)

    Enhanced Match Visualization: Uusi loppunäkymä, joka vertailee 15 eri kategoriaa.

        Kultaiset Matchit: Automaattinen korostus yhteisille valinnoille.

        Divergence Logic: Selkeä, läpinäkyvä näyttö eroaville toiveille (esim. eri asuvalinnat).

    Notification System: * Selainilmoitukset (Notification API).

        Visuaaliset "Badge"-ilmoitukset ja otsikon välkkyminen.

        Värinäpalaute mobiililaitteille.

    Mobile UX Optimization:

        Sticky Footer: Ohjausnapit pysyvät ruudun alareunassa skrollattaessa.

        Smooth Scroll: "Muokkaa"-nappi hyppää suoraan lomakkeen alkuun.

    Detailed History: Tallentaa nyt koko vertailun sisällön, ei vain pääotsikoita.

🛠️ Tekninen pino (Tech Stack)

    Frontend: HTML5, CSS3 (Custom Variables, Flexbox, Grid), JavaScript (ES6+).

    Backend: Firebase Firestore (Realtime Database).

    Hosting: Vercel / Netlify.

    Notification Engine: Web Audio API & Browser Notification API.

📋 Suunnitellut jatkokehitykset (Roadmap)

    Time Slider Enhancement: Valitun kellonajan reaaliaikainen visuaalinen näyttö.

    Interactive History: Mahdollisuus avata vanhoja sessioita ja nähdä koko Match/Divergence-raportti uudelleen.

    Hätänollaus (Reset): Toiminto, jolla käyttäjä voi tyhjentää kaiken paikallisen datan ja nollata jumittuneen session.

    Security Hardening: Firebase-sääntöjen tiukentaminen tuotantokäyttöön.

🛡️ Tietosuoja

Vibe Checker on suunniteltu yksityisyyttä kunnioittaen.

    Sessiot ovat anonyymejä (vain ID-pohjaisia).

    Historia tallentuu ainoastaan käyttäjän omaan selaimeen (localStorage).

    Data poistuu tietokannasta, kun sessio nollataan.
