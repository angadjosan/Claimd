import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth';
import MinimalNavbar from '../../components/MinimalNavbar';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userInfo = await authService.verifyToken();
      if (userInfo) {
        navigate('/user');
      }
    };
    checkAuth();
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push("Name is required");
    }

    if (!formData.email.trim()) {
      newErrors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push("Please enter a valid email address");
    }

    if (!formData.password) {
      newErrors.push("Password is required");
    } else if (formData.password.length < 8) {
      newErrors.push("Password must be at least 8 characters long");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push("Passwords do not match");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      await authService.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // After successful signup, redirect to user dashboard
      navigate("/user");
    } catch (error: any) {
      console.error("Signup error:", error);
      setErrors([error.message || "Failed to create account. Please try again."]);
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
              Create Account
            </h1>
            <p className="text-gray-600 font-light">
              Sign up to access your disability benefits dashboard
            </p>
          </div>

          {/* Form */}
          <div className="bg-white border border-gray-300 p-8">
            {errors.length > 0 && (
              <div className="mb-6 border border-red-300 bg-red-50 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800 font-light">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder="Enter your email"
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
                  placeholder="Create a password (min. 8 characters)"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition-all duration-200 font-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-light">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-gray-900 hover:underline font-normal"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
