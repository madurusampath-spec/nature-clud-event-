import React, { useState } from 'react';
import { Calendar, Building2, Award, Plus, Check, Edit3, ShieldAlert, Sparkles } from 'lucide-react';
import type { EventItem, CertificateCategory } from '../../types';

interface EventManagementProps {
  events: EventItem[];
  activeEvent: EventItem;
  onSelectEvent: (event: EventItem) => void;
  onUpdateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
  onCreateEvent: (eventData: Omit<EventItem, 'id' | 'createdAt'>) => Promise<void>;
}

const ALL_CATEGORIES: CertificateCategory[] = [
  'Participation Certificate',
  'First Prize Certificate',
  'Second Prize Certificate',
  'Third Prize Certificate',
];

export const EventManagement: React.FC<EventManagementProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onUpdateEvent,
  onCreateEvent,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [title, setTitle] = useState(activeEvent.title);
  const [date, setDate] = useState(activeEvent.date);
  const [organizingClub, setOrganizingClub] = useState(activeEvent.organizingClub);
  const [institutionName, setInstitutionName] = useState(activeEvent.institutionName);
  const [campus, setCampus] = useState(activeEvent.campus);
  const [coordinatorName, setCoordinatorName] = useState(activeEvent.coordinatorName);
  const [coordinatorTitle, setCoordinatorTitle] = useState(activeEvent.coordinatorTitle);
  const [principalName, setPrincipalName] = useState(activeEvent.principalName);
  const [principalTitle, setPrincipalTitle] = useState(activeEvent.principalTitle);
  const [selectedCategories, setSelectedCategories] = useState<CertificateCategory[]>(
    activeEvent.categories || ALL_CATEGORIES
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setTitle(activeEvent.title);
    setDate(activeEvent.date);
    setOrganizingClub(activeEvent.organizingClub);
    setInstitutionName(activeEvent.institutionName);
    setCampus(activeEvent.campus);
    setCoordinatorName(activeEvent.coordinatorName);
    setCoordinatorTitle(activeEvent.coordinatorTitle);
    setPrincipalName(activeEvent.principalName);
    setPrincipalTitle(activeEvent.principalTitle);
    setSelectedCategories(activeEvent.categories || ALL_CATEGORIES);
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleStartCreate = () => {
    setTitle('ANNUAL GREEN CONCLAVE 2026');
    setDate('28 November 2026');
    setOrganizingClub('Nature Club');
    setInstitutionName('Aurora Higher Education and Research Academy');
    setCampus('Bhongir Campus');
    setCoordinatorName('Dr. S. Anitha');
    setCoordinatorTitle('Faculty Coordinator, Nature Club');
    setPrincipalName('Dr. P. Ramanathan');
    setPrincipalTitle('Director & Principal, Bhongir Campus');
    setSelectedCategories(ALL_CATEGORIES);
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleToggleCategory = (cat: CertificateCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isCreatingNew) {
        await onCreateEvent({
          title,
          date,
          organizingClub,
          institutionName,
          campus,
          emblemUrl: activeEvent.emblemUrl,
          sealUrl: activeEvent.sealUrl,
          coordinatorName,
          coordinatorTitle,
          principalName,
          principalTitle,
          portalActive: true,
          categories: selectedCategories,
          templateConfig: { ...activeEvent.templateConfig },
        });
      } else {
        await onUpdateEvent(activeEvent.id, {
          title,
          date,
          organizingClub,
          institutionName,
          campus,
          coordinatorName,
          coordinatorTitle,
          principalName,
          principalTitle,
          categories: selectedCategories,
        });
      }
      setIsEditing(false);
      setIsCreatingNew(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save event details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-800" />
            <span>Event Management & Signatories</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure collegiate events, dates, organizing departments, and official credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Multiple Events Switcher Bar */}
      {events.length > 1 && (
        <div className="bg-slate-100 p-2 rounded-xl flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold px-2">Switch Event:</span>
          {events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                evt.id === activeEvent.id
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              {evt.title} ({evt.date})
            </button>
          ))}
        </div>
      )}

      {/* Event Details Card / Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {isCreatingNew ? 'Create New Collegiate Event' : 'Edit Event Information'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organizing Club or Department *
                </label>
                <input
                  type="text"
                  required
                  value={organizingClub}
                  onChange={(e) => setOrganizingClub(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Location *
                </label>
                <input
                  type="text"
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                />
              </div>
            </div>

            {/* Authorized Signatories Section */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Authorized Digital Signatories
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Coordinator Title / Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={coordinatorTitle}
                    onChange={(e) => setCoordinatorTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Principal / Director Name
                  </label>
                  <input
                    type="text"
                    required
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Principal / Director Title
                  </label>
                  <input
                    type="text"
                    required
                    value={principalTitle}
                    onChange={(e) => setPrincipalTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Certificate Categories */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Active Certificate Categories for this Event:
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-emerald-900 text-white border-emerald-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isCreatingNew ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  {activeEvent.organizingClub}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeEvent.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeEvent.institutionName} · {activeEvent.campus}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-900 font-semibold bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Scheduled on {activeEvent.date}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 self-start"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Event Details</span>
              </button>
            </div>

            {/* Logos & Assets Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <img
                  src={activeEvent.sealUrl}
                  alt="University Seal"
                  className="w-16 h-16 object-contain rounded-full shadow-xs bg-white p-1"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Institution Seal</h4>
                  <p className="text-[11px] text-slate-500">
                    Aurora Higher Education and Research Academy Seal Crest
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <img
                  src={activeEvent.emblemUrl}
                  alt="Nature Club Emblem"
                  className="w-16 h-16 object-contain rounded-full shadow-xs bg-white p-1"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Organizing Club Emblem</h4>
                  <p className="text-[11px] text-slate-500">
                    Nature Club Collegiate Society Official Emblem
                  </p>
                </div>
              </div>
            </div>

            {/* Signatories Info */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Authorized Certificate Signatories
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
                  <div className="font-signature text-2xl text-emerald-900">
                    {activeEvent.coordinatorName}
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">{activeEvent.coordinatorName}</p>
                  <p className="text-[11px] text-slate-600">{activeEvent.coordinatorTitle}</p>
                </div>

                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
                  <div className="font-signature text-2xl text-emerald-900">
                    {activeEvent.principalName}
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">{activeEvent.principalName}</p>
                  <p className="text-[11px] text-slate-600">{activeEvent.principalTitle}</p>
                </div>
              </div>
            </div>

            {/* Configured Categories */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Supported Certificate Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeEvent.categories.map((cat, idx) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg border border-slate-200"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
