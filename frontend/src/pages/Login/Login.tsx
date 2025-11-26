import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth';
import MinimalNavbar from '../../components/MinimalNavbar';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const userInfo = await authService.verifyToken();
      if (userInfo) {
        // User is already logged in, redirect to appropriate page
        if (userInfo.is_admin) {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    try {
      if (isAdminLogin) {
        // Admin login
        await authService.adminLogin({
          email: formData.username.trim(),
          password: formData.password.trim(),
        });

        // Navigate to admin dashboard
        navigate("/admin");
      } else {
        // Regular user login
        await authService.login({
          user_id: formData.username.trim(),
          password: formData.password.trim(),
        });

        // Navigate to user dashboard
        navigate("/user");
      }
      
      setFormData({ username: "", password: "" });
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-thin text-gray-900 mb-2">
              Sign In
            </h1>
            <p className="text-gray-600 font-light mb-4">
              Access your disability benefits dashboard
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsAdminLogin(false)}
                className={`px-4 py-2 text-sm font-light transition-all ${
                  !isAdminLogin
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                User Login
              </button>
              <button
                type="button"
                onClick={() => setIsAdminLogin(true)}
                className={`px-4 py-2 text-sm font-light transition-all ${
                  isAdminLogin
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Caseworker Login
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-gray-300 p-8">
            {loginError && (
              <div className="mb-6 border border-red-300 bg-red-50 p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-light">{loginError}</p>
              </div>
            )}
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  {isAdminLogin ? "Caseworker Email" : "Email"}
                </label>
                <input
                  type="email"
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder={isAdminLogin ? "Enter caseworker email" : "Enter your email"}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition-all duration-200 font-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {!isAdminLogin && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 font-light">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-gray-900 hover:underline font-normal"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
