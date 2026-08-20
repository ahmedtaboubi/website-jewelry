import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, parsePrice } from '../utils/currency';
import './ProductCard.css';

const ProductCard = ({ id, image, name, inspiredBy, notes, price, isNew, details, category, stock, onClick, addToCart }) => {
  const { t, i18n } = useTranslation();

  const isOutOfStock = stock !== undefined && stock !== null && stock <= 0;
  const isLowStock = stock !== undefined && stock !== null && stock > 0 && stock <= 5;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart({ id, image, name, inspiredBy, notes, price, isNew, details, stock });
  };

  let parsedDetails = {};
  try {
    parsedDetails = typeof details === 'string' ? JSON.parse(details) : (details || {});
  } catch(e) {}

  const rawPriceNum = parsePrice(price);
  const luxuryPriceNum = parsedDetails.luxuryPrice ? parsePrice(parsedDetails.luxuryPrice) : (rawPriceNum * 3.5);
  const rawTag = parsedDetails.gender || category || 'unisex';
  const categoryTag = (rawTag || 'unisex').toLowerCase() === 'unisex'
    ? t('product_card.unisex')
    : t(`bundle_builder.${(rawTag || '').toLowerCase()}`, { defaultValue: rawTag }).toUpperCase();
  const displayPrice = formatCurrency(rawPriceNum, i18n.language);

  return (
    <div className={`product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`} onClick={onClick}>
      <div className="product-image-container">
        <div className="product-tags">
          <span className="product-tag-pill">{categoryTag}</span>
          {isOutOfStock ? (
            <span className="product-tag-solid out-of-stock-badge">{t('product_card.out_of_stock')}</span>
          ) : isLowStock ? (
            <span className="product-tag-solid low-stock-badge">{t('product_card.low_stock', { count: stock })}</span>
          ) : !!isNew ? (
            <span className="product-tag-solid">{t('product_card.new')}</span>
          ) : null}
        </div>
        <img src={image} alt={name} className="product-image" />
        <div className="add-to-cart-overlay">
          <button 
            className={`btn-add-to-cart ${isOutOfStock ? 'disabled' : ''}`} 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? t('product_card.out_of_stock') : t('product_card.add_to_cart')}
          </button>
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill="#333" stroke="none" />
          ))}
          <span className="rating-count">719</span>
        </div>
        
        <p className="product-smells-like">{t('product_card.similar')} <strong>{t('product_card.designer')}</strong></p>
        <p className="product-luxury-price">({t('product_card.retail')}: {formatCurrency(luxuryPriceNum, i18n.language)})</p>
        
        <div className="product-price-pill">
          {displayPrice}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
