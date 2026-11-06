import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { VerificationResult } from '../types';

interface PublicVerificationProps {
  initialIdentifier?: string;
  onBackToStudentPortal: () => void;
}

export const PublicVerification: React.FC<PublicVerificationProps> = ({
  initialIdentifier = '',
  onBackToStudentPortal,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const verifyCertificate = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setIsVerifying(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/public/verify/${encodeURIComponent(idToVerify.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({
        valid: false,
        message: 'Network error communicating with verification service.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialIdentifier) {
      setIdentifier(initialIdentifier);
      verifyCertificate(initialIdentifier);
    }
  }, [initialIdentifier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(identifier);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center shadow-md mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Certificate Authenticity Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Aurora Higher Education and Research Academy · Bhongir Campus
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter Certificate ID (e.g. AHERA-NC-2026-ECO-0001)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <span>
            Quick test: Try sample ID{' '}
            <button
              type="button"
              onClick={() => {
                setIdentifier('AHERA-NC-2026-ECO-0001');
                verifyCertificate('AHERA-NC-2026-ECO-0001');
              }}
              className="font-mono text-emerald-800 font-semibold hover:underline"
            >
              AHERA-NC-2026-ECO-0001
            </button>
          </span>
          <button
            type="button"
            onClick={onBackToStudentPortal}
            className="text-emerald-800 font-medium hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Student Portal</span>
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {hasSearched && result && (
        <div
          className={`border rounded-2xl p-6 sm:p-8 shadow-sm transition-all ${
            result.valid
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}
        >
          {result.valid && result.certificate ? (
            <div className="space-y-6">
              {/* Genuine Badge */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">
                    <span>GENUINE & VERIFIED CREDENTIAL</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Authentic Aurora Academy E-Certificate
                  </h2>
                </div>
              </div>

              {/* Credential Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/90 p-5 rounded-xl border border-emerald-200/80 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Certificate Holder:</span>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {result.certificate.studentName}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">College Roll Number:</span>
                  <p className="font-mono font-bold text-emerald-900 text-sm mt-0.5">
                    {result.certificate.rollNumber}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Certificate ID:</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">
                    {result.certificate.certificateNumber}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Certificate Category:</span>
                  <p className="font-bold text-emerald-900 mt-0.5">
                    {result.certificate.category}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Department & Year:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {result.certificate.department} · {result.certificate.year}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Issuing Institution:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {result.certificate.institutionName} ({result.certificate.campus})
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Event:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {result.certificate.eventTitle} ({result.certificate.eventDate})
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Organizing Body:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {result.certificate.organizingClub}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
                <span>Issued with cryptographic verification token</span>
                <span className="text-emerald-800 font-medium">Status: Official College Archive</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rose-950">
                    Invalid or Unregistered Certificate
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {result.message ||
                      'The specified certificate identifier could not be verified in the institutional registry.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
