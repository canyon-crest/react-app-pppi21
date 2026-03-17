import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // forceRefresh: true ensures we always read the latest claims
      // This matters after setAdminClaim is called on a logged-in user
      const tokenResult = await user.getIdTokenResult(true);
      setIsAdmin(tokenResult.claims.admin === true);
    });

    return () => unsubscribe();
  }, []);

  return isAdmin;
}

export default useAdmin;