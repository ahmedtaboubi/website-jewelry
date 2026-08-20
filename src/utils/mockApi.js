import { INITIAL_PRODUCTS } from '../data/initialProducts';

const STORAGE_KEYS = {
  PRODUCTS: 'aura_store_products',
  USERS: 'aura_store_users',
  ORDERS: 'aura_store_orders',
  REVIEWS: 'aura_store_reviews',
};

// Initialize localStorage with initial data if empty
function getStoredProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

function getStoredUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  const defaultAdmin = [
    {
      id: 1,
      name: "Admin",
      email: "admin@aura.com",
      phone: "+212 600000000",
      password: "admin",
      is_admin: 1,
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultAdmin));
  return defaultAdmin;
}

function getStoredOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function getStoredReviews() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleMockApi(urlStr, options = {}) {
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch (e) {
      body = {};
    }
  }

  // 1. GET /api/products
  if (path === '/api/products' && method === 'GET') {
    return createJsonResponse(getStoredProducts());
  }

  // 2. GET /api/products/:id
  const productMatch = path.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && method === 'GET') {
    const id = parseInt(productMatch[1], 10);
    const product = getStoredProducts().find(p => p.id === id);
    if (product) return createJsonResponse(product);
    return createJsonResponse({ error: 'Product not found' }, 404);
  }

  // 3. GET /api/products/search?q=...
  if (path === '/api/products/search' && method === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const results = getStoredProducts().filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
    return createJsonResponse(results);
  }

  // 4. POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const users = getStoredUsers();
    let user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    
    // Auto-create or allow demo login if not existing
    if (!user) {
      const isAdmin = email?.toLowerCase().includes('admin');
      user = {
        id: Date.now(),
        name: email?.split('@')[0] || "User",
        email: email,
        phone: "+212 600000000",
        is_admin: isAdmin ? 1 : 0,
        created_at: new Date().toISOString()
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    
    return createJsonResponse({
      message: 'Login successful',
      token: 'demo-token-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        is_admin: user.is_admin || 0
      }
    });
  }

  // 5. POST /api/auth/register
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, phone, password } = body;
    const users = getStoredUsers();
    const newUser = {
      id: Date.now(),
      name: name || "User",
      email: email,
      phone: phone || '',
      password: password,
      is_admin: 0,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return createJsonResponse({
      message: 'Account created successfully',
      token: 'demo-token-' + Date.now(),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        is_admin: 0
      }
    });
  }

  // 6. POST /api/orders
  if (path === '/api/orders' && method === 'POST') {
    const orders = getStoredOrders();
    const newOrder = {
      id: orders.length + 1001,
      ...body,
      status: 'Processing',
      created_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return createJsonResponse({ message: 'Order placed successfully', orderId: newOrder.id });
  }

  // 7. GET /api/orders/:id or /api/orders/all
  if (path === '/api/orders/all' && method === 'GET') {
    return createJsonResponse(getStoredOrders());
  }
  const userOrderMatch = path.match(/^\/api\/orders\/(\d+)$/);
  if (userOrderMatch && method === 'GET') {
    const userId = parseInt(userOrderMatch[1], 10);
    const orders = getStoredOrders().filter(o => o.userId === userId || o.user_id === userId);
    return createJsonResponse(orders);
  }

  // 8. GET /api/ingredients
  if (path === '/api/ingredients') {
    return createJsonResponse([]);
  }

  // 9. Reviews
  const reviewsMatch = path.match(/^\/api\/products\/(\d+)\/reviews$/);
  if (reviewsMatch && method === 'GET') {
    const productId = parseInt(reviewsMatch[1], 10);
    const reviews = getStoredReviews().filter(r => r.productId === productId || r.product_id === productId);
    return createJsonResponse(reviews);
  }

  if (path === '/api/reviews' && method === 'POST') {
    const reviews = getStoredReviews();
    const newReview = {
      id: Date.now(),
      ...body,
      created_at: new Date().toISOString()
    };
    reviews.push(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return createJsonResponse({ message: 'Review added', review: newReview });
  }

  // Fallback for unhandled API endpoints
  return createJsonResponse({ message: 'Success' });
}

// Global fetch interceptor to catch offline / 404 / HTML responses on static hosting
export function initApiInterceptor() {
  const originalFetch = window.fetch;
  window.fetch = async function (resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource?.url || '';

    if (url.startsWith('/api/') || url.includes('/api/')) {
      try {
        const response = await originalFetch(resource, options);
        // If the backend responded with valid JSON, return it
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          return response;
        }
        // Otherwise (404, or returned HTML from SPA rewrite), use mock API
        return await handleMockApi(url, options);
      } catch (err) {
        // Network error (server down / not deployed) -> use mock API
        return await handleMockApi(url, options);
      }
    }

    return originalFetch(resource, options);
  };
}
