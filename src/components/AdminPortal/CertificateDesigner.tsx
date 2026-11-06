import React, { useState } from 'react';
import { Palette, Eye, Sliders, Check, RefreshCw, FileText } from 'lucide-react';
import type { EventItem, Certificate, CertificateCategory } from '../../types';
import { CertificateView } from '../CertificateView';

interface CertificateDesignerProps {
  event: EventItem;
  onUpdateTemplateConfig: (updates: Partial<EventItem['templateConfig']>) => Promise<void>;
}

export const CertificateDesigner: React.FC<CertificateDesignerProps> = ({
  event,
  onUpdateTemplateConfig,
}) => {
  const [activeCategory, setActiveCategory] = useState<CertificateCategory>('First Prize Certificate');
  const [subtitle, setSubtitle] = useState(
    event.templateConfig?.institutionSubtitle ||
      'Approved by AICTE | Affiliated to State University | Accredited A+ Grade'
  );
  const [participationText, setParticipationText] = useState(event.templateConfig?.participationText || '');
  const [firstPrizeText, setFirstPrizeText] = useState(event.templateConfig?.firstPrizeText || '');
  const [secondPrizeText, setSecondPrizeText] = useState(event.templateConfig?.secondPrizeText || '');
  const [thirdPrizeText, setThirdPrizeText] = useState(event.templateConfig?.thirdPrizeText || '');
  const [borderStyle, setBorderStyle] = useState<'botanical-ornate' | 'classic-laurel' | 'geometric-foliage'>(
    event.templateConfig?.borderStyle || 'botanical-ornate'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sample mock certificate for live preview
  const sampleCertificate: Certificate = {
    id: 'cert-sample-preview',
    certificateNumber: 'AHERA-NC-2026-ECO-0001',
    verificationToken: 'preview-token-eco-2026',
    studentId: 'stu-preview',
    studentName: 'Rahul Kumar',
    rollNumber: '22BH1A0501',
    department: 'Computer Science & Engineering',
    year: 'III Year',
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    category: activeCategory,
    status: 'published',
    issuedAt: new Date().toISOString(),
    downloadCount: 1,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateTemplateConfig({
        institutionSubtitle: subtitle,
        participationText,
        firstPrizeText,
        secondPrizeText,
        thirdPrizeText,
        borderStyle,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save template configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-800" />
            <span>Certificate Template Designer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure A4 landscape botanical themes, environmental motifs, category citations, and typography.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Sliders className="w-3.5 h-3.5" />
          )}
          <span>{saveSuccess ? 'Template Saved!' : 'Save Template Settings'}</span>
        </button>
      </div>

      {/* Category Tabs for previewing different variants */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-500 mr-2">Preview Variant:</span>
        {([
          'First Prize Certificate',
          'Second Prize Certificate',
          'Third Prize Certificate',
          'Participation Certificate',
        ] as CertificateCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Controls on left, Live A4 Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Citation Text & Template Content
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Institution Accreditation Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Prize Citation Text
            </label>
            <textarea
              rows={3}
              value={firstPrizeText}
              onChange={(e) => setFirstPrizeText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Second Prize Citation Text
            </label>
            <textarea
              rows={3}
              value={secondPrizeText}
              onChange={(e) => setSecondPrizeText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Third Prize Citation Text
            </label>
            <textarea
              rows={3}
              value={thirdPrizeText}
              onChange={(e) => setThirdPrizeText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Participation Citation Text
            </label>
            <textarea
              rows={3}
              value={participationText}
              onChange={(e) => setParticipationText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Live A4 Landscape Canvas Preview Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-800" />
              <span>Real-Time A4 Landscape Canvas Preview</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              297mm × 210mm (Landscape)
            </span>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-hidden flex justify-center">
            <CertificateView
              certificate={sampleCertificate}
              event={{
                ...event,
                templateConfig: {
                  ...event.templateConfig,
                  institutionSubtitle: subtitle,
                  participationText,
                  firstPrizeText,
                  secondPrizeText,
                  thirdPrizeText,
                  borderStyle,
                },
              }}
              showDownloadButton={true}
              className="max-w-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
