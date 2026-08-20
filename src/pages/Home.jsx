import Hero from '../components/Hero';
import TrustBadges from '../components/TrustBadges';
import CategoryCards from '../components/CategoryCards';
import ProductGrid from '../components/ProductGrid';
import BrandStory from '../components/BrandStory';
import { useTranslation } from 'react-i18next';

const Home = ({ onProductClick, addToCart, showToast, goToBundle, goToShop }) => {
  const { t } = useTranslation();
  return (
    <div className="home-page">
      <Hero goToBundle={goToBundle} goToShop={goToShop} />
      <TrustBadges />
      <CategoryCards goToShop={goToShop} />
      <ProductGrid 
        onProductClick={onProductClick} 
        addToCart={addToCart} 
        showToast={showToast} 
        goToShop={goToShop}
      />
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <button onClick={goToBundle} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
          {t('home.bundle_promo')}
        </button>
      </div>
      <BrandStory goToShop={goToShop} />
    </div>
  );
};

export default Home;
