import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`toast ${isVisible ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
