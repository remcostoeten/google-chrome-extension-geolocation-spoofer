import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/index';
import NotFound from './pages/not-found';
import PrivacyPolicy from './pages/privacy-policy';
import React, { Suspense, lazy } from 'react';

const queryClient = new QueryClient();

const LazyIndex = lazy(() => import('./pages/index'));
const LazyNotFound = lazy(() => import('./pages/not-found'));
const LazyPrivacyPolicy = lazy(() => import('./pages/privacy-policy'));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <LazyIndex />
              </Suspense>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <LazyPrivacyPolicy />
              </Suspense>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route
            path="*"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <LazyNotFound />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
