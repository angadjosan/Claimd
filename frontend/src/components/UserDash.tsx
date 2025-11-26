import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Plus, LogOut } from "lucide-react";
import { authService } from '../services/auth';
import { config } from '../config/env';

interface UserData {
  name: string;
  user_id: string;
}

interface Application {
  application_id: string;
  documents?: {
    document_id: string;
    filename: string;
    content_type: string;
  };
  document?: string; // Base64 encoded
  claude_confidence_level: number;
  claude_summary: string;
  claude_recommendation: string;
  admin_status?: string;
  admin_notes?: string;
  status_updated_at?: string;
  human_final?: boolean;
  final_decision?: string;
}

interface DatabaseUser {
  name: string;
  user_id: string;
  applications: Application[];
}

export default function UserDash() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [databaseUser, setDatabaseUser] = useState<DatabaseUser | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const navigate = useNavigate();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getAdminStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "DENIED":
        return "text-red-600 bg-red-50 border-red-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "UNDER_REVIEW":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAdminStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "DENIED":
        return <XCircle className="w-4 h-4" />;
      case "PENDING":
      case "UNDER_REVIEW":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getFinalDecisionStatus = (app: Application) => {
    if (app.human_final && app.final_decision) {
      if (app.final_decision.toUpperCase() === "APPROVE") {
        return "Approved";
      } else if (app.final_decision.toUpperCase() === "REJECT") {
        return "Rejected";
      }
    }
    return "Unreviewed";
  };

  const getFinalDecisionColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-700 bg-green-100 border-green-300";
      case "Rejected":
        return "text-red-700 bg-red-100 border-red-300";
      case "Unreviewed":
        return "text-gray-700 bg-gray-100 border-gray-300";
      default:
        return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  const getFinalDecisionIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-5 h-5" />;
      case "Rejected":
        return <XCircle className="w-5 h-5" />;
      case "Unreviewed":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const fetchUserApplications = async (userId: string) => {
    try {
      // Fetch applications for this user using their user_id
      const appResponse = await fetch(
        `${config.apiUrl}/api/user/applications/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeader(),
          },
        }
      );

      if (appResponse.ok) {
        const appResult = await appResponse.json();

        if (appResult.data.success && appResult.data.user) {
          // Map backend data to frontend format
          const mappedApplications = appResult.data.applications.map(
            (app: any) => {
              // Convert backend recommendation format to frontend format
              const backendDecision =
                app.final_decision || app.claude_recommendation || "";
              let recommendation = "further_review"; // default

              if (backendDecision.toUpperCase() === "APPROVE") {
                recommendation = "approve";
              } else if (
                backendDecision.toUpperCase() === "REJECT" ||
                backendDecision.toUpperCase() === "DENY"
              ) {
                recommendation = "deny";
              } else if (backendDecision.toUpperCase() === "FURTHER REVIEW") {
                recommendation = "further_review";
              }

              return {
                application_id: app.application_id,
                documents: app.documents || [],
                claude_confidence_level: app.claude_confidence_level,
                claude_summary: app.claude_summary,
                claude_recommendation: recommendation,
                admin_status: app.admin_status,
                admin_notes: app.admin_notes,
                status_updated_at: app.status_updated_at,
                human_final: app.human_final,
                final_decision: app.final_decision,
              };
            }
          );

          return {
            name: appResult.data.user.name,
            user_id: appResult.data.user.user_id,
            applications: mappedApplications,
          };
        } else {
          throw new Error("Invalid API response");
        }
      } else {
        throw new Error("API response not ok");
      }
    } catch (error) {
      return null;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    try {
      if (isAdminLogin) {
        // Admin login
        await authService.adminLogin({
          admin_id: formData.username.trim(),
          admin_key: formData.password.trim(),
        });

        // Navigate to admin dashboard
        navigate("/admin");
      } else {
        // Regular user login
        const response = await authService.login({
          user_id: formData.username.trim(),
          password: formData.password.trim(),
        });

        // Set user data and fetch applications
        const userData = {
          name: response.user_id,
          user_id: response.user_id,
        };
        setUserData(userData);

        // Fetch user applications
        const userApplications = await fetchUserApplications(response.user_id);
        if (userApplications) {
          setDatabaseUser(userApplications);
        }
      }
      
      setFormData({ username: "", password: "" });
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Invalid credentials. Please try again.");
    }
  };

  const handleSignOut = () => {
    authService.logout();
    setUserData(null);
    setDatabaseUser(null);
    navigate("/");
  };

  useEffect(() => {
    const initializeData = async () => {
      // Check if user is already authenticated
      const userInfo = await authService.verifyToken();

      if (userInfo) {
        // User is authenticated
        if (userInfo.is_admin) {
          // Admin user, redirect to admin dashboard
          navigate("/admin");
          return;
        }

        // Regular user, set up data
        const userData = {
          name: userInfo.user_id,
          user_id: userInfo.user_id,
        };
        setUserData(userData);

        // Fetch user applications from backend
        try {
          const userApplications = await fetchUserApplications(userInfo.user_id);
          
          if (!userApplications) {
            setError("Failed to load your applications. Please try again.");
          } else {
            setDatabaseUser(userApplications);
          }
        } catch (error) {
          setError("An error occurred while loading your data.");
        }
      }
      
      setIsLoading(false);
    };

    initializeData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600 font-light">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
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
                  {isAdminLogin ? "Caseworker ID" : "Email"}
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 focus:border-gray-900 transition-colors duration-200 font-light"
                  placeholder={isAdminLogin ? "Enter caseworker ID" : "Enter your email"}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-light text-gray-600 mb-2 uppercase tracking-wider text-xs"
                >
                  {isAdminLogin ? "Caseworker Key" : "Password"}
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
                  placeholder={isAdminLogin ? "Enter caseworker key" : "Enter your password"}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition-all duration-200 font-light"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-20 pt-32">
      <div className="max-w-4xl mx-auto">
        {/* Header with Sign Out Button */}
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-thin text-gray-900 mb-2">
                My Dashboard
              </h1>
              <p className="text-gray-600 font-light">
                View and manage your benefit applications
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 border border-gray-900 px-4 py-2 hover:bg-gray-900 hover:text-white transition-all duration-200 font-light text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 border border-red-300 bg-red-50 p-6 flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-light mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="border border-red-600 text-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-all duration-200 font-light text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Applications */}
        {databaseUser ? (
          <div className="bg-white border border-gray-300 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-thin text-gray-900">
                Your Applications{" "}
                <span className="font-light text-gray-400">
                  ({databaseUser.applications.length})
                </span>
              </h3>
              <button
                onClick={() => navigate("/user/form")}
                className="bg-gray-900 text-white p-3 hover:bg-gray-800 transition-all duration-200 font-light"
                title="Apply for Benefits"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-8">
              {databaseUser.applications.map((app, index) => (
                <div
                  key={app.application_id}
                  className="border border-gray-300 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-6xl font-thin text-gray-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center space-x-3">
                            <span className="text-sm font-light text-gray-600 uppercase tracking-wider">
                              Approval Likeliness
                            </span>
                            <span
                              className={`font-light text-lg ${
                                app.claude_recommendation === "deny"
                                  ? "text-red-600"
                                  : getConfidenceColor(
                                      app.claude_confidence_level
                                    )
                              }`}
                            >
                              {app.claude_recommendation === "deny"
                                ? Math.round(
                                    (1 - app.claude_confidence_level) * 100
                                  )
                                : Math.round(app.claude_confidence_level * 100)}
                              %
                            </span>
                          </div>
                          <div className="space-y-2">
                            {/* Final Decision Status */}
                            <div
                              className={`inline-flex items-center space-x-2 px-4 py-2 border-2 text-sm font-medium rounded ${getFinalDecisionColor(
                                getFinalDecisionStatus(app)
                              )}`}
                            >
                              {getFinalDecisionIcon(
                                getFinalDecisionStatus(app)
                              )}
                              <span>
                                Final Decision: {getFinalDecisionStatus(app)}
                              </span>
                            </div>
                            {app.admin_status && (
                              <div
                                className={`inline-flex items-center space-x-2 px-3 py-1 border text-xs font-light ${getAdminStatusColor(
                                  app.admin_status
                                )}`}
                              >
                                {getAdminStatusIcon(app.admin_status)}
                                <span className="capitalize">
                                  Status: {app.admin_status.replace("_", " ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 font-light line-clamp-2 pl-24">
                        {app.claude_summary}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-thin text-gray-900">
                Your Applications
              </h3>
              <button
                onClick={() => navigate("/user/form")}
                className="bg-gray-900 text-white p-3 hover:bg-gray-800 transition-all duration-200 font-light"
                title="Apply for Benefits"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-10">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-700 font-light text-lg">
                No applications found.
              </p>
              <p className="text-gray-500 font-light text-sm mt-2">
                Please check back later for updates, or submit a new one if you
                haven’t yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
