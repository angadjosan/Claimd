import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api, type Application } from '../../services/api';
import { maskSSN } from '../../utils/ssnUtils';

export default function ApplicationDetail() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'deny' | null>(null);
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
    type: 'approve' | 'deny' | null;
  } | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;

      try {
        setLoading(true);
        const data = await api.getApplicationById(applicationId);
        setApplication(data);

        let base64: string | null = null;
        const doc = data.document;

        if (!doc) {
          // No document available
        } else if (typeof doc === 'string') {
          const match = doc.match(/Binary\.createFromBase64\('([^']+)'/);
          if (match) base64 = match[1];
          else if (doc.startsWith('JVBER')) base64 = doc;
        } else if (doc.$binary?.base64) {
          base64 = doc.$binary.base64;
        }

        if (base64) {
          const dataUrl = `data:application/pdf;base64,${base64}`;
          setPdfSrc(dataUrl);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const handleAction = async (type: 'approve' | 'deny') => {
    if (!applicationId) return;
    setActionLoading(type);
    try {
      const result =
        type === 'approve'
          ? await api.approveApplication(applicationId)
          : await api.denyApplication(applicationId);

      setActionResult({
        success: result.success,
        message: result.message || (type === 'approve' ? 'Application approved.' : 'Application denied.'),
        type,
      });
    } catch (error) {
      setActionResult({
        success: false,
        message: `Failed to ${type} application.`,
        type,
      });
    } finally {
      setActionLoading(null);
    }
  };

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

  // --- Confirmation Screen ---
  if (actionResult) {
    const isSuccess = actionResult.success;
    const isApprove = actionResult.type === 'approve';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-md">
          {isSuccess ? (
            <>
              {isApprove ? (
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              )}
              <h2 className="text-lg font-semibold text-slate-800 mb-1">
                {isApprove ? 'Application Approved' : 'Application Denied'}
              </h2>
              <p className="text-slate-600 text-sm mb-4">{actionResult.message}</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Action Failed</h2>
              <p className="text-slate-600 text-sm mb-4">{actionResult.message}</p>
            </>
          )}

          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading application...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">Application not found.</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 p-4 overflow-hidden flex flex-col">
      <div className="flex-1 max-w-[1800px] mx-auto w-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Application Detail</h1>
              <p className="text-xs text-slate-500 font-mono">ID: {application.application_id}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
          {/* PDF Viewer */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[900px]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-semibold text-slate-800">Document</h2>
              </div>
              {pdfSrc && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfSrc;
                    link.download = `${application.application_id || 'document'}.pdf`;
                    link.click();
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-md"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-50 overflow-hidden relative">
              {pdfSrc && !pdfError ? (
                <embed
                  src={`${pdfSrc}#toolbar=0&navpanes=0&scrollbar=1`}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                  onError={() => setPdfError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center text-slate-500">
                  <div>
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm">{pdfError ? 'Unable to load PDF.' : 'No document available.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2 min-h-0 h-full max-h-[700px]" >
            {/* Approve/Deny Buttons */}
            <div className="space-y-2 flex-shrink-0">
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading === 'approve'}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleAction('deny')}
                disabled={actionLoading === 'deny'}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
              >
                {actionLoading === 'deny' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Deny</span>
              </button>
            </div>
            
            {/* Single Scrollable Section */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="overflow-y-auto p-3 space-y-3 h-full">

                {/* AI Recommendation */}
                <div className="pt-3 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">AI Recommendation</h3>
                  <div
                    className={`inline-flex items-center space-x-2 px-2 py-1 rounded-lg border text-xs ${getRecommendationColor(
                      application.claude_recommendation
                    )}`}
                  >
                    {getRecommendationIcon(application.claude_recommendation)}
                    <span className="capitalize font-medium">
                      {application.claude_recommendation || 'N/A'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs">
                    Confidence:{' '}
                    <span
                      className={`font-semibold ${getConfidenceColor(
                        application.claude_confidence_level || 0
                      )}`}
                    >
                      {(application.claude_confidence_level * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="pt-3 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">AI Summary</h3>
                  <p className="text-slate-700 text-xs leading-relaxed">{application.claude_summary}</p>
                </div>

                {/* Phase Analysis Details */}
                <div className="pt-3 border-t border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-800 mb-3">Phase Analysis Details</h2>
                {/* Phase 1 */}
                {application.phase_1_current_work?.finding && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Phase 1: Current Work Status</h3>
                      {application.phase_1_current_work.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.phase_1_current_work.status === 'PASS' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {application.phase_1_current_work.status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{application.phase_1_current_work.finding}</p>
                  </div>
                )}

                {/* Phase 2 */}
                {application.phase_2_medical_severity?.finding && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Phase 2: Medical Severity</h3>
                      {application.phase_2_medical_severity.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.phase_2_medical_severity.status === 'PASS' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {application.phase_2_medical_severity.status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{application.phase_2_medical_severity.finding}</p>
                  </div>
                )}

                {/* Phase 3 */}
                {application.phase_3_listings?.finding && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Phase 3: Listings Evaluation</h3>
                      {application.phase_3_listings.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.phase_3_listings.status === 'APPROVE' 
                            ? 'bg-green-100 text-green-700' 
                            : application.phase_3_listings.status === 'DENY'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {application.phase_3_listings.status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{application.phase_3_listings.finding}</p>
                  </div>
                )}

                {/* Phase 4 */}
                {application.phase_4_rfc?.reason_cannot_assess && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Phase 4: Residual Functional Capacity</h3>
                      {application.phase_4_rfc.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.phase_4_rfc.status.includes('PARTIAL') 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {application.phase_4_rfc.status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{application.phase_4_rfc.reason_cannot_assess}</p>
                  </div>
                )}

                {/* Phase 5 */}
                {application.phase_5_vocational?.reason && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Phase 5: Vocational Assessment</h3>
                      {application.phase_5_vocational.status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.phase_5_vocational.status.includes('CANNOT') 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {application.phase_5_vocational.status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{application.phase_5_vocational.reason}</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
