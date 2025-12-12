// AutoMart Webshop - API Service

class AutoMartAPI {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    
    // Generic HTTP Request Method
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const config = {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                },
                signal: controller.signal
            };
            
            CONFIG.UTILS.log('API Request:', url, config);
            
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            CONFIG.UTILS.log('API Response:', data);
            
            return {
                success: true,
                data,
                status: response.status
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                CONFIG.UTILS.error('Request timeout');
                throw new Error(CONFIG.MESSAGES.ERRORS.TIMEOUT);
            }
            
            CONFIG.UTILS.error('API Error:', error);
            
            if (!navigator.onLine) {
                throw new Error(CONFIG.MESSAGES.ERRORS.NETWORK);
            }
            
            throw new Error(error.message || CONFIG.MESSAGES.ERRORS.SERVER);
        }
    }
    
    // GET Request
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        
        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        
        return this.request(url.toString(), {
            method: 'GET'
        });
    }
    
    // POST Request
    async post(endpoint, data = {}) {
        return this.request(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // PUT Request
    async put(endpoint, data = {}) {
        return this.request(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // DELETE Request
    async delete(endpoint) {
        return this.request(`${this.baseURL}${endpoint}`, {
            method: 'DELETE'
        });
    }
    
    // Bestellung abschließen
    async completeOrder(orderData) {
        try {
            // Validate order data
            if (!orderData.orderId || !orderData.lockerId) {
                throw new Error('Unvollständige Bestelldaten');
            }
            
            const payload = {
                orderId: orderData.orderId,
                lockerId: orderData.lockerId,
                product: orderData.product || 'mixed', // Fallback für gemischte Bestellungen
                items: orderData.items || [],
                total: orderData.total || 0,
                customer: orderData.customer || CONFIG.USER.DEFAULT_NAME,
                location: orderData.location || CONFIG.USER.DEFAULT_LOCATION,
                timestamp: Date.now(),
                // Zusätzliche Felder für erweiterte Arduino-Steuerung
                compartment: orderData.compartment || 'mixed',
                quantity: orderData.quantity || 1
            };
            
            CONFIG.UTILS.log('Completing order:', payload);
            
            const response = await this.post('/order/complete', payload);
            
            if (response.success) {
                CONFIG.UTILS.log('Order completed successfully:', response.data);
                return response.data;
            }
            
            throw new Error('Bestellung konnte nicht verarbeitet werden');
            
        } catch (error) {
            CONFIG.UTILS.error('Order completion failed:', error);
            throw error;
        }
    }
    
    // Produkte laden (Mock-Implementierung für Demo)
    async getProducts(category = 'all', page = 1, limit = 20) {
        try {
            // In einer echten Anwendung würde hier eine API-Anfrage erfolgen
            // Für die Demo nutzen wir die konfigurierten Beispiel-Produkte
            
            await this.simulateDelay(500); // Simulate network delay
            
            let products = [...CONFIG.SAMPLE_PRODUCTS];
            
            // Filter by category
            if (category !== 'all') {
                products = products.filter(product => 
                    product.category.includes(category)
                );
            }
            
            // Simulate pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedProducts = products.slice(startIndex, endIndex);
            
            return {
                success: true,
                data: {
                    products: paginatedProducts,
                    total: products.length,
                    page: page,
                    limit: limit,
                    hasMore: endIndex < products.length
                }
            };
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load products:', error);
            throw new Error(CONFIG.MESSAGES.ERRORS.SERVER);
        }
    }
    
    // Bestellungen laden (Mock-Implementierung)
    async getOrders(page = 1, limit = 10) {
        try {
            await this.simulateDelay(300);
            
            // Mock orders data
            const mockOrders = [
                {
                    id: 'ORD-1759569337425',
                    location: 'Fellbach',
                    date: '10/08/2025',
                    items: 7,
                    total: 59.72,
                    status: 'completed'
                },
                {
                    id: 'ORD-1759569337426',
                    location: 'Stuttgart',
                    date: '07/08/2025',
                    items: 6,
                    total: 34.72,
                    status: 'completed'
                },
                {
                    id: 'ORD-1759569337427',
                    location: 'Esslingen',
                    date: '05/08/2025',
                    items: 2,
                    total: 4.25,
                    status: 'active' // Aktuelle Bestellung
                }
            ];
            
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedOrders = mockOrders.slice(startIndex, endIndex);
            
            return {
                success: true,
                data: {
                    orders: paginatedOrders,
                    total: mockOrders.length,
                    page: page,
                    limit: limit
                }
            };
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load orders:', error);
            throw new Error(CONFIG.MESSAGES.ERRORS.SERVER);
        }
    }
    
    // Einzelne Bestellung laden
    async getOrder(orderId) {
        try {
            await this.simulateDelay(200);
            
            // Mock order details
            const mockOrder = {
                id: orderId,
                location: 'Markt XY - Gotthilf-Bayh St X',
                customer: CONFIG.USER.DEFAULT_NAME,
                items: [
                    { ...CONFIG.SAMPLE_PRODUCTS[1], quantity: 1 },
                    { ...CONFIG.SAMPLE_PRODUCTS[3], quantity: 2 }
                ],
                total: 24.99,
                status: 'ready_for_pickup',
                pickupTime: '50 min 59 sec',
                timeSlot: '15:00 - 16:00 Uhr',
                lockerId: 'locker-001'
            };
            
            return {
                success: true,
                data: mockOrder
            };
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load order:', error);
            throw new Error(CONFIG.MESSAGES.ERRORS.SERVER);
        }
    }
    
    // Abholung öffnen
    async openPickup(orderId, lockerId) {
        try {
            const payload = {
                orderId: orderId,
                lockerId: lockerId,
                action: 'open',
                timestamp: Date.now()
            };
            
            CONFIG.UTILS.log('Opening pickup:', payload);
            
            // In einer echten Anwendung würde hier die Backend-API aufgerufen
            const response = await this.post('/pickup/open', payload);
            
            return response;
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to open pickup:', error);
            throw error;
        }
    }
    
    // Standorte laden
    async getLocations() {
        try {
            await this.simulateDelay(200);
            
            return {
                success: true,
                data: Object.values(CONFIG.LOCATIONS)
            };
            
        } catch (error) {
            CONFIG.UTILS.error('Failed to load locations:', error);
            throw new Error(CONFIG.MESSAGES.ERRORS.SERVER);
        }
    }
    
    // Hilfsmethode zum Simulieren von Netzwerk-Delays
    async simulateDelay(ms) {
        if (CONFIG.APP.DEBUG) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        return Promise.resolve();
    }
    
    // Health Check für Backend-Verbindung
    async healthCheck() {
        try {
            const response = await this.get('/health');
            return response.success;
        } catch (error) {
            CONFIG.UTILS.warn('Backend health check failed:', error);
            return false;
        }
    }
}

// Singleton Pattern für API Service
const apiService = new AutoMartAPI();

// Export für Module
window.AutoMartAPI = apiService;