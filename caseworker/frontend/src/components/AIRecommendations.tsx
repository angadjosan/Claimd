import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface AIRecommendationsProps {
  missingInformation?: string[];
  suggestedActions?: string[];
}

export default function AIRecommendations({ missingInformation = [], suggestedActions = [] }: AIRecommendationsProps) {
  if (missingInformation.length === 0 && suggestedActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Missing Information */}
      {missingInformation.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Missing Information</h3>
          </div>
          <ul className="space-y-2">
            {missingInformation.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Suggested Actions</h3>
          </div>
          <ul className="space-y-2">
            {suggestedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

