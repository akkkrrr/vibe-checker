/**
 * VIBE CHECKER - FIREBASE PRODUCTION VERSION
 * Alustettu käyttäjän vibechecker-e4823 projektille.
 */

// 1. FIREBASE KONFIGURAATIO
const firebaseConfig = {
    apiKey: "AIzaSyDc4Wz35pzGP-Udi1R4JtJWLtolQiRJzJo",
    authDomain: "vibechecker-e4823.firebaseapp.com",
    projectId: "vibechecker-e4823",
    storageBucket: "vibechecker-e4823.firebasestorage.app",
    messagingSenderId: "695043857671",
    appId: "1:695043857671:web:86f0a56ae2c6a586d479a2",
    measurementId: "G-2BYXXEHT4B"
};

// Alustus
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const state = {
    sessionId: null,
    userRole: null,
    theme: localStorage.getItem('theme') || 'dark'
};

// --- APUFUNKTIOT ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id + '-screen');
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
}

function notify(msg) {
    const n = document.createElement('div');
    n.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:10000; font-weight:600; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif;";
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.opacity = '0';
        n.style.transition = '0.5s';
        setTimeout(() => n.remove(), 500);
    }, 4000);
}

// --- SESSION HALLINTA ---
async function createSession() {
    // Generoidaan 6-merkkinen tunnus (esim. A1B2C3)
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
        await db.collection("sessions").doc(id).set({
            status: "waiting",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        state.sessionId = id;
        state.userRole = 'partner_a';
        document.getElementById('session-id-display').textContent = id;
        
        const url = window.location.origin + window.location.pathname + '?session=' + id;
        navigator.clipboard.writeText(url);
        
        notify("🔥 Sex Session ID: " + id + " - Linkki kopioitu leikepöydälle!");
        showScreen('selection');
    } catch (error) {
        console.error("Firebase Error:", error);
        notify("❌ Virhe: Varmista että Firestore Rules on asetettu!");
    }
}

// --- LÄHETYS (Kerää kaikki tiedot dynaamisesti) ---
async function submitSelection() {
    const details = {};
    let mood = null;
    let focus = null;

    // 1. Kerätään valitut kortit (Tunnelma, Fokus, Tempo jne.)
    document.querySelectorAll('.selected').forEach(el => {
        if (el.dataset.mood) mood = el.dataset.mood;
        if (el.dataset.focus) focus = el.dataset.focus;
        // Tallennetaan kaikki data-attribuutit details-objektiin
        Object.assign(details, el.dataset);
    });

    // 2. Kerätään kaikki checkboxit (Nylon, Asusteet, BDSM jne.)
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
        const category = c.name || 'extras';
        if (!details[category]) details[category] = [];
        details[category].push(c.value);
    });

    // 3. Tekstikenttä
    const wishes = document.querySelector('textarea');
    if (wishes) details.custom_wishes = wishes.value;

    if (!mood || !focus) {
        notify("❗ Valitse vähintään tunnelma ja fokus!");
        return;
    }

    try {
        await db.collection("proposals").add({
            sessionId: state.sessionId,
            userRole: state.userRole,
            mood: mood,
            focus: focus,
            details: details,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showScreen('results');
        notify("✅ Ehdotus lähetetty kumppanille!");
    } catch (error) {
        console.error(error);
        notify("❌ Lähetys epäonnistui!");
    }
}

// --- INTERAKTIOT ---
function setupEventListeners() {
    // Alun napit
    const createBtn = document.getElementById('create-session-btn');
    if (createBtn) createBtn.onclick = createSession;
    
    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;
    
    const joinBtn = document.getElementById('join-session-btn');
    if (joinBtn) {
        joinBtn.onclick = () => {
            const id = prompt("Syötä Session ID:");
            if (id) {
                state.sessionId = id.toUpperCase();
                state.userRole = 'partner_b';
                document.getElementById('session-id-display').textContent = state.sessionId;
                showScreen('selection');
            }
        };
    }

    // Dynaaminen korttien klikkaus (kaikki kategoriat)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });

    // Teeman vaihto
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', state.theme);
        };
    }
}

// KÄYNNISTYS
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    console.log("Vibe Checker Firebase Edition ready.");
});