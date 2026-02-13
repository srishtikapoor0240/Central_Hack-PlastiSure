// ==========================================
// PLASTISURE - MAIN JAVASCRIPT
// Real-time Recyclability Verification System
// ==========================================

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    BACKEND_URL: 'http://localhost:8000/predict_frame',
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

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
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

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadBlockchainHistory();
    loadStatistics();
    checkBackendConnection();
});

function initializeApp() {
    // Event Listeners
    elements.startBtn.addEventListener('click', startCamera);
    elements.stopBtn.addEventListener('click', stopScanning);
    elements.auditLogBtn.addEventListener('click', openAuditModal);
    elements.closeModal.addEventListener('click', closeAuditModal);
    elements.exportLogBtn.addEventListener('click', exportAuditLog);
    elements.clearLogBtn.addEventListener('click', clearAuditLog);
    
    // Close modal on outside click
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
        
        // Start scanning after camera is ready
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
    if (captureInterval) {
        clearInterval(captureInterval);
    }
    
    isScanning = true;
    updateStatus('🔍', 'Scanning...', 'scanning');
    
    // Capture first frame immediately
    captureFrame();
    
    // Then capture every interval
    captureInterval = setInterval(captureFrame, CONFIG.CAPTURE_INTERVAL);
}

function stopScanning() {
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    isScanning = false;
    elements.video.srcObject = null;
    elements.startBtn.style.display = 'inline-block';
    elements.stopBtn.style.display = 'none';
    elements.scanningOverlay.style.display = 'none';
    
    updateStatus('⏸️', 'Scanning stopped', 'idle');
}

// ==========================================
// FRAME CAPTURE & PROCESSING
// ==========================================
function captureFrame() {
    if (!isScanning) return;
    
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = CONFIG.FRAME_SIZE;
    canvas.height = CONFIG.FRAME_SIZE;
    
    // Draw video frame to canvas
    ctx.drawImage(elements.video, 0, 0, CONFIG.FRAME_SIZE, CONFIG.FRAME_SIZE);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Send to backend
    sendToBackend(imageData);
}

// ==========================================
// BACKEND COMMUNICATION
// ==========================================
async function sendToBackend(imageData) {
    try {
        updateConnectionStatus(true);
        
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and display result
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
        const response = await fetch(CONFIG.BACKEND_URL.replace('/predict_frame', '/health'), {
            method: 'GET'
        });
        updateConnectionStatus(response.ok);
    } catch (error) {
        updateConnectionStatus(false);
    }
    
    // Check every 10 seconds
    setTimeout(checkBackendConnection, 10000);
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
    // Extract data with defaults
    const plasticType = data.plastic_type || 'Unknown';
    const contamination = data.contamination || 'Unknown';
    const recyclabilityScore = data.recyclability_score || 0;
    
    // Update plastic type
    elements.plasticType.textContent = `${plasticType}`;
    elements.plasticType.nextElementSibling.textContent = getPlasticDescription(plasticType);
    
    // Update contamination
    elements.contamination.textContent = contamination;
    const contaminationLevel = getContaminationLevel(contamination);
    elements.contaminationProgress.style.width = `${contaminationLevel}%`;
    elements.contaminationProgress.style.backgroundColor = getContaminationColor(contaminationLevel);
    
    // Update recyclability score
    elements.score.textContent = `${recyclabilityScore}%`;
    elements.scoreProgress.style.width = `${recyclabilityScore}%`;
    elements.scoreProgress.style.backgroundColor = getScoreColor(recyclabilityScore);
    
    // Generate blockchain hash
    const timestamp = Date.now();
    const block = await createBlockchainBlock(data, timestamp);
    
    // Update hash display
    elements.hash.textContent = block.hash.slice(0, CONFIG.HASH_DISPLAY_LENGTH) + '...';
    elements.timestamp.textContent = formatTimestamp(timestamp);
    
    // Update status based on score
    updateStatusByScore(recyclabilityScore);
    
    // Show recommendation
    showRecommendation(recyclabilityScore, contamination);
    
    // Update statistics
    updateStatistics(recyclabilityScore);
    
    // Save to blockchain history
    blockchainHistory.unshift(block);
    if (blockchainHistory.length > 100) {
        blockchainHistory = blockchainHistory.slice(0, 100); // Keep last 100 blocks
    }
    saveBlockchainHistory();
}

// ==========================================
// BLOCKCHAIN FUNCTIONS
// ==========================================
async function createBlockchainBlock(data, timestamp) {
    const blockNumber = blockchainHistory.length + 1;
    
    // Create data string for hashing
    const dataString = 
        data.plastic_type +
        data.recyclability_score +
        timestamp +
        previousHash;
    
    // Generate hash
    const newHash = await generateHash(dataString);
    
    // Create block
    const block = {
        blockNumber: blockNumber,
        timestamp: timestamp,
        plasticType: data.plastic_type,
        contamination: data.contamination,
        recyclabilityScore: data.recyclability_score,
        hash: newHash,
        previousHash: previousHash,
        dataString: dataString
    };
    
    // Update previous hash for next block
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
// AUDIT LOG FUNCTIONS
// ==========================================
function openAuditModal() {
    elements.auditModal.style.display = 'flex';
    renderAuditLog();
}

function closeAuditModal() {
    elements.auditModal.style.display = 'none';
}

function renderAuditLog() {
    if (blockchainHistory.length === 0) {
        elements.auditLogContent.innerHTML = '<p class="no-data">No verification records yet. Start scanning to build the chain!</p>';
        return;
    }
    
    let logHTML = '';
    
    blockchainHistory.forEach((block, index) => {
        const scoreClass = block.recyclabilityScore >= 70 ? 'high' : block.recyclabilityScore >= 40 ? 'medium' : 'low';
        
        logHTML += `
            <div class="audit-block" data-block="${index}">
                <div class="block-header">
                    <span class="block-number">Block #${block.blockNumber}</span>
                    <span class="block-time">${formatTimestamp(block.timestamp)}</span>
                </div>
                <div class="block-body">
                    <div class="block-row">
                        <span class="block-label">Plastic Type:</span>
                        <span class="block-value">${block.plasticType}</span>
                    </div>
                    <div class="block-row">
                        <span class="block-label">Contamination:</span>
                        <span class="block-value">${block.contamination}</span>
                    </div>
                    <div class="block-row">
                        <span class="block-label">Score:</span>
                        <span class="block-value score-${scoreClass}">${block.recyclabilityScore}%</span>
                    </div>
                    <div class="block-row">
                        <span class="block-label">Hash:</span>
                        <span class="block-value hash-value">${block.hash}</span>
                    </div>
                    <div class="block-row">
                        <span class="block-label">Previous Hash:</span>
                        <span class="block-value hash-value">${block.previousHash}</span>
                    </div>
                </div>
                <div class="block-chain-link">⛓️</div>
            </div>
        `;
    });
    
    elements.auditLogContent.innerHTML = logHTML;
}

function exportAuditLog() {
    if (blockchainHistory.length === 0) {
        alert('No data to export');
        return;
    }
    
    const dataStr = JSON.stringify(blockchainHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plastisure-audit-log-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('Audit log exported successfully!');
}

function clearAuditLog() {
    if (confirm('Are you sure you want to clear the blockchain history? This action cannot be undone.')) {
        blockchainHistory = [];
        previousHash = "0000";
        saveBlockchainHistory();
        renderAuditLog();
        alert('Blockchain history cleared');
    }
}

// ==========================================
// STATISTICS FUNCTIONS
// ==========================================
function updateStatistics(score) {
    statistics.totalScans++;
    if (score >= 50) {
        statistics.recyclableItems++;
    }
    statistics.totalScore += score;
    
    const avgScore = Math.round(statistics.totalScore / statistics.totalScans);
    
    elements.totalScans.textContent = statistics.totalScans;
    elements.recyclableItems.textContent = statistics.recyclableItems;
    elements.avgScore.textContent = avgScore + '%';
    
    saveStatistics();
}

// ==========================================
// LOCAL STORAGE FUNCTIONS
// ==========================================
function saveBlockchainHistory() {
    try {
        localStorage.setItem('plastisure_blockchain', JSON.stringify(blockchainHistory));
        localStorage.setItem('plastisure_previousHash', previousHash);
    } catch (error) {
        console.error('Failed to save blockchain history:', error);
    }
}

function loadBlockchainHistory() {
    try {
        const saved = localStorage.getItem('plastisure_blockchain');
        if (saved) {
            blockchainHistory = JSON.parse(saved);
        }
        
        const savedHash = localStorage.getItem('plastisure_previousHash');
        if (savedHash) {
            previousHash = savedHash;
        }
    } catch (error) {
        console.error('Failed to load blockchain history:', error);
    }
}

function saveStatistics() {
    try {
        localStorage.setItem('plastisure_statistics', JSON.stringify(statistics));
    } catch (error) {
        console.error('Failed to save statistics:', error);
    }
}

function loadStatistics() {
    try {
        const saved = localStorage.getItem('plastisure_statistics');
        if (saved) {
            statistics = JSON.parse(saved);
            elements.totalScans.textContent = statistics.totalScans;
            elements.recyclableItems.textContent = statistics.recyclableItems;
            const avgScore = statistics.totalScans > 0 
                ? Math.round(statistics.totalScore / statistics.totalScans) 
                : 0;
            elements.avgScore.textContent = avgScore + '%';
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function updateStatus(icon, text, type) {
    elements.statusIcon.textContent = icon;
    elements.statusText.textContent = text;
    
    elements.statusBadge.className = 'status-badge status-' + type;
}

function updateStatusByScore(score) {
    if (score >= 70) {
        updateStatus('✅', 'Highly Recyclable', 'success');
    } else if (score >= 40) {
        updateStatus('⚠️', 'Moderately Recyclable', 'warning');
    } else {
        updateStatus('❌', 'Low Recyclability', 'error');
    }
}

function showRecommendation(score, contamination) {
    elements.recommendation.classList.remove('hidden');
    
    if (score >= 70) {
        elements.recommendationText.textContent = '✓ This item can be recycled. Please place in appropriate recycling bin.';
        elements.recommendation.className = 'recommendation success';
    } else if (score >= 40) {
        if (contamination && contamination.toLowerCase().includes('high')) {
            elements.recommendationText.textContent = '⚠ Clean the item before recycling to improve recovery rate.';
        } else {
            elements.recommendationText.textContent = '⚠ Check local recycling guidelines for this plastic type.';
        }
        elements.recommendation.className = 'recommendation warning';
    } else {
        elements.recommendationText.textContent = '✗ This item has low recyclability. Consider reuse or proper disposal.';
        elements.recommendation.className = 'recommendation error';
    }
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
    if (level.includes('medium') || level.includes('moderate')) return 50;
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

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ==========================================
// EXPORT FOR BACKEND TEAM
// ==========================================
// Expected backend response format:
const EXPECTED_BACKEND_FORMAT = {
    plastic_type: "PET",        // Required: string
    contamination: "Low",        // Required: string (Low/Medium/High)
    recyclability_score: 92      // Required: number (0-100)
};

console.log('PlastiSure Frontend Ready');
console.log('Expected backend response format:', EXPECTED_BACKEND_FORMAT);
console.log('Backend endpoint:', CONFIG.BACKEND_URL);
