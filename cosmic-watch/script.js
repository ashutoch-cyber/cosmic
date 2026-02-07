/**
 * COSMIC WATCH - Near-Earth Asteroid Monitoring Platform
 * Pure JavaScript - No Frameworks
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8000/api',
    REFRESH_INTERVAL: 60000, // 1 minute
    ANIMATION_DURATION: 0.6,
    STARFIELDRATE: 0.5
};

// ========================================
// STATE MANAGEMENT
// ========================================
const state = {
    user: null,
    token: localStorage.getItem('cosmicWatchToken'),
    asteroids: [],
    watchlist: JSON.parse(localStorage.getItem('cosmicWatchlist') || '[]'),
    currentFilter: 'all',
    isLoading: false
};

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
    // Navigation
    navbar: document.getElementById('navbar'),
    navLinks: document.getElementById('navLinks'),
    userMenu: document.getElementById('userMenu'),
    userName: document.getElementById('userName'),
    authBtn: document.getElementById('authBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    mobileAuthBtn: document.getElementById('mobileAuthBtn'),
    
    // Hero
    hero: document.getElementById('hero'),
    exploreBtn: document.getElementById('exploreBtn'),
    heroAuthBtn: document.getElementById('heroAuthBtn'),
    asteroidCount: document.getElementById('asteroidCount'),
    hazardCount: document.getElementById('hazardCount'),
    approachCount: document.getElementById('approachCount'),
    
    // Dashboard
    dashboard: document.getElementById('dashboard'),
    skeletonGrid: document.getElementById('skeletonGrid'),
    asteroidGrid: document.getElementById('asteroidGrid'),
    emptyState: document.getElementById('emptyState'),
    refreshBtn: document.getElementById('refreshBtn'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    
    // Detail Modal
    detailModal: document.getElementById('detailModal'),
    closeDetailModal: document.getElementById('closeDetailModal'),
    detailContent: document.getElementById('detailContent'),
    
    // Watchlist
    watchlist: document.getElementById('watchlist'),
    watchlistGrid: document.getElementById('watchlistGrid'),
    emptyWatchlist: document.getElementById('emptyWatchlist'),
    browseAsteroidsBtn: document.getElementById('browseAsteroidsBtn'),
    
    // Auth Modal
    authModal: document.getElementById('authModal'),
    closeAuthModal: document.getElementById('closeAuthModal'),
    authTabs: document.querySelectorAll('.auth-tab'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

 

// ========================================
// API SERVICE
// ========================================
const api = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    login(credentials) {
        return this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
    
    register(userData) {
        return this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    getAsteroidFeed() {
        return this.request('/asteroids/feed/');
    }
};

// ========================================
// UI HELPERS
// ========================================
const ui = {
    showToast(title, message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle'
        };
        
        toast.innerHTML = `
            <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
            </button>
        `;
        
        elements.toastContainer.appendChild(toast);
        lucide.createIcons({ nodes: [toast] });
        
        // Animate in
        gsap.from(toast, {
            x: 100,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto remove
        setTimeout(() => this.removeToast(toast), 5000);
    },
    
    removeToast(toast) {
        gsap.to(toast, {
            x: 100,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => toast.remove()
        });
    },
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    getRiskLevel(asteroid) {
        if (asteroid.is_potentially_hazardous) return 'high';
        if (asteroid.close_approach_data && asteroid.close_approach_data[0]) {
            const distance = parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers);
            if (distance < 5000000) return 'medium';
        }
        return 'low';
    },
    
    getRiskScore(asteroid) {
        let score = 0;
        if (asteroid.is_potentially_hazardous) score += 60;
        if (asteroid.close_approach_data && asteroid.close_approach_data[0]) {
            const distance = parseFloat(asteroid.close_approach_data[0].miss_distance.kilometers);
            const velocity = parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_second);
            
            if (distance < 10000000) score += 20;
            if (distance < 5000000) score += 15;
            if (velocity > 20) score += 5;
        }
        return Math.min(score, 100);
    },
    
    animateCounter(element, target, duration = 2) {
        const obj = { value: 0 };
        gsap.to(obj, {
            value: target,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = Math.floor(obj.value).toLocaleString();
            }
        });
    }
};

// ========================================
// AUTHENTICATION
// ========================================
const auth = {
    init() {
        // Check for existing token
        if (state.token) {
            this.loadUser();
        }
        
        // Event listeners
        elements.authBtn.addEventListener('click', () => this.openModal());
        elements.heroAuthBtn.addEventListener('click', () => this.openModal());
        elements.mobileAuthBtn.addEventListener('click', () => this.openModal());
        elements.closeAuthModal.addEventListener('click', () => this.closeModal());
        elements.logoutBtn.addEventListener('click', () => this.logout());
        
        // Tab switching
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Forms
        elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Password toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => this.togglePassword(btn));
        });
        
        // Close on overlay click
        elements.authModal.addEventListener('click', (e) => {
            if (e.target === elements.authModal) this.closeModal();
        });
    },
    
    openModal() {
        elements.authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        gsap.from('.auth-modal', {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'back.out(1.7)'
        });
    },
    
    closeModal() {
        elements.authModal.classList.remove('active');
        document.body.style.overflow = '';
        elements.loginError.textContent = '';
        elements.registerError.textContent = '';
    },
    
    switchTab(tab) {
        elements.authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
        
        if (tab === 'login') {
            elements.loginForm.style.display = 'flex';
            elements.registerForm.style.display = 'none';
        } else {
            elements.loginForm.style.display = 'none';
            elements.registerForm.style.display = 'flex';
        }
        
        elements.loginError.textContent = '';
        elements.registerError.textContent = '';
    },
    
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = elements.loginForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        
        try {
            const data = await api.login({ username, password });
            state.token = data.access;
            state.user = { username };
            localStorage.setItem('cosmicWatchToken', state.token);
            
            this.updateUI();
            this.closeModal();
            ui.showToast('Welcome back!', `Logged in as ${username}`, 'success');
            
            // Clear form
            elements.loginForm.reset();
        } catch (error) {
            elements.loginError.textContent = error.message || 'Invalid credentials';
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    },
    
    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        const submitBtn = elements.registerForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        
        try {
            await api.register({ username, email, password });
            ui.showToast('Account created!', 'Please log in with your credentials', 'success');
            this.switchTab('login');
            elements.registerForm.reset();
        } catch (error) {
            elements.registerError.textContent = error.message || 'Registration failed';
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    },
    
    logout() {
        state.token = null;
        state.user = null;
        localStorage.removeItem('cosmicWatchToken');
        this.updateUI();
        ui.showToast('Logged out', 'See you soon!', 'success');
        
        // Reset to hero
        navigation.showSection('hero');
    },
    
    loadUser() {
        // In a real app, you'd decode the JWT or make a user info request
        state.user = { username: 'Astronaut' };
        this.updateUI();
    },
    
    updateUI() {
        if (state.user) {
            elements.authBtn.style.display = 'none';
            elements.userMenu.style.display = 'flex';
            elements.userName.textContent = state.user.username;
            elements.mobileAuthBtn.textContent = 'Logout';
            elements.mobileAuthBtn.onclick = () => this.logout();
        } else {
            elements.authBtn.style.display = 'block';
            elements.userMenu.style.display = 'none';
            elements.mobileAuthBtn.textContent = 'Login';
            elements.mobileAuthBtn.onclick = () => this.openModal();
        }
    },
    
    togglePassword(btn) {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons({ nodes: [btn] });
    }
};

// ========================================
// NAVIGATION
// ========================================
const navigation = {
    init() {
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                elements.navbar.classList.add('scrolled');
            } else {
                elements.navbar.classList.remove('scrolled');
            }
        });
        
        // Mobile menu
        elements.mobileMenuBtn.addEventListener('click', () => {
            elements.mobileMenu.classList.toggle('active');
        });
        
        // Navigation links
        document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                elements.mobileMenu.classList.remove('active');
                
                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');
            });
        });
        
        // Hero CTA
        elements.exploreBtn.addEventListener('click', () => {
            this.showSection('dashboard');
            document.querySelector('.nav-link[data-section="dashboard"]')?.classList.add('active');
        });
        
        elements.browseAsteroidsBtn.addEventListener('click', () => {
            this.showSection('dashboard');
            document.querySelector('.nav-link[data-section="dashboard"]')?.classList.add('active');
        });
    },
    
    showSection(sectionName) {
        // Hide all sections
        elements.hero.style.display = 'none';
        elements.dashboard.style.display = 'none';
        elements.watchlist.style.display = 'none';
        
        // Show target section
        switch(sectionName) {
            case 'hero':
                elements.hero.style.display = 'flex';
                gsap.from('.hero-content > *', {
                    y: 30,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
                break;
            case 'dashboard':
                elements.dashboard.style.display = 'block';
                dashboard.loadAsteroids();
                gsap.from('.dashboard > *', {
                    y: 20,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 0.5,
                    ease: 'power2.out'
                });
                break;
            case 'watchlist':
                elements.watchlist.style.display = 'block';
                watchlist.render();
                gsap.from('.watchlist > *', {
                    y: 20,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 0.5,
                    ease: 'power2.out'
                });
                break;
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ========================================
// DASHBOARD
// ========================================
const dashboard = {
    init() {
        // Filter tabs
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.currentFilter = tab.dataset.filter;
                this.render();
            });
        });
        
        // Refresh button
        elements.refreshBtn.addEventListener('click', () => {
            this.loadAsteroids();
        });
    },
    
    async loadAsteroids() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        elements.skeletonGrid.style.display = 'grid';
        elements.asteroidGrid.style.display = 'none';
        elements.emptyState.style.display = 'none';
        elements.refreshBtn.classList.add('spinning');
        
        try {
            // Use mock data if API is not available
            const data = await this.fetchWithFallback();
            state.asteroids = Array.isArray(data) ? data : [];

            
            // Update hero stats
            this.updateStats();
            
            // Render
            this.render();
            
            elements.skeletonGrid.style.display = 'none';
            elements.asteroidGrid.style.display = 'grid';
        } catch (error) {
            console.error('Failed to load asteroids:', error);
            ui.showToast('Error', 'Failed to load asteroid data', 'error');
        } finally {
            state.isLoading = false;
            elements.refreshBtn.classList.remove('spinning');
        }
    },
    
    async fetchWithFallback() {
        try {
            return await api.getAsteroidFeed();
        } catch (error) {
            // Return mock data if API fails
            console.log('Using mock data');
            return this.getMockData();
        }
    },
    
    getMockData() {
    return [
        {
            id: '1',
            name: '(2024 AA)',
            diameter_km: 0.15,
            velocity_km_s: 15.5,
            miss_distance_km: 2500000,
            date: '2024-02-15',
            hazardous: true,
            risk_level: 'HIGH',
            risk_score: 82
        },
        {
            id: '2',
            name: '(2023 BB)',
            diameter_km: 0.08,
            velocity_km_s: 8.2,
            miss_distance_km: 8500000,
            date: '2024-02-20',
            hazardous: false,
            risk_level: 'LOW',
            risk_score: 22
        }
    ];
},
    
    updateStats() {
        const hazardous = state.asteroids.filter(a => a.hazardous).length;

        const approaching = state.asteroids.filter(a => {
            const date = new Date(a.date);
            const today = new Date();
            const diff = Math.abs(date - today);
            return diff < 7 * 24 * 60 * 60 * 1000;
        }).length;

        ui.animateCounter(elements.asteroidCount, state.asteroids.length);
        ui.animateCounter(elements.hazardCount, hazardous);
        ui.animateCounter(elements.approachCount, approaching);

    },
    
    render() {
        let filtered = state.asteroids;
        
        if (state.currentFilter !== 'all') {
            filtered = state.asteroids.filter(asteroid => {
                return asteroid.risk_level.toLowerCase() === state.currentFilter;
            });
        }
        
        if (filtered.length === 0) {
            elements.asteroidGrid.style.display = 'none';
            elements.emptyState.style.display = 'block';
            return;
        }
        
        elements.emptyState.style.display = 'none';
        elements.asteroidGrid.style.display = 'grid';
        
        elements.asteroidGrid.innerHTML = filtered.map(asteroid => this.createCard(asteroid)).join('');
        
        // Initialize icons
        lucide.createIcons({ nodes: elements.asteroidGrid });
        
        // Add click handlers
        elements.asteroidGrid.querySelectorAll('.asteroid-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const asteroid = state.asteroids.find(a => a.id === id);
                if (asteroid) detailModal.open(asteroid);
            });
        });
        
        // Kill any existing animations and animate cards
        gsap.killTweensOf('.asteroid-card');
        gsap.fromTo('.asteroid-card', 
            { y: 30, opacity: 0 },
            { 
                y: 0,
                opacity: 1,
                stagger: 0.08,
                duration: 0.5,
                ease: 'power2.out'
            }
        );
    },
    
createCard(asteroid) {
    return `
        <div class="asteroid-card ${asteroid.risk_level.toLowerCase()}" data-id="${asteroid.id}">
            <div class="card-header">
                <div>
                    <div class="asteroid-name">${asteroid.name}</div>
                    <div class="asteroid-id">ID: ${asteroid.id}</div>
                </div>
                <span class="risk-badge ${asteroid.risk_level.toLowerCase()}">
                    ${asteroid.risk_level}
                </span>
            </div>

            <div class="card-stats">
                <div class="stat">
                    <span class="stat-label-card">Diameter</span>
                    <span class="stat-value">${asteroid.diameter_km.toFixed(3)} km</span>
                </div>
                <div class="stat">
                    <span class="stat-label-card">Velocity</span>
                    <span class="stat-value">${Number(asteroid.velocity_km_s).toFixed(1)} km/s</span>
                </div>
                <div class="stat">
                    <span class="stat-label-card">Miss Distance</span>
                    <span class="stat-value">${ui.formatNumber(Number(asteroid.miss_distance_km))} km</span>
                </div>
                <div class="stat">
                    <span class="stat-label-card">Risk Score</span>
                    <span class="stat-value">${asteroid.risk_score}</span>
                </div>
            </div>

            <div class="card-footer">
                <span class="approach-date">
                    <i data-lucide="calendar"></i>
                    ${ui.formatDate(asteroid.date)}
                </span>
                ${asteroid.hazardous ? `
                    <span class="hazard-indicator">
                        <i data-lucide="alert-triangle"></i>
                        Hazardous
                    </span>
                ` : ''}
            </div>
        </div>
    `;
}

};

// ========================================
// ASTEROID DETAIL MODAL
// ========================================
const detailModal = {
    init() {
        elements.closeDetailModal.addEventListener('click', () => this.close());
        elements.detailModal.addEventListener('click', (e) => {
            if (e.target === elements.detailModal) this.close();
        });
    },
    
    open(asteroid) {
        const risk = asteroid.risk_level.toLowerCase();
        const riskScore = asteroid.risk_score;

        // const risk = ui.getRiskLevel({
        //     is_potentially_hazardous: asteroid.is_potentially_hazardous_asteroid,
        //     close_approach_data: asteroid.close_approach_data
        // });
        
        // const riskScore = ui.getRiskScore({
        //     is_potentially_hazardous: asteroid.is_potentially_hazardous_asteroid,
        //     close_approach_data: asteroid.close_approach_data
        // });
        
        const avgDiameter = asteroid.diameter_km;
        const diameterPercent = Math.min((avgDiameter / 2) * 100, 100);

        
        const isInWatchlist = state.watchlist.some(w => w.id === asteroid.id);
        
        elements.detailContent.innerHTML = `
            <div class="detail-header">
                <h2 class="detail-title">${asteroid.name_limited || asteroid.name}</h2>
                <div class="detail-id">ID: ${asteroid.id}</div>
                <div class="detail-risk">
                    <div class="risk-meter">
                        <div class="risk-fill ${risk}" style="width: ${riskScore}%"></div>
                    </div>
                    <span class="risk-score" style="color: var(--color-${risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'})">${riskScore}</span>
                </div>
            </div>
            
            <div class="detail-stats">
                <div class="detail-stat">
                    <div class="stat-icon">
                        <i data-lucide="gauge"></i>
                    </div>
                    <div class="stat-value-large">${Number(asteroid.velocity_km_s).toFixed(1)}</div>
                    <div class="stat-label-detail">km/s Velocity</div>
                </div>
                
                <div class="detail-stat">
                    <div class="stat-icon">
                        <i data-lucide="navigation"></i>
                    </div>
                    <div class="stat-value-large">${ui.formatNumber(Number(asteroid.miss_distance_km))}</div>
                    <div class="stat-label-detail">km Miss Distance</div>
                </div>
                
                <div class="diameter-ring">
                    <div class="ring-container">
                        <svg class="ring-svg" width="120" height="120" viewBox="0 0 120 120">
                            <circle class="ring-bg" cx="60" cy="60" r="45"></circle>
                            <circle class="ring-fill" cx="60" cy="60" r="45" 
                                stroke-dasharray="283" 
                                stroke-dashoffset="${283 - (283 * diameterPercent / 100)}"></circle>
                        </svg>
                        <div class="ring-value">
                            <div class="ring-number">${avgDiameter.toFixed(3)}</div>
                            <div class="ring-unit">km diameter</div>
                        </div>
                    </div>
                    <div class="ring-info">
                        <h4>Estimated Size</h4>
                        <p>This asteroid has an estimated diameter of ${avgDiameter.toFixed(3)} km.</p>
                    </div>
                </div>
            </div>
            
            <div class="detail-actions">
                <button class="cta-btn primary" id="watchlistToggleBtn">
                    <i data-lucide="${isInWatchlist ? 'bookmark-check' : 'bookmark-plus'}"></i>
                    ${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                <button class="cta-btn secondary" id="closeDetailBtn">
                    <i data-lucide="x"></i>
                    Close
                </button>
            </div>
        `;
        
        lucide.createIcons({ nodes: elements.detailContent });
        
        // Watchlist toggle
        document.getElementById('watchlistToggleBtn').addEventListener('click', () => {
            if (isInWatchlist) {
                watchlist.remove(asteroid.id);
            } else {
                watchlist.add(asteroid);
            }
            this.open(asteroid); // Re-render
        });
        
        document.getElementById('closeDetailBtn').addEventListener('click', () => this.close());
        
        elements.detailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        gsap.from('.detail-modal .modal-content > *', {
            y: 20,
            opacity: 0,
            stagger: 0.1,
            duration: 0.4,
            ease: 'power2.out'
        });
    },
    
    close() {
        elements.detailModal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ========================================
// WATCHLIST
// ========================================
const watchlist = {
    init() {
        // Already initialized from localStorage in state
    },
    
    add(asteroid) {
        if (!state.watchlist.some(w => w.id === asteroid.id)) {
            state.watchlist.push({
                id: asteroid.id,
                name: asteroid.name,
                name_limited: asteroid.name_limited,
                hazardous: asteroid.hazardous,
                date: asteroid.date,
                risk_level: asteroid.risk_level,
                added_at: new Date().toISOString()
            });
            this.save();
            ui.showToast('Added to watchlist', asteroid.name_limited || asteroid.name, 'success');
        }
    },
    
    remove(id) {
        const item = state.watchlist.find(w => w.id === id);
        state.watchlist = state.watchlist.filter(w => w.id !== id);
        this.save();
        if (item) {
            ui.showToast('Removed from watchlist', item.name_limited || item.name, 'success');
        }
        this.render();
    },
    
    save() {
        localStorage.setItem('cosmicWatchlist', JSON.stringify(state.watchlist));
    },
    
    render() {
        if (state.watchlist.length === 0) {
            elements.watchlistGrid.innerHTML = '';
            elements.watchlistGrid.appendChild(elements.emptyWatchlist);
            elements.emptyWatchlist.style.display = 'block';
            return;
        }
        
        elements.emptyWatchlist.style.display = 'none';
        
        elements.watchlistGrid.innerHTML = state.watchlist.map(item => {
            const isApproaching = item.date && 
                new Date(item.date) - new Date() < 7 * 24 * 60 * 60 * 1000;
            
            return `
                <div class="asteroid-card watchlist-card" data-id="${item.id}">
                    ${isApproaching ? `
                        <div class="alert-badge" title="Close approach soon">
                            <i data-lucide="bell"></i>
                        </div>
                    ` : ''}
                    <button class="remove-btn" data-id="${item.id}" title="Remove from watchlist">
                        <i data-lucide="trash-2"></i>
                    </button>
                    <div class="card-header">
                        <div>
                            <div class="asteroid-name">${item.name_limited || item.name}</div>
                            <div class="asteroid-id">ID: ${item.id}</div>
                        </div>
                        ${item.hazardous ? `
                            <span class="risk-badge high">High</span>
                        ` : '<span class="risk-badge low">Low</span>'}
                    </div>
                    <div class="card-footer">
                        <span class="approach-date">
                            <i data-lucide="calendar"></i>
                            ${item.date ? ui.formatDate(item.date) : 'N/A'}
                        </span>
                        ${item.hazardous ? `
                            <span class="hazard-indicator">
                                <i data-lucide="alert-triangle"></i>
                                Hazardous
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons({ nodes: elements.watchlistGrid });
        
        // Remove buttons
        elements.watchlistGrid.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(btn.dataset.id);
            });
        });
        
        // Card clicks - show detail
        elements.watchlistGrid.querySelectorAll('.watchlist-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                // Find full asteroid data or fetch
                const fullAsteroid = state.asteroids.find(a => a.id === id);
                if (fullAsteroid) {
                    detailModal.open(fullAsteroid);
                } else {
                    // Create minimal asteroid object from watchlist
                    const watchItem = state.watchlist.find(w => w.id === id);
                    if (watchItem) {
                       detailModal.open({
                            id: watchItem.id,
                            name: watchItem.name,
                            diameter_km: 0,
                            velocity_km_s: 0,
                            miss_distance_km: 0,
                            date: watchItem.date,
                            hazardous: watchItem.hazardous,
                            risk_level: watchItem.risk_level,
                            risk_score: watchItem.risk_level === 'HIGH' ? 80 : 30
                        });

                    }
                }
            });
        });
        
        // Animate
        gsap.from('.watchlist-card', {
            y: 20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.4,
            ease: 'power2.out'
        });
    }
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize starfield
    
    
    // Initialize modules
    auth.init();
    navigation.init();
    dashboard.init();
    detailModal.init();
    watchlist.init();
    
    // Initial animations
    gsap.from('.navbar', {
        y: -100,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    });
    
    gsap.from('.hero-content > *', {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        delay: 0.3,
        ease: 'power2.out'
    });
    
    gsap.from('.orbit-container', {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        delay: 0.5,
        ease: 'power2.out'
    });
    
    // Load initial asteroid count for hero
    setTimeout(() => {
        ui.animateCounter(elements.asteroidCount, 2847);
        ui.animateCounter(elements.hazardCount, 156);
        ui.animateCounter(elements.approachCount, 12);
    }, 1000);
});
