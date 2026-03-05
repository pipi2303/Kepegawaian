import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  optimizeDeps: {
    // Daftar lengkap package yang dipakai - penting untuk loading cepat
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      'lucide-react',
      'sonner',
      // Recharts dan dependencies-nya (perlu di-prebundle)
      'recharts',
      'recharts/es6',
      // Radix UI yang benar-benar dipakai
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-slot',
      // Utilities
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'date-fns',
    ],
  },

  build: {
    // Target modern browsers untuk output lebih kecil
    target: 'es2020',
    
    // Minify dengan terser untuk hasil optimal
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Hapus console.log di production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Hapus console calls
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk vendor utama - React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router'],
          // Chunk terpisah untuk charts (besar, jarang berubah)
          'vendor-charts': ['recharts'],
          // Icons dalam chunk terpisah
          'vendor-icons': ['lucide-react'],
          // Radix UI components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
          ],
          // Utilities
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
        },
        
        // Optimasi nama file untuk better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
      
      // Tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    
    // Optimasi chunk size dan CSS
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemap di production untuk ukuran lebih kecil
    chunkSizeWarningLimit: 1000,
    
    // Reportkan compressed size untuk monitoring
    reportCompressedSize: true,
  },

  // Server config untuk development yang lebih cepat
  server: {
    fs: {
      // Batasi file system access untuk performa
      strict: true,
    },
  },
})