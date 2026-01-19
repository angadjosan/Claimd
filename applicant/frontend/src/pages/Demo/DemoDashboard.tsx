import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { demoApi } from '../../services/demoApi';
import { useDemoContext } from '../../context/DemoContext';
import MinimalNavbar from '../../components/MinimalNavbar';
import { useToast } from '../../components/Toast';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Demo Banner Component
 */
const DemoBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-yellow-800">
        <span className="font-semibold">✨ Demo Mode</span>
        <span>•</span>
        <span>This is a demonstration. No real data will be submitted.</span>
      </div>
    </div>
  );
};

interface ApplicationSummary {
  id?: string;
  application_id?: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  status_changed_at?: string;
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
    case 'processing':
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
    case 'under_review':
    case 'processing':
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>In Review</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{status || 'Unknown'}</span>;
  }
}

const DemoDashboard: React.FC = () => {
  const { getDemoHeaders, pollAssignmentStatus } = useDemoContext();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentReady, setAssignmentReady] = useState<Record<string, boolean>>({});
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  // Poll for assignment completion when application is submitted
  useEffect(() => {
    if (currentApplicationId && !assignmentReady[currentApplicationId]) {
      pollAssignmentStatus(currentApplicationId)
        .then((isAssigned) => {
          if (isAssigned) {
            setAssignmentReady(prev => ({ ...prev, [currentApplicationId]: true }));
            showToast('Your application has been assigned to a caseworker!', 'success');
            loadApplications(); // Refresh list
          }
        })
        .catch((error) => {
          console.error('Assignment polling failed:', error);
        });
    }
  }, [currentApplicationId, assignmentReady, pollAssignmentStatus, showToast]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const apps = await demoApi.getMyApplications(getDemoHeaders);
      setApplications(apps);
      
      // Check if any application was just submitted and needs polling
      const submittedApp = apps.find(app => 
        app.status === 'submitted' || app.status === 'processing'
      );
      if (submittedApp && !currentApplicationId) {
        setCurrentApplicationId(getAppId(submittedApp));
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
      showToast('Failed to load applications. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToCaseworkerView = () => {
    // Pass session ID in URL as fallback (in case apps are on different domains/ports)
    const sessionId = localStorage.getItem('demoSessionId');
    const url = sessionId 
      ? `/demo/caseworker/dashboard?sessionId=${sessionId}`
      : '/demo/caseworker/dashboard';
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <DemoBanner />
      <main className="py-16 pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">View and manage your disability benefit applications</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600 font-light">Loading applications...</span>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-6">Get started by submitting your first application</p>
              <Link
                to="/demo"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start New Application
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const appId = getAppId(app);
                const isAssigned = assignmentReady[appId];
                const showCaseworkerButton = (app.status === 'submitted' || app.status === 'under_review') && isAssigned;

                return (
                  <div
                    key={appId}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">{getStatusIcon(app.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Application #{appId.slice(0, 8)}
                            </h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              Submitted: {app.submitted_at 
                                ? new Date(app.submitted_at).toLocaleDateString()
                                : new Date(app.created_at).toLocaleDateString()}
                            </p>
                            {app.status_changed_at && (
                              <p>
                                Last updated: {new Date(app.status_changed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {showCaseworkerButton && (
                        <button
                          onClick={handleGoToCaseworkerView}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <span>Take me to caseworker view</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8">
            <Link
              to="/demo"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Start New Application
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoDashboard;
