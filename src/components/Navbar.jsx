import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, ShoppingBag, Menu, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import './Navbar.css';

// Custom Jewelry SVG Icons
const DiamondIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill={color} fillOpacity="0.15" />
    <path d="M2 10h20" />
    <path d="M12 21L7.5 10 10 3" />
    <path d="M12 21l4.5-11L14 3" />
  </svg>
);

const RingIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="7" />
    <path d="M12 7l-2-3h4l-2 3z" fill={color} fillOpacity="0.25" />
    <path d="M9 4h6l2 3H7l2-3z" />
  </svg>
);

const NecklaceIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4c0 7 4 13 8 13s8-6 8-13" />
    <circle cx="12" cy="18" r="2.5" fill={color} fillOpacity="0.25" />
    <path d="M12 17v-1.5" />
  </svg>
);

const BraceletEarringIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="9" cy="13" rx="6" ry="7" />
    <circle cx="17" cy="8" r="3.5" />
    <path d="M17 4.5v1" />
  </svg>
);

const TrophyIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 3h16v6a8 8 0 0 1-16 0V3z" fill={color} fillOpacity="0.18" />
    <path d="M12 17v4M8 21h8" />
    <path d="M12 6.5l.6 1.3 1.4.2-1 1 .2 1.5-1.2-.7-1.2.7.2-1.5-1-1 1.4-.2.6-1.3z" fill={color} stroke="none" />
  </svg>
);

const GiftBoxIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="13" rx="2" fill={color} fillOpacity="0.15" />
    <path d="M12 8v13" />
    <path d="M3 13h18" />
    <path d="M12 8c-2-3-4.5-3-4.5-1.5S9.5 8 12 8z" fill={color} fillOpacity="0.3" />
    <path d="M12 8c2-3 4.5-3 4.5-1.5S14.5 8 12 8z" fill={color} fillOpacity="0.3" />
  </svg>
);

const CollectionsIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} fillOpacity="0.2" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} fillOpacity="0.2" />
  </svg>
);

const LayeringIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5c0 4 3 7 6 7s6-3 6-7" />
    <path d="M4 9c0 6 4 10.5 8 10.5s8-4.5 8-10.5" />
    <circle cx="12" cy="19.5" r="1.5" fill={color} />
  </svg>
);

const Navbar = ({ cartItemCount, onCartClick, showToast, currentPage, goToHome, goToShop, goToBundle, onProductClick, onSearch, currentUser, onAuthClick, onLogout, goToProfile, goToAdmin }) => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isParfumsMenuOpen, setIsParfumsMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    const handleScrollEvent = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScrollEvent);
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, []);

  const handleNavClick = (e, id, filter = '') => {
    if (e) e.preventDefault();
    setIsMobileDrawerOpen(false);
    if (currentPage !== 'home') {
      if (id === 'shop') {
        goToShop(filter);
      } else {
        goToHome();
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      if (id === 'shop') goToShop(filter);
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsParfumsMenuOpen(false); // Close menu on click
  };

  const handleBundleClick = (e) => {
    if (e) e.preventDefault();
    setIsMobileDrawerOpen(false);
    goToBundle();
  };

  return (
    <>
      <SearchDropdown 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSearch={onSearch}
        onProductClick={onProductClick}
        goToShop={goToShop}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div 
          className="mobile-drawer-overlay animate-fade-in" 
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Drawer Menu */}
      <div className={`mobile-drawer ${isMobileDrawerOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand" onClick={() => { setIsMobileDrawerOpen(false); goToHome(); }}>
            <span className="logo-main">AURA</span>
            <span className="logo-sub">[aura]</span>
          </div>
          <button 
            className="mobile-drawer-close-btn" 
            aria-label="Close Menu"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="mobile-drawer-body">
          {/* Quick Search Trigger */}
          <div 
            className="mobile-drawer-search" 
            onClick={() => { setIsMobileDrawerOpen(false); setIsSearchOpen(true); }}
          >
            <Search size={16} color="#777" />
            <span>{t('navbar.search_placeholder')}</span>
          </div>

          {/* Special Bundle Builder Promo Button */}
          <div 
            className="mobile-drawer-bundle-card"
            onClick={handleBundleClick}
          >
            <div className="bundle-card-badge">✨ {t('navbar.bundle')}</div>
            <p className="bundle-card-desc">Create your customized jewelry set & save up to 25%!</p>
          </div>

          {/* Navigation Links */}
          <div className="mobile-nav-group">
            <div className="mobile-group-title">{t('navbar.shop')}</div>
            
            <button 
              className="mobile-nav-link featured-link" 
              onClick={(e) => handleNavClick(e, 'shop')}
            >
              <div className="mobile-icon-box" style={{ background: '#fef3c7' }}>
                <DiamondIcon size={18} color="#d97706" />
              </div>
              <span>{t('navbar.shop_all')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>

            <button 
              className="mobile-nav-link" 
              onClick={(e) => handleNavClick(e, 'shop', 'rings')}
            >
              <div className="mobile-icon-box" style={{ background: '#fef9c3' }}>
                <RingIcon size={16} color="#ca8a04" />
              </div>
              <span>{t('navbar.rings')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>

            <button 
              className="mobile-nav-link" 
              onClick={(e) => handleNavClick(e, 'shop', 'necklaces')}
            >
              <div className="mobile-icon-box" style={{ background: '#dbeafe' }}>
                <NecklaceIcon size={16} color="#2563eb" />
              </div>
              <span>{t('navbar.necklaces')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>

            <button 
              className="mobile-nav-link" 
              onClick={(e) => handleNavClick(e, 'shop', 'bracelets')}
            >
              <div className="mobile-icon-box" style={{ background: '#d1fae5' }}>
                <BraceletEarringIcon size={16} color="#059669" />
              </div>
              <span>{t('navbar.bracelets')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>

            <button 
              className="mobile-nav-link" 
              onClick={(e) => handleNavClick(e, 'shop', 'bestsellers')}
            >
              <div className="mobile-icon-box" style={{ background: '#fef3c7' }}>
                <TrophyIcon size={16} color="#d97706" />
              </div>
              <span>{t('navbar.best_sellers')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>

            <button 
              className="mobile-nav-link" 
              onClick={(e) => handleNavClick(e, 'about')}
            >
              <div className="mobile-icon-box" style={{ background: '#ede9fe' }}>
                <CollectionsIcon size={16} color="#7c3aed" />
              </div>
              <span>{t('navbar.about')}</span>
              <ChevronRight size={16} color="#aaa" />
            </button>
          </div>

          {/* Account / Authentication Group */}
          <div className="mobile-nav-group">
            <div className="mobile-group-title">Account</div>
            {currentUser ? (
              <div className="mobile-user-card">
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    <User size={20} color="var(--color-accent)" />
                  </div>
                  <div>
                    <div className="mobile-user-name">{currentUser.name}</div>
                    <div className="mobile-user-email">{currentUser.email}</div>
                  </div>
                </div>
                <div className="mobile-user-actions">
                  <button 
                    className="mobile-action-btn"
                    onClick={() => { setIsMobileDrawerOpen(false); goToProfile(); }}
                  >
                    👤 {t('navbar.profile')}
                  </button>
                  {currentUser?.is_admin === 1 && (
                    <button 
                      className="mobile-action-btn admin-btn"
                      onClick={() => { setIsMobileDrawerOpen(false); goToAdmin(); }}
                    >
                      🛡️ {t('navbar.admin')}
                    </button>
                  )}
                  <button 
                    className="mobile-action-btn logout-btn"
                    onClick={() => { setIsMobileDrawerOpen(false); onLogout(); }}
                  >
                    🚪 {t('navbar.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="mobile-login-btn"
                onClick={() => { setIsMobileDrawerOpen(false); onAuthClick(); }}
              >
                <User size={18} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          {/* Language Selector */}
          <div className="mobile-nav-group">
            <div className="mobile-group-title">Language</div>
            <div className="mobile-lang-grid">
              <button 
                className={`mobile-lang-btn ${(i18n.language?.substring(0, 2) === 'en') ? 'active' : ''}`}
                onClick={() => { i18n.changeLanguage('en'); setIsMobileDrawerOpen(false); }}
              >
                🇬🇧 English
              </button>
              <button 
                className={`mobile-lang-btn ${(i18n.language?.substring(0, 2) === 'fr') ? 'active' : ''}`}
                onClick={() => { i18n.changeLanguage('fr'); setIsMobileDrawerOpen(false); }}
              >
                🇫🇷 Français
              </button>
              <button 
                className={`mobile-lang-btn ${(i18n.language?.substring(0, 2) === 'ar') ? 'active' : ''}`}
                onClick={() => { i18n.changeLanguage('ar'); setIsMobileDrawerOpen(false); }}
              >
                🇲🇦 العربية
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <nav className={`dossier-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="dossier-nav-container">
          
          <div className="d-nav-left">
            <button 
              className="d-pill-btn mobile-menu" 
              aria-label="Menu" 
              onClick={() => setIsMobileDrawerOpen(true)}
            >
              <Menu size={18} strokeWidth={2} />
            </button>
            <div 
              className="d-nav-item-container"
              onMouseEnter={() => setIsParfumsMenuOpen(true)}
              onMouseLeave={() => setIsParfumsMenuOpen(false)}
            >
              <button className="d-pill-btn desktop-only" onClick={(e) => handleNavClick(e, 'shop')}>
                {t('navbar.shop')} <ChevronDown size={14} strokeWidth={2} />
              </button>
              
              {isParfumsMenuOpen && (
                <div className="mega-menu animate-fade-in">
                  <div className="mega-menu-content">
                    <div className="mega-menu-featured" onClick={(e) => handleNavClick(e, 'shop')}>
                      <div className="mega-icon-box" style={{ background: '#fef3c7' }}>
                        <DiamondIcon size={20} color="#d97706" />
                      </div>
                      <span style={{ fontWeight: 'bold' }}>{t('navbar.shop_all')}</span>
                    </div>

                    <div className="mega-section">
                      <h4>{t('navbar.shop_category')}</h4>
                      <ul>
                        <li onClick={(e) => handleNavClick(e, 'shop', 'rings')}>
                          <div className="mega-icon-box" style={{ background: '#fef9c3' }}>
                            <RingIcon size={16} color="#ca8a04" />
                          </div>
                          <span>{t('navbar.rings')}</span>
                        </li>
                        <li onClick={(e) => handleNavClick(e, 'shop', 'necklaces')}>
                          <div className="mega-icon-box" style={{ background: '#dbeafe' }}>
                            <NecklaceIcon size={16} color="#2563eb" />
                          </div>
                          <span>{t('navbar.necklaces')}</span>
                        </li>
                        <li onClick={(e) => handleNavClick(e, 'shop', 'bracelets')}>
                          <div className="mega-icon-box" style={{ background: '#d1fae5' }}>
                            <BraceletEarringIcon size={16} color="#059669" />
                          </div>
                          <span>{t('navbar.bracelets')}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mega-section">
                      <h4>{t('navbar.more_ways')}</h4>
                      <ul>
                        <li onClick={(e) => handleNavClick(e, 'shop', 'bestsellers')}>
                          <div className="mega-icon-box" style={{ background: '#fef3c7' }}>
                            <TrophyIcon size={16} color="#d97706" />
                          </div>
                          <span>{t('navbar.best_sellers')}</span>
                        </li>
                        <li onClick={(e) => handleNavClick(e, 'shop', 'new arrivals')}>
                          <div className="mega-icon-box" style={{ background: '#ede9fe' }}>
                            <GiftBoxIcon size={16} color="#7c3aed" />
                          </div>
                          <span>{t('navbar.new_arrivals')}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mega-section">
                      <h4>{t('navbar.discover')}</h4>
                      <ul className="mega-list-discover">
                        <li onClick={(e) => handleNavClick(e, 'shop')}>
                          <div className="mega-icon-box" style={{ background: '#ccfbf1' }}>
                            <CollectionsIcon size={16} color="#0d9488" />
                          </div>
                          <span>{t('navbar.collections')}</span>
                          <ChevronRight size={14} color="#999" style={{ marginLeft: 'auto' }} />
                        </li>
                        <li onClick={(e) => handleNavClick(e, 'shop')}>
                          <div className="mega-icon-box" style={{ background: '#ffe4e6' }}>
                            <LayeringIcon size={16} color="#e11d48" />
                          </div>
                          <span>{t('navbar.layering')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="d-pill-btn d-text-orange desktop-only" onClick={handleBundleClick}>
              {t('navbar.bundle')}
            </button>
          </div>

          <div className="d-nav-center">
            <a href="/" className="d-brand-pill custom-logo" onClick={(e) => { e.preventDefault(); goToHome(); }}>
              <div className="logo-main">AURA</div>
              <div className="logo-sub">[aura]</div>
            </a>
          </div>

          <div className="d-nav-right">
            <button className="d-pill-btn desktop-only" onClick={(e) => handleNavClick(e, 'about')}>
              {t('navbar.about')} <ChevronDown size={14} strokeWidth={2} />
            </button>
            
            <div className="d-pill-search desktop-only" onClick={() => setIsSearchOpen(true)}>
              <span className="search-placeholder">{t('navbar.search_placeholder')}</span>
              <div className="search-circle">
                <Search size={12} strokeWidth={3} color="white" />
              </div>
            </div>

            <div className="d-pill-icons">
              <button className="d-icon-wrapper" aria-label="Cart" onClick={onCartClick}>
                <ShoppingBag size={18} strokeWidth={1.5} color="#333" />
                {cartItemCount > 0 && (
                  <span className="d-cart-badge">
                    {cartItemCount}
                  </span>
                )}
              </button>
              
              {currentUser ? (
                <div 
                  className="d-profile-menu-container"
                  onMouseEnter={() => setIsProfileMenuOpen(true)}
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                  <button className="d-icon-wrapper" aria-label="Profile" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                    <User size={18} strokeWidth={1.5} color="#333" />
                  </button>
                  {isProfileMenuOpen && (
                    <div className="d-profile-dropdown">
                      <div className="d-profile-header">
                        <p>{t('navbar.hi_name', { name: currentUser.name })}</p>
                      </div>
                      <button onClick={() => { setIsProfileMenuOpen(false); goToProfile(); }}>{t('navbar.profile')}</button>
                      {currentUser?.is_admin === 1 && (
                        <button onClick={() => { setIsProfileMenuOpen(false); goToAdmin(); }}>{t('navbar.admin')}</button>
                      )}
                      <button onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}>{t('navbar.logout')}</button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="d-icon-wrapper" aria-label="Login" onClick={onAuthClick}>
                  <User size={18} strokeWidth={1.5} color="#333" />
                </button>
              )}

              <div 
                className="d-nav-item-container d-profile-menu-container"
                onMouseEnter={() => setIsLangMenuOpen(true)}
                onMouseLeave={() => setIsLangMenuOpen(false)}
                style={{ marginLeft: '10px' }}
              >
                <button 
                  className="d-icon-wrapper" 
                  onClick={() => {
                    const current = i18n.language?.substring(0, 2) || 'en';
                    const next = current === 'en' ? 'fr' : current === 'fr' ? 'ar' : 'en';
                    i18n.changeLanguage(next);
                  }}
                  style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Globe size={18} strokeWidth={1.5} color="#333" />
                  <span style={{ textTransform: 'uppercase' }}>{(i18n.language?.substring(0, 2) || 'en').toUpperCase()}</span>
                </button>

                {isLangMenuOpen && (
                  <div className="d-profile-dropdown" style={{ minWidth: '100px', padding: '0.4rem 0', right: 0 }}>
                    <button 
                      onClick={() => { i18n.changeLanguage('en'); setIsLangMenuOpen(false); }} 
                      style={{ fontWeight: (i18n.language?.substring(0, 2) === 'en') ? 'bold' : 'normal', padding: '0.5rem 0.8rem', color: (i18n.language?.substring(0, 2) === 'en') ? 'var(--color-accent)' : '#555' }}
                    >
                      🇬🇧 English
                    </button>
                    <button 
                      onClick={() => { i18n.changeLanguage('fr'); setIsLangMenuOpen(false); }} 
                      style={{ fontWeight: (i18n.language?.substring(0, 2) === 'fr') ? 'bold' : 'normal', padding: '0.5rem 0.8rem', color: (i18n.language?.substring(0, 2) === 'fr') ? 'var(--color-accent)' : '#555' }}
                    >
                      🇫🇷 Français
                    </button>
                    <button 
                      onClick={() => { i18n.changeLanguage('ar'); setIsLangMenuOpen(false); }} 
                      style={{ fontWeight: (i18n.language?.substring(0, 2) === 'ar') ? 'bold' : 'normal', padding: '0.5rem 0.8rem', color: (i18n.language?.substring(0, 2) === 'ar') ? 'var(--color-accent)' : '#555' }}
                    >
                      🇲🇦 العربية
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
