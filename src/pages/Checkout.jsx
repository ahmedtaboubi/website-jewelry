import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import './Checkout.css';

const Checkout = ({ cartItems, cartSubtotal, discountPercent, discountAmount, shippingCost, cartTotal, onPlaceOrder, onBack, currentUser }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.name ? currentUser.name.split(' ') : [''];
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        zipCode: currentUser.zipCode || ''
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPlaceOrder(formData);
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page container text-center">
        <h2>{t('cart.empty')}</h2>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-light)' }}>Add some jewelry pieces before checking out.</p>
        <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={onBack}>{t('product_detail.back')}</button>
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fade-in">
      <div className="container">
        <button className="btn-secondary checkout-back" onClick={onBack}>
          <ArrowLeft size={16} /> {t('product_detail.back')}
        </button>
        
        <div className="checkout-grid">
          <div className="checkout-form-container">
            <h1 className="checkout-title">{t('checkout.title')}</h1>
            
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-section">
                <h3 className="form-section-title">{t('checkout.contact_info')}</h3>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder={t('checkout.phone')} 
                  required 
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder={t('checkout.email_optional')} 
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-section">
                <h3 className="form-section-title">{t('checkout.shipping_address')}</h3>
                <div className="form-row">
                  <input type="text" name="firstName" placeholder={t('checkout.first_name')} required className="form-input" value={formData.firstName} onChange={handleChange} />
                  <input type="text" name="lastName" placeholder={t('checkout.last_name')} required className="form-input" value={formData.lastName} onChange={handleChange} />
                </div>
                <input type="text" name="address" placeholder={t('checkout.address')} required className="form-input" value={formData.address} onChange={handleChange} />
                <div className="form-row">
                  <input type="text" name="city" placeholder={t('checkout.city')} required className="form-input" value={formData.city} onChange={handleChange} />
                  <input type="text" name="zipCode" placeholder={t('checkout.zip')} className="form-input" value={formData.zipCode} onChange={handleChange} />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">{t('checkout.payment_method')}</h3>
                <div className="payment-method-box" style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--color-bg-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={20} color="var(--color-accent)" />
                  <span style={{ fontWeight: '500' }}>{t('checkout.cash_on_delivery')}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
                  You will pay for your order in cash when it is delivered to your address.
                </p>
              </div>

              <button type="submit" className="btn-primary checkout-submit">
                {t('checkout.place_order')} • {formatCurrency(cartTotal, i18n.language)}
              </button>
            </form>
          </div>
          
          <div className="checkout-summary">
            <h3 className="summary-title">{t('checkout.order_summary')}</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <div className="summary-item-img-wrapper">
                    <img src={item.image} alt={item.name} className="summary-item-img" />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <h4>{item.name}</h4>
                  </div>
                  <div className="summary-item-price">
                    {formatCurrency(item.priceStr || item.price, i18n.language)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>{t('checkout.subtotal')}</span>
                <span>{formatCurrency(cartSubtotal, i18n.language)}</span>
              </div>
              
              {discountPercent > 0 && (
                <div className="summary-row" style={{ color: 'var(--color-accent)' }}>
                  <span>Bundle Discount ({discountPercent}%)</span>
                  <span>{formatCurrency(discountAmount, i18n.language, true)}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>{t('checkout.shipping')}</span>
                {shippingCost > 0 ? (
                  <span>{formatCurrency(shippingCost, i18n.language)}</span>
                ) : (
                  <span>{t('checkout.free')}</span>
                )}
              </div>
              <div className="summary-row summary-final">
                <span>{t('checkout.total')}</span>
                <span>{formatCurrency(cartTotal, i18n.language)}</span>
              </div>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-indicator">
                <CheckCircle size={16} /> Secure checkout
              </div>
              <div className="trust-indicator">
                <CheckCircle size={16} /> Free shipping
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
