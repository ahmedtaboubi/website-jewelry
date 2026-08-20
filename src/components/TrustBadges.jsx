import { Gem, Package, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './TrustBadges.css';

const TrustBadges = () => {
  const { t } = useTranslation();
  return (
    <section className="dossier-trust-badges">
      <div className="container">
        <div className="trust-badges-grid">
          
          <div className="trust-badge-card">
            <div className="tb-content">
              <h3>{t('trust_badges.premium_materials')}</h3>
              <p>{t('trust_badges.materials_desc')}</p>
            </div>
            <Gem className="tb-icon" size={24} strokeWidth={1.5} />
          </div>

          <div className="trust-badge-card">
            <div className="tb-content">
              <h3>{t('trust_badges.free_returns')}</h3>
              <p>{t('trust_badges.returns_desc')}</p>
            </div>
            <Package className="tb-icon" size={24} strokeWidth={1.5} />
          </div>

          <div className="trust-badge-card">
            <div className="tb-content">
              <h3>{t('trust_badges.waterproof_durable')}</h3>
              <p>{t('trust_badges.waterproof_desc')}</p>
            </div>
            <Sparkles className="tb-icon" size={24} strokeWidth={1.5} />
          </div>

          <div className="trust-badge-card">
            <div className="tb-content">
              <h3>{t('trust_badges.reviews')}</h3>
              <p>{t('trust_badges.reviews_desc')}</p>
            </div>
            <Star className="tb-icon" size={24} strokeWidth={1.5} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
