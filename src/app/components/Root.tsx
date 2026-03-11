import React, { Suspense, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppProvider } from '../context/AppContext';

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

  useEffect(() => {
    // Redirect ke dashboard setiap kali aplikasi di-refresh (load pertama kali)
    // Kecuali user ada di halaman login
    const isFirstLoad = !window.sessionStorage.getItem('hr_app_loaded');
    
    if (isFirstLoad && location.pathname !== '/login') {
      window.sessionStorage.setItem('hr_app_loaded', 'true');
      navigate('/', { replace: true });
    }
  }, [navigate, location.pathname]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat HCMS...</p>
          </div>
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}