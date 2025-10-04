// AutoMart Webshop - Warenkorb Verwaltung

class ShoppingCart {
    constructor() {
        this.items = [];
        this.listeners = [];
        this.loadFromStorage();
        
        // Event Listener für Storage Changes (Multi-Tab Support)
        window.addEventListener('storage', (e) => {
            if (e.key === CONFIG.APP.STORAGE_PREFIX + CONFIG.CART.STORAGE_KEY) {
                this.loadFromStorage();
                this.notifyListeners();
            }
        });
    }
    
    // Event Listener hinzufügen
    addEventListener(callback) {
        this.listeners.push(callback);
    }
    
    // Event Listener entfernen
    removeEventListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    // Alle Listener benachrichtigen
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getCartData());
            } catch (error) {
                CONFIG.UTILS.error('Cart listener error:', error);
            }
        });
    }
    
    // Warenkorb aus LocalStorage laden
    loadFromStorage() {
        try {
            const stored = CONFIG.UTILS.storage.get(CONFIG.CART.STORAGE_KEY);
            this.items = Array.isArray(stored) ? stored : [];
            CONFIG.UTILS.log('Cart loaded from storage:', this.items);
        } catch (error) {
            CONFIG.UTILS.error('Failed to load cart from storage:', error);
            this.items = [];
        }
    }
    
    // Warenkorb im LocalStorage speichern
    saveToStorage() {
        try {
            CONFIG.UTILS.storage.set(CONFIG.CART.STORAGE_KEY, this.items);
            CONFIG.UTILS.log('Cart saved to storage:', this.items);
        } catch (error) {
            CONFIG.UTILS.error('Failed to save cart to storage:', error);
        }
    }
    
    // Produkt zum Warenkorb hinzufügen
    addItem(product, quantity = 1) {
        try {
            // Validierung
            if (!product || !product.id) {
                throw new Error('Ungültiges Produkt');
            }
            
            if (quantity <= 0 || quantity > CONFIG.CART.MAX_QUANTITY_PER_ITEM) {
                throw new Error(`Menge muss zwischen 1 und ${CONFIG.CART.MAX_QUANTITY_PER_ITEM} liegen`);
            }
            
            // Prüfen ob Gesamtanzahl Items im Warenkorb das Limit überschreitet
            const totalItems = this.getTotalItemCount();
            if (totalItems >= CONFIG.CART.MAX_ITEMS) {
                throw new Error(`Maximal ${CONFIG.CART.MAX_ITEMS} Artikel im Warenkorb erlaubt`);
            }
            
            // Existierendes Item finden
            const existingItemIndex = this.items.findIndex(item => item.product.id === product.id);
            
            if (existingItemIndex > -1) {
                // Menge zum existierenden Item hinzufügen
                const newQuantity = this.items[existingItemIndex].quantity + quantity;
                
                if (newQuantity > CONFIG.CART.MAX_QUANTITY_PER_ITEM) {
                    throw new Error(`Maximal ${CONFIG.CART.MAX_QUANTITY_PER_ITEM} Stück pro Artikel`);
                }
                
                this.items[existingItemIndex].quantity = newQuantity;
                this.items[existingItemIndex].addedAt = Date.now();
            } else {
                // Neues Item hinzufügen
                const cartItem = {
                    id: this.generateItemId(),
                    product: { ...product },
                    quantity: quantity,
                    addedAt: Date.now()
                };
                
                this.items.push(cartItem);
            }
            
            this.saveToStorage();
            this.notifyListeners();
            
            CONFIG.UTILS.log(`Added ${quantity}x ${product.name} to cart`);
            
            return true;
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to add item to cart:', error);
            throw error;
        }
    }
    
    // Menge eines Items aktualisieren
    updateItemQuantity(itemId, quantity) {
        try {
            if (quantity < 0 || quantity > CONFIG.CART.MAX_QUANTITY_PER_ITEM) {
                throw new Error(`Menge muss zwischen 0 und ${CONFIG.CART.MAX_QUANTITY_PER_ITEM} liegen`);
            }
            
            const itemIndex = this.items.findIndex(item => item.id === itemId);
            
            if (itemIndex === -1) {
                throw new Error('Artikel nicht im Warenkorb gefunden');
            }
            
            if (quantity === 0) {
                // Item entfernen
                this.removeItem(itemId);
            } else {
                // Menge aktualisieren
                this.items[itemIndex].quantity = quantity;
                this.items[itemIndex].updatedAt = Date.now();
                
                this.saveToStorage();
                this.notifyListeners();
                
                CONFIG.UTILS.log(`Updated item ${itemId} quantity to ${quantity}`);
            }
            
            return true;
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to update item quantity:', error);
            throw error;
        }
    }
    
    // Item aus Warenkorb entfernen
    removeItem(itemId) {
        try {
            const itemIndex = this.items.findIndex(item => item.id === itemId);
            
            if (itemIndex === -1) {
                throw new Error('Artikel nicht im Warenkorb gefunden');
            }
            
            const removedItem = this.items.splice(itemIndex, 1)[0];
            
            this.saveToStorage();
            this.notifyListeners();
            
            CONFIG.UTILS.log(`Removed item ${itemId} from cart:`, removedItem);
            
            return removedItem;
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to remove item from cart:', error);
            throw error;
        }
    }
    
    // Warenkorb leeren
    clear() {
        try {
            this.items = [];
            this.saveToStorage();
            this.notifyListeners();
            
            CONFIG.UTILS.log('Cart cleared');
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to clear cart:', error);
            throw error;
        }
    }
    
    // Alle Items abrufen
    getItems() {
        return [...this.items];
    }
    
    // Gesamtanzahl der Items (nicht Menge)
    getItemCount() {
        return this.items.length;
    }
    
    // Gesamtmenge aller Items
    getTotalItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    // Gesamtpreis berechnen
    getTotalPrice() {
        return this.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }
    
    // Ursprünglicher Gesamtpreis (vor Rabatten)
    getOriginalTotalPrice() {
        return this.items.reduce((total, item) => {
            const price = item.product.originalPrice || item.product.price;
            return total + (price * item.quantity);
        }, 0);
    }
    
    // Gesamtersparnis berechnen
    getTotalSavings() {
        return this.getOriginalTotalPrice() - this.getTotalPrice();
    }
    
    // Prüfen ob Warenkorb leer ist
    isEmpty() {
        return this.items.length === 0;
    }
    
    // Warenkorb-Daten für UI abrufen
    getCartData() {
        return {
            items: this.getItems(),
            itemCount: this.getItemCount(),
            totalItems: this.getTotalItemCount(),
            totalPrice: this.getTotalPrice(),
            originalTotalPrice: this.getOriginalTotalPrice(),
            totalSavings: this.getTotalSavings(),
            isEmpty: this.isEmpty(),
            formattedTotal: CONFIG.UTILS.formatPrice(this.getTotalPrice()),
            formattedSavings: CONFIG.UTILS.formatPrice(this.getTotalSavings())
        };
    }
    
    // Checkout-Daten generieren
    generateCheckoutData(location, timeSlot, paymentMethod) {
        try {
            if (this.isEmpty()) {
                throw new Error(CONFIG.MESSAGES.ERRORS.CART_EMPTY);
            }
            
            if (!location) {
                throw new Error(CONFIG.MESSAGES.ERRORS.LOCATION_REQUIRED);
            }
            
            const locationData = CONFIG.LOCATIONS[location];
            if (!locationData) {
                throw new Error('Ungültiger Standort ausgewählt');
            }
            
            // Bestimmung des Hauptprodukts für Arduino-Kompatibilität
            const productTypes = this.items.map(item => item.product.compartment);
            const mainProduct = this.getMostFrequentCompartment(productTypes);
            
            const checkoutData = {
                orderId: this.generateOrderId(),
                lockerId: locationData.lockers[0], // Ersten verfügbaren Locker auswählen
                location: location,
                locationName: locationData.name,
                customer: CONFIG.USER.DEFAULT_NAME,
                timeSlot: timeSlot || CONFIG.TIME_SLOTS[0],
                paymentMethod: paymentMethod || CONFIG.PAYMENT_METHODS[0].id,
                items: this.items.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    compartment: item.product.compartment
                })),
                total: this.getTotalPrice(),
                product: mainProduct, // Für Arduino-Kompatibilität
                compartment: mainProduct,
                quantity: this.getTotalItemCount(),
                timestamp: Date.now()
            };
            
            CONFIG.UTILS.log('Generated checkout data:', checkoutData);
            
            return checkoutData;
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to generate checkout data:', error);
            throw error;
        }
    }
    
    // Häufigsten Compartment-Type ermitteln
    getMostFrequentCompartment(compartments) {
        const frequency = {};
        let maxCount = 0;
        let mostFrequent = 'mixed';
        
        compartments.forEach(compartment => {
            frequency[compartment] = (frequency[compartment] || 0) + 1;
            if (frequency[compartment] > maxCount) {
                maxCount = frequency[compartment];
                mostFrequent = compartment;
            }
        });
        
        return mostFrequent;
    }
    
    // Eindeutige Item-ID generieren
    generateItemId() {
        return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Eindeutige Bestell-ID generieren
    generateOrderId() {
        return `ORD-${Date.now()}`;
    }
    
    // Warenkorb validieren
    validate() {
        const errors = [];
        
        if (this.isEmpty()) {
            errors.push(CONFIG.MESSAGES.ERRORS.CART_EMPTY);
        }
        
        this.items.forEach((item, index) => {
            if (!item.product || !item.product.id) {
                errors.push(`Artikel ${index + 1}: Ungültige Produktdaten`);
            }
            
            if (item.quantity <= 0 || item.quantity > CONFIG.CART.MAX_QUANTITY_PER_ITEM) {
                errors.push(`Artikel ${index + 1}: Ungültige Menge`);
            }
        });
        
        if (this.getTotalItemCount() > CONFIG.CART.MAX_ITEMS) {
            errors.push(`Zu viele Artikel im Warenkorb (Max: ${CONFIG.CART.MAX_ITEMS})`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Singleton Pattern für Warenkorb
const cart = new ShoppingCart();

// Export für Module
window.ShoppingCart = cart;