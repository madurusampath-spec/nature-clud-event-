import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  AlertCircle,
  Building2,
  ShieldCheck,
  User,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import type { EventItem, PublicStudentSearchResult, Certificate } from '../../types';
import { CertificateView } from '../CertificateView';

interface StudentPortalProps {
  event: EventItem;
  initialVerifyId?: string;
  onNavigateToVerify: (id: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  event,
  initialVerifyId,
  onNavigateToVerify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicStudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<PublicStudentSearchResult | null>(null);

  // Student Identity Confirmation state
  const [confirmationRoll, setConfirmationRoll] = useState('');
  const [confirmationPin, setConfirmationPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  // Approved Certificate & Event Data
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [portalInactiveNotice, setPortalInactiveNotice] = useState<string | null>(null);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check portal status on load
  useEffect(() => {
    if (!event.portalActive) {
      setPortalInactiveNotice(
        'The Student Certificate Portal has been temporarily paused by the college administration. Please contact Nature Club or check back shortly.'
      );
    } else {
      setPortalInactiveNotice(null);
    }
  }, [event.portalActive]);

  // Live Search Effect (Debounced)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/public/students/search?q=${encodeURIComponent(searchQuery.trim())}&eventId=${event.id}`
        );
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data);
        } else if (data.portalInactive) {
          setPortalInactiveNotice(data.error);
        }
      } catch (err) {
        console.error('Failed to search students', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, event.id]);

  // Handle student selecting their name
  const handleSelectStudent = (student: PublicStudentSearchResult) => {
    setSelectedStudent(student);
    setConfirmationRoll(student.rollNumber); // prefill or prompt confirmation
    setConfirmationPin('');
    setConfirmationError(null);
    setActiveCertificate(null);
  };

  // Verify identity and fetch official certificate
  const handleConfirmIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsConfirming(true);
    setConfirmationError(null);

    try {
      const res = await fetch('/api/public/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          rollNumber: confirmationRoll.trim(),
          confirmationCode: confirmationPin.trim() || undefined,
          eventId: event.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setActiveCertificate(data.certificate);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1b4332', '#2d6a4f', '#d4af37', '#52b788'],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve certificate';
      setConfirmationError(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  // Callback when student clicks download
  const handleDownloadLogged = async (certId: string) => {
    try {
      await fetch(`/api/public/certificate/${certId}/download`, {
        method: 'POST',
      });
      // Fire second celebratory burst
      confetti({
        particleCount: 60,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#d4af37', '#1b4332', '#40916c'],
      });
    } catch (err) {
      console.warn('Download logging failed silently', err);
    }
  };

  const handleResetSelection = () => {
    setSelectedStudent(null);
    setActiveCertificate(null);
    setConfirmationError(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Portal Inactive Alert Banner */}
      {portalInactiveNotice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950">Portal Temporarily Paused</h4>
            <p className="mt-0.5 leading-relaxed">{portalInactiveNotice}</p>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner (Phase 2.1) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-emerald-800">
        {/* Subtle Decorative Background Rings */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-amber-300 border border-white/15 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Collegiate E-Certificate Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome to {event.institutionName}
          </h1>

          <p className="text-sm sm:text-base text-emerald-200 font-medium mt-1">
            {event.campus}
          </p>

          <div className="mt-5 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              {event.organizingClub} Presents
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {event.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200 mt-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Event Date: {event.date}</span>
              <span aria-hidden="true">·</span>
              <span>Aurora Bhongir Campus</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-4 leading-relaxed">
            Search below using your full name or college roll number to find your approved e-certificate,
            preview your credential, and download your high-resolution official PDF.
          </p>
        </div>
      </div>

      {/* Main Student Interaction Workflow */}
      <div className="space-y-6">
        {/* Step 1: Student Search Interface (Phase 2.2) */}
        {!activeCertificate && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-xl mx-auto text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Find Your E-Certificate
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered student name or roll number as submitted to Nature Club.
              </p>
            </div>

            {/* Large Search Input */}
            <div className="max-w-xl mx-auto relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-emerald-800" />
                <input
                  type="text"
                  disabled={!event.portalActive}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type your name or roll number (e.g. Rahul Kumar or 22BH1A0501)..."
                  className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-800 focus:bg-white rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs disabled:opacity-50"
                />
                {isSearching && (
                  <RefreshCw className="absolute right-4 w-4 h-4 text-emerald-800 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown Search Results */}
              {searchQuery.trim().length >= 2 && (
                <div className="mt-3 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500">
                      {isSearching ? (
                        <span>Searching registered candidates...</span>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-700">No matching published certificate found.</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Certificates must be approved and published by the administration before they appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.studentId}
                        type="button"
                        onClick={() => handleSelectStudent(item)}
                        className={`w-full p-4 text-left flex items-center justify-between hover:bg-emerald-50/70 transition-colors ${
                          selectedStudent?.studentId === item.studentId ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                            <p className="text-xs text-slate-500 font-mono">
                              Roll No: <strong className="text-emerald-900">{item.rollNumber}</strong> · {item.department}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-md">
                            <Award className="w-3 h-3 text-emerald-800" />
                            <span>{item.certificateCategory}</span>
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1">
                            Click to select
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Student Confirmation & Security Verification (Phase 2.2 Confirmation Card) */}
            {selectedStudent && (
              <div className="max-w-xl mx-auto mt-6 p-6 bg-slate-50 border border-emerald-200 rounded-2xl shadow-xs">
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Step 2: Confirm Identity
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedStudent.department} · {selectedStudent.year}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Change
                  </button>
                </div>

                <div className="my-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Certificate Type:</span>
                    <span className="font-bold text-emerald-900">
                      {selectedStudent.certificateCategory}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Event:</span>
                    <span className="font-semibold text-slate-800">{event.title}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Security Notice:</span>
                    <span className="text-slate-600 text-[11px]">
                      Student email is protected and kept private.
                    </span>
                  </div>
                </div>

                {confirmationError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{confirmationError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmIdentity} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm College Roll Number:
                    </label>
                    <input
                      type="text"
                      required
                      value={confirmationRoll}
                      onChange={(e) => setConfirmationRoll(e.target.value)}
                      placeholder="e.g. 22BH1A0501"
                      className="w-full px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConfirming}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & View Certificate</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Certificate Preview & Download (Phase 2.3 & 2.4) */}
        {activeCertificate && (
          <div className="space-y-6">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved & Published Credential</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeCertificate.studentName}
                </h2>
                <p className="text-xs text-slate-600 font-mono">
                  Roll No: {activeCertificate.rollNumber} · {activeCertificate.department}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetSelection}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 self-start sm:self-center"
              >
                Search Another Student
              </button>
            </div>

            {/* High-Fidelity A4 Landscape Certificate Display */}
            <div className="bg-slate-100/80 p-4 sm:p-8 rounded-3xl border border-slate-200 flex justify-center shadow-inner">
              <CertificateView
                certificate={activeCertificate}
                event={event}
                onDownloadLogged={handleDownloadLogged}
                showDownloadButton={true}
              />
            </div>

            {/* Certificate Verification Info Card (Phase 2.5) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    Tamper-Evident Verification Built-In
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Anyone can scan the QR code printed on this certificate or search Certificate ID{' '}
                    <strong className="font-mono text-emerald-900">{activeCertificate.certificateNumber}</strong> to verify authenticity.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToVerify(activeCertificate.certificateNumber)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 whitespace-nowrap shrink-0"
              >
                <span>Test Verification Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
