import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            toggleTheme();
            break;
        }
        return;
      }

      // F-key navigation
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          navigate('/dashboard');
          break;
        case 'F2':
          e.preventDefault();
          navigate('/orders');
          break;
        case 'F3':
          e.preventDefault();
          navigate('/tables');
          break;
        case 'F4':
          e.preventDefault();
          navigate('/kitchen');
          break;
        case 'F5':
          e.preventDefault();
          navigate('/inventory');
          break;
        case 'F6':
          e.preventDefault();
          navigate('/menu-management');
          break;
        case 'F7':
          e.preventDefault();
          navigate('/order-history');
          break;
        case 'F8':
          e.preventDefault();
          navigate('/customers');
          break;
        case 'Escape':
          // Close any open dialogs — handled natively by radix
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, toggleTheme]);
}
