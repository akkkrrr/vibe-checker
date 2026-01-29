const state = {
    currentScreen: 'welcome',
    sessionId: null,
    userRole: null,
    theme: localStorage.getItem('theme') || 'dark',
    selections: {
        mood: null,
        focus: null,
        tempo: null,
        intensity: null,
        control: null,
        role: null,
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

const PRESETS = {
    quickie: { mood: 'villi', focus: 'molemmat', tempo: 'energinen', intensity: 'intensiivinen', time: 'now', specialFocus: ['quickie'] },
    tantric: { mood: 'sensuelli', focus: 'matka-tarkein', tempo: 'rento', intensity: 'lempea', time: 'evening', specialFocus: ['tantric'] }
};

const welcomeScreen = document.getElementById('welcome-screen');
const selectionScreen = document.getElementById('selection-screen');
const resultsScreen = document.getElementById('results-screen');
const historyScreen = document.getElementById('history-screen');
const helpModal = document.getElementById('help-modal');
const matchModal = document.getElementById('match-modal');
const themeToggle = document.getElementById('theme-toggle');
const navButtons = document.querySelectorAll('.nav-btn');
const createSessionBtn = document.getElementById('create-session-btn');
const joinSessionBtn = document.getElementById('join-session-btn');
const quickiePresetBtn = document.getElementById('quickie-preset-btn');
const tantricPresetBtn = document.getElementById('tantric-preset-btn');
const favoritesPresetBtn = document.getElementById('favorites-preset-btn');
const helpBtn = document.getElementById('help-btn');
const modalClose = document.getElementById('modal-close');
const copyLinkBtn = document.getElementById('copy-link-btn');
const cancelSessionBtn = document.getElementById('cancel-session-btn');
const loadFavoritesBtn = document.getElementById('load-favorites-btn');
const saveFavoritesBtn = document.getElementById('save-favorites-btn');
const submitSelectionBtn = document.getElementById('submit-selection-btn');
const backToEditBtn = document.getElementById('back-to-edit-btn');
const cancelProposalBtn = document.getElementById('cancel-proposal-btn');
const counterProposalBtn = document.getElementById('counter-proposal-btn');
const counterProposalBtn2 = document.getElementById('counter-proposal-btn2');
const acceptProposalBtn = document.getElementById('accept-proposal-btn');
const viewMatchDetailsBtn = document.getElementById('view-match-details-btn');
const copySummaryBtn = document.getElementById('copy-summary-btn');
const cancelMatchedSessionBtn = document.getElementById('cancel-matched-session-btn');
const newSessionBtn = document.getElementById('new-session-btn');
const partnerProposalView = document.getElementById('partner-proposal-view');
const matchedView = document.getElementById('matched-view');
const countdownText = document.getElementById('countdown-text');
const matchTimeText = document.getElementById('match-time-text');
const timeButtons = document.querySelectorAll('.time-btn');
const timeSlider = document.getElementById('time-slider');
const timeDisplay = document.getElementById('time-display');
const selectionPreview = document.getElementById('selection-preview');
const previewContent = document.getElementById('preview-content');
const moodCards = document.querySelectorAll('[data-mood]');
const focusCards = document.querySelectorAll('[data-focus]');
const tempoCards = document.querySelectorAll('[data-tempo]');
const intensityCards = document.querySelectorAll('[data-intensity]');
const controlCards = document.querySelectorAll('[data-control]');
const roleCards = document.querySelectorAll('[data-role]');
const communicationCheckboxes = document.querySelectorAll('input[name="communication"]');
const outfitCheckboxes = document.querySelectorAll('input[name="outfit"]');
const nylonCheckboxes = document.querySelectorAll('input[value*="stay-up"], input[value="open-tights"]');
const senseCheckboxes = document.querySelectorAll('input[value="blindfold"], input[value="headphones"], input[value="photography"], input[value="bondage"], input[value="handcuffs"], input[value="ice"], input[value="hot-wax"]');
const bdsmCheckboxes = document.querySelectorAll('input[name="bdsm"]');
const toyCheckboxes = document.querySelectorAll('input[value="vibrator"], input[value="dildo"], input[value="strap-on"], input[value="nipple-clamps"], input[value="anal-plug"], input[value="massage-oil"], input[value="sormipeli"], input[value="feather"]');
const specialFocusCheckboxes = document.querySelectorAll('input[value="partner-orgasm"], input[value="pleasure-only"], input[value="multiple-orgasms"], input[value="edging"], input[value="no-penetration"], input[value="foreplay-focus"], input[value="quickie"], input[value="tantric"]');
const safetyCheckboxes = document.querySelectorAll('input[name="safety"]');
const customWishesInput = document.getElementById('custom-wishes-input');
const sessionIdDisplay = document.getElementById('session-id-display');
const waitingState = document.getElementById('waiting-state');
const matchResults = document.getElementById('match-results');
const historyList = document.getElementById('history-list');

function initTheme() {
    document.body.setAttribute('data-theme', state.theme);
    themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    document.body.setAttribute('data-theme', state.theme);
    themeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    vibrate(10);
    showNotification(state.theme === 'dark' ? '🌙 Tumma tila' : '☀️ Vaalea tila');
}

function vibrate(duration = 10) {
    if ('vibrate' in navigator) navigator.vibrate(duration);
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    switch(screenName) {
        case 'welcome':
            welcomeScreen.classList.add('active');
            document.querySelectorAll('[data-nav="welcome"]').forEach(btn => btn.classList.add('active'));
            break;
        case 'selection':
            selectionScreen.classList.add('active');
            break;
        case 'results':
            resultsScreen.classList.add('active');
            break;
        case 'history':
            historyScreen.classList.add('active');
            document.querySelectorAll('[data-nav="history"]').forEach(btn => btn.classList.add('active'));
            loadHistory();
            break;
    }
    
    state.currentScreen = screenName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createSession() {
    vibrate(20);
    const sessionId = generateSessionId();
    state.sessionId = sessionId;
    state.userRole = 'partner_a';
    window.history.pushState({}, '', `?session=${sessionId}`);
    sessionIdDisplay.textContent = sessionId;
    showScreen('selection');
    showNotification(`✨ Sessio luotu! ID: ${sessionId}`);
}

function cancelSession() {
    if (!confirm('Haluatko varmasti peruuttaa session?')) return;
    vibrate(20);
    state.sessionId = null;
    state.userRole = null;
    clearSelections();
    window.history.pushState({}, '', window.location.pathname);
    showScreen('welcome');
    showNotification('Session peruutettu');
}

function copySessionLink() {
    const url = window.location.href;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            vibrate(20);
            showNotification('🔗 Linkki kopioitu!');
        });
    } else {
        prompt('Kopioi linkki:', url);
    }
}

function joinSession() {
    const sessionId = prompt('Syötä session-ID:');
    if (!sessionId) return;
    vibrate(20);
    state.sessionId = sessionId.toUpperCase();
    state.userRole = 'partner_b';
    window.history.pushState({}, '', `?session=${sessionId}`);
    sessionIdDisplay.textContent = sessionId;
    showScreen('selection');
}

function checkUrlForSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    if (sessionId) {
        state.sessionId = sessionId;
        
        const sessionData = getSessionData(sessionId);
        if (sessionData && sessionData.status === 'waiting_for_b') {
            state.userRole = 'partner_b';
            sessionIdDisplay.textContent = sessionId;
            showPartnerProposalScreen(sessionData);
        } else {
            state.userRole = 'partner_b';
            sessionIdDisplay.textContent = sessionId;
            showScreen('selection');
        }
    }
}

function getSessionData(sessionId) {
    const data = localStorage.getItem(`session_${sessionId}`);
    return data ? JSON.parse(data) : null;
}

function saveSessionData(sessionId, data) {
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(data));
}

function showPartnerProposalScreen(sessionData) {
    showScreen('results');
    waitingState.style.display = 'none';
    matchResults.style.display = 'block';
    partnerProposalView.style.display = 'block';
    
    displayPartnerProposalSummary(sessionData.partner_a_proposal);
}

function displayPartnerProposalSummary(proposal) {
    const labels = {
        mood: { sensuelli: '🌹 Sensuelli', villi: '🔥 Villi', leikkisa: '😈 Leikkisä', dominoiva: '👑 Dominoiva', hella: '💕 Hellä' },
        focus: { 'minun-nautinto': '✨ Minun nautintoni', 'kumppanin-nautinto': '💝 Kumppanin nautinto', 'matka-tarkein': '🎭 Matka > Määränpää', molemmat: '🔥 Molemmat yhtä aikaa' }
    };
    const allLabels = { 'dirty-talk': 'Dirty talk', kuiskailu: 'Kuiskailu', hiljaisuus: 'Hiljaisuus', 'ohjeiden-anto': 'Ohjeiden anto', kehut: 'Kehut', 'valitsen-kumppanille': 'Valitsen kumppanille', 'kumppani-valitsee': 'Kumppani valitsee', pitsialusvaatteet: 'Pitsialusvaatteet', 'body-korset': 'Body/korset', aamutakki: 'Aamutakki', alaston: 'Alaston', 'nude-stayup': 'Nude stay-up', 'black-stayup': 'Musta stay-up', 'white-stayup': 'Valkoinen stay-up', 'red-stayup': 'Punainen stay-up', 'open-tights': 'Avoimet sukkahousut', blindfold: 'Silmien sidonta', headphones: 'Kuulokkeet', photography: 'Valokuvaus', bondage: 'Sidonta', handcuffs: 'Kahleet', ice: 'Jää', 'hot-wax': 'Kuuma vaha', piiskaus: 'Piiskaus', paddle: 'Paddle', raippa: 'Raippa', spanking: 'Spanking', kuristaminen: 'Kuristaminen', pureminen: 'Pureminen', 'kynsien-kaytto': 'Kynnet', nannipuristus: 'Nännipuristus', 'hiusten-vetaminen': 'Hiusten vetäminen', vibrator: 'Vibraattori', dildo: 'Dildo', 'strap-on': 'Strap-on', 'nipple-clamps': 'Nännipiistimet', 'anal-plug': 'Anaalitappi', 'massage-oil': 'Hierontaöljy', sormipeli: 'Sormipeli', feather: 'Feather tickler', 'partner-orgasm': 'Toisen orgasmi edellä', 'pleasure-only': 'Vain nautintoa toiselle', 'multiple-orgasms': 'Useat orgasmit', edging: 'Edging', 'no-penetration': 'Yhdyntä kielletty', 'foreplay-focus': 'Foreplay-fokus', quickie: 'Quickie', tantric: 'Tantric', aftercare: 'Aftercare', 'safe-word': 'Safe word', checkpoints: 'Checkpoints' };
    
    const moodEl = document.getElementById('partner-proposal-mood');
    const spicesEl = document.getElementById('partner-proposal-spices');
    
    let displayParts = [];
    if (proposal.mood) displayParts.push(labels.mood[proposal.mood] || proposal.mood);
    if (proposal.focus) displayParts.push(labels.focus[proposal.focus] || proposal.focus);
    if (proposal.timeDisplay) displayParts.push(`🕐 ${proposal.timeDisplay}`);
    
    moodEl.textContent = displayParts.join(' • ');
    
    const allSpices = [...(proposal.communication || []), ...(proposal.outfits || []), ...(proposal.nylon || []), ...(proposal.senses || []), ...(proposal.bdsm || []), ...(proposal.toys || []), ...(proposal.specialFocus || []), ...(proposal.safety || [])];
    spicesEl.innerHTML = '';
    allSpices.forEach(spice => {
        const tag = document.createElement('span');
        tag.className = 'spice-tag';
        tag.textContent = allLabels[spice] || spice;
        spicesEl.appendChild(tag);
    });
}

function acceptProposal() {
    vibrate(50);
    const sessionData = getSessionData(state.sessionId);
    if (!sessionData) return;
    
    sessionData.status = 'matched';
    sessionData.matched = true;
    sessionData.matchedAt = new Date().toISOString();
    sessionData.partner_b_proposal = sessionData.partner_a_proposal;
    saveSessionData(state.sessionId, sessionData);
    
    const historyData = {
        sessionId: state.sessionId,
        timestamp: sessionData.matchedAt,
        proposedTime: sessionData.partner_a_proposal.timeDisplay,
        mySelections: sessionData.partner_a_proposal,
        partnerSelections: sessionData.partner_a_proposal,
        status: 'matched'
    };
    saveToHistory(historyData);
    
    showMatchModal(sessionData.partner_a_proposal.timeDisplay);
}

function showMatchModal(timeStr) {
    matchModal.classList.add('active');
    if (matchTimeText) matchTimeText.textContent = `Tänään klo ${timeStr}`;
    
    createConfetti();
    
    setTimeout(() => {
        matchModal.classList.remove('active');
        showMatchedResults();
    }, 5000);
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const colors = ['#d4af37', '#ff2d55', '#4caf50', '#2196f3', '#ff9800'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }
}

function showMatchedResults() {
    partnerProposalView.style.display = 'none';
    matchedView.style.display = 'block';
    if (cancelMatchedSessionBtn) cancelMatchedSessionBtn.style.display = 'block';
    
    const sessionData = getSessionData(state.sessionId);
    if (sessionData && sessionData.partner_a_proposal) {
        updateCountdown(sessionData.partner_a_proposal.timeDisplay);
        displayPartnerResults('a', sessionData.partner_a_proposal);
        displayPartnerResults('b', sessionData.partner_a_proposal);
    }
}

function updateCountdown(timeStr) {
    if (!countdownText) return;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0);
    
    if (target < now) {
        target.setDate(target.getDate() + 1);
    }
    
    const diff = target - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    countdownText.textContent = `Tapahtuu ${hoursLeft}h ${minutesLeft}min päästä`;
}

function copySummary() {
    vibrate(20);
    const sessionData = getSessionData(state.sessionId);
    if (!sessionData) return;
    
    const proposal = sessionData.partner_a_proposal;
    const summary = `🎉 Vibe Checker - Sovittu sessio

🕐 Aika: ${proposal.timeDisplay}
🌹 Tunnelma: ${proposal.mood}
✨ Fokus: ${proposal.focus}

🎭 Mausteet: ${[...(proposal.communication || []), ...(proposal.toys || []), ...(proposal.specialFocus || [])].join(', ')}

💝 Valmistaudu upeaan hetkeen!`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(summary).then(() => {
            showNotification('📋 Yhteenveto kopioitu!');
        });
    } else {
        prompt('Kopioi yhteenveto:', summary);
    }
}

function cancelMatchedSession() {
    if (!confirm('Haluatko varmasti perua sovitun session?')) return;
    vibrate(30);
    localStorage.removeItem(`session_${state.sessionId}`);
    state.sessionId = null;
    state.userRole = null;
    clearSelections();
    window.history.pushState({}, '', window.location.pathname);
    showScreen('welcome');
    showNotification('✕ Sovittu sessio peruutettu');
}

function applyPreset(presetName) {
    vibrate(30);
    const preset = PRESETS[presetName];
    if (!preset) return;
    setCardSelection('mood', preset.mood);
    setCardSelection('focus', preset.focus);
    setCardSelection('tempo', preset.tempo);
    setCardSelection('intensity', preset.intensity);
    if (preset.time) setTimeSelection(preset.time);
    clearAllCheckboxes();
    preset.specialFocus.forEach(value => {
        const checkbox = document.querySelector(`input[value="${value}"]`);
        if (checkbox) checkbox.checked = true;
    });
    updateAllSelections();
    if (state.currentScreen === 'welcome') createSession();
    showNotification(`✨ ${presetName === 'quickie' ? 'Quickie' : 'Tantric'}-tila aktivoitu!`);
}

function setTimeSelection(time) {
    timeButtons.forEach(btn => btn.classList.remove('selected'));
    const btn = document.querySelector(`[data-time="${time}"]`);
    if (btn) btn.classList.add('selected');
    state.selections.time = time;
    
    const now = new Date();
    let targetTime;
    switch(time) {
        case 'now': targetTime = new Date(now.getTime() + 5 * 60000); break;
        case '30min': targetTime = new Date(now.getTime() + 30 * 60000); break;
        case '1h': targetTime = new Date(now.getTime() + 60 * 60000); break;
        case 'evening': targetTime = new Date(); targetTime.setHours(20, 0, 0); break;
        default: return;
    }
    
    const minutes = targetTime.getHours() * 60 + targetTime.getMinutes();
    if (timeSlider) {
        timeSlider.value = minutes;
        updateTimeDisplay(minutes);
    }
}

function updateTimeDisplay(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const displayHours = hours === 24 ? 0 : hours;
    state.selections.timeDisplay = `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    if (timeDisplay) timeDisplay.textContent = state.selections.timeDisplay;
}

function setCardSelection(type, value) {
    const cards = document.querySelectorAll(`[data-${type}]`);
    cards.forEach(card => {
        card.classList.remove('selected');
        if (card.dataset[type] === value) card.classList.add('selected');
    });
    state.selections[type] = value;
    updatePreview();
}

function clearAllCheckboxes() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function selectCard(cards, type) {
    cards.forEach(card => {
        card.addEventListener('click', () => {
            vibrate(10);
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selections[type] = card.dataset[type];
            updatePreview();
        });
    });
}

function updateCheckboxSelections(checkboxes, stateKey) {
    state.selections[stateKey] = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function updateAllSelections() {
    updateCheckboxSelections(communicationCheckboxes, 'communication');
    updateCheckboxSelections(outfitCheckboxes, 'outfits');
    updateCheckboxSelections(nylonCheckboxes, 'nylon');
    updateCheckboxSelections(senseCheckboxes, 'senses');
    updateCheckboxSelections(bdsmCheckboxes, 'bdsm');
    updateCheckboxSelections(toyCheckboxes, 'toys');
    updateCheckboxSelections(specialFocusCheckboxes, 'specialFocus');
    updateCheckboxSelections(safetyCheckboxes, 'safety');
    if (customWishesInput) state.selections.customWishes = customWishesInput.value;
    updatePreview();
}

function updatePreview() {
    const s = state.selections;
    if (!s.mood || !s.focus || !s.time) {
        selectionPreview.style.display = 'none';
        return;
    }
    
    const timeLabels = { now: 'Kohta', '30min': '30min päästä', '1h': 'Tunnin päästä', evening: 'Illalla' };
    const moodLabels = { sensuelli: 'Sensuelli', villi: 'Villi', leikkisa: 'Leikkisä', dominoiva: 'Dominoiva', hella: 'Hellä' };
    
    const spiceCount = [
        ...s.communication, ...s.outfits, ...s.nylon, ...s.senses, 
        ...s.bdsm, ...s.toys, ...s.specialFocus, ...s.safety
    ].length;
    
    previewContent.innerHTML = `
        <strong>${moodLabels[s.mood] || s.mood}</strong> • 
        ${s.time ? timeLabels[s.time] || s.timeDisplay : ''}<br>
        ${spiceCount} maustet${spiceCount === 1 ? 'a' : 'ta'} valittu
    `;
    selectionPreview.style.display = 'block';
}

function getSelections() {
    updateAllSelections();
    return { ...state.selections };
}

function setSelections(selections) {
    if (selections.mood) setCardSelection('mood', selections.mood);
    if (selections.focus) setCardSelection('focus', selections.focus);
    if (selections.tempo) setCardSelection('tempo', selections.tempo);
    if (selections.intensity) setCardSelection('intensity', selections.intensity);
    if (selections.control) setCardSelection('control', selections.control);
    if (selections.role) setCardSelection('role', selections.role);
    if (selections.time) setTimeSelection(selections.time);
    
    const setCheckboxes = (checkboxes, values) => checkboxes.forEach(cb => cb.checked = values.includes(cb.value));
    if (selections.communication) setCheckboxes(communicationCheckboxes, selections.communication);
    if (selections.outfits) setCheckboxes(outfitCheckboxes, selections.outfits);
    if (selections.nylon) setCheckboxes(nylonCheckboxes, selections.nylon);
    if (selections.senses) setCheckboxes(senseCheckboxes, selections.senses);
    if (selections.bdsm) setCheckboxes(bdsmCheckboxes, selections.bdsm);
    if (selections.toys) setCheckboxes(toyCheckboxes, selections.toys);
    if (selections.specialFocus) setCheckboxes(specialFocusCheckboxes, selections.specialFocus);
    if (selections.safety) setCheckboxes(safetyCheckboxes, selections.safety);
    if (selections.customWishes && customWishesInput) customWishesInput.value = selections.customWishes;
    state.selections = { ...selections };
    updatePreview();
}

function clearSelections() {
    document.querySelectorAll('.mood-card, .time-btn').forEach(card => card.classList.remove('selected'));
    clearAllCheckboxes();
    if (customWishesInput) customWishesInput.value = '';
    state.selections = { mood: null, focus: null, tempo: null, intensity: null, control: null, role: null, time: null, timeDisplay: '19:00', communication: [], outfits: [], nylon: [], senses: [], bdsm: [], toys: [], specialFocus: [], safety: [], customWishes: '' };
    selectionPreview.style.display = 'none';
}

function saveFavorites() {
    vibrate(20);
    const selections = getSelections();
    if (!selections.mood && !selections.focus) {
        showNotification('❗ Valitse vähintään tunnelma tai fokus!');
        return;
    }
    localStorage.setItem('vibe_checker_favorites', JSON.stringify(selections));
    showNotification('✨ Vakiovarusteet tallennettu!');
}

function loadFavorites() {
    const favoritesJson = localStorage.getItem('vibe_checker_favorites');
    if (!favoritesJson) {
        showNotification('❗ Ei tallennettuja vakiovarusteita!');
        return;
    }
    vibrate(20);
    setSelections(JSON.parse(favoritesJson));
    showNotification('⚡ Vakiovarusteet ladattu!');
}

function loadFavoritesAndCreateSession() {
    const favoritesJson = localStorage.getItem('vibe_checker_favorites');
    if (!favoritesJson) {
        showNotification('❗ Ei tallennettuja vakiovarusteita! Luo sessio ensin.');
        return;
    }
    createSession();
    setTimeout(() => {
        setSelections(JSON.parse(favoritesJson));
        showNotification('⚡ Vakiovarusteet ladattu!');
    }, 300);
}

function submitSelection() {
    const selections = getSelections();
    if (!selections.mood) { showNotification('❗ Valitse tunnelma!'); vibrate([10, 50, 10]); return; }
    if (!selections.focus) { showNotification('❗ Valitse fokus!'); vibrate([10, 50, 10]); return; }
    if (!selections.time) { showNotification('❗ Valitse ajankohta!'); vibrate([10, 50, 10]); return; }
    
    vibrate(30);
    console.log('Submitting selections:', selections);
    
    const sessionData = {
        status: 'waiting_for_b',
        partner_a_proposal: selections,
        partner_b_proposal: null,
        matched: false,
        createdAt: new Date().toISOString()
    };
    
    saveSessionData(state.sessionId, sessionData);
    
    showScreen('results');
    showWaitingState();
    
    showNotification('✅ Ehdotus lähetetty! Odottaa kumppanin vastausta...');
}

function generateMockPartnerSelections() {
    return { mood: 'villi', focus: 'molemmat', tempo: 'energinen', intensity: 'keskiverto', control: 'alistua', role: 'passiivinen', time: 'evening', timeDisplay: '20:30', communication: ['dirty-talk', 'kehut'], outfits: ['pitsialusvaatteet'], nylon: ['black-stayup'], senses: ['blindfold'], bdsm: ['spanking', 'hiusten-vetaminen'], toys: ['vibrator'], specialFocus: ['multiple-orgasms'], safety: ['safe-word', 'aftercare'], customWishes: 'Muista olla lempeä alussa' };
}

function saveToHistory(sessionData) {
    let history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    history.unshift(sessionData);
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem('vibe_history', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">📚</div>
                <p>Ei vielä toteutuneita sessioita</p>
                <p class="info-text-small">Hyväksytyt sessiot näkyvät täällä</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = history.map((session, index) => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
        
        const myMood = session.mySelections.mood || 'Ei valittu';
        const myFocus = session.mySelections.focus || 'Ei valittu';
        const proposedTime = session.proposedTime || 'Ei aikaa';
        const spiceCount = [
            ...(session.mySelections.communication || []),
            ...(session.mySelections.outfits || []),
            ...(session.mySelections.nylon || []),
            ...(session.mySelections.senses || []),
            ...(session.mySelections.bdsm || []),
            ...(session.mySelections.toys || []),
            ...(session.mySelections.specialFocus || [])
        ].length;
        
        return `
            <div class="history-card">
                <div onclick="viewHistorySession(${index})" style="cursor: pointer;">
                    <div class="history-header">
                        <span class="history-date">${dateStr} ${timeStr}</span>
                        <span class="history-badge">✓ Toteutunut</span>
                    </div>
                    <div class="history-summary">
                        <strong>${myMood}</strong> • ${myFocus} • 🕐 ${proposedTime}<br>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">
                            ${spiceCount} maustet${spiceCount === 1 ? 'a' : 'ta'}
                        </span>
                    </div>
                </div>
                <div class="history-card-actions">
                    <button class="btn btn-outline btn-tiny" onclick="deleteHistorySession(${index})">
                        🗑️ Poista
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteHistorySession(index) {
    if (!confirm('Poista tämä sessio historiasta?')) return;
    vibrate(20);
    let history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    history.splice(index, 1);
    localStorage.setItem('vibe_history', JSON.stringify(history));
    loadHistory();
    showNotification('🗑️ Sessio poistettu');
}

function viewHistorySession(index) {
    vibrate(10);
    const history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    const session = history[index];
    if (!session) return;
    
    showScreen('results');
    showMatchResults({
        partner_a: session.mySelections,
        partner_b: session.partnerSelections
    });
}

window.viewHistorySession = viewHistorySession;
window.deleteHistorySession = deleteHistorySession;

function showWaitingState() {
    waitingState.style.display = 'block';
    matchResults.style.display = 'none';
}

function showMatchResults(results) {
    waitingState.style.display = 'none';
    matchResults.style.display = 'block';
    const mySelections = state.userRole === 'partner_a' ? results.partner_a : results.partner_b;
    const partnerSelections = state.userRole === 'partner_a' ? results.partner_b : results.partner_a;
    displayPartnerResults('a', mySelections);
    displayPartnerResults('b', partnerSelections);
}

function displayPartnerResults(partner, selections) {
    const labels = {
        mood: { sensuelli: '🌹 Sensuelli', villi: '🔥 Villi', leikkisa: '😈 Leikkisä', dominoiva: '👑 Dominoiva', hella: '💕 Hellä' },
        focus: { 'minun-nautinto': '✨ Minun nautintoni', 'kumppanin-nautinto': '💝 Kumppanin nautinto', 'matka-tarkein': '🎭 Matka > Määränpää', molemmat: '🔥 Molemmat yhtä aikaa' },
        tempo: { rento: '🐢 Rento', energinen: '⚡ Energinen', spontaani: '🎲 Spontaani' },
        intensity: { lempea: '🌸 Lempeä', keskiverto: '🔶 Keskiverto', intensiivinen: '⚡ Intensiivinen' },
        control: { dominoida: '👑 Haluan dominoida', alistua: '🙇 Haluan alistua', 'tasa-arvo': '⚖️ Tasa-arvo' },
        role: { aktiivinen: '🔥 Aktiivinen', passiivinen: '🌙 Passiivinen', vaihteleva: '🔄 Vaihteleva' }
    };
    const allLabels = { 'dirty-talk': 'Dirty talk', kuiskailu: 'Kuiskailu', hiljaisuus: 'Hiljaisuus', 'ohjeiden-anto': 'Ohjeiden anto', kehut: 'Kehut', 'valitsen-kumppanille': 'Valitsen kumppanille', 'kumppani-valitsee': 'Kumppani valitsee', pitsialusvaatteet: 'Pitsialusvaatteet', 'body-korset': 'Body/korset', aamutakki: 'Aamutakki', alaston: 'Alaston', 'nude-stayup': 'Nude stay-up', 'black-stayup': 'Musta stay-up', 'white-stayup': 'Valkoinen stay-up', 'red-stayup': 'Punainen stay-up', 'open-tights': 'Avoimet sukkahousut', blindfold: 'Silmien sidonta', headphones: 'Kuulokkeet', photography: 'Valokuvaus', bondage: 'Sidonta', handcuffs: 'Kahleet', ice: 'Jää', 'hot-wax': 'Kuuma vaha', piiskaus: 'Piiskaus', paddle: 'Paddle', raippa: 'Raippa', spanking: 'Spanking', kuristaminen: 'Kuristaminen', pureminen: 'Pureminen', 'kynsien-kaytto': 'Kynnet', nannipuristus: 'Nännipuristus', 'hiusten-vetaminen': 'Hiusten vetäminen', vibrator: 'Vibraattori', dildo: 'Dildo', 'strap-on': 'Strap-on', 'nipple-clamps': 'Nännipiistimet', 'anal-plug': 'Anaalitappi', 'massage-oil': 'Hierontaöljy', sormipeli: 'Sormipeli', feather: 'Feather tickler', 'partner-orgasm': 'Toisen orgasmi edellä', 'pleasure-only': 'Vain nautintoa toiselle', 'multiple-orgasms': 'Useat orgasmit', edging: 'Edging', 'no-penetration': 'Yhdyntä kielletty', 'foreplay-focus': 'Foreplay-fokus', quickie: 'Quickie', tantric: 'Tantric', aftercare: 'Aftercare', 'safe-word': 'Safe word', checkpoints: 'Checkpoints' };
    
    const moodEl = document.getElementById(`result-mood-${partner}`);
    const spicesEl = document.getElementById(`result-spices-${partner}`);
    let displayParts = [];
    if (selections.mood) displayParts.push(labels.mood[selections.mood] || selections.mood);
    if (selections.focus) displayParts.push(labels.focus[selections.focus] || selections.focus);
    if (selections.timeDisplay) displayParts.push(`🕐 ${selections.timeDisplay}`);
    if (selections.tempo) displayParts.push(labels.tempo[selections.tempo]);
    if (selections.intensity) displayParts.push(labels.intensity[selections.intensity]);
    if (selections.control) displayParts.push(labels.control[selections.control]);
    if (selections.role) displayParts.push(labels.role[selections.role]);
    moodEl.textContent = displayParts.join(' • ');
    
    const allSpices = [...(selections.communication || []), ...(selections.outfits || []), ...(selections.nylon || []), ...(selections.senses || []), ...(selections.bdsm || []), ...(selections.toys || []), ...(selections.specialFocus || []), ...(selections.safety || [])];
    spicesEl.innerHTML = '';
    allSpices.forEach(spice => {
        const tag = document.createElement('span');
        tag.className = 'spice-tag';
        tag.textContent = allLabels[spice] || spice;
        spicesEl.appendChild(tag);
    });
    if (selections.customWishes) {
        const customTag = document.createElement('span');
        customTag.className = 'spice-tag';
        customTag.textContent = `💭 ${selections.customWishes}`;
        customTag.style.gridColumn = '1 / -1';
        customTag.style.textAlign = 'left';
        spicesEl.appendChild(customTag);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(212, 175, 55, 0.95); color: #0b0b14; padding: 1rem 2rem; border-radius: 12px; font-weight: 500; z-index: 1000; animation: slideDown 0.3s ease; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); max-width: 90%; text-align: center;';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = '@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } @keyframes slideUp { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, -20px); } }';
document.head.appendChild(style);

themeToggle.addEventListener('click', toggleTheme);
helpBtn.addEventListener('click', () => { vibrate(10); helpModal.classList.add('active'); });
modalClose.addEventListener('click', () => helpModal.classList.remove('active'));
helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.remove('active'); });
copyLinkBtn.addEventListener('click', copySessionLink);
cancelSessionBtn.addEventListener('click', cancelSession);

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        vibrate(10);
        showScreen(btn.getAttribute('data-nav'));
    });
});

timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        vibrate(10);
        timeButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selections.time = btn.dataset.time;
        setTimeSelection(btn.dataset.time);
        updatePreview();
    });
});

if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
        const minutes = parseInt(e.target.value);
        updateTimeDisplay(minutes);
        timeButtons.forEach(b => b.classList.remove('selected'));
        state.selections.time = 'custom';
        updatePreview();
    });
}

createSessionBtn.addEventListener('click', createSession);
joinSessionBtn.addEventListener('click', joinSession);
quickiePresetBtn.addEventListener('click', () => applyPreset('quickie'));
tantricPresetBtn.addEventListener('click', () => applyPreset('tantric'));
favoritesPresetBtn.addEventListener('click', loadFavoritesAndCreateSession);
loadFavoritesBtn.addEventListener('click', loadFavorites);
saveFavoritesBtn.addEventListener('click', saveFavorites);
submitSelectionBtn.addEventListener('click', submitSelection);

selectCard(moodCards, 'mood');
selectCard(focusCards, 'focus');
selectCard(tempoCards, 'tempo');
selectCard(intensityCards, 'intensity');
selectCard(controlCards, 'control');
selectCard(roleCards, 'role');

[...communicationCheckboxes, ...outfitCheckboxes, ...nylonCheckboxes, ...senseCheckboxes, ...bdsmCheckboxes, ...toyCheckboxes, ...specialFocusCheckboxes, ...safetyCheckboxes].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        vibrate(5);
        updateAllSelections();
    });
});

if (customWishesInput) customWishesInput.addEventListener('input', () => { state.selections.customWishes = customWishesInput.value; updatePreview(); });

backToEditBtn.addEventListener('click', () => { vibrate(10); showScreen('selection'); });
if (cancelProposalBtn) cancelProposalBtn.addEventListener('click', () => { if (confirm('Peruuta ehdotus?')) { vibrate(20); showScreen('welcome'); clearSelections(); } });
if (counterProposalBtn2) counterProposalBtn2.addEventListener('click', () => { vibrate(10); showScreen('selection'); showNotification('Tee omat valintasi!'); });
if (acceptProposalBtn) acceptProposalBtn.addEventListener('click', acceptProposal);
if (viewMatchDetailsBtn) viewMatchDetailsBtn.addEventListener('click', () => { matchModal.classList.remove('active'); });
if (copySummaryBtn) copySummaryBtn.addEventListener('click', copySummary);
if (cancelMatchedSessionBtn) cancelMatchedSessionBtn.addEventListener('click', cancelMatchedSession);
counterProposalBtn.addEventListener('click', () => { vibrate(10); showScreen('selection'); showNotification('Muokkaa valintojasi ja lähetä uudelleen!'); });
newSessionBtn.addEventListener('click', () => { vibrate(20); state.sessionId = null; state.userRole = null; clearSelections(); window.history.pushState({}, '', window.location.pathname); showScreen('welcome'); });

function init() {
    console.log('🎭 Vibe Checker v5 initialized');
    initTheme();
    checkUrlForSession();
    if (!state.sessionId) showScreen('welcome');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
