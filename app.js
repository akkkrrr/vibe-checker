/**
 * VIBE CHECKER v1.5 - NEGOTIATION MODE
 * Firebase Firestore + Vercel
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const state = {
    sessionId: null,
    userRole: null,
    currentRound: 1,
    theme: localStorage.getItem('theme') || 'dark',
    myProposal: null,
    partnerProposal: null,
    originalProposal: null, // Partner A:n alkuperäinen ehdotus (cachetetaan)
    myUnsubscribe: null,
    partnerUnsubscribe: null
};

const MAX_ROUNDS = 3;

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

function showBanner(message) {
    const existing = document.querySelector('.prefill-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'prefill-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <span style="flex: 1;">${message}</span>
            <button onclick="this.closest('.prefill-banner').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; padding:0 10px;">✕</button>
        </div>
    `;
    
    const container = document.querySelector('#selection-screen .container');
    const header = container.querySelector('.header-section');
    if (header) {
        header.after(banner);
    } else {
        container.prepend(banner);
    }
    
    setTimeout(() => banner.remove(), 10000);
}

// --- REALTIME KUUNTELU (OPTIMOITU) ---
function startListening() {
    stopListening();
    
    const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
    
    // Kuuntele KAIKKI kumppanin roundit (max 3)
    state.partnerUnsubscribe = db.collection("proposals")
        .where("sessionId", "==", state.sessionId)
        .where("userRole", "==", partnerRole)
        .orderBy("round", "desc")
        .limit(1)
        .onSnapshot(
            (snapshot) => {
                if (!snapshot.empty) {
                    state.partnerProposal = snapshot.docs[0].data();
                    
                    // Jos kumppani hyväksyi → match
                    if (state.partnerProposal.status === "accepted") {
                        renderResults();
                    } else if (state.partnerProposal.status === "modified") {
                        // Kumppani muokkasi → näytä ilmoitus
                        if (document.getElementById('results-screen').classList.contains('active')) {
                            notify("💬 Kumppani muokkasi ehdotusta!");
                        }
                    }
                }
            },
            (error) => {
                console.error("Realtime error:", error);
                notify("❌ Yhteys katkesi!");
            }
        );
}

function stopListening() {
    if (state.myUnsubscribe) state.myUnsubscribe();
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
}

// --- ESITÄYTTÖ ---
function prefillForm(details) {
    // Tyhjennä ensin
    clearAllSelections();
    
    // Valitse kortit
    if (details.mood) {
        const moodCard = document.querySelector(`[data-mood="${details.mood}"]`);
        if (moodCard) {
            moodCard.classList.add('selected');
            moodCard.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    if (details.focus) {
        const focusCard = document.querySelector(`[data-focus="${details.focus}"]`);
        if (focusCard) {
            focusCard.classList.add('selected');
            focusCard.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Checkboxit
    Object.entries(details).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            values.forEach(val => {
                const checkbox = document.querySelector(`input[value="${val}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    const label = checkbox.closest('label');
                    if (label) label.style.animation = 'prefillHighlight 1s ease';
                }
            });
        }
    });
}

function clearAllSelections() {
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
}

// --- TOIMINNOT ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
        await db.collection("sessions").doc(id).set({
            status: "waiting",
            currentRound: 1,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.sessionId = id;
        state.userRole = 'partner_a';
        state.currentRound = 1;
        
        document.getElementById('session-id-display').textContent = id;
        
        const url = window.location.origin + window.location.pathname + '?session=' + id;
        navigator.clipboard.writeText(url);
        
        notify("🔥 Sessio luotu ja linkki kopioitu!");
        showScreen('selection');
        startListening();
    } catch (e) {
        console.error(e);
        notify("❌ Virhe session luonnissa!");
    }
}

async function joinSession(sessionId) {
    state.sessionId = sessionId;
    state.userRole = 'partner_b';
    
    document.getElementById('session-id-display').textContent = sessionId;
    
    // Hae Partner A:n viimeisin ehdotus
    const snapshot = await db.collection("proposals")
        .where("sessionId", "==", sessionId)
        .where("userRole", "==", "partner_a")
        .orderBy("round", "desc")
        .limit(1)
        .get();
    
    if (!snapshot.empty) {
        const partnerData = snapshot.docs[0].data();
        state.originalProposal = partnerData;
        state.currentRound = partnerData.round + 1;
        
        // Esitäytä lomake
        prefillForm(partnerData.details);
        
        showBanner(`💡 Lomake esitäytetty kumppanisi ehdotuksella (kierros ${partnerData.round}). Voit muokata vapaasti tai hyväksyä sellaisenaan.`);
        
        // Lisää "Hyväksy suoraan" -nappi
        addQuickAcceptButton();
    }
    
    showScreen('selection');
    startListening();
    notify("⚡ Liitytty sessioon: " + sessionId);
}

function addQuickAcceptButton() {
    const submitSection = document.querySelector('.submit-section');
    if (!submitSection) return;
    
    const existingBtn = document.getElementById('quick-accept-btn');
    if (existingBtn) return; // Älä lisää duplikaattia
    
    const acceptBtn = document.createElement('button');
    acceptBtn.id = 'quick-accept-btn';
    acceptBtn.className = 'btn btn-primary btn-large';
    acceptBtn.innerHTML = '✅ Hyväksy sellaisenaan';
    acceptBtn.onclick = quickAccept;
    
    submitSection.prepend(acceptBtn);
}

async function quickAccept() {
    if (!state.originalProposal) return;
    
    try {
        const docId = `${state.sessionId}_${state.userRole}_round${state.currentRound}`;
        
        await db.collection("proposals").doc(docId).set({
            sessionId: state.sessionId,
            userRole: state.userRole,
            round: state.currentRound,
            status: "accepted",
            details: state.originalProposal.details, // Sama kuin kumppani
            respondedTo: `${state.sessionId}_partner_a_round${state.originalProposal.round}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Päivitä oma proposal
        state.myProposal = {
            details: state.originalProposal.details,
            status: "accepted"
        };
        
        notify("✅ Hyväksytty!");
        renderResults();
    } catch (e) {
        console.error(e);
        notify("❌ Hyväksyntä epäonnistui!");
    }
}

async function submitSelection() {
    // Kerää valinnat
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
    
    // Tarkista max rounds
    if (state.currentRound > MAX_ROUNDS) {
        notify("⚠️ Maksimi neuvottelukierrokset (3) saavutettu!");
        return;
    }
    
    // Laske muutokset (jos B muokkasi)
    let changes = null;
    let status = "pending";
    let respondedTo = null;
    
    if (state.originalProposal && state.userRole === 'partner_b') {
        changes = calculateChanges(state.originalProposal.details, details);
        
        // Jos ei muutoksia → automaattinen hyväksyntä
        if (changes.added.length === 0 && changes.removed.length === 0) {
            status = "accepted";
        } else {
            status = "modified";
        }
        
        respondedTo = `${state.sessionId}_partner_a_round${state.originalProposal.round}`;
    }
    
    try {
        const docId = `${state.sessionId}_${state.userRole}_round${state.currentRound}`;
        
        await db.collection("proposals").doc(docId).set({
            sessionId: state.sessionId,
            userRole: state.userRole,
            round: state.currentRound,
            status: status,
            mood: mood,
            focus: focus,
            details: details,
            changes: changes,
            respondedTo: respondedTo,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.myProposal = { details, status, changes };
        
        if (status === "accepted") {
            renderResults();
        } else {
            showScreen('results');
            showWaitingView();
            notify("✅ Ehdotus lähetetty kumppanille!");
        }
    } catch (e) {
        console.error(e);
        notify("❌ Lähetys epäonnistui!");
    }
}

function calculateChanges(original, modified) {
    const added = [];
    const removed = [];
    
    // Lisätyt
    Object.entries(modified).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            const origVals = original[key] || [];
            values.forEach(v => {
                if (!origVals.includes(v)) added.push(v);
            });
        } else if (values !== original[key] && values !== "ei valittu") {
            added.push(values);
        }
    });
    
    // Poistetut
    Object.entries(original).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            const modVals = modified[key] || [];
            values.forEach(v => {
                if (!modVals.includes(v)) removed.push(v);
            });
        } else if (values !== modified[key] && values !== "ei valittu") {
            removed.push(values);
        }
    });
    
    return { added, removed };
}

function showWaitingView() {
    const container = document.getElementById('results-screen').querySelector('.container');
    container.innerHTML = `
        <div class="waiting-container" style="text-align:center; padding: 4rem 2rem;">
            <div style="font-size: 4rem; animation: pulse 2s infinite;">💭</div>
            <h2 style="margin: 2rem 0 1rem;">Odottaa kumppania...</h2>
            <p style="opacity: 0.7;">Kumppanisi ei ole vielä vastannut.</p>
            
            ${state.myProposal && state.myProposal.changes ? `
                <div class="changes-preview" style="margin-top: 3rem; text-align: left;">
                    <h4 style="opacity: 0.6; margin-bottom: 1rem;">Tekemäsi muutokset:</h4>
                    ${state.myProposal.changes.added.length > 0 ? `
                        <div style="color: #4caf50; margin-bottom: 0.5rem;">
                            + Lisätty: ${state.myProposal.changes.added.join(', ')}
                        </div>
                    ` : ''}
                    ${state.myProposal.changes.removed.length > 0 ? `
                        <div style="color: #ff5252;">
                            - Poistettu: ${state.myProposal.changes.removed.join(', ')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <button class="btn btn-outline" onclick="showScreen('selection')" style="margin-top: 2rem;">
                ✏️ Muokkaa ehdotusta
            </button>
        </div>
    `;
}

// --- TULOSTEN RAKENTAMINEN ---
function renderResults() {
    showScreen('results');
    const container = document.getElementById('results-screen').querySelector('.container');
    
    const myDetails = state.myProposal?.details || {};
    const pDetails = state.partnerProposal?.details || {};

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

    container.innerHTML = `
        <div class="results-header">
            <h1 class="logo" style="font-size: 3rem; margin-bottom: 0.5rem;">Vibe Match!</h1>
            <p style="color: var(--rose-gold); letter-spacing: 2px;">TEIDÄN YHTEINEN TUNNELMANNE</p>
        </div>

        <div class="matches-display" style="margin: 2rem 0;">
            <div class="matches-grid" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                ${matches.map(m => `<div class="match-badge" style="background: var(--rose-gold); color: black; padding: 10px 20px; border-radius: 20px; font-weight: 600;">✨ ${String(m).toUpperCase()}</div>`).join('')}
            </div>
            ${matches.length === 0 ? '<p style="opacity:0.6; text-align:center;">Ei suoria osumia, mutta katsokaa toiveenne alta!</p>' : ''}
        </div>

        <div class="summary-section" style="margin-top: 3rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="text-align: left;">
                    <h4 style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 10px;">SINUN TOIVEET</h4>
                    <div style="font-size: 0.9rem;">${Object.values(myDetails).flat().filter(v => v && v !== "ei valittu").join(' • ')}</div>
                </div>
                <div style="text-align: right;">
                    <h4 style="font-size: 0.8rem; opacity: 0.5; margin-bottom: 10px;">KUMPPANIN TOIVEET</h4>
                    <div style="font-size: 0.9rem; color: var(--rose-gold);">${Object.values(pDetails).flat().filter(v => v && v !== "ei valittu").join(' • ')}</div>
                </div>
            </div>
        </div>

        <button class="btn btn-outline" onclick="resetSession()" style="margin-top: 3rem; width: 100%;">Uusi sessio</button>
    `;
}

function resetSession() {
    stopListening();
    state.sessionId = null;
    state.userRole = null;
    state.currentRound = 1;
    state.myProposal = null;
    state.partnerProposal = null;
    state.originalProposal = null;
    
    clearAllSelections();
    
    window.location.href = window.location.pathname;
}

// --- ALUSTUS ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    
    if (sid) {
        joinSession(sid.toUpperCase());
    }

    document.getElementById('create-session-btn').onclick = createSession;
    document.getElementById('submit-selection-btn').onclick = submitSelection;

    document.getElementById('join-session-btn').onclick = () => {
        const id = prompt("Syötä Session ID:");
        if (id) joinSession(id.toUpperCase());
    };

    // Korttien klikkaus
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', state.theme);
            localStorage.setItem('theme', state.theme);
        };
    }
    
    // Cleanup
    window.addEventListener('beforeunload', stopListening);
});
