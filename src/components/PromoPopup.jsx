import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './PromoPopup.css';

const PromoPopup = ({ showToast, onAuthClick }) => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  useEffect(() => {
    // Check if they've already seen the popup in this session
    const seen = sessionStorage.getItem('hasSeenPromoPopup');
    if (!seen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000); // Show after 4 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenPromoPopup', 'true');
  };

  const handleCreateAccount = () => {
    onAuthClick();
    handleClose();
  };

  if (!isVisible) return null;

  const isRtl = i18n.language === 'ar';

  return (
    <div className="promo-overlay" key={i18n.language} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="promo-popup animate-fade-up">
        <button className="icon-btn close-promo-btn" onClick={handleClose} aria-label={t('common.close', 'Close')}>
          <X size={24} strokeWidth={1.5} />
        </button>

        <div className="promo-content">
          <div className="promo-icon-wrapper">
            <UserPlus size={32} strokeWidth={1.5} className="promo-icon" />
          </div>
          <h2 className="promo-title">{t('promo_popup.title')}</h2>
          <p className="promo-text">
            {t('promo_popup.text')}
          </p>
          
          <button className="btn-primary promo-action-btn" onClick={handleCreateAccount}>
            {t('promo_popup.create_account')}
          </button>
          
          <button className="promo-dismiss-btn" onClick={handleClose}>
            {t('promo_popup.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
