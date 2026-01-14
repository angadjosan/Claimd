import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import InitAndRedirect from './components/InitAndRedirect';
import { ToastProvider } from './components/Toast';
import { DemoProvider } from './context/DemoContext';

// Lazy load all pages for better performance
const AuthPage = lazy(() => import('./pages/Auth/Auth'));
const ApplicationDetail = lazy(() => import('./pages/Dashboard/ApplicationDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DemoDashboard = lazy(() => import('./pages/Demo/DemoDashboard'));
const DemoApplicationDetail = lazy(() => import('./pages/Demo/DemoApplicationDetail'));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
      <Router>
        <div className="App">
          <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600 font-light">Loading...</span>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/dashboard"
                element={<InitAndRedirect />}
              />
              <Route
                path="/dashboard/applications/:id"
                element={
                  <ProtectedRoute>
                    <ApplicationDetail />
                  </ProtectedRoute>
                }
              />
              {/* Demo routes - wrapped with DemoProvider */}
              <Route 
                path="/demo/caseworker/dashboard" 
                element={
                  <DemoProvider>
                    <DemoDashboard />
                  </DemoProvider>
                } 
              />
              <Route 
                path="/demo/caseworker/dashboard/applications/:id" 
                element={
                  <DemoProvider>
                    <DemoApplicationDetail />
                  </DemoProvider>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

