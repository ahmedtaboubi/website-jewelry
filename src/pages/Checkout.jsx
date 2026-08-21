import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import './Checkout.css';

const Checkout = ({ cartItems, cartSubtotal, discountPercent, discountAmount, shippingCost, cartTotal, onPlaceOrder, onBack, currentUser }) => {
  const { t, i18n } = useTranslation();
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
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
        <div className="empty-checkout-card">
          <ShoppingBag size={56} color="#ccc" strokeWidth={1.5} />
          <h2>{t('cart.empty')}</h2>
          <p style={{ marginTop: '0.8rem', color: 'var(--color-text-light)' }}>Add some jewelry pieces before checking out.</p>
          <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={onBack}>{t('product_detail.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fade-in">
      <div className="container">
        
        {/* Navigation & Title */}
        <div className="checkout-header">
          <button className="checkout-back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> <span>{t('product_detail.back')}</span>
          </button>
          <h1 className="checkout-title">{t('checkout.title')}</h1>
        </div>

        {/* Mobile Accordion Summary Trigger */}
        <div className="mobile-summary-toggle" onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}>
          <div className="mobile-summary-left">
            <ShoppingBag size={18} color="var(--color-accent)" />
            <span>{isOrderSummaryOpen ? t('checkout.hide_summary') || 'Hide Order Summary' : t('checkout.show_summary') || 'Show Order Summary'}</span>
            {isOrderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <div className="mobile-summary-right">
            <span className="mobile-summary-total">{formatCurrency(cartTotal, i18n.language)}</span>
          </div>
        </div>

        {/* Mobile Expandable Order Items */}
        <div className={`mobile-summary-content ${isOrderSummaryOpen ? 'open' : ''}`}>
          <div className="summary-items">
            {cartItems.map(item => (
              <div key={item.id} className="summary-item">
                <div className="summary-item-img-wrapper">
                  <img src={item.image} alt={item.name} className="summary-item-img" />
                  <span className="summary-item-qty">{item.quantity}</span>
                </div>
                <div className="summary-item-info">
                  <h4>{item.name}</h4>
                  <span className="item-unit-price">{formatCurrency(item.priceStr || item.price, i18n.language)}</span>
                </div>
                <div className="summary-item-price">
                  {formatCurrency((parseFloat(item.priceStr || item.price) || 0) * (item.quantity || 1), i18n.language)}
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
              <div className="summary-row discount-row">
                <span>Bundle Discount ({discountPercent}%)</span>
                <span>{formatCurrency(discountAmount, i18n.language, true)}</span>
              </div>
            )}
            
            <div className="summary-row">
              <span>{t('checkout.shipping')}</span>
              {shippingCost > 0 ? (
                <span>{formatCurrency(shippingCost, i18n.language)}</span>
              ) : (
                <span className="free-shipping-tag">{t('checkout.free')}</span>
              )}
            </div>
            <div className="summary-row summary-final">
              <span>{t('checkout.total')}</span>
              <span>{formatCurrency(cartTotal, i18n.language)}</span>
            </div>
          </div>
        </div>
        
        <div className="checkout-grid">
          
          {/* Main Checkout Form */}
          <div className="checkout-form-container">
            <form onSubmit={handleSubmit} className="checkout-form">
              
              {/* Contact Info */}
              <div className="form-card">
                <h3 className="form-section-title">
                  <span className="step-num">1</span> {t('checkout.contact_info')}
                </h3>
                <div className="form-group">
                  <label className="form-label">{t('checkout.phone')} <span className="req">*</span></label>
                  <input 
                    type="tel" 
                    name="phone" 
                    placeholder="+212 6..." 
                    required 
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('checkout.email_optional')}</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="email@example.com" 
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="form-card">
                <h3 className="form-section-title">
                  <span className="step-num">2</span> {t('checkout.shipping_address')}
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('checkout.first_name')} <span className="req">*</span></label>
                    <input type="text" name="firstName" placeholder="First Name" required className="form-input" value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.last_name')} <span className="req">*</span></label>
                    <input type="text" name="lastName" placeholder="Last Name" required className="form-input" value={formData.lastName} onChange={handleChange} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('checkout.address')} <span className="req">*</span></label>
                  <input type="text" name="address" placeholder="Street Address, Appt / Floor" required className="form-input" value={formData.address} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('checkout.city')} <span className="req">*</span></label>
                    <input type="text" name="city" placeholder="e.g. Casablanca, Rabat" required className="form-input" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('checkout.zip')}</label>
                    <input type="text" name="zipCode" placeholder="Postal Code" className="form-input" value={formData.zipCode} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-card">
                <h3 className="form-section-title">
                  <span className="step-num">3</span> {t('checkout.payment_method')}
                </h3>
                <div className="payment-method-box active">
                  <div className="payment-radio-circle">
                    <div className="payment-radio-dot" />
                  </div>
                  <div className="payment-method-info">
                    <span className="payment-method-title">{t('checkout.cash_on_delivery')}</span>
                    <span className="payment-method-desc">Pay securely in cash when your order is delivered to your doorstep.</span>
                  </div>
                  <CheckCircle size={20} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button type="submit" className="btn-primary checkout-submit-btn">
                <span>{t('checkout.place_order')}</span>
                <span className="submit-price">{formatCurrency(cartTotal, i18n.language)}</span>
              </button>

              {/* Trust Badges */}
              <div className="checkout-trust-grid">
                <div className="checkout-trust-item">
                  <ShieldCheck size={18} color="var(--color-accent)" />
                  <span>100% Secure Checkout</span>
                </div>
                <div className="checkout-trust-item">
                  <Truck size={18} color="var(--color-accent)" />
                  <span>Free Insured Express Delivery</span>
                </div>
                <div className="checkout-trust-item">
                  <RotateCcw size={18} color="var(--color-accent)" />
                  <span>14-Day Easy Return Policy</span>
                </div>
              </div>
            </form>
          </div>
          
          {/* Desktop Order Summary Sidebar */}
          <div className="checkout-summary desktop-summary">
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
                    <span className="item-unit-price">{formatCurrency(item.priceStr || item.price, i18n.language)}</span>
                  </div>
                  <div className="summary-item-price">
                    {formatCurrency((parseFloat(item.priceStr || item.price) || 0) * (item.quantity || 1), i18n.language)}
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
                <div className="summary-row discount-row">
                  <span>Bundle Discount ({discountPercent}%)</span>
                  <span>{formatCurrency(discountAmount, i18n.language, true)}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>{t('checkout.shipping')}</span>
                {shippingCost > 0 ? (
                  <span>{formatCurrency(shippingCost, i18n.language)}</span>
                ) : (
                  <span className="free-shipping-tag">{t('checkout.free')}</span>
                )}
              </div>
              <div className="summary-row summary-final">
                <span>{t('checkout.total')}</span>
                <span>{formatCurrency(cartTotal, i18n.language)}</span>
              </div>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-indicator">
                <CheckCircle size={16} color="var(--color-accent)" /> <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="trust-indicator">
                <CheckCircle size={16} color="var(--color-accent)" /> <span>Direct Delivery from Morocco Workshop</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
