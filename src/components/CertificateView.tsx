import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Download, Printer, ShieldCheck, CheckCircle2, Award, Sparkles } from 'lucide-react';
import type { Certificate, EventItem } from '../types';

interface CertificateViewProps {
  certificate: Certificate;
  event: EventItem;
  onDownloadLogged?: (certId: string) => void;
  showDownloadButton?: boolean;
  className?: string;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  certificate,
  event,
  onDownloadLogged,
  showDownloadButton = true,
  className = '',
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const certContainerRef = useRef<HTMLDivElement>(null);

  // Generate the Verification QR Code URL
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aurora.edu';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(certificate.certificateNumber)}`;

    QRCode.toDataURL(verifyUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#1b4332',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate verification QR code', err));
  }, [certificate.certificateNumber]);

  // Determine citation text based on category
  const getCitationText = () => {
    const config = event.templateConfig;
    if (certificate.category === 'First Prize Certificate') {
      return (
        config?.firstPrizeText ||
        'for securing FIRST PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET.'
      );
    }
    if (certificate.category === 'Second Prize Certificate') {
      return (
        config?.secondPrizeText ||
        'for securing SECOND PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET.'
      );
    }
    if (certificate.category === 'Third Prize Certificate') {
      return (
        config?.thirdPrizeText ||
        'for securing THIRD PRIZE in the competitive eco-innovation project showcase and environmental awareness drive during ECO GAMES – PLAY FOR THE PLANET.'
      );
    }
    return (
      config?.participationText ||
      'for active and commendable participation in the inter-collegiate ecological challenges, green initiatives, and sustainability awareness programs during ECO GAMES – PLAY FOR THE PLANET.'
    );
  };

  const getCategoryTitle = () => {
    switch (certificate.category) {
      case 'First Prize Certificate':
        return 'FIRST PRIZE OF EXCELLENCE';
      case 'Second Prize Certificate':
        return 'SECOND PRIZE OF EXCELLENCE';
      case 'Third Prize Certificate':
        return 'THIRD PRIZE OF EXCELLENCE';
      default:
        return 'CERTIFICATE OF PARTICIPATION';
    }
  };

  // High-Quality PDF Download Function
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Create a high-resolution canvas to draw the certificate
      const canvas = document.createElement('canvas');
      // A4 landscape at 300 DPI: ~3508 x 2480 px (or 2400 x 1700 for balanced speed & crispness)
      const width = 2400;
      const height = 1700;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle botanical background tint
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f4fbf7');
      gradient.addColorStop(0.5, '#ffffff');
      gradient.addColorStop(1, '#eef8f2');
      ctx.fillStyle = gradient;
      ctx.fillRect(40, 40, width - 80, height - 80);

      // Outer gold/green double border
      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 14;
      ctx.strokeRect(50, 50, width - 100, height - 100);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(68, 68, width - 136, height - 136);

      ctx.strokeStyle = '#2d6a4f';
      ctx.lineWidth = 2;
      ctx.strokeRect(78, 78, width - 156, height - 156);

      // Draw Corner Botanical Leaf Accents
      const drawCornerLeaves = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.fillStyle = '#2d6a4f';

        // Draw leafy sprig
        ctx.beginPath();
        ctx.ellipse(30, 30, 26, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#40916c';
        ctx.beginPath();
        ctx.ellipse(55, 20, 20, 9, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(20, 55, 20, 9, Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();

        // Gold vein dots
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(30, 30, 3, 0, Math.PI * 2);
        ctx.arc(55, 20, 2.5, 0, Math.PI * 2);
        ctx.arc(20, 55, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawCornerLeaves(90, 90, 0);
      drawCornerLeaves(width - 90, 90, 90);
      drawCornerLeaves(width - 90, height - 90, 180);
      drawCornerLeaves(90, height - 90, 270);

      // Helper function to load an image
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load ${src}`));
          img.src = src;
        });

      // Load logos & QR code
      try {
        if (event.sealUrl) {
          const sealImg = await loadImage(event.sealUrl);
          ctx.drawImage(sealImg, 140, 120, 160, 160);
        }
      } catch (e) {
        console.warn('Could not load seal on canvas, continuing', e);
      }

      try {
        if (event.emblemUrl) {
          const emblemImg = await loadImage(event.emblemUrl);
          ctx.drawImage(emblemImg, width - 300, 120, 160, 160);
        }
      } catch (e) {
        console.warn('Could not load emblem on canvas, continuing', e);
      }

      // Draw Header Typography
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1b4332';
      ctx.font = 'bold 54px Georgia, "Cormorant Garamond", serif';
      ctx.fillText(event.institutionName.toUpperCase(), width / 2, 170);

      ctx.fillStyle = '#2d6a4f';
      ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(event.campus.toUpperCase(), width / 2, 215);

      ctx.fillStyle = '#6b7280';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        event.templateConfig?.institutionSubtitle ||
          'Approved by AICTE | Affiliated to State University | Accredited A+ Grade',
        width / 2,
        248
      );

      // Decorative divider
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 280, 275);
      ctx.lineTo(width / 2 + 280, 275);
      ctx.stroke();

      // Diamond ornament in divider
      ctx.fillStyle = '#1b4332';
      ctx.save();
      ctx.translate(width / 2, 275);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();

      // Certificate Category Heading
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('NATURE CLUB · ANNUAL ENVIRONMENTAL INITIATIVE', width / 2, 330);

      ctx.fillStyle = '#1b4332';
      ctx.font = 'bold 58px Georgia, "Cormorant Garamond", serif';
      ctx.fillText(getCategoryTitle(), width / 2, 395);

      // Presenter text
      ctx.fillStyle = '#4b5563';
      ctx.font = 'italic 26px Georgia, "Cormorant Garamond", serif';
      ctx.fillText('This is proudly presented to', width / 2, 465);

      // Student Name
      ctx.fillStyle = '#0f291e';
      ctx.font = 'bold 72px Georgia, "Cormorant Garamond", serif';
      ctx.fillText(certificate.studentName, width / 2, 555);

      // Underline for Student Name
      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 380, 575);
      ctx.lineTo(width / 2 + 380, 575);
      ctx.stroke();

      // Student credentials
      ctx.fillStyle = '#2d6a4f';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      const studentDetails = `Roll No: ${certificate.rollNumber}   |   ${certificate.department}   |   ${certificate.year}`;
      ctx.fillText(studentDetails, width / 2, 620);

      // Citation Body Text (Wrapped)
      ctx.fillStyle = '#374151';
      ctx.font = '24px Georgia, "Cormorant Garamond", serif';
      const citation = getCitationText();
      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = `${currentLine} ${word}`;
          const metrics = ctx.measureText(testLine);
          if (metrics.width < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };

      const citationLines = wrapText(citation, 1750);
      citationLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, 700 + index * 38);
      });

      // Event Banner Bar / Details
      ctx.fillStyle = '#1b4332';
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`“${event.title}”`, width / 2, 850);

      ctx.fillStyle = '#2d6a4f';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Conducted on ${event.date} · Organized by ${event.organizingClub}`, width / 2, 890);

      // Certificate Identification & QR Code in center-bottom
      const qrY = 1100;
      if (qrCodeDataUrl) {
        try {
          const qrImg = await loadImage(qrCodeDataUrl);
          ctx.drawImage(qrImg, width / 2 - 90, qrY, 180, 180);

          // Small border around QR
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 2;
          ctx.strokeRect(width / 2 - 92, qrY - 2, 184, 184);

          ctx.fillStyle = '#1b4332';
          ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('SCAN TO VERIFY AUTHENTICITY', width / 2, qrY + 215);

          ctx.fillStyle = '#4b5563';
          ctx.font = '600 16px "Plus Jakarta Sans", monospace';
          ctx.fillText(`Certificate ID: ${certificate.certificateNumber}`, width / 2, qrY + 240);
        } catch (e) {
          console.warn('QR render error on canvas', e);
        }
      }

      // Signatories on Left & Right
      // Left: Coordinator Signature
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1b4332';
      ctx.font = 'italic 52px "Great Vibes", cursive, Georgia, serif';
      ctx.fillText(event.coordinatorName, 260, 1260);

      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 1285);
      ctx.lineTo(650, 1285);
      ctx.stroke();

      ctx.fillStyle = '#1b4332';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(event.coordinatorName, 250, 1320);

      ctx.fillStyle = '#4b5563';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(event.coordinatorTitle, 250, 1350);

      // Right: Principal / Director Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1b4332';
      ctx.font = 'italic 52px "Great Vibes", cursive, Georgia, serif';
      ctx.fillText(event.principalName, width - 260, 1260);

      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width - 650, 1285);
      ctx.lineTo(width - 250, 1285);
      ctx.stroke();

      ctx.fillStyle = '#1b4332';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(event.principalName, width - 250, 1320);

      ctx.fillStyle = '#4b5563';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(event.principalTitle, width - 250, 1350);

      // Gold Official Seal Stamp watermark on the certificate
      ctx.save();
      ctx.translate(width / 2, 1490);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('★ OFFICIAL DIGITAL CREDENTIAL · AURORA HIGHER EDUCATION & RESEARCH ACADEMY ★', 0, 0);
      ctx.restore();

      // Convert Canvas to PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4', // 297 x 210 mm
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

      // Filename formatted as specified: Certificate_Rahul_Kumar.pdf
      const safeName = certificate.studentName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `Certificate_${safeName}.pdf`;

      pdf.save(filename);

      // Notify parent / API of download event
      if (onDownloadLogged) {
        onDownloadLogged(certificate.id);
      }
    } catch (err) {
      console.error('Failed to create PDF certificate:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Action Bar (Top) */}
      {showDownloadButton && (
        <div className="flex flex-wrap items-center justify-between gap-4 w-full max-w-4xl mb-4 px-2 no-print">
          <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official E-Certificate Record</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{certificate.certificateNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wide text-white bg-emerald-800 rounded-lg shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating High-Res PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD MY E-CERTIFICATE</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* A4 Landscape Certificate Canvas Container */}
      <div
        ref={certContainerRef}
        className="print-only-certificate relative w-full max-w-4xl aspect-[1.414/1] bg-white border border-emerald-200 shadow-xl rounded-xl overflow-hidden text-slate-800 select-none transition-shadow hover:shadow-2xl"
        style={{
          boxSizing: 'border-box',
          backgroundImage: 'radial-gradient(ellipse at top left, #f7fcf9 0%, #ffffff 50%, #f2f9f4 100%)',
        }}
      >
        {/* Ornate Botanical Border Frame */}
        <div className="absolute inset-3 border-4 border-emerald-900 pointer-events-none rounded-lg" />
        <div className="absolute inset-5 border border-amber-600/70 pointer-events-none rounded-md" />
        <div className="absolute inset-6 border border-emerald-700/40 pointer-events-none rounded-sm" />

        {/* Botanical Corner SVG Flourishes */}
        <div className="absolute top-6 left-6 w-16 h-16 pointer-events-none text-emerald-800">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L40,0 C35,20 20,35 0,40 Z" opacity="0.8" />
            <path d="M15,15 C28,15 35,22 35,35 C22,35 15,28 15,15 Z" fill="#d4af37" />
            <circle cx="20" cy="20" r="4" fill="#1b4332" />
          </svg>
        </div>
        <div className="absolute top-6 right-6 w-16 h-16 pointer-events-none text-emerald-800 rotate-90">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L40,0 C35,20 20,35 0,40 Z" opacity="0.8" />
            <path d="M15,15 C28,15 35,22 35,35 C22,35 15,28 15,15 Z" fill="#d4af37" />
            <circle cx="20" cy="20" r="4" fill="#1b4332" />
          </svg>
        </div>
        <div className="absolute bottom-6 left-6 w-16 h-16 pointer-events-none text-emerald-800 -rotate-90">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L40,0 C35,20 20,35 0,40 Z" opacity="0.8" />
            <path d="M15,15 C28,15 35,22 35,35 C22,35 15,28 15,15 Z" fill="#d4af37" />
            <circle cx="20" cy="20" r="4" fill="#1b4332" />
          </svg>
        </div>
        <div className="absolute bottom-6 right-6 w-16 h-16 pointer-events-none text-emerald-800 rotate-180">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M0,0 L40,0 C35,20 20,35 0,40 Z" opacity="0.8" />
            <path d="M15,15 C28,15 35,22 35,35 C22,35 15,28 15,15 Z" fill="#d4af37" />
            <circle cx="20" cy="20" r="4" fill="#1b4332" />
          </svg>
        </div>

        {/* Certificate Content Flex Flow */}
        <div className="relative z-10 flex flex-col justify-between h-full px-10 py-7 text-center">
          {/* Header Section */}
          <div>
            <div className="flex items-center justify-between px-6 pt-1">
              {/* Institution Seal */}
              <div className="w-16 h-16 flex items-center justify-center">
                {event.sealUrl ? (
                  <img
                    src={event.sealUrl}
                    alt="Institution Seal"
                    className="w-16 h-16 object-contain rounded-full shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-xs border-2 border-amber-400">
                    SEAL
                  </div>
                )}
              </div>

              {/* Institution Identity */}
              <div className="flex-1 px-4">
                <h1 className="font-certificate-serif font-bold text-lg sm:text-2xl lg:text-[28px] text-emerald-950 tracking-wide uppercase">
                  {event.institutionName}
                </h1>
                <p className="font-semibold text-xs sm:text-sm text-emerald-800 tracking-wider uppercase mt-0.5">
                  {event.campus}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
                  {event.templateConfig?.institutionSubtitle ||
                    'Approved by AICTE | Affiliated to State University | Accredited A+ Grade'}
                </p>
              </div>

              {/* Club Emblem */}
              <div className="w-16 h-16 flex items-center justify-center">
                {event.emblemUrl ? (
                  <img
                    src={event.emblemUrl}
                    alt="Nature Club Emblem"
                    className="w-16 h-16 object-contain rounded-full shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs border-2 border-emerald-500">
                    NATURE
                  </div>
                )}
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="w-64 h-[1.5px] bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
              <div className="absolute w-2 h-2 rotate-45 bg-emerald-900" />
            </div>

            {/* Category / Heading */}
            <div className="mt-1">
              <p className="text-[10px] sm:text-xs font-semibold tracking-widest text-amber-700 uppercase">
                {event.organizingClub} · ANNUAL SUSTAINABILITY INITIATIVE
              </p>
              <h2 className="font-certificate-serif text-xl sm:text-3xl lg:text-[32px] font-bold text-emerald-900 tracking-wide mt-0.5">
                {getCategoryTitle()}
              </h2>
            </div>
          </div>

          {/* Body Recipient & Citation Section */}
          <div className="my-auto py-1">
            <p className="font-certificate-serif italic text-xs sm:text-sm text-slate-600">
              This certificate is proudly awarded to
            </p>

            <div className="my-1 sm:my-2">
              <h3 className="font-certificate-serif font-bold text-xl sm:text-3xl lg:text-4xl text-emerald-950 tracking-normal capitalize">
                {certificate.studentName}
              </h3>
              <div className="mx-auto w-48 sm:w-80 h-[1.5px] bg-emerald-800/80 my-1" />
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-800 tracking-wide">
                Roll No: <span className="font-mono text-emerald-900">{certificate.rollNumber}</span> &nbsp;|&nbsp;{' '}
                {certificate.department} &nbsp;|&nbsp; {certificate.year}
              </p>
            </div>

            {/* Citation Statement */}
            <p className="font-certificate-serif text-xs sm:text-sm lg:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed px-4">
              {getCitationText()}
            </p>

            {/* Event Name Tag */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 border border-emerald-200/60 rounded-md">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span className="font-semibold text-[11px] sm:text-xs text-emerald-950 tracking-wide">
                “{event.title}”
              </span>
              <span className="text-[10px] text-emerald-700">· {event.date}</span>
            </div>
          </div>

          {/* Signatures & QR Section */}
          <div className="pt-2">
            <div className="grid grid-cols-3 items-end px-4 gap-2">
              {/* Coordinator Signature */}
              <div className="text-left pl-2">
                <div className="font-signature text-2xl sm:text-3xl text-emerald-900 h-8 flex items-center">
                  {event.coordinatorName}
                </div>
                <div className="w-36 sm:w-48 h-[1px] bg-emerald-900/60 my-1" />
                <p className="text-[11px] sm:text-xs font-bold text-emerald-950 tracking-tight">
                  {event.coordinatorName}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight">
                  {event.coordinatorTitle}
                </p>
              </div>

              {/* Center Verification QR */}
              <div className="flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <div className="p-1 bg-white border border-amber-500/80 rounded shadow-xs">
                    <img
                      src={qrCodeDataUrl}
                      alt="Verify Certificate QR Code"
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                    QR
                  </div>
                )}
                <span className="text-[8px] sm:text-[9px] font-semibold text-emerald-900 mt-1 uppercase tracking-wider">
                  Scan to Verify
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-600 font-medium">
                  {certificate.certificateNumber}
                </span>
              </div>

              {/* Principal Signature */}
              <div className="text-right pr-2">
                <div className="font-signature text-2xl sm:text-3xl text-emerald-900 h-8 flex items-center justify-end">
                  {event.principalName}
                </div>
                <div className="w-36 sm:w-48 h-[1px] bg-emerald-900/60 my-1 ml-auto" />
                <p className="text-[11px] sm:text-xs font-bold text-emerald-950 tracking-tight">
                  {event.principalName}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight">
                  {event.principalTitle}
                </p>
              </div>
            </div>

            {/* Bottom Institutional Seal Ribbon */}
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] text-amber-700/90 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Official Digital Credential Issued by Aurora Higher Education and Research Academy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
