'use client';

import React, { useState, useCallback } from 'react';
import { 
  UploadCloud, 
  FileText, 
  ArrowRight, 
  Download, 
  FileJson, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { ExtractionCard } from '../../components/ExtractionCard';

// Types
enum ProcessState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  EXTRACTING = 'EXTRACTING',
  EXTRACTED = 'EXTRACTED',
  CALCULATING = 'CALCULATING',
  COMPLETED = 'COMPLETED',
}

interface Owner {
  id: string;
  name: string;
  ownershipPercentage: number;
  isAgent: boolean;
  calculatedShare?: number;
  isRoundingAdjustment?: boolean;
}

interface PaymentData {
  totalAmount: number;
  currency: string;
  confidenceScore: number;
  extractedDate: string;
}

// Seed owners - can be loaded from API or set manually
const SEED_OWNERS: Owner[] = [
  { id: '1', name: 'HSBC Bank (Agent)', ownershipPercentage: 35.7142, isAgent: true },
  { id: '2', name: 'JPMorgan Chase', ownershipPercentage: 28.5714, isAgent: false },
  { id: '3', name: 'Deutsche Bank', ownershipPercentage: 21.4286, isAgent: false },
  { id: '4', name: 'Barclays Capital', ownershipPercentage: 14.2858, isAgent: false },
];

const AgentFlowPage: React.FC = () => {
  // State
  const [processState, setProcessState] = useState<ProcessState>(ProcessState.IDLE);
  const [extractedData, setExtractedData] = useState<PaymentData | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [base64Pdf, setBase64Pdf] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [csvData, setCsvData] = useState<string>('');

  // -- Handlers --

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startUploadFlow = useCallback(async (file: File) => {
    setErrorMessage('');
    setProcessState(ProcessState.UPLOADING);
    setPdfFile(file);
    
    try {
      const base64Data = await convertFileToBase64(file);
      setBase64Pdf(base64Data);
      setProcessState(ProcessState.UPLOADED);
    } catch {
      setErrorMessage('Failed to read PDF file');
      setProcessState(ProcessState.IDLE);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        startUploadFlow(file);
      } else {
        setErrorMessage('Please upload a PDF file');
      }
    }
  }, [startUploadFlow]);

  const handleExtract = async () => {
    if (!base64Pdf) {
      setErrorMessage('No PDF file loaded');
      return;
    }

    // Initialize owners if not set
    if (owners.length === 0) {
      setOwners(SEED_OWNERS);
    }

    setErrorMessage('');
    setProcessState(ProcessState.EXTRACTING);

    try {
      const response = await fetch('/api/waterfall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: 'LN-2024-883',
          owners: SEED_OWNERS.map(o => ({
            name: o.name,
            bic: 'CHASUS33', // Default BIC, can be customized
            account: Math.random().toString().slice(2, 10),
            share: o.ownershipPercentage / 100, // Convert percentage to decimal
          })),
          base64Pdf: base64Pdf,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      const result = await response.json();

      // Set extracted data
      setExtractedData({
        totalAmount: result.total_cash_in,
        currency: 'USD',
        confidenceScore: 95, // API doesn't return confidence yet
        extractedDate: new Date().toISOString(),
      });

      // Store CSV for download
      setCsvData(result.csv);

      // Update owners with calculated shares
      const updatedOwners = SEED_OWNERS.map((owner, idx) => {
        const dist = result.distribution[idx];
        return {
          ...owner,
          calculatedShare: dist ? dist.amount : 0,
          isRoundingAdjustment: owner.isAgent,
        };
      });
      setOwners(updatedOwners);

      setProcessState(ProcessState.COMPLETED);
    } catch (error) {
      console.error('Extraction error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Extraction failed');
      setProcessState(ProcessState.UPLOADED);
    }
  };

  const handleDownloadCSV = () => {
    if (!csvData) return;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-waterfall-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileInputClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        startUploadFlow(target.files[0]);
      }
    };
    input.click();
  };

  // -- Render Helpers --

  const renderUploadZone = () => {
    if (processState !== ProcessState.IDLE && processState !== ProcessState.UPLOADING) {
       return (
         <div className="border border-green-200 bg-green-50 rounded-xl p-6 flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{pdfFile?.name || 'payment_advice.pdf'}</h3>
                <p className="text-xs text-gray-500">{pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : '1.2 MB'} • Uploaded just now</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 size={16} />
              Ready for Extraction
            </div>
         </div>
       );
    }

    return (
      <div 
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors mb-6 cursor-pointer
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleFileInputClick}
      >
        {processState === ProcessState.UPLOADING ? (
           <div className="flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <p className="text-sm font-medium text-gray-600">Uploading secure document...</p>
           </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
              <UploadCloud size={28} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Upload Payment Advice</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
              Drag and drop your PDF here, or click to browse files.
            </p>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Secure Transmission</span>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 sticky top-0 z-20 -mx-8 px-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">AgentFlow — Payment Waterfall</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">BETA</span>
            </div>
            <p className="text-sm text-gray-500">Automated cash distribution with zero reconciliation errors.</p>
          </div>
          
          {/* Top Right Action Context */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">Loan Facility:</span>
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-sm font-medium text-gray-700">Term Loan B (LN-2024-883)</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto h-full">
            
            {/* Left Column: Upload & Extract */}
            <div className="col-span-12 xl:col-span-7 flex flex-col gap-6">
              
              {/* Step 1: Upload */}
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">1</span>
                     Source Document
                   </h2>
                </div>
                {renderUploadZone()}
                
                {/* Error Display */}
                {errorMessage && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">🚫 {errorMessage}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                   <button 
                    onClick={handleExtract}
                    disabled={processState !== ProcessState.UPLOADED}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${processState === ProcessState.UPLOADED 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                   >
                     {processState === ProcessState.EXTRACTING ? (
                        <>Processing...</>
                     ) : (
                        <>Extract Payment Amount <ArrowRight size={16} /></>
                     )}
                   </button>
                </div>
              </section>

              {/* Step 2: Extraction Results */}
              {(processState === ProcessState.EXTRACTING || 
                processState === ProcessState.COMPLETED) && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-3 px-1">
                     <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                       <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">2</span>
                       Extracted Data
                     </h2>
                     {extractedData && (
                        <span className="text-xs text-gray-400">
                          Extracted {new Date(extractedData.extractedDate).toLocaleTimeString()}
                        </span>
                     )}
                  </div>
                  
                  <ExtractionCard 
                    data={extractedData || { totalAmount: 0, currency: 'USD', confidenceScore: 0, extractedDate: '' }} 
                    isLoading={processState === ProcessState.EXTRACTING}
                  />
                </section>
              )}
            </div>

            {/* Right Column: Waterfall & Ownership */}
            <div className="col-span-12 xl:col-span-5 flex flex-col h-full">
              <section className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full transition-all duration-500
                 ${processState === ProcessState.COMPLETED ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2 grayscale'}`}>
                
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">3</span>
                     Pro-Rata Distribution
                  </h2>
                  
                  {processState === ProcessState.COMPLETED && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs font-medium text-gray-500">Reconciled</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ownership</th>
                        <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {owners.map((owner) => (
                        <tr key={owner.id} className={`group hover:bg-gray-50 transition-colors ${owner.isRoundingAdjustment ? 'animate-flash' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${owner.isAgent ? 'text-indigo-900' : 'text-gray-900'}`}>
                                {owner.name}
                              </span>
                              {owner.isRoundingAdjustment && (
                                <div className="has-tooltip relative cursor-help">
                                   <Info size={14} className="text-amber-500" />
                                   <div className="tooltip absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md w-48 shadow-lg text-center">
                                      Rounding difference allocated to Agent Bank to ensure zero variance.
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                   </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                               {owner.ownershipPercentage.toFixed(4)}%
                             </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {owner.calculatedShare ? (
                              <span className={`text-sm font-mono font-medium ${owner.isRoundingAdjustment ? 'text-amber-600' : 'text-gray-900'}`}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(owner.calculatedShare)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-300">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">Total</td>
                        <td className="py-3 px-6 text-right text-xs font-bold text-gray-900">100.0000%</td>
                        <td className="py-3 px-6 text-right text-sm font-bold text-gray-900 font-mono">
                          {processState === ProcessState.COMPLETED ? (
                            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(extractedData?.totalAmount || 0)
                          ) : (
                            '--'
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  {processState === ProcessState.COMPLETED ? (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                      <button 
                        onClick={handleDownloadCSV}
                        disabled={!csvData}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={16} />
                        Download CSV
                      </button>
                      <button 
                        disabled
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 px-4 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed shadow-sm"
                      >
                        <FileJson size={16} />
                        SWIFT XML (Coming Soon)
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-gray-400">Upload a payment advice to begin</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
    </>
  );
};

export default AgentFlowPage;
