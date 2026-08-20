import { useTranslation } from 'react-i18next';
import './Hero.css';

const Hero = ({ goToBundle, goToShop }) => {
  const { t } = useTranslation();
  return (
    <section className="hero animate-fade-in">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-text-block">
          <h1 className="hero-title animate-fade-up">{t('home.hero_title_1')}<br />{t('home.hero_title_2')}</h1>
          <p className="hero-subtitle animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {t('home.hero_subtitle')}
          </p>
          <div className="hero-actions animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={() => goToShop ? goToShop() : null} className="btn-primary hero-shop-btn">
              {t('home.hero_cta')}
            </button>
            {goToBundle && (
              <div className="hero-bundle-container">
                <div className="hero-floating-arrow-hint">
                  <span className="hero-arrow-tag">{t('home.bundle_offer_tag', '🔥 Offers -20%')}</span>
                  <svg className="hero-curved-arrow" width="70" height="55" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8C26 4 48 10 44 36M32 26L44 38L52 24" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <button onClick={goToBundle} className="btn-secondary hero-bundle-btn">
                  {t('home.hero_bundle')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
