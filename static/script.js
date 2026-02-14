// ==========================================
// PLASTISURE - MAIN JAVASCRIPT
// Real-time Recyclability Verification System
// ==========================================

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    BACKEND_URL: '/analyze',
    CAPTURE_INTERVAL: 2000, // 2 seconds
    FRAME_SIZE: 224,
    HASH_DISPLAY_LENGTH: 16
};

// ==========================================
// GLOBAL STATE
// ==========================================
let videoStream = null;
let captureInterval = null;
let previousHash = "0000"; // Genesis block
let blockchainHistory = [];
let isScanning = false;
let statistics = {
    totalScans: 0,
    recyclableItems: 0,
    totalScore: 0
};
let elements = {};

// ==========================================
// DOM ELEMENTS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    elements = {
        video: document.getElementById('video'),
        canvas: document.getElementById('canvas'),
        startBtn: document.getElementById('startBtn'),
        stopBtn: document.getElementById('stopBtn'),
        resultCard: document.getElementById('resultCard'),
        plasticType: document.getElementById('plasticType'),
        contamination: document.getElementById('contamination'),
        contaminationProgress: document.getElementById('contaminationProgress'),
        score: document.getElementById('score'),
        scoreProgress: document.getElementById('scoreProgress'),
        hash: document.getElementById('hash'),
        timestamp: document.getElementById('timestamp'),
        statusBadge: document.getElementById('statusBadge'),
        statusIcon: document.getElementById('statusIcon'),
        statusText: document.getElementById('statusText'),
        recommendation: document.getElementById('recommendation'),
        recommendationText: document.getElementById('recommendationText'),
        scanningOverlay: document.getElementById('scanningOverlay'),
        auditLogBtn: document.getElementById('auditLogBtn'),
        auditModal: document.getElementById('auditModal'),
        closeModal: document.getElementById('closeModal'),
        auditLogContent: document.getElementById('auditLogContent'),
        exportLogBtn: document.getElementById('exportLogBtn'),
        clearLogBtn: document.getElementById('clearLogBtn'),
        connectionStatus: document.getElementById('connectionStatus'),
        connectionText: document.getElementById('connectionText'),
        totalScans: document.getElementById('totalScans'),
        recyclableItems: document.getElementById('recyclableItems'),
        avgScore: document.getElementById('avgScore')
    };

    initializeApp();
    loadBlockchainHistory();
    loadStatistics();
    checkBackendConnection();
});




function initializeApp() {
    elements.startBtn.addEventListener('click', startCamera);
    elements.stopBtn.addEventListener('click', stopScanning);
    elements.auditLogBtn.addEventListener('click', openAuditModal);
    elements.closeModal.addEventListener('click', closeAuditModal);
    elements.exportLogBtn.addEventListener('click', exportAuditLog);
    elements.clearLogBtn.addEventListener('click', clearAuditLog);
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.auditModal) {
            closeAuditModal();
        }
    });

    console.log('PlastiSure initialized successfully');
}

// ==========================================
// CAMERA FUNCTIONS
// ==========================================
async function startCamera() {
    try {
        updateStatus('🎥', 'Requesting camera access...', 'warning');
        
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        elements.video.srcObject = videoStream;
        elements.startBtn.style.display = 'none';
        elements.stopBtn.style.display = 'inline-block';
        elements.resultCard.classList.remove('hidden');
        elements.scanningOverlay.style.display = 'block';
        
        updateStatus('✅', 'Camera active - Ready to scan', 'success');
        
        elements.video.addEventListener('loadedmetadata', () => {
            startScanning();
        });
        
    } catch (err) {
        console.error("Camera access denied:", err);
        updateStatus('❌', 'Camera access denied', 'error');
        alert('Please allow camera access to use PlastiSure');
    }
}

function startScanning() {
    if (captureInterval) clearInterval(captureInterval);
    isScanning = true;
    updateStatus('🔍', 'Scanning...', 'scanning');
    captureFrame();
    captureInterval = setInterval(captureFrame, CONFIG.CAPTURE_INTERVAL);
}

function stopScanning() {
    if (captureInterval) clearInterval(captureInterval);
    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    isScanning = false;
    elements.video.srcObject = null;
    elements.startBtn.style.display = 'inline-block';
    elements.stopBtn.style.display = 'none';
    elements.scanningOverlay.style.display = 'none';
    updateStatus('⏸️', 'Scanning stopped', 'idle');
}

// ==========================================
// FRAME CAPTURE
// ==========================================
function captureFrame() {
    if (!isScanning) return;
    
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = CONFIG.FRAME_SIZE;
    canvas.height = CONFIG.FRAME_SIZE;
    
    ctx.drawImage(elements.video, 0, 0, CONFIG.FRAME_SIZE, CONFIG.FRAME_SIZE);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    sendToBackend(imageData);
}

// ==========================================
// BACKEND COMMUNICATION
// ==========================================
async function sendToBackend(imageData) {
    try {
        
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        await updateUI(data);
        updateConnectionStatus(true);

    } catch (error) {
        console.error('Backend communication error:', error);
        updateConnectionStatus(false);
        updateStatus('⚠️', 'Backend connection failed', 'error');
    }
}

async function checkBackendConnection() {
    try {
        const response = await fetch("/health", { cache: "no-store" });
        updateConnectionStatus(response.ok);
    } catch {
        updateConnectionStatus(false);
    }

    setTimeout(checkBackendConnection, 5000); // check every 5 seconds
}


function updateConnectionStatus(isConnected) {
    if (isConnected) {
        elements.connectionStatus.classList.remove('offline');
        elements.connectionStatus.classList.add('online');
        elements.connectionText.textContent = 'Backend Connected';
    } else {
        elements.connectionStatus.classList.remove('online');
        elements.connectionStatus.classList.add('offline');
        elements.connectionText.textContent = 'Backend Disconnected';
    }
}

// ==========================================
// UI UPDATE FUNCTION
// ==========================================
async function updateUI(data) {
    const plasticType = data.plastic_type || 'Unknown';
    const contamination = data.contamination || 'Unknown';
    const recyclabilityScore = data.recyclability_score || 0;
    
    elements.plasticType.textContent = plasticType;
    elements.plasticType.nextElementSibling.textContent = getPlasticDescription(plasticType);
    
    elements.contamination.textContent = contamination;
    const contaminationLevel = getContaminationLevel(contamination);
    elements.contaminationProgress.style.width = `${contaminationLevel}%`;
    elements.contaminationProgress.style.backgroundColor = getContaminationColor(contaminationLevel);
    
    // ONLY CHANGE: removed %
    elements.score.textContent = recyclabilityScore;
    elements.scoreProgress.style.width = `${recyclabilityScore}%`;
    elements.scoreProgress.style.backgroundColor = getScoreColor(recyclabilityScore);
    
    const timestamp = Date.now();
    const block = await createBlockchainBlock(data, timestamp);
    
    elements.hash.textContent = block.hash.slice(0, CONFIG.HASH_DISPLAY_LENGTH) + '...';
    elements.timestamp.textContent = formatTimestamp(timestamp);
    
    updateStatusByScore(recyclabilityScore);
    showRecommendation(recyclabilityScore, contamination);
    updateStatistics(recyclabilityScore);
    
    blockchainHistory.unshift(block);
    if (blockchainHistory.length > 100)
        blockchainHistory = blockchainHistory.slice(0, 100);

    saveBlockchainHistory();
}

// ==========================================
// BLOCKCHAIN
// ==========================================
async function createBlockchainBlock(data, timestamp) {
    const dataString =
        data.plastic_type +
        data.recyclability_score +
        timestamp +
        previousHash;

    const newHash = await generateHash(dataString);

    const block = {
        blockNumber: blockchainHistory.length + 1,
        timestamp,
        plasticType: data.plastic_type,
        contamination: data.contamination,
        recyclabilityScore: data.recyclability_score,
        hash: newHash,
        previousHash
    };

    previousHash = newHash;
    return block;
}

async function generateHash(dataString) {
    const msgUint8 = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// AUDIT LOG
// ==========================================
function renderAuditLog() {
    if (blockchainHistory.length === 0) {
        elements.auditLogContent.innerHTML = '<p>No verification records yet.</p>';
        return;
    }

    let logHTML = '';

    blockchainHistory.forEach((block) => {
        const scoreClass =
            block.recyclabilityScore >= 70 ? 'high'
            : block.recyclabilityScore >= 40 ? 'medium'
            : 'low';

        logHTML += `
            <div class="audit-block">
                <div>Plastic: ${block.plasticType}</div>
                <div>Contamination: ${block.contamination}</div>
                <div>Score: ${block.recyclabilityScore}</div>
                <div>Hash: ${block.hash}</div>
            </div>
        `;
    });

    elements.auditLogContent.innerHTML = logHTML;
}

// ==========================================
// STATISTICS
// ==========================================
function updateStatistics(score) {
    statistics.totalScans++;
    if (score >= 50) statistics.recyclableItems++;
    statistics.totalScore += score;

    const avgScore = Math.round(statistics.totalScore / statistics.totalScans);

    elements.totalScans.textContent = statistics.totalScans;
    elements.recyclableItems.textContent = statistics.recyclableItems;
    elements.avgScore.textContent = avgScore; // removed %

    saveStatistics();
}

function loadStatistics() {
    const saved = localStorage.getItem('plastisure_statistics');
    if (!saved) return;

    statistics = JSON.parse(saved);

    elements.totalScans.textContent = statistics.totalScans;
    elements.recyclableItems.textContent = statistics.recyclableItems;

    const avgScore =
        statistics.totalScans > 0
            ? Math.round(statistics.totalScore / statistics.totalScans)
            : 0;

    elements.avgScore.textContent = avgScore; // removed %
}

// ==========================================
// HELPERS
// ==========================================
function updateStatus(icon, text, type) {
    elements.statusIcon.textContent = icon;
    elements.statusText.textContent = text;
    elements.statusBadge.className = 'status-badge status-' + type;
}

function updateStatusByScore(score) {
    if (score >= 70)
        updateStatus('✅', 'Highly Recyclable', 'success');
    else if (score >= 40)
        updateStatus('⚠️', 'Moderately Recyclable', 'warning');
    else
        updateStatus('❌', 'Low Recyclability', 'error');
}

function showRecommendation(score) {
    if (score >= 70)
        elements.recommendationText.textContent = '✓ Recyclable item.';
    else if (score >= 40)
        elements.recommendationText.textContent = '⚠ Check contamination.';
    else
        elements.recommendationText.textContent = '✗ Low recyclability.';
}

function getPlasticDescription(type) {
    const descriptions = {
        'PET': 'Polyethylene Terephthalate - Bottles & Containers',
        'HDPE': 'High-Density Polyethylene - Milk Jugs & Detergent',
        'PVC': 'Polyvinyl Chloride - Pipes & Credit Cards',
        'LDPE': 'Low-Density Polyethylene - Plastic Bags',
        'PP': 'Polypropylene - Food Containers & Straws',
        'PS': 'Polystyrene - Foam Cups & Packing Materials',
        'OTHER': 'Mixed or Other Plastics'
    };
    return descriptions[type] || 'Plastic material detected';
}

function getContaminationLevel(contamination) {
    const level = contamination.toLowerCase();
    if (level.includes('high')) return 80;
    if (level.includes('medium')) return 50;
    if (level.includes('low')) return 20;
    return 0;
}

function getContaminationColor(level) {
    if (level >= 60) return '#ef4444';
    if (level >= 30) return '#f59e0b';
    return '#10b981';
}

function getScoreColor(score) {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}
function openAuditModal() {
    elements.auditModal.style.display = "flex";
}

function closeAuditModal() {
    elements.auditModal.style.display = "none";
}

function exportAuditLog() {
    console.log("Exporting...");
}

function clearAuditLog() {
    blockchainHistory = [];
    renderAuditLog();
}

function loadBlockchainHistory() {
    const saved = localStorage.getItem("plastisure_chain");
    if (saved) blockchainHistory = JSON.parse(saved);
}

function saveBlockchainHistory() {
    localStorage.setItem("plastisure_chain", JSON.stringify(blockchainHistory));
}

function saveStatistics() {
    localStorage.setItem("plastisure_statistics", JSON.stringify(statistics));
}

function formatTimestamp(ts) {
    return new Date(ts).toLocaleString();
}

