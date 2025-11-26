import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all pages for better performance
const Landing = lazy(() => import('./pages/Landing/Landing'));
const UserPage = lazy(() => import('./pages/UserPage/UserPage'));
const UserFormPage = lazy(() => import('./pages/UserFormPage/UserFormPage'));
const UserApplicationDetail = lazy(() => import('./pages/UserApplicationDetail/UserApplicationDetail'));
const AdminDash = lazy(() => import('./pages/AdminDash/AdminDash'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail/ApplicationDetail'));

function App() {
  return (
    <ErrorBoundary>
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
              <Route path="/" element={<Landing />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/user/form" element={<UserFormPage />} />
              <Route path="/user/detail/:applicationId" element={<UserApplicationDetail />} />
              <Route path="/admin" element={<AdminDash />} />
              <Route path="/admin/detail/:applicationId" element={<ApplicationDetail />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
