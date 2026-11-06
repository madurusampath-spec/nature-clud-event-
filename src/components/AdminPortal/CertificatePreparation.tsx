import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Share2,
  Eye,
  Edit,
  Search,
  Filter,
  CheckSquare,
  Square,
  Award,
  Archive,
  Download,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import type { Certificate, EventItem, CertificateCategory, CertificateStatus } from '../../types';
import { CertificateView } from '../CertificateView';

interface CertificatePreparationProps {
  certificates: Certificate[];
  event: EventItem;
  onUpdateCategory: (certId: string, category: CertificateCategory) => Promise<void>;
  onBatchApprove: (ids: string[]) => Promise<void>;
  onBatchPublish: (ids: string[]) => Promise<void>;
  onUpdateCertificate: (id: string, updates: Partial<Certificate>) => Promise<void>;
  onExportZip: () => Promise<void>;
  onRefresh: () => void;
}

const CATEGORIES: CertificateCategory[] = [
  'Participation Certificate',
  'First Prize Certificate',
  'Second Prize Certificate',
  'Third Prize Certificate',
];

export const CertificatePreparation: React.FC<CertificatePreparationProps> = ({
  certificates,
  event,
  onUpdateCategory,
  onBatchApprove,
  onBatchPublish,
  onUpdateCertificate,
  onExportZip,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CertificateStatus>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Preview Modal
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  // Edit Correction Modal
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editCategory, setEditCategory] = useState<CertificateCategory>('Participation Certificate');
  const [editStatus, setEditStatus] = useState<CertificateStatus>('draft');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Batch action spinners
  const [isApproving, setIsApproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        searchTerm === '' ||
        c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [certificates, searchTerm, statusFilter]);

  const allFilteredSelected =
    filteredCerts.length > 0 && filteredCerts.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCerts.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsApproving(true);
    try {
      await onBatchApprove(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsApproving(false);
    }
  };

  const handleBatchPublish = async () => {
    if (selectedIds.length === 0) return;
    setIsPublishing(true);
    try {
      await onBatchPublish(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setEditName(cert.studentName);
    setEditRoll(cert.rollNumber);
    setEditDept(cert.department);
    setEditCategory(cert.category);
    setEditStatus(cert.status);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    setIsSavingEdit(true);
    try {
      await onUpdateCertificate(editingCert.id, {
        studentName: editName.trim(),
        rollNumber: editRoll.trim().toUpperCase(),
        department: editDept.trim(),
        category: editCategory,
        status: editStatus,
      });
      setEditingCert(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save correction');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-800" />
            <span>Certificate Preparation & Publishing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign prize categories, inspect credentials, approve batches, and publish for student access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExportZip}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100/90 border border-emerald-300 rounded-lg hover:bg-emerald-200"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-800" />
            <span>Export ZIP Roster</span>
          </button>
        </div>
      </div>

      {/* Filter and Batch Action Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student, roll, or cert ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              {(['ALL', 'draft', 'approved', 'published'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="text-xs font-semibold text-emerald-900">
              {selectedIds.length} Selected
            </span>

            <button
              type="button"
              onClick={handleBatchApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{isApproving ? 'Approving...' : 'Approve Selected'}</span>
            </button>

            <button
              type="button"
              onClick={handleBatchPublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish for Students'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Certificates Preparation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-800" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Category Assignment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Downloads</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No certificate records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => {
                  const isSelected = selectedIds.includes(cert.id);
                  return (
                    <tr
                      key={cert.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(cert.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {cert.certificateNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cert.studentName}</div>
                        <div className="font-mono text-[11px] text-emerald-900">{cert.rollNumber}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{cert.department}</div>
                        <div className="text-[11px] text-slate-400">{cert.year}</div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={cert.category}
                          onChange={(e) =>
                            onUpdateCategory(cert.id, e.target.value as CertificateCategory)
                          }
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-700"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            cert.status === 'published'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : cert.status === 'approved'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {cert.status === 'published' && <Share2 className="w-3 h-3" />}
                          {cert.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {cert.status === 'draft' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          <span className="capitalize">{cert.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {cert.downloadCount || 0}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            title="Preview Certificate"
                            className="p-1.5 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(cert)}
                            title="Correct Student Info"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>
            {certificates.filter((c) => c.status === 'published').length} published of {certificates.length} total
          </span>
          <span className="text-[11px] italic">
            * Only published certificates are downloadable by students in Phase 2
          </span>
        </div>
      </div>

      {/* Modal: Live Certificate Preview */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900">Certificate Preview</h3>
                <span className="font-mono text-xs text-slate-500">({previewCert.certificateNumber})</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 overflow-y-auto flex justify-center bg-slate-100 p-4 rounded-xl">
              <CertificateView
                certificate={previewCert}
                event={event}
                showDownloadButton={true}
              />
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Status: <strong className="capitalize text-slate-900">{previewCert.status}</strong>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Correct Student Info before publishing */}
      {editingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Correct Record Information</h3>
              <button
                type="button"
                onClick={() => setEditingCert(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name (Printed on Certificate)
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={editRoll}
                  onChange={(e) => setEditRoll(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CertificateCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval / Publication Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CertificateStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                >
                  <option value="draft">Draft (Under Review)</option>
                  <option value="approved">Approved (Ready to Publish)</option>
                  <option value="published">Published (Downloadable by Student)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg"
                >
                  {isSavingEdit ? 'Saving...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
