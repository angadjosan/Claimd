import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Search,
  Filter,
  ArrowRight,
  LogOut
} from 'lucide-react';
import MinimalNavbar from '../../components/MinimalNavbar';
import Cookies from 'js-cookie';
import { config } from '../../config/env';

interface Application {
  application_id: string;
  document: string;
  claude_confidence_level: number;
  claude_summary: string;
  claude_recommendation: 'approve' | 'further_review' | 'deny';
  user_details: {
    user_id: string;
    name: string;
    socialSecurityNumber: string;
    email?: string;
    phone?: string;
  };
}

export default function AdminDash() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        // Fetch filtered applications (human_final = False)
        const response = await fetch(`${config.apiUrl}/api/users/filtered`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch filtered applications');
        }
        
        const result = await response.json();
        console.log('Fetched filtered applications from API:', result);
        
        if (!result.success || !result.applications) {
          throw new Error('Invalid API response');
        }
        
        // Map backend data to frontend format
        const mappedApplications = result.applications.map((app: any) => {
          // Convert backend recommendation format to frontend format
          const backendDecision = app.final_decision || app.claude_recommendation || '';
          let recommendation = 'further_review'; // default
          
          if (backendDecision.toUpperCase() === 'APPROVE') {
            recommendation = 'approve';
          } else if (backendDecision.toUpperCase() === 'REJECT' || backendDecision.toUpperCase() === 'DENY') {
            recommendation = 'deny';
          } else if (backendDecision.toUpperCase() === 'FURTHER REVIEW') {
            recommendation = 'further_review';
          }
          
          return {
            application_id: app.application_id,
            document: app.document || "",
            claude_confidence_level: app.claude_confidence_level || 0,
            claude_summary: app.claude_summary || "No summary available",
            claude_recommendation: recommendation,
            user_details: app.user_details
          };
        });
        
        setApplications(mappedApplications);
        console.log('Total filtered applications loaded:', mappedApplications.length);
        
      } catch (error) {
        console.error('API call failed:', error);
        setApplications([]);
        alert('Failed to load applications from backend. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'deny':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'further_review':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'approve':
        return <CheckCircle className="w-4 h-4" />;
      case 'deny':
        return <XCircle className="w-4 h-4" />;
      case 'further_review':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.user_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.application_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRecommendation === 'all' || app.claude_recommendation === filterRecommendation;
    return matchesSearch && matchesFilter;
  });

  const handleApplicationClick = (applicationId: string) => {
    navigate(`/admin/detail/${applicationId}`);
  };

  const handleSignOut = () => {
    Cookies.remove('userData');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-slate-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  const approvedCount = applications.filter(app => app.claude_recommendation === 'approve').length;
  const pendingCount = applications.filter(app => app.claude_recommendation === 'further_review').length;
  const deniedCount = applications.filter(app => app.claude_recommendation === 'deny').length;

  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <div className="mb-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-thin text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 font-light">Manage and review disability benefit applications (Pending Human Review)</p>
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="border border-gray-300 p-6">
            <p className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Total Applications</p>
            <p className="text-5xl font-thin text-gray-900">{applications.length}</p>
          </div>

          <div className="border border-gray-300 p-6">
            <p className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Approved</p>
            <p className="text-5xl font-thin text-green-600">{approvedCount}</p>
          </div>

          <div className="border border-gray-300 p-6">
            <p className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Pending Review</p>
            <p className="text-5xl font-thin text-yellow-600">{pendingCount}</p>
          </div>

          <div className="border border-gray-300 p-6">
            <p className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Denied</p>
            <p className="text-5xl font-thin text-red-600">{deniedCount}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="border border-gray-300 p-6 mb-16">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by applicant name or application ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterRecommendation}
                onChange={(e) => setFilterRecommendation(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Recommendations</option>
                <option value="approve">Approved</option>
                <option value="further_review">Further Review</option>
                <option value="deny">Denied</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="border border-gray-300">
          <div className="p-6 border-b border-gray-300">
            <h2 className="text-2xl font-thin text-gray-900">Applications <span className="font-light text-gray-400">({filteredApplications.length})</span></h2>
          </div>
          
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No applications found</h3>
              <p className="text-slate-500">
                {searchTerm || filterRecommendation !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No applications are currently awaiting human review.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredApplications.map((application) => (
                <div
                  key={application.application_id}
                  onClick={() => handleApplicationClick(application.application_id)}
                  className="p-6 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-slate-500" />
                          <span className="font-semibold text-slate-800">{application.user_details?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600">2 documents</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-600">Confidence:</span>
                          <span className={`font-bold ${getConfidenceColor(application.claude_confidence_level)}`}>
                            {Math.round(application.claude_confidence_level * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-600">Recommendation:</span>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs ${getRecommendationColor(application.claude_recommendation)}`}>
                            {getRecommendationIcon(application.claude_recommendation)}
                            <span className="capitalize">{application.claude_recommendation.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 line-clamp-2">
                        <span className="font-medium">Synopsis Preview:</span> {application.claude_summary}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs text-slate-500 font-mono">ID: {application.application_id.slice(0, 8)}...</span>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}