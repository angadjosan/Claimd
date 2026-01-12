import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, KeyRound, ChevronDown, Mail } from 'lucide-react';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';
import './MinimalNavbar.css';

// Ensure BASE_URL always has a protocol to prevent relative URL issues
const getBaseUrl = () => {
  const url = import.meta.env.VITE_BASE_URL || 'http://localhost:5190';
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const BASE_URL = getBaseUrl();

export default function MinimalNavbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user email
    authService.getUser().then((user) => {
      setUserEmail(user?.email || null);
      setIsLoading(false);
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!userEmail) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) throw error;
      
      alert('Password reset email sent! Please check your inbox.');
      setIsDropdownOpen(false);
    } catch (error: any) {
      alert(error.message || 'Failed to send password reset email');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/30 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <a 
            href={BASE_URL}
            className="text-xl font-weight: 1400; tracking-wide gradient-text italic"
          >
            Claimd
          </a>
          <div className="flex items-center space-x-8">
            <a 
              href={BASE_URL}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Home
            </a>
            <Link 
              to="/dashboard" 
              className="text-sm text-gray-900 border border-gray-900 px-4 py-2 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200"
            >
              Dashboard
            </Link>
            
            {/* Profile Dropdown */}
            {!isLoading && userEmail && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Email */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                      </div>
                    </div>

                    {/* Reset Password */}
                    <button
                      onClick={handleResetPassword}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Reset Password</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

