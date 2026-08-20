import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import './ProductGrid.css';

const ProductGrid = ({ onProductClick, addToCart, showToast, goToShop }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          // To mimic the original design, we'll assume the first 4 are the "main" ones
          // and the rest are "extra".
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  const displayedProducts = showAll ? products : products.slice(0, 3);

  return (
    <section className="section product-grid-section">
      <div className="container" style={{ maxWidth: '1600px' }}>
        <h2 className="section-title text-center animate-fade-up">{t('product_grid.title')}</h2>
        <p className="section-subtitle text-center animate-fade-up delay-100">
          {t('product_grid.subtitle')}
        </p>
        
        {isLoading ? (
          <div className="text-center" style={{ padding: '3rem' }}>{t('product_grid.loading')}</div>
        ) : (
          <>
            <div className="product-grid">
              {displayedProducts.map((product, index) => (
                <div key={product.id} className={`animate-fade-up delay-${(index % 3) * 100 + 100}`}>
                  <ProductCard 
                    {...product} 
                    onClick={() => onProductClick(product)} 
                    addToCart={addToCart} 
                  />
                </div>
              ))}
            </div>
            
            {products.length > 3 && (
              <div className="text-center animate-fade-up delay-300" style={{ marginTop: '3rem' }}>
                <button className="btn-secondary" onClick={() => goToShop && goToShop()}>
                  {t('product_grid.view_all')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
