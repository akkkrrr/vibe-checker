var supabase;

function initSupabase() {
    const SUPABASE_URL = 'https://lromnuelyivvivqhzoch.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyb21udWVseWl2dml2cWh6b2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzE1ODgsImV4cCI6MjA4NTIwNzU4OH0.qddbQGEMVzp9zlX33jmx7ysLweE9P1LF8EAHB3R6K5E';
    
    if (typeof window.supabase === 'undefined') return false;
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
}

const state = {
    sessionId: null,
    userRole: null,
    theme: localStorage.getItem('theme') || 'dark'
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id + '-screen');
    if (target) target.classList.add('active');
    window.scrollTo(0,0);
}

function notify(msg) {
    const n = document.createElement('div');
    n.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:9999; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.4);";
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 4000);
}

async function createSession() {
    // Luodaan lyhyt tekstipohjainen ID
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Lähetetään vain id ja oletusstatus
    const { error } = await supabase.from('sessions').insert([{ id: id, status: 'waiting' }]);

    if (error) {
        console.error("Supabase Error:", error);
        notify("❌ Virhe: " + error.message);
        return;
    }

    state.sessionId = id;
    state.userRole = 'partner_a';
    document.getElementById('session-id-display').textContent = id;
    
    const url = window.location.origin + window.location.pathname + '?session=' + id;
    navigator.clipboard.writeText(url);
    notify("🔥 Sex Session ID: " + id + " - Linkki kopioitu!");
    showScreen('selection');
}

async function submitSelection() {
    const data = { mood: null, focus: null, time: 'now' };
    const details = {};

    // Kerätään valitut kortit
    document.querySelectorAll('.selected').forEach(el => {
        if (el.dataset.mood) data.mood = el.dataset.mood;
        if (el.dataset.focus) data.focus = el.dataset.focus;
        if (el.dataset.time) data.time = el.dataset.time;
        // Tallennetaan kaikki muutkin data-attribuutit detailsiin
        Object.assign(details, el.dataset);
    });

    // Kerätään kaikki ruksitut ruudut (asusteet jne)
    const checks = document.querySelectorAll('input[type="checkbox"]:checked');
    checks.forEach(c => {
        if (!details[c.name]) details[c.name] = [];
        details[c.name].push(c.value);
    });

    if (!data.mood || !data.focus) {
        notify("❗ Valitse vähintään tunnelma ja fokus");
        return;
    }

    const { error } = await supabase.from('proposals').insert([{
        session_id: state.sessionId,
        user_role: state.userRole,
        mood: data.mood,
        focus: data.focus,
        time: data.time,
        details: details
    }]);

    if (error) {
        notify("❌ Lähetys epäonnistui");
    } else {
        showScreen('results');
        notify("✅ Ehdotus lähetetty!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!initSupabase()) return;

    document.getElementById('create-session-btn').onclick = createSession;
    document.getElementById('submit-selection-btn').onclick = submitSelection;
    
    // Dynaaminen korttien klikkaus (toimii kaikille ryhmille)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        }
    });

    // Teeman vaihto
    document.getElementById('theme-toggle').onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
    };
});