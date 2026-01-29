/**
 * VIBE CHECKER - UNIVERSAL ENGINE v6
 * Tämä koodi toimii suoraan Clauden HTML-rakenteen kanssa.
 */

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
    sessionId: null,
    userRole: null,
    theme: localStorage.getItem('theme') || 'dark',
    selections: {} // Tänne kerätään kaikki dynaamisesti
};

// --- APUFUNKTIOT ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId + '-screen');
    if (target) target.classList.add('active');
    window.scrollTo(0,0);
}

function showNotification(msg) {
    const note = document.createElement('div');
    note.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:9999; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:sans-serif;";
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        note.style.transition = '0.5s';
        setTimeout(() => note.remove(), 500);
    }, 3500);
}

// --- SESSION HALLINTA ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
        .from('sessions')
        .insert([{ id: id, status: 'waiting' }]);

    if (error) {
        showNotification("❌ Yhteysvirhe tietokantaan!");
        console.error(error);
        return;
    }

    state.sessionId = id;
    state.userRole = 'partner_a';
    document.getElementById('session-id-display').textContent = id;
    
    const url = window.location.origin + window.location.pathname + '?session=' + id;
    navigator.clipboard.writeText(url);
    
    showNotification("🔥 Sex Session ID: " + id + " - Linkki kopioitu!");
    showScreen('selection');
}

// --- LÄHETYS ---
async function submitSelection() {
    const finalSelections = {};
    
    // 1. Kerätään kortit (Mood, Focus, Tempo, Intensity, Control, Role, Time)
    // Etsitään kaikki elementit joissa on 'selected' luokka
    document.querySelectorAll('.selected').forEach(el => {
        Object.keys(el.dataset).forEach(key => {
            finalSelections[key] = el.dataset[key];
        });
    });

    // 2. Kerätään checkboxit (Communication, Outfits, Spice/Mausteet jne.)
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkedBoxes.forEach(cb => {
        const category = cb.name || 'other';
        if (!finalSelections[category]) finalSelections[category] = [];
        finalSelections[category].push(cb.value);
    });

    // 3. Tekstikenttä
    const wishes = document.querySelector('textarea');
    if (wishes) finalSelections.custom_wishes = wishes.value;

    // Tarkistetaan pakolliset (Mood ja Focus on hyvä olla)
    if (!finalSelections.mood || !finalSelections.focus) {
        showNotification("❗ Valitse vähintään Tunnelma ja Fokus!");
        return;
    }

    const { error } = await supabase.from('proposals').insert([{
        session_id: state.sessionId,
        user_role: state.userRole,
        mood: finalSelections.mood,
        focus: finalSelections.focus,
        time: finalSelections.time || 'now',
        details: finalSelections // Tänne menee KAIKKI (asusteet yms.)
    }]);

    if (error) {
        showNotification("❌ Lähetys epäonnistui!");
        console.error(error);
    } else {
        showScreen('results');
        showNotification("✅ Ehdotus lähetetty!");
    }
}

// --- INTERAKTIOT (Kortit ja Napit) ---
function setupEventListeners() {
    // Alun napit
    document.getElementById('create-session-btn').onclick = createSession;
    
    document.getElementById('join-session-btn').onclick = () => {
        const id = prompt("Syötä Session ID:");
        if (id) {
            state.sessionId = id.toUpperCase();
            state.userRole = 'partner_b';
            document.getElementById('session-id-display').textContent = state.sessionId;
            showScreen('selection');
        }
    };

    // Lähetysnappi
    const submitBtn = document.getElementById('submit-selection-btn');
    if (submitBtn) submitBtn.onclick = submitSelection;

    // Teeman vaihto
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
        themeBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    };

    // DYNAAMINEN KORTTI-KLIKKAUS
    // Tämä hoitaa kaikki: tunnelmat, fokukset, ajat ja muut ryhmät
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            // Etsitään ryhmä (esim. kaikki saman kategorian kortit)
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });
}

// KÄYNNISTYS
document.addEventListener('DOMContentLoaded', () => {
    if (initSupabase()) {
        setupEventListeners();
        console.log("Vibe Checker Production ready.");
    }
});