// --- KOPIOI TÄMÄ KOKO APP.JS TIEDOSTOON ---

// Lisää tähän alkuun Firebase-konfiguraatiosi (kopioi se vanhasta app.js:stäsi)
// const firebaseConfig = { ... }; 
// firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let state = {
    sessionId: null,
    userRole: null
};

// --- NÄYTÖN VAIHTO ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
}

// --- AIKARAJAN PÄIVITYS ---
const timeInput = document.getElementById('session-time');
const timeDisplay = document.getElementById('time-display');
if(timeInput) {
    timeInput.oninput = () => { timeDisplay.innerText = timeInput.value; };
}

// --- VALINTOJEN POIMIMINEN (Kortit) ---
document.querySelectorAll('.mood-card').forEach(card => {
    card.onclick = () => {
        const parent = card.parentElement;
        parent.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    };
});

// --- EHDOTUKSEN LÄHETYS ---
async function submitSelection() {
    const details = {
        spices: [],
        duration: document.getElementById('session-time').value + " min"
    };

    // Poimi valitut kortit
    document.querySelectorAll('.mood-card.selected').forEach(el => {
        if (el.dataset.mood) details.mood = el.dataset.mood;
        if (el.dataset.focus) details.focus = el.dataset.focus;
    });

    // Poimi kaikki raksitut ruudut (Asut, BDSM, Aftercare jne.)
    document.querySelectorAll('input[name="spice"]:checked').forEach(cb => {
        details.spices.push(cb.value);
    });

    if (!details.mood || !details.focus) {
        alert("Valitse vähintään tunnelma ja fokus!");
        return;
    }

    try {
        const updateData = {};
        updateData[`proposals.${state.userRole}`] = details;
        updateData.status = 'negotiating';
        
        await db.collection('sessions').doc(state.sessionId).update(updateData);
        showScreen('waiting');
    } catch (e) {
        console.error(e);
        alert("Virhe! Tarkista nettiyhteys.");
    }
}

// --- ALUSTUS ---
document.getElementById('create-session-btn').onclick = async () => {
    const newDoc = await db.collection('sessions').add({
        status: 'open',
        proposals: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    state.sessionId = newDoc.id;
    state.userRole = 'creator';
    showScreen('selection');
};

document.getElementById('submit-proposal-btn').onclick = submitSelection;