/**
 * VIBE CHECKER v2.3.7 - FULL MASTER INTEGRATION
 * - Based on original 1200+ line logic
 * - Integrated: Sticky Action Bar, Golden Anchors, Emergency Reset
 * - Fixed: Firebase initializations and missing UI hookups
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

// Varmistetaan Firebase-alustus
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- GLOBAALI TILA (Täysimittainen) ---
const state = {
    sessionId: null,
    userRole: null,
    currentRound: 1,
    theme: localStorage.getItem('theme') || 'dark',
    myProposal: null,
    partnerProposal: null,
    originalProposal: null,
    myUnsubscribe: null,
    partnerUnsubscribe: null,
    notificationPermission: false,
    user: null,
    history: [] // Clauden historiatoimintoa varten
};

const MAX_ROUNDS = 3;

// --- DOM ELEMENTIT ---
const views = {
    setup: document.getElementById('setup-view'),
    session: document.getElementById('session-view'),
    waiting: document.getElementById('waiting-view'),
    results: document.getElementById('results-view'),
    landing: document.getElementById('landing-view')
};

const stickyActionBar = document.getElementById('sticky-action-bar');

// --- NÄKYMÄHALLINTA ---
function showView(target) {
    if (!target) return;
    Object.values(views).forEach(v => {
        if (v) v.classList.remove('active');
    });
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- APUFUNKTIOT ---
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

function getSessionIdFromUrl() {
    return new URLSearchParams(window.location.search).get('s');
}

function showStatus(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `status-toast status-${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4500);
}

// --- SESSION HALLINTA (Full Logic) ---
async function createSession() {
    const id = generateId();
    state.sessionId = id;
    state.userRole = 'A';
    
    try {
        await db.collection('sessions').doc(id).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open',
            currentRound: 1,
            activeUsers: 1
        });
        
        window.history.pushState({}, '', `?s=${id}`);
        showView(views.session);
        updateSessionUI();
        listenToPartner();
        showStatus('Sessio luotu! Lähetä linkki kumppanille. ✨', 'success');
    } catch (err) {
        showStatus('Virhe: ' + err.message, 'error');
    }
}

async function joinSession(id) {
    state.sessionId = id;
    state.userRole = 'B';
    updateSessionUI();

    try {
        const doc = await db.collection('sessions').doc(id).get();
        if (!doc.exists) {
            showStatus('Istuntoa ei löytynyt. Se on saattanut vanhentua.', 'error');
            showView(views.landing);
            return;
        }
        
        // Päivitetään aktiivisten käyttäjien määrä
        db.collection('sessions').doc(id).update({ activeUsers: 2 });
        
        showView(views.session);
        listenToPartner();
        showStatus('Liitytty istuntoon. Partner A on valmiina.', 'info');
    } catch (err) {
        showView(views.landing);
    }
}

// --- SYNKRONOINTI ---
function listenToPartner() {
    if (!state.sessionId) return;
    const partnerRole = state.userRole === 'A' ? 'B' : 'A';
    const path = `sessions/${state.sessionId}/proposals/${partnerRole}`;
    
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
    
    state.partnerUnsubscribe = db.doc(path).onSnapshot(doc => {
        if (doc.exists) {
            const newData = doc.data();
            if (JSON.stringify(state.partnerProposal) === JSON.stringify(newData)) return;
            
            state.partnerProposal = newData;
            handlePartnerUpdate();
        }
    }, err => console.error("Snapshot error:", err));
}

function handlePartnerUpdate() {
    if (!state.partnerProposal || !state.partnerProposal.details) return;

    // Phase 2: Jos käyttäjä on B, näytetään heti Sticky Bar ja Ankkurit
    if (state.userRole === 'B') {
        if (stickyActionBar) stickyActionBar.classList.add('active');
        applyGoldenAnchors(state.partnerProposal.details);
    }

    if (state.myProposal) {
        checkMatchLogic();
    }
}

// --- ANKKURIT ---
function applyGoldenAnchors(details = null) {
    const data = details || (state.partnerProposal ? state.partnerProposal.details : null);
    if (!data) return;

    document.querySelectorAll('.partner-anchor, .match-anchor, .dimmed').forEach(el => {
        el.classList.remove('partner-anchor', 'match-anchor', 'dimmed');
    });

    const partnerValues = Object.values(data).flat();

    partnerValues.forEach(val => {
        const targets = document.querySelectorAll(`[data-value="${val}"], input[value="${val}"]`);
        
        targets.forEach(el => {
            const visualEl = el.classList.contains('mood-card') || el.classList.contains('time-btn') 
                             ? el 
                             : el.closest('label');

            if (visualEl) {
                visualEl.classList.add('partner-anchor');
                const isSelected = visualEl.classList.contains('selected') || 
                                 (el.tagName === 'INPUT' && el.checked);
                
                if (isSelected) {
                    visualEl.classList.add('match-anchor');
                }
            }
        });
    });

    if (data.time === 'custom') {
        const slider = document.getElementById('time-slider');
        if (slider) slider.parentElement.classList.add('partner-anchor');
    }
}

// --- UI VUOROVAIKUTUS ---
document.addEventListener('click', (e) => {
    const card = e.target.closest('.mood-card, .time-btn');
    if (card) {
        if (navigator.vibrate) navigator.vibrate(8);
        
        const section = card.parentElement;
        if (!section) return;

        const alreadySelected = card.classList.contains('selected');
        
        section.querySelectorAll('.mood-card, .time-btn').forEach(c => {
            c.classList.remove('selected', 'match-anchor');
            if (c.classList.contains('partner-anchor')) {
                c.classList.add('dimmed');
            }
        });

        if (!alreadySelected) {
            card.classList.add('selected');
            card.classList.remove('dimmed');
            
            if (card.classList.contains('partner-anchor')) {
                card.classList.add('match-anchor');
                if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
            }
        }
    }

    if (e.target.type === 'checkbox') {
        const label = e.target.closest('label');
        if (label && label.classList.contains('partner-anchor')) {
            e.target.checked ? label.classList.add('match-anchor') : label.classList.remove('match-anchor');
        }
    }
});

// --- TIETOJEN KERÄÄMINEN ---
function gatherAllData() {
    const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);
    
    const selectedMood = document.querySelector('.mood-card.selected')?.dataset.value;
    const selectedTimeBtn = document.querySelector('.time-btn.selected');
    
    let time = selectedTimeBtn ? selectedTimeBtn.dataset.value : 'custom';
    let timeDisplay = selectedTimeBtn 
        ? selectedTimeBtn.querySelector('span').textContent 
        : (document.getElementById('time-display')?.textContent || "00:00");

    return {
        mood: selectedMood || null,
        time,
        timeDisplay,
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
    
    if (!details.mood || !details.time) {
        showStatus('Valitse ensin tunnelma ja aika! ✨', 'error');
        return;
    }

    state.myProposal = {
        details,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        round: state.currentRound
    };

    try {
        await db.collection('sessions').doc(state.sessionId)
            .collection('proposals').doc(state.userRole)
            .set(state.myProposal);

        showView(views.waiting);
        checkMatchLogic();
    } catch (err) {
        showStatus('Tallennus epäonnistui: ' + err.message, 'error');
    }
}

// --- MATCH & TULOKSET ---
function checkMatchLogic() {
    if (!state.myProposal || !state.partnerProposal) return;

    const my = state.myProposal.details;
    const partner = state.partnerProposal.details;

    const isExactMatch = JSON.stringify(my) === JSON.stringify(partner);

    if (isExactMatch) {
        playMatchEffects();
        renderFinalResults(true);
    } else {
        showStatus('Vastaukset lähetetty. Kumppanilla on hieman eri toiveita.', 'info');
    }
}

function renderFinalResults(isMatch) {
    const container = document.getElementById('results-content');
    if (!container) return;

    container.innerHTML = `
        <div class="results-wrapper animate-pop">
            <div class="match-hero">
                <div class="match-icon-large">✨</div>
                <h2>${isMatch ? 'Täydellinen Match!' : 'Ehdotukset synkronoitu'}</h2>
            </div>
            
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>Mood</h4>
                    <p>${state.myProposal.details.mood}</p>
                </div>
                <div class="summary-card">
                    <h4>Aika</h4>
                    <p>${state.myProposal.details.timeDisplay}</p>
                </div>
            </div>

            <div class="results-actions">
                <button class="btn btn-primary btn-large" onclick="location.reload()">
                    Uusi Vibe Check
                </button>
                <button class="btn btn-outline btn-large" onclick="emergencyReset()">
                    Nollaa kaikki
                </button>
            </div>
        </div>
    `;
    showView(views.results);
}

function playMatchEffects() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.25;
        audio.play();
    } catch(e) {}
}

// --- APUTOIMINNOT ---
function updateSessionUI() {
    const el = document.getElementById('display-session-id');
    if (el) el.textContent = state.sessionId;
}

async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?s=${state.sessionId}`;
    try {
        await navigator.clipboard.writeText(url);
        showStatus('Linkki kopioitu! 🔗', 'success');
    } catch (err) {
        showStatus('Kopiointi epäonnistui.', 'error');
    }
}

function emergencyReset() {
    if (confirm('🚨 HALUATKO VARMASTI NOLLATA KAIKKI TIEDOT?')) {
        if (confirm('Varmista vielä: Tämä poistaa paikallisen välimuistin ja palaat alkuun.')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = window.location.pathname;
        }
    }
}

// --- ALUSTUS JA ELEMENTTIEN KYTKENTÄ ---
window.addEventListener('load', () => {
    // 1. Tarkista sessio URL:stä
    const sid = getSessionIdFromUrl();
    if (sid) {
        joinSession(sid);
    } else {
        showView(views.landing);
    }

    // 2. Kytke Landing Page painikkeet
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', createSession);

    // 3. Kytke Session Page painikkeet
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', submitProposal);

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) copyBtn.addEventListener('click', copyLink);

    // 4. Emergency Reset (Footer)
    const resetBtns = document.querySelectorAll('.emergency-reset-btn');
    resetBtns.forEach(btn => btn.addEventListener('click', emergencyReset));
    
    // 5. Global Help Button & Modal
    const helpBtn = document.getElementById('global-help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.querySelector('.close-help'); // Varmistetaan jos HTML:ssä on ruksi

    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpModal.classList.add('active');
        });

        // Sulkeminen taustasta
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('active');
        });

        // Sulkeminen erillisestä napista jos sellainen on
        if (helpClose) {
            helpClose.addEventListener('click', () => helpModal.classList.remove('active'));
        }
    }

    // 6. Slider UI
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    if (slider && display) {
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            const h = Math.floor(val / 60).toString().padStart(2, '0');
            const m = (val % 60).toString().padStart(2, '0');
            display.textContent = `${h}:${m}`;
            
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            slider.classList.add('selected');
        });
    }

    // 7. PWA / SW (vapaaehtoinen mutta hyvä olla)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
});