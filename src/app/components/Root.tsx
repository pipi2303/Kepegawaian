import React, { Suspense, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppProvider, useAppContext } from '../context/AppContext';

/**
 * Root – komponen layout tanpa path (pathless layout route).
 * Menyediakan AppProvider (global state) untuk SEMUA child routes,
 * sehingga useNavigate() di Layout dan useAppContext() di setiap halaman
 * sama-sama tersedia dalam satu konteks Router yang sama.
 */
export default function Root() {
  return (
    <AppProvider>
      <RootContent />
      <Toaster position="top-right" richColors closeButton />
    </AppProvider>
  );
}

function RootContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAppContext();

  useEffect(() => {
    // Jika user sudah login (dari localStorage) dan berada di /login, redirect ke dashboard
    if (isLoggedIn && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
    // Jika user belum login dan BUKAN di /login, redirect ke login
    if (!isLoggedIn && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#013E37] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat HCMS...</p>
          </div>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}