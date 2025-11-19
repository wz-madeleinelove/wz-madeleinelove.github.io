// src/components/RequireAdmin.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/firebaseAuth';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

function RequireAdmin({ children }) {
  const [isLoading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const token = await getIdTokenResult(user);
      setIsAdmin(token.claims.isAdmin === true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) return <div>로딩 중...</div>;
  if (!isAdmin) return <Navigate to="/admin-login" replace />;
  return children;
}

export default RequireAdmin;