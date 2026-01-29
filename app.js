/**
 * VIBE CHECKER - FULL REALTIME VERSION
 * Sisältää automaattisen vertailun ja tulosten näytön.
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
    unsubscribe: null // Kuuntelijan pysäyttämiseen
};

// --- NÄKYMIEN HALLINTA ---
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

// --- REALTIME KUUNTELIJA ---
function startListening() {
    if (state.unsubscribe) state.unsubscribe();

    // Kuunnellaan tämän session ehdotuksia
    state.unsubscribe = db.collection("proposals")
        .where("sessionId", "==", state.sessionId)
        .onSnapshot((snapshot) => {
            const proposals = [];
            snapshot.forEach(doc => proposals.push(doc.data()));

            // Etsitään oma ja kumppanin vastaus
            state.myProposal = proposals.find(p => p.userRole === state.userRole);
            state.partnerProposal = proposals.find(p => p.userRole !== state.userRole);

            if (state.myProposal && state.partnerProposal) {
                renderResults();
            }
        });
}

// --- TULOSTEN VERTAILU JA NÄYTTÖ ---
function renderResults() {
    showScreen('results');
    const container = document.getElementById('results-screen').querySelector('.container');
    
    const myDetails = state.myProposal.details || {};
    const pDetails = state.partnerProposal.details || {};

    // Etsitään yhteiset valinnat
    let matchesHtml = "";
    
    // Käydään läpi kaikki kategoriat (mood, focus, outfits jne.)
    const allKeys = new Set([...Object.keys(myDetails), ...Object.keys(pDetails)]);
    
    allKeys.forEach(key => {
        const myVal = myDetails[key];
        const pVal = pDetails[key];

        // Jos molemmilla on sama yksittäinen arvo (kuten mood) tai yhteisiä listassa (kuten outfits)
        if (Array.isArray(myVal) && Array.isArray(pVal)) {
            const common = myVal.filter(v => pVal.includes(v));
            common.forEach(v => matchesHtml += `<div class="match-badge">✨ ${v}</div>`);
        } else if (myVal === pVal && myVal !== undefined) {
            matchesHtml += `<div class="match-badge">✨ ${myVal}</div>`;
        }
    });

    container.innerHTML = `
        <h1 class="logo">Vibe Match!</h1>
        <div class="match-container">
            <h3>Yhteiset toiveenne:</h3>
            <div class="matches-grid">
                ${matchesHtml || "<p>Ei suoria osumia, mutta katsokaa toistenne toiveet alta!</p>"}
            </div>
            
            <div class="comparison-grid" style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="my-side" style="text-align: left; opacity: 0.8;">
                    <h4>Sinun valinnat:</h4>
                    <small>${Object.values(myDetails).flat().join(', ')}</small>
                </div>
                <div class="partner-side" style="text-align: right; color: var(--rose-gold);">
                    <h4>Kumppanin valinnat:</h4>
                    <small>${Object.values(pDetails).flat().join(', ')}</small>
                </div>
            </div>
        </div>
        <button class="btn btn-outline" onclick="location.reload()" style="margin-top: 2rem;">Uusi tarkistus</button>
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
        notify("Sessio luotu ja linkki kopioitu!");
        showScreen('selection');
        startListening(); // Alkaa odottaa kumppania
    } catch (e) {
        notify("Virhe Firebasessa!");
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
            notify("Ehdotus lähetetty! Odotetaan kumppania...");
        }
    } catch (e) {
        notify("Lähetys epäonnistui!");
    }
}

// --- ALUSTUS ---
document.addEventListener('DOMContentLoaded', () => {
    // Tarkistetaan onko URL:ssa sessio-ID (kumppani tulee linkistä)
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    
    if (sid) {
        state.sessionId = sid.toUpperCase();
        state.userRole = 'partner_b';
        document.getElementById('session-id-display').textContent = state.sessionId;
        showScreen('selection');
        startListening();
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

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
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