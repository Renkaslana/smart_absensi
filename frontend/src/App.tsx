import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { loadFaceApiModels } from './utils/livenessDetection';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // 🌙 Load face-api.js models on app initialization
  useEffect(() => {
    const initModels = async () => {
      try {
        console.log('[App] Loading face-api.js models...');
        await loadFaceApiModels();
        setModelsLoaded(true);
        console.log('[App] ✅ Face-api.js models loaded successfully');
      } catch (error) {
        console.error('[App] ❌ Failed to load face-api.js models:', error);
        setModelsError('Gagal memuat model face detection. Fitur liveness detection tidak tersedia.');
      }
    };

    initModels();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Show loading indicator while models are loading */}
      {!modelsLoaded && !modelsError && (
        <div className="fixed inset-0 bg-primary-900 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4"></div>
            <p className="text-neutral-100 font-medium">Memuat model face detection...</p>
            <p className="text-neutral-400 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      {/* Show error if models failed to load */}
      {modelsError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg px-4 py-3 max-w-md">
            <p className="text-sm text-warning-800 dark:text-warning-200">
              ⚠️ {modelsError}
            </p>
          </div>
        </div>
      )}

      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
