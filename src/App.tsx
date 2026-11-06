/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Calendar,
  FileCheck,
  Palette,
  QrCode,
  Shield,
  Layers,
  Leaf,
  GraduationCap,
} from 'lucide-react';
import type {
  EventItem,
  Student,
  Certificate,
  DashboardStats,
  CertificateCategory,
} from './types';
import { Navigation } from './components/Navigation';
import { AdminLogin } from './components/AdminPortal/AdminLogin';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { StudentManagement } from './components/AdminPortal/StudentManagement';
import { EventManagement } from './components/AdminPortal/EventManagement';
import { CertificateDesigner } from './components/AdminPortal/CertificateDesigner';
import { CertificatePreparation } from './components/AdminPortal/CertificatePreparation';
import { StudentPortal } from './components/StudentPortal/StudentPortal';
import { PublicVerification } from './components/PublicVerification';
import { EventQrModal } from './components/EventQrModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'admin' | 'verify'>('student');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'students' | 'events' | 'designer' | 'prep'>('dashboard');

  // Authentication state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);

  // Core Data
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCertificates: 0,
    totalParticipation: 0,
    totalWinners: 0,
    totalDownloaded: 0,
    publishedCertificates: 0,
    pendingApproval: 0,
  });

  // Modals & UI triggers
  const [isEventQrModalOpen, setIsEventQrModalOpen] = useState(false);
  const [isOpenAddStudentModal, setIsOpenAddStudentModal] = useState(false);
  const [isOpenBulkUploadModal, setIsOpenBulkUploadModal] = useState(false);
  const [verificationInitialId, setVerificationInitialId] = useState<string>('');

  // Check stored auth & URL params on initial mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    if (token) {
      setAdminToken(token);
      if (userStr) {
        try {
          setAdminUser(JSON.parse(userStr));
        } catch (e) {
          // ignore
        }
      }
    }

    // Inspect URL queries
    const params = new URLSearchParams(window.location.search);
    const verifyParam = params.get('verify');
    if (verifyParam) {
      setVerificationInitialId(verifyParam);
      setCurrentView('verify');
    }

    // Load initial event info
    fetchPublicEvent();
  }, []);

  // Fetch Public Event data
  const fetchPublicEvent = async () => {
    try {
      const res = await fetch('/api/public/event');
      const data = await res.json();
      setActiveEvent(data);
    } catch (err) {
      console.error('Error fetching event data', err);
    }
  };

  // Fetch Admin Data (when authenticated or on admin tab change)
  const fetchAdminData = async () => {
    if (!adminToken) return;
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      // Stats
      const statsRes = await fetch('/api/dashboard/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Events
      const eventsRes = await fetch('/api/events', { headers });
      if (eventsRes.ok) {
        const evts = await eventsRes.json();
        setAllEvents(evts);
        if (evts.length > 0 && !activeEvent) {
          setActiveEvent(evts[0]);
        }
      }

      // Students
      const stuRes = await fetch('/api/students', { headers });
      if (stuRes.ok) setStudents(await stuRes.json());

      // Certificates
      const certRes = await fetch('/api/certificates', { headers });
      if (certRes.ok) setCertificates(await certRes.json());
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  useEffect(() => {
    if (adminToken && currentView === 'admin') {
      fetchAdminData();
    }
  }, [adminToken, currentView]);

  // Auth Handlers
  const handleAdminLogin = (token: string, user: { name: string; email: string }) => {
    setAdminToken(token);
    setAdminUser(user);
    fetchAdminData();
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminToken(null);
    setAdminUser(null);
    setCurrentView('student');
  };

  // Student Actions
  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add student');
    await fetchAdminData();
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Student>) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student');
    await fetchAdminData();
  };

  const handleDeleteStudent = async (id: string) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error('Failed to delete student');
    await fetchAdminData();
  };

  const handleBulkUpload = async (studentsList: Array<Omit<Student, 'id' | 'createdAt'>>) => {
    const res = await fetch('/api/students/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ students: studentsList }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk upload');
    await fetchAdminData();
    alert(`Bulk Import Complete: ${data.successCount} added, ${data.failedCount} skipped.`);
  };

  // Event & Portal Actions
  const handleTogglePortal = async (active: boolean) => {
    if (!activeEvent) return;
    const res = await fetch(`/api/events/${activeEvent.id}/toggle-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setActiveEvent({ ...activeEvent, portalActive: active });
      await fetchAdminData();
    }
  };

  const handleUpdateEvent = async (id: string, updates: Partial<EventItem>) => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update event');
    setActiveEvent(data);
    await fetchAdminData();
  };

  const handleCreateEvent = async (eventData: Omit<EventItem, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(eventData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create event');
    setActiveEvent(data);
    await fetchAdminData();
  };

  const handleUpdateTemplateConfig = async (updates: Partial<EventItem['templateConfig']>) => {
    if (!activeEvent) return;
    const updatedConfig = { ...activeEvent.templateConfig, ...updates };
    await handleUpdateEvent(activeEvent.id, { templateConfig: updatedConfig });
  };

  // Certificate Actions
  const handleUpdateCategory = async (certId: string, category: CertificateCategory) => {
    const res = await fetch(`/api/certificates/${certId}/category`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ category }),
    });
    if (res.ok) await fetchAdminData();
  };

  const handleBatchApprove = async (ids: string[]) => {
    const res = await fetch('/api/certificates/batch-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) await fetchAdminData();
  };

  const handleBatchPublish = async (ids: string[]) => {
    const res = await fetch('/api/certificates/batch-publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) await fetchAdminData();
  };

  const handleUpdateCertificate = async (id: string, updates: Partial<Certificate>) => {
    const res = await fetch(`/api/certificates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) await fetchAdminData();
  };

  const handleExportZip = async () => {
    const res = await fetch('/api/certificates/export/zip', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error('ZIP generation failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aurora_NatureClub_Certificates_Export.zip';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleNavigateToVerify = (id: string) => {
    setVerificationInitialId(id);
    setCurrentView('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Universal Top Navigation */}
      <Navigation
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isAdminAuthenticated={Boolean(adminToken)}
        onAdminLogout={handleAdminLogout}
        onOpenEventQrModal={() => setIsEventQrModalOpen(true)}
      />

      {/* Main Body View Switching */}
      <main className="flex-1 pb-16">
        {/* VIEW 1: STUDENT PORTAL (PHASE 2) */}
        {currentView === 'student' && activeEvent && (
          <StudentPortal
            event={activeEvent}
            initialVerifyId={verificationInitialId}
            onNavigateToVerify={handleNavigateToVerify}
          />
        )}

        {/* VIEW 2: CERTIFICATE VERIFICATION (PHASE 2.5) */}
        {currentView === 'verify' && (
          <PublicVerification
            initialIdentifier={verificationInitialId}
            onBackToStudentPortal={() => setCurrentView('student')}
          />
        )}

        {/* VIEW 3: ADMIN PANEL (PHASE 1) */}
        {currentView === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!adminToken ? (
              <AdminLogin onLoginSuccess={handleAdminLogin} />
            ) : (
              activeEvent && (
                <div className="space-y-6">
                  {/* Admin Sub-Navigation Tabs */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto shadow-xs text-xs font-semibold no-print">
                    <button
                      type="button"
                      onClick={() => setAdminTab('dashboard')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        adminTab === 'dashboard'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>1. Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminTab('students')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        adminTab === 'students'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>2. Student Management</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminTab('events')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        adminTab === 'events'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>3. Event Management</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminTab('designer')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        adminTab === 'designer'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>4. Template Designer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminTab('prep')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        adminTab === 'prep'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>5. Certificate Preparation & Publishing</span>
                    </button>
                  </div>

                  {/* Active Admin Sub-View */}
                  {adminTab === 'dashboard' && (
                    <AdminDashboard
                      stats={stats}
                      event={activeEvent}
                      onRefreshStats={fetchAdminData}
                      onTogglePortal={handleTogglePortal}
                      onNavigateTab={(tab) => setAdminTab(tab)}
                      onOpenAddStudent={() => {
                        setAdminTab('students');
                        setIsOpenAddStudentModal(true);
                      }}
                      onOpenBulkUpload={() => {
                        setAdminTab('students');
                        setIsOpenBulkUploadModal(true);
                      }}
                    />
                  )}

                  {adminTab === 'students' && (
                    <StudentManagement
                      students={students}
                      onAddStudent={handleAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      onBulkUpload={handleBulkUpload}
                      isOpenAddModal={isOpenAddStudentModal}
                      setIsOpenAddModal={setIsOpenAddStudentModal}
                      isOpenUploadModal={isOpenBulkUploadModal}
                      setIsOpenUploadModal={setIsOpenBulkUploadModal}
                    />
                  )}

                  {adminTab === 'events' && (
                    <EventManagement
                      events={allEvents}
                      activeEvent={activeEvent}
                      onSelectEvent={(evt) => setActiveEvent(evt)}
                      onUpdateEvent={handleUpdateEvent}
                      onCreateEvent={handleCreateEvent}
                    />
                  )}

                  {adminTab === 'designer' && (
                    <CertificateDesigner
                      event={activeEvent}
                      onUpdateTemplateConfig={handleUpdateTemplateConfig}
                    />
                  )}

                  {adminTab === 'prep' && (
                    <CertificatePreparation
                      certificates={certificates}
                      event={activeEvent}
                      onUpdateCategory={handleUpdateCategory}
                      onBatchApprove={handleBatchApprove}
                      onBatchPublish={handleBatchPublish}
                      onUpdateCertificate={handleUpdateCertificate}
                      onExportZip={handleExportZip}
                      onRefresh={fetchAdminData}
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Shared Reusable Event QR Modal */}
      {activeEvent && (
        <EventQrModal
          event={activeEvent}
          isOpen={isEventQrModalOpen}
          onClose={() => setIsEventQrModalOpen(false)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-xs">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                Nature Club · Aurora Higher Education and Research Academy
              </p>
              <p className="text-[11px] text-slate-400">
                Bhongir Campus · ECO GAMES: Play For The Planet (14 November 2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Official E-Certificate Generation System</span>
            <span aria-hidden="true">·</span>
            <span>Cryptographically Verified</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentView(currentView === 'admin' ? 'student' : 'admin')}
              className="text-emerald-800 font-semibold hover:underline"
            >
              {currentView === 'admin' ? 'Student Portal' : 'Admin Portal'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
