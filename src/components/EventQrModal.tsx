import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer, Copy, Check, ExternalLink, X } from 'lucide-react';
import type { EventItem } from '../types';

interface EventQrModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
}

export const EventQrModal: React.FC<EventQrModalProps> = ({ event, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/events/${event.id}/qr`)
      .then((res) => res.json())
      .then((data) => {
        if (data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
          setPortalUrl(data.portalUrl);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, event.id]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl || window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `NatureClub_${event.title.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-slate-900">Event Portal QR Code</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 text-center">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            {event.organizingClub} · {event.institutionName}
          </p>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">{event.title}</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{event.date}</p>

          <div className="my-5 inline-block p-4 bg-white border-2 border-emerald-900 rounded-2xl shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Event QR" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                Loading QR Code...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 px-4 leading-relaxed">
            Students scan this single, shared QR code to open the certificate portal on their smartphones.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={portalUrl || window.location.href}
            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res QR PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
