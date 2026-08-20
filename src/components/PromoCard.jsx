import { useTranslation } from 'react-i18next';
import './PromoCard.css';

const PromoCard = ({ onLearnMore }) => {
  const { t } = useTranslation();
  return (
    <div className="promo-card">
      <div className="promo-content">
        <h2>{t('promo_card.buy_and')} <strong>{t('promo_card.save')}</strong></h2>
        <p className="promo-subtitle">
          <span className="text-accent">{t('promo_card.free_shipping')}</span> {t('promo_card.with_items')}
        </p>

        <div className="promo-tiers">
          <div className="promo-tier">
            <span className="tier-label">{t('promo_card.buy_3')}</span>
            <strong className="tier-badge text-accent">{t('promo_card.off_10')}</strong>
          </div>
          <div className="promo-tier">
            <span className="tier-label">{t('promo_card.buy_4')}</span>
            <strong className="tier-badge text-accent">{t('promo_card.off_15')}</strong>
          </div>
          <div className="promo-tier">
            <span className="tier-label">{t('promo_card.buy_5')}</span>
            <strong className="tier-badge text-accent">{t('promo_card.off_20')}</strong>
          </div>
        </div>

        <p className="promo-disclaimer">{t('promo_card.discount_applied')}</p>

        <button className="btn-promo-learn" onClick={onLearnMore}>
          {t('promo_card.learn_more')}
        </button>
      </div>
    </div>
  );
};

export default PromoCard;

