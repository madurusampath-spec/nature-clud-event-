/**
 * Core domain types for Nature Club E-Certificate Portal
 * Aurora Higher Education and Research Academy, Bhongir Campus
 */

export type CertificateCategory =
  | 'Participation Certificate'
  | 'First Prize Certificate'
  | 'Second Prize Certificate'
  | 'Third Prize Certificate';

export type CertificateStatus = 'draft' | 'approved' | 'published';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  lastLogin?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: string;
  email: string;
  verificationPin?: string;
  createdAt: string;
}

export interface CertificateTemplateConfig {
  themeColor: string;
  accentColor: string;
  borderStyle: 'botanical-ornate' | 'classic-laurel' | 'geometric-foliage';
  headerText: string;
  institutionSubtitle: string;
  accreditationText: string;
  participationText: string;
  firstPrizeText: string;
  secondPrizeText: string;
  thirdPrizeText: string;
  showSeal: boolean;
  showEmblem: boolean;
  coordinatorSignatureText: string;
  principalSignatureText: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  organizingClub: string;
  institutionName: string;
  campus: string;
  emblemUrl: string;
  sealUrl: string;
  coordinatorName: string;
  coordinatorTitle: string;
  principalName: string;
  principalTitle: string;
  portalActive: boolean;
  categories: CertificateCategory[];
  templateConfig: CertificateTemplateConfig;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. AHERA-NC-2026-ECO-0042
  verificationToken: string; // secure random hex/uuid
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  category: CertificateCategory;
  status: CertificateStatus;
  issuedAt: string;
  downloadCount: number;
  lastDownloadedAt?: string;
}

export interface CertificateDownloadLog {
  id: string;
  certificateId: string;
  studentName: string;
  rollNumber: string;
  ipAddress: string;
  userAgent: string;
  downloadedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCertificates: number;
  totalParticipation: number;
  totalWinners: number;
  totalDownloaded: number;
  publishedCertificates: number;
  pendingApproval: number;
}

export interface PublicStudentSearchResult {
  studentId: string;
  name: string;
  rollNumber: string;
  department: string;
  year: string;
  hasPublishedCertificate: boolean;
  certificateCategory?: CertificateCategory;
  certificateId?: string;
}

export interface VerificationResult {
  valid: boolean;
  message?: string;
  certificate?: {
    id: string;
    certificateNumber: string;
    studentName: string;
    rollNumber: string;
    department: string;
    year: string;
    eventTitle: string;
    eventDate: string;
    organizingClub: string;
    institutionName: string;
    campus: string;
    category: CertificateCategory;
    status: CertificateStatus;
    issuedAt: string;
    coordinatorName: string;
    principalName: string;
  };
}
