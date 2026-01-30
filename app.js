/* app.js */
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

// --- SAFE HELPERS (patch) ---
function safeJSONParse(value, fallback) {
    try {
        if (value == null) return fallback;
        return JSON.parse(value);
    } catch (e) {
        return fallback;
    }
}

function getEl(id) {
    return document.getElementById(id);
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
    // ... (UNCHANGED ORIGINAL CONTENT BELOW)
}