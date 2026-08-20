import { X, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import './Cart.css';

const Cart = ({ isOpen, onClose, cartItems, updateQuantity, removeFromCart, totalQuantity, subtotal, discountPercent, discountAmount, shippingCost, total, onCheckout, showToast }) => {
  const { t, i18n } = useTranslation();
  
  // Calculate next tier
  let nextTierMessage = t('promo_card.buy_3');
  if (totalQuantity >= 5) {
    nextTierMessage = t('bundle_builder.compact_tier_max');
  } else if (totalQuantity === 4) {
    nextTierMessage = t('bundle_builder.add_1_for_20');
  } else if (totalQuantity === 3) {
    nextTierMessage = t('bundle_builder.add_1_for_15');
  } else if (totalQuantity === 2) {
    nextTierMessage = t('bundle_builder.add_1_for_10');
  } else if (totalQuantity === 1) {
    nextTierMessage = t('bundle_builder.compact_add_1_free');
  }

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>{t('cart.title')} ({totalQuantity})</h2>
          <button className="close-btn" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-bundle-progress">
            <p className="bundle-progress-text">{nextTierMessage}</p>
          </div>
        )}
        
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>{t('cart.empty')}</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">{formatCurrency(item.priceStr || item.price, i18n.language)}</p>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>{t('cart.subtotal')}</span>
              <span style={{ textDecoration: discountPercent > 0 ? 'line-through' : 'none', color: discountPercent > 0 ? 'var(--color-text-light)' : 'inherit' }}>
                {formatCurrency(subtotal, i18n.language)}
              </span>
            </div>
            
            {discountPercent > 0 && (
              <div className="cart-subtotal" style={{ color: 'var(--color-accent)', marginTop: '0.5rem', fontWeight: '500' }}>
                <span>Bundle Discount ({discountPercent}%)</span>
                <span>{formatCurrency(discountAmount, i18n.language, true)}</span>
              </div>
            )}
            
            <div className="cart-subtotal" style={{ marginTop: '0.5rem', fontWeight: '500' }}>
              <span>Shipping</span>
              {shippingCost > 0 ? (
                <span>{formatCurrency(shippingCost, i18n.language)}</span>
              ) : (
                <span style={{ color: 'var(--color-accent)' }}>Free</span>
              )}
            </div>
            
            <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span>{formatCurrency(total, i18n.language)}</span>
            </div>
            
            <p className="cart-shipping-note">{t('cart.shipping_calc')}</p>
            <button className="btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={onCheckout}>
              {t('cart.checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
