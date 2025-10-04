// --- MOCKS für Testzwecke ---
window.CONFIG = {
  APP: { VERSION: "1.0.0", DEBUG: true },
  USER: { DEFAULT_NAME: "Gast", DEFAULT_LOCATION: "Berlin", STORAGE_KEY: "automart_user" },
  UTILS: {
    log: console.log,
    warn: console.warn,
    error: console.error,
    storage: {
      get: (key) => JSON.parse(localStorage.getItem(key) || "null"),
      set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
      clear: () => localStorage.clear()
    }
  }
};

window.AutoMartAPI = { healthCheck: async () => true };
window.UI = {
  showPage: (page) => console.log("Zeige Seite:", page),
  hideModal: () => console.log("Modal schließen"),
  showToast: (msg, type) => console.log(`[${type}] ${msg}`),
  updateCartUI: (data) => console.log("Cart UI aktualisiert:", data),
  initializePage: (page) => console.log("Init Page:", page),
  currentPage: "home"
};
window.ShoppingCart = {
  getCartData: () => ({ items: 0 }),
  clear: () => console.log("Cart geleert")
};

// --- Hauptklasse ---
class AutoMartApp {
  constructor() {
    this.isInitialized = false;
    this.version = CONFIG.APP.VERSION;
    this.startTime = Date.now();
    this.state = {
      user: {
        name: CONFIG.USER.DEFAULT_NAME,
        location: CONFIG.USER.DEFAULT_LOCATION,
        preferences: {}
      },
      session: {
        startTime: Date.now(),
        pageViews: 0,
        interactions: 0
      },
      network: {
        isOnline: navigator.onLine,
        lastSync: null
      }
    };
    this.initialize();
  }

  async initialize() {
    try {
      CONFIG.UTILS.log('Initializing AutoMart App v' + this.version);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
      } else {
        await this.onDOMReady();
      }
    } catch (error) {
      CONFIG.UTILS.error('App initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  async onDOMReady() {
    try {
      await this.registerServiceWorker();
      this.loadUserPreferences();
      await this.checkBackendConnection();
      this.initializeUI();
      this.setupEventListeners();
      await this.loadInitialPage();
      this.setupPerformanceMonitoring();
      this.finishInitialization();
    } catch (error) {
      CONFIG.UTILS.error('DOM ready initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator && !CONFIG.APP.DEBUG) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        CONFIG.UTILS.log('Service Worker registered:', registration);
      } catch (error) {
        CONFIG.UTILS.warn('Service Worker registration failed:', error);
      }
    }
  }

  loadUserPreferences() {
    try {
      const saved = CONFIG.UTILS.storage.get(CONFIG.USER.STORAGE_KEY);
      if (saved) {
        this.state.user = { ...this.state.user, ...saved };
        CONFIG.UTILS.log('User preferences loaded:', this.state.user);
      }
    } catch (error) {
      CONFIG.UTILS.error('Failed to load user preferences:', error);
    }
  }

  async checkBackendConnection() {
    try {
      const isHealthy = await AutoMartAPI.healthCheck();
      if (!isHealthy && navigator.onLine) {
        CONFIG.UTILS.warn('Backend is not responding, using offline mode');
        this.showOfflineWarning();
      } else if (isHealthy) {
        CONFIG.UTILS.log('Backend connection established');
        this.state.network.lastSync = Date.now();
      }
    } catch (error) {
      CONFIG.UTILS.error('Backend health check failed:', error);
      if (navigator.onLine) this.showOfflineWarning();
    }
  }

  initializeUI() {
    try {
      this.applyTheme();
      this.setupAccessibility();
      this.setupInteractionEvents();
      this.setupKeyboardNavigation();
      CONFIG.UTILS.log('UI initialized successfully');
    } catch (error) {
      CONFIG.UTILS.error('UI initialization failed:', error);
    }
  }

  applyTheme() {
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.matches) document.body.classList.add('dark-mode');
      if (mq) {
        mq.addEventListener('change', (e) => {
          document.body.classList.toggle('dark-mode', e.matches);
        });
      }
    } catch (error) {
      CONFIG.UTILS.error('Theme application failed:', error);
    }
  }

  setupEventListeners() {
    try {
      window.addEventListener('online', () => { this.state.network.isOnline = true; });
      window.addEventListener('offline', () => { this.state.network.isOnline = false; });
    } catch (error) {
      CONFIG.UTILS.error('Event listeners setup failed:', error);
    }
  }

  async loadInitialPage() {
    try {
      const hash = window.location.hash.substring(1);
      const initialPage = hash && ['home', 'products', 'cart', 'orders', 'account'].includes(hash) ? hash : 'home';
      UI.showPage(initialPage);
      this.state.session.pageViews++;
    } catch (error) {
      CONFIG.UTILS.error('Failed to load initial page:', error);
      UI.showPage('home');
    }
  }

  setupPerformanceMonitoring() {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => CONFIG.UTILS.log('Perf metric:', entry));
        });
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      }
    } catch (error) {
      CONFIG.UTILS.error('Performance monitoring setup failed:', error);
    }
  }

  finishInitialization() {
    try {
      this.isInitialized = true;
      CONFIG.UTILS.log(`AutoMart App initialized successfully`);
      UI.updateCartUI(ShoppingCart.getCartData());
    } catch (error) {
      CONFIG.UTILS.error('Finish initialization failed:', error);
    }
  }

  showOfflineWarning() {
    if (this.isInitialized) UI.showToast('Offline-Modus aktiv', 'warning', 5000);
  }

  handleInitializationError(error) {
    CONFIG.UTILS.error('Critical initialization error:', error);
  }
}

// App starten
const app = new AutoMartApp();
window.AutoMartApp = app;