interface PDFViewerProps {
  url: string;
  documentName?: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  // Construct full URL for iframe
  const fullUrl = url.startsWith('http') ? url : window.location.origin + url;

  return (
    <div className="h-full bg-white">
      {/* PDF Viewer - Use iframe with proper URL */}
      <div className="w-full h-full">
        <iframe
          src={`${fullUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-full border-0"
          title="PDF Viewer"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

