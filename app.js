/**
 * VIBE CHECKER v2.3.8 - FULL MASTER INTEGRATION
 * - Fixed: Golden Anchors persistence and checkbox matching
 * - Improved: UI State syncing for partner proposals
 * - Optimized: Element selection for cards and inputs
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

// --- GLOBAALI TILA ---
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
    user: null
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

// --- SESSION HALLINTA ---
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
            // Päivitetään tila vain jos data on oikeasti muuttunut
            if (JSON.stringify(state.partnerProposal) !== JSON.stringify(newData)) {
                state.partnerProposal = newData;
                handlePartnerUpdate();
            }
        }
    }, err => console.error("Snapshot error:", err));
}

function handlePartnerUpdate() {
    if (!state.partnerProposal || !state.partnerProposal.details) return;

    // Jos käyttäjä on B, näytetään Sticky Bar ja Ankkurit heti
    if (state.userRole === 'B') {
        if (stickyActionBar) stickyActionBar.classList.add('active');
    }
    
    // Päivitetään visuaaliset ankkurit aina kun kumppanin data muuttuu
    applyGoldenAnchors(state.partnerProposal.details);

    if (state.myProposal) {
        checkMatchLogic();
    }
}

// --- ANKKURIT (KORJATTU LOGIIKKA) ---
function applyGoldenAnchors(details = null) {
    const data = details || (state.partnerProposal ? state.partnerProposal.details : null);
    if (!data) return;

    // Puhdistetaan vanhat ankkurit
    document.querySelectorAll('.partner-anchor, .match-anchor, .dimmed').forEach(el => {
        el.classList.remove('partner-anchor', 'match-anchor', 'dimmed');
    });

    // Käydään läpi kaikki kumppanin valinnat (sekä yksittäiset että listat)
    Object.keys(data).forEach(key => {
        const valueOrArray = data[key];
        const values = Array.isArray(valueOrArray) ? valueOrArray : [valueOrArray];

        values.forEach(val => {
            if (!val) return;

            // Etsitään kaikki elementit, joilla on tämä arvo (mood-cards, time-btns tai checkboxit)
            const targets = document.querySelectorAll(`[data-value="${val}"], input[value="${val}"]`);
            
            targets.forEach(el => {
                let visualEl = null;

                if (el.classList.contains('mood-card') || el.classList.contains('time-btn')) {
                    visualEl = el;
                } else if (el.tagName === 'INPUT') {
                    visualEl = el.closest('label') || el.parentElement;
                }

                if (visualEl) {
                    visualEl.classList.add('partner-anchor');
                    
                    // Tarkistetaan onko käyttäjä itse valinnut saman
                    const isSelected = visualEl.classList.contains('selected') || 
                                     (el.tagName === 'INPUT' && el.checked);
                    
                    if (isSelected) {
                        visualEl.classList.add('match-anchor');
                    } else {
                        // Jos käyttäjä on valinnut jotain muuta tästä kategoriasta, himmennetään kumppanin ankkuri
                        const siblings = visualEl.parentElement.querySelectorAll('.selected, input:checked');
                        if (siblings.length > 0) {
                            visualEl.classList.add('dimmed');
                        }
                    }
                }
            });
        });
    });

    // Erityiskäsittely custom-ajalle
    if (data.time === 'custom') {
        const slider = document.getElementById('time-slider');
        if (slider) {
            const container = slider.closest('.time-custom-container') || slider.parentElement;
            container.classList.add('partner-anchor');
        }
    }
}

// --- UI VUOROVAIKUTUS ---
document.addEventListener('click', (e) => {
    const card = e.target.closest('.mood-card, .time-btn');
    if (card) {
        if (navigator.vibrate) navigator.vibrate(8);
        
        const section = card.parentElement;
        const alreadySelected = card.classList.contains('selected');
        
        section.querySelectorAll('.mood-card, .time-btn').forEach(c => {
            c.classList.remove('selected', 'match-anchor', 'dimmed');
        });

        if (!alreadySelected) {
            card.classList.add('selected');
        }
        
        // Päivitä ankkurien tila (match/dimmed) heti klikkauksen jälkeen
        applyGoldenAnchors();
    }

    if (e.target.type === 'checkbox') {
        // Viiveellä, jotta checkbox ehtii päivittyä
        setTimeout(() => applyGoldenAnchors(), 50);
    }
});

// --- TIETOJEN KERÄÄMINEN ---
function gatherAllData() {
    const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);
    
    const selectedMood = document.querySelector('.mood-card.selected')?.dataset.value;
    const selectedTimeBtn = document.querySelector('.time-btn.selected');
    
    let time = selectedTimeBtn ? selectedTimeBtn.dataset.value : 'custom';
    let timeDisplay = selectedTimeBtn 
        ? selectedTimeBtn.querySelector('span')?.textContent || selectedTimeBtn.textContent
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
        showStatus('Valitse vähintään tunnelma ja aika! ✨', 'error');
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

    const myStr = JSON.stringify(state.myProposal.details);
    const partnerStr = JSON.stringify(state.partnerProposal.details);

    if (myStr === partnerStr) {
        playMatchEffects();
        renderFinalResults(true);
    } else {
        showStatus('Vastaukset tallennettu. Odotetaan kumppania...', 'info');
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
                    <p>${state.myProposal.details.mood || 'Ei valittu'}</p>
                </div>
                <div class="summary-card">
                    <h4>Aika</h4>
                    <p>${state.myProposal.details.timeDisplay || '00:00'}</p>
                </div>
            </div>

            <div class="results-actions">
                <button class="btn btn-primary btn-large" onclick="location.reload()">
                    Uusi Vibe Check
                </button>
                <button class="btn btn-outline btn-large emergency-reset-btn">
                    Nollaa kaikki
                </button>
            </div>
        </div>
    `;
    
    // Uudelleenkytketään reset-nappi koska se luotiin dynaamisesti
    const resetBtn = container.querySelector('.emergency-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', emergencyReset);
    
    showView(views.results);
}

function playMatchEffects() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.2;
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
        // Fallback vanhemmille selaimille
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showStatus('Linkki kopioitu! 🔗', 'success');
    }
}

function emergencyReset() {
    if (confirm('🚨 HALUATKO VARMASTI NOLLATA KAIKKI TIEDOT?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = window.location.origin + window.location.pathname;
    }
}

// --- ALUSTUS ---
window.addEventListener('load', () => {
    const sid = getSessionIdFromUrl();
    if (sid) {
        joinSession(sid);
    } else {
        showView(views.landing);
    }

    // Kytkennät
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', createSession);

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', submitProposal);

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) copyBtn.addEventListener('click', copyLink);

    const resetBtns = document.querySelectorAll('.emergency-reset-btn');
    resetBtns.forEach(btn => btn.addEventListener('click', emergencyReset));
    
    // Help Modal
    const helpBtn = document.getElementById('global-help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.querySelector('.close-help');

    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpModal.classList.add('active');
        });
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('active');
        });
        if (helpClose) {
            helpClose.addEventListener('click', () => helpModal.classList.remove('active'));
        }
    }

    // Slider
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    if (slider && display) {
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            const h = Math.floor(val / 60).toString().padStart(2, '0');
            const m = (val % 60).toString().padStart(2, '0');
            display.textContent = `${h}:${m}`;
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        });
    }
});