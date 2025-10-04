// AutoMart Webshop - Konfiguration

const CONFIG = {
    // API Konfiguration
    API: {
        BASE_URL: window.location.hostname === 'localhost' 
            ? 'http://localhost:3001' 
            : '/api', // Produktionsumgebung
        ENDPOINTS: {
            ORDER_COMPLETE: '/order/complete',
            PRODUCTS: '/products',
            ORDERS: '/orders'
        },
        TIMEOUT: 10000 // 10 Sekunden
    },
    
    // App Konfiguration
    APP: {
        NAME: 'AutoMart',
        VERSION: '1.0.0',
        DEBUG: window.location.hostname === 'localhost',
        STORAGE_PREFIX: 'automart_'
    },
    
    // UI Konfiguration
    UI: {
        TOAST_DURATION: 3000,
        LOADING_DELAY: 500,
        ANIMATION_DURATION: 300,
        PAGINATION_SIZE: 20
    },
    
    // Warenkorb Konfiguration
    CART: {
        MAX_ITEMS: 99,
        MAX_QUANTITY_PER_ITEM: 10,
        STORAGE_KEY: 'cart_items'
    },
    
    // Benutzer Konfiguration
    USER: {
        DEFAULT_NAME: 'Testbenutzer 1',
        DEFAULT_LOCATION: 'markt-xy',
        STORAGE_KEY: 'user_preferences'
    },
    
    // Standorte
    LOCATIONS: {
        'markt-xy': {
            id: 'markt-xy',
            name: 'Markt XY - Gotthilf-Bayh Str X',
            address: 'Gotthilf-Bayh Straße X, Stadt',
            coordinates: { lat: 48.7758, lng: 9.1829 }, // Stuttgart Koordinaten als Beispiel
            lockers: ['locker-001', 'locker-002', 'locker-003']
        },
        'markt-a': {
            id: 'markt-a',
            name: 'Markt A - Hauptstraße 123',
            address: 'Hauptstraße 123, Stadt',
            coordinates: { lat: 48.7659, lng: 9.1759 },
            lockers: ['locker-101', 'locker-102']
        },
        'markt-b': {
            id: 'markt-b',
            name: 'Markt B - Bahnhofstraße 456',
            address: 'Bahnhofstraße 456, Stadt',
            coordinates: { lat: 48.7858, lng: 9.1929 },
            lockers: ['locker-201', 'locker-202', 'locker-203', 'locker-204']
        }
    },
    
    // Produktkategorien
    CATEGORIES: {
        all: { name: 'Alle Produkte', icon: 'fas fa-th' },
        offers: { name: 'Angebote', icon: 'fas fa-tags' },
        vegetarian: { name: 'Vegetarisch', icon: 'fas fa-leaf' },
        vegan: { name: 'Vegan', icon: 'fas fa-seedling' },
        snacks: { name: 'Snacks', icon: 'fas fa-cookie-bite' },
        drinks: { name: 'Getränke', icon: 'fas fa-glass-whiskey' },
        frozen: { name: 'Tiefkühl', icon: 'fas fa-snowflake' },
        dairy: { name: 'Molkereiprodukte', icon: 'fas fa-cheese' }
    },
    
    // Beispiel-Produkte
    SAMPLE_PRODUCTS: [
        {
            id: 'p001',
            name: 'Wagner Steinofen Pizza',
            description: 'Knusprige Steinofen Pizza mit Salami',
            price: 2.21,
            originalPrice: 3.49,
            image: null,
            category: ['frozen', 'offers'],
            badges: ['offer'],
            nutrition: { vegetarian: false, vegan: false },
            compartment: 'freezer' // Für Arduino: welcher Schrank
        },
        {
            id: 'p002',
            name: 'Kinder Country Riegel',
            description: 'Milchschokolade mit knusprigen Cerealien',
            price: 1.99,
            originalPrice: 2.49,
            image: null,
            category: ['snacks', 'offers'],
            badges: ['offer'],
            nutrition: { vegetarian: true, vegan: false },
            compartment: 'snack'
        },
        {
            id: 'p003',
            name: 'Mozarella Käse',
            description: 'Wir nehmen nur Mozarella, alles andere ist Käse',
            price: 2.59,
            originalPrice: null,
            image: null,
            category: ['dairy', 'vegetarian'],
            badges: ['new'],
            nutrition: { vegetarian: true, vegan: false },
            compartment: 'fresh'
        },
        {
            id: 'p004',
            name: 'Käregården Ungesalzen',
            description: 'Butter ohne Salz, cremig und mild',
            price: 2.15,
            originalPrice: null,
            image: null,
            category: ['dairy', 'vegetarian'],
            badges: [],
            nutrition: { vegetarian: true, vegan: false },
            compartment: 'fresh'
        },
        {
            id: 'p005',
            name: 'Kerrygold Cheddar',
            description: 'Irischer Cheddar-Käse, würzig im Geschmack',
            price: 2.99,
            originalPrice: null,
            image: null,
            category: ['dairy', 'vegetarian'],
            badges: [],
            nutrition: { vegetarian: true, vegan: false },
            compartment: 'fresh'
        },
        {
            id: 'p006',
            name: 'Bio Cola',
            description: 'Erfrischende Bio-Cola ohne Zusatzstoffe',
            price: 1.49,
            originalPrice: null,
            image: null,
            category: ['drinks', 'vegan'],
            badges: ['vegan'],
            nutrition: { vegetarian: true, vegan: true },
            compartment: 'drink'
        }
    ],
    
    // Zeitslots für Abholung
    TIME_SLOTS: [
        '09:00 - 10:00 Uhr',
        '10:00 - 11:00 Uhr',
        '11:00 - 12:00 Uhr',
        '12:00 - 13:00 Uhr',
        '13:00 - 14:00 Uhr',
        '14:00 - 15:00 Uhr',
        '15:00 - 16:00 Uhr',
        '16:00 - 17:00 Uhr',
        '17:00 - 18:00 Uhr',
        '18:00 - 19:00 Uhr',
        '19:00 - 20:00 Uhr'
    ],
    
    // Zahlungsmethoden
    PAYMENT_METHODS: [
        { id: 'bank355', name: 'Bankkonto 355', icon: 'fas fa-university' },
        { id: 'card1234', name: 'Kreditkarte ****1234', icon: 'fas fa-credit-card' },
        { id: 'paypal', name: 'PayPal', icon: 'fab fa-paypal' }
    ],
    
    // Fehlermeldungen
    MESSAGES: {
        ERRORS: {
            NETWORK: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
            SERVER: 'Serverfehler. Bitte versuchen Sie es später erneut.',
            CART_EMPTY: 'Ihr Warenkorb ist leer.',
            INVALID_QUANTITY: 'Ungültige Menge ausgewählt.',
            ORDER_FAILED: 'Bestellung konnte nicht abgeschlossen werden.',
            LOCATION_REQUIRED: 'Bitte wählen Sie einen Abholort aus.',
            TIMEOUT: 'Anfrage-Timeout. Bitte versuchen Sie es erneut.'
        },
        SUCCESS: {
            ADDED_TO_CART: 'Produkt wurde zum Warenkorb hinzugefügt.',
            REMOVED_FROM_CART: 'Produkt wurde aus dem Warenkorb entfernt.',
            ORDER_SUCCESS: 'Ihre Bestellung wurde erfolgreich aufgegeben!',
            SETTINGS_SAVED: 'Einstellungen wurden gespeichert.'
        },
        INFO: {
            LOADING: 'Laden...',
            PROCESSING: 'Verarbeitung läuft...',
            CONNECTING: 'Verbindung wird hergestellt...'
        }
    }
};

// Utility Funktionen für Konfiguration
CONFIG.UTILS = {
    // Lokalen Storage mit Prefix
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(CONFIG.APP.STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        get: (key) => {
            try {
                const item = localStorage.getItem(CONFIG.APP.STORAGE_PREFIX + key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(CONFIG.APP.STORAGE_PREFIX + key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },
        clear: () => {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CONFIG.APP.STORAGE_PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },
    
    // URL Builder
    getApiUrl: (endpoint) => {
        return CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS[endpoint];
    },
    
    // Preis formatieren
    formatPrice: (price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    },
    
    // Datum formatieren
    formatDate: (date) => {
        return new Intl.DateTimeFormat('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    // Debug Logging
    log: (...args) => {
        if (CONFIG.APP.DEBUG) {
            console.log('[AutoMart]', ...args);
        }
    },
    
    // Error Logging
    error: (...args) => {
        console.error('[AutoMart Error]', ...args);
    },
    
    // Warn Logging
    warn: (...args) => {
        if (CONFIG.APP.DEBUG) {
            console.warn('[AutoMart Warning]', ...args);
        }
    }
};

// Globales Objekt für App-State
window.AutoMartConfig = CONFIG;