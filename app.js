// Käytetään var-sanaa, jotta ei tule "already declared" -virhettä
var supabase;

function initSupabase() {
    const SUPABASE_URL = 'https://lromnuelyivvivqhzoch.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyb21udWVseWl2dml2cWh6b2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzE1ODgsImV4cCI6MjA4NTIwNzU4OH0.qddbQGEMVzp9zlX33jmx7ysLweE9P1LF8EAHB3R6K5E';
    
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        return false;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
}

const state = {
    currentScreen: 'welcome',
    sessionId: null,
    userRole: null,
    theme: localStorage.getItem('theme') || 'dark',
    realtimeChannel: null,
    selections: {
        mood: null,
        focus: null,
        time: null,
        timeDisplay: '19:00',
        communication: [],
        outfits: [],
        nylon: [],
        senses: [],
        bdsm: [],
        toys: [],
        specialFocus: [],
        safety: [],
        customWishes: ''
    }
};

// --- NÄKYMIEN HALLINTA ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId + '-screen');
    if (target) target.classList.add('active');
}

function showNotification(msg) {
    // Luodaan ilmoitus jos sitä ei ole
    alert(msg); // Yksinkertaisuuden vuoksi aluksi näin, voit vaihtaa tyylikkäämpään myöhemmin
}

// --- LOGIIKKA ---
async function createSession() {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
        .from('sessions')
        .insert([{ id: sessionId, status: 'waiting_for_first' }]);

    if (error) {
        console.error('Error:', error);
        showNotification('Tietokantavirhe: Varmista että sessions-taulun id on tyyppiä TEXT');
        return;
    }

    state.sessionId = sessionId;
    state.userRole = 'partner_a';
    document.getElementById('session-id-display').textContent = sessionId;
    showScreen('selection');
    
    // Kopioidaan linkki automaattisesti
    const url = window.location.origin + window.location.pathname + '?session=' + sessionId;
    navigator.clipboard.writeText(url);
    showNotification('Sessio luotu! Linkki kopioitu kaverille lähetettäväksi.');
}

async function submitSelection() {
    if (!state.selections.mood || !state.selections.focus) {
        showNotification('Valitse vähintään tunnelma ja fokus!');
        return;
    }

    const proposalData = {
        session_id: state.sessionId,
        user_role: state.userRole,
        mood: state.selections.mood,
        focus: state.selections.focus,
        time_display: state.selections.timeDisplay
        // Voit lisätä muut sarakkeet tänne kun taulusi on valmis
    };

    const { error } = await supabase.from('proposals').insert([proposalData]);

    if (error) {
        console.error(error);
        showNotification('Virhe lähetyksessä.');
    } else {
        showScreen('results');
        showNotification('Ehdotus lähetetty! Odotetaan kumppania...');
    }
}

// --- KYTKENNÄT (Tämä puuttui!) ---
function setupEventListeners() {
    // Aloitusnapit
    const createBtn = document.getElementById('create-session-btn');
    if (createBtn) createBtn.addEventListener('click', createSession);

    const joinBtn = document.getElementById('join-session-btn');
    if (joinBtn) joinBtn.addEventListener('click', () => {
        const id = prompt('Syötä session ID:');
        if (id) {
            state.sessionId = id.toUpperCase();
            state.userRole = 'partner_b';
            showScreen('selection');
        }
    });

    // Korttien valinta (Moodit)
    document.querySelectorAll('[data-mood]').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('[data-mood]').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selections.mood = card.dataset.mood;
        });
    });

    // Korttien valinta (Fokus)
    document.querySelectorAll('[data-focus]').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('[data-focus]').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selections.focus = card.dataset.focus;
        });
    });

    // Lähetysnappi
    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.addEventListener('click', submitSelection);

    // Teeman vaihto
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
    });
}

// KÄYNNISTYS
document.addEventListener('DOMContentLoaded', () => {
    if (initSupabase()) {
        setupEventListeners();
        console.log('Vibe Checker valmis!');
    }
});