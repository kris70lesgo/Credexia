'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Play, Building2, Wallet, RefreshCw, Lock, Copy, X } from 'lucide-react';

// Types
enum WorkflowState {
  IDLE = 0,
  UPLOADED = 1,
  EXTRACTING = 2,
  EXTRACTED = 3,
  VERIFIED = 4,
  PENDING_SIGNATURE = 5,
  COMPLETED = 6,
}

interface TradeData {
  sellerName: string;
  buyerName: string;
  tradeAmount: number;
  currency: string;
  loanId: string;
  percentage: number;
}

interface OwnerEntity {
  id: string;
  name: string;
  share: number;
  type: string;
  status: string;
  isSeller?: boolean;
}

interface ValidationCheck {
  id: string;
  label: string;
  status: string;
}

interface ApiOwner {
  name: string;
  share: number;
}

interface ApiTradeData {
  seller: string;
  buyer: string;
  amount: number;
  loan_id: string;
  percentage: number;
}

const TradeClearPage: React.FC = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(WorkflowState.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<TradeData | null>(null);
  const [showSuccessPanel, setShowSuccessPanel] = useState(false);
  const [ownership, setOwnership] = useState<OwnerEntity[]>([]);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockchainHash, setBlockchainHash] = useState<string | null>(null);
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>([]);

  // Load ownership data on mount
  useEffect(() => {
    const loadOwnership = async () => {
      try {
        const response = await fetch('/api/trade/owners?loan_id=LN-2024-8392');
        const data = await response.json();
        
        if (data.success) {
          setOwnership(data.owners.map((owner: ApiOwner, idx: number) => ({
            id: `O-${idx + 1}`,
            name: owner.name,
            share: owner.share,
            type: owner.name.includes('Bank') ? 'Corp' : 'Fund',
            status: 'Active',
          })));
        }
      } catch (error) {
        console.error('Failed to load ownership:', error);
        setErrorMessage('Failed to load ownership data');
      }
    };
    
    loadOwnership();
  }, []);

  // Handle file upload with API
  const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    
    const uploadedFile = 'files' in e.target ? (e.target.files?.[0]) : (e as React.DragEvent).dataTransfer.files[0];
    
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setWorkflowState(WorkflowState.UPLOADED);
    
    // Upload to API
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/trade/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const data = await response.json();
      setBase64Data(data.base64);
      console.log('✅ File uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setWorkflowState(WorkflowState.IDLE);
    }
  };

  // Run AI Extraction with Gemini
  const runExtraction = async () => {
    if (!base64Data) return;
    
    setWorkflowState(WorkflowState.EXTRACTING);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/trade/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: base64Data,
          mimeType: 'application/pdf',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 422) {
          throw new Error(`AI extraction failed: ${errorData.error}. Confidence: ${errorData.confidence || 'N/A'}`);
        }
        throw new Error(errorData.error || 'Extraction failed');
      }
      
      const result = await response.json();
      const tradeData = result.data;
      
      setExtractedData({
        sellerName: tradeData.seller,
        buyerName: tradeData.buyer,
        tradeAmount: tradeData.amount,
        currency: tradeData.currency || 'USD',
        loanId: tradeData.loan_id,
        percentage: tradeData.percentage,
      });
      
      setWorkflowState(WorkflowState.EXTRACTED);
      console.log('✅ Trade data extracted:', tradeData);
      
      // Auto-trigger validation
      setTimeout(() => runValidations(tradeData), 800);
      
    } catch (error) {
      console.error('Extraction error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Extraction failed');
      setWorkflowState(WorkflowState.UPLOADED);
    }
  };

  // Run Validations with API
  const runValidations = async (tradeData: ApiTradeData) => {
    // Initialize validation checks
    setValidationChecks([
      { id: 'v1', label: 'Loan ID exists in registry', status: 'pending' },
      { id: 'v2', label: 'Seller is an owner', status: 'pending' },
      { id: 'v3', label: 'Seller has sufficient ownership', status: 'pending' },
      { id: 'v4', label: 'Buyer name is valid', status: 'pending' },
      { id: 'v5', label: 'Percentage is valid (0-100)', status: 'pending' },
    ]);
    
    try {
      const response = await fetch('/api/trade/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller: tradeData.seller,
          buyer: tradeData.buyer,
          amount: tradeData.amount,
          loan_id: tradeData.loan_id,
          percentage: tradeData.percentage,
        }),
      });
      
      const result = await response.json();
      
      if (!result.valid) {
        // Map errors to specific validation checks
        const updatedChecks = validationChecks.map(check => {
          // Check if any error relates to this validation
          const hasError = result.errors.some((err: string) => {
            if (check.id === 'v1' && err.includes('Loan ID')) return true;
            if (check.id === 'v2' && err.includes('not an owner')) return true;
            if (check.id === 'v3' && err.includes('insufficient ownership')) return true;
            if (check.id === 'v4' && err.includes('Buyer')) return true;
            if (check.id === 'v5' && err.includes('Percentage')) return true;
            return false;
          });
          return { ...check, status: hasError ? 'error' : 'success' };
        });
        setValidationChecks(updatedChecks);
        setErrorMessage(`Validation failed:\n${result.errors.join('\n')}`);
        return;
      }
      
      // All validations passed
      setValidationChecks(prev => prev.map(c => ({
        ...c,
        status: 'success',
      })));
      setWorkflowState(WorkflowState.VERIFIED);
      console.log('✅ Validation passed');
      
    } catch (error) {
      console.error('Validation error:', error);
      setValidationChecks(prev => prev.map(c => ({
        ...c,
        status: 'error',
      })));
      setErrorMessage('Validation failed');
    }
  };

  // Confirm Trade with API
  const confirmTrade = async () => {
    if (!extractedData) return;
    
    try {
      setWorkflowState(WorkflowState.PENDING_SIGNATURE);
      setErrorMessage(null);
      
      // Record trade as pending
      const response = await fetch('/api/trade/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller: extractedData.sellerName,
          buyer: extractedData.buyerName,
          amount: extractedData.tradeAmount,
          loan_id: extractedData.loanId,
          percentage: extractedData.percentage,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm trade');
      }
      
      const result = await response.json();
      const newTradeId = result.trade.id;
      setTradeId(newTradeId);
      
      console.log('✅ Trade confirmed:', result.trade);
      
      // Auto-trigger approval after delay
      setTimeout(async () => {
        await approveTrade(newTradeId);
      }, 1500);
      
    } catch (error) {
      console.error('Confirm error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to confirm trade');
      setWorkflowState(WorkflowState.VERIFIED);
    }
  };

  // Approve Trade - Execute ownership transfer
  const approveTrade = async (tradeIdToApprove: string) => {
    try {
      const response = await fetch('/api/trade/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_id: tradeIdToApprove }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve trade');
      }
      
      const result = await response.json();
      
      // Update ownership with new data
      setOwnership(result.ownership.map((owner: ApiOwner, idx: number) => ({
        id: `O-${idx + 1}`,
        name: owner.name,
        share: owner.share,
        type: owner.name.includes('Bank') ? 'Corp' : 'Fund',
        status: 'Active',
      })));
      
      setBlockchainHash(result.trade.hash);
      setWorkflowState(WorkflowState.COMPLETED);
      setShowSuccessPanel(true);
      
      console.log('✅ Trade approved:', result.trade);
      console.log('🔒 Blockchain hash:', result.trade.hash);
      
    } catch (error) {
      console.error('Approve error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to approve trade');
    }
  };

  const renderStatusStep = (step: number, label: string) => {
    const isActive = workflowState >= step;
    const isCurrent = workflowState === step;
    return (
      <div className={`flex items-center gap-2 text-sm ${isActive ? "text-indigo-700 font-medium" : "text-slate-400"}`}>
        <div className={`w-2.5 h-2.5 rounded-full transition-all ${
          isCurrent ? "bg-indigo-600 ring-4 ring-indigo-50" : isActive ? "bg-indigo-600" : "bg-slate-200"
        }`} />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 -mx-8 px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">TradeClear — Digital Settlement</h1>
            <p className="text-slate-500 mt-1 text-sm">Automated ownership transfer using AI-verified Notice of Assignment.</p>
        </div>
        {workflowState === WorkflowState.COMPLETED && (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Settlement Finalized
            </span>
        )}
      </div>

      {/* Workflow Status Bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
         <div className="flex flex-wrap gap-x-8 gap-y-2 items-center">
            {renderStatusStep(WorkflowState.UPLOADED, 'Document Upload')}
            <div className="h-px w-8 bg-slate-200 hidden sm:block" />
            {renderStatusStep(WorkflowState.EXTRACTED, 'Data Extraction')}
             <div className="h-px w-8 bg-slate-200 hidden sm:block" />
            {renderStatusStep(WorkflowState.VERIFIED, 'Verification')}
             <div className="h-px w-8 bg-slate-200 hidden sm:block" />
            {renderStatusStep(WorkflowState.PENDING_SIGNATURE, 'Approvals')}
             <div className="h-px w-8 bg-slate-200 hidden sm:block" />
            {renderStatusStep(WorkflowState.COMPLETED, 'Settlement')}
         </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
            <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          
          {/* Upload Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <div className="p-1.5 bg-indigo-50 rounded text-indigo-600">
                            <FileText size={18} />
                        </div>
                        Notice of Assignment
                    </h2>
                    {workflowState >= WorkflowState.UPLOADED && file && (
                        <span className="font-mono text-xs text-slate-500 bg-gray-100 px-2 py-1 rounded">
                            {file.name}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="p-6">
                {workflowState === WorkflowState.IDLE && (
                    <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                    >
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">Upload Transfer Document</h3>
                        <p className="text-xs text-slate-500 mt-2 max-w-xs">Drag & drop PDF or DOCX (max 10MB). System will automatically extract trade economics.</p>
                        <input type="file" className="hidden" id="fileUpload" onChange={handleFileDrop} />
                        <label htmlFor="fileUpload" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                )}

                {workflowState === WorkflowState.UPLOADED && (
                    <div className="flex flex-col items-center py-6">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} className="text-indigo-600" />
                         </div>
                         <p className="text-slate-900 font-medium mb-1">Document Uploaded</p>
                         <p className="text-slate-500 text-xs mb-6">Ready to process trade details</p>
                         <button onClick={runExtraction} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Play size={16} /> Run AI Extraction
                         </button>
                    </div>
                )}

                {workflowState === WorkflowState.EXTRACTING && (
                    <div className="flex flex-col items-center py-12">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 bg-indigo-50 mb-4 flex items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                        <p className="text-slate-700 font-medium">Processing Document</p>
                        <p className="text-slate-500 text-xs mt-1">Extracting counterparties and economics...</p>
                    </div>
                )}

                {/* Extracted Data */}
                {workflowState >= WorkflowState.EXTRACTED && extractedData && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Seller Name" value={extractedData.sellerName} verified={workflowState >= WorkflowState.VERIFIED} />
                            <FieldGroup label="Buyer Name" value={extractedData.buyerName} verified={workflowState >= WorkflowState.VERIFIED} />
                            <FieldGroup label="Trade Amount" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: extractedData.currency }).format(extractedData.tradeAmount)} verified={workflowState >= WorkflowState.VERIFIED} />
                            <FieldGroup label="Loan ID" value={extractedData.loanId} verified={workflowState >= WorkflowState.VERIFIED} />
                        </div>

                        {/* Verification List */}
                        {workflowState >= WorkflowState.VERIFIED && (
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Compliance Verification</h4>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {validationChecks.map(check => (
                                        <div key={check.id} className="flex items-center justify-between px-4 py-3 text-sm bg-white">
                                            <span className="text-slate-700 font-medium">{check.label}</span>
                                            {check.status === 'success' ? (
                                                <span className="text-emerald-600 text-xs font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                                                    <CheckCircle2 size={10} /> Passed
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 text-xs">Pending</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                         {workflowState === WorkflowState.VERIFIED && (
                            <button 
                                onClick={() => setWorkflowState(WorkflowState.PENDING_SIGNATURE)}
                                className="w-full h-12 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Proceed to Approval
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>
          
          {/* Signature Card */}
          {workflowState === WorkflowState.PENDING_SIGNATURE && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl shadow-md p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 border border-indigo-100">
                        <Lock size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900">Confirm Digital Settlement</h3>
                        <p className="text-sm text-slate-600 mt-1 mb-4">
                            You are authorizing the transfer of ownership to <strong>{extractedData?.buyerName}</strong> for position <strong>{extractedData?.loanId}</strong>. 
                            This action is irreversible.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmTrade} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Execute Transfer
                            </button>
                            <button onClick={() => setWorkflowState(WorkflowState.VERIFIED)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
              </div>
          )}
        </div>

        {/* RIGHT COLUMN: Ownership Register */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
            <div className="p-6 pb-4 border-b border-gray-100">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Building2 className="text-slate-400" size={18} />
                    Ownership Register
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Facility: {extractedData?.loanId || 'LN-2024-8392'}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner Entity</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Allocation</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ownership.map((owner, idx) => (
                            <tr 
                                key={owner.id} 
                                className={`${
                                    owner.isSeller ? "bg-amber-50" : 
                                    workflowState === WorkflowState.COMPLETED && idx === 0 ? "bg-emerald-50" : ""
                                }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${owner.status === 'Exited' && "text-slate-400 line-through"}`}>
                                            {owner.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-400 uppercase">{owner.type}</span>
                                            {owner.isSeller && workflowState < WorkflowState.COMPLETED && (
                                                <span className="text-xs text-amber-600 font-bold">SELLING</span>
                                            )}
                                            {workflowState === WorkflowState.COMPLETED && idx === 0 && (
                                                <span className="text-xs text-emerald-600 font-bold">NEW OWNER</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-full max-w-[120px]">
                                        <span className="text-sm font-semibold text-slate-700">{owner.share.toFixed(2)}%</span>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full ${
                                                    owner.status === 'Exited' ? "bg-slate-400" :
                                                    workflowState === WorkflowState.COMPLETED && idx === 0 ? "bg-emerald-500" : "bg-indigo-600"
                                                }`}
                                                style={{ width: `${owner.status === 'Exited' ? 0 : owner.share}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        owner.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        owner.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {owner.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                    <span>Total Syndication</span>
                    <span>{ownership.reduce((acc, curr) => curr.status !== 'Exited' ? acc + curr.share : acc, 0).toFixed(2)}%</span>
                </div>
            </div>
          </div>
        </div>

      </div>

      {/* Success Panel */}
      {workflowState === WorkflowState.COMPLETED && showSuccessPanel && blockchainHash && (
          <div className="fixed bottom-6 right-6 w-[420px] z-50 bg-emerald-700 border border-emerald-600 text-white shadow-2xl rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-emerald-300/30">
                        <Wallet className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white">Transaction Finalized</h3>
                        <p className="text-emerald-100 text-xs flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                          Trade ID: {tradeId?.slice(0, 20)}...
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowSuccessPanel(false)}
                    className="text-emerald-200 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3 mb-6 flex items-center justify-between group cursor-pointer"
                 onClick={() => navigator.clipboard.writeText(blockchainHash)}
                 title="Click to copy">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-emerald-200/70 uppercase">Blockchain Hash</span>
                  <code className="text-xs font-mono text-white truncate">{blockchainHash.slice(0, 40)}...</code>
                </div>
                <Copy size={14} className="text-emerald-200" />
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-transparent border border-emerald-200/30 text-emerald-50 rounded-lg hover:bg-emerald-600">
                  Download Proof
              </button>
              <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-white text-emerald-800 rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2"
              >
                  <RefreshCw size={14} /> New Trade
              </button>
            </div>
          </div>
      )}
    </>
  );
};

// Field Component
const FieldGroup: React.FC<{ label: string; value: string | number; verified: boolean }> = ({ label, value, verified }) => (
    <div className={`p-3 rounded-lg border transition-all ${
        verified ? "bg-slate-50 border-slate-200" : "bg-white border-indigo-100"
    }`}>
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1.5">{label}</label>
        <div className="flex items-center justify-between h-6">
            <span className="font-medium text-slate-900 text-sm truncate pr-2">{value}</span>
            {verified ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
                <div className="flex items-center gap-1.5 text-amber-500 text-xs bg-amber-50 px-1.5 py-0.5 rounded">
                    <AlertCircle size={10} />
                    <span>Review</span>
                </div>
            )}
        </div>
    </div>
);

export default TradeClearPage;
