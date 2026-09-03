import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { formatCurrency, parsePrice } from '../utils/currency';
import { pixelTracker } from '../utils/pixelTracker';
import './BundleBuilder.css';

const BundleBuilder = ({ onAddMultipleToCart, showToast }) => {
  const { t, i18n } = useTranslation();
  const [bundleSize, setBundleSize] = useState(() => {
    const saved = localStorage.getItem('aura_bundle_size');
    return saved ? JSON.parse(saved) : 2;
  });
  const [selectedItems, setSelectedItems] = useState(() => {
    const saved = localStorage.getItem('aura_bundle_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    localStorage.setItem('aura_bundle_size', JSON.stringify(bundleSize));
  }, [bundleSize]);

  useEffect(() => {
    localStorage.setItem('aura_bundle_items', JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSizeChange = (size) => {
    setBundleSize(size);
    if (selectedItems.length > (size === 5 ? 9 : size)) {
      setSelectedItems(selectedItems.slice(0, size === 5 ? 9 : size));
    }
  };

  const handleAddItem = (product) => {
    if (selectedItems.length >= 9) {
      showToast(t('bundle_builder.max_warning'));
      return;
    }

    // Out of Stock Guard
    if (product.stock !== null && product.stock !== undefined && product.stock <= 0) {
      showToast(`"${product.name}" ${t('product_card.out_of_stock') || 'is out of stock'}`, 'error');
      return;
    }

    // Remaining Quantity Guard
    const currentQtyInBundle = selectedItems.filter(item => item.id === product.id).length;
    if (product.stock !== null && product.stock !== undefined && currentQtyInBundle >= product.stock) {
      showToast(`Only ${product.stock} unit(s) of "${product.name}" remaining in stock.`, 'error');
      return;
    }
    
    const newLength = selectedItems.length + 1;
    if (newLength > bundleSize && bundleSize < 5) {
      setBundleSize(newLength);
    }
    
    setSelectedItems([...selectedItems, product]);

    // Track bundle item selection in Meta/TikTok/GA pixels
    try {
      pixelTracker.trackBundleItemSelect(product);
    } catch (e) {
      console.error('[BundleBuilder] Failed to track item selection:', e);
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleAddBundleToCart = () => {
    if (selectedItems.length < 1) {
      showToast(t('bundle_builder.min_warning'));
      return;
    }

    // Track adding the full bundle to cart in Meta/TikTok/GA pixels
    try {
      const bundleTotal = selectedItems.reduce((sum, item) => sum + (parseFloat(item.priceStr || item.price) || 0), 0);
      pixelTracker.trackBundleAddToCart(selectedItems, bundleTotal);
    } catch (e) {
      console.error('[BundleBuilder] Failed to track bundle add to cart:', e);
    }

    onAddMultipleToCart(selectedItems);
    setSelectedItems([]);
    showToast(t('bundle_builder.added_toast', { count: selectedItems.length }));
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return allProducts;
    return allProducts.filter(p => p.category === activeCategory);
  }, [activeCategory, allProducts]);

  const qty = selectedItems.length;
  let progressMessage = null;
  
  if (qty === 0) {
    progressMessage = <span className="progress-normal">{t('bundle_builder.select_more_free', { count: 2 })}<strong className="text-accent">{t('bundle_builder.free_shipping')}</strong></span>;
  } else if (qty === 1) {
    progressMessage = <span className="progress-normal">{t('bundle_builder.select_more_free', { count: 1 })}<strong className="text-accent">{t('bundle_builder.free_shipping')}</strong></span>;
  } else if (qty === 2) {
    progressMessage = <span className="progress-unlocked">🚚 {t('bundle_builder.unlocked')}<strong className="text-accent">{t('bundle_builder.free_shipping')}!</strong> <span className="next-goal">{t('bundle_builder.add_1_for_10')}</span></span>;
  } else if (qty === 3) {
    progressMessage = <span className="progress-unlocked">🎉 {t('bundle_builder.unlocked')}<strong className="text-accent">{t('bundle_builder.off_10')}!</strong> <span className="next-goal">{t('bundle_builder.add_1_for_15')}</span></span>;
  } else if (qty === 4) {
    progressMessage = <span className="progress-unlocked">🔥 {t('bundle_builder.unlocked')}<strong className="text-accent">{t('bundle_builder.off_15')}!</strong> <span className="next-goal">{t('bundle_builder.add_1_for_20')}</span></span>;
  } else if (qty >= 5 && qty < 9) {
    progressMessage = <span className="progress-max">✨ {t('bundle_builder.unlocked')}<strong className="text-accent">{t('bundle_builder.off_20')}!</strong> <span className="next-goal">{t('bundle_builder.add_up_to', { count: 9 - qty })}</span></span>;
  } else if (qty === 9) {
    progressMessage = <span className="progress-full">{t('bundle_builder.max_bundle')}<strong className="text-accent">{t('bundle_builder.off_20')}</strong></span>;
  }
  
  let compactProgress = null;
  if (qty === 0) {
    compactProgress = t('bundle_builder.compact_add_2_free');
  } else if (qty === 1) {
    compactProgress = t('bundle_builder.compact_add_1_free');
  } else if (qty === 2) {
    compactProgress = t('bundle_builder.compact_tier_2');
  } else if (qty === 3) {
    compactProgress = t('bundle_builder.compact_tier_3');
  } else if (qty === 4) {
    compactProgress = t('bundle_builder.compact_tier_4');
  } else if (qty >= 5) {
    compactProgress = t('bundle_builder.compact_tier_max');
  }
  
  const discount = qty >= 5 ? 20 : qty === 4 ? 15 : qty >= 3 ? 10 : 0;

  // Calculate totals
  const subtotal = selectedItems.reduce((acc, item) => {
    return acc + parsePrice(item.price);
  }, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  // Always show an extra slot if they reached the current bundle size (up to 9) to encourage more selection
  const totalSlots = Math.max(bundleSize, qty < 9 ? qty + 1 : 9);

  return (
    <div className="bundle-page animate-fade-in">
      
      {/* Hero & Size Options (Normal Flow / Not Sticky) */}
      <div className="bundle-hero">
        <div className="container text-center">
          <h1 className="section-title">{t('bundle_builder.compose')}</h1>
          <p className="bundle-hero-subtitle">Select 2 or more pieces to build your custom jewelry stack with exclusive savings.</p>

          <div className="bundle-size-options">
            <div className={`size-option ${bundleSize === 2 ? 'active' : ''}`} onClick={() => handleSizeChange(2)}>
              <h3>{t('bundle_builder.pieces_2')}</h3>
              <div className="size-discount" style={{color: '#4caf50'}}>{t('bundle_builder.free_shipping')}</div>
            </div>
            <div className={`size-option ${bundleSize === 3 ? 'active' : ''}`} onClick={() => handleSizeChange(3)}>
              <h3>{t('bundle_builder.pieces_3')}</h3>
              <div className="size-discount">{t('bundle_builder.off_10')}</div>
            </div>
            <div className={`size-option ${bundleSize === 4 ? 'active' : ''}`} onClick={() => handleSizeChange(4)}>
              <h3>{t('bundle_builder.pieces_4')}</h3>
              <div className="size-discount">{t('bundle_builder.off_15')}</div>
            </div>
            <div className={`size-option ${bundleSize === 5 ? 'active' : ''}`} onClick={() => handleSizeChange(5)}>
              <h3>{t('bundle_builder.pieces_5')}</h3>
              <div className="size-discount">{t('bundle_builder.off_20')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Selected Products Portion */}
      <div className={`bundle-sticky-bar ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container">
          <div className="bundle-bar-content">
            <div className="bundle-progress">
              <h3 key={qty} className="progress-title">{progressMessage}</h3>
              <p className="progress-count">{bundleSize === 5 ? t('bundle_builder.selected_max', { qty }) : t('bundle_builder.selected', { qty, bundleSize })}</p>
            </div>
            
            <div className="bundle-slots">
              {Array.from({ length: totalSlots }).map((_, i) => (
                <div key={i} className={`bundle-slot ${i < qty ? 'filled' : ''}`} onClick={() => i < qty && handleRemoveItem(i)}>
                  {i < qty ? (
                    <img src={selectedItems[i].image} alt={selectedItems[i].name || "Selected"} />
                  ) : (
                    <span>+</span>
                  )}
                  {i < qty && <div className="slot-remove">×</div>}
                </div>
              ))}
            </div>

            <div className="bundle-action">
              <div className="bundle-pricing">
                {discount > 0 && <span className="bundle-subtotal">{formatCurrency(subtotal, i18n.language)}</span>}
                {qty > 0 && <span className="compact-progress">{compactProgress}</span>}
                <span className="bundle-total">{formatCurrency(total, i18n.language)}</span>
              </div>
              <button 
                className={`bundle-simple-btn qty-${Math.min(qty, 5)}`}
                style={{ opacity: qty < 1 ? 0.6 : 1 }}
                onClick={handleAddBundleToCart}
              >
                {qty === 1 ? t('bundle_builder.add_1_piece') : t('bundle_builder.add_bundle')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        
        <div className="bundle-filters">
          {['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings'].map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {t(`bundle_builder.${cat.toLowerCase()}`)}
            </button>
          ))}
        </div>
        
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="bundle-product-wrapper">
              <ProductCard 
                {...product} 
                onClick={() => handleAddItem(product)} 
                addToCart={() => handleAddItem(product)} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BundleBuilder;
