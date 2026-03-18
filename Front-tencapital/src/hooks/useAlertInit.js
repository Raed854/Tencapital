import { useEffect } from 'react';
import { setAlertContext } from '../utils/alertUtils';
import { useAlert } from '../contexts/AlertContext';

// Hook to initialize alert context for global alert() replacement
export const useAlertInit = () => {
  const alertContext = useAlert();
  
  useEffect(() => {
    setAlertContext(alertContext);
  }, [alertContext]);
  
  return alertContext;
};
