/**
 * ================================================
 * VIBE CHECKER v2.5.1-FINAL-FIX
 * Synkronoitu index.html:n kanssa
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

let state = {
    sessionId: null,
    userRole: null,
    mood: null,
    focus: null,
    intensity: 5
};

let isSubmitting = false;
let unsubscribe = null;

// --- APUFUNKTIOT ---
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
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
}

// --- CORE LOGIIKKA ---
async function createSession() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
        const docRef = await db.collection("sessions").add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open'
        });
        
        state.sessionId = docRef.id;
        state.userRole = 'partner_a';
        
        // Päivitetään linkki ja ID näkyviin
        const link = `${window.location.origin}${window.location.pathname}?session=${state.sessionId}`;
        const input = document.getElementById('share-link-input');
        if (input) input.value = link;
        
        const display = document.getElementById('session-id-display');
        if (display) display.textContent = state.sessionId;

        showScreen('share-screen');
        notify('Istunto luotu!', 'success');
        startListening(state.sessionId);
    } catch (e) {
        console.error(e);
        notify('Tietokantavirhe', 'error');
    } finally {
        isSubmitting = false;
    }
}

function startListening(id) {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection("sessions").doc(id).onSnapshot(doc => {
        if (doc.exists()) {
            console.log("Päivitys saatu:", doc.data());
        }
    });
}

async function submitSelection() {
    if (isSubmitting || !state.sessionId) return;
    isSubmitting = true;

    const selection = {
        mood: state.mood || 'ei valittu',
        focus: state.focus || 'ei valittu',
        intensity: state.intensity || 5,
        timestamp: new Date().toISOString()
    };

    try {
        await db.collection("sessions").doc(state.sessionId).set({
            [state.userRole]: selection,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        notify('Valinnat lähetetty!', 'success');
    } catch (e) {
        notify('Virhe tallennuksessa', 'error');
    } finally {
        isSubmitting = false;
    }
}

// --- KÄYNNISTYS ---
function initApp() {
    console.log("🚀 Vibe Checker käynnistyy...");

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
        state.sessionId = sessionParam;
        state.userRole = 'partner_b';
        showScreen('input-screen');
        startListening(sessionParam);
        notify('Liitytty istuntoon!', 'success');
    }

    // NAPPIEN BINDING (Nimet korjattu index.html:n mukaan)
    
    // Aloita-nappi
    const createBtn = document.getElementById('create-session-btn');
    if (createBtn) createBtn.onclick = createSession;

    // Lähetä-nappi
    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;

    // Kopioi-nappi
    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const input = document.getElementById('share-link-input');
            if (input) {
                input.select();
                document.execCommand('copy');
                notify('Linkki kopioitu!', 'success');
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

    // Ohje-nappi
    const helpBtn = document.getElementById('global-help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            const modal = document.getElementById('help-modal');
            if (modal) modal.classList.add('active');
        };
    }

    // Reset-nappi
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

// Varmistetaan lataus
if (document.readyState === 'complete') {
    initApp();
} else {
    window.addEventListener('load', initApp);
}