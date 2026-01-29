/**
 * VIBE CHECKER v1.6 - COMPLETE
 * - Enhanced Match Visualization (15 categories)
 * - Notification System (Browser + Visual + Audio)
 * - Mobile Quick Actions (Sticky Footer)
 * - Detailed History View
 * Firebase Firestore + Vercel
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
    user: null  // ← Valmius Phase 3 Auth:lle
};

const MAX_ROUNDS = 3;

// --- NÄKYMÄT ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id + '-screen');
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
}

function notify(msg) {
    const n = document.createElement('div');
    n.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#d4af37; color:black; padding:15px 25px; border-radius:30px; z-index:10000; font-weight:600; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: sans-serif; text-align:center;";
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.opacity = '0';
        n.style.transition = '0.5s';
        setTimeout(() => n.remove(), 500);
    }, 4000);
}

function showBanner(message) {
    const existing = document.querySelector('.prefill-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = 'prefill-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <span style="flex: 1;">${message}</span>
            <button onclick="this.closest('.prefill-banner').remove()" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; padding:0 10px;">✕</button>
        </div>
    `;
    
    const container = document.querySelector('#selection-screen .container');
    const header = container.querySelector('.header-section');
    if (header) {
        header.after(banner);
    } else {
        container.prepend(banner);
    }
    
    setTimeout(() => banner.remove(), 10000);
}

// --- NOTIFICATION SYSTEM ---
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Browser ei tue notifikaatioita");
        return false;
    }
    
    if (Notification.permission === "granted") {
        state.notificationPermission = true;
        return true;
    }
    
    if (Notification.permission !== "denied") {
        // Näytä ystävällinen banneri
        const banner = document.createElement('div');
        banner.className = 'permission-banner';
        banner.innerHTML = `
            <div class="permission-content">
                <span>🔔 Salli ilmoitukset, niin saat tiedon kun kumppanisi vastaa!</span>
                <button class="btn btn-small btn-primary" onclick="acceptNotifications(this.closest('.permission-banner'))">
                    Salli
                </button>
                <button class="btn btn-small btn-outline" onclick="this.parentElement.parentElement.remove()">
                    Ei nyt
                </button>
            </div>
        `;
        document.body.appendChild(banner);
    }
    
    return false;
}

async function acceptNotifications(banner) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        state.notificationPermission = true;
        notify("✅ Ilmoitukset päällä!");
    }
    banner.remove();
}

function triggerNotification(title, body, type) {
    // 1. Browser Notification (jos sivu taustalla)
    if (Notification.permission === "granted" && document.hidden) {
        const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'vibe-checker-' + type,
            requireInteraction: type === 'match',
            vibrate: [200, 100, 200]
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
    
    // 2. Äänimerkki
    playNotificationSound(type);
    
    // 3. Värinä
    if (navigator.vibrate) {
        if (type === 'match') {
            navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
        } else {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    // 4. Title Flash (jos taustalla)
    if (document.hidden) {
        flashTitle(title);
    }
    
    // 5. Visual Badge
    showVisualBadge(type);
    
    // 6. In-app toast
    notify(body);
}

function playNotificationSound(type) {
    // Simple beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXyzn0vBSF1xe/glEILElyx6+ytWhYISKDe8sFuJAUuhM/z1YU2Bhxqvu7mnEoPEFKq5O+zYBoGPJPY88p2KwUme8rx3I0+CRZiturqpVITC0mi4PK9ayEFMIXP89GBMgYeb8Lv45lEDQ5WrOjwsF4YBz6Y2/PGcykFKH7M8tp+OggYZLrs6aVRFAtNpuHyvWYcBTaN1fLOfS8FIXbF7+GUQgsRXLHr7K1aFghIot7xwW4kBS6Dz/PVhTYGHGq+7uacSg8QUqrk77NgGgY8k9jzyncqBSZ8yvHbiT4JFWe56+ulUhILSaLg8bxrIQUvhtDz0YQzBh5uwu/jmUQNDlWr5++wXhgHPpjb88h0KwUofszy2n04BxhjuezopVEUC02m4vK7aB0FNo3V8s19LgUgdsXv4ZRCCxFcsevtrFoWCEii3vHBbiQFLoTO89SENAYcar7u5ZxKDxBSq+TwsV8aBzyU2fPIcysEJXrJ8NqJPwoVabrr66dSEwtJouDxu2ogBS2G0PLRgzUGHm/C7+OZRA0OVazn77BeGAc+mNvzyHMrBCd9y/LafjgHGGO57OilURQLTKbh8btpHAU1jdXyznwuBSB2xe/hlEILEFux6+ytWhYISKHe8cFuJAUthM7z1IU2Bhpqvu7mnUoPEFKq5O+yYRoGPJPZ88p1KwUmfMrx2ok+CRVnuevqpVITC0mi4PG7aiEFL4bQ89GDNQYdccPv45lEDQ5Vq+fvsF4YBz6Y2/PIdCsEJ33L8tp+OAcYYrns6KRSFApMpuHxu2kbBTWO1vLOey4FIHbF7+GUQgsRW7Hr7axaFghIod7xwW4kBS6Ez/PUhTYGGmq+7uWcSg8QUqvk8LFfGgY7k9jzx3IqBCR6yu/ciT8KFGm66+ulUhILSKHf8bpqIAUuhdDy0YM2Bh1xw+/jmEQNDlWr5++wXxgHPpjb88dyKwQnfcvy2n44BxhiuOzpo1EVCkyq4fK6aRwFNY7W8s98LAUgdsXv4JVCCxBbsersrFoWCEih3vHBbiMEL4XP89SFNQY');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

let titleFlashInterval = null;
function flashTitle(message) {
    if (titleFlashInterval) clearInterval(titleFlashInterval);
    
    const originalTitle = document.title;
    let count = 0;
    
    titleFlashInterval = setInterval(() => {
        document.title = (count % 2 === 0) ? message : originalTitle;
        count++;
        
        if (count >= 10) {
            clearInterval(titleFlashInterval);
            titleFlashInterval = null;
            document.title = originalTitle;
        }
    }, 1000);
    
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && titleFlashInterval) {
            clearInterval(titleFlashInterval);
            titleFlashInterval = null;
            document.title = originalTitle;
        }
    }, { once: true });
}

function showVisualBadge(type) {
    const oldBadge = document.querySelector('.notification-badge');
    if (oldBadge) oldBadge.remove();
    
    const navBar = document.querySelector('.nav-bar');
    if (!navBar) return;
    
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.innerHTML = type === 'match' ? '💕 Match!' : '✏️ Uusi ehdotus';
    
    navBar.style.position = 'relative';
    navBar.appendChild(badge);
    
    badge.onclick = () => badge.remove();
    setTimeout(() => badge.remove(), 10000);
}

// --- REALTIME KUUNTELU ---
function startListening() {
    stopListening();
    
    const partnerRole = state.userRole === 'partner_a' ? 'partner_b' : 'partner_a';
    
    state.partnerUnsubscribe = db.collection("proposals")
        .where("sessionId", "==", state.sessionId)
        .where("userRole", "==", partnerRole)
        .orderBy("round", "desc")
        .limit(1)
        .onSnapshot(
            (snapshot) => {
                if (!snapshot.empty) {
                    const newData = snapshot.docs[0].data();
                    const oldData = state.partnerProposal;
                    
                    state.partnerProposal = newData;
                    
                    // UUSI VASTAUS (timestamp comparison)
                    if (oldData && newData.createdAt && oldData.createdAt) {
                        if (newData.createdAt.seconds > oldData.createdAt.seconds) {
                            if (newData.status === "accepted") {
                                triggerNotification(
                                    '💕 Vibe Match!',
                                    'Kumppanisi hyväksyi ehdotuksesi!',
                                    'match'
                                );
                                renderResults();
                            } else if (newData.status === "modified") {
                                triggerNotification(
                                    '✏️ Uusi ehdotus',
                                    'Kumppanisi muokkasi ehdotusta!',
                                    'modified'
                                );
                            }
                        }
                    }
                    
                    // ENSIMMÄINEN VASTAUS
                    if (!oldData && newData.status === "accepted") {
                        triggerNotification(
                            '💕 Vibe Match!',
                            'Kumppanisi hyväksyi ehdotuksesi!',
                            'match'
                        );
                        renderResults();
                    }
                }
            },
            (error) => {
                console.error("Realtime error:", error);
                notify("❌ Yhteys katkesi!");
            }
        );
}

function stopListening() {
    if (state.myUnsubscribe) state.myUnsubscribe();
    if (state.partnerUnsubscribe) state.partnerUnsubscribe();
}

// --- ESITÄYTTÖ (KAIKKI kategoriat) ---
function prefillForm(details) {
    clearAllSelections();
    
    // Mood
    if (details.mood) {
        const card = document.querySelector(`[data-mood="${details.mood}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Focus
    if (details.focus) {
        const card = document.querySelector(`[data-focus="${details.focus}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Tempo
    if (details.tempo) {
        const card = document.querySelector(`[data-tempo="${details.tempo}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Intensity
    if (details.intensity) {
        const card = document.querySelector(`[data-intensity="${details.intensity}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Control
    if (details.control) {
        const card = document.querySelector(`[data-control="${details.control}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Role
    if (details.role) {
        const card = document.querySelector(`[data-role="${details.role}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.animation = 'prefillHighlight 1s ease';
        }
    }
    
    // Time
    if (details.time) {
        if (details.time === 'custom' && details.timeDisplay) {
            // Slider: käytä custom aikaa
            const timeSlider = document.getElementById('time-slider');
            const timeDisplay = document.getElementById('time-val');
            
            if (timeSlider && timeDisplay) {
                // Parse HH:MM
                const [hours, mins] = details.timeDisplay.split(':').map(Number);
                const totalMinutes = hours * 60 + mins;
                
                timeSlider.value = totalMinutes;
                timeDisplay.textContent = details.timeDisplay;
                timeSlider.classList.add('selected');
                
                // Päivitä progress bar
                const progress = (totalMinutes / 1440) * 100;
                timeSlider.style.setProperty('--slider-progress', `${progress}%`);
                timeSlider.style.animation = 'prefillHighlight 1s ease';
            }
        } else {
            // Kortit
            const card = document.querySelector(`[data-time="${details.time}"]`);
            if (card) {
                card.classList.add('selected');
                card.style.animation = 'prefillHighlight 1s ease';
            }
        }
    }
    
    // Checkboxit
    Object.entries(details).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            values.forEach(val => {
                const checkbox = document.querySelector(`input[value="${val}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    const label = checkbox.closest('label');
                    if (label) label.style.animation = 'prefillHighlight 1s ease';
                }
            });
        }
    });
}

function clearAllSelections() {
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
}

// --- TOIMINNOT ---
async function createSession() {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Pyydä notification-lupa
    requestNotificationPermission();
    
    try {
        await db.collection("sessions").doc(id).set({
            status: "waiting",
            currentRound: 1,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.sessionId = id;
        state.userRole = 'partner_a';
        state.currentRound = 1;
        
        document.getElementById('session-id-display').textContent = id;
        
        const url = window.location.origin + window.location.pathname + '?session=' + id;
        navigator.clipboard.writeText(url);
        
        notify("🔥 Sessio luotu ja linkki kopioitu!");
        showScreen('selection');
        startListening();
    } catch (e) {
        console.error(e);
        notify("❌ Virhe session luonnissa!");
    }
}

async function joinSession(sessionId) {
    state.sessionId = sessionId;
    state.userRole = 'partner_b';
    
    document.getElementById('session-id-display').textContent = sessionId;
    
    const snapshot = await db.collection("proposals")
        .where("sessionId", "==", sessionId)
        .where("userRole", "==", "partner_a")
        .orderBy("round", "desc")
        .limit(1)
        .get();
    
    if (!snapshot.empty) {
        const partnerData = snapshot.docs[0].data();
        state.originalProposal = partnerData;
        state.currentRound = partnerData.round + 1;
        
        prefillForm(partnerData.details);
        
        showBanner(`💡 Lomake esitäytetty kumppanisi ehdotuksella (kierros ${partnerData.round}). Voit muokata vapaasti tai hyväksyä sellaisenaan.`);
        
        addQuickAcceptButton();
    }
    
    showScreen('selection');
    startListening();
    notify("⚡ Liitytty sessioon: " + sessionId);
}

function addQuickAcceptButton() {
    const submitSection = document.querySelector('.submit-section');
    if (!submitSection) return;
    
    const existingBtn = document.getElementById('quick-accept-btn');
    if (existingBtn) return;
    
    const acceptBtn = document.createElement('button');
    acceptBtn.id = 'quick-accept-btn';
    acceptBtn.className = 'btn btn-primary btn-large';
    acceptBtn.innerHTML = '✅ Hyväksy sellaisenaan';
    acceptBtn.onclick = quickAccept;
    
    submitSection.prepend(acceptBtn);
}

async function quickAccept() {
    if (!state.originalProposal) return;
    
    try {
        const docId = `${state.sessionId}_${state.userRole}_round${state.currentRound}`;
        
        await db.collection("proposals").doc(docId).set({
            sessionId: state.sessionId,
            userRole: state.userRole,
            round: state.currentRound,
            status: "accepted",
            details: state.originalProposal.details,
            respondedTo: `${state.sessionId}_partner_a_round${state.originalProposal.round}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.myProposal = {
            details: state.originalProposal.details,
            status: "accepted"
        };
        
        notify("✅ Hyväksytty!");
        renderResults();
    } catch (e) {
        console.error(e);
        notify("❌ Hyväksyntä epäonnistui!");
    }
}

async function submitSelection() {
    const details = {};
    let mood = "ei valittu";
    let focus = "ei valittu";
    let tempo = null;
    let intensity = null;
    let control = null;
    let role = null;
    let time = null;
    let timeDisplay = null;

    // Kerää kortit
    document.querySelectorAll('.selected').forEach(el => {
        if (el.dataset.mood) mood = el.dataset.mood;
        if (el.dataset.focus) focus = el.dataset.focus;
        if (el.dataset.tempo) tempo = el.dataset.tempo;
        if (el.dataset.intensity) intensity = el.dataset.intensity;
        if (el.dataset.control) control = el.dataset.control;
        if (el.dataset.role) role = el.dataset.role;
        if (el.dataset.time) {
            time = el.dataset.time;
            timeDisplay = el.dataset.timeDisplay || el.textContent.trim();
        }
    });
    
    // Tarkista slider (jos ei korttia valittu)
    if (!time) {
        const timeSlider = document.getElementById('time-slider');
        if (timeSlider && timeSlider.classList.contains('selected')) {
            const minutes = parseInt(timeSlider.value);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            time = 'custom';
            timeDisplay = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }
    }

    // Kerää checkboxit
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
        const cat = c.name || 'extras';
        if (!details[cat]) details[cat] = [];
        details[cat].push(c.value);
    });
    
    // Lisää yksittäiset valinnat
    if (mood !== "ei valittu") details.mood = mood;
    if (focus !== "ei valittu") details.focus = focus;
    if (tempo) details.tempo = tempo;
    if (intensity) details.intensity = intensity;
    if (control) details.control = control;
    if (role) details.role = role;
    if (time) details.time = time;
    if (timeDisplay) details.timeDisplay = timeDisplay;
    
    // Validoi pakolliset
    if (mood === "ei valittu") {
        notify("❗ Valitse tunnelma!");
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        return;
    }
    if (focus === "ei valittu") {
        notify("❗ Valitse fokus!");
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        return;
    }
    if (!time) {
        notify("❗ Valitse ajankohta!");
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        return;
    }
    
    if (navigator.vibrate) navigator.vibrate(30);
    
    if (state.currentRound > MAX_ROUNDS) {
        notify("⚠️ Maksimi neuvottelukierrokset (3) saavutettu!");
        return;
    }
    
    let changes = null;
    let status = "pending";
    let respondedTo = null;
    
    if (state.originalProposal && state.userRole === 'partner_b') {
        changes = calculateChanges(state.originalProposal.details, details);
        
        if (changes.added.length === 0 && changes.removed.length === 0) {
            status = "accepted";
        } else {
            status = "modified";
        }
        
        respondedTo = `${state.sessionId}_partner_a_round${state.originalProposal.round}`;
    }
    
    try {
        const docId = `${state.sessionId}_${state.userRole}_round${state.currentRound}`;
        
        await db.collection("proposals").doc(docId).set({
            sessionId: state.sessionId,
            userRole: state.userRole,
            round: state.currentRound,
            status: status,
            mood: mood,
            focus: focus,
            tempo: tempo,
            intensity: intensity,
            control: control,
            role: role,
            time: time,
            timeDisplay: timeDisplay,
            details: details,
            changes: changes,
            respondedTo: respondedTo,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        state.myProposal = { details, status, changes };
        
        if (status === "accepted") {
            renderResults();
        } else {
            showScreen('results');
            document.getElementById('waiting-state').style.display = 'block';
            document.getElementById('match-results').style.display = 'none';
            notify("✅ Ehdotus lähetetty kumppanille!");
        }
    } catch (e) {
        console.error(e);
        notify("❌ Lähetys epäonnistui!");
    }
}

function calculateChanges(original, modified) {
    const added = [];
    const removed = [];
    
    Object.entries(modified).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            const origVals = original[key] || [];
            values.forEach(v => {
                if (!origVals.includes(v)) added.push(v);
            });
        } else if (values !== original[key] && values !== "ei valittu") {
            added.push(values);
        }
    });
    
    Object.entries(original).forEach(([key, values]) => {
        if (Array.isArray(values)) {
            const modVals = modified[key] || [];
            values.forEach(v => {
                if (!modVals.includes(v)) removed.push(v);
            });
        } else if (values !== modified[key] && values !== "ei valittu") {
            removed.push(values);
        }
    });
    
    return { added, removed };
}

// --- TULOSTEN RAKENTAMINEN (ENHANCED) ---
function renderResults() {
    showScreen('results');
    
    document.getElementById('waiting-state').style.display = 'none';
    const container = document.getElementById('match-results');
    container.style.display = 'block';
    
    saveMatchToHistory();
    
    const myDetails = state.myProposal?.details || {};
    const pDetails = state.partnerProposal?.details || {};
    
    const singleCategories = [
        { key: 'mood', label: 'Tunnelma' },
        { key: 'focus', label: 'Fokus' },
        { key: 'tempo', label: 'Tempo' },
        { key: 'intensity', label: 'Intensiteetti' },
        { key: 'control', label: 'Kontrolli' },
        { key: 'role', label: 'Rooli' },
        { key: 'timeDisplay', label: 'Ajankohta' }
    ];
    
    const arrayCategories = [
        { key: 'communication', label: 'Kommunikaatio' },
        { key: 'outfits', label: 'Asut' },
        { key: 'nylon', label: 'Nylon & Sukat' },
        { key: 'sensory', label: 'Aistit & Sidonta' },
        { key: 'bdsm', label: 'BDSM / Valta' },
        { key: 'toys', label: 'Lelut & Välineet' },
        { key: 'special', label: 'Erityisfokukset' },
        { key: 'safety', label: 'Turvallisuus & Huolenpito' }
    ];
    
    let matchesHTML = '';
    let divergencesHTML = '';
    
    // Yksittäiset valinnat
    singleCategories.forEach(cat => {
        const myVal = myDetails[cat.key];
        const pVal = pDetails[cat.key];
        
        if (myVal && pVal) {
            if (myVal === pVal) {
                matchesHTML += `
                    <div class="match-highlight">
                        <strong>${cat.label}:</strong> ${myVal} ✨
                    </div>
                `;
            } else {
                divergencesHTML += `
                    <div class="divergence-item">
                        <div class="divergence-label">${cat.label}:</div>
                        <div class="divergence-values">
                            <span class="my-choice">Sinä: ${myVal}</span>
                            <span class="partner-choice">Kumppani: ${pVal}</span>
                        </div>
                    </div>
                `;
            }
        }
    });
    
    // Checkbox-kategoriat
    arrayCategories.forEach(cat => {
        const myArr = myDetails[cat.key] || [];
        const pArr = pDetails[cat.key] || [];
        
        if (myArr.length > 0 || pArr.length > 0) {
            const common = myArr.filter(v => pArr.includes(v));
            
            if (common.length > 0) {
                matchesHTML += `
                    <div class="match-highlight">
                        <strong>${cat.label}:</strong> ${common.join(', ')} ✨
                    </div>
                `;
            }
            
            const myOnly = myArr.filter(v => !pArr.includes(v));
            const pOnly = pArr.filter(v => !myArr.includes(v));
            
            if (myOnly.length > 0 || pOnly.length > 0) {
                divergencesHTML += `
                    <div class="divergence-item">
                        <div class="divergence-label">${cat.label}:</div>
                        <div class="divergence-values">
                            ${myOnly.length > 0 ? `<span class="my-choice">Sinä: ${myOnly.join(', ')}</span>` : ''}
                            ${pOnly.length > 0 ? `<span class="partner-choice">Kumppani: ${pOnly.join(', ')}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }
    });
    
    container.innerHTML = `
        <div class="results-header">
            <h1 class="logo">💕 Vibe Match!</h1>
            <p class="results-subtitle">TEIDÄN YHTEINEN SOPIMUS</p>
        </div>
        
        ${matchesHTML ? `
            <div class="matches-section">
                <h3 class="section-heading">✨ Yhteiset valinnat</h3>
                ${matchesHTML}
            </div>
        ` : ''}
        
        ${divergencesHTML ? `
            <div class="divergences-section">
                <h3 class="section-heading">⚖️ Eri mieltä (molemmat hyväksyivät)</h3>
                <p class="divergence-explainer">Nämä kohdat erosivat, mutta olette molemmat OK tämän kanssa.</p>
                ${divergencesHTML}
            </div>
        ` : ''}
        
        <div class="actions-section">
            <button class="btn btn-primary" onclick="resetSession()">🔄 Uusi sessio</button>
        </div>
    `;
}

function resetSession() {
    stopListening();
    state.sessionId = null;
    state.userRole = null;
    state.currentRound = 1;
    state.myProposal = null;
    state.partnerProposal = null;
    state.originalProposal = null;
    
    clearAllSelections();
    
    window.location.href = window.location.pathname;
}

// --- HISTORIA (ENHANCED) ---
function saveMatchToHistory() {
    if (!state.myProposal || !state.partnerProposal) return;
    
    const myDetails = state.myProposal.details || state.myProposal;
    const pDetails = state.partnerProposal.details || state.partnerProposal;
    
    const historyEntry = {
        sessionId: state.sessionId,
        timestamp: new Date().toISOString(),  // LocalStorage: ISO string
        mySelections: myDetails,
        partnerSelections: pDetails,
        status: 'matched'
    };
    
    // LocalStorage (anonyymi + nopea)
    let history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    history.unshift(historyEntry);
    
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    localStorage.setItem('vibe_history', JSON.stringify(history));
    
    // Firestore (kirjautunut, Phase 3)
    if (state.user) {
        db.collection('users')
            .doc(state.user.uid)
            .collection('history')
            .add({
                sessionId: state.sessionId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),  // ← Server timestamp!
                mySelections: myDetails,
                partnerSelections: pDetails,
                status: 'matched'
            })
            .catch((err) => console.error('Firestore history save failed:', err));
    }
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
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
        const dateStr = date.toLocaleDateString('fi-FI', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = date.toLocaleTimeString('fi-FI', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const mood = session.mySelections?.mood || 'Ei valittu';
        
        return `
            <div class="history-card" onclick="viewHistoryDetails(${index})">
                <div class="history-header">
                    <span class="history-date">${dateStr} klo ${timeStr}</span>
                    <span class="history-badge">✓ Toteutunut</span>
                </div>
                <div class="history-summary">
                    <strong>${mood}</strong>
                </div>
                <div class="history-actions">
                    <span class="history-hint">👆 Klikkaa nähdäksesi yksityiskohdat</span>
                    <button class="btn btn-outline btn-tiny" onclick="event.stopPropagation(); deleteHistorySession(${index})">
                        🗑️ Poista
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function viewHistoryDetails(index) {
    const history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    const session = history[index];
    
    if (!session) return;
    
    const date = new Date(session.timestamp);
    const dateStr = date.toLocaleDateString('fi-FI', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('fi-FI', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Käytä samaa logiikkaa kuin renderResults
    const myDetails = session.mySelections;
    const pDetails = session.partnerSelections;
    
    const singleCategories = [
        { key: 'mood', label: 'Tunnelma' },
        { key: 'focus', label: 'Fokus' },
        { key: 'tempo', label: 'Tempo' },
        { key: 'intensity', label: 'Intensiteetti' },
        { key: 'control', label: 'Kontrolli' },
        { key: 'role', label: 'Rooli' },
        { key: 'timeDisplay', label: 'Ajankohta' }
    ];
    
    const arrayCategories = [
        { key: 'communication', label: 'Kommunikaatio' },
        { key: 'outfits', label: 'Asut' },
        { key: 'nylon', label: 'Nylon & Sukat' },
        { key: 'sensory', label: 'Aistit & Sidonta' },
        { key: 'bdsm', label: 'BDSM / Valta' },
        { key: 'toys', label: 'Lelut & Välineet' },
        { key: 'special', label: 'Erityisfokukset' },
        { key: 'safety', label: 'Turvallisuus & Huolenpito' }
    ];
    
    let matchesHTML = '';
    let divergencesHTML = '';
    
    singleCategories.forEach(cat => {
        const myVal = myDetails[cat.key];
        const pVal = pDetails[cat.key];
        
        if (myVal && pVal) {
            if (myVal === pVal) {
                matchesHTML += `
                    <div class="match-highlight">
                        <strong>${cat.label}:</strong> ${myVal} ✨
                    </div>
                `;
            } else {
                divergencesHTML += `
                    <div class="divergence-item">
                        <div class="divergence-label">${cat.label}:</div>
                        <div class="divergence-values">
                            <span class="my-choice">Sinä: ${myVal}</span>
                            <span class="partner-choice">Kumppani: ${pVal}</span>
                        </div>
                    </div>
                `;
            }
        }
    });
    
    arrayCategories.forEach(cat => {
        const myArr = myDetails[cat.key] || [];
        const pArr = pDetails[cat.key] || [];
        
        if (myArr.length > 0 || pArr.length > 0) {
            const common = myArr.filter(v => pArr.includes(v));
            
            if (common.length > 0) {
                matchesHTML += `
                    <div class="match-highlight">
                        <strong>${cat.label}:</strong> ${common.join(', ')} ✨
                    </div>
                `;
            }
            
            const myOnly = myArr.filter(v => !pArr.includes(v));
            const pOnly = pArr.filter(v => !myArr.includes(v));
            
            if (myOnly.length > 0 || pOnly.length > 0) {
                divergencesHTML += `
                    <div class="divergence-item">
                        <div class="divergence-label">${cat.label}:</div>
                        <div class="divergence-values">
                            ${myOnly.length > 0 ? `<span class="my-choice">Sinä: ${myOnly.join(', ')}</span>` : ''}
                            ${pOnly.length > 0 ? `<span class="partner-choice">Kumppani: ${pOnly.join(', ')}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }
    });
    
    // Näytä modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content history-detail-modal">
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            <h2 class="modal-title">📅 Sessio ${dateStr}</h2>
            <p class="modal-subtitle">Klo ${timeStr}</p>
            
            ${matchesHTML ? `
                <div class="matches-section">
                    <h3 class="section-heading">✨ Yhteiset valinnat</h3>
                    ${matchesHTML}
                </div>
            ` : ''}
            
            ${divergencesHTML ? `
                <div class="divergences-section">
                    <h3 class="section-heading">⚖️ Eri mieltä</h3>
                    ${divergencesHTML}
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function deleteHistorySession(index) {
    if (!confirm('Poista tämä sessio historiasta?')) return;
    if (navigator.vibrate) navigator.vibrate(20);
    
    let history = JSON.parse(localStorage.getItem('vibe_history') || '[]');
    history.splice(index, 1);
    localStorage.setItem('vibe_history', JSON.stringify(history));
    
    loadHistory();
    notify('🗑️ Sessio poistettu');
}

window.deleteHistorySession = deleteHistorySession;
window.viewHistoryDetails = viewHistoryDetails;
window.acceptNotifications = acceptNotifications;

// --- ALUSTUS ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session');
    
    if (sid) {
        joinSession(sid.toUpperCase());
    }

    document.getElementById('create-session-btn').onclick = createSession;
    document.getElementById('submit-selection-btn').onclick = submitSelection;

    document.getElementById('join-session-btn').onclick = () => {
        const id = prompt("Syötä Session ID:");
        if (id) joinSession(id.toUpperCase());
    };

    // Navigointi
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-nav');
            if (navigator.vibrate) navigator.vibrate(10);
            showScreen(target);
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll(`[data-nav="${target}"]`).forEach(b => b.classList.add('active'));
            
            if (target === 'history') loadHistory();
        });
    });

    // Session-toiminnot
    const copyLinkBtn = document.getElementById('copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.onclick = () => {
            if (!state.sessionId) {
                notify('❌ Luo sessio ensin!');
                if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                return;
            }
            
            const url = `${window.location.origin}${window.location.pathname}?session=${state.sessionId}`;
            const originalHTML = copyLinkBtn.innerHTML;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    
                    // Visuaalinen palaute
                    copyLinkBtn.innerHTML = '✅ Kopioitu!';
                    copyLinkBtn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
                    
                    setTimeout(() => {
                        copyLinkBtn.innerHTML = originalHTML;
                        copyLinkBtn.style.background = '';
                    }, 2000);
                    
                    notify('🔗 Linkki kopioitu!');
                }).catch(() => {
                    // Fallback if clipboard API fails
                    copyLinkBtn.innerHTML = '📋 ' + url;
                    setTimeout(() => {
                        copyLinkBtn.innerHTML = originalHTML;
                    }, 5000);
                });
            } else {
                // Fallback for older browsers
                copyLinkBtn.innerHTML = '📋 ' + url;
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalHTML;
                }, 5000);
            }
        };
    }

    const cancelSessionBtn = document.getElementById('cancel-session-btn');
    if (cancelSessionBtn) {
        cancelSessionBtn.onclick = () => {
            if (confirm('Haluatko varmasti peruuttaa session?')) {
                if (navigator.vibrate) navigator.vibrate(30);
                stopListening();
                state.sessionId = null;
                state.userRole = null;
                state.currentRound = 1;
                state.myProposal = null;
                state.partnerProposal = null;
                state.originalProposal = null;
                clearAllSelections();
                window.history.pushState({}, '', window.location.pathname);
                showScreen('welcome');
                notify('✕ Sessio peruutettu');
            }
        };
    }

    const backToEditBtn = document.getElementById('back-to-edit-btn');
    if (backToEditBtn) {
        backToEditBtn.onclick = () => {
            if (navigator.vibrate) navigator.vibrate(10);
            showScreen('selection');
        };
    }

    const cancelProposalBtn = document.getElementById('cancel-proposal-btn');
    if (cancelProposalBtn) {
        cancelProposalBtn.onclick = () => {
            if (confirm('Haluatko perua ehdotuksen ja palata etusivulle?')) {
                if (navigator.vibrate) navigator.vibrate(30);
                stopListening();
                state.sessionId = null;
                state.userRole = null;
                clearAllSelections();
                window.history.pushState({}, '', window.location.pathname);
                showScreen('welcome');
                notify('✕ Ehdotus peruutettu');
            }
        };
    }

    // Mobile Quick Actions
    const mobileAcceptBtn = document.getElementById('mobile-accept-btn');
    const mobileModifyBtn = document.getElementById('mobile-modify-btn');
    
    if (mobileAcceptBtn) {
        mobileAcceptBtn.onclick = async () => {
            if (navigator.vibrate) navigator.vibrate(50);
            // Sama logiikka kuin quickAccept
            quickAccept();
        };
    }
    
    if (mobileModifyBtn) {
        mobileModifyBtn.onclick = () => {
            if (navigator.vibrate) navigator.vibrate(10);
            document.getElementById('mobile-quick-actions').style.display = 'none';
            showScreen('selection');
            
            setTimeout(() => {
                const formStart = document.getElementById('negotiation-form');
                if (formStart) {
                    formStart.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }, 100);
        };
    }

    // Help modal
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const modalClose = document.getElementById('modal-close');
    
    if (helpBtn && helpModal) {
        helpBtn.onclick = () => {
            if (navigator.vibrate) navigator.vibrate(10);
            helpModal.classList.add('active');
        };
    }
    
    if (modalClose && helpModal) {
        modalClose.onclick = () => {
            helpModal.classList.remove('active');
        };
        
        helpModal.onclick = (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        };
    }

    // Korttien klikkaus
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.mood-card, .time-btn');
        if (card) {
            const parent = card.parentElement;
            parent.querySelectorAll('.mood-card, .time-btn').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            if (navigator.vibrate) navigator.vibrate(10);
            
            // Jos time-btn klikattu, deselektoi slider
            if (card.classList.contains('time-btn')) {
                const slider = document.getElementById('time-slider');
                if (slider) slider.classList.remove('selected');
            }
        }
    });
    
    // Time slider logic
    const timeSlider = document.getElementById('time-slider');
    const timeDisplay = document.getElementById('time-val');
    
    if (timeSlider && timeDisplay) {
        // Päivitä näyttö kun slideria liikutetaan
        timeSlider.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            
            timeDisplay.textContent = timeString;
            
            // Päivitä progress bar
            const progress = (minutes / 1440) * 100;
            e.target.style.setProperty('--slider-progress', `${progress}%`);
            
            // Värinä
            if (navigator.vibrate) navigator.vibrate(5);
        });
        
        // Kun slider valitaan, deselektoi kortit ja merkitse slider valituksi
        timeSlider.addEventListener('change', (e) => {
            // Deselektoi kaikki time-btn kortit
            document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('selected'));
            
            // Merkitse slider valituksi
            timeSlider.classList.add('selected');
            
            // Tallenna state
            const minutes = parseInt(e.target.value);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            
            // Tallennetaan custom-arvona
            if (state.myProposal && state.myProposal.details) {
                state.myProposal.details.time = 'custom';
                state.myProposal.details.timeDisplay = timeString;
            }
            
            if (navigator.vibrate) navigator.vibrate(20);
        });
        
        // Alusta progress bar
        const initialProgress = (parseInt(timeSlider.value) / 1440) * 100;
        timeSlider.style.setProperty('--slider-progress', `${initialProgress}%`);
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        document.body.setAttribute('data-theme', state.theme);
        themeBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
        
        themeBtn.onclick = () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', state.theme);
            themeBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
            localStorage.setItem('theme', state.theme);
            if (navigator.vibrate) navigator.vibrate(10);
        };
    }
    
    // Cleanup
    window.addEventListener('beforeunload', stopListening);
    
    // Register Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('✅ SW registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available
                                if (confirm('🆕 Uusi versio saatavilla! Päivitä nyt?')) {
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }
                            }
                        });
                    });
                })
                .catch((err) => {
                    console.log('❌ SW registration failed:', err);
                });
        });
    }
});
