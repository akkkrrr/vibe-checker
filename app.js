// Muuttuja tietokantayhteydelle
var supabaseClient;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        showNotification('❌ Virhe: Supabase ei latautunut');
        return false;
    }
    
    const SUPABASE_URL = 'https://lromnuelyivvivqhzoch.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyb21udWVseWl2dml2cWh6b2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzE1ODgsImV4cCI6MjA4NTIwNzU4OH0.qddbQGEMVzp9zlX33jmx7ysLweE9P1LF8EAHB3R6K5E';
    
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
        timeDisplay: '19:00'
    }
};

// --- APUFUNKTIOT ---

function showNotification(message) {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = 'notification';
    note.textContent = message;
    container.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}

function vibrate(duration = 10) {
    if ('vibrate' in navigator) navigator.vibrate(duration);
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${screenName}-screen`);
    if (target) target.classList.add('active');
    
    if (screenName === 'history') loadHistory();
}

// --- SUPABASE TOIMINNOT ---

async function createSession() {
    vibrate(20);
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabaseClient
        .from('sessions')
        .insert([{ id: sessionId, status: 'waiting_for_first' }]);
    
    if (error) {
        showNotification('❌ Virhe tietokannassa!');
        return;
    }
    
    state.sessionId = sessionId;
    state.userRole = 'partner_a';
    document.getElementById('session-id-display').textContent = `ID: ${sessionId}`;
    setupRealtimeListener();
    showScreen('selection');
    showNotification(`✨ Sessio luotu!`);
}

function setupRealtimeListener() {
    if (state.realtimeChannel) state.realtimeChannel.unsubscribe();
    
    state.realtimeChannel = supabaseClient
        .channel(`session:${state.sessionId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${state.sessionId}` }, 
        payload => handleSessionUpdate(payload))
        .subscribe();
}

function handleSessionUpdate(payload) {
    if (payload.new.status === 'matched') {
        vibrate(50);
        showNotification('💌 Match!');
        document.getElementById('match-modal').classList.add('active');
    }
}

// --- ALUSTUS JA EVENT LISTENERS ---

function init() {
    if (!initSupabase()) return;

    // Nappien kytkentä
    document.getElementById('create-session-btn').addEventListener('click', createSession);
    document.getElementById('join-session-btn').addEventListener('click', () => {
        const id = prompt('Syötä Session ID:');
        if (id) {
            state.sessionId = id.toUpperCase();
            state.userRole = 'partner_b';
            setupRealtimeListener();
            showScreen('selection');
        }
    });

    document.querySelectorAll('.mood-card[data-mood]').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.mood-card[data-mood]').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selections.mood = card.dataset.mood;
            vibrate(5);
        });
    });

    document.getElementById('submit-selection-btn').addEventListener('click', async () => {
        if (!state.selections.mood) return showNotification('Valitse tunnelma!');
        showNotification('🚀 Lähetetään...');
        showScreen('results');
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
    });

    // Navigointi
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.nav));
    });
}

// Käynnistys
document.addEventListener('DOMContentLoaded', init);