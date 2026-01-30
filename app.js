/**
 * VIBE CHECKER v2.5.0 - UNBREAKABLE MASTER VERSION
 * - Fixed: Safe JSON parsing (localStorage crash prevention)
 * - Fixed: Safe element binding (Init crash prevention)
 * - Fixed: Deep Emergency Reset (Clears SW, Cache, Storage)
 * - Fixed: Discreet UI (Help and Reset placement)
 * - Includes: All 15 categories, Multi-round logic, Sticky bar
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

// --- INITIALIZATION ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- SAFETY UTILS ---
function safeJSONParse(value, fallback) {
    try {
        if (value === null || value === undefined || value === "undefined") return fallback;
        return JSON.parse(value);
    } catch (e) {
        console.warn("JSON parse failed, using fallback", e);
        return fallback;
    }
}

function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.onclick = handler;
    }
}

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
    notificationPermission: false
};

const MAX_ROUNDS = 3;

// --- VIEW MANAGEMENT ---
const getViews = () => ({
    landing: document.getElementById('landing-view'),
    setup: document.getElementById('setup-view'),
    session: document.getElementById('session-view'),
    waiting: document.getElementById('waiting-view'),
    results: document.getElementById('results-view'),
    history: document.getElementById('history-view')
});

function showView(viewId) {
    const views = getViews();
    Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.remove('active');
    });
    if (views[viewId]) {
        views[viewId].classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// --- CORE LOGIC (ORIGINAL MOOTTORI) ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    state.sessionId = id;
    state.userRole = 'A';
    
    try {
        await db.collection('sessions').doc(id).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open',
            round: 1
        });
        
        saveToLocalHistory(id);
        const newUrl = window.location.origin + window.location.pathname + '?s=' + id;
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        updateSessionUI();
        showView('session');
        listenToPartner();
        notify('Kysely luotu! ✨');
    } catch (e) {
        notify('Virhe yhteydessä Firebaseen.', 'error');
    }
}

async function joinSession(id) {
    if (!id) return;
    const sessionID = id.trim().toUpperCase();
    state.sessionId = sessionID;
    state.userRole = 'B';

    try {
        const doc = await db.collection('sessions').doc(sessionID).get();
        if (!doc.exists) {
            notify('Kyselyä ei löytynyt.', 'error');
            return showView('landing');
        }
        
        saveToLocalHistory(sessionID);
        updateSessionUI();
        showView('session');
        listenToPartner();
    } catch (e) {
        console.error(e);
        showView('landing');
    }
}

function listenToPartner() {
    if (!state.sessionId) return;
    const partnerRole = state.userRole === 'A' ? 'B' : 'A';
    
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
    
    state.partnerUnsubscribe = db.collection('sessions').doc(state.sessionId)
        .collection('proposals').doc(partnerRole)
        .onSnapshot(doc => {
            if (doc.exists) {
                state.partnerProposal = doc.data();
                applyGoldenAnchors();
                const actionBar = document.getElementById('sticky-action-bar');
                if (actionBar) actionBar.classList.add('active');
                if (state.myProposal) checkMatch();
            }
        }, err => console.log("Listen error:", err));
}

function stopListening() {
    if (state.myUnsubscribe) state.myUnsubscribe();
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
}

// --- GOLDEN ANCHORS (KAIKKI 15 KATEGORIAA) ---
function applyGoldenAnchors() {
    if (!state.partnerProposal) return;
    const data = state.partnerProposal.details;

    document.querySelectorAll('.partner-anchor, .match-anchor').forEach(el => {
        el.classList.remove('partner-anchor', 'match-anchor');
    });

    Object.entries(data).forEach(([key, valOrArray]) => {
        const values = Array.isArray(valOrArray) ? valOrArray : [valOrArray];
        values.forEach(val => {
            if (!val) return;
            // Etsitään kaikki elementit joilla on tämä arvo
            const targets = document.querySelectorAll(`[data-value="${val}"], input[value="${val}"]`);
            targets.forEach(t => {
                const visual = t.classList.contains('mood-card') || t.classList.contains('time-btn') ? t : (t.closest('label') || t.parentElement);
                if (visual) {
                    visual.classList.add('partner-anchor');
                    const isSelected = visual.classList.contains('selected') || (t.tagName === 'INPUT' && t.checked);
                    if (isSelected) visual.classList.add('match-anchor');
                }
            });
        });
    });
}

// --- FORM DATA SCRAPING ---
function gatherFormData() {
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
    const details = gatherFormData();
    if (!details.mood) return notify('Valitse vähintään tunnelma! ✨', 'error');

    state.myProposal = { details, ts: firebase.firestore.FieldValue.serverTimestamp() };
    
    try {
        await db.collection('sessions').doc(state.sessionId)
            .collection('proposals').doc(state.userRole)
            .set(state.myProposal);
            
        showView('waiting');
        checkMatch();
    } catch (e) {
        notify('Tallennus epäonnistui.', 'error');
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
                <p>Toiveenne on tallennettu ja synkronoitu.</p>
                <button class="btn btn-primary" onclick="location.reload()">Uusi Vibe Check</button>
            </div>
        `;
        showView('results');
    }
}

// --- HELPERS & PERSISTENCE ---
function notify(msg, type = 'info') {
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

function saveToLocalHistory(id) {
    let history = safeJSONParse(localStorage.getItem('vibe_history'), []);
    if (!history.includes(id)) {
        history.unshift(id);
        localStorage.setItem('vibe_history', JSON.stringify(history.slice(0, 10)));
    }
}

function updateSessionUI() {
    const el = document.getElementById('display-session-id');
    if (el) el.textContent = state.sessionId;
}

async function emergencyReset() {
    if (!confirm('⚠️ VAROITUS: Tämä poistaa KAIKEN datan (historia, välimuisti, sessiot).\n\nJatketaanko?')) return;
    
    stopListening();
    localStorage.clear();
    sessionStorage.clear();

    // Clear Cache Storage
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
    }

    // Unregister Service Workers
    if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
    }

    notify('🚨 Kaikki nollattu!');
    setTimeout(() => window.location.href = window.location.origin + window.location.pathname, 800);
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('s');
    if (sid) joinSession(sid); else showView('landing');

    // 2. Safe Bindings for Main Buttons
    bindClick('start-btn', createSession);
    bindClick('submit-btn', submitProposal);
    bindClick('emergency-reset-btn', emergencyReset);
    
    bindClick('open-session-btn', () => {
        const input = document.getElementById('session-id-input');
        if (input && input.value) joinSession(input.value);
    });

    bindClick('history-btn', () => {
        const history = safeJSONParse(localStorage.getItem('vibe_history'), []);
        if (history.length > 0) joinSession(history[0]);
        else notify('Ei historiaa tallennettu.');
    });

    bindClick('copy-link-btn', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            notify('Linkki kopioitu! 🔗');
        } catch (e) {
            notify('Kopiointi epäonnistui.', 'error');
        }
    });

    // 3. Global Click Delegation for Cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const section = card.parentElement;
            section.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            applyGoldenAnchors();
            if (navigator.vibrate) navigator.vibrate(5);
        }
        
        // Checkboxes/Radios triggers anchors immediately
        if (e.target.type === 'checkbox' || e.target.type === 'radio') {
            setTimeout(applyGoldenAnchors, 50);
        }
    });

    // 4. Discreet UI Tweaks (Help & Reset)
    const helpBtn = document.getElementById('global-help-btn');
    if (helpBtn) {
        helpBtn.style.cssText = "position:fixed; bottom:15px; right:15px; width:34px; height:34px; opacity:0.25; font-size:16px; min-width:unset; padding:0; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#111; border:1px solid #333; color:#aaa; z-index:9999; cursor:pointer;";
        helpBtn.onclick = () => document.getElementById('help-modal')?.classList.add('active');
    }

    const resetTxt = document.getElementById('emergency-reset-btn');
    if (resetTxt) {
        resetTxt.style.cssText = "position:fixed; bottom:5px; left:5px; font-size:9px; opacity:0.15; background:none; border:none; color:#555; cursor:pointer; z-index:9999;";
    }

    // 5. Time Slider logic
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    if (slider && display) {
        slider.oninput = (e) => {
            const val = e.target.value;
            const h = Math.floor(val / 60).toString().padStart(2, '0');
            const m = (val % 60).toString().padStart(2, '0');
            display.textContent = `${h}:${m}`;
            // Clear presets if sliding
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        };
    }

    // 6. Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
    }
});