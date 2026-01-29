var supabase; // Estää "already declared" virheen

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
    selections: { mood: null, focus: null, time: null }
};

// --- APUFUNKTIOT ---
function showNotification(msg) {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = 'notification'; // Käyttää style.css tyylejäsi
    note.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:1000; font-weight:600; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
    note.textContent = msg;
    container.appendChild(note);
    setTimeout(() => { note.style.opacity = '0'; setTimeout(() => note.remove(), 500); }, 3000);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
    window.scrollTo(0,0);
}

// --- TOIMINNOT ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('sessions').insert([{ id: id, status: 'waiting' }]);

    if (error) {
        showNotification("❌ Yhteysvirhe");
        return;
    }

    state.sessionId = id;
    state.userRole = 'partner_a';
    document.getElementById('session-id-display').textContent = id;

    // Kopioidaan linkki
    const url = window.location.origin + window.location.pathname + '?session=' + id;
    navigator.clipboard.writeText(url).then(() => {
        showNotification("🔥 Sex Session ID: " + id + " - Linkki kopioitu leikepöydälle!");
        showScreen('selection');
    });
}

async function submitSelection() {
    if (!state.selections.mood || !state.selections.focus) {
        showNotification("Valitse vähintään tunnelma ja fokus!");
        return;
    }

    const { error } = await supabase.from('proposals').insert([{
        session_id: state.sessionId,
        user_role: state.userRole,
        mood: state.selections.mood,
        focus: state.selections.focus,
        time: state.selections.time
    }]);

    if (error) {
        showNotification("❌ Lähetys epäonnistui");
    } else {
        showScreen('results');
        showNotification("✅ Ehdotus lähetetty kumppanille!");
    }
}

// --- EVENTIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (!initSupabase()) return;

    document.getElementById('create-session-btn').onclick = createSession;
    document.getElementById('submit-selection-btn').onclick = submitSelection;
    
    document.getElementById('join-session-btn').onclick = () => {
        const id = prompt("Syötä Session ID:");
        if (id) {
            state.sessionId = id.toUpperCase();
            state.userRole = 'partner_b';
            document.getElementById('session-id-display').textContent = state.sessionId;
            showScreen('selection');
        }
    };

    // Korttien valinta
    document.querySelectorAll('.mood-card').forEach(card => {
        card.onclick = () => {
            const type = card.dataset.mood ? 'mood' : 'focus';
            document.querySelectorAll(`[data-${type}]`).forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selections[type] = card.dataset[type] || card.dataset.mood;
        };
    });

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selections.time = btn.dataset.time;
        };
    });
});