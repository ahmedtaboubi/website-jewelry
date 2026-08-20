import { useTranslation } from 'react-i18next';
import './CategoryCards.css';

const CategoryCards = ({ goToShop }) => {
  const { t } = useTranslation();
  return (
    <section className="category-cards-section">
      <div className="container">
        <div className="category-cards-grid">
          
          <div 
            className="category-card" 
            style={{ 
              backgroundImage: 'url(/images/product_ring_1783185882264.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={() => goToShop && goToShop('rings')}
          >
            <div className="category-overlay" style={{ background: 'rgba(0,0,0,0.3)' }}></div>
            <h2>{t('category.rings')}</h2>
          </div>

          <div 
            className="category-card" 
            style={{ 
              backgroundImage: 'url(/images/hero_image_1783185873141.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={() => goToShop && goToShop('necklaces')}
          >
            <div className="category-overlay" style={{ background: 'rgba(0,0,0,0.3)' }}></div>
            <h2>{t('category.necklaces')}</h2>
          </div>

          <div 
            className="category-card" 
            style={{ 
              backgroundImage: 'url(/images/story_craft_1783185889975.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={() => goToShop && goToShop('bracelets')}
          >
            <div className="category-overlay" style={{ background: 'rgba(0,0,0,0.3)' }}></div>
            <h2>{t('category.bracelets')}</h2>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CategoryCards;
