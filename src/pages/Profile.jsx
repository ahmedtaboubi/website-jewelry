import { useState, useEffect } from 'react';
import { Package, User as UserIcon, Mail, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import './Profile.css';

const Profile = ({ currentUser, onLogout, onUpdateProfile, showToast }) => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        zipCode: currentUser.zipCode || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const fetchOrders = async () => {
        try {
          const response = await fetch(`/api/orders/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          });
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          showToast(t('profile.failed_to_load'));
        } finally {
          setIsLoadingOrders(false);
        }
      };
      
      fetchOrders();
    }
  }, [currentUser, showToast]);

  if (!currentUser) {
    return (
      <div className="profile-page container">
        <div className="profile-empty-state">
          <h2>{t('profile.please_login')}</h2>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)
      ? new Date(dateString.replace(' ', 'T') + 'Z')
      : new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString(undefined, options);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const success = await onUpdateProfile(editForm);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="container profile-container">
        
        {/* Sidebar / User Info */}
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <UserIcon size={48} strokeWidth={1} color="var(--color-accent)" />
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ width: '100%', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder={t('profile.full_name_placeholder')} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder={t('profile.phone_placeholder')} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder={t('profile.address_placeholder')} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} placeholder={t('profile.city_placeholder')} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input type="text" value={editForm.zipCode} onChange={e => setEditForm({...editForm, zipCode: e.target.value})} placeholder={t('profile.zip_placeholder')} style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>{t('profile.cancel')}</button>
                <button type="submit" style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: 'none', background: 'var(--color-accent)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>{t('profile.save')}</button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="profile-name">{currentUser.name}</h2>
              <p className="profile-email"><Mail size={14} /> {currentUser.email}</p>
              {currentUser.phone && (
                <p className="profile-email" style={{ marginTop: '-1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
                  <span style={{ marginLeft: '0.3rem' }}>{currentUser.phone}</span>
                </p>
              )}
              
              <div className="profile-details-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{t('profile.account_details')}</h3>
                  <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('profile.edit')}</button>
                </div>
                <div className="profile-detail-item">
                  <MapPin size={16} />
                  <div>
                    <p className="detail-label">{t('profile.shipping_address')}</p>
                    <p className="detail-value">
                      {currentUser.address ? (
                        <>
                          {currentUser.address}<br/>
                          {currentUser.city}{currentUser.zipCode ? `, ${currentUser.zipCode}` : ''}
                        </>
                      ) : (
                        t('profile.not_provided')
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="btn-secondary logout-btn" onClick={onLogout}>
                {t('profile.log_out')}
              </button>
            </>
          )}
        </div>

        {/* Main Content / Order History */}
        <div className="profile-main">
          <div className="profile-section-header">
            <h2><Package size={24} /> {t('profile.order_history')}</h2>
          </div>

          {isLoadingOrders ? (
            <div className="orders-loading">{t('profile.loading_orders')}</div>
          ) : orders.length === 0 ? (
            <div className="no-orders-state">
              <Package size={48} strokeWidth={1} color="#ccc" />
              <h3>{t('profile.no_orders')}</h3>
              <p>{t('profile.no_orders_desc')}</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-id">{t('profile.order_number')}{order.id}</span>
                      <span className="order-date"><Calendar size={14} /> {formatDate(order.created_at)}</span>
                    </div>
                    <div className="order-status-total">
                      <span className={`order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                      <span className="order-total">{formatCurrency(order.total, i18n.language)}</span>
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-item-row">
                        <img src={item.product_image} alt={item.product_name} className="order-item-image" />
                        <div className="order-item-details">
                          <h4>{item.product_name}</h4>
                          <p>{t('profile.qty')} {item.quantity}</p>
                        </div>
                        <div className="order-item-price">
                          {formatCurrency(item.price, i18n.language)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Calculation Breakdown */}
                  <div className="order-calculation" style={{ padding: '1rem', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#666', fontSize: '0.9rem' }}>
                      <span>{t('profile.subtotal')}</span>
                      <span>{formatCurrency(order.subtotal || order.total, i18n.language)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: order.discount_amount > 0 ? '#e64a19' : '#666', fontSize: '0.9rem', fontWeight: '500' }}>
                      <span>{t('profile.bundle_discount', { percent: order.discount_percent || 0 })}</span>
                      <span>{formatCurrency(order.discount_amount || 0, i18n.language, true)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #ddd', fontWeight: 'bold', color: '#000' }}>
                      <span>{t('profile.final_total')}</span>
                      <span>{formatCurrency(order.total, i18n.language)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
