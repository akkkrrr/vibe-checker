/**
 * VIBE CHECKER - FINAL PRODUCTION VERSION
 * Alustettu käyttäjän vibechecker-e4823 projektille.
 */

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
    theme: localStorage.getItem('theme') || 'dark',
    myProposal: null,
    partnerProposal: null,
    unsubscribe: null
};

// --- NÄKYMÄT ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id + '-screen');
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
}

function notify(msg) {
    const n = document.createElement('div');
    n.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:10000; font-weight:600; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif; text-align:center;";
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.opacity = '0';
        n.style.transition = '0.5s';
        setTimeout(() => n.remove(), 500);
    }, 4000);
}

// --- REALTIME KUUNTELIJA ---
function startListening() {
    if (state.unsubscribe) state.unsubscribe();

    state.unsubscribe = db.collection("proposals")
        .where("sessionId", "==", state.sessionId)
        .onSnapshot((snapshot) => {
            const proposals = [];
            snapshot.forEach(doc => proposals.push(doc.data()));

            state.myProposal = proposals.find(p => p.userRole === state.userRole);
            state.partnerProposal = proposals.find(p => p.userRole !== state.userRole);

            if (state.myProposal && state.partnerProposal) {
                renderResults();
            }
        });
}

// --- TULOSTEN RAKENTAMINEN ---
function renderResults() {
    showScreen('results');
    const container = document.getElementById('results-screen').querySelector('.container');
    
    const myDetails = state.myProposal.details || {};
    const pDetails = state.partnerProposal.details || {};

    let matches = [];
    
    // Verrataan kaikkia valintoja
    const allKeys = new Set([...Object.keys(myDetails), ...Object.keys(pDetails)]);
    allKeys.forEach(key => {
        const myVal = myDetails[key];
        const pVal = pDetails[key];

        if (Array.isArray(myVal) && Array.isArray(pVal)) {
            const common = myVal.filter(v => pVal.includes(v));
            matches = [...matches, ...common];
        } else if (myVal === pVal && myVal !== undefined && myVal !== "ei valittu") {
            matches.push(myVal);
        }
    });

    container.innerHTML = `
        <div class="results-header">
            <h1 class="logo" style="font-size: 3rem; margin-bottom: 0.5rem;">Vibe Match!</h1>
            <p style="color: var(--rose-gold); letter-spacing: 2px;">TEIDÄN YHTEINEN TUNNELMANNE</p>
        </div>

        <div class="matches-display">
            <div class="matches-grid">
                ${matches.map(m => `<div class="match-badge">✨ ${m.toUpperCase()}</div>`).join('')}
            </div>
            ${matches.length === 0 ? '<p style="opacity:0.6">Ei suoria osumia, mutta katsokaa toiveenne alta!</p>' : ''}
        </div>

        <div class="summary-section" style="margin-top: 3rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="text-align: left;">
                    <h4 style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 10px;">SINUN TOIVEET</h4>
                    <div style="font-size: 0.9rem;">${Object.values(myDetails).flat().filter(v => v !== "ei valittu").join(' • ')}</div>
                </div>
                <div style="text-align: right;">
                    <h4 style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 10px;">KUMPPANIN TOIVEET</h4>
                    <div style="font-size: 0.9rem; color: var(--rose-gold);">${Object.values(pDetails).flat().filter(v => v !== "ei valittu").join(' • ')}</div>
                </div>
            </div>
        </div>

        <button class="btn btn-outline" onclick="window.location.href=window.location.pathname" style="margin-top: 3rem; width: 100%;">Uusi sessio</button>
    `;
}

// --- TOIMINNOT ---
async function createSession() {
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
        notify("🔥 Sessio luotu ja linkki kopioitu! Lähetä se kumppanille.");
        showScreen('selection');
        startListening();
    } catch (e) {
        notify("❌ Yhteysvirhe Firebaseen!");
    }
}

async function submitSelection() {
    const details = {};
    let mood = "ei valittu";
    let focus = "ei valittu";

    document.querySelectorAll('.selected').forEach(el => {
        if (el.dataset.mood) mood = el.dataset.mood;
        if (el.dataset.focus) focus = el.dataset.focus;
        Object.assign(details, el.dataset);
    });

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
        const cat = c.name || 'extras';
        if (!details[cat]) details[cat] = [];
        details[cat].push(c.value);
    });

    try {
        await db.collection("proposals").add({
            sessionId: state.sessionId,
            userRole: state.userRole,
            mood: mood,
            focus: focus,
            details: details,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (state.partnerProposal) {
            renderResults();
        } else {
            showScreen('results');
            notify("✅ Valinnat lähetetty! Odotetaan kumppania...");
        }
    } catch (e) {
        notify("❌ Lähetys epäonnistui!");
    }
}

// --- ALUSTUS ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    
    if (sid) {
        state.sessionId = sid.toUpperCase();
        state.userRole = 'partner_b';
        document.getElementById('session-id-display').textContent = state.sessionId;
        showScreen('selection');
        startListening();
        notify("⚡ Liitytty sessioon: " + state.sessionId);
    }

    document.getElementById('create-session-btn').onclick = createSession;
    document.getElementById('submit-selection-btn').onclick = submitSelection;

    document.getElementById('join-session-btn').onclick = () => {
        const id = prompt("Syötä Session ID:");
        if (id) {
            state.sessionId = id.toUpperCase();
            state.userRole = 'partner_b';
            document.getElementById('session-id-display').textContent = state.sessionId;
            showScreen('selection');
            startListening();
        }
    };

    // Korttien klikkauslogiikka (toimii kaikille dynaamisesti)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', state.theme);
        };
    }
});