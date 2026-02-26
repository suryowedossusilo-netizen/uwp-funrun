// Global variable untuk menyimpan status early bird
let earlyBirdStatus = {
    isActive: false,
    discountPercent: 20,
    remainingQuota: 0,
    remainingDays: 0
};

let raceData = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initCountdown();
    initRegistrationForm();
    loadRaceInfo();
    loadEarlyBirdStatus();
    loadResults();
});

// Load Early Bird Status
async function loadEarlyBirdStatus() {
    try {
        const response = await fetch(`${API_URL}/participants/earlybird-status`);
        const data = await response.json();
        
        if (data.success) {
            earlyBirdStatus = data.data;
            updateEarlyBirdUI();
        }
    } catch (error) {
        console.error('Error loading early bird status:', error);
    }
}

// Update Early Bird UI
function updateEarlyBirdUI() {
    const { isActive, remainingQuota, remainingDays, discountPercent } = earlyBirdStatus;
    
    // Update banner
    const banner = document.getElementById('earlyBirdBanner');
    const badges = document.querySelectorAll('.early-badge');
    const earlyInfos = document.querySelectorAll('.early-info');
    const optionEarlys = document.querySelectorAll('.option-early');
    
    if (!isActive || remainingQuota <= 0) {
        // Early bird ended
        banner.style.display = 'none';
        badges.forEach(badge => {
            badge.classList.add('ended');
            badge.innerHTML = '<i class="fas fa-clock"></i> HARGA REGULER';
        });
        earlyInfos.forEach(info => info.style.display = 'none');
        optionEarlys.forEach(opt => {
            opt.classList.add('ended');
            opt.textContent = 'HARGA REGULER';
        });
        
        // Update prices to normal
        updatePricesToNormal();
    } else {
        // Early bird active
        document.getElementById('quota5k').textContent = remainingQuota;
        document.getElementById('quota10k').textContent = remainingQuota;
        document.getElementById('timer5k').textContent = `${remainingDays} hari`;
        document.getElementById('timer10k').textContent = `${remainingDays} hari`;
        
        // Start countdown
        startEarlyBirdCountdown(remainingDays);
        
        // Low quota warning
        if (remainingQuota <= 20) {
            document.querySelectorAll('.early-quota').forEach(el => el.classList.add('low'));
        }
    }
}

// Update prices to normal (when early bird ends)
function updatePricesToNormal() {
    if (!raceData) return;
    
    raceData.categories.forEach(cat => {
        const priceEl = document.getElementById(`price${cat.id.toUpperCase()}`);
        const originalEl = document.getElementById(`originalPrice${cat.id.toUpperCase()}`);
        const optionPriceEl = document.getElementById(`optionPrice${cat.id.toUpperCase()}`);
        const optionOriginalEl = document.getElementById(`optionOriginal${cat.id.toUpperCase()}`);
        
        if (priceEl) priceEl.textContent = `Rp ${cat.price.toLocaleString('id-ID')}`;
        if (originalEl) originalEl.style.display = 'none';
        if (optionPriceEl) {
            optionPriceEl.textContent = `Rp ${cat.price.toLocaleString('id-ID')}`;
            optionPriceEl.style.color = 'var(--dark)';
        }
        if (optionOriginalEl) optionOriginalEl.style.display = 'none';
    });
}

// Start Early Bird Countdown
function startEarlyBirdCountdown(days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59);
    
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            clearInterval(timer);
            loadEarlyBirdStatus(); // Refresh status
            return;
        }
        
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        document.getElementById('ebDays').textContent = String(d).padStart(2, '0');
        document.getElementById('ebHours').textContent = String(h).padStart(2, '0');
        document.getElementById('ebMinutes').textContent = String(m).padStart(2, '0');
    }, 1000);
}

// Load Race Info
async function loadRaceInfo() {
    try {
        const response = await raceAPI.getInfo();
        if (response.success) {
            raceData = response.data;
            updateRaceCategories(raceData.categories);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading race info:', error);
    }
}

// Update Race Categories
function updateRaceCategories(categories) {
    categories.forEach(cat => {
        const isEarlyBird = earlyBirdStatus.isActive && earlyBirdStatus.remainingQuota > 0;
        const displayPrice = isEarlyBird ? cat.earlyBirdPrice : cat.price;
        
        // Update card
        const priceEl = document.getElementById(`price${cat.id.toUpperCase()}`);
        const originalEl = document.getElementById(`originalPrice${cat.id.toUpperCase()}`);
        
        if (priceEl) {
            priceEl.textContent = `Rp ${displayPrice.toLocaleString('id-ID')}`;
        }
        if (originalEl && isEarlyBird) {
            originalEl.textContent = `Rp ${cat.price.toLocaleString('id-ID')}`;
        } else if (originalEl) {
            originalEl.style.display = 'none';
        }
        
        // Update form options
        const optionPriceEl = document.getElementById(`optionPrice${cat.id.toUpperCase()}`);
        const optionOriginalEl = document.getElementById(`optionOriginal${cat.id.toUpperCase()}`);
        
        if (optionPriceEl) {
            optionPriceEl.textContent = `Rp ${displayPrice.toLocaleString('id-ID')}`;
        }
        if (optionOriginalEl) {
            optionOriginalEl.textContent = `Rp ${cat.price.toLocaleString('id-ID')}`;
            if (!isEarlyBird) optionOriginalEl.style.display = 'none';
        }
        
        // Check quota
        if (cat.registered >= cat.quota) {
            const card = document.querySelector(`[data-category="${cat.id}"]`);
            if (card) card.classList.add('sold-out');
        }
    });
}

// Update Price in Form
function updatePrice() {
    const selected = document.querySelector('input[name="category"]:checked');
    if (!selected || !raceData) return;
    
    const catId = selected.value;
    const category = raceData.categories.find(c => c.id === catId);
    
    if (!category) return;
    
    const isEarlyBird = earlyBirdStatus.isActive && earlyBirdStatus.remainingQuota > 0;
    const basePrice = isEarlyBird ? category.earlyBirdPrice : category.price;
    const originalPrice = category.price;
    const discount = isEarlyBird ? (originalPrice - basePrice) : 0;
    const adminFee = 10000;
    const total = basePrice + adminFee;
    
    // Update summary
    document.getElementById('summaryOriginalPrice').textContent = `Rp ${originalPrice.toLocaleString('id-ID')}`;
    document.getElementById('summaryPrice').textContent = `Rp ${basePrice.toLocaleString('id-ID')}`;
    document.getElementById('totalPrice').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    
    const discountRow = document.getElementById('discountRow');
    const earlySavings = document.getElementById('earlySavings');
    
    if (isEarlyBird && discount > 0) {
        document.getElementById('summaryDiscount').textContent = `- Rp ${discount.toLocaleString('id-ID')}`;
        discountRow.style.display = 'flex';
        earlySavings.style.display = 'block';
        document.getElementById('savingsAmount').textContent = `Rp ${discount.toLocaleString('id-ID')}`;
    } else {
        discountRow.style.display = 'none';
        earlySavings.style.display = 'none';
    }
}

// Select Category (scroll to form)
function selectCategory(catId) {
    document.querySelector(`input[name="category"][value="${catId}"]`).checked = true;
    updatePrice();
    document.getElementById('registration').scrollIntoView({ behavior: 'smooth' });
}

// Handle Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Validasi
        if (!data.fullName || !data.email || !data.category) {
            throw new Error('Mohon lengkapi semua field wajib');
        }
        
        if (!data.healthDeclaration || !data.termsAgreement) {
            throw new Error('Anda harus menyetujui pernyataan kesehatan dan peraturan');
        }
        
        const response = await participantAPI.register(data);
        
        if (response.success) {
            showSuccessModal(response.data);
            e.target.reset();
            updatePrice();
            loadEarlyBirdStatus(); // Refresh quota
            loadRaceInfo();
        } else {
            throw new Error(response.message || 'Pendaftaran gagal');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Show Success Modal
function showSuccessModal(data) {
    const modal = document.getElementById('successModal');
    document.getElementById('modalBib').textContent = data.bib;
    document.getElementById('modalName').textContent = data.fullName;
    document.getElementById('modalCategory').textContent = getCategoryName(data.category);
    document.getElementById('modalTotal').textContent = 'Rp ' + data.totalPrice.toLocaleString('id-ID');
    
    // Tambah info early bird ke modal jika applicable
    const modalBody = document.querySelector('.modal-body');
    const existingEarly = modalBody.querySelector('.early-confirm');
    if (existingEarly) existingEarly.remove();
    
    if (data.isEarlyBird) {
        const earlyDiv = document.createElement('div');
        earlyDiv.className = 'early-confirm';
        earlyDiv.style.cssText = 'background: #d4edda; color: #155724; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;';
        earlyDiv.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Selamat!</strong> Anda mendapat harga Early Bird dan hemat Rp ${data.discountApplied.toLocaleString('id-ID')}`;
        modalBody.insertBefore(earlyDiv, modalBody.querySelector('.modal-note'));
    }
    
    modal.classList.add('active');
}

function getCategoryName(category) {
    const names = {
        '5k': '5K Fun Run',
        '10k': '10K Challenge'
    };
    return names[category] || category;
}

// ... (sisa fungsi tetap sama: searchParticipant, loadResults, dll)