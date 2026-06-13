"use client";

import { useRef } from "react";
import { IoDocumentTextOutline, IoDownloadOutline, IoShareSocialOutline, IoLogoWordpress, IoSparkles } from "react-icons/io5";

export default function ResumePreview({ htmlContent, loading, onShare }) {
  const iframeRef = useRef(null);

  // Trigger Native Browser Iframe Print for HD PDF Download
  const handlePrint = () => {
    if (iframeRef.current) {
      try {
        const frameWindow = iframeRef.current.contentWindow;
        frameWindow.focus();
        frameWindow.print();
      } catch (err) {
        console.warn("Iframe print failed, attempting window popup fallback:", err);
        try {
          const newWindow = window.open("", "_blank");
          if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            newWindow.focus();
            setTimeout(() => {
              newWindow.print();
              newWindow.close();
            }, 500);
          } else {
            alert("Pop-up blocker prevented opening print window. Please allow popups for this site.");
          }
        } catch (fallbackErr) {
          console.error("Print fallback failed:", fallbackErr);
          alert("Unable to open print preview. Try exporting as Word instead.");
        }
      }
    }
  };

  // Light-weight high-compatibility Word document exporter
  const handleWordExport = () => {
    if (!htmlContent) return;
    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>Exported Resume</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
            </w:WordDocument>
          </xml>
          <![endif]-->
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const sourceHTML = header + htmlContent + footer;
      
      const blob = new Blob(['\ufeff' + sourceHTML], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.doc";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Word export failed:", err);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
      
      {/* Header Toolbar */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex flex-wrap items-center justify-between gap-3 z-10">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <IoDocumentTextOutline className="h-5 w-5 text-emerald-600" />
          Live Document Preview
        </span>

        {htmlContent && !loading && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <IoDownloadOutline className="h-3.5 w-3.5 text-emerald-600" />
              Download PDF
            </button>
            <button
              onClick={handleWordExport}
              className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <IoDownloadOutline className="h-3.5 w-3.5 text-blue-600" />
              Export Word
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <IoShareSocialOutline className="h-3.5 w-3.5 text-teal-600" />
              Share Link
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 bg-slate-50/50 p-4 sm:p-6 flex justify-center items-start overflow-auto">
        {loading ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20 animate-in fade-in duration-200">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              <IoSparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-center space-y-1 animate-pulse">
              <p className="text-sm font-semibold text-slate-800">AI is crafting your resume...</p>
              <p className="text-xs text-slate-400">Writing professional descriptions, formatting, and rendering layout</p>
            </div>
          </div>
        ) : null}

        {htmlContent ? (
          <div className="w-full max-w-[210mm] aspect-[210/297] bg-white rounded shadow-lg overflow-hidden border border-slate-200">
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="w-full h-full border-none"
              title="Resume Document Preview"
              sandbox="allow-same-origin allow-popups allow-forms allow-scripts allow-modals"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded max-w-md mx-auto my-auto min-h-[300px] bg-white shadow-sm">
            <div className="rounded-full bg-slate-50 p-4 border border-slate-100 mb-4">
              <IoDocumentTextOutline className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">No resume generated yet</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fill in your professional parameters on the left and click "Improve with AI" to generate a stunning, print-ready document here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
