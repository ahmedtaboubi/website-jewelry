import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, ChevronUp, Leaf, Droplet, Star, CheckCircle, ThumbsUp, 
  MessageSquare, Plus, X, ShieldCheck, Camera, Image as ImageIcon, Trash2,
  Flame, Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import './ProductDetail.css';

const ProductDetail = ({ product, onBack, addToCart, showToast }) => {
  const { t, i18n } = useTranslation();
  const [currentProduct, setCurrentProduct] = useState(product);
  const [isLoading, setIsLoading] = useState(!product);
  const [ingredientsLibrary, setIngredientsLibrary] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  // Reviews & Rating states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    authorName: '',
    authorEmail: '',
    title: '',
    comment: ''
  });
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [helpfulVoted, setHelpfulVoted] = useState({});
  const [selectedStarFilter, setSelectedStarFilter] = useState('all');

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...reviewPhotos, ...files].slice(0, 4);
    setReviewPhotos(combined);
    
    // Generate preview URLs
    const previews = combined.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };

  const handleRemovePhoto = (index) => {
    const updatedFiles = reviewPhotos.filter((_, i) => i !== index);
    setReviewPhotos(updatedFiles);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updatedPreviews);
  };

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setIsLoading(false);
    } else {
      const match = window.location.pathname.match(/\/product\/([^\/?#]+)/);
      const id = match ? match[1] : null;
      if (id) {
        setIsLoading(true);
        fetch(`/api/products/${id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && !data.error) {
              setCurrentProduct(data);
            } else {
              setCurrentProduct(null);
            }
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Failed to load product detail:', err);
            setCurrentProduct(null);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }
  }, [product]);

  useEffect(() => {
    fetch('/api/ingredients')
      .then(res => res.json())
      .then(data => setIngredientsLibrary(data))
      .catch(console.error);
  }, []);

  // Fetch approved product reviews
  const loadProductReviews = async (productId) => {
    if (!productId) return;
    setIsReviewsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setReviewStats(data.stats || { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
      }
    } catch (err) {
      console.error('Failed to load product reviews:', err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProduct?.id) {
      loadProductReviews(currentProduct.id);
    }
  }, [currentProduct?.id]);

  const handleHelpfulClick = async (reviewId) => {
    if (helpfulVoted[reviewId]) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: updated.helpful_count } : r));
        setHelpfulVoted(prev => ({ ...prev, [reviewId]: true }));
        if (showToast) showToast(t('reviews.helpful') + ' +1');
      }
    } catch (e) {
      console.error('Helpful vote error:', e);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentProduct?.id) return;
    if (!reviewForm.authorName.trim() || !reviewForm.comment.trim()) {
      if (showToast) showToast('Please fill in your name and review comment.', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      let uploadedImageUrls = [];
      if (reviewPhotos.length > 0) {
        const formData = new FormData();
        reviewPhotos.forEach(file => {
          formData.append('images', file);
        });
        const uploadRes = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedImageUrls = uploadData.imageUrls || [];
        }
      }

      const savedUser = localStorage.getItem('currentUser');
      let userId = null;
      if (savedUser) {
        try { userId = JSON.parse(savedUser)?.id; } catch(e) {}
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.id,
          userId,
          authorName: reviewForm.authorName,
          authorEmail: reviewForm.authorEmail,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
          images: uploadedImageUrls
        })
      });

      if (res.ok) {
        setReviewSuccessMessage(t('reviews.moderation_notice'));
        setReviewForm({ rating: 5, authorName: '', authorEmail: '', title: '', comment: '' });
        setReviewPhotos([]);
        setPhotoPreviews([]);
        if (showToast) showToast(t('reviews.moderation_notice'));
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSuccessMessage('');
        }, 3500);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (showToast) showToast(errData.error || 'Failed to submit review.', 'error');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      if (showToast) showToast('Network error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>{t('product_detail.loading', 'Loading product...')}</div>;
  }

  if (!currentProduct) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h2>{t('shop_page.no_jewelry', 'Product not found')}</h2>
        <button className="btn-primary" onClick={onBack} style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem' }}>
          &larr; {t('product_detail.back', 'Back to Catalog')}
        </button>
      </div>
    );
  }

  // Parse details if available, otherwise use defaults
  let details = {};
  try {
    if (currentProduct.details) {
      details = typeof currentProduct.details === 'string' ? JSON.parse(currentProduct.details) : currentProduct.details;
    }
  } catch (e) {
    console.error('Failed to parse product details', e);
  }

  // Prepare images array: main image + gallery images
  let images = [currentProduct.image || ''];
  if (details.images && Array.isArray(details.images) && details.images.length > 0) {
    images = [...images, ...details.images];
  } else {
    images = [
      currentProduct.image,
      currentProduct.image,
      currentProduct.image,
      currentProduct.image
    ].filter(Boolean);
  }
  if (images.length === 0) images = ['/images/product_ring_1783185882264.png'];

  const displayedRating = reviewStats.totalReviews > 0 
    ? reviewStats.averageRating.toFixed(1) 
    : (details.rating || "4.8");
    
  const displayedReviewCount = reviewStats.totalReviews > 0 
    ? reviewStats.totalReviews 
    : (parseInt((details.reviewCount || "14").toString().replace(/[^0-9]/g, '')) || 14);

  const size = details.size || "Adjustable";
  const categoryName = details.scentFamily || currentProduct.category || "Rings";
  const styleDescription = details.scentDescription || "Elegant, handcrafted design";
  
  const getEmojiForNote = (materialName) => {
    if (!materialName) return '✨';
    const m = materialName.toLowerCase();
    if (m.includes('steel') || m.includes('acier')) return '🛡️';
    if (m.includes('xp') || m.includes('plated') || m.includes('gold')) return '✨';
    if (m.includes('zircon') || m.includes('diamond')) return '💎';
    if (m.includes('silver')) return '⚪';
    if (m.includes('pearl')) return '⚪';
    if (m.includes('lapis')) return '🔷';
    if (m.includes('ruby')) return '🔴';
    if (m.includes('emerald')) return '🟩';
    if (m.includes('sapphire')) return '🔵';
    if (m.includes('crystal') || m.includes('gem')) return '🔮';
    return '✨';
  };

  let generatedMainNotes = null;
  if (currentProduct.notes) {
    const parts = currentProduct.notes.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (parts.length > 0) {
      generatedMainNotes = parts.slice(0, 6).map(name => ({
        name: name,
        icon: getEmojiForNote(name)
      }));
    }
  }

  const mainNotesIds = details.mainNotesIds || [];
  const libraryNotes = Array.isArray(mainNotesIds) ? mainNotesIds.map(nId => ingredientsLibrary.find(i => i.id === nId)).filter(Boolean) : [];

  const mainNotes = libraryNotes.length > 0 ? libraryNotes : (generatedMainNotes || [
    { name: "Stainless Steel 316L", icon: "🛡️" },
    { name: "XP Jewelry Alloy", icon: "✨" },
    { name: "Cubic Zirconia", icon: "💎" },
    { name: "Lapis Lazuli", icon: "🔷" },
    { name: "Waterproof Seal", icon: "💧" },
    { name: "Hypoallergenic", icon: "✨" }
  ]);

  let parsedNotes = { top: '', middle: '', base: '' };
  if (currentProduct.notes) {
    const parts = currentProduct.notes.split(',');
    parsedNotes.top = parts.slice(0, 2).join(', ');
    parsedNotes.middle = parts.slice(2, 4).join(', ');
    parsedNotes.base = parts.slice(4).join(', ');
  }

  const topNotes = details.topNotes || parsedNotes.top || "Stainless Steel 316L, Premium XP Alloy";
  const middleNotes = details.middleNotes || parsedNotes.middle || "Sparkling Cubic Zirconia, Lapis Lazuli";
  const baseNotes = details.baseNotes || parsedNotes.base || "Waterproof finish, 100% Tarnish-free & Nickel-free";

  const ingredients = details.ingredients || "Premium 316L Stainless Steel (Acier Inoxydable), High-grade XP Alloy, Brilliant Cubic Zirconia Crystals, Natural Gemstones. 100% Waterproof, Tarnish-free & Hypoallergenic.";

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (selectedStarFilter === 'all') return true;
    return r.rating === parseInt(selectedStarFilter, 10);
  });

  const scrollToReviews = () => {
    const el = document.getElementById('customer-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="product-detail">
      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-overlay animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-close" onClick={() => setSelectedImage(null)}>✕</div>
          <img src={selectedImage} alt="Product enlarged" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="review-modal-overlay animate-fade-in" onClick={() => setIsReviewModalOpen(false)}>
          <div className="review-modal-card animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <div>
                <h3>{t('reviews.write_review_title')}</h3>
                <p className="review-modal-subtitle">{currentProduct.name}</p>
              </div>
              <button className="review-modal-close" onClick={() => setIsReviewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {reviewSuccessMessage ? (
              <div className="review-modal-success animate-fade-in">
                <CheckCircle size={52} color="#10b981" />
                <h4>{t('reviews.title')}</h4>
                <p>{reviewSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="review-modal-form">
                <div className="review-form-group">
                  <label>{t('reviews.select_rating')} *</label>
                  <div className="star-rating-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className="star-pick-btn"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      >
                        <Star
                          size={28}
                          fill={(hoverRating || reviewForm.rating) >= star ? '#F6D365' : 'transparent'}
                          stroke={(hoverRating || reviewForm.rating) >= star ? '#D4AF37' : '#cbd5e1'}
                        />
                      </button>
                    ))}
                    <span className="star-rating-label">
                      {(hoverRating || reviewForm.rating)} / 5
                    </span>
                  </div>
                </div>

                <div className="review-form-row">
                  <div className="review-form-group">
                    <label>{t('reviews.name_label')} *</label>
                    <input
                      type="text"
                      required
                      placeholder={t('reviews.name_placeholder')}
                      value={reviewForm.authorName}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, authorName: e.target.value }))}
                    />
                  </div>

                  <div className="review-form-group">
                    <label>{t('reviews.email_label')}</label>
                    <input
                      type="email"
                      placeholder={t('reviews.email_placeholder')}
                      value={reviewForm.authorEmail}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, authorEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="review-form-group">
                  <label>{t('reviews.title_label')}</label>
                  <input
                    type="text"
                    placeholder={t('reviews.title_placeholder')}
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="review-form-group">
                  <label>{t('reviews.comment_label')} *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder={t('reviews.comment_placeholder')}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  ></textarea>
                </div>

                {/* Customer Photo Upload Section */}
                <div className="review-form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('reviews.upload_photos')}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                      {reviewPhotos.length} / 4 {t('reviews.photos_attached')}
                    </span>
                  </label>
                  
                  <div className="review-photo-upload-container">
                    {photoPreviews.map((previewUrl, idx) => (
                      <div key={idx} className="review-photo-preview-item animate-fade-in">
                        <img src={previewUrl} alt={`Review photo ${idx + 1}`} />
                        <button 
                          type="button" 
                          className="btn-remove-photo" 
                          onClick={() => handleRemovePhoto(idx)}
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {reviewPhotos.length < 4 && (
                      <label className="review-photo-dropzone">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handlePhotoSelect}
                          style={{ display: 'none' }}
                        />
                        <Camera size={22} color="#94a3b8" />
                        <span className="dropzone-text">{t('reviews.upload_photos_hint')}</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="review-modal-notice">
                  <ShieldCheck size={16} />
                  <span>{t('reviews.moderation_notice')}</span>
                </div>

                <div className="review-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsReviewModalOpen(false)}>
                    {t('reviews.cancel')}
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmittingReview}>
                    {isSubmittingReview ? t('reviews.submitting') : t('reviews.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="container dossier-layout">
        
        {/* Left Side: Images */}
        <div className="dossier-images">
          {images.map((img, index) => (
            <div 
              key={index} 
              className={`dossier-img-wrapper ${index === 0 ? 'hero' : ''}`}
              onClick={() => setSelectedImage(img)}
              style={{ cursor: 'pointer' }}
            >
              <img src={img} alt={`${currentProduct.name} ${index + 1}`} className="dossier-img" />
            </div>
          ))}
        </div>

        {/* Right Side: Product Info */}
        <div className="dossier-info">
          <button className="btn-back-link" onClick={onBack}>&larr; {t('product_detail.back')}</button>

          <h1 className="dossier-title">{currentProduct.name}</h1>
          
          <div className="dossier-rating" onClick={scrollToReviews} style={{ cursor: 'pointer' }} title={t('reviews.title')}>
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  fill={i < Math.round(Number(displayedRating)) ? '#333' : 'none'} 
                  stroke="#333" 
                />
              ))}
            </div>
            <span>
              <strong>{displayedRating}</strong> • {t('reviews.based_on', { count: displayedReviewCount })}
            </span>
          </div>

          <div className="dossier-size">
            {t('product_detail.premium')}. {t('product_detail.size')}: {size}
          </div>

          <div className="dossier-badges">
            <span className="badge-pill country">{t('product_detail.crafted')}</span>
            <span className="badge-pill">{t('product_detail.gender')}: {details.gender || t('product_card.unisex')}</span>
            <span className="badge-pill">{t('product_detail.category')}: {categoryName}</span>
          </div>

          {/* Low Stock Scarcity Progress Bar */}
          {currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock > 0 && currentProduct.stock <= 5 && (
            <div className="scarcity-urgency-banner animate-fade-in" style={{ margin: '1.2rem 0' }}>
              <div className="scarcity-urgency-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b91c1c', fontWeight: '700' }}>
                  <Flame size={16} color="#dc2626" />
                  <span>{t('urgency.almost_gone')}</span>
                </div>
                <span style={{ fontWeight: '800', color: '#b45309' }}>
                  {t('urgency.only_left', { count: currentProduct.stock })}
                </span>
              </div>
              <div className="scarcity-meter" style={{ width: '100%', height: '7px', background: '#fee2e2', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  className="scarcity-meter-bar" 
                  style={{ width: `${Math.max(20, (currentProduct.stock / 5) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', borderRadius: '4px', transition: 'width 0.4s ease' }}
                ></div>
              </div>
            </div>
          )}

          {/* Stock Availability Indicator for normal & out of stock */}
          {(currentProduct.stock === undefined || currentProduct.stock === null || currentProduct.stock <= 0 || currentProduct.stock > 5) && (
            <div className="stock-indicator-container" style={{ margin: '1rem 0' }}>
              {currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock <= 0 ? (
                <div className="stock-status out-of-stock" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b91c1c' }}></span>
                  {t('product_card.out_of_stock', 'Out of Stock')}
                </div>
              ) : (
                <div className="stock-status in-stock" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', background: '#ecfdf5', color: '#047857', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  {t('product_card.in_stock', 'In Stock')} ({currentProduct.stock || 50} units available)
                </div>
              )}
            </div>
          )}

          <button 
            className={`dossier-add-btn ${currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock <= 0 ? 'disabled' : ''}`} 
            onClick={() => addToCart(currentProduct)}
            disabled={currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock <= 0}
            style={currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock <= 0 ? { opacity: 0.6, cursor: 'not-allowed', background: '#94a3b8' } : {}}
          >
            {currentProduct.stock !== undefined && currentProduct.stock !== null && currentProduct.stock <= 0
              ? t('product_card.out_of_stock', 'Out of Stock')
              : `${t('product_detail.add_to_cart')} - ${formatCurrency(currentProduct.price, i18n.language)}`
            }
          </button>

          {/* Social Proof & Delivery Trust Strip */}
          <div className="product-trust-strip" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0 1.5rem 0', padding: '0.85rem 1rem', background: '#fbf9f5', border: '1px solid #efe8dc', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }}></span>
              <span>{t('urgency.live_viewers', { count: ((currentProduct.id || 1) * 3 + 7) % 9 + 5 })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
              <Clock size={13} color="#b45309" />
              <span>{t('urgency.free_delivery_hint')}</span>
            </div>
          </div>

          {/* Details Card */}
          <div className="scent-card">
            <div className="scent-card-header" onClick={() => setIsNotesOpen(!isNotesOpen)} style={{cursor: 'pointer'}}>
              <span>{t('product_detail.materials_details')}</span>
              {isNotesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {isNotesOpen && (
              <div className="scent-card-content">
                <div className="scent-subtitle">
                  {t('product_detail.style')}: {styleDescription}
                </div>

                <div className="scent-main-notes">
                  <h4>{t('product_detail.key_materials')}:</h4>
                  <div className="main-notes-grid">
                  {mainNotes.map((n, idx) => (
                    <div key={idx} className="note-bubble animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                      <span className="note-icon">
                        {typeof n.icon === 'string' && (n.icon.startsWith('/') || n.icon.startsWith('http')) ? (
                          <img src={n.icon} alt={n.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        ) : (
                          n.icon || '✨'
                        )}
                      </span>
                      <span className="note-name">{n.name}</span>
                    </div>
                  ))}
                  </div>
                </div>

                <div className="scent-pyramid">
                  <div className="pyramid-level">
                    <span className="level-label">{t('product_detail.primary')}</span>
                    <span className="level-notes">{topNotes}</span>
                  </div>
                  <div className="pyramid-level">
                    <span className="level-label">{t('product_detail.secondary')}</span>
                    <span className="level-notes">{middleNotes}</span>
                  </div>
                  <div className="pyramid-level">
                    <span className="level-label">{t('product_detail.accents')}</span>
                    <span className="level-notes">{baseNotes}</span>
                  </div>
                </div>

                <p className="scent-ingredients">
                  <strong>{t('product_detail.materials')}:</strong> {ingredients}
                </p>

                <div className="scent-footer-badges">
                  <span className="footer-badge"><Leaf size={16} /> {t('product_detail.tarnish_free')}</span>
                  <span className="footer-badge"><Droplet size={16} /> {t('product_detail.hypoallergenic')}</span>
                  <span className="footer-badge">✨ {t('product_detail.ethically')}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Full Customer Reviews & Ratings Section */}
      <section id="customer-reviews-section" className="customer-reviews-section">
        <div className="container" style={{ maxWidth: '1100px' }}>
          
          <div className="reviews-section-header">
            <div>
              <h2 className="reviews-main-title">{t('reviews.title')}</h2>
              <p className="reviews-main-subtitle">{t('reviews.subtitle')}</p>
            </div>
            <button className="btn-write-review" onClick={() => setIsReviewModalOpen(true)}>
              <Plus size={18} /> {t('reviews.write_review')}
            </button>
          </div>

          {/* Rating Summary Breakdown Card */}
          <div className="reviews-summary-card">
            <div className="summary-left-score">
              <div className="score-big">{displayedRating}</div>
              <div className="score-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={20} 
                    fill={s <= Math.round(Number(displayedRating)) ? '#F6D365' : 'transparent'} 
                    stroke={s <= Math.round(Number(displayedRating)) ? '#D4AF37' : '#cbd5e1'} 
                  />
                ))}
              </div>
              <div className="score-count">
                {t('reviews.based_on', { count: reviewStats.totalReviews > 0 ? reviewStats.totalReviews : displayedReviewCount })}
              </div>
            </div>

            <div className="summary-middle-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats.distribution[star] || 0;
                const total = reviewStats.totalReviews || 1;
                const percent = reviewStats.totalReviews > 0 ? Math.round((count / total) * 100) : (star === 5 ? 75 : star === 4 ? 20 : 5);
                return (
                  <div key={star} className="rating-bar-row">
                    <span className="bar-star-label">{star} ★</span>
                    <div className="rating-progress-track">
                      <div className="rating-progress-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="bar-count-label">{reviewStats.totalReviews > 0 ? count : (star === 5 ? 11 : star === 4 ? 2 : 1)}</span>
                  </div>
                );
              })}
            </div>

            <div className="summary-right-trust">
              <div className="trust-point">
                <ShieldCheck size={20} color="#D4AF37" />
                <div>
                  <strong>{t('reviews.verified_buyer')}</strong>
                  <span>{t('product_detail.tarnish_free')}</span>
                </div>
              </div>
              <div className="trust-point">
                <CheckCircle size={20} color="#10b981" />
                <div>
                  <strong>100% {t('reviews.status_approved')}</strong>
                  <span>{t('product_detail.hypoallergenic')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="reviews-filter-bar">
            <div className="star-filters">
              <button 
                className={`star-filter-pill ${selectedStarFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedStarFilter('all')}
              >
                {t('reviews.all_reviews')} ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((s) => {
                const count = reviews.filter(r => r.rating === s).length;
                return (
                  <button 
                    key={s} 
                    className={`star-filter-pill ${selectedStarFilter === s.toString() ? 'active' : ''}`}
                    onClick={() => setSelectedStarFilter(s.toString())}
                  >
                    {s} ★ ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="reviews-list-container">
            {isReviewsLoading ? (
              <div className="reviews-loading-text">{t('product_grid.loading')}</div>
            ) : filteredReviews.length === 0 ? (
              <div className="no-reviews-box">
                <MessageSquare size={36} color="#94a3b8" />
                <p>{t('reviews.no_reviews')}</p>
                <button className="btn-secondary" onClick={() => setIsReviewModalOpen(true)}>
                  {t('reviews.write_review')}
                </button>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="review-card animate-fade-in">
                  <div className="review-card-top">
                    <div className="review-author-info">
                      <div className="review-author-avatar">
                        {(rev.author_name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="review-author-name">
                          {rev.author_name}
                          {!!rev.verified_purchase && (
                            <span className="verified-badge">
                              <CheckCircle size={13} /> {t('reviews.verified_buyer')}
                            </span>
                          )}
                        </div>
                        <div className="review-date">
                          {new Date(rev.created_at || Date.now()).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'), { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={16} 
                          fill={s <= rev.rating ? '#F6D365' : 'transparent'} 
                          stroke={s <= rev.rating ? '#D4AF37' : '#cbd5e1'} 
                        />
                      ))}
                    </div>
                  </div>

                  {rev.title && <h4 className="review-title">{rev.title}</h4>}
                  <p className="review-comment">{rev.comment}</p>

                  {/* Customer Photos Gallery */}
                  {(() => {
                    let photoList = [];
                    try {
                      photoList = typeof rev.images === 'string' ? JSON.parse(rev.images) : (rev.images || []);
                    } catch(e) {}

                    if (Array.isArray(photoList) && photoList.length > 0) {
                      return (
                        <div className="review-card-photos">
                          {photoList.map((pUrl, pIdx) => (
                            <div 
                              key={pIdx} 
                              className="review-customer-photo-wrapper"
                              onClick={() => setSelectedImage(pUrl)}
                              title={t('reviews.view_photo')}
                            >
                              <img src={pUrl} alt={`Customer photo ${pIdx + 1}`} className="review-customer-photo" />
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="review-card-footer">
                    <button 
                      className={`btn-helpful ${helpfulVoted[rev.id] ? 'voted' : ''}`}
                      onClick={() => handleHelpfulClick(rev.id)}
                      disabled={helpfulVoted[rev.id]}
                    >
                      <ThumbsUp size={14} /> 
                      {t('reviews.helpful')} ({rev.helpful_count || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>
    </main>
  );
};

export default ProductDetail;

