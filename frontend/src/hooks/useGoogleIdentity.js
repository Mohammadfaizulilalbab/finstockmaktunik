// ============================================
// Hook useGoogleIdentity — FinStocks
// ============================================
// Memuat script Google Identity Services dan melaporkan statusnya.

import { useEffect, useState } from 'react';
import { isGoogleEnabled, loadGoogleIdentityScript } from '../utils/googleIdentity';

/**
 * @returns {'disabled'|'loading'|'ready'|'error'}
 *   disabled → VITE_GOOGLE_CLIENT_ID belum diisi
 */
const useGoogleIdentity = () => {
  const [status, setStatus] = useState(isGoogleEnabled ? 'loading' : 'disabled');

  useEffect(() => {
    if (!isGoogleEnabled) return undefined;

    let aktif = true;
    loadGoogleIdentityScript()
      .then(() => aktif && setStatus('ready'))
      .catch(() => aktif && setStatus('error'));

    return () => {
      aktif = false;
    };
  }, []);

  return status;
};

export default useGoogleIdentity;
