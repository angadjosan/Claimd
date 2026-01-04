import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import { ToastProvider } from './components/Toast';
import { FormProvider } from './context/FormContext';

// Lazy load all pages for better performance
const AuthPage = lazy(() => import('./pages/Auth/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const UserFormPage = lazy(() => import('./pages/UserFormPage/UserFormPage'));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
      <FormProvider>
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
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/apply" element={
                <ProtectedRoute>
                  <UserFormPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </Router>
      </FormProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
