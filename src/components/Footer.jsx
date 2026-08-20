import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = ({ showToast }) => {
  const { t } = useTranslation();
  const handleSubscribe = (e) => {
    e.preventDefault();
    showToast(t('footer.success'));
  };

  const handleLinkClick = (e, feature) => {
    e.preventDefault();
    showToast(`${feature} ${t('footer.coming_soon')}`);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-logo">{t('footer.brand')}</h3>
            <p className="footer-text">
              {t('footer.brand_text')}
            </p>
          </div>
          <div className="footer-links">
            <h4 className="footer-title">{t('footer.help')}</h4>
            <ul>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, t('footer.faq'))}>{t('footer.faq')}</a></li>
              <li><a href="#shipping" onClick={(e) => handleLinkClick(e, t('footer.shipping'))}>{t('footer.shipping')}</a></li>
              <li><a href="#chat" onClick={(e) => handleLinkClick(e, t('footer.chat'))}>{t('footer.chat')}</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4 className="footer-title">{t('footer.about')}</h4>
            <ul>
              <li><a href="#story" onClick={(e) => handleLinkClick(e, t('footer.story'))}>{t('footer.story')}</a></li>
              <li><a href="#sustainability" onClick={(e) => handleLinkClick(e, t('footer.sustainability'))}>{t('footer.sustainability')}</a></li>
              <li><a href="#contact" onClick={(e) => handleLinkClick(e, t('footer.contact'))}>{t('footer.contact')}</a></li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h4 className="footer-title">{t('footer.join')}</h4>
            <p className="footer-text">{t('footer.subscribe_text')}</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input type="email" placeholder={t('footer.email')} className="newsletter-input" required />
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>{t('footer.subscribe')}</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
