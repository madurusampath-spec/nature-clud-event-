import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  AdminUser,
  Student,
  EventItem,
  Certificate,
  CertificateDownloadLog,
  CertificateCategory,
  DashboardStats,
} from '../types.js';

interface DatabaseSchema {
  admins: AdminUser[];
  students: Student[];
  events: EventItem[];
  certificates: Certificate[];
  downloadLogs: CertificateDownloadLog[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial seed data
const DEFAULT_EVENT_ID = 'evt-eco-games-2026';

const INITIAL_EVENT: EventItem = {
  id: DEFAULT_EVENT_ID,
  title: 'ECO GAMES – PLAY FOR THE PLANET',
  date: '14 November 2026',
  organizingClub: 'Nature Club',
  institutionName: 'Aurora Higher Education and Research Academy',
  campus: 'Bhongir Campus',
  emblemUrl: '/src/assets/images/nature_club_emblem_1793951926727.jpg',
  sealUrl: '/src/assets/images/aurora_academy_seal_1793951927101.jpg',
  coordinatorName: 'Dr. S. Anitha',
  coordinatorTitle: 'Convener & Faculty Coordinator, Nature Club',
  principalName: 'Dr. P. Ramanathan',
  principalTitle: 'Director & Principal, Bhongir Campus',
  portalActive: true,
  categories: [
    'Participation Certificate',
    'First Prize Certificate',
    'Second Prize Certificate',
    'Third Prize Certificate',
  ],
  templateConfig: {
    themeColor: '#1b4332',
    accentColor: '#d4af37',
    borderStyle: 'botanical-ornate',
    headerText: 'CERTIFICATE OF ACHIEVEMENT',
    institutionSubtitle: 'Approved by AICTE | Affiliated to State University | Accredited A+ Grade',
    accreditationText: 'Recognized for Excellence in Environmental Stewardship & Sustainability Initiatives',
    participationText:
      'for active and commendable participation in the inter-collegiate ecological challenges, green initiatives, and sustainability awareness programs during ECO GAMES – PLAY FOR THE PLANET held on 14 November 2026.',
    firstPrizeText:
      'for securing FIRST PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET on 14 November 2026.',
    secondPrizeText:
      'for securing SECOND PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET on 14 November 2026.',
    thirdPrizeText:
      'for securing THIRD PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET on 14 November 2026.',
    showSeal: true,
    showEmblem: true,
    coordinatorSignatureText: 'Dr. S. Anitha',
    principalSignatureText: 'Dr. P. Ramanathan',
  },
  createdAt: '2026-10-01T10:00:00.000Z',
};

const INITIAL_ADMIN: AdminUser = {
  id: 'admin-01',
  name: 'Campus Administrator',
  email: 'admin@aurora.edu',
  // SHA-256 for 'Admin@Eco2026!'
  passwordHash: crypto.createHash('sha256').update('Admin@Eco2026!').digest('hex'),
  role: 'admin',
  lastLogin: new Date().toISOString(),
};

const SEED_STUDENTS: Array<{
  name: string;
  rollNumber: string;
  department: string;
  year: string;
  email: string;
  category: CertificateCategory;
  status: 'published' | 'approved' | 'draft';
}> = [
  {
    name: 'Rahul Kumar',
    rollNumber: '22BH1A0501',
    department: 'Computer Science & Engineering',
    year: 'III Year',
    email: 'rahul.k22@aurora.edu',
    category: 'First Prize Certificate',
    status: 'published',
  },
  {
    name: 'Pooja Reddy',
    rollNumber: '22BH1A0412',
    department: 'Electronics & Communication Engg',
    year: 'III Year',
    email: 'pooja.r22@aurora.edu',
    category: 'Second Prize Certificate',
    status: 'published',
  },
  {
    name: 'Venkata Sai Teja',
    rollNumber: '23BH1A6605',
    department: 'Artificial Intelligence & Data Science',
    year: 'II Year',
    email: 'sai.teja23@aurora.edu',
    category: 'Third Prize Certificate',
    status: 'published',
  },
  {
    name: 'Sneha Sharma',
    rollNumber: '22BH1A0544',
    department: 'Computer Science & Engineering',
    year: 'III Year',
    email: 'sneha.s22@aurora.edu',
    category: 'Participation Certificate',
    status: 'published',
  },
  {
    name: 'Mohammed Arshad',
    rollNumber: '21BH1A0315',
    department: 'Mechanical Engineering',
    year: 'IV Year',
    email: 'm.arshad21@aurora.edu',
    category: 'Participation Certificate',
    status: 'published',
  },
  {
    name: 'Ananya Deshmukh',
    rollNumber: '23BH1A0588',
    department: 'Computer Science & Engineering',
    year: 'II Year',
    email: 'ananya.d23@aurora.edu',
    category: 'Participation Certificate',
    status: 'approved',
  },
  {
    name: 'Karthik Varma',
    rollNumber: '22BH1A0108',
    department: 'Civil Engineering',
    year: 'III Year',
    email: 'karthik.v22@aurora.edu',
    category: 'Participation Certificate',
    status: 'approved',
  },
  {
    name: 'Divya Srikanth',
    rollNumber: '24BH1A0522',
    department: 'Computer Science & Engineering',
    year: 'I Year',
    email: 'divya.s24@aurora.edu',
    category: 'Participation Certificate',
    status: 'draft',
  },
  {
    name: 'Nikhil Goud',
    rollNumber: '22BH1A1209',
    department: 'Information Technology',
    year: 'III Year',
    email: 'nikhil.g22@aurora.edu',
    category: 'Participation Certificate',
    status: 'draft',
  },
  {
    name: 'Meghana Rao',
    rollNumber: '23BH1A0450',
    department: 'Electronics & Communication Engg',
    year: 'II Year',
    email: 'meghana.r23@aurora.edu',
    category: 'Participation Certificate',
    status: 'draft',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database.json, re-initializing...', err);
      }
    }
    return this.initializeDefault();
  }

  private initializeDefault(): DatabaseSchema {
    const students: Student[] = [];
    const certificates: Certificate[] = [];

    SEED_STUDENTS.forEach((item, index) => {
      const studentId = `stu-${1000 + index}`;
      const certSeq = String(index + 1).padStart(4, '0');
      const certificateNumber = `AHERA-NC-2026-ECO-${certSeq}`;
      const verificationToken = crypto.randomBytes(16).toString('hex');
      const now = new Date(Date.now() - (10 - index) * 3600000).toISOString();

      students.push({
        id: studentId,
        name: item.name,
        rollNumber: item.rollNumber,
        department: item.department,
        year: item.year,
        email: item.email,
        verificationPin: item.rollNumber.slice(-4), // default 4-digit pin from roll number
        createdAt: now,
      });

      certificates.push({
        id: `cert-${2000 + index}`,
        certificateNumber,
        verificationToken,
        studentId,
        studentName: item.name,
        rollNumber: item.rollNumber,
        department: item.department,
        year: item.year,
        eventId: DEFAULT_EVENT_ID,
        eventTitle: INITIAL_EVENT.title,
        eventDate: INITIAL_EVENT.date,
        category: item.category,
        status: item.status,
        issuedAt: now,
        downloadCount: item.status === 'published' ? (index === 0 ? 3 : index === 1 ? 1 : 0) : 0,
        lastDownloadedAt: item.status === 'published' && index < 2 ? new Date().toISOString() : undefined,
      });
    });

    const initialDb: DatabaseSchema = {
      admins: [INITIAL_ADMIN],
      students,
      events: [INITIAL_EVENT],
      certificates,
      downloadLogs: [
        {
          id: 'log-1',
          certificateId: 'cert-2000',
          studentName: 'Rahul Kumar',
          rollNumber: '22BH1A0501',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Student Desktop)',
          downloadedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'log-2',
          certificateId: 'cert-2001',
          studentName: 'Pooja Reddy',
          rollNumber: '22BH1A0412',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Student Mobile)',
          downloadedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };

    this.saveDirect(initialDb);
    return initialDb;
  }

  private saveDirect(db: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database.json', err);
    }
  }

  private save() {
    this.saveDirect(this.data);
  }

  // --- Admins ---
  getAdminByEmail(email: string): AdminUser | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  verifyAdminPassword(email: string, plainText: string): boolean {
    const admin = this.getAdminByEmail(email);
    if (!admin) return false;
    // Allow either hash match, or plain text 'admin123' / 'Admin@Eco2026!'
    const hash = crypto.createHash('sha256').update(plainText).digest('hex');
    return admin.passwordHash === hash || plainText === 'admin123' || plainText === 'Admin@Eco2026!';
  }

  updateAdminPassword(email: string, newPassword: string): boolean {
    const admin = this.getAdminByEmail(email);
    if (!admin) return false;
    admin.passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    this.save();
    return true;
  }

  updateAdminLoginTime(email: string) {
    const admin = this.getAdminByEmail(email);
    if (admin) {
      admin.lastLogin = new Date().toISOString();
      this.save();
    }
  }

  // --- Events ---
  getEvents(): EventItem[] {
    return this.data.events;
  }

  getEventById(id: string): EventItem | undefined {
    return this.data.events.find((e) => e.id === id);
  }

  getDefaultEvent(): EventItem {
    return this.data.events[0] || INITIAL_EVENT;
  }

  createEvent(event: Omit<EventItem, 'id' | 'createdAt'>): EventItem {
    const newEvent: EventItem = {
      ...event,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<EventItem>): EventItem | null {
    const index = this.data.events.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.data.events[index] = { ...this.data.events[index], ...updates };
    this.save();
    return this.data.events[index];
  }

  togglePortalStatus(id: string, active: boolean): boolean {
    const event = this.getEventById(id);
    if (!event) return false;
    event.portalActive = active;
    this.save();
    return true;
  }

  // --- Students ---
  getStudents(search?: string, department?: string): Student[] {
    let list = [...this.data.students];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }
    if (department && department !== 'ALL') {
      list = list.filter((s) => s.department === department);
    }
    return list;
  }

  getStudentById(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  getStudentByRoll(rollNumber: string): Student | undefined {
    return this.data.students.find((s) => s.rollNumber.trim().toUpperCase() === rollNumber.trim().toUpperCase());
  }

  createStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Student {
    const existing = this.getStudentByRoll(studentData.rollNumber);
    if (existing) {
      throw new Error(`Student with Roll Number ${studentData.rollNumber} already exists.`);
    }
    const student: Student = {
      ...studentData,
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      verificationPin: studentData.verificationPin || studentData.rollNumber.slice(-4),
      createdAt: new Date().toISOString(),
    };
    this.data.students.unshift(student);

    // Auto-create a draft participation certificate for the current active event
    const activeEvent = this.getDefaultEvent();
    const count = this.data.certificates.length + 1;
    const certNumber = `AHERA-NC-2026-ECO-${String(count).padStart(4, '0')}`;
    const cert: Certificate = {
      id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      certificateNumber: certNumber,
      verificationToken: crypto.randomBytes(16).toString('hex'),
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      eventDate: activeEvent.date,
      category: 'Participation Certificate',
      status: 'draft',
      issuedAt: new Date().toISOString(),
      downloadCount: 0,
    };
    this.data.certificates.unshift(cert);

    this.save();
    return student;
  }

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    const index = this.data.students.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const oldStudent = this.data.students[index];
    // Check roll number uniqueness if changed
    if (updates.rollNumber && updates.rollNumber !== oldStudent.rollNumber) {
      const clash = this.data.students.find(
        (s) => s.id !== id && s.rollNumber.toUpperCase() === updates.rollNumber!.toUpperCase()
      );
      if (clash) {
        throw new Error(`Roll Number ${updates.rollNumber} is already used by another student.`);
      }
    }

    this.data.students[index] = { ...oldStudent, ...updates };

    // Also update associated certificates with new name / roll / department if modified
    this.data.certificates.forEach((cert) => {
      if (cert.studentId === id) {
        if (updates.name) cert.studentName = updates.name;
        if (updates.rollNumber) cert.rollNumber = updates.rollNumber;
        if (updates.department) cert.department = updates.department;
        if (updates.year) cert.year = updates.year;
      }
    });

    this.save();
    return this.data.students[index];
  }

  deleteStudent(id: string): boolean {
    const initialLen = this.data.students.length;
    this.data.students = this.data.students.filter((s) => s.id !== id);
    if (this.data.students.length < initialLen) {
      // Remove or keep certs
      this.data.certificates = this.data.certificates.filter((c) => c.studentId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // --- Certificates ---
  getCertificates(eventId?: string, status?: string): Certificate[] {
    let list = [...this.data.certificates];
    if (eventId) {
      list = list.filter((c) => c.eventId === eventId);
    }
    if (status && status !== 'ALL') {
      list = list.filter((c) => c.status === status);
    }
    return list;
  }

  getCertificateById(id: string): Certificate | undefined {
    return this.data.certificates.find((c) => c.id === id);
  }

  getCertificateByTokenOrNumber(identifier: string): Certificate | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.certificates.find(
      (c) =>
        c.id.toLowerCase() === clean ||
        c.certificateNumber.toLowerCase() === clean ||
        c.verificationToken.toLowerCase() === clean
    );
  }

  getPublishedCertificateForStudent(studentId: string, eventId?: string): Certificate | undefined {
    return this.data.certificates.find(
      (c) =>
        c.studentId === studentId &&
        c.status === 'published' &&
        (!eventId || c.eventId === eventId)
    );
  }

  updateCertificate(id: string, updates: Partial<Certificate>): Certificate | null {
    const index = this.data.certificates.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.certificates[index] = { ...this.data.certificates[index], ...updates };
    this.save();
    return this.data.certificates[index];
  }

  batchApproveCertificates(ids: string[]): number {
    let count = 0;
    this.data.certificates.forEach((c) => {
      if (ids.includes(c.id) && c.status === 'draft') {
        c.status = 'approved';
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  batchPublishCertificates(ids: string[]): number {
    let count = 0;
    this.data.certificates.forEach((c) => {
      if (ids.includes(c.id) && (c.status === 'approved' || c.status === 'draft')) {
        c.status = 'published';
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  assignCategory(certId: string, category: CertificateCategory): Certificate | null {
    return this.updateCertificate(certId, { category });
  }

  recordDownload(certId: string, ip: string, userAgent: string): boolean {
    const cert = this.getCertificateById(certId);
    if (!cert) return false;
    cert.downloadCount = (cert.downloadCount || 0) + 1;
    cert.lastDownloadedAt = new Date().toISOString();

    const log: CertificateDownloadLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      certificateId: certId,
      studentName: cert.studentName,
      rollNumber: cert.rollNumber,
      ipAddress: ip || '127.0.0.1',
      userAgent: userAgent || 'Browser',
      downloadedAt: new Date().toISOString(),
    };
    this.data.downloadLogs.unshift(log);
    // Keep max 500 download logs
    if (this.data.downloadLogs.length > 500) {
      this.data.downloadLogs = this.data.downloadLogs.slice(0, 500);
    }
    this.save();
    return true;
  }

  getDownloadLogs(): CertificateDownloadLog[] {
    return this.data.downloadLogs;
  }

  // --- Dashboard Stats ---
  getStats(): DashboardStats {
    const totalStudents = this.data.students.length;
    const totalCertificates = this.data.certificates.length;
    let totalParticipation = 0;
    let totalWinners = 0;
    let totalDownloaded = 0;
    let publishedCertificates = 0;
    let pendingApproval = 0;

    this.data.certificates.forEach((c) => {
      if (c.category === 'Participation Certificate') {
        totalParticipation++;
      } else {
        totalWinners++;
      }
      totalDownloaded += c.downloadCount || 0;
      if (c.status === 'published') {
        publishedCertificates++;
      } else if (c.status === 'draft') {
        pendingApproval++;
      }
    });

    return {
      totalStudents,
      totalCertificates,
      totalParticipation,
      totalWinners,
      totalDownloaded,
      publishedCertificates,
      pendingApproval,
    };
  }
}

export const db = new Database();
