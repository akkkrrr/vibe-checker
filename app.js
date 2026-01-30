/**
 * ================================================
 * VIBE CHECKER v2.5.1-FIXED
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
        console.error('❌ JSON parse failed:', e.message);
        return fallback;
    }
}

function safeGet(obj, path, fallback = null) {
    if (!obj || !path) return fallback;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return fallback;
        current = current[part];
    }
    return current === undefined ? fallback : current;
}

function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Elementtiä #${id} ei löytynyt`);
        return null;
    }
    return el;
}

function safeSetText(id, text) {
    const el = safeGetElement(id);
    if (el) el.textContent = text;
}

function safeLocalStorageSet(key, value) {
    if (!key) return;
    let toStore; 
    try {
        toStore = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, toStore);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.warn('⚠️ LocalStorage täynnä, siivotaan...');
            localStorage.removeItem('vibe_history');
            try {
                if (toStore) localStorage.setItem(key, toStore);
            } catch (e2) {
                console.error('❌ Siivous ei auttanut');
            }
        } else {
            console.error('❌ LocalStorage virhe:', e);
        }
    }
}

/* ================================================
   SECTION 2: STATE & CONFIG
   ================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyByV-ExampleKey",
    authDomain: "vibe-checker-eight.firebaseapp.com",
    projectId: "vibe-checker-eight",
    storageBucket: "vibe-checker-eight.appspot.com",
    messagingSenderId: "36737525164",
    appId: "1:36737525164:web:0f7457a46587c67c514571"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const { doc, setDoc, getDoc, onSnapshot, collection, addDoc, serverTimestamp } = firebase.firestore;

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
    if (!container) return;

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);

    if (navigator.vibrate) {
        if (type === 'error') navigator.vibrate([100, 50, 100]);
        else navigator.vibrate(50);
    }

    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
    }, 4000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = safeGetElement(screenId);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
}

/* ================================================
   SECTION 4: SESSION LOGIC
   ================================================ */

async function createSession() {
    if (isCreatingSession) return;
    isCreatingSession = true;

    const initialData = {
        createdAt: serverTimestamp(),
        lastUpdate: serverTimestamp(),
        status: 'open'
    };

    try {
        const docRef = await addDoc(collection(db, "sessions"), initialData);
        state.sessionId = docRef.id;
        state.userRole = 'partner_a';
        
        saveState();
        showScreen('share-screen');
        renderShareLink();
        startListening(state.sessionId);
        notify('Istunto luotu!', 'success');
    } catch (error) {
        console.error("Error:", error);
        notify('Luominen epäonnistui', 'error');
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
    notify('Liitytty istuntoon', 'success');
}

function renderShareLink() {
    const link = `${window.location.origin}${window.location.pathname}?session=${state.sessionId}`;
    const input = safeGetElement('share-link-input');
    if (input) input.value = link;
    
    safeSetText('session-id-display', state.sessionId);
}

function startListening(id) {
    if (unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(doc(db, "sessions", id), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
            state.partnerData = data[partnerRole] || null;
            console.log("Update received", data);
        }
    });
}

function stopListening() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

/* ================================================
   SECTION 5: SUBMISSION
   ================================================ */

async function submitSelection() {
    if (isSubmitting || !state.sessionId) {
        notify('Valitse ensin jotain tai odota...', 'warn');
        return;
    }
    
    const selection = {
        mood: state.mood || 'ei valittu',
        focus: state.focus || 'ei valittu',
        intensity: state.intensity || 5,
        timestamp: new Date().toISOString()
    };

    isSubmitting = true;
    
    try {
        await setDoc(doc(db, "sessions", state.sessionId), {
            [state.userRole]: selection,
            lastUpdate: serverTimestamp()
        }, { merge: true });

        notify('Valinnat lähetetty!', 'success');
        
    } catch (error) {
        console.error("❌ Tallennusvirhe:", error);
        notify('Yhteysvirhe Firebasessa', 'error');
    } finally {
        isSubmitting = false;
    }
}

function emergencyReset() {
    if (confirm('Haluatko varmasti nollata kaiken?')) {
        stopListening();
        localStorage.clear();
        window.location.href = window.location.pathname;
    }
}

/* ================================================
   SECTION 6: INITIALIZATION
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // URL-parametrien tarkistus
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
        joinSession(sessionParam);
    }

    // Event Listeners
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

    // Moodin valinta
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.onclick = () => {
            state.mood = btn.dataset.mood;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });

    // Ohje-nappi (Vain yksi kerta)
    const helpBtn = safeGetElement('global-help-btn');
    if (helpBtn) {
        helpBtn.onclick = () => {
            const modal = safeGetElement('help-modal');
            if (modal) modal.classList.add('active');
        };
    }

    const resetBtn = safeGetElement('emergency-reset-btn');
    if (resetBtn) resetBtn.onclick = emergencyReset;

    window.addEventListener('beforeunload', stopListening);
});