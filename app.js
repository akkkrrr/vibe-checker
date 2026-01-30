/**
 * ================================================
 * VIBE CHECKER v2.5.1-ULTRA-STABLE
 * ================================================
 */

// 1. Asetukset (VAIHDA API-KEY TÄHÄN!)
const firebaseConfig = {
    apiKey: "TAIzaSyDc4Wz35pzGP-Udi1R4JtJWLtolQiRJzJo", 
    authDomain: "vibe-checker-eight.firebaseapp.com",
    projectId: "vibe-checker-eight",
    storageBucket: "vibe-checker-eight.appspot.com",
    messagingSenderId: "36737525164",
    appId: "1:36737525164:web:0f7457a46587c67c514571"
};

// 2. Alustetaan Firebase globaalisti
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 3. Sovelluksen tila
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
        setTimeout(() => el.remove(), 4000);
    } else {
        console.log("Ilmoitus:", msg);
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
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
        
        // Päivitetään linkki
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
        notify('Virhe tietokannassa', 'error');
    } finally {
        isSubmitting = false;
    }
}

function startListening(id) {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection("sessions").doc(id).onSnapshot(doc => {
        if (doc.exists()) {
            console.log("Data päivittyi:", doc.data());
        }
    });
}

// --- KÄYNNISTYS (TÄMÄ ON TÄRKEIN KOHTA) ---
function startApp() {
    console.log("🚀 Sovellus käynnistyy...");

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (sessionParam) {
        state.sessionId = sessionParam;
        state.userRole = 'partner_b';
        showScreen('input-screen');
        startListening(sessionParam);
    }

    // Kiinnitetään napit VASTA NYT
    const startBtn = document.getElementById('start-session-btn');
    if (startBtn) {
        startBtn.onclick = createSession;
    } else {
        console.error("❌ ERROR: Nappia #start-session-btn ei löytynyt HTML:stä!");
    }

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const input = document.getElementById('share-link-input');
            if (input) {
                input.select();
                document.execCommand('copy');
                notify('Kopioitu!', 'success');
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
}

// Varmistetaan että sivu on VALMIS ennen starttia
if (document.readyState === 'complete') {
    startApp();
} else {
    window.addEventListener('load', startApp);
}