import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load all pages for better performance
const Landing = lazy(() => import('./pages/Landing/Landing'));
const Login = lazy(() => import('./pages/Login/Login'));
const Signup = lazy(() => import('./pages/Signup/Signup'));
const UserPage = lazy(() => import('./pages/UserPage/UserPage'));
const UserFormPage = lazy(() => import('./pages/UserFormPage/UserFormPage'));
const UserApplicationDetail = lazy(() => import('./pages/UserApplicationDetail/UserApplicationDetail'));

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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/user" element={
                <ProtectedRoute>
                  <UserPage />
                </ProtectedRoute>
              } />
              <Route path="/user/form" element={
                <ProtectedRoute>
                  <UserFormPage />
                </ProtectedRoute>
              } />
              <Route path="/user/detail/:applicationId" element={
                <ProtectedRoute>
                  <UserApplicationDetail />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
