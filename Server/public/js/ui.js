// AutoMart Webshop - UI Controller

class UIController {
    constructor() {
        this.currentPage = 'home';
        this.isLoading = false;
        this.toastQueue = [];
        this.modals = new Map();
        
        // Event Listeners
        this.initializeEventListeners();
        this.initializeWakeLock();
    }
    
    // Event Listeners initialisieren
    initializeEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            }
        });
        
        // Warenkorb Icon
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.showPage('cart'));
        }
        
        // User Icon
        const userIcon = document.querySelector('.user-icon');
        if (userIcon) {
            userIcon.addEventListener('click', () => this.showPage('account'));
        }
        
        // Suche
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    ProductManager.searchQuery = e.target.value;
                    if (this.currentPage === 'products') {
                        ProductManager.renderProductsPage(ProductManager.currentCategory);
                    }
                }, 300);
            });
        }
        
        // Kategorie Filter
        document.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('.filter-btn');
            if (filterBtn) {
                const category = filterBtn.dataset.category;
                this.handleCategoryFilter(category, filterBtn);
            }
        });
        
        // Checkout Button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }
        
        // Purchase Button
        const purchaseBtn = document.getElementById('purchase-btn');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => this.handlePurchase());
        }
        
        // Pickup Button
        const openPickupBtn = document.getElementById('open-pickup-btn');
        if (openPickupBtn) {
            openPickupBtn.addEventListener('click', () => this.handleOpenPickup());
        }
        
        // Modal Close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal();
            }
        });
        
        // Success Modal OK
        const successOk = document.getElementById('success-ok');
        if (successOk) {
            successOk.addEventListener('click', () => {
                this.hideModal();
                this.showPage('pickup');
            });
        }
        
        // Location Selector
        const locationSelect = document.getElementById('location-select');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.handleLocationChange(e.target.value);
            });
        }
        
        // Warenkorb Updates
        ShoppingCart.addEventListener((cartData) => {
            this.updateCartUI(cartData);
        });
        
        // Online/Offline Status
        window.addEventListener('online', () => {
            this.showToast('Verbindung wiederhergestellt', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Keine Internetverbindung', 'warning');
        });
    }
    
    // Wake Lock für Mobile Devices
    initializeWakeLock() {
        if ('wakeLock' in navigator) {
            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible' && this.currentPage === 'pickup') {
                    try {
                        await navigator.wakeLock.request('screen');
                        CONFIG.UTILS.log('Wake lock activated');
                    } catch (err) {
                        CONFIG.UTILS.warn('Wake lock failed:', err);
                    }
                }
            });
        }
    }
    
    // Seite anzeigen
    showPage(pageName) {
        try {
            // Aktuelle Seite verstecken
            const currentPageElement = document.querySelector('.page.active');
            if (currentPageElement) {
                currentPageElement.classList.remove('active');
            }
            
            // Neue Seite anzeigen
            const newPageElement = document.getElementById(`${pageName}-page`);
            if (newPageElement) {
                newPageElement.classList.add('active');
                this.currentPage = pageName;
                
                // Navigation aktualisieren
                this.updateNavigation(pageName);
                
                // Seiten-spezifische Initialisierung
                this.initializePage(pageName);
                
                CONFIG.UTILS.log('Switched to page:', pageName);
            } else {
                CONFIG.UTILS.error('Page not found:', pageName);
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to show page:', error);
        }
    }
    
    // Navigation aktualisieren
    updateNavigation(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }
    
    // Seiten-spezifische Initialisierung
    async initializePage(pageName) {
        try {
            switch (pageName) {
                case 'home':
                    await ProductManager.renderFeaturedProducts();
                    break;
                    
                case 'products':
                    await ProductManager.renderProductsPage(ProductManager.currentCategory);
                    break;
                    
                case 'cart':
                    ProductManager.renderCartPage();
                    break;
                    
                case 'checkout':
                    this.initializeCheckoutPage();
                    break;
                    
                case 'orders':
                    await this.loadOrdersPage();
                    break;
                    
                case 'pickup':
                    this.initializePickupPage();
                    break;
            }
        } catch (error) {
            CONFIG.UTILS.error(`Failed to initialize ${pageName} page:`, error);
        }
    }
    
    // Kategorie-Filter behandeln
    async handleCategoryFilter(category, buttonElement) {
        try {
            // UI Update
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            buttonElement.classList.add('active');
            
            // Produkte laden
            await ProductManager.renderProductsPage(category);
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to filter category:', error);
            this.showToast('Kategorie konnte nicht geladen werden', 'error');
        }
    }
    
    // Warenkorb UI aktualisieren
    updateCartUI(cartData) {
        try {
            // Warenkorb-Zähler
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = cartData.totalItems;
                cartCount.style.display = cartData.totalItems > 0 ? 'flex' : 'none';
            }
            
            // Gesamtpreis in verschiedenen Bereichen
            const totalElements = document.querySelectorAll('#total-price, #checkout-total, #pickup-total');
            totalElements.forEach(element => {
                if (element) {
                    element.textContent = cartData.formattedTotal;
                }
            });
            
            // Checkout Button aktivieren/deaktivieren
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.disabled = cartData.isEmpty;
            }
            
            CONFIG.UTILS.log('Cart UI updated:', cartData);
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to update cart UI:', error);
        }
    }
    
    // Checkout-Seite initialisieren
    initializeCheckoutPage() {
        try {
            const cartData = ShoppingCart.getCartData();
            
            if (cartData.isEmpty) {
                this.showToast(CONFIG.MESSAGES.ERRORS.CART_EMPTY, 'error');
                this.showPage('cart');
                return;
            }
            
            // Standort und Kundendaten setzen
            const stationElement = document.getElementById('pickup-station');
            const customerElement = document.getElementById('customer-name');
            const totalElement = document.getElementById('checkout-total');
            
            if (stationElement) {
                const currentLocation = CONFIG.LOCATIONS[CONFIG.USER.DEFAULT_LOCATION];
                stationElement.textContent = currentLocation ? currentLocation.name : 'Standort wählen';
            }
            
            if (customerElement) {
                customerElement.textContent = CONFIG.USER.DEFAULT_NAME;
            }
            
            if (totalElement) {
                totalElement.textContent = cartData.formattedTotal;
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to initialize checkout:', error);
        }
    }
    
    // Checkout verarbeiten
    handleCheckout() {
        try {
            const cartData = ShoppingCart.getCartData();
            
            if (cartData.isEmpty) {
                this.showToast(CONFIG.MESSAGES.ERRORS.CART_EMPTY, 'error');
                return;
            }
            
            this.showPage('checkout');
            
        } catch (error) {
            CONFIG.UTILS.error('Checkout failed:', error);
            this.showToast('Checkout konnte nicht gestartet werden', 'error');
        }
    }
    
    // Bestellung abschließen
    async handlePurchase() {
        try {
            this.showLoading('Bestellung wird verarbeitet...');
            
            const cartData = ShoppingCart.getCartData();
            
            if (cartData.isEmpty) {
                throw new Error(CONFIG.MESSAGES.ERRORS.CART_EMPTY);
            }
            
            // Checkout-Daten generieren
            const checkoutData = ShoppingCart.generateCheckoutData(
                CONFIG.USER.DEFAULT_LOCATION,
                document.getElementById('time-slot')?.textContent || CONFIG.TIME_SLOTS[0]
            );
            
            // API-Aufruf
            const result = await AutoMartAPI.completeOrder(checkoutData);
            
            // Erfolg behandeln
            this.hideLoading();
            
            // Warenkorb leeren
            ShoppingCart.clear();
            
            // Erfolgsmeldung anzeigen
            this.showSuccessModal(checkoutData.orderId);
            
            CONFIG.UTILS.log('Purchase completed:', result);
            
        } catch (error) {
            this.hideLoading();
            CONFIG.UTILS.error('Purchase failed:', error);
            this.showToast(error.message || CONFIG.MESSAGES.ERRORS.ORDER_FAILED, 'error');
        }
    }
    
    // Abholung öffnen
    async handleOpenPickup() {
        try {
            this.showLoading('Öffne Abholstation...');
            
            const orderId = document.getElementById('order-id')?.textContent?.replace('ID ', '') || 'test-order';
            const lockerId = 'locker-001'; // Aus aktuellem Standort
            
            const result = await AutoMartAPI.openPickup(orderId, lockerId);
            
            this.hideLoading();
            this.showToast('Abholstation wurde geöffnet!', 'success');
            
            // Nach 3 Sekunden zur Startseite
            setTimeout(() => {
                this.showPage('home');
            }, 3000);
            
        } catch (error) {
            this.hideLoading();
            CONFIG.UTILS.error('Failed to open pickup:', error);
            this.showToast('Abholstation konnte nicht geöffnet werden', 'error');
        }
    }
    
    // Bestellungen laden
    async loadOrdersPage() {
        try {
            const ordersContainer = document.getElementById('orders-list');
            if (!ordersContainer) return;
            
            this.showLoading('Bestellungen werden geladen...');
            
            const ordersData = await AutoMartAPI.getOrders();
            
            this.hideLoading();
            
            if (ordersData.success && ordersData.data.orders.length > 0) {
                ordersContainer.innerHTML = ordersData.data.orders
                    .map(order => this.renderOrderCard(order))
                    .join('');
            } else {
                ordersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h3>Keine Bestellungen</h3>
                        <p>Sie haben noch keine Bestellungen aufgegeben.</p>
                        <button class="btn-primary" onclick="UI.showPage('products')">Jetzt bestellen</button>
                    </div>
                `;
            }
            
        } catch (error) {
            this.hideLoading();
            CONFIG.UTILS.error('Failed to load orders:', error);
            
            const ordersContainer = document.getElementById('orders-list');
            if (ordersContainer) {
                ordersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Fehler beim Laden</h3>
                        <p>Bestellungen konnten nicht geladen werden.</p>
                        <button class="btn-secondary" onclick="UI.loadOrdersPage()">Erneut versuchen</button>
                    </div>
                `;
            }
        }
    }
    
    // Bestellungs-Karte rendern
    renderOrderCard(order) {
        const isActive = order.status === 'active';
        const cardClass = isActive ? 'order-card active' : 'order-card';
        
        return `
            <div class="${cardClass}">
                <div class="order-header">
                    <div class="order-logo">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="order-info">
                        <h4>${order.location}</h4>
                        <div class="order-meta">
                            Abgeholt: ${order.date}<br>
                            Bestellnummer: ${order.id}<br>
                            ${order.items} Artikel • ${CONFIG.UTILS.formatPrice(order.total)}
                        </div>
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn-secondary btn-sm">Bestellung anzeigen</button>
                    <button class="btn-secondary btn-sm">Eine Bewertung abgeben</button>
                    ${!isActive ? '<button class="btn-primary btn-sm">Noch einmal bestellen</button>' : ''}
                </div>
            </div>
        `;
    }
    
    // Pickup-Seite initialisieren
    initializePickupPage() {
        // Countdown-Timer starten
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            this.startCountdown(countdownElement, 50 * 60 + 59); // 50 min 59 sec in Sekunden
        }
    }
    
    // Countdown-Timer
    startCountdown(element, seconds) {
        const updateCountdown = () => {
            if (seconds <= 0) {
                element.textContent = 'Zeit abgelaufen';
                element.style.color = 'var(--accent-color)';
                return;
            }
            
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            element.textContent = `${minutes} min ${remainingSeconds.toString().padStart(2, '0')} sec`;
            
            seconds--;
            setTimeout(updateCountdown, 1000);
        };
        
        updateCountdown();
    }
    
    // Standort-Änderung behandeln
    handleLocationChange(locationId) {
        try {
            const location = CONFIG.LOCATIONS[locationId];
            if (location) {
                CONFIG.UTILS.log('Location changed to:', location);
                // Hier könnten weitere Aktionen folgen, wie Produktverfügbarkeit prüfen
            }
        } catch (error) {
            CONFIG.UTILS.error('Failed to change location:', error);
        }
    }
    
    // Loading Overlay anzeigen
    showLoading(message = CONFIG.MESSAGES.INFO.LOADING) {
        try {
            this.isLoading = true;
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                const messageElement = overlay.querySelector('p');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                overlay.classList.remove('hidden');
            }
        } catch (error) {
            CONFIG.UTILS.error('Failed to show loading:', error);
        }
    }
    
    // Loading Overlay verstecken
    hideLoading() {
        try {
            this.isLoading = false;
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        } catch (error) {
            CONFIG.UTILS.error('Failed to hide loading:', error);
        }
    }
    
    // Toast Notification anzeigen
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        try {
            // Vorhandene Toasts entfernen
            document.querySelectorAll('.toast').forEach(toast => toast.remove());
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            // Toast nach Ablauf der Zeit entfernen
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to show toast:', error);
        }
    }
    
    // Erfolgs-Modal anzeigen
    showSuccessModal(orderId) {
        try {
            const modal = document.getElementById('success-modal');
            const orderIdElement = document.getElementById('success-order-id');
            
            if (modal && orderIdElement) {
                orderIdElement.textContent = orderId;
                modal.classList.remove('hidden');
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to show success modal:', error);
        }
    }
    
    // Modal verstecken
    hideModal() {
        try {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        } catch (error) {
            CONFIG.UTILS.error('Failed to hide modal:', error);
        }
    }
}

// Singleton Pattern
const UI = new UIController();

// Global verfügbar machen
window.UI = UI;