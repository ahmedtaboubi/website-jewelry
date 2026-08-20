import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, SlidersHorizontal, Sparkles, Trophy, Flame } from 'lucide-react';
import { SteelIcon, XpAlloyIcon, ZirconiaIcon, LapisIcon } from '../components/MaterialIcons';
import ProductCard from '../components/ProductCard';
import PromoCard from '../components/PromoCard';
import FilterSidebar from '../components/FilterSidebar';
import './Shop.css';

const FilterDropdown = ({ title, options, selectedFilters, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="dropdown-container" style={{ position: 'relative' }} ref={dropdownRef}>
      <button className="btn-dropdown" onClick={() => setIsOpen(!isOpen)}>
        {title} <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div className="dropdown-popover animate-fade-in" style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          zIndex: 100,
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem'
        }}>
          {options.map(opt => {
            const label = typeof opt === 'string' ? opt : opt.label;
            const icon = typeof opt === 'string' ? null : opt.icon;
            return (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={selectedFilters.includes(label)}
                  onChange={() => onToggle(label)}
                  style={{ width: '16px', height: '16px', accentColor: '#000', cursor: 'pointer' }}
                />
                {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
                {label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const normalizeCategoryTerm = (term) => {
  if (!term) return '';
  const clean = term.toLowerCase().trim();
  if (['rings', 'ring', 'bague', 'bagues', 'خاتم', 'خواتم'].includes(clean)) return 'rings';
  if (['necklaces', 'necklace', 'collier', 'colliers', 'chaîne', 'chaines', 'chaine', 'pendentif', 'قلادة', 'قلائد', 'سلسلة'].includes(clean)) return 'necklaces';
  if (['bracelets', 'bracelet', 'gourmette', 'gourmettes', 'jonc', 'joncs', 'سوار', 'أساور'].includes(clean)) return 'bracelets';
  if (['earrings', 'earring', 'boucles', "boucles d'oreilles", 'boucle', 'creoles', 'créoles', 'حلق', 'أقراط'].includes(clean)) return 'earrings';
  return clean;
};

const Shop = ({ onProductClick, addToCart, activeFilter, goToBundle }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localCategory, setLocalCategory] = useState(typeof activeFilter === 'string' ? activeFilter : '');

  useEffect(() => {
    setLocalCategory(typeof activeFilter === 'string' ? activeFilter : '');
  }, [activeFilter]);

  const handleFilterToggle = (filterName) => {
    if (selectedFilters.includes(filterName)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filterName));
    } else {
      setSelectedFilters([...selectedFilters, filterName]);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    if (!product) return false;

    // 0. Search Query Filter (Multilingual keyword & category matching)
    if (typeof searchQuery === 'string' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const normQuery = normalizeCategoryTerm(query);
      const pName = (product.name || '').toLowerCase();
      const pNotes = (product.notes || '').toLowerCase();
      const pCat = (product.category || '').toLowerCase();
      const normPCat = normalizeCategoryTerm(pCat);

      const matchesSearch = pName.includes(query) || 
                            pNotes.includes(query) || 
                            pCat.includes(query) || 
                            normPCat === normQuery;
      if (!matchesSearch) {
        return false;
      }
    }

    let parsedDetails = {};
    try {
      parsedDetails = typeof product.details === 'string' ? JSON.parse(product.details) : (product.details || {});
    } catch(e) {}

    // 1. Navigation / Search Pill Filter logic (Multilingual)
    if (typeof localCategory === 'string' && localCategory.trim()) {
      const catLower = localCategory.toLowerCase().trim();
      const normCat = normalizeCategoryTerm(catLower);
      if (catLower === 'bestsellers' || catLower === 'meilleures ventes' || catLower === 'الأكثر مبيعا') {
        if (product.id % 2 !== 0) return false;
      } else if (catLower === 'new arrivals' || catLower === 'nouveautés' || catLower === 'وصل حديثا') {
        if (!product.isNew) return false;
      } else {
        const pCat = (product.category || '').toLowerCase();
        const normPCat = normalizeCategoryTerm(pCat);
        const pNotes = (product.notes || '').toLowerCase();
        const pName = (product.name || '').toLowerCase();
        const pGender = (parsedDetails.gender || '').toLowerCase();
        
        const matches = normPCat === normCat ||
                        pCat.includes(catLower) || 
                        pNotes.includes(catLower) || 
                        pName.includes(catLower) || 
                        pGender === catLower;
        if (!matches) return false;
      }
    }

    // 2. Sidebar Checkbox Filters
    if (selectedFilters.length === 0) return true;

    // Check Categories
    const categories = ["Rings", "Necklaces", "Bracelets", "Earrings"];
    const selectedCategories = selectedFilters.filter(f => categories.includes(f));
    if (selectedCategories.length > 0) {
      const pCat = product.category || "";
      if (!selectedCategories.includes(pCat)) {
        return false;
      }
    }

    // Check Materials
    const materials = ["Stainless Steel", "XP Alloy", "Zirconia", "Lapis Lazuli"];
    const selectedMaterials = selectedFilters.filter(f => materials.includes(f));
    if (selectedMaterials.length > 0) {
      const pNotes = (product.notes || '').toLowerCase();
      const matchesMaterial = selectedMaterials.some(mat => pNotes.includes(mat.toLowerCase()));
      if (!matchesMaterial) {
        return false;
      }
    }

    // Check Sizes / Intensity
    const sizes = ["Delicate", "Standard", "Statement"];
    const selectedSizes = selectedFilters.filter(f => sizes.includes(f));
    if (selectedSizes.length > 0) {
      const pSize = parsedDetails.size || "";
      if (pSize && !selectedSizes.includes(pSize)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="shop-page animate-fade-in" style={{ padding: '6rem 0', minHeight: '60vh' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        
        {/* Top Banners */}
        <div className="shop-banners">
          <div className="shop-banner" onClick={() => setLocalCategory('')}>
            <h3 style={{ textDecoration: !localCategory ? 'underline' : 'none' }}>{t('shop_page.all_jewelry')}</h3>
            {products[0] && <img src={products[0].image} alt="All Jewelry" className="banner-img" />}
          </div>
          <div className="shop-banner" onClick={() => setLocalCategory('bestsellers')}>
            <h3 style={{ textDecoration: localCategory === 'bestsellers' ? 'underline' : 'none' }}>{t('shop_page.bestsellers')}</h3>
            {products[1] && <img src={products[1].image} alt="Bestsellers" className="banner-img" />}
          </div>
          <div className="shop-banner" onClick={() => setLocalCategory('new arrivals')}>
            <h3 style={{ textDecoration: localCategory === 'new arrivals' ? 'underline' : 'none' }}>{t('shop_page.new_arrivals')}</h3>
            {products[2] && <img src={products[2].image} alt="New Arrivals" className="banner-img" />}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="shop-filter-bar">
          <button 
            className={`btn-filter ${isFilterSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
          >
            <SlidersHorizontal size={16} /> 
            {isFilterSidebarOpen ? t('shop_page.hide_filter') : t('shop_page.show_filter')}
          </button>
          
          <div className="shop-search">
            <input 
              type="text" 
              placeholder={t('shop_page.search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn-search-icon">
              <Search size={16} color="white" />
            </button>
          </div>

          <div className="shop-dropdowns">
            <FilterDropdown 
              title="Category" 
              options={['Rings', 'Necklaces', 'Bracelets', 'Earrings']} 
              selectedFilters={selectedFilters}
              onToggle={handleFilterToggle}
            />
            <FilterDropdown 
              title="Material" 
              options={[
                { label: 'Stainless Steel', icon: <SteelIcon size={16} /> },
                { label: 'XP Alloy', icon: <XpAlloyIcon size={16} /> },
                { label: 'Zirconia', icon: <ZirconiaIcon size={16} /> },
                { label: 'Lapis Lazuli', icon: <LapisIcon size={16} /> }
              ]} 
              selectedFilters={selectedFilters}
              onToggle={handleFilterToggle}
            />
          </div>
        </div>

        {/* Title Row */}
        <div className="shop-title-row">
          <p className="shop-explore-text">
            {t('shop_page.explore')} <strong className="text-accent">{t('shop_page.designer')}</strong>{t('shop_page.developed')}
          </p>
          <span className="shop-product-count">{filteredProducts.length} {t('shop_page.products')}</span>
        </div>

        <div className={`shop-main-layout ${isFilterSidebarOpen ? 'sidebar-open' : ''}`}>
          {/* Sidebar */}
          {isFilterSidebarOpen && (
            <div className="shop-sidebar-container animate-fade-in">
              <FilterSidebar 
                activeFilters={selectedFilters} 
                onFilterChange={setSelectedFilters}
              />
            </div>
          )}

          {/* Product Grid Area */}
          <div className="shop-content-area">
            {isLoading ? (
              <div className="text-center" style={{ padding: '4rem 0' }}>{t('shop_page.loading')}</div>
            ) : (
              <div className="shop-product-grid">
                {/* Promo Card is always the first item in the grid */}
                <div className="animate-fade-up shop-promo-wrapper">
                  <PromoCard onLearnMore={goToBundle} />
                </div>

                {/* Product Cards */}
                {filteredProducts.map((product, index) => (
                  <div key={product.id} className={`animate-fade-up delay-${((index + 1) % 4) * 100}`}>
                    <ProductCard 
                      {...product} 
                      onClick={() => onProductClick(product)} 
                      addToCart={addToCart} 
                    />
                  </div>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#666' }}>
                    {t('shop_page.no_jewelry')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
