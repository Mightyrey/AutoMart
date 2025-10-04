// AutoMart Webshop - Produktverwaltung

class ProductManager {
    constructor() {
        this.products = [];
        this.categories = CONFIG.CATEGORIES;
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.isLoading = false;
        this.searchQuery = '';
        
        // Cache für Performance
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 Minuten
    }
    
    // Produkte laden
    async loadProducts(category = 'all', page = 1, limit = 20, forceRefresh = false) {
        try {
            const cacheKey = `products_${category}_${page}_${limit}`;
            
            // Cache prüfen
            if (!forceRefresh && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    CONFIG.UTILS.log('Using cached products:', cached.data);
                    return cached.data;
                }
            }
            
            this.isLoading = true;
            UI.showLoading('Produkte werden geladen...');
            
            const response = await AutoMartAPI.getProducts(category, page, limit);
            
            if (response.success) {
                this.products = response.data.products;
                this.currentCategory = category;
                this.currentPage = page;
                
                // Cache aktualisieren
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                
                CONFIG.UTILS.log(`Loaded ${this.products.length} products for category: ${category}`);
                
                return response.data;
            }
            
            throw new Error('Produkte konnten nicht geladen werden');
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load products:', error);
            UI.showToast(error.message, 'error');
            throw error;
            
        } finally {
            this.isLoading = false;
            UI.hideLoading();
        }
    }
    
    // Featured/Angebots-Produkte für Startseite
    async getFeaturedProducts() {
        try {
            const allProducts = await this.loadProducts('offers', 1, 6);
            return allProducts.products || [];
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load featured products:', error);
            // Fallback zu lokalen Beispielprodukten
            return CONFIG.SAMPLE_PRODUCTS
                .filter(p => p.badges.includes('offer'))
                .slice(0, 6);
        }
    }
    
    // Produkte durchsuchen
    searchProducts(query) {
        try {
            this.searchQuery = query.toLowerCase().trim();
            
            if (!this.searchQuery) {
                return this.products;
            }
            
            const filtered = this.products.filter(product => {
                return (
                    product.name.toLowerCase().includes(this.searchQuery) ||
                    product.description.toLowerCase().includes(this.searchQuery) ||
                    product.category.some(cat => 
                        this.categories[cat]?.name.toLowerCase().includes(this.searchQuery)
                    )
                );
            });
            
            CONFIG.UTILS.log(`Search "${this.searchQuery}" returned ${filtered.length} results`);
            
            return filtered;
            
        } catch (error) {
            CONFIG.UTILS.error('Search failed:', error);
            return this.products;
        }
    }
    
    // Einzelnes Produkt abrufen
    getProduct(productId) {
        return this.products.find(product => product.id === productId);
    }
    
    // Produkt nach Kategorie filtern
    filterByCategory(category) {
        if (category === 'all') {
            return this.products;
        }
        
        return this.products.filter(product => 
            product.category.includes(category)
        );
    }
    
    // Produktkarte HTML generieren (Grid-Layout)
    renderProductCard(product) {
        const isOffer = product.originalPrice && product.originalPrice > product.price;
        const badgeHTML = product.badges.map(badge => {
            const badgeClass = badge === 'offer' ? 'offer' : badge;
            const badgeText = badge === 'offer' ? `Aktion ${CONFIG.UTILS.formatPrice(product.price)}` : badge;
            return `<div class="product-badge ${badgeClass}">${badgeText}</div>`;
        }).join('');
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${badgeHTML}
                <div class="product-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-description">
                        <small>${product.description}</small>
                    </div>
                    <div class="product-price">
                        ${isOffer ? 
                            `<span class="price offer">Aktion ${CONFIG.UTILS.formatPrice(product.price)}</span>` :
                            `<span class="price">${CONFIG.UTILS.formatPrice(product.price)}</span>`
                        }
                    </div>
                    <button class="btn-add btn-primary" onclick="ProductManager.addToCart('${product.id}')">
                        <i class="fas fa-plus"></i> Hinzufügen
                    </button>
                </div>
            </div>
        `;
    }
    
    // Produktlisten-Item HTML generieren (Listen-Layout)
    renderProductListItem(product) {
        const cartItem = ShoppingCart.getItems().find(item => item.product.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        return `
            <div class="product-list-item" data-product-id="${product.id}">
                <div class="product-list-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="product-list-info">
                    <h4 class="product-list-title">${product.name}</h4>
                    <p class="product-list-price">${CONFIG.UTILS.formatPrice(product.price)}</p>
                </div>
                <div class="product-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="ProductManager.decreaseQuantity('${product.id}')" 
                                ${currentQuantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${currentQuantity}</span>
                        <button class="quantity-btn" onclick="ProductManager.increaseQuantity('${product.id}')"
                                ${currentQuantity >= CONFIG.CART.MAX_QUANTITY_PER_ITEM ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn-add btn-primary" onclick="ProductManager.addToCart('${product.id}')">
                        Hinzufügen
                    </button>
                </div>
            </div>
        `;
    }
    
    // Warenkorb-Item HTML generieren
    renderCartItem(cartItem) {
        const product = cartItem.product;
        const subtotal = product.price * cartItem.quantity;
        
        return `
            <div class="cart-item" data-item-id="${cartItem.id}">
                <div class="cart-item-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    <p class="cart-item-price">${CONFIG.UTILS.formatPrice(product.price)} × ${cartItem.quantity}</p>
                    <p class="cart-item-subtotal"><strong>${CONFIG.UTILS.formatPrice(subtotal)}</strong></p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="ProductManager.updateCartItemQuantity('${cartItem.id}', ${cartItem.quantity - 1})"
                                ${cartItem.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${cartItem.quantity}</span>
                        <button class="quantity-btn" onclick="ProductManager.updateCartItemQuantity('${cartItem.id}', ${cartItem.quantity + 1})"
                                ${cartItem.quantity >= CONFIG.CART.MAX_QUANTITY_PER_ITEM ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn-remove btn-secondary" onclick="ProductManager.removeFromCart('${cartItem.id}')"
                            title="Entfernen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Leerer Zustand HTML
    renderEmptyState(type = 'products') {
        const emptyStates = {
            products: {
                icon: 'fas fa-box-open',
                title: 'Keine Produkte gefunden',
                message: 'Versuchen Sie eine andere Kategorie oder Suchbegriff.',
                action: ''
            },
            cart: {
                icon: 'fas fa-shopping-cart',
                title: 'Ihr Warenkorb ist leer',
                message: 'Fügen Sie Produkte hinzu, um eine Bestellung aufzugeben.',
                action: '<button class="btn-primary" onclick="UI.showPage(\'products\')">Produkte ansehen</button>'
            },
            search: {
                icon: 'fas fa-search',
                title: 'Keine Suchergebnisse',
                message: `Für "${this.searchQuery}" wurden keine Produkte gefunden.`,
                action: '<button class="btn-secondary" onclick="ProductManager.clearSearch()">Suche zurücksetzen</button>'
            }
        };
        
        const state = emptyStates[type] || emptyStates.products;
        
        return `
            <div class="empty-state">
                <i class="${state.icon}"></i>
                <h3>${state.title}</h3>
                <p>${state.message}</p>
                ${state.action}
            </div>
        `;
    }
    
    // Produkt zum Warenkorb hinzufügen
    static addToCart(productId, quantity = 1) {
        try {
            const product = window.ProductManager.getProduct(productId);
            
            if (!product) {
                throw new Error('Produkt nicht gefunden');
            }
            
            ShoppingCart.addItem(product, quantity);
            UI.showToast(CONFIG.MESSAGES.SUCCESS.ADDED_TO_CART, 'success');
            
            // UI aktualisieren
            window.ProductManager.updateProductControls(productId);
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to add product to cart:', error);
            UI.showToast(error.message, 'error');
        }
    }
    
    // Menge im Warenkorb erhöhen
    static increaseQuantity(productId) {
        ProductManager.addToCart(productId, 1);
    }
    
    // Menge im Warenkorb verringern
    static decreaseQuantity(productId) {
        try {
            const cartItem = ShoppingCart.getItems().find(item => item.product.id === productId);
            
            if (cartItem && cartItem.quantity > 1) {
                ShoppingCart.updateItemQuantity(cartItem.id, cartItem.quantity - 1);
                window.ProductManager.updateProductControls(productId);
            } else if (cartItem) {
                ShoppingCart.removeItem(cartItem.id);
                UI.showToast(CONFIG.MESSAGES.SUCCESS.REMOVED_FROM_CART, 'success');
                window.ProductManager.updateProductControls(productId);
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to decrease quantity:', error);
            UI.showToast(error.message, 'error');
        }
    }
    
    // Warenkorb-Item Menge aktualisieren
    static updateCartItemQuantity(itemId, newQuantity) {
        try {
            if (newQuantity <= 0) {
                ProductManager.removeFromCart(itemId);
            } else {
                ShoppingCart.updateItemQuantity(itemId, newQuantity);
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to update cart item quantity:', error);
            UI.showToast(error.message, 'error');
        }
    }
    
    // Produkt aus Warenkorb entfernen
    static removeFromCart(itemId) {
        try {
            const removedItem = ShoppingCart.removeItem(itemId);
            
            if (removedItem) {
                UI.showToast(CONFIG.MESSAGES.SUCCESS.REMOVED_FROM_CART, 'success');
                window.ProductManager.updateProductControls(removedItem.product.id);
                
                // Warenkorb-Seite aktualisieren
                if (UI.currentPage === 'cart') {
                    window.ProductManager.renderCartPage();
                }
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to remove from cart:', error);
            UI.showToast(error.message, 'error');
        }
    }
    
    // Produkt-Controls in der UI aktualisieren
    updateProductControls(productId) {
        const cartItem = ShoppingCart.getItems().find(item => item.product.id === productId);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        // Alle Elemente mit diesem Produkt aktualisieren
        document.querySelectorAll(`[data-product-id="${productId}"]`).forEach(element => {
            const quantitySpan = element.querySelector('.quantity');
            const decreaseBtn = element.querySelector('.quantity-btn:first-of-type');
            const increaseBtn = element.querySelector('.quantity-btn:last-of-type');
            
            if (quantitySpan) {
                quantitySpan.textContent = currentQuantity;
            }
            
            if (decreaseBtn) {
                decreaseBtn.disabled = currentQuantity <= 0;
            }
            
            if (increaseBtn) {
                increaseBtn.disabled = currentQuantity >= CONFIG.CART.MAX_QUANTITY_PER_ITEM;
            }
        });
    }
    
    // Suche zurücksetzen
    static clearSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        window.ProductManager.searchQuery = '';
        
        // Produktliste neu rendern
        if (UI.currentPage === 'products') {
            window.ProductManager.renderProductsPage();
        }
    }
    
    // Warenkorb-Seite rendern
    renderCartPage() {
        const cartItems = ShoppingCart.getItems();
        const cartData = ShoppingCart.getCartData();
        const cartContainer = document.getElementById('cart-items');
        const totalPriceElement = document.getElementById('total-price');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!cartContainer) return;
        
        if (cartItems.length === 0) {
            cartContainer.innerHTML = this.renderEmptyState('cart');
            if (totalPriceElement) totalPriceElement.textContent = '0,00€';
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            cartContainer.innerHTML = cartItems
                .map(item => this.renderCartItem(item))
                .join('');
            
            if (totalPriceElement) {
                totalPriceElement.textContent = cartData.formattedTotal;
            }
            if (checkoutBtn) checkoutBtn.disabled = false;
        }
    }
    
    // Produkte-Seite rendern
    async renderProductsPage(category = 'all') {
        try {
            const productsContainer = document.getElementById('products-list');
            if (!productsContainer) return;
            
            const productsData = await this.loadProducts(category);
            const products = this.searchQuery ? 
                this.searchProducts(this.searchQuery) : 
                productsData.products;
            
            if (products.length === 0) {
                const emptyType = this.searchQuery ? 'search' : 'products';
                productsContainer.innerHTML = this.renderEmptyState(emptyType);
            } else {
                productsContainer.innerHTML = products
                    .map(product => this.renderProductListItem(product))
                    .join('');
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to render products page:', error);
            const productsContainer = document.getElementById('products-list');
            if (productsContainer) {
                productsContainer.innerHTML = this.renderEmptyState('products');
            }
        }
    }
    
    // Featured-Produkte für Startseite rendern
    async renderFeaturedProducts() {
        try {
            const container = document.getElementById('featured-products');
            if (!container) return;
            
            const featuredProducts = await this.getFeaturedProducts();
            
            if (featuredProducts.length === 0) {
                container.innerHTML = this.renderEmptyState('products');
            } else {
                container.innerHTML = featuredProducts
                    .map(product => this.renderProductCard(product))
                    .join('');
            }
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to render featured products:', error);
        }
    }
}

// Singleton Pattern
const productManager = new ProductManager();

// Global verfügbar machen
window.ProductManager = productManager;

// Statische Methoden für HTML onclick-Handler
Object.assign(window.ProductManager, {
    addToCart: ProductManager.addToCart,
    increaseQuantity: ProductManager.increaseQuantity,
    decreaseQuantity: ProductManager.decreaseQuantity,
    updateCartItemQuantity: ProductManager.updateCartItemQuantity,
    removeFromCart: ProductManager.removeFromCart,
    clearSearch: ProductManager.clearSearch
});