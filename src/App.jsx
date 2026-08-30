import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import BundleBuilder from './pages/BundleBuilder';
import SearchResults from './pages/SearchResults';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Toast from './components/Toast';
import PromoPopup from './components/PromoPopup';
import AuthModal from './components/AuthModal';
import SocialProofToast from './components/SocialProofToast';
import { parsePrice } from './utils/currency';
import { pixelTracker } from './utils/pixelTracker';

function App() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // Load and initialize active marketing pixels (Meta, TikTok, GA4, Snapchat)
  useEffect(() => {
    fetch('/api/settings/pixels')
      .then(res => res.ok ? res.json() : null)
      .then(config => {
        if (config) {
          pixelTracker.init(config);
        }
      })
      .catch(err => console.error('[App] Failed to load pixel settings:', err));
  }, []);

  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShopFilter, setActiveShopFilter] = useState('');

  // Track page view on route changes
  useEffect(() => {
    pixelTracker.trackPageView(`Aura - ${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}`);
  }, [currentPage]);
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultView, setAuthModalDefaultView] = useState('login');
  const [authModalDefaultToken, setAuthModalDefaultToken] = useState('');
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Live Sync current user session & permissions with Turso Cloud
  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.user) {
              setCurrentUser(data.user);
              localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
          })
          .catch(console.error);
      }
    };

    syncUser();
    const interval = setInterval(syncUser, 3000);
    return () => clearInterval(interval);
  }, []);

  // Basic HTML5 History API Routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (path === '/reset-password') {
        const token = searchParams.get('token');
        if (token) {
          setAuthModalDefaultToken(token);
          setAuthModalDefaultView('reset');
          setIsAuthModalOpen(true);
        }
        setCurrentPage('home');
        window.history.replaceState({}, '', '/');
      } else if (path === '/shop') setCurrentPage('shop');
      else if (path === '/bundle') setCurrentPage('bundle');
      else if (path === '/search') setCurrentPage('search');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/admin') setCurrentPage('admin');
      else if (path === '/checkout') setCurrentPage('checkout');
      else if (path.startsWith('/product')) {
        setCurrentPage('product');
        const match = path.match(/\/product\/([^\/?#]+)/);
        const pId = match ? match[1] : null;
        if (pId) {
          fetch(`/api/products/${pId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && !data.error) setSelectedProduct(data);
            })
            .catch(console.error);
        }
      }
      else setCurrentPage('home');
    };
    
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initialize state from URL on first load
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCartItems([]);
    goToHome();
    showToast('Logged out successfully');
  };

  const goToHome = () => {
    setCurrentPage('home');
    setSelectedProduct(null);
    setSearchQuery('');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToShop = (filter = '') => {
    const validFilter = typeof filter === 'string' ? filter : '';
    setActiveShopFilter(validFilter);
    setCurrentPage('shop');
    setSelectedProduct(null);
    setSearchQuery('');
    window.history.pushState({}, '', '/shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToProduct = (product) => {
    if (!product || !product.id) return;
    setSelectedProduct(product);
    setCurrentPage('product');
    window.history.pushState({}, '', `/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToBundle = (initialProduct = null) => {
    if (initialProduct && initialProduct.id) {
      try {
        const saved = localStorage.getItem('aura_bundle_items');
        let items = saved ? JSON.parse(saved) : [];
        if (!items.some(i => i.id === initialProduct.id)) {
          items.push(initialProduct);
          localStorage.setItem('aura_bundle_items', JSON.stringify(items));
        }
      } catch (e) {}
      showToast(i18n.language === 'ar' ? `✨ تمت إضافة ${initialProduct.name} إلى صندوق المجموعة!` : (i18n.language === 'fr' ? `✨ ${initialProduct.name} ajouté à votre Coffret !` : `✨ Added ${initialProduct.name} to your Custom Bundle!`));
    }
    setCurrentPage('bundle');
    setSelectedProduct(null);
    setSearchQuery('');
    window.history.pushState({}, '', '/bundle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToSearch = (query) => {
    const validQuery = typeof query === 'string' ? query : '';
    setSearchQuery(validQuery);
    setCurrentPage('search');
    setSelectedProduct(null);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(validQuery)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToProfile = () => {
    setCurrentPage('profile');
    setSelectedProduct(null);
    setSearchQuery('');
    window.history.pushState({}, '', '/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToAdmin = () => {
    setCurrentPage('admin');
    setSelectedProduct(null);
    setSearchQuery('');
    window.history.pushState({}, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToCheckout = () => {
    if (cartItems.length > 0) {
      setCurrentPage('checkout');
      setIsCartOpen(false);
      window.history.pushState({}, '', '/checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast('Your cart is empty', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const addToCart = (product, customSize = null, giftOptions = null) => {
    try {
      const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;
      if (isOutOfStock) {
        showToast(`Sorry, "${product.name}" is currently out of stock.`);
        return;
      }

      const sizeToUse = customSize || product.selectedSize || 'Standard';
      const isGift = Boolean(giftOptions?.isGift || product.isGift);
      const giftMessage = giftOptions?.giftMessage || product.giftMessage || '';
      const cartKey = `${product.id}_${sizeToUse}_${giftMessage ? 'gift' : 'std'}`;

      let newCart;
      const existing = cartItems.find(item => (item.cartKey || `${item.id}_${item.selectedSize || 'Standard'}`) === cartKey);
      if (existing) {
        if (product.stock !== undefined && product.stock !== null && existing.quantity >= product.stock) {
          showToast(`Maximum available stock reached (${product.stock} units for ${product.name}).`);
          return;
        }
        newCart = cartItems.map(item => (item.cartKey || `${item.id}_${item.selectedSize || 'Standard'}`) === cartKey ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        const priceStr = product.priceStr || product.price || "0.00";
        newCart = [...cartItems, { 
          ...product, 
          cartKey, 
          selectedSize: sizeToUse, 
          priceStr, 
          quantity: 1,
          isGift,
          giftMessage
        }];
      }
      
      setCartItems(newCart);
      setIsCartOpen(true);
      
      // Multi-Pixel Event: Add to Cart
      pixelTracker.trackAddToCart(product, sizeToUse, 1);

      showToast(i18n.language === 'ar' ? `✨ تمت إضافة ${product.name} (${sizeToUse}) إلى السلة!` : (i18n.language === 'fr' ? `✨ ${product.name} (Taille : ${sizeToUse}) ajouté au panier !` : `✨ Added ${product.name} (Size: ${sizeToUse}) to cart!`));
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const addMultipleToCart = (products) => {
    try {
      let newCart = [...cartItems];
      let skippedCount = 0;

      products.forEach(product => {
        const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;
        if (isOutOfStock) {
          skippedCount++;
          return;
        }

        const sizeToUse = product.selectedSize || 'Standard';
        const cartKey = `${product.id}_${sizeToUse}`;

        const existing = newCart.find(item => (item.cartKey || `${item.id}_${item.selectedSize || 'Standard'}`) === cartKey);
        if (existing) {
          if (product.stock !== undefined && product.stock !== null && existing.quantity >= product.stock) {
            skippedCount++;
            return;
          }
          newCart = newCart.map(item => (item.cartKey || `${item.id}_${item.selectedSize || 'Standard'}`) === cartKey ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
          const priceStr = product.priceStr || product.price || "0.00";
          newCart.push({ ...product, cartKey, selectedSize: sizeToUse, priceStr, quantity: 1 });
        }
      });

      setCartItems(newCart);
      setIsCartOpen(true);
      if (skippedCount > 0) {
        showToast(`${products.length - skippedCount} piece(s) added (${skippedCount} unavailable due to stock).`);
      } else {
        showToast(`${products.length} jewelry piece(s) added to your cart!`);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const removeFromCart = (idOrKey) => {
    setCartItems(prev => prev.filter(item => (item.cartKey || item.id) !== idOrKey && item.id !== idOrKey));
  };

  const updateQuantity = (idOrKey, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(idOrKey);
      return;
    }
    const item = cartItems.find(i => (i.cartKey || i.id) === idOrKey || i.id === idOrKey);
    if (item && item.stock !== undefined && item.stock !== null && newQuantity > item.stock) {
      showToast(`Only ${item.stock} unit(s) available in stock.`);
      return;
    }
    setCartItems(prev => prev.map(item => ((item.cartKey || item.id) === idOrKey || item.id === idOrKey) ? { ...item, quantity: newQuantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
    setIsCartOpen(false);
  };

  const handlePlaceOrder = async (shippingDetails) => {
    if (cartItems.length === 0) return;
    
    try {
      const token = currentUser ? localStorage.getItem('authToken') : null;

      // Consolidate gift messages from cart items if not explicitly provided in shipping form
      const itemGiftMessages = cartItems
        .filter(item => item.giftMessage && item.giftMessage.trim())
        .map(item => `${item.name}: "${item.giftMessage.trim()}"`)
        .join('\n');

      const customGiftNote = (shippingDetails.note || shippingDetails.giftMessage || itemGiftMessages || '').trim();
      const isGiftOrder = Boolean(shippingDetails.isGift || cartItems.some(i => i.isGift) || customGiftNote);

      const enrichedShippingDetails = {
        ...shippingDetails,
        note: customGiftNote,
        giftMessage: customGiftNote,
        isGift: isGiftOrder
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: currentUser?.id || null,
          total: cartTotal,
          subtotal: cartSubtotal,
          discountPercent: discountPercent,
          discountAmount: discountAmount,
          shippingCost: shippingCost,
          shippingDetails: enrichedShippingDetails,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            image: item.image,
            size: item.selectedSize || 'Standard',
            quantity: item.quantity,
            price: parsePrice(item.priceStr || item.price),
            isGift: item.isGift || false,
            giftMessage: item.giftMessage || ''
          }))
        })
      });
      
      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        const orderId = resData.orderId || Date.now();
        
        // Multi-Pixel Event: Purchase
        pixelTracker.trackPurchase(orderId, cartTotal, cartItems);

        clearCart();
        goToHome();
        showToast('Order placed successfully! Thank you for shopping with Aura.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Failed to save order:', err);
      showToast('A network error occurred while placing your order.');
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        showToast('Profile updated successfully!');
        return true;
      } else {
        showToast('Failed to update profile.');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('An error occurred while updating your profile.');
      return false;
    }
  };

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  let discountPercent = 0;
  if (totalQuantity >= 5) discountPercent = 20;
  else if (totalQuantity === 4) discountPercent = 15;
  else if (totalQuantity === 3) discountPercent = 10;

  const cartSubtotal = cartItems.reduce((acc, item) => {
    const priceNum = parsePrice(item.priceStr || item.price);
    return acc + (priceNum * item.quantity);
  }, 0);

  const discountAmount = cartSubtotal * (discountPercent / 100);
  const shippingCost = totalQuantity === 1 ? 7.00 : 0;
  const cartTotal = cartSubtotal - discountAmount + shippingCost;

  return (
    <div className="app">
      <Navbar 
        cartItemCount={totalQuantity} 
        onCartClick={() => setIsCartOpen(true)}
        showToast={showToast}
        currentPage={currentPage}
        goToHome={goToHome}
        goToShop={goToShop}
        goToBundle={goToBundle}
        onProductClick={goToProduct}
        onSearch={goToSearch}
        currentUser={currentUser}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        goToProfile={goToProfile}
        goToAdmin={goToAdmin}
      />
      
      {currentPage === 'home' && (
        <Home onProductClick={goToProduct} addToCart={addToCart} showToast={showToast} goToBundle={goToBundle} goToShop={goToShop} />
      )}
      
      {currentPage === 'shop' && (
        <Shop onProductClick={goToProduct} addToCart={addToCart} activeFilter={activeShopFilter} goToBundle={goToBundle} />
      )}
      
      {currentPage === 'product' && (
        <ProductDetail 
          product={selectedProduct} 
          onBack={goToHome} 
          addToCart={addToCart} 
          showToast={showToast} 
          goToBundle={goToBundle}
          onProductClick={goToProduct}
          goToShop={goToShop}
        />
      )}

      {currentPage === 'bundle' && (
        <BundleBuilder onAddMultipleToCart={addMultipleToCart} showToast={showToast} />
      )}

      {currentPage === 'search' && (
        <SearchResults 
          query={searchQuery} 
          onProductClick={goToProduct} 
          addToCart={addToCart} 
          showToast={showToast} 
        />
      )}

      {currentPage === 'profile' && (
        <Profile 
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
          showToast={showToast}
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboard currentUser={currentUser} />
      )}

      {currentPage === 'checkout' && (
        <Checkout 
          cartItems={cartItems} 
          cartTotal={cartTotal} 
          cartSubtotal={cartSubtotal}
          discountPercent={discountPercent}
          discountAmount={discountAmount}
          shippingCost={shippingCost}
          onBack={() => {
            setIsCartOpen(true);
            setCurrentPage('home');
          }}
          onPlaceOrder={handlePlaceOrder}
          currentUser={currentUser}
        />
      )}
      
      {currentPage !== 'checkout' && <Footer showToast={showToast} />}

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        totalQuantity={totalQuantity}
        subtotal={cartSubtotal}
        discountPercent={discountPercent}
        discountAmount={discountAmount}
        shippingCost={shippingCost}
        total={cartTotal}
        onCheckout={goToCheckout}
        showToast={showToast}
      />

      <SocialProofToast onProductClick={goToProduct} />

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />
      
      <PromoPopup 
        showToast={showToast} 
        onAuthClick={() => setIsAuthModalOpen(true)}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        showToast={showToast}
        defaultView={authModalDefaultView}
        defaultToken={authModalDefaultToken}
      />
    </div>
  );
}

export default App;
