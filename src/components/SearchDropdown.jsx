import { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Gem, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './SearchDropdown.css';

const SearchDropdown = ({ isOpen, onClose, onSearch, onProductClick, goToShop }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [topProducts, setTopProducts] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Fetch top 3 products for the suggestions view
    const fetchTopProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setTopProducts(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch top products:', error);
      }
    };
    fetchTopProducts();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query);
      onClose();
    }
  };

  const handlePillClick = (term) => {
    onClose();
    if (goToShop) {
      goToShop(term);
    } else if (onSearch) {
      onSearch(term);
    }
  };

  const handleProductClick = (product) => {
    onProductClick(product);
    onClose();
  };

  if (!isOpen) return null;

  const collections = ['Women', 'Men', 'Unisex', 'Rings', 'Necklaces', 'Bracelets'];
  const materials = ['Stainless Steel', 'XP Alloy', 'Zirconia', 'Lapis Lazuli', 'Geometric', 'Minimalist'];

  return (
    <div className="search-overlay">
      <div className="search-container">
        
        {/* Search Bar */}
        <div className="search-header">
          <form className="search-input-wrapper" onSubmit={handleSubmit}>
            <span className="search-label">{t('shop.search') || 'Search'}</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              placeholder={t('search_modal.search_placeholder', { defaultValue: 'Search jewelry, materials, or collections...' })}
            />
            <button type="submit" className="search-submit-btn">
              <Search size={18} color="#fff" />
            </button>
          </form>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="search-body">
          <div className="search-suggestions">
            <div className="suggestions-left">
              
              <div className="suggestion-group">
                <h4 className="suggestion-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--color-accent)" /> 
                  <span>{t('search_modal.gender', { defaultValue: 'COLLECTION' })}</span>
                </h4>
                <div className="pill-container">
                  {collections.map(item => (
                    <button key={item} className="suggestion-pill" onClick={() => handlePillClick(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="suggestion-group">
                <h4 className="suggestion-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gem size={16} color="var(--color-accent)" /> 
                  <span>{t('search_modal.materials_styles', { defaultValue: 'MATERIALS & STYLES' })}</span>
                </h4>
                <div className="pill-container">
                  {materials.map(item => (
                    <button key={item} className="suggestion-pill" onClick={() => handlePillClick(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="suggestions-right">
              <div className="top-products-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-accent)" />
                  <span>{t('search_modal.most_loved', { defaultValue: 'Most Loved' })}</span>
                </h3>
                <p>{t('search_modal.top_3', { defaultValue: 'Our top 3 best-selling jewelry pieces' })}</p>
                
                <div className="top-products-list">
                  {topProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="search-result-item"
                      onClick={() => handleProductClick(product)}
                      style={{ padding: '0.5rem', marginBottom: '0.5rem' }}
                    >
                      <img src={product.image} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div className="result-info">
                        <h4 style={{ fontSize: '1rem', margin: 0 }}>{product.name}</h4>
                        <p className="result-notes" style={{ fontSize: '0.75rem' }}>{product.notes || product.category || 'Luxury Jewelry'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SearchDropdown;
