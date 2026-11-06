import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Users,
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react';
import type { Student } from '../../types';

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBulkUpload: (studentsList: Array<Omit<Student, 'id' | 'createdAt'>>) => Promise<void>;
  isOpenAddModal: boolean;
  setIsOpenAddModal: (open: boolean) => void;
  isOpenUploadModal: boolean;
  setIsOpenUploadModal: (open: boolean) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkUpload,
  isOpenAddModal,
  setIsOpenAddModal,
  isOpenUploadModal,
  setIsOpenUploadModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Add/Edit Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formDept, setFormDept] = useState('Computer Science & Engineering');
  const [formYear, setFormYear] = useState('III Year');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Upload state
  const [csvPreviewData, setCsvPreviewData] = useState<Array<Omit<Student, 'id' | 'createdAt'>>>([]);
  const [csvParseError, setCsvParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Unique departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.department));
    return ['ALL', ...Array.from(set)];
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        searchTerm === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [students, searchTerm, selectedDept]);

  // Open modal for editing
  const handleStartEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormRoll(student.rollNumber);
    setFormDept(student.department);
    setFormYear(student.year);
    setFormEmail(student.email);
    setFormError(null);
    setIsOpenAddModal(true);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormRoll('');
    setFormDept('Computer Science & Engineering');
    setFormYear('III Year');
    setFormEmail('');
    setFormError(null);
    setIsOpenAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, {
          name: formName.trim(),
          rollNumber: formRoll.trim().toUpperCase(),
          department: formDept.trim(),
          year: formYear.trim(),
          email: formEmail.trim().toLowerCase(),
        });
      } else {
        await onAddStudent({
          name: formName.trim(),
          rollNumber: formRoll.trim().toUpperCase(),
          department: formDept.trim(),
          year: formYear.trim(),
          email: formEmail.trim().toLowerCase(),
        });
      }
      setIsOpenAddModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV/Excel Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvParseError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setCsvParseError(`Parsing error: ${results.errors[0].message}`);
          return;
        }

        const parsed: Array<Omit<Student, 'id' | 'createdAt'>> = [];
        const rows = results.data as Array<Record<string, string>>;

        rows.forEach((row) => {
          // Normalize column headers
          const name = row['Student Name'] || row['Name'] || row['student_name'] || row['name'] || '';
          const roll =
            row['Roll Number'] || row['Roll No'] || row['Roll'] || row['roll_number'] || row['roll'] || '';
          const dept =
            row['Department'] || row['Dept'] || row['department'] || 'Computer Science & Engineering';
          const year = row['Year'] || row['year'] || 'III Year';
          const email =
            row['Email Address'] || row['Email'] || row['email'] || `${roll.trim().toLowerCase()}@aurora.edu`;

          if (name && roll) {
            parsed.push({
              name: String(name).trim(),
              rollNumber: String(roll).trim().toUpperCase(),
              department: String(dept).trim(),
              year: String(year).trim(),
              email: String(email).trim().toLowerCase(),
            });
          }
        });

        if (parsed.length === 0) {
          setCsvParseError('No valid rows found. Ensure CSV has "Name" and "Roll Number" columns.');
        } else {
          setCsvPreviewData(parsed);
        }
      },
    });
  };

  const handleConfirmImport = async () => {
    if (csvPreviewData.length === 0) return;
    setIsImporting(true);
    try {
      await onBulkUpload(csvPreviewData);
      setIsOpenUploadModal(false);
      setCsvPreviewData([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk import failed';
      setCsvParseError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Student Name,Roll Number,Department,Year,Email Address\n' +
      'Siddharth Varma,22BH1A0512,Computer Science & Engineering,III Year,siddharth.v@aurora.edu\n' +
      'Bhavya Reddy,23BH1A0410,Electronics & Communication Engg,II Year,bhavya.r@aurora.edu\n' +
      'Aditya Sharma,21BH1A0302,Mechanical Engineering,IV Year,aditya.s@aurora.edu\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'NatureClub_Students_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllCsv = () => {
    let csv = 'Name,Roll Number,Department,Year,Email\n';
    students.forEach((s) => {
      csv += `"${s.name}","${s.rollNumber}","${s.department}","${s.year}","${s.email}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aurora_Registered_Students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <span>Student Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidates, verify records, and import bulk rosters via CSV or Excel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportAllCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCsvPreviewData([]);
              setCsvParseError(null);
              setIsOpenUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV/Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, or department..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Department:
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:bg-white"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Grid (High-Density Table) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-emerald-900">
                      {student.rollNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{student.department}</td>
                    <td className="py-3 px-4 text-slate-600">{student.year}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {student.email}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(student)}
                          title="Edit Student"
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete student ${student.name} (${student.rollNumber})?`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          title="Delete Student"
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          <span className="font-mono text-[11px]">Aurora Higher Education & Research Academy</span>
        </div>
      </div>

      {/* Modal: Add / Edit Student */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoll}
                    onChange={(e) => setFormRoll(e.target.value)}
                    placeholder="e.g. 22BH1A0501"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year of Study *
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="I Year">I Year</option>
                    <option value="II Year">II Year</option>
                    <option value="III Year">III Year</option>
                    <option value="IV Year">IV Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rahul.k22@aurora.edu"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Upload CSV / Excel */}
      {isOpenUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900">Upload Student Roster (CSV / Excel)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-4 overflow-y-auto pr-1">
              {/* Instructions and Template Download */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Required Columns in CSV:</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 font-mono">
                    Student Name, Roll Number, Department, Year, Email Address
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-semibold text-[11px] text-emerald-900 hover:bg-emerald-100 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-700 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv, .tsv, .txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-emerald-800 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">
                    Click to select CSV file from your computer
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports exported Excel sheets saved as CSV (.csv)
                  </p>
                </label>
              </div>

              {csvParseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{csvParseError}</span>
                </div>
              )}

              {/* Preview parsed table */}
              {csvPreviewData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Preview Records Ready for Import ({csvPreviewData.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCsvPreviewData([])}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Roll</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreviewData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 font-medium text-slate-900">{row.name}</td>
                            <td className="py-1.5 px-3 font-mono text-emerald-800">{row.rollNumber}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.department}</td>
                            <td className="py-1.5 px-3 text-slate-500">{row.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenUploadModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={csvPreviewData.length === 0 || isImporting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg disabled:opacity-40"
              >
                {isImporting ? 'Importing...' : `Import ${csvPreviewData.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
