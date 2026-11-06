import express, { Request, Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { db } from './db.js';
import type { CertificateCategory, CertificateStatus } from '../types.js';

export const apiRouter = express.Router();

// Basic In-Memory Rate Limiter for public endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimiter(limit = 60, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
    }

    entry.count++;
    return next();
  };
}

// Session store for simple, secure token authentication
const activeSessions = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeSessions.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
  return next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const isValid = db.verifyAdminPassword(email, password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  db.updateAdminLoginTime(email);
  const admin = db.getAdminByEmail(email);

  // Generate session token
  const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  activeSessions.add(token);

  return res.json({
    token,
    user: {
      id: admin?.id,
      name: admin?.name,
      email: admin?.email,
      role: admin?.role,
    },
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.post('/auth/change-password', requireAdmin, (req: Request, res: Response) => {
  const { currentPassword, newPassword, email } = req.body;
  if (!currentPassword || !newPassword || !email) {
    return res.status(400).json({ error: 'Current password, new password, and email are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const isValid = db.verifyAdminPassword(email, currentPassword);
  if (!isValid) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }

  const updated = db.updateAdminPassword(email, newPassword);
  if (updated) {
    return res.json({ success: true, message: 'Password updated successfully' });
  }
  return res.status(500).json({ error: 'Failed to update password' });
});

apiRouter.get('/auth/me', requireAdmin, (_req: Request, res: Response) => {
  const admin = db.getAdminByEmail('admin@aurora.edu');
  return res.json({
    id: admin?.id,
    name: admin?.name,
    email: admin?.email,
    role: admin?.role,
  });
});

// ==========================================
// DASHBOARD STATS & LOGS
// ==========================================

apiRouter.get('/dashboard/stats', requireAdmin, (_req: Request, res: Response) => {
  const stats = db.getStats();
  return res.json(stats);
});

apiRouter.get('/dashboard/logs', requireAdmin, (_req: Request, res: Response) => {
  const logs = db.getDownloadLogs();
  return res.json(logs);
});

// ==========================================
// EVENT MANAGEMENT
// ==========================================

apiRouter.get('/events', requireAdmin, (_req: Request, res: Response) => {
  const events = db.getEvents();
  return res.json(events);
});

apiRouter.get('/events/:id', requireAdmin, (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  return res.json(event);
});

apiRouter.post('/events', requireAdmin, (req: Request, res: Response) => {
  try {
    const newEvent = db.createEvent(req.body);
    return res.status(201).json(newEvent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return res.status(400).json({ error: message });
  }
});

apiRouter.put('/events/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateEvent(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Event not found' });
  return res.json(updated);
});

apiRouter.post('/events/:id/toggle-portal', requireAdmin, (req: Request, res: Response) => {
  const { active } = req.body;
  const success = db.togglePortalStatus(req.params.id, Boolean(active));
  if (!success) return res.status(404).json({ error: 'Event not found' });
  return res.json({ success: true, portalActive: Boolean(active) });
});

apiRouter.get('/events/:id/qr', async (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Generate full portal URL
  const origin = req.headers.host ? `${req.protocol}://${req.headers.host}` : 'https://aurora.edu';
  const portalUrl = `${origin}/?event=${event.id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(portalUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1b4332',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return res.json({
      portalUrl,
      qrDataUrl,
      eventId: event.id,
      eventTitle: event.title,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

apiRouter.get('/students', requireAdmin, (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const department = req.query.department as string | undefined;
  const students = db.getStudents(search, department);
  return res.json(students);
});

apiRouter.post('/students', requireAdmin, (req: Request, res: Response) => {
  const { name, rollNumber, department, year, email } = req.body;
  if (!name || !rollNumber || !department || !year || !email) {
    return res.status(400).json({ error: 'All student fields are required' });
  }

  try {
    const student = db.createStudent({
      name: name.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      department: department.trim(),
      year: year.trim(),
      email: email.trim().toLowerCase(),
    });
    return res.status(201).json(student);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error adding student';
    return res.status(400).json({ error: message });
  }
});

apiRouter.post('/students/bulk', requireAdmin, (req: Request, res: Response) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Array of student records is required' });
  }

  const inserted: string[] = [];
  const errors: Array<{ rollNumber: string; reason: string }> = [];

  students.forEach((item) => {
    try {
      if (!item.name || !item.rollNumber) {
        errors.push({ rollNumber: item.rollNumber || 'UNKNOWN', reason: 'Missing Name or Roll Number' });
        return;
      }
      db.createStudent({
        name: String(item.name).trim(),
        rollNumber: String(item.rollNumber).trim().toUpperCase(),
        department: String(item.department || 'General Engineering').trim(),
        year: String(item.year || 'III Year').trim(),
        email: String(item.email || `${String(item.rollNumber).trim().toLowerCase()}@aurora.edu`).trim(),
      });
      inserted.push(item.rollNumber);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Duplicate or invalid record';
      errors.push({ rollNumber: item.rollNumber, reason });
    }
  });

  return res.json({
    totalProcessed: students.length,
    successCount: inserted.length,
    failedCount: errors.length,
    errors,
  });
});

apiRouter.put('/students/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = db.updateStudent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error updating student';
    return res.status(400).json({ error: message });
  }
});

apiRouter.delete('/students/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deleteStudent(req.params.id);
  if (!success) return res.status(404).json({ error: 'Student not found' });
  return res.json({ success: true, message: 'Student and related certificates deleted' });
});

// ==========================================
// CERTIFICATE MANAGEMENT (ADMIN)
// ==========================================

apiRouter.get('/certificates', requireAdmin, (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;
  const status = req.query.status as string | undefined;
  const certificates = db.getCertificates(eventId, status);
  return res.json(certificates);
});

apiRouter.get('/certificates/:id', requireAdmin, (req: Request, res: Response) => {
  const cert = db.getCertificateById(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  return res.json(cert);
});

apiRouter.put('/certificates/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateCertificate(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Certificate not found' });
  return res.json(updated);
});

apiRouter.put('/certificates/:id/category', requireAdmin, (req: Request, res: Response) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Category is required' });
  const updated = db.assignCategory(req.params.id, category as CertificateCategory);
  if (!updated) return res.status(404).json({ error: 'Certificate not found' });
  return res.json(updated);
});

apiRouter.post('/certificates/batch-approve', requireAdmin, (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Array of certificate IDs is required' });
  const count = db.batchApproveCertificates(ids);
  return res.json({ success: true, count, message: `Approved ${count} certificates` });
});

apiRouter.post('/certificates/batch-publish', requireAdmin, (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Array of certificate IDs is required' });
  const count = db.batchPublishCertificates(ids);
  return res.json({ success: true, count, message: `Published ${count} certificates` });
});

// Admin ZIP export of certificate records & verification manifest
apiRouter.get('/certificates/export/zip', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const certs = db.getCertificates();
    const event = db.getDefaultEvent();

    const zip = new JSZip();

    // Summary CSV
    let csv = 'Certificate ID,Student Name,Roll Number,Department,Year,Event Title,Category,Status,Issued Date,Download Count\n';
    certs.forEach((c) => {
      csv += `"${c.certificateNumber}","${c.studentName}","${c.rollNumber}","${c.department}","${c.year}","${c.eventTitle}","${c.category}","${c.status}","${c.issuedAt}","${c.downloadCount}"\n`;
    });
    zip.file('Certificates_Manifest.csv', csv);

    // JSON export
    zip.file(
      'Certificates_Database.json',
      JSON.stringify(
        {
          exportTimestamp: new Date().toISOString(),
          event,
          totalCertificates: certs.length,
          certificates: certs,
        },
        null,
        2
      )
    );

    // Individual certificate summary text records
    const certsFolder = zip.folder('Certificates_Metadata');
    certs.forEach((c) => {
      const info = `AURORA HIGHER EDUCATION AND RESEARCH ACADEMY - BHONGIR CAMPUS
NATURE CLUB - ECO GAMES PLAY FOR THE PLANET
==============================================================
Certificate ID   : ${c.certificateNumber}
Student Name     : ${c.studentName}
Roll Number      : ${c.rollNumber}
Department       : ${c.department}
Year             : ${c.year}
Category         : ${c.category}
Status           : ${c.status}
Verification Code: ${c.verificationToken}
Issued On        : ${c.issuedAt}
Total Downloads  : ${c.downloadCount}
`;
      certsFolder?.file(`${c.rollNumber}_${c.studentName.replace(/\s+/g, '_')}.txt`, info);
    });

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Aurora_NatureClub_Certificates_Export.zip"');
    return res.send(zipContent);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate ZIP export' });
  }
});

// ==========================================
// PUBLIC STUDENT PORTAL ROUTES
// ==========================================

// Public Event Details
apiRouter.get('/public/event', rateLimiter(100), (req: Request, res: Response) => {
  const eventId = (req.query.eventId as string) || undefined;
  const event = eventId ? db.getEventById(eventId) || db.getDefaultEvent() : db.getDefaultEvent();

  return res.json({
    id: event.id,
    title: event.title,
    date: event.date,
    organizingClub: event.organizingClub,
    institutionName: event.institutionName,
    campus: event.campus,
    emblemUrl: event.emblemUrl,
    sealUrl: event.sealUrl,
    portalActive: event.portalActive,
    templateConfig: event.templateConfig,
    coordinatorName: event.coordinatorName,
    coordinatorTitle: event.coordinatorTitle,
    principalName: event.principalName,
    principalTitle: event.principalTitle,
  });
});

// Public Search Students (Rate limited, ONLY returns students with published certificates, NEVER exposes email)
apiRouter.get('/public/students/search', rateLimiter(80), (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  const eventId = (req.query.eventId as string) || db.getDefaultEvent().id;

  const event = db.getEventById(eventId) || db.getDefaultEvent();
  if (!event.portalActive) {
    return res.status(403).json({
      error: 'The Student Certificate Portal is currently inactive. Please check back later or contact the Nature Club coordinator.',
      portalInactive: true,
    });
  }

  if (!query || query.length < 2) {
    return res.json([]);
  }

  // Find students matching query
  const allStudents = db.getStudents(query);

  // Filter only those who have a PUBLISHED certificate for this event
  const results = allStudents
    .map((s) => {
      const publishedCert = db.getPublishedCertificateForStudent(s.id, event.id);
      if (!publishedCert) return null;
      return {
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        hasPublishedCertificate: true,
        certificateCategory: publishedCert.category,
        certificateId: publishedCert.id,
      };
    })
    .filter(Boolean)
    .slice(0, 10); // Top 10 results

  return res.json(results);
});

// Verify Student Confirmation (Student selects their name and confirms roll number or PIN)
apiRouter.post('/public/verify-student', rateLimiter(40), (req: Request, res: Response) => {
  const { studentId, rollNumber, confirmationCode, eventId } = req.body;
  if (!studentId || !rollNumber) {
    return res.status(400).json({ error: 'Student ID and Roll Number are required' });
  }

  const student = db.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  if (student.rollNumber.trim().toUpperCase() !== rollNumber.trim().toUpperCase()) {
    return res.status(403).json({ error: 'Roll Number verification does not match selected student.' });
  }

  // If a confirmation PIN was provided, check it
  if (confirmationCode && student.verificationPin && confirmationCode.trim() !== student.verificationPin.trim()) {
    return res.status(403).json({ error: 'Incorrect verification PIN. Please verify with your event roll badge.' });
  }

  const targetEventId = eventId || db.getDefaultEvent().id;
  const cert = db.getPublishedCertificateForStudent(student.id, targetEventId);

  if (!cert) {
    return res.status(404).json({
      error: 'No published certificate found for this student. The certificate may still be under review.',
    });
  }

  return res.json({
    success: true,
    student: {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
    },
    certificate: cert,
  });
});

// Public single certificate retrieval for preview/download
apiRouter.get('/public/certificate/:id', rateLimiter(100), (req: Request, res: Response) => {
  const cert = db.getCertificateById(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  if (cert.status !== 'published') {
    return res.status(403).json({
      error: 'This certificate has not been published yet. Only approved and published certificates are downloadable.',
    });
  }

  const event = db.getEventById(cert.eventId) || db.getDefaultEvent();

  return res.json({
    certificate: cert,
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      organizingClub: event.organizingClub,
      institutionName: event.institutionName,
      campus: event.campus,
      emblemUrl: event.emblemUrl,
      sealUrl: event.sealUrl,
      coordinatorName: event.coordinatorName,
      coordinatorTitle: event.coordinatorTitle,
      principalName: event.principalName,
      principalTitle: event.principalTitle,
      templateConfig: event.templateConfig,
    },
  });
});

// Download log tracking (Rate limited)
apiRouter.post('/public/certificate/:id/download', rateLimiter(30), (req: Request, res: Response) => {
  const cert = db.getCertificateById(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  if (cert.status !== 'published') {
    return res.status(403).json({ error: 'Cannot download unpublished certificate' });
  }

  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  db.recordDownload(cert.id, ip, userAgent);

  return res.json({
    success: true,
    downloadCount: cert.downloadCount,
    lastDownloadedAt: cert.lastDownloadedAt,
  });
});

// Public Verification endpoint (When QR code on certificate is scanned or ID typed)
apiRouter.get('/public/verify/:identifier', rateLimiter(60), (req: Request, res: Response) => {
  const cert = db.getCertificateByTokenOrNumber(req.params.identifier);
  if (!cert) {
    return res.status(404).json({
      valid: false,
      message: 'Invalid certificate identifier. This certificate is not registered in the Aurora Academy portal.',
    });
  }

  const event = db.getEventById(cert.eventId) || db.getDefaultEvent();

  return res.json({
    valid: true,
    certificate: {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      rollNumber: cert.rollNumber,
      department: cert.department,
      year: cert.year,
      eventTitle: cert.eventTitle,
      eventDate: cert.eventDate,
      organizingClub: event.organizingClub,
      institutionName: event.institutionName,
      campus: event.campus,
      category: cert.category,
      status: cert.status,
      issuedAt: cert.issuedAt,
      coordinatorName: event.coordinatorName,
      principalName: event.principalName,
    },
  });
});

// Dynamic QR code generation for Certificate Verification
apiRouter.get('/public/qr/cert/:id', async (req: Request, res: Response) => {
  const cert = db.getCertificateById(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });

  const origin = req.headers.host ? `${req.protocol}://${req.headers.host}` : 'https://aurora.edu';
  const verifyUrl = `${origin}/?verify=${encodeURIComponent(cert.certificateNumber)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#1b4332',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return res.json({ verifyUrl, qrDataUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate certificate QR' });
  }
});
