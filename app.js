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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const state = {
    sessionId: null,
    userRole: null,
    myProposal: null,
    partnerProposal: null
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id + '-screen');
    if (target) target.classList.add('active');
}

function startListening() {
    const pRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
    
    db.collection("proposals").doc(state.sessionId + "_" + state.userRole)
        .onSnapshot(doc => {
            if (doc.exists) state.myProposal = doc.data();
            if (state.myProposal && state.partnerProposal) renderResults();
        });

    db.collection("proposals").doc(state.sessionId + "_" + pRole)
        .onSnapshot(doc => {
            if (doc.exists) state.partnerProposal = doc.data();
            if (state.myProposal && state.partnerProposal) renderResults();
        });
}

function renderResults() {
    showScreen('results');
    const container = document.querySelector('#results-screen .container');
    if (!container) return;

    const my = state.myProposal.details || {};
    const pt = state.partnerProposal.details || {};
    
    let matches = [];
    Object.keys(my).forEach(k => {
        if (Array.isArray(my[k]) && Array.isArray(pt[k])) {
            const common = my[k].filter(v => pt[k].includes(v));
            matches = [...matches, ...common];
        } else if (my[k] === pt[k] && my[k] !== "ei valittu" && my[k] !== undefined) {
            matches.push(my[k]);
        }
    });

    // Tässä oli se vaarallinen kohta - varmistettu että kaikki `` on kiinni
    container.innerHTML = `
        <h1 class="logo">Vibe Match!</h1>
        <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin:20px 0;">
            ${matches.map(m => `<div class="match-badge">✨ ${m.toUpperCase()}</div>`).join('')}
        </div>
        <p style="margin-top:20px; opacity:0.7;">Yhteiset osumat löydetty!</p>
        <button class="btn btn-outline" onclick="window.location.href=window.location.pathname" style="margin-top:20px; width:100%;">Uusi sessio</button>
    `;
}

async function createSession() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
        await db.collection("sessions").doc(id).set({ status: "waiting" });
        state.sessionId = id;
        state.userRole = 'partner_a';
        document.getElementById('session-id-display').textContent = id;
        
        const url = window.location.origin + window.location.pathname + '?session=' + id;
        navigator.clipboard.writeText(url);
        
        showScreen('selection');
        startListening();
    } catch (e) {
        alert("Firebase-virhe: " + e.message);
    }
}

async function submitSelection() {
    const details = {};
    document.querySelectorAll('.selected').forEach(el => Object.assign(details, el.dataset));
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
        const cat = c.name || 'extras';
        if (!details[cat]) details[cat] = [];
        details[cat].push(c.value);
    });

    try {
        await db.collection("proposals").doc(state.sessionId + "_" + state.userRole).set({
            sessionId: state.sessionId,
            userRole: state.userRole,
            details: details
        }, { merge: true });

        if (!state.partnerProposal) {
            showScreen('results');
            document.querySelector('#results-screen .container').innerHTML = `<h2>Ehdotus lähetetty!</h2><p>Odotetaan kumppania...</p>`;
        }
    } catch (e) {
        alert("Lähetysvirhe: " + e.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    
    if (sid) {
        state.sessionId = sid.toUpperCase();
        state.userRole = 'partner_b';
        const display = document.getElementById('session-id-display');
        if (display) display.textContent = state.sessionId;
        showScreen('selection');
        startListening();
    }

    const createBtn = document.getElementById('create-session-btn');
    if (createBtn) createBtn.onclick = createSession;

    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;
    
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        }
    });
});