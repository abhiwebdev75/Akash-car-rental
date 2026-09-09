import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Download,
  Eye,
} from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const toast = useToast();

  const [documents, setDocuments] = useState([
    {
      id: 'doc_1',
      type: 'DRIVING_LICENCE',
      title: 'Indian Driving License (Front & Back)',
      documentNumber: 'KA01 20210009876',
      status: 'VERIFIED',
      uploadedAt: '2026-08-15',
      verifiedAt: '2026-08-15',
    },
    {
      id: 'doc_2',
      type: 'GOVERNMENT_ID',
      title: 'Aadhaar / Passport ID Proof',
      documentNumber: 'XXXX-XXXX-4589',
      status: 'VERIFIED',
      uploadedAt: '2026-08-15',
      verifiedAt: '2026-08-15',
    },
  ]);

  const [uploadModal, setUploadModal] = useState(false);
  const [docType, setDocType] = useState('DRIVING_LICENCE');
  const [docNumber, setDocNumber] = useState('');
  const [fileSelected, setFileSelected] = useState(null);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!docNumber) {
      toast.error('Please enter the document number');
      return;
    }
    const newDoc = {
      id: 'doc_' + Date.now(),
      type: docType,
      title: docType === 'DRIVING_LICENCE' ? 'Driving License' : docType === 'CU_STUDENT_ID' ? 'CU Student ID' : 'Govt Photo ID',
      documentNumber: docNumber,
      status: 'PENDING',
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    toast.success('Document uploaded for KYC verification!');
    setUploadModal(false);
    setDocNumber('');
    setFileSelected(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Driving License & KYC Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Required for identity verification and contactless digital vehicle handover.
          </p>
        </div>

        {/* KYC Status Banner */}
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-900 text-base">KYC Status: Approved</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your driving license is verified. You are pre-approved for express vehicle pickup at any hub.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUploadModal(!uploadModal)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Upload New Document
          </button>
        </div>

        {/* Upload Form (collapsible) */}
        {uploadModal && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-4">Upload Document for Verification</h3>
            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
                  >
                    <option value="DRIVING_LICENCE">Driving License</option>
                    <option value="GOVERNMENT_ID">Govt Photo ID (Aadhaar / Passport)</option>
                    <option value="CU_STUDENT_ID">Chandigarh University Student ID</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Document Number</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. KA01 20210009876"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Attach File (JPG, PNG, or PDF)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">
                    {fileSelected ? fileSelected.name : 'Click to browse or drag file here'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 8 MB</p>
                  <input
                    type="file"
                    className="hidden"
                    id="docFile"
                    onChange={(e) => setFileSelected(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
                >
                  Submit Document
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Documents List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Your Submitted Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{doc.title}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.documentNumber}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Uploaded: {doc.uploadedAt}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

