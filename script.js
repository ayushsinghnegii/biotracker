// ==========================================
// AUTH STATE (localStorage-based)
// ==========================================
function getUsers() {
    try { return JSON.parse(localStorage.getItem('bt_users') || '{}'); }
    catch (e) { return {}; }
}
function saveUsers(u) { localStorage.setItem('bt_users', JSON.stringify(u)); }
function getSession() {
    try { return JSON.parse(localStorage.getItem('bt_session') || 'null'); }
    catch (e) { return null; }
}
function saveSession(s) { localStorage.setItem('bt_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('bt_session'); }

let currentUser = getSession();
let sessionWatcherTimer = null;

function startSessionWatcher() {
    if (sessionWatcherTimer) clearInterval(sessionWatcherTimer);
    if (!currentUser || !currentUser.email || currentUser.role === 'admin') return;
    sessionWatcherTimer = setInterval(async () => {
        try {
            const data = await apiGet('/api/user-status?email=' + encodeURIComponent(currentUser.email));
            if (!data.exists) {
                alert('Your account was removed by admin. You are being logged out.');
                doLogout();
            }
        } catch (e) {
            // Ignore temporary network errors so users are not logged out during short connection drops.
        }
    }, 3500);
}

// ==========================================
// BACKEND API HELPERS
// ==========================================
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : window.location.origin;
async function apiPost(path, body) {
    const res = await fetch(API_BASE_URL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Backend request failed.');
    return data;
}
async function apiGet(path) {
    const res = await fetch(API_BASE_URL + path);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Backend request failed.');
    return data;
}

// ==========================================
// NAVBAR RENDER
// ==========================================
function renderNav() {
    const nb = document.getElementById('navButtons');
    if (currentUser) {
        currentUser.role = currentUser.role || 'user';
        const firstName = currentUser.fullname.split(' ')[0];
        nb.innerHTML = `
            <button class="btn-nav-share" onclick="openShareModal(event)">Share</button>
            <div class="user-menu" onclick="toggleDropdown()">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullname)}&background=115e59&color=fff&rounded=true" class="user-avatar">
                <span class="user-name">${firstName}</span>
                <svg width="14" height="14" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>
                <div class="dropdown-content" id="profileDropdown">
                    <div class="dropdown-header">
                        <strong>${currentUser.fullname}</strong>
                        <span>${currentUser.email}</span>
                    </div>
                    <a onclick="openDashboard()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Go to Dashboard
                    </a>
                    <a onclick="openEditProfile()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Account Settings
                    </a>
                    ${currentUser.role === 'admin' ? `<a onclick="openAdminDashboard()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"></path><path d="M9 12l2 2 4-4"></path></svg>
                        Admin Panel
                    </a>` : ''}
                    <hr class="divider-hr">
                    <a class="logout-link" onclick="doLogout()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Sign Out
                    </a>
                </div>
            </div>`;
    } else {
        nb.innerHTML = `<button class="btn-nav-share" onclick="openShareModal(event)">Share</button><button class="btn-nav-login" onclick="openLogin()">Login</button><button class="btn-nav-signup" onclick="openSignup()">Sign Up</button>`;
    }
    updateAdminVisibility();
}

function updateAdminVisibility() {
    const isAdmin = !!(currentUser && currentUser.role === 'admin');
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
}

function openAdminDashboard() {
    if (!currentUser) { openLogin(); return; }
    if (currentUser.role !== 'admin') { alert('Admin access required.'); return; }
    window.location.href = API_BASE_URL + '/admin.html';
}

function fillAdminLogin() {
    document.getElementById('loginEmail').value = 'admin@biotracker.com';
    document.getElementById('loginPassword').value = 'admin123';
}

function renderHeroBtns() {
    const hb = document.getElementById('heroBtn');
    const ab = document.getElementById('aboutBtn');
    if (currentUser) {
        if (currentUser.role === 'admin') {
            hb.innerHTML = `<button class="pro-btn" style="padding: 16px 40px; font-size: 18px;" onclick="openAdminDashboard()">Open Admin Panel ➔</button>`;
            ab.innerHTML = `<button class="pro-btn outline" onclick="openAdminDashboard()">Open Admin Panel ➔</button>`;
        } else {
            hb.innerHTML = `<button class="pro-btn" style="padding: 16px 40px; font-size: 18px;" onclick="openDashboard()">Go to Dashboard ➔</button>`;
            ab.innerHTML = `<button class="pro-btn outline" onclick="openDashboard()">Go to Dashboard ➔</button>`;
        }
    } else {
        hb.innerHTML = `<button class="pro-btn" style="padding: 16px 40px; font-size: 18px;" onclick="openSignup()">Create Free Account</button>`;
        ab.innerHTML = `<button class="pro-btn outline" onclick="openLogin()">Go to Dashboard ➔</button>`;
    }
    if (document.getElementById('scanWelcome') && currentUser) {
        document.getElementById('scanWelcome').textContent =
            `Welcome ${currentUser.fullname.split(' ')[0]}! Turn on your camera to scan animals and plants instantly.`;
    }
}

function goHome() {
    stopCamera();
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboardPage').style.display = 'none';
    renderHeroBtns();
    loadHistory();
}

function openDashboard() {
    if (!currentUser) { openLogin(); return; }
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    closeLogin();
    const dd = document.getElementById('profileDropdown');
    if (dd) dd.classList.remove('show');
    renderHeroBtns();
    updateAdminVisibility();
    if (currentUser && currentUser.role === 'admin') loadAdminDashboard();
}

// ==========================================
// AUTH FUNCTIONS
// ==========================================
async function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    if (!email || !password) { showMsg(msg, 'error', 'Please fill all fields.'); return; }
    try {
        const data = await apiPost('/api/login', { email, password });
        currentUser = data.user;
        currentUser.role = currentUser.role || 'user';
        saveSession(currentUser);
        startSessionWatcher();
        renderNav();
        renderHeroBtns();
        closeLogin();
        if (currentUser.role === 'admin') {
            window.location.href = API_BASE_URL + '/admin.html';
            return;
        }
        openDashboard();
        loadHistory();
    } catch (err) {
        showMsg(msg, 'error', err.message || 'Login failed. Start backend and try again.');
    }
}

async function doSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const msg = document.getElementById('signupMsg');
    if (!name || !email || !password) { showMsg(msg, 'error', 'Please fill all fields.'); return; }
    if (password.length < 6) { showMsg(msg, 'error', 'Password must be at least 6 characters.'); return; }
    try {
        await apiPost('/api/register', { fullname: name, email, password });
        showMsg(document.getElementById('loginMsg'), 'success', 'Account created successfully! You can now login.');
        switchForm('loginBox');
    } catch (err) {
        showMsg(msg, 'error', err.message || 'Signup failed.');
    }
}

function doForgot() {
    showMsg(document.getElementById('loginMsg'), 'success', 'If registered, a reset link was sent to your email.');
    switchForm('loginBox');
}

function doLogout() {
    if (sessionWatcherTimer) { clearInterval(sessionWatcherTimer); sessionWatcherTimer = null; }
    currentUser = null;
    clearSession();
    renderNav();
    updateAdminVisibility();
    goHome();
}

async function saveProfile() {
    const name = document.getElementById('settingsName').value.trim();
    const org = document.getElementById('settingsOrg').value.trim();
    const password = document.getElementById('settingsPassword').value;
    if (!currentUser) return;
    try {
        const data = await apiPost('/api/profile', {
            email: currentUser.email,
            fullname: name,
            organization: org,
            password
        });
        currentUser = data.user;
        currentUser.role = currentUser.role || 'user';
        saveSession(currentUser);
        startSessionWatcher();
        renderNav();
        renderHeroBtns();
        closeLogin();
        if (currentUser.role === 'admin') {
            window.location.href = API_BASE_URL + '/admin.html';
            return;
        }
        openDashboard();
        loadHistory();
    } catch (err) {
        alert(err.message || 'Profile update failed.');
    }
}

function showMsg(el, type, text) {
    el.className = 'inline-msg ' + type;
    el.textContent = text;
    el.style.display = 'block';
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================
function switchForm(formId) {
    $('.form-box').hide();
    $('#' + formId).fadeIn(300);
}

function openLogin() {
    document.getElementById('loginPanel').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('loginMsg').style.display = 'none';
    switchForm('loginBox');
}

function openSignup() {
    document.getElementById('loginPanel').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('signupMsg').style.display = 'none';
    switchForm('signupBox');
}

function openEditProfile() {
    document.getElementById('loginPanel').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('settingsName').value = currentUser ? currentUser.fullname : '';
    document.getElementById('settingsEmail').value = currentUser ? currentUser.email : '';
    document.getElementById('settingsOrg').value = currentUser ? (currentUser.organization || '') : '';
    document.getElementById('settingsPassword').value = '';
    switchForm('editProfileBox');
    const dd = document.getElementById('profileDropdown');
    if (dd) dd.classList.remove('show');
}

function openContact() {
    document.getElementById('loginPanel').classList.add('active');
    document.body.style.overflow = 'hidden';
    switchForm('contactBox');
}

function closeLogin() {
    document.getElementById('loginPanel').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function showToast() {
    document.getElementById('toastMsg').classList.add('show');
    setTimeout(() => document.getElementById('toastMsg').classList.remove('show'), 4000);
}

function toggleDropdown() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

window.onclick = function (event) {
    if (!event.target.closest('.user-menu')) {
        const d = document.getElementById('profileDropdown');
        if (d) d.classList.remove('show');
    }
};

function togglePassword(inputId, openIconId, closedIconId) {
    const p = document.getElementById(inputId);
    const isOpen = p.type === 'text';
    p.type = isOpen ? 'password' : 'text';
    document.getElementById(openIconId).style.display = isOpen ? 'block' : 'none';
    document.getElementById(closedIconId).style.display = isOpen ? 'none' : 'block';
}

function openTab(tabName, event) {
    $('.tab-content').removeClass('active');
    $('.tab-btn').removeClass('active');
    $('#tab-' + tabName).addClass('active');
    document.getElementById('tab-btn-' + tabName).classList.add('active');
    stopCamera();
    if (tabName === 'history') loadHistory();
    if (tabName === 'admin') loadAdminDashboard();
}

// ==========================================
// CAMERA
// ==========================================
let videoStream = null;
let capturedBase64 = null;

async function startCamera() {
    const video = document.getElementById('webcam');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not supported in this browser. Open the app with the ngrok HTTPS link on mobile.');
        return;
    }

    // Mobile par default BACK camera open karne ke liye environment facingMode use kiya hai.
    // Agar kisi device par back camera unavailable ho, to fallback normal camera open karega.
    const backCameraConstraints = {
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        },
        audio: false
    };

    try {
        stopCamera();
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(backCameraConstraints);
        } catch (backErr) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        videoStream = stream;
        video.srcObject = stream;
        await video.play().catch(() => {});
        document.getElementById('video-container').style.display = 'flex';
        document.getElementById('startCamBtn').style.display = 'none';
        document.getElementById('stopCamBtn').style.display = 'inline-block';
        document.getElementById('captureBtn').style.display = 'inline-block';
        document.getElementById('scan-overlay').style.display = 'none';
        document.getElementById('captureBtn').innerText = 'Click & Scan';
        document.getElementById('captureBtn').style.opacity = '1';
    } catch (err) {
        alert('Camera access denied or blocked. Use the ngrok HTTPS link and allow camera permission.');
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        const vc = document.getElementById('video-container');
        if (vc) vc.style.display = 'none';
        const scb = document.getElementById('startCamBtn');
        if (scb) scb.style.display = 'inline-block';
        const stcb = document.getElementById('stopCamBtn');
        if (stcb) stcb.style.display = 'none';
        const cb = document.getElementById('captureBtn');
        if (cb) cb.style.display = 'none';
        const so = document.getElementById('scan-overlay');
        if (so) so.style.display = 'none';
    }
}

function captureImage() {
    const video = document.getElementById('webcam');
    if (!video.videoWidth) { alert('Camera not ready!'); return; }
    video.pause();
    document.getElementById('scan-overlay').style.display = 'block';
    document.getElementById('captureBtn').innerText = 'Scanning...';
    document.getElementById('captureBtn').style.opacity = '0.7';
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    capturedBase64 = canvas.toDataURL('image/jpeg');
    analyzeImageFromBase64('scan', capturedBase64);
}

// ==========================================
// IMAGE UPLOAD ANALYSIS (PlantNet backend + Browser AI)
// ==========================================
// PlantNet runs through the local Flask backend. Do not expose private API keys in browser JS.
const BACKEND_BASE_URL = API_BASE_URL;
const PLANTNET_ENDPOINT = BACKEND_BASE_URL + '/api/identify-plant';
function showBackendRunWarningIfNeeded() {
    if (window.location.protocol !== 'file:') return;
    if (document.getElementById('backendRunWarning')) return;
    const banner = document.createElement('div');
    banner.id = 'backendRunWarning';
    banner.innerHTML = '<strong>PlantNet backend required:</strong> Extract ZIP → double-click <b>START_BIOTRACKER.bat</b>. It will install requirements, start backend, and open the correct page automatically. Do not double-click index.html for PlantNet.';
    banner.style.cssText = 'position:fixed;left:14px;right:14px;bottom:14px;z-index:99999;background:#fff7ed;color:#7c2d12;border:1px solid #fed7aa;border-radius:14px;padding:12px 16px;font-size:14px;box-shadow:0 20px 50px rgba(0,0,0,.18);line-height:1.45;text-align:center;';
    document.body.appendChild(banner);
}

async function analyzeImage(tabName) {
    const fileInput = document.getElementById('file_' + tabName);
    if (!fileInput || !fileInput.files[0]) {
        const errEl = document.getElementById(tabName + 'Error');
        if (errEl) { errEl.textContent = 'Please upload an image first!'; errEl.style.display = 'block'; }
        return;
    }

    const file = fileInput.files[0];
    if (!file.type || !file.type.startsWith('image/')) {
        const errEl = document.getElementById(tabName + 'Error');
        if (errEl) { errEl.textContent = 'Please choose a valid image file.'; errEl.style.display = 'block'; }
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        analyzeImageFromBase64(tabName, e.target.result, file);
    };
    reader.onerror = function () {
        const errEl = document.getElementById(tabName + 'Error');
        if (errEl) { errEl.textContent = 'Could not read this image. Please try another file.'; errEl.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
}

async function analyzeImageFromBase64(tabName, dataUrl, file) {
    const loader = document.getElementById('loader-' + tabName);
    const resultDiv = document.getElementById('result-' + tabName);
    const errEl = document.getElementById(tabName + 'Error');

    if (errEl) errEl.style.display = 'none';
    if (resultDiv) resultDiv.innerHTML = '';
    if (loader) {
        loader.style.display = 'flex';
        const loaderText = loader.querySelector('.loader-text');
        const loaderMsg = loader.querySelector('.ai-loader-msg');
        if (loaderText) loaderText.textContent = tabName === 'animal' ? 'AI is identifying animal...' : 'PlantNet AI is identifying plant...';
        if (loaderMsg) loaderMsg.textContent = 'Please wait, image is being analyzed...';
    }

    try {
        let finalResult = null;

        let plantFailureMessage = '';

        if (tabName === 'scan' || tabName === 'animal') {
            const human = await detectHumanInImage(dataUrl);
            if (human) {
                finalResult = {
                    speciesName: 'Human',
                    scientificName: 'Homo sapiens',
                    category: 'Animal / Fauna',
                    confidenceText: `Human detection: ${Math.round(human.score * 100)}%`,
                    detected: human
                };
            }
        }

        if (!finalResult && (tabName === 'plant' || tabName === 'scan')) {
            try {
                finalResult = await identifyPlantWithPlantNet(file, dataUrl);
            } catch (plantErr) {
                plantFailureMessage = plantErr && plantErr.message ? plantErr.message : '';
                console.warn('PlantNet failed:', plantErr);
            }
        }

        if (!finalResult && (tabName === 'animal' || tabName === 'scan')) {
            const animal = await classifyUploadedImage(dataUrl);
            if (animal && animal.name && animal.score >= 0.16) {
                finalResult = {
                    speciesName: animal.name,
                    scientificName: animal.scientificName || animal.name,
                    category: 'Animal / Fauna',
                    confidenceText: `AI confidence: ${Math.round(animal.score * 100)}%`,
                    detected: animal
                };
            }
        }

        if (!finalResult) {
            const msg = tabName === 'plant'
                ? (plantFailureMessage || 'PlantNet could not identify this plant. Try a clearer flower/leaf image with good lighting.')
                : 'AI could not identify this image clearly. Try a clearer image.';
            throw new Error(msg);
        }

        let bullets = await fetchWikiBullets(finalResult.scientificName || finalResult.speciesName, `${finalResult.speciesName} ${finalResult.category}`);
        if (!bullets || !bullets.length) bullets = getFallbackBullets(tabName, finalResult.speciesName, finalResult.detected);

        if (loader) loader.style.display = 'none';
        showImageResult(
            tabName,
            dataUrl,
            finalResult.speciesName,
            finalResult.scientificName || finalResult.speciesName,
            finalResult.category,
            bullets,
            file,
            finalResult.confidenceText,
            finalResult.detected
        );
    } catch (err) {
        if (loader) loader.style.display = 'none';
        showError(tabName, err.message || 'Analysis failed. Please try another clear image.');
    }
}

function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

async function identifyPlantWithPlantNet(file, dataUrl) {
    const formData = new FormData();
    if (file) {
        formData.append('image', file, file.name || 'plant-upload.jpg');
    } else {
        const blob = dataUrlToBlob(dataUrl);
        formData.append('image', blob, 'camera-upload.jpg');
    }

    let response;
    try {
        response = await fetch(PLANTNET_ENDPOINT, {
            method: 'POST',
            body: formData
        });
    } catch (networkErr) {
        throw new Error('PlantNet backend is not running. Close this page, extract the ZIP fully, then double-click START_BIOTRACKER.bat. Keep the black terminal window open.');
    }

    let data = null;
    let rawText = '';
    try {
        rawText = await response.text();
        data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        const serverMsg = data && data.error
            ? data.error
            : (rawText ? rawText.slice(0, 300) : 'PlantNet backend request failed with HTTP ' + response.status + '.');
        throw new Error(serverMsg);
    }

    if (!data || !data.results || !data.results.length) {
        throw new Error('PlantNet could not identify this plant. Try a clearer flower/leaf image with good lighting.');
    }

    const best = data.results[0];
    const score = Number(best.score || 0);
    if (score < 0.01) {
        throw new Error('PlantNet result was too weak. Try a close, bright photo of one flower or one leaf.');
    }

    const species = best.species || {};
    const scientificName = species.scientificNameWithoutAuthor || species.scientificName || best.scientificName || 'Unknown plant';
    const commonNames = Array.isArray(species.commonNames) ? species.commonNames.filter(Boolean) : [];
    const displayName = commonNames[0] || scientificName;

    return {
        speciesName: toTitleCase(displayName),
        scientificName: scientificName,
        category: 'Plant / Flora',
        confidenceText: `PlantNet confidence: ${Math.round(score * 100)}%`,
        detected: {
            raw: scientificName,
            name: displayName,
            score: score,
            plantnet: data.results.slice(0, 5)
        }
    };
}

let mobileNetModelPromise = null;
function getMobileNetModel() {
    if (!mobileNetModelPromise) {
        if (typeof mobilenet === 'undefined') {
            return Promise.reject(new Error('MobileNet script not loaded. Check internet connection.'));
        }
        mobileNetModelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
    }
    return mobileNetModelPromise;
}

function loadImageForModel(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not load image for AI model.'));
        img.src = dataUrl;
    });
}

async function detectHumanInImage(dataUrl) {
    // Fast human/selfie detection: FaceDetector works on many mobile Chromium browsers over HTTPS.
    // Fallback uses MobileNet labels commonly returned for human/selfie images.
    try {
        if ('FaceDetector' in window) {
            const img = await loadImageForModel(dataUrl);
            const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
            const faces = await detector.detect(img);
            if (faces && faces.length) {
                return {
                    raw: 'face detected',
                    name: 'Human',
                    scientificName: 'Homo sapiens',
                    score: 0.95,
                    predictions: []
                };
            }
        }
    } catch (e) {}

    try {
        const model = await getMobileNetModel();
        const img = await loadImageForModel(dataUrl);
        const predictions = await model.classify(img, 5);
        const humanWords = ['person','human','man','woman','boy','girl','face','suit','jersey','sweatshirt','t-shirt','academic gown','bow tie','neck brace','military uniform','lab coat','mask','wig','maillot','groom','bride'];
        const hit = (predictions || []).find(p => humanWords.some(w => String(p.className || '').toLowerCase().includes(w)));
        if (hit && hit.probability >= 0.12) {
            return {
                raw: hit.className,
                name: 'Human',
                scientificName: 'Homo sapiens',
                score: Math.max(hit.probability, 0.72),
                predictions
            };
        }
    } catch (e) {}
    return null;
}

async function classifyUploadedImage(dataUrl) {
    const model = await getMobileNetModel();
    const img = await loadImageForModel(dataUrl);
    const predictions = await model.classify(img, 5);
    if (!predictions || !predictions.length) return null;

    const blockedPlantLike = ['fungus', 'mushroom', 'agaric', 'coral fungus', 'stinkhorn', 'hen-of-the-woods'];
    const bestUsable = predictions.find(p => !blockedPlantLike.some(w => p.className.toLowerCase().includes(w))) || predictions[0];

    return {
        raw: bestUsable.className,
        name: normalizeModelLabel(bestUsable.className),
        score: bestUsable.probability,
        predictions
    };
}

function normalizeModelLabel(label) {
    if (!label) return 'Uploaded Image';
    const clean = label
        .split(',')[0]
        .replace(/_/g, ' ')
        .replace(/\b(Panthera|Felis|Canis|Equus|Bos|Sus|Ursus|Aves)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    const lower = clean.toLowerCase();
    const map = {
        'tiger': 'Tiger',
        'tiger cat': 'Cat',
        'lion': 'Lion',
        'cheetah': 'Cheetah',
        'leopard': 'Leopard',
        'jaguar': 'Jaguar',
        'zebra': 'Zebra',
        'elephant': 'Elephant',
        'indian elephant': 'Indian Elephant',
        'african elephant': 'African Elephant',
        'giant panda': 'Giant Panda',
        'red panda': 'Red Panda',
        'tabby': 'Cat',
        'egyptian cat': 'Cat',
        'persian cat': 'Cat',
        'golden retriever': 'Dog',
        'labrador retriever': 'Dog',
        'german shepherd': 'Dog'
    };
    return map[lower] || toTitleCase(clean);
}

function getTypedSpeciesGuess(tabName) {
    const searchInputId = tabName === 'animal' ? 'animalSearch' : tabName === 'plant' ? 'plantSearch' : '';
    const typedValue = searchInputId && document.getElementById(searchInputId)
        ? document.getElementById(searchInputId).value.trim()
        : '';
    return typedValue ? toTitleCase(typedValue) : '';
}

function getFileNameGuess(file) {
    return '';
}

function getCategoryFromResult(tabName, speciesName, detected) {
    if (tabName === 'plant') return 'Plant / Flora';
    if (tabName === 'animal') return 'Animal / Fauna';

    const plantWords = ['flower', 'tree', 'plant', 'leaf', 'daisy', 'orchid', 'rose', 'sunflower', 'corn', 'acorn', 'mushroom'];
    const lower = (speciesName || '').toLowerCase();
    return plantWords.some(w => lower.includes(w)) ? 'Plant / Flora' : 'Animal / Fauna';
}

function getUploadSpeciesGuess(tabName, file) {
    return getTypedSpeciesGuess(tabName) || 'Uploaded Image';
}

function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function getFallbackBullets(tabName, guessedName, detected) {
    const target = guessedName && guessedName !== 'Uploaded Image' ? guessedName : 'this uploaded image';
    const topLine = detected && detected.raw
        ? `AI detected: ${target} (${Math.round(detected.score * 100)}% confidence).`
        : `Image analyzed successfully for ${target}.`;

    if (tabName === 'plant') {
        return [
            topLine,
            'Plant identification is powered by PlantNet API for better flower, leaf, fruit, and tree recognition.',
            'For best results, upload a clear close-up of flower, leaf, fruit, or bark with good lighting.'
        ];
    }

    if (detected && detected.scientificName === 'Homo sapiens') {
        return [
            'Human detected successfully. Scientific name: Homo sapiens.',
            'This app treats humans as Animal / Fauna because humans belong to the animal kingdom.',
            'For privacy, avoid sharing personal face photos publicly.'
        ];
    }

    if (tabName === 'animal') {
        return [
            topLine,
            'Animal identification is powered by browser AI and then matched with Wikipedia details.',
            'For best results, upload a clear full-body or face photo with minimum blur.'
        ];
    }

    return [
        topLine,
        'Scan mode checks PlantNet first for plants and then browser AI for animals.',
        'If the result is not exact, use a clearer image or search the species name manually.'
    ];
}

async function fetchWikiBullets(name, fallbackDesc) {
    try {
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&origin=*`);
        const searchData = await searchRes.json();

        if (searchData.query && searchData.query.search.length > 0) {
            const title = searchData.query.search[0].title;
            const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            const wikiData = await wikiRes.json();

            if (wikiData.extract) {
                return wikiData.extract
                    .split('. ')
                    .filter(s => s.trim().length > 10)
                    .slice(0, 5)
                    .map(s => s.endsWith('.') ? s : s + '.');
            }
        }
    } catch (e) {}

    if (Array.isArray(fallbackDesc)) return fallbackDesc;
    if (fallbackDesc) {
        return fallbackDesc
            .split('. ')
            .filter(s => s.trim().length > 10)
            .slice(0, 5)
            .map(s => s.endsWith('.') ? s : s + '.');
    }

    return ['Image uploaded successfully.'];
}


function createReportPayload(sourceType, data) {
    const category = data.category || (sourceType === 'plant' ? 'Plant / Flora' : 'Animal / Fauna');
    const isPlant = /plant|flora|leaf|flower|tree/i.test(category) || sourceType === 'plant';
    const title = data.speciesName || data.title || 'Nature Report';
    const scientificName = data.sciName || data.scientificName || title;
    const bulletList = Array.isArray(data.bullets) ? data.bullets.filter(Boolean) : [];
    const dateText = new Date().toLocaleString();
    const intro = isPlant
        ? `${title} is presented here as a plant observation report. This identification highlights botanical appearance, probable classification, and practical recognition notes for the uploaded specimen.`
        : `${title} is presented here as an animal observation report. This identification highlights visible traits, probable classification, and quick recognition notes for the uploaded subject.`;
    return {
        title,
        scientificName,
        category,
        confidence: data.confidenceText || 'AI result ready',
        image: data.image || '',
        bullets: bulletList,
        sourceType: sourceType || (isPlant ? 'plant' : 'animal'),
        dateText,
        intro,
        userName: currentUser ? currentUser.fullname : 'Guest User',
        theme: isPlant ? 'plant' : 'animal'
    };
}

function openStyledReport(sourceType, data) {
    const payload = createReportPayload(sourceType, data || {});
    localStorage.setItem('bt_report_payload', JSON.stringify(payload));
    const targetUrl = (API_BASE_URL || '') + '/report.html';
    window.open(targetUrl, '_blank');
}

function showImageResult(tabName, dataUrl, speciesName, sciName, category, bullets, file, confidenceText, detected) {
    const resultDiv = document.getElementById('result-' + tabName);
    const bulletsHtml = bullets.map(b => `<li>${b}</li>`).join('');
    const fileMeta = file ? `<span class="sci-name-badge upload-badge">${Math.round(file.size / 1024)} KB • ${file.type || 'image'}</span>` : '';
    const sciHtml = sciName && sciName !== speciesName ? `<span class="sci-name-badge scientific-badge">Scientific: ${sciName}</span>` : '';
    let topMatches = '';

    if (detected && detected.plantnet && detected.plantnet.length) {
        topMatches = `<div class="plantnet-matches"><strong>Top PlantNet matches:</strong>${detected.plantnet.map((m, i) => {
            const sp = m.species || {};
            const nm = (sp.commonNames && sp.commonNames[0]) || sp.scientificNameWithoutAuthor || sp.scientificName || 'Unknown';
            return `<span>${i + 1}. ${nm} — ${Math.round((m.score || 0) * 100)}%</span>`;
        }).join('')}</div>`;
    }

    const reportSourceType = /plant|flora/i.test(category || '') ? 'plant' : 'animal';
    const reportPayload = {
        speciesName,
        sciName,
        category,
        bullets,
        confidenceText,
        image: dataUrl
    };

    resultDiv.innerHTML = `
        <div class="unified-result upload-result-card">
            <div class="result-header">
                <img src="${dataUrl}" class="upload-preview-img" alt="Uploaded preview">
                <div class="result-title-box">
                    <h3>${speciesName}</h3>
                    <span class="sci-name-badge">Category: ${category}</span>
                    ${sciHtml}
                    ${fileMeta}
                    <span class="confidence-pill">${confidenceText || 'AI result ready'} ✓</span>
                </div>
            </div>
            <ul>${bulletsHtml}</ul>
            ${topMatches}
            <div class="result-action-row">
                <button class="pro-btn report-btn">Download PDF Report</button>
            </div>
        </div>`;
    const btn = resultDiv.querySelector('.report-btn');
    if (btn) btn.onclick = () => openStyledReport(reportSourceType, reportPayload);

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveScanToDatabase(tabName, speciesName, sciName, category, confidenceText, file, dataUrl);

    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
        document.getElementById('video-container').style.display = 'none';
        document.getElementById('startCamBtn').style.display = 'inline-block';
        document.getElementById('stopCamBtn').style.display = 'none';
        document.getElementById('captureBtn').style.display = 'none';
        document.getElementById('scan-overlay').style.display = 'none';
        const video = document.getElementById('webcam');
        if (video) video.pause();
    }
}

function showError(tabName, msg) {
    const errEl = document.getElementById(tabName + 'Error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
}

// ==========================================
// WIKIPEDIA TEXT SEARCH
// ==========================================
function fetchWikiData(inputId, resultId, tabName) {
    let query = document.getElementById(inputId).value;
    if (!query) return;
    let resultDiv = document.getElementById(resultId);
    let loader = document.getElementById('loader-' + tabName + '-text');
    resultDiv.style.display = 'none';
    loader.style.display = 'flex';

    let searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;

    fetch(searchUrl)
        .then(res => res.json())
        .then(searchData => {
            if (searchData.query && searchData.query.search.length > 0) {
                let exactTitle = searchData.query.search[0].title;
                return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(exactTitle)}`);
            } else { throw new Error('Not found'); }
        })
        .then(res => res.json())
        .then(data => {
            loader.style.display = 'none';
            if (data.type === 'standard' && data.extract) {
                let desc = (data.description || '').toLowerCase();
                let summary = data.extract.toLowerCase();
                let combinedText = desc + ' ' + summary;
                let isValid = false;

                if (tabName === 'plant') {
                    const plantKeywords = ['plant', 'tree', 'flower', 'shrub', 'herb', 'fern', 'moss', 'botanical', 'vegetation', 'succulent', 'grass', 'flora', 'crop', 'algae', 'vine', 'cactus', 'lotus', 'lily', 'aquatic'];
                    isValid = plantKeywords.some(kw => new RegExp('\\b' + kw + '\\b', 'i').test(combinedText));
                } else if (tabName === 'animal') {
                    const animalKeywords = ['animal', 'mammal', 'bird', 'insect', 'fish', 'reptile', 'amphibian', 'creature', 'vertebrate', 'invertebrate', 'dinosaur', 'spider', 'dog', 'cat', 'canine', 'feline', 'predator', 'carnivore', 'herbivore', 'wildlife', 'fauna', 'breed', 'wolf', 'bear', 'lion', 'tiger', 'shark', 'whale', 'dolphin', 'snake', 'lizard', 'frog', 'monkey', 'ape', 'pet', 'pup', 'puppy', 'kitten', 'beetle', 'butterfly', 'moth', 'ant', 'bee', 'wasp'];
                    isValid = animalKeywords.some(kw => new RegExp('\\b' + kw + '\\b', 'i').test(combinedText));
                } else { isValid = true; }

                const blockedKeywords = ['vehicle', 'automobile', 'company', 'brand', 'instrument', 'tool', 'device', 'software', 'music', 'album', 'band', 'fictional', 'movie', 'film', 'character', 'book', 'novel'];
                let isBlocked = blockedKeywords.some(kw => new RegExp('\\b' + kw + '\\b', 'i').test(desc));

                if (!isValid || isBlocked) {
                    resultDiv.innerHTML = `<div class="unified-result"><p style="color:#d32f2f;font-weight:500;">This doesn't seem to be a valid ${tabName}. Please enter a correct species name.</p></div>`;
                    resultDiv.style.display = 'block';
                    return;
                }

                let userSearchName = query.charAt(0).toUpperCase() + query.slice(1);
                let scientificName = data.title;
                let imgHtml = data.thumbnail ? `<img src="${data.thumbnail.source}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;">` : '';
                let sentences = data.extract.split('. ');
                let bullets = '';
                for (let s of sentences) {
                    if (s.length > 10) {
                        if (!s.endsWith('.')) s += '.';
                        bullets += `<li>${s}</li>`;
                    }
                }

                const bulletArray = sentences
                    .filter(s => s.length > 10)
                    .map(s => s.endsWith('.') ? s : s + '.');
                const reportSourceType = tabName === 'plant' ? 'plant' : 'animal';
                const reportPayload = {
                    speciesName: userSearchName,
                    sciName: scientificName,
                    category: tabName === 'plant' ? 'Plant / Flora' : 'Animal / Fauna',
                    bullets: bulletArray,
                    confidenceText: 'Search knowledge result',
                    image: data.thumbnail ? data.thumbnail.source : ''
                };
                resultDiv.innerHTML = `
                    <div class="unified-result" style="margin-top:0; border:1px solid #e2e8f0; box-shadow:none;">
                        <div class="result-header">
                            ${imgHtml}
                            <div class="result-title-box">
                                <h3>${userSearchName}</h3>
                                <span class="sci-name-badge">Scientific Name: ${scientificName}</span>
                            </div>
                        </div>
                        <ul>${bullets}</ul>
                        <div class="result-action-row">
                            <button class="pro-btn report-btn">Download PDF Report</button>
                        </div>
                    </div>`;
                const btn = resultDiv.querySelector('.report-btn');
                if (btn) btn.onclick = () => openStyledReport(reportSourceType, reportPayload);
                resultDiv.style.display = 'block';
            } else {
                resultDiv.innerHTML = `<div class="unified-result"><p style="color:#d32f2f;font-weight:500;">Species not found. Please check spelling or try scientific name.</p></div>`;
                resultDiv.style.display = 'block';
            }
        }).catch(err => {
            loader.style.display = 'none';
            resultDiv.innerHTML = `<div class="unified-result"><p style="color:#d32f2f;font-weight:500;">Database connection error or species not found.</p></div>`;
            resultDiv.style.display = 'block';
        });
}

// ==========================================
// INIT
// ==========================================
renderNav();
renderHeroBtns();
showBackendRunWarningIfNeeded();
startSessionWatcher();

// ==========================================
// SHOPIFY THEME 3D TILT EFFECT
// ==========================================
function initShopifyTilt() {
    const stage = document.querySelector('.hero-video-stage');
    const card = document.querySelector('.video-card-3d');
    if (!stage || !card) return;

    stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateY(${x * 18 - 10}deg) rotateX(${-y * 14 + 5}deg) translateZ(0) scale(1.015)`;
    });

    stage.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateY(-13deg) rotateX(7deg) translateZ(0)';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShopifyTilt);
} else {
    initShopifyTilt();
}


// ==========================================
// EXTRA PREMIUM 3D / SCROLL ANIMATIONS
// ==========================================
(function initPremiumEffects() {
    const boot = () => {
        const tiltCards = document.querySelectorAll('.tilt-card, .tilt-3d');
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 10;
                const rotateX = ((0.5 - y / rect.height)) * 10;
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
        const revealSections = document.querySelectorAll('.reveal-section');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
            }, { threshold: 0.15 });
            revealSections.forEach(section => observer.observe(section));
        } else { revealSections.forEach(section => section.classList.add('is-visible')); }
        const counters = document.querySelectorAll('[data-count]');
        const animateCounter = (el) => {
            const target = Number(el.getAttribute('data-count')) || 0;
            let current = 0;
            const step = Math.max(1, Math.ceil(target / 50));
            const timer = setInterval(() => {
                current += step;
                if (current >= target) { current = target; clearInterval(timer); }
                el.textContent = target === 100 ? current + '%' : current + '+';
            }, 28);
        };
        if ('IntersectionObserver' in window) {
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.done) {
                        entry.target.dataset.done = 'true'; animateCounter(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            counters.forEach(c => counterObserver.observe(c));
        } else { counters.forEach(animateCounter); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();



// Mobile camera/upload helper: phone browser can choose Camera or Gallery.
(function enableMobileImageInputs(){
    const set = () => {
        ['file_scan','file_animal','file_plant'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('accept', 'image/*');
                // Do not force capture; mobile will show Camera/Gallery choice.
            }
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', set);
    else set();
})();

// ==========================================
// DATABASE: HISTORY, STATS, CONTACT
// ==========================================
async function saveScanToDatabase(tabName, speciesName, sciName, category, confidenceText, file, dataUrl) {
    try {
        await apiPost('/api/save-scan', {
            user_email: currentUser ? currentUser.email : 'guest',
            scan_type: tabName,
            species_name: speciesName || 'Uploaded Image',
            scientific_name: sciName || '',
            category: category || '',
            confidence: confidenceText || '',
            file_name: file ? file.name : 'camera-capture.jpg',
            image_data: dataUrl || '',
            capture_source: file ? 'upload' : 'camera'
        });
        loadHistory();
    } catch (err) {
        console.warn('History save failed:', err.message);
    }
}

async function loadHistory() {
    if (!document.getElementById('historyList')) return;
    const email = currentUser ? currentUser.email : 'guest';
    try {
        const stats = await apiGet('/api/stats?email=' + encodeURIComponent(email));
        document.getElementById('statTotal').textContent = stats.total_scans || 0;
        document.getElementById('statPlants').textContent = stats.plant_scans || 0;
        document.getElementById('statAnimals').textContent = stats.animal_scans || 0;

        const data = await apiGet('/api/history?email=' + encodeURIComponent(email));
        const list = document.getElementById('historyList');
        if (!data.items || !data.items.length) {
            list.innerHTML = '<div class="empty-history">No scan history yet. Upload a plant or animal image to save your first record.</div>';
            return;
        }
        list.innerHTML = data.items.map(item => {
            const sourceType = /plant|flora/i.test(item.category || '') ? 'plant' : 'animal';
            const payload = encodeURIComponent(JSON.stringify({
                speciesName: item.species_name,
                sciName: item.scientific_name,
                category: item.category || (sourceType === 'plant' ? 'Plant / Flora' : 'Animal / Fauna'),
                bullets: [
                    `${item.species_name} was saved in the BioTracker history on ${formatDateTime(item.created_at)}.`,
                    item.confidence ? `Confidence / note: ${item.confidence}.` : `${item.scan_type} recognition record stored successfully.`,
                    item.capture_source ? `Capture source: ${item.capture_source}.` : 'Captured by BioTracker AI.',
                    item.file_name ? `Original file name: ${item.file_name}.` : 'Image came from scanner capture.'
                ],
                confidenceText: item.confidence || item.scan_type,
                image: item.image_path || ''
            }));
            return `
            <div class="history-item with-thumb">
                ${item.image_path ? `<img class="history-thumb" src="${item.image_path}" alt="Scan photo">` : `<div class="history-thumb empty">AI</div>`}
                <div class="history-main">
                    <strong>${item.species_name}</strong>
                    <p>${item.category || 'Species'} ${item.scientific_name ? '• ' + item.scientific_name : ''}</p>
                    <small>${formatDateTime(item.created_at)} ${item.file_name ? '• ' + item.file_name : ''} ${item.capture_source ? '• ' + item.capture_source : ''}</small>
                </div>
                <div class="history-actions">
                    <span>${item.confidence || item.scan_type}</span>
                    <button class="history-report-btn" data-source-type="${sourceType}" data-payload="${payload}">PDF Report</button>
                </div>
            </div>`;
        }).join('');
        list.querySelectorAll('.history-report-btn').forEach(btn => {
            btn.onclick = () => {
                try {
                    const payload = JSON.parse(decodeURIComponent(btn.dataset.payload || ''));
                    openStyledReport(btn.dataset.sourceType || 'animal', payload);
                } catch (e) {
                    console.warn('Could not open history report', e);
                }
            };
        });
    } catch (err) {
        const list = document.getElementById('historyList');
        if (list) list.innerHTML = '<div class="empty-history error-text">Database not connected. Start project with START_BIOTRACKER.bat.</div>';
    }
}

async function checkDatabaseStatus() {
    const box = document.getElementById('dbStatus');
    if (!box) return;
    box.textContent = 'Checking database...';
    try {
        const data = await apiGet('/api/db-info');
        box.innerHTML = `<strong>SQLite Connected ✓</strong><br>Database file: ${data.database}`;
    } catch (err) {
        box.innerHTML = `<strong>Database not reachable</strong><br>${err.message}`;
    }
}

async function sendContactMessage() {
    const name = document.getElementById('contactName') ? document.getElementById('contactName').value.trim() : '';
    const email = document.getElementById('contactEmail') ? document.getElementById('contactEmail').value.trim() : '';
    const message = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value.trim() : '';
    try {
        await apiPost('/api/contact', { name, email, message });
        closeLogin();
        showToast();
        if (document.getElementById('contactName')) document.getElementById('contactName').value = '';
        if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = '';
        if (document.getElementById('contactMessage')) document.getElementById('contactMessage').value = '';
    } catch (err) {
        alert(err.message || 'Message could not be saved.');
    }
}

function formatDateTime(value) {
    if (!value) return '';
    try { return new Date(value).toLocaleString(); }
    catch (e) { return value; }
}


// ==========================================
// ADMIN DASHBOARD
// ==========================================
async function loadAdminDashboard() {
    if (!document.getElementById('adminUsersTable')) return;
    if (!currentUser || currentUser.role !== 'admin') return;
    const errBox = document.getElementById('adminError');
    if (errBox) errBox.style.display = 'none';
    try {
        const data = await apiGet('/api/admin/overview?email=' + encodeURIComponent(currentUser.email));
        const stats = data.stats || {};
        document.getElementById('adminTotalUsers').textContent = stats.total_users || 0;
        document.getElementById('adminTotalScans').textContent = stats.total_scans || 0;
        document.getElementById('adminPlantScans').textContent = stats.plant_scans || 0;
        document.getElementById('adminAnimalScans').textContent = stats.animal_scans || 0;
        document.getElementById('adminMessages').textContent = stats.total_messages || 0;
        renderAdminUsers(data.users || []);
        renderAdminScans(data.scans || []);
        renderAdminMessages(data.messages || []);
        renderTopSpecies(data.top_species || []);
    } catch (err) {
        if (errBox) showMsg(errBox, 'error', err.message || 'Admin data could not be loaded.');
    }
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function renderAdminUsers(users) {
    const table = document.getElementById('adminUsersTable');
    if (!users.length) { table.innerHTML = '<tr><td>No users found.</td></tr>'; return; }
    table.innerHTML = `
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Action</th></tr></thead>
        <tbody>${users.map(u => `
            <tr>
                <td>${escapeHtml(u.fullname)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="role-badge ${u.role === 'admin' ? 'role-admin' : ''}">${escapeHtml(u.role || 'user')}</span></td>
                <td>${escapeHtml(formatDateTime(u.created_at))}</td>
                <td>${u.role === 'admin' ? '-' : `<button class="mini-danger-btn" onclick="deleteUserFromAdmin('${escapeHtml(u.email)}')">Delete</button>`}</td>
            </tr>`).join('')}</tbody>`;
}

function renderAdminScans(scans) {
    const table = document.getElementById('adminScansTable');
    if (!scans.length) { table.innerHTML = '<tr><td>No scans found.</td></tr>'; return; }
    table.innerHTML = `
        <thead><tr><th>User</th><th>Species</th><th>Category</th><th>Confidence</th><th>Date</th></tr></thead>
        <tbody>${scans.map(s => `
            <tr>
                <td>${escapeHtml(s.user_email)}</td>
                <td><strong>${escapeHtml(s.species_name)}</strong><br><small>${escapeHtml(s.scientific_name)}</small></td>
                <td>${escapeHtml(s.category || s.scan_type)}</td>
                <td>${escapeHtml(s.confidence || '-')}</td>
                <td>${escapeHtml(formatDateTime(s.created_at))}</td>
            </tr>`).join('')}</tbody>`;
}

function renderAdminMessages(messages) {
    const table = document.getElementById('adminMessagesTable');
    if (!messages.length) { table.innerHTML = '<tr><td>No contact messages found.</td></tr>'; return; }
    table.innerHTML = `
        <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr></thead>
        <tbody>${messages.map(m => `
            <tr>
                <td>${escapeHtml(m.name)}</td>
                <td>${escapeHtml(m.email)}</td>
                <td>${escapeHtml(m.message)}</td>
                <td>${escapeHtml(formatDateTime(m.created_at))}</td>
            </tr>`).join('')}</tbody>`;
}

function renderTopSpecies(items) {
    const box = document.getElementById('adminTopSpecies');
    if (!items.length) { box.innerHTML = '<div class="empty-history">No species records yet.</div>'; return; }
    box.innerHTML = items.map(i => `
        <div class="top-species-item">
            <div><strong>${escapeHtml(i.species_name)}</strong><p>${escapeHtml(i.category || 'Species')}</p></div>
            <span>${escapeHtml(i.count)} scans</span>
        </div>`).join('');
}

async function deleteUserFromAdmin(email) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!confirm('Delete user ' + email + '?')) return;
    try {
        await apiPost('/api/admin/delete-user', { admin_email: currentUser.email, target_email: email });
        loadAdminDashboard();
    } catch (err) {
        alert(err.message || 'Could not delete user.');
    }
}

window.addEventListener('DOMContentLoaded', updateAdminVisibility);


// ==========================================
// SHARE / QR CODE SYSTEM
// ==========================================
async function getShareInfo() {
    try {
        const res = await fetch('/api/share-link');
        return await res.json();
    } catch (err) {
        return { ok: false, mode: 'offline', url: window.location.origin, message: 'Backend share API not reachable.' };
    }
}

async function openShareModal(event) {
    if (event) event.stopPropagation();
    let modal = document.getElementById('shareModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal-card">
                <button class="share-close" onclick="closeShareModal()">×</button>
                <div class="share-badge">Public App Sharing</div>
                <h2>Share BioTracker AI</h2>
                <p class="share-sub">Scan this QR or send the link on WhatsApp so others can open the web app.</p>
                <div id="shareStatus" class="share-status">Loading share link...</div>
                <div class="qr-frame"><img id="shareQr" alt="BioTracker Share QR"></div>
                <input id="shareLinkInput" class="share-link-input" readonly value="Loading...">
                <div class="share-actions">
                    <button class="pro-btn" onclick="copyShareLink()">Copy Link</button>
                    <a id="whatsappShareBtn" class="pro-btn whatsapp-btn" target="_blank" rel="noopener">WhatsApp</a>
                </div>
                <p class="share-note">For public sharing, keep START_BIOTRACKER.bat and ngrok running. Admin panel is at /admin.html.</p>
            </div>`;
        document.body.appendChild(modal);
    }
    modal.classList.add('active');
    const info = await getShareInfo();
    const link = info.url || window.location.origin;
    const status = document.getElementById('shareStatus');
    const input = document.getElementById('shareLinkInput');
    const qr = document.getElementById('shareQr');
    const wa = document.getElementById('whatsappShareBtn');
    input.value = link;
    qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(link);
    wa.href = 'https://wa.me/?text=' + encodeURIComponent('BioTracker AI app open karo: ' + link);
    if (info.mode === 'public') {
        status.className = 'share-status public';
        status.textContent = 'Public link ready ✓ Anyone can open this link.';
    } else {
        status.className = 'share-status local';
        status.textContent = 'Local mode: ngrok public link not detected. Put ngrok.exe in project folder or install ngrok, then restart launcher.';
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('active');
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard && navigator.clipboard.writeText(input.value);
    showToast && showToast();
}
