/**
 * ================================================
 * VIBE CHECKER v2.5.1-COMPLETE-STABLE
 * ================================================
 */

// 1. Määritä oma API-avain tähän!
const firebaseConfig = {
    apiKey: "AIzaSyDc4Wz35pzGP-Udi1R4JtJWLtolQiRJzJo", 
    authDomain: "vibe-checker-eight.firebaseapp.com",
    projectId: "vibe-checker-eight",
    storageBucket: "vibe-checker-eight.appspot.com",
    messagingSenderId: "36737525164",
    appId: "1:36737525164:web:0f7457a46587c67c514571"
};

// Alustus
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- STATE ---
let state = {
    sessionId: null,
    userRole: null,
    mood: null,
    focus: null,
    intensity: 5,
    partnerData: null
};

let isSubmitting = false;
let isCreatingSession = false;
let unsubscribe = null;

// --- APUFUNKTIOT (SAFETY HELPERS) ---
function notify(msg, type = 'info') {
    const container = document.getElementById('notification-container');
    if (container) {
        const el = document.createElement('div');
        el.className = `notification ${type}`;
        el.textContent = msg;
        container.appendChild(el);
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        }, 4000);
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// --- FIREBASE LOGIIKKA ---
async function createSession() {
    if (isCreatingSession) return;
    isCreatingSession = true;
    
    try {
        const docRef = await db.collection("sessions").add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open',
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.sessionId = docRef.id;
        state.userRole = 'partner_a';
        
        updateUIForSession();
        showScreen('share-screen');
        notify('Istunto luotu!', 'success');
        startListening(state.sessionId);
    } catch (e) {
        console.error(e);
        notify('Yhteysvirhe tietokantaan', 'error');
    } finally {
        isCreatingSession = false;
    }
}

function updateUIForSession() {
    const link = `${window.location.origin}${window.location.pathname}?session=${state.sessionId}`;
    const input = document.getElementById('share-link-input');
    if (input) input.value = link;
    
    const display = document.getElementById('session-id-display');
    if (display) display.textContent = state.sessionId;
}

function startListening(id) {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection("sessions").doc(id).onSnapshot(doc => {
        if (doc.exists()) {
            const data = doc.data();
            const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
            state.partnerData = data[partnerRole] || null;
            console.log("Päivitys Firebasesta", data);
        }
    });
}

async function submitSelection() {
    if (isSubmitting || !state.sessionId) return;
    isSubmitting = true;

    const selection = {
        mood: state.mood || 'ei valittu',
        focus: state.focus || 'ei valittu',
        intensity: parseInt(state.intensity) || 5,
        timestamp: new Date().toISOString()
    };

    try {
        await db.collection("sessions").doc(state.sessionId).set({
            [state.userRole]: selection,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        notify('Valinnat lähetetty!', 'success');
    } catch (e) {
        console.error(e);
        notify('Lähetys epäonnistui', 'error');
    } finally {
        isSubmitting = false;
    }
}

// --- INITIALIZATION ---
function init() {
    console.log("🚀 Vibe Checker v2.5.1 Käynnistyy...");

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
        state.sessionId = sessionParam;
        state.userRole = 'partner_b';
        showScreen('input-screen');
        startListening(sessionParam);
        notify('Tervetuloa mukaan!', 'success');
    }

    // Nappien sidonnat (ID:t tarkistettu index.html:stä)
    const createBtn = document.getElementById('create-session-btn');
    if (createBtn) createBtn.onclick = createSession;

    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const input = document.getElementById('share-link-input');
            if (input) {
                input.select();
                document.execCommand('copy');
                notify('Kopioitu leikepöydälle!', 'success');
            }
        };
    }

    // Moodin valinta
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.onclick = () => {
            state.mood = btn.dataset.mood;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Fokus-valinta (Lisätty takaisin)
    document.querySelectorAll('.focus-btn').forEach(btn => {
        btn.onclick = () => {
            state.focus = btn.dataset.focus;
            document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Intensiteetti-slider
    const slider = document.getElementById('intensity-slider');
    const valDisplay = document.getElementById('intensity-value');
    if (slider) {
        slider.oninput = (e) => {
            state.intensity = e.target.value;
            if (valDisplay) valDisplay.textContent = e.target.value;
        };
    }

    // Ohje-modal
    const helpBtn = document.getElementById('global-help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            const modal = document.getElementById('help-modal');
            if (modal) modal.classList.add('active');
        };
    }
    
    const closeHelp = document.querySelector('.close-modal');
    if (closeHelp) {
        closeHelp.onclick = () => {
            document.getElementById('help-modal').classList.remove('active');
        };
    }

    // Resetointi
    const resetBtn = document.getElementById('emergency-reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('Nollataanko kaikki tiedot?')) {
                localStorage.clear();
                window.location.href = window.location.pathname;
            }
        };
    }
}

// Käynnistyslukko
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

// Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}