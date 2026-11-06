import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Trophy,
  Download,
  QrCode,
  Power,
  Printer,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  PlusCircle,
  FileCheck,
  Archive,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { DashboardStats, EventItem, CertificateDownloadLog } from '../../types';

interface AdminDashboardProps {
  stats: DashboardStats;
  event: EventItem;
  onRefreshStats: () => void;
  onTogglePortal: (active: boolean) => Promise<void>;
  onNavigateTab: (tab: 'students' | 'events' | 'designer' | 'prep') => void;
  onOpenAddStudent: () => void;
  onOpenBulkUpload: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  event,
  onRefreshStats,
  onTogglePortal,
  onNavigateTab,
  onOpenAddStudent,
  onOpenBulkUpload,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [portalUrl, setPortalUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [recentLogs, setRecentLogs] = useState<CertificateDownloadLog[]>([]);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Fetch QR Code for the active event
  useEffect(() => {
    fetch(`/api/events/${event.id}/qr`)
      .then((res) => res.json())
      .then((data) => {
        if (data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
          setPortalUrl(data.portalUrl);
        }
      })
      .catch((err) => console.error('Failed to load event QR code', err));

    // Fetch recent download logs
    const token = localStorage.getItem('admin_token');
    fetch('/api/dashboard/logs', {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentLogs(data.slice(0, 6));
        }
      })
      .catch((err) => console.error('Failed to load logs', err));
  }, [event.id]);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onTogglePortal(!event.portalActive);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl || window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `NatureClub_Event_QR_${event.title.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrintQrPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Portal QR Code - ${event.title}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              text-align: center;
              padding: 40px;
              color: #0f291e;
            }
            .poster {
              border: 8px solid #1b4332;
              border-radius: 20px;
              padding: 40px;
              max-width: 650px;
              margin: 0 auto;
            }
            h1 { font-size: 26px; color: #1b4332; margin-bottom: 5px; text-transform: uppercase; }
            h2 { font-size: 16px; color: #2d6a4f; margin-top: 0; }
            .badge { display: inline-block; background: #eef8f2; color: #1b4332; padding: 6px 14px; border-radius: 999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
            img { width: 320px; height: 320px; border: 2px solid #d4af37; border-radius: 12px; }
            p { font-size: 16px; color: #374151; margin-top: 20px; }
            .url { font-family: monospace; font-size: 14px; color: #1b4332; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="poster">
            <h2>${event.institutionName} · ${event.campus}</h2>
            <div class="badge">NATURE CLUB OFFICIAL EVENT</div>
            <h1>${event.title}</h1>
            <p><strong>Date:</strong> ${event.date}</p>
            <img src="${qrDataUrl}" alt="Event QR Code" />
            <p><strong>SCAN WITH YOUR SMARTPHONE CAMERA</strong><br/>to access your official e-certificate</p>
            <div class="url">${portalUrl}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/certificates/export/zip', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Failed to generate ZIP export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Aurora_NatureClub_Certificates_Export.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download ZIP archive');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Event Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <span>Aurora Higher Education and Research Academy</span>
            <span aria-hidden="true">·</span>
            <span>Bhongir Campus</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Nature Club Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Event: <strong className="text-slate-800">{event.title}</strong> ({event.date})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshStats}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExportingZip}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300/80 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-60"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-800" />
            <span>{isExportingZip ? 'Archiving...' : 'Download All (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Grid (5 Cards as specified in Phase 1.2) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Registered Students */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students
            </span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {stats.totalStudents}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered participants</p>
        </div>

        {/* Metric 2: Total Certificates Generated */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Certificates
            </span>
            <Award className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {stats.totalCertificates}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{stats.publishedCertificates} Published</span>
            <span aria-hidden="true">·</span>
            <span>{stats.pendingApproval} Draft</span>
          </div>
        </div>

        {/* Metric 3: Total Participation Certificates */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Participation
            </span>
            <Award className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {stats.totalParticipation}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">General attendees</p>
        </div>

        {/* Metric 4: Total Winner Certificates */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Winners
            </span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {stats.totalWinners}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">1st, 2nd & 3rd Prizes</p>
        </div>

        {/* Metric 5: Total Certificates Downloaded */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-emerald-200 rounded-xl p-4 shadow-xs bg-gradient-to-br from-white to-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
              Downloaded
            </span>
            <Download className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-950 mt-2 font-mono tabular-nums">
            {stats.totalDownloaded}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">Verified student downloads</p>
        </div>
      </div>

      {/* Main Grid: QR Code Hub & Quick Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reusable Event QR Code Card (Important Feature #6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] font-semibold text-emerald-900">
                <QrCode className="w-3.5 h-3.5" />
                <span>Unified Event QR Entry Point</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                Student Certificate Portal QR Code
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                One shared, reusable QR code for all students. Display or print this around the campus
                or projector screen during the event.
              </p>
            </div>

            {/* Portal Activation Toggle Switch */}
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Portal Status
              </span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  event.portalActive
                    ? 'bg-emerald-900 text-white hover:bg-emerald-800'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{event.portalActive ? 'Active' : 'Deactivated'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="p-3 bg-white border border-emerald-200 rounded-xl shadow-xs shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Event Student Portal QR Code"
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Secure Direct Portal Link
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl || window.location.href}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    title="Copy Link"
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintQrPoster}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Campus Poster</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Students scan this single QR code to look up their name and download their approved certificate.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Workflow Hub & Activity Logs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Quick Management Navigation Buttons */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Administrative Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenAddStudent}
                className="flex items-center gap-2.5 p-3.5 text-left border border-slate-200 rounded-xl hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Add Student</div>
                  <div className="text-[11px] text-slate-500">Register single candidate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenBulkUpload}
                className="flex items-center gap-2.5 p-3.5 text-left border border-slate-200 rounded-xl hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-teal-50 text-teal-800 group-hover:bg-teal-900 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Upload CSV/Excel</div>
                  <div className="text-[11px] text-slate-500">Batch student roster</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('prep')}
                className="flex items-center gap-2.5 p-3.5 text-left border border-slate-200 rounded-xl hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-900 group-hover:text-white transition-colors">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Prepare & Publish</div>
                  <div className="text-[11px] text-slate-500">Assign category & approve</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('designer')}
                className="flex items-center gap-2.5 p-3.5 text-left border border-slate-200 rounded-xl hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-800 group-hover:bg-indigo-900 group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Template Designer</div>
                  <div className="text-[11px] text-slate-500">A4 Botanical borders & seal</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Download Activity Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-800" />
                <span>Recent Certificate Download Logs</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {recentLogs.length} recent
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No certificate downloads logged yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{log.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {log.rollNumber} · {log.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Downloaded
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(log.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
