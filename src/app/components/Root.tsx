import React, { Suspense } from 'react';
import { Outlet } from 'react-router';
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
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Memuat HR APP...</p>
            </div>
          </div>
        }
      >
        <Outlet />
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </AppProvider>
  );
}
