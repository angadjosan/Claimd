import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { authService } from '../../services/auth';
import MinimalNavbar from '../../components/MinimalNavbar';
import { useToast } from '../../components/Toast';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, LogOut, X } from 'lucide-react';

interface ApplicationSummary {
  id?: string;
  application_id?: string;
  status: string;
  created_at: string;
  applicant_name?: string;
  claude_recommendation?: string;
  final_decision?: string;
}

function getAppId(app: ApplicationSummary): string {
  return app.application_id || app.id || 'unknown';
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'approve':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'denied':
    case 'deny':
    case 'rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'pending':
    case 'submitted':
    case 'under_review':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'approve':
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>Approved</span>;
    case 'denied':
    case 'deny':
    case 'rejected':
      return <span className={`${baseClasses} bg-red-100 text-red-700`}>Denied</span>;
    case 'pending':
    case 'submitted':
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>Pending Review</span>;
    case 'under_review':
      return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Under Review</span>;
    case 'further_review':
      return <span className={`${baseClasses} bg-purple-100 text-purple-700`}>Further Review</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{status || 'Unknown'}</span>;
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMyApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelApplication(applicationId: string) {
    if (!window.confirm('Are you sure you want to cancel this application? This action cannot be undone.')) {
      return;
    }

    try {
      setCancellingId(applicationId);
      await api.cancelApplication(applicationId);
      showToast('Application cancelled successfully', 'success');
      // Refresh the applications list
      await fetchApplications();
    } catch (err) {
      console.error('Failed to cancel application:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel application';
      showToast(errorMessage, 'error');
    } finally {
      setCancellingId(null);
    }
  }

  function canCancelApplication(status: string): boolean {
    const lowerStatus = status?.toLowerCase();
    return ['draft', 'submitted', 'processing'].includes(lowerStatus);
  }

  async function handleLogout() {
    await authService.logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalNavbar />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">My Applications</h1>
              <p className="text-gray-600">Track and manage your disability benefit applications</p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
              <Link
                to="/apply"
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-opacity duration-300 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)'
                }}
              >
                <Plus className="w-5 h-5" />
                New Application
              </Link>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600 font-light">Loading applications...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No Applications Yet</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start your first disability benefit application to begin the process. Our AI-powered system will help streamline your application.
              </p>
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-opacity duration-300 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)'
                }}
              >
                <Plus className="w-5 h-5" />
                Start New Application
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={getAppId(app)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                        {getStatusIcon(app.final_decision || app.claude_recommendation || app.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          Application #{getAppId(app).slice(0, 8)}
                        </h3>
                        {app.applicant_name && (
                          <p className="text-sm text-gray-600 mb-2">{app.applicant_name}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted: {formatDate(app.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.final_decision || app.claude_recommendation || app.status)}
                      {app.claude_recommendation && !app.final_decision && (
                        <span className="text-xs text-gray-500">AI Review Complete</span>
                      )}
                      {canCancelApplication(app.status) && (
                        <button
                          onClick={() => handleCancelApplication(getAppId(app))}
                          disabled={cancellingId === getAppId(app)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-3 h-3" />
                          {cancellingId === getAppId(app) ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Section */}
          {!loading && !error && applications.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-light text-gray-900 mb-1">{applications.length}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-light text-green-600 mb-1">
                  {applications.filter(a => 
                    (a.final_decision || a.claude_recommendation || a.status)?.toLowerCase() === 'approve' ||
                    (a.final_decision || a.claude_recommendation || a.status)?.toLowerCase() === 'approved'
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-light text-yellow-600 mb-1">
                  {applications.filter(a => {
                    const status = (a.final_decision || a.claude_recommendation || a.status)?.toLowerCase();
                    return status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'further_review';
                  }).length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
