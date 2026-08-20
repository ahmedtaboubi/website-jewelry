import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLogin, showToast, defaultView, defaultToken }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setResetToken(defaultToken || '');
      setView(defaultView || 'login');
    }
  }, [isOpen, defaultToken, defaultView]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (view === 'forgot') {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to send reset link');
        } else {
          showToast(data.message || 'Please check your email for the reset link.');
          setView('login');
        }
      } catch (err) {
        setError(t('auth.network_error'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (view === 'reset') {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to reset password');
        } else {
          showToast(data.message || 'Password reset successfully');
          setView('login');
        }
      } catch (err) {
        setError(t('auth.network_error'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const isLogin = view === 'login';
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { name, email, phone, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.auth_failed'));
        return;
      }

      // Success
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      onLogin(data.user);
      showToast(isLogin ? t('auth.welcome_back_name', { name: data.user.name }) : t('auth.account_created'));
      onClose();

      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      
    } catch (err) {
      console.error(err);
      setError(t('auth.network_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === 'login' ? 'register' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  let title, subtitle, submitText;
  if (view === 'login') {
    title = t('auth.welcome_back');
    subtitle = t('auth.login_subtitle');
    submitText = t('auth.sign_in');
  } else if (view === 'register') {
    title = t('auth.create_account');
    subtitle = t('auth.register_subtitle');
    submitText = t('auth.create_account');
  } else if (view === 'forgot') {
    title = t('auth.forgot_password');
    subtitle = t('auth.forgot_subtitle');
    submitText = t('auth.send_reset_link');
  } else if (view === 'reset') {
    title = t('auth.reset_password');
    subtitle = t('auth.reset_subtitle');
    submitText = t('auth.set_new_password');
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal animate-fade-up">
        <button className="icon-btn auth-close-btn" onClick={onClose} aria-label="Close">
          <X size={24} strokeWidth={1.5} />
        </button>

        <div className="auth-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {error && (
          <div className="auth-error animate-fade-in">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {view === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">{t('auth.full_name')}</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="auth-name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.name_placeholder')}
                  required={view === 'register'}
                />
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-phone">{t('auth.phone')}</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input 
                  type="tel" 
                  id="auth-phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.phone_placeholder')}
                />
              </div>
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'forgot') && (
            <div className="form-group">
              <label htmlFor="auth-email">{t('auth.email')}</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  id="auth-email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  required
                />
              </div>
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'reset') && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="auth-password">{view === 'reset' ? t('auth.new_password') : t('auth.password')}</label>
                {view === 'login' && (
                  <button 
                    type="button" 
                    className="forgot-password-link" 
                    onClick={() => setView('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {t('auth.forgot_password')}
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="auth-password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={view === 'reset' ? t('auth.new_password_placeholder') : "••••••••"}
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? t('auth.please_wait') : submitText}
          </button>
        </form>

        <div className="auth-footer">
          {(view === 'login' || view === 'register') && (
            <p>
              {view === 'login' ? t('auth.no_account') : t('auth.has_account')}
              <button type="button" className="auth-toggle-btn" onClick={toggleView}>
                {view === 'login' ? t('auth.sign_up') : t('auth.log_in')}
              </button>
            </p>
          )}
          {(view === 'forgot' || view === 'reset') && (
            <p>
              <button type="button" className="auth-toggle-btn" onClick={() => setView('login')} style={{ marginLeft: 0 }}>
                {t('auth.back_to_login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
