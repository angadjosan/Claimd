import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import RootRedirect from './components/RootRedirect';
import InitAndRedirect from './components/InitAndRedirect';
import { ToastProvider } from './components/Toast';
import { FormProvider } from './context/FormContext';
import { DemoProvider } from './context/DemoContext';

// Lazy load all pages for better performance
const AuthPage = lazy(() => import('./pages/Auth/Auth'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DemoForm = lazy(() => import('./pages/Demo/DemoForm'));
const DemoDashboard = lazy(() => import('./pages/Demo/DemoDashboard'));

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
              <Route path="/dashboard" element={<InitAndRedirect />} />
              <Route path="/apply" element={<InitAndRedirect />} />
              {/* Demo routes - wrapped with DemoProvider */}
              <Route 
                path="/demo" 
                element={
                  <DemoProvider>
                    <FormProvider>
                      <DemoForm />
                    </FormProvider>
                  </DemoProvider>
                } 
              />
              <Route 
                path="/demo/dashboard" 
                element={
                  <DemoProvider>
                    <DemoDashboard />
                  </DemoProvider>
                } 
              />
              <Route path="*" element={<NotFound />} />
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
