/**
 * VIBE CHECKER v2.5.0 - MASTER INTEGRATION
 * - Fixed: All Landing Page actions (Create, Join, History, Copy)
 * - Fixed: Full 15 categories support in Golden Anchors
 * - Fixed: Discreet UI for Help (?) and Emergency Reset
 * - Added: Session persistence & History rendering
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

// --- ALUSTUS ---
let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
} catch (err) {
    console.error("Firebase failure:", err);
}

const state = {
    sessionId: null,
    userRole: null,
    myProposal: null,
    partnerProposal: null,
    partnerUnsubscribe: null
};

// --- NÄKYMÄHALLINTA ---
const getViews = () => ({
    setup: document.getElementById('setup-view'),
    session: document.getElementById('session-view'),
    waiting: document.getElementById('waiting-view'),
    results: document.getElementById('results-view'),
    landing: document.getElementById('landing-view')
});

function showView(target) {
    if (!target) return;
    const views = getViews();
    Object.values(views).forEach(v => v && v.classList.remove('active'));
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- ILMOITUKSET ---
function showStatus(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `status-toast status-${type}`;
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.9); color: #fff; padding: 12px 24px;
        border-radius: 50px; z-index: 10000; font-size: 0.9rem;
        backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5); transition: opacity 0.4s;
    `;
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- SESSIO-TOIMINNOT ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 10);
    state.sessionId = id;
    state.userRole = 'A';
    
    try {
        await db.collection('sessions').doc(id).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open'
        });
        
        saveToHistory(id);
        window.history.pushState({}, '', `?s=${id}`);
        updateSessionUI();
        showView(getViews().session);
        listenToPartner();
        showStatus('Kysely luotu! ✨');
    } catch (e) { 
        showStatus('Yhteysvirhe Firebaseen.', 'error');
    }
}

async function joinSession(id) {
    if (!id) return showStatus('Anna ID!', 'error');
    state.sessionId = id;
    state.userRole = 'B';
    try {
        const doc = await db.collection('sessions').doc(id).get();
        if (!doc.exists) {
            showStatus('Kyselyä ei löytynyt.', 'error');
            return showView(getViews().landing);
        }
        saveToHistory(id);
        updateSessionUI();
        showView(getViews().session);
        listenToPartner();
    } catch (e) { 
        showView(getViews().landing); 
    }
}

function listenToPartner() {
    if (!state.sessionId) return;
    const partnerRole = state.userRole === 'A' ? 'B' : 'A';
    const docRef = db.collection('sessions').doc(state.sessionId).collection('proposals').doc(partnerRole);
    
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
    state.partnerUnsubscribe = docRef.onSnapshot(doc => {
        if (doc.exists) {
            state.partnerProposal = doc.data();
            applyGoldenAnchors(state.partnerProposal.details);
            // Aktivoi sticky bar jos partneri on valmis
            const actionBar = document.getElementById('sticky-action-bar');
            if (actionBar) actionBar.classList.add('active');
            if (state.myProposal) checkMatch();
        }
    });
}

// --- GOLDEN ANCHORS (KAIKKI 15 KATEGORIAA) ---
function applyGoldenAnchors(details = null) {
    const data = details || (state.partnerProposal ? state.partnerProposal.details : null);
    if (!data) return;

    // Poistetaan vanhat merkinnät
    document.querySelectorAll('.partner-anchor, .match-anchor').forEach(el => {
        el.classList.remove('partner-anchor', 'match-anchor');
    });

    Object.entries(data).forEach(([key, valueOrArray]) => {
        const values = Array.isArray(valueOrArray) ? valueOrArray : [valueOrArray];
        values.forEach(val => {
            if (!val) return;
            const targets = document.querySelectorAll(`[data-value="${val}"], input[value="${val}"]`);
            targets.forEach(t => {
                const visual = t.classList.contains('mood-card') || t.classList.contains('time-btn') ? t : (t.closest('label') || t.parentElement);
                if (visual) {
                    visual.classList.add('partner-anchor');
                    const isSelected = visual.classList.contains('selected') || (t.tagName === 'INPUT' && (t.checked || t.value === val));
                    if (isSelected) visual.classList.add('match-anchor');
                }
            });
        });
    });
}

// --- VUOROVAIKUTUS JA DATAN KERÄYS ---
document.addEventListener('click', (e) => {
    const card = e.target.closest('.mood-card, .time-btn');
    if (card) {
        const section = card.parentElement;
        section.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected', 'match-anchor'));
        card.classList.add('selected');
        applyGoldenAnchors();
        if (navigator.vibrate) navigator.vibrate(5);
    }
    if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        setTimeout(applyGoldenAnchors, 50);
    }
});

function gatherAllData() {
    const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);
    const selectedMood = document.querySelector('.mood-card.selected')?.dataset.value;
    const selectedTime = document.querySelector('.time-btn.selected')?.dataset.value || 'custom';
    
    return {
        mood: selectedMood || null,
        time: selectedTime,
        timeDisplay: document.getElementById('time-display')?.textContent || "00:00",
        focus: getChecked('focus'),
        spice: getChecked('spice'),
        intensity: getChecked('intensity'),
        location: getChecked('location'),
        boundaries: getChecked('boundaries'),
        communication: getChecked('communication'),
        aftercare: getChecked('aftercare'),
        vibe_type: getChecked('vibe_type'),
        pace: getChecked('pace'),
        tools: getChecked('tools'),
        sensory: getChecked('sensory'),
        roles: getChecked('roles')
    };
}

async function submitProposal() {
    const details = gatherAllData();
    if (!details.mood) return showStatus('Valitse vähintään tunnelma! ✨', 'error');

    state.myProposal = { details, ts: firebase.firestore.FieldValue.serverTimestamp() };
    try {
        await db.collection('sessions').doc(state.sessionId).collection('proposals').doc(state.userRole).set(state.myProposal);
        showView(getViews().waiting);
        checkMatch();
    } catch (e) { 
        showStatus('Tallennus epäonnistui.', 'error'); 
    }
}

function checkMatch() {
    if (!state.myProposal || !state.partnerProposal) return;
    const m = JSON.stringify(state.myProposal.details);
    const p = JSON.stringify(state.partnerProposal.details);
    if (m === p) renderResults(true);
}

function renderResults(isMatch) {
    const container = document.getElementById('results-content');
    if (container) {
        container.innerHTML = `
            <div class="results-card animate-pop">
                <div class="match-icon">${isMatch ? '✨' : '✔️'}</div>
                <h2>${isMatch ? 'TÄYDELLINEN MATCH!' : 'Valmista tuli!'}</h2>
                <p>Toiveenne on synkronoitu onnistuneesti.</p>
                <button class="btn btn-primary" onclick="location.reload()">Uusi Vibe Check</button>
            </div>
        `;
        showView(getViews().results);
    }
}

// --- HISTORIA JA APUFUNKTIOT ---
function saveToHistory(id) {
    let history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    if (!history.includes(id)) {
        history.unshift(id);
        localStorage.setItem('vibe_history', JSON.stringify(history.slice(0, 5)));
    }
}

function updateSessionUI() {
    const el = document.getElementById('display-session-id');
    if (el) el.textContent = state.sessionId;
}

function emergencyReset() {
    if (confirm('🚨 Haluatko varmasti nollata kaiken?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin + window.location.pathname;
    }
}

// --- ALUSTUS JA PAINIKKEET ---
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('s');
    
    if (sid) joinSession(sid); else showView(getViews().landing);

    // ETUSIVUN PAINIKKEET
    document.getElementById('start-btn')?.addEventListener('click', createSession);
    
    document.getElementById('open-session-btn')?.addEventListener('click', () => {
        const idInput = document.getElementById('session-id-input');
        if (idInput && idInput.value) joinSession(idInput.value);
        else showStatus('Syötä ID ensin!', 'error');
    });

    document.getElementById('history-btn')?.addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
        if (history.length === 0) return showStatus('Ei historiaa tallennettu.');
        joinSession(history[0]);
    });

    document.getElementById('copy-link-btn')?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showStatus('Linkki kopioitu leikepöydälle! 🔗');
        } catch (e) {
            showStatus('Kopiointi epäonnistui.', 'error');
        }
    });

    document.getElementById('submit-btn')?.addEventListener('click', submitProposal);

    // UI-SÄÄDÖT (KYSYMYSMERKKI JA RESET)
    const helpBtn = document.getElementById('global-help-btn');
    if (helpBtn) {
        helpBtn.style.cssText = "position:fixed; bottom:20px; right:20px; width:36px; height:36px; opacity:0.3; font-size:18px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#111; border:1px solid #333; color:#888; z-index:9999; cursor:pointer;";
        helpBtn.onclick = () => document.getElementById('help-modal')?.classList.add('active');
    }

    const resetBtn = document.getElementById('emergency-reset-btn');
    if (resetBtn) {
        resetBtn.style.cssText = "font-size:10px; opacity:0.15; position:fixed; bottom:5px; left:5px; background:none; border:none; color:#555; cursor:pointer;";
        resetBtn.onclick = emergencyReset;
    }

    // AIKALASKURI / SLIDER
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    if (slider && display) {
        slider.oninput = (e) => {
            const val = e.target.value;
            const h = Math.floor(val / 60).toString().padStart(2, '0');
            const m = (val % 60).toString().padStart(2, '0');
            display.textContent = `${h}:${m}`;
            // Poista pikanapit jos slideria käytetään
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        };
    }

    // Modal sulkeminen
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.onclick = (e) => {
            if (e.target === helpModal) helpModal.classList.remove('active');
        };
    }
});