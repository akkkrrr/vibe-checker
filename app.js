/**
 * VIBE CHECKER - V1.1 OPTIMIZED
 * Fixes: #1 Duplicate proposals, #2 Inefficient queries, #3 Error handling, 
 * #4 UTF-8 Encoding, #5 Memory leaks/Cleanup.
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
    myUnsubscribe: null,
    partnerUnsubscribe: null
};

// --- PUHDISTUS (BUG #5) ---
function cleanupListeners() {
    if (state.myUnsubscribe) state.myUnsubscribe();
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
    console.log("Listeners cleaned up.");
}

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

// --- OPTIMOITU REALTIME KUUNTELIJA (BUG #2 & #3) ---
function startListening() {
    cleanupListeners();

    const myDocId = state.sessionId + "_" + state.userRole;
    const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
    const partnerDocId = state.sessionId + "_" + partnerRole;

    // Kuunnellaan omaa dokumenttia
    state.myUnsubscribe = db.collection("proposals").doc(myDocId)
        .onSnapshot(doc => {
            if (doc.exists) state.myProposal = doc.data();
            checkBothProposals();
        }, error => {
            console.error("My stream error:", error);
            notify("Yhteysvirhe omassa datassa.");
        });

    // Kuunnellaan kumppanin dokumenttia
    state.partnerUnsubscribe = db.collection("proposals").doc(partnerDocId)
        .onSnapshot(doc => {
            if (doc.exists) state.partnerProposal = doc.data();
            checkBothProposals();
        }, error => {
            console.error("Partner stream error:", error);
            notify("Yhteys kumppaniin katkesi.");
        });
}

function checkBothProposals() {
    if (state.myProposal && state.partnerProposal) {
        renderResults();
    }
}

// --- TULOSTEN RAKENTAMINEN ---
function renderResults() {
    showScreen('results');
    const container = document.getElementById('results-screen').querySelector('.container');
    
    const myDetails = state.myProposal.details || {};
    const pDetails = state.partnerProposal.details || {};

    let matches = [];
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

    // BUG #4: Tekstit ilman ääkkösongelmia
    container.innerHTML = `
        <div class="results-header">
            <h1 class="logo" style="font-size: 3rem; margin-bottom: 0.5rem;">Vibe Match!</h1>
            <p style="color: var(--rose-gold); letter-spacing: 2px;">TEIDAN YHTEINEN TUNNELMANNE</p>
        </div>

        <div class="matches-display">
            <div class="matches-grid">
                ${matches.map(m => `<div class="match-badge">✨ ${m.toUpperCase()}</div>`).join('')}
            </div>
            ${matches.length === 0 ? '<p style="opacity:0.6">Ei suoria osumia, mutta katsokaa toiveet alta!</p>' : ''}
        </div>

        <div class="summary-section" style="margin-top: 3rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="text-align: left;">
                    <h4 style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 10px;">SINUN TOIVEET</h4>
                    <div style="font-size: 0.9rem;">${Object.values(myDetails).flat().filter(v => v !== "ei valittu").join(' • ')}</div>
                </div>
                <div style="text-align: right;">
                    <h4 style