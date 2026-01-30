/**
 * ================================================
 * VIBE CHECKER v2.5.1-FINAL-FIX
 * ================================================
 */

/* ================================================
   SECTION 1: SAFETY HELPERS
   ================================================ */

function safeJSONParse(str, fallback = null) {
    if (!str || typeof str !== 'string') return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
}

function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        // Logataan vain jos DOM on jo latautunut
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.warn(`⚠️ Elementtiä #${id} ei löytynyt vielä`);
        }
        return null;
    }
    return el;
}

function safeSetText(id, text) {
    const el = safeGetElement(id);
    if (el) el.textContent = text;
}

function safeLocalStorageSet(key, value) {
    let toStore; 
    try {
        toStore = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, toStore);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            localStorage.removeItem('vibe_history');
            try { if (toStore) localStorage.setItem(key, toStore); } catch (e2) {}
        }
    }
}

/* ================================================
   SECTION 2: STATE & CONFIG
   ================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyDc4Wz35pzGP-Udi1R4JtJWLtolQiRJzJo",
    authDomain: "vibe-checker-eight.firebaseapp.com",
    projectId: "vibe-checker-eight",
    storageBucket: "vibe-checker-eight.appspot.com",
    messagingSenderId: "36737525164",
    appId: "1:36737525164:web:0f7457a46587c67c514571"
};

// Alustus heti
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let state = {
    sessionId: null,
    userRole: null,
    mood: null,
    focus: null,
    intensity: 5,
    partnerData: null,
    history: safeJSONParse(localStorage.getItem('vibe_history'), [])
};

let unsubscribe = null;
let isSubmitting = false;
let isCreatingSession = false;

/* ================================================
   SECTION 3: CORE FUNCTIONS
   ================================================ */

function saveState() {
    safeLocalStorageSet('vibe_state', state);
}

function notify(message, type = 'info') {
    const container = safeGetElement('notification-container');
    if (!container) {
        alert(message); // Varajärjestelmä jos container puuttuu
        return;
    }

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);

    if (navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
    }, 4000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = safeGetElement(screenId);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("Ei löydetty ruutua:", screenId);
    }
    window.scrollTo(0, 0);
}

/* ================================================
   SECTION 4: SESSION LOGIC
   ================================================ */

async function createSession() {
    if (isCreatingSession) return;
    isCreatingSession = true;

    try {
        const docRef = await db.collection("sessions").add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open'
        });
        
        state.sessionId = docRef.id;
        state.userRole = 'partner_a';
        
        saveState();
        showScreen('share-screen');
        renderShareLink();
        startListening(state.sessionId);
        notify('Istunto luotu!', 'success');
    } catch (error) {
        console.error(error);
        notify('Virhe luotaessa', 'error');
    } finally {
        isCreatingSession = false;
    }
}

async function joinSession(id) {
    state.sessionId = id;
    state.userRole = 'partner_b';
    saveState();
    showScreen('input-screen');
    startListening(id);
}

function renderShareLink() {
    const link = `${window.location.origin}${window.location.pathname}?session=${state.sessionId}`;
    const input = safeGetElement('share-link-input');
    if (input) input.value = link;
    safeSetText('session-id-display', state.sessionId);
}

function startListening(id) {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection("sessions").doc(id).onSnapshot((doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
            state.partnerData = data[partnerRole] || null;
        }
    });
}

function stopListening() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

/* ================================================
   SECTION 5: SUBMISSION
   ================================================ */

async function submitSelection() {
    if (isSubmitting || !state.sessionId) return;
    
    const selection = {
        mood: state.mood || 'ei valittu',
        focus: state.focus || 'ei valittu',
        intensity: state.intensity || 5,
        timestamp: new Date().toISOString()
    };

    isSubmitting = true;
    try {
        await db.collection("sessions").doc(state.sessionId).set({
            [state.userRole]: selection,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        notify('Valinnat lähetetty!', 'success');
    } catch (error) {
        notify('Virhe tallennuksessa', 'error');
    } finally {
        isSubmitting = false;
    }
}

/* ================================================
   SECTION 6: INITIALIZATION
   ================================================ */

function init() {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
        joinSession(sessionParam);
    }

    // Kiinnitetään tapahtumat
    const startBtn = safeGetElement('start-session-btn');
    if (startBtn) startBtn.onclick = createSession;

    const submitBtn = safeGetElement('submit-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;

    const copyBtn = safeGetElement('copy-link-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const input = safeGetElement('share-link-input');
            if (input) {
                input.select();
                document.execCommand('copy');
                notify('Linkki kopioitu!', 'success');
            }
        };
    }

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.onclick = () => {
            state.mood = btn.dataset.mood;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    const helpBtn = safeGetElement('global-help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            const modal = safeGetElement('help-modal');
            if (modal) modal.classList.add('active');
        };
    }

    const resetBtn = safeGetElement('emergency-reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('Nollataanko?')) {
                localStorage.clear();
                window.location.href = window.location.pathname;
            }
        };
    }
}

// Odotetaan että koko sivu on ladattu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', stopListening);