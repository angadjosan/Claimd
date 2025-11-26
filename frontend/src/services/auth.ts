import { config } from '../config/env';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface LoginCredentials {
  user_id: string;
  password?: string;
}

export interface AdminLoginCredentials {
  admin_id: string;
  admin_key: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  is_admin: boolean;
}

export interface UserInfo {
  user_id: string;
  is_admin: boolean;
  email?: string;
  name?: string;
}

class AuthService {
  /**
   * Login as a regular user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.access_token);
    this.setUserInfo({
      user_id: data.user_id,
      is_admin: data.is_admin,
    });

    return data;
  }

  /**
   * Login as an admin
   */
  async adminLogin(credentials: AdminLoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${config.apiUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Admin login failed' }));
      throw new Error(error.detail || 'Admin login failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.access_token);
    this.setUserInfo({
      user_id: data.user_id,
      is_admin: data.is_admin,
    });

    return data;
  }

  /**
   * Verify the current token
   */
  async verifyToken(): Promise<UserInfo | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      if (data.valid) {
        const userInfo: UserInfo = {
          user_id: data.user_id,
          is_admin: data.is_admin,
          email: data.email,
        };
        this.setUserInfo(userInfo);
        return userInfo;
      }

      this.logout();
      return null;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  /**
   * Logout and clear all auth data
   */
  logout(): void {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
    // Also remove old userData cookie if it exists
    Cookies.remove('userData');
  }

  /**
   * Get the current auth token
   */
  getToken(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  }

  /**
   * Set the auth token
   */
  private setToken(token: string): void {
    Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days
  }

  /**
   * Get current user info
   */
  getUserInfo(): UserInfo | null {
    const userStr = Cookies.get(USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Set user info
   */
  private setUserInfo(userInfo: UserInfo): void {
    Cookies.set(USER_KEY, JSON.stringify(userInfo), { expires: 7 });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const userInfo = this.getUserInfo();
    return userInfo?.is_admin || false;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
