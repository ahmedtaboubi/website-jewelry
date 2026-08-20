import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X, ShoppingBag } from 'lucide-react';
import './SocialProofToast.css';

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Mohammedia', 'Meknès', 'Kénitra'];

// 80% Women (target audience) & 20% Men (gifting buyers)
const FEMALE_NAMES = [
  'Yasmine', 'Sarah', 'Salma', 'Inès', 'Sofia', 'Hiba', 
  'Zineb', 'Imane', 'Kenza', 'Fatima-Zahra', 'Nour', 'Rania', 
  'Chaimae', 'Meryem', 'Ghita', 'Lina', 'Dounia', 'Nadia'
];

const MALE_NAMES = [
  'Mehdi', 'Omar', 'Karim', 'Amine', 'Youssef', 'Hamza', 'Saad'
];

const SocialProofToast = ({ onProductClick }) => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (products.length === 0 || isDismissed) return;

    // Show initial notification after 6 seconds
    const initialTimer = setTimeout(() => {
      triggerNotification();
    }, 6000);

    // Repeat notification every 28 seconds
    const interval = setInterval(() => {
      if (!isDismissed) {
        triggerNotification();
      }
    }, 28000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [products, isDismissed]);

  const triggerNotification = () => {
    if (products.length === 0) return;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
    
    // 80% probability female, 20% male (gifting)
    const isFemale = Math.random() < 0.8;
    const randomName = isFemale
      ? FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)]
      : MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)];

    const randomMinutes = Math.floor(Math.random() * 8) + 1;

    setCurrentEvent({
      product: randomProduct,
      city: randomCity,
      name: randomName,
      timeAgo: randomMinutes <= 2 
        ? t('social_proof.few_seconds_ago') 
        : t('social_proof.minutes_ago', { count: randomMinutes })
    });

    setIsVisible(true);

    // Auto hide after 6.5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 6500);
  };

  if (!currentEvent || !isVisible || isDismissed) return null;

  return (
    <aside 
      aria-label="Live customer activity"
      className="social-proof-toast animate-slide-up"
      onClick={() => onProductClick && onProductClick(currentEvent.product)}
    >
      <button 
        className="social-proof-close" 
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setIsDismissed(true);
        }}
        title="Close"
      >
        <X size={13} />
      </button>

      <div className="social-proof-image-wrapper">
        <img 
          src={currentEvent.product.image} 
          alt={currentEvent.product.name} 
          className="social-proof-img" 
        />
        <span className="social-proof-bag-icon">
          <ShoppingBag size={10} color="#fff" />
        </span>
      </div>

      <div className="social-proof-content">
        <div className="social-proof-user">
          <strong>{currentEvent.name}</strong> ({currentEvent.city})
        </div>
        <div className="social-proof-action">
          {t('social_proof.just_purchased')} <span className="social-proof-product-name">{currentEvent.product.name}</span>
        </div>
        <div className="social-proof-footer">
          <span className="social-proof-verified">
            <CheckCircle size={11} color="#059669" /> {t('social_proof.verified_order')}
          </span>
          <span className="social-proof-time">• {currentEvent.timeAgo}</span>
        </div>
      </div>
    </aside>
  );
};

export default SocialProofToast;
