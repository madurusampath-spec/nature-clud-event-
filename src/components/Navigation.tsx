import React from 'react';
import { Award, QrCode, Shield, CheckCircle2, LogIn, LogOut, UserCheck } from 'lucide-react';

interface NavigationProps {
  currentView: 'student' | 'admin' | 'verify';
  onNavigate: (view: 'student' | 'admin' | 'verify') => void;
  isAdminAuthenticated: boolean;
  onAdminLogout: () => void;
  onOpenEventQrModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  isAdminAuthenticated,
  onAdminLogout,
  onOpenEventQrModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 px-4 sm:px-8 py-3.5 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <button
          onClick={() => onNavigate('student')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-emerald-950 whitespace-nowrap shrink-0">
            Nature Club · E-Certificates
          </span>
        </button>

        {/* Zone 2: Navigation Links (Single-line, concise) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onNavigate('student')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'student'
                ? 'text-emerald-900 font-semibold border-b-2 border-emerald-800'
                : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            Student Portal
          </button>

          <button
            onClick={() => onNavigate('verify')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'verify'
                ? 'text-emerald-900 font-semibold border-b-2 border-emerald-800'
                : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            Verify Credential
          </button>

          <button
            onClick={onOpenEventQrModal}
            className="text-slate-600 hover:text-emerald-800 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 py-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Event QR</span>
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === 'admin'
                ? 'text-emerald-900 font-semibold border-b-2 border-emerald-800'
                : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            Admin Panel
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Admin Active
              </span>
              <button
                onClick={onAdminLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate(currentView === 'admin' ? 'student' : 'admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              {currentView === 'admin' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Student View</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
