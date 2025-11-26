import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api, type Application } from '../../services/api';
import PDFViewer from '../../components/PDFViewer';

export default function UserApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;
      
      try {
        setLoading(true);
        const data = await api.getApplicationById(applicationId);
        setApplication(data);
      } catch (error) {
        // Error fetching application
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-slate-600">Loading application...</span>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Application Not Found</h2>
          <p className="text-slate-600 mb-6">The application you're looking for doesn't exist.</p>
          <Link
            to="/user"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/user"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Application Detail</h1>
              <p className="text-slate-600">ID: {application.application_id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Viewer - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Document Viewer</h2>
                </div>
                {application.documents.length > 1 && (
                  <div className="mt-3 flex space-x-2">
                    {application.documents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentDocumentIndex(index)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                          index === currentDocumentIndex
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Document {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">
                          {application.documents[currentDocumentIndex]?.split('/').pop() || 'Document'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Document {currentDocumentIndex + 1} of {application.documents.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentDocumentIndex(Math.max(0, currentDocumentIndex - 1))}
                        disabled={currentDocumentIndex === 0}
                        className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentDocumentIndex(Math.min(application.documents.length - 1, currentDocumentIndex + 1))}
                        disabled={currentDocumentIndex === application.documents.length - 1}
                        className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[800px] bg-white relative">
                    <PDFViewer 
                      url={application.documents[currentDocumentIndex]} 
                      documentName={application.documents[currentDocumentIndex]?.split('/').pop() || 'document.pdf'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Application Status</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Approval Likeliness</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getConfidenceColor(application.claude_confidence_level)}`}>
                      {Math.round(application.claude_confidence_level * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Predicted Outcome</h4>
                  <div className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg border ${getRecommendationColor(application.claude_recommendation)}`}>
                    {getRecommendationIcon(application.claude_recommendation)}
                    <span className="capitalize font-medium">{application.claude_recommendation.replace('_', ' ')}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Documents Submitted</h4>
                  <p className="text-slate-800">{application.documents.length} documents</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Summary</h3>
              <p className="text-slate-700 leading-relaxed text-sm">{application.claude_summary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
