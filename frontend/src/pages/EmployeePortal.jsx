import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Check,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Shield,
  Briefcase,
  Search
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import { LANGUAGES } from '../utils/uiTranslations';

export default function EmployeePortal({
  user,
  currentOrganization,
  announcements = [],
  activeLanguage,
  onLanguageChange,
  onAcknowledge
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'read'
  const [selectedAnnId, setSelectedAnnId] = useState(
    announcements[0]?._id || null
  );
  const [showOriginal, setShowOriginal] = useState(false);
  const [audioUsedMap, setAudioUsedMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // Keep a valid selected announcement
  const currentSelectedId =
    selectedAnnId && announcements.some((a) => a._id === selectedAnnId)
      ? selectedAnnId
      : announcements[0]?._id || null;

  const selectedAnnouncement = announcements.find(
    (a) => a._id === currentSelectedId
  );

  const getLocalized = (ann) => {
    if (!ann) return { title: '', simplifiedContent: '' };
    if (
      activeLanguage !== 'en' &&
      ann.translations &&
      ann.translations[activeLanguage]
    ) {
      const t = ann.translations[activeLanguage];
      return {
        title: t.title || ann.title,
        simplifiedContent: t.simplifiedContent || ann.simplifiedContent
      };
    }
    return {
      title: ann.title,
      simplifiedContent: ann.simplifiedContent
    };
  };

  const handleConfirmAck = async (ann) => {
    setSubmittingId(ann._id);
    try {
      await onAcknowledge({
        announcementId: ann._id,
        languageViewed: activeLanguage,
        modeViewed: showOriginal ? 'original' : 'simplified',
        usedAudio: Boolean(audioUsedMap[ann._id])
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const unreadCount = announcements.filter((a) => !a.isAcknowledgedByMe).length;
  const readCount = announcements.filter((a) => a.isAcknowledgedByMe).length;

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filterTab === 'unread') return !ann.isAcknowledgedByMe;
    if (filterTab === 'read') return ann.isAcknowledgedByMe;
    return true;
  });

  const getCategoryIcon = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'safety':
        return <Shield className="w-3.5 h-3.5 text-amber-600" />;
      case 'hr':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const parseSections = (text) => {
    if (!text) return [];
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const clean = line.replace(/^[•\-*]\s*/, '');
      const colonIdx = clean.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        return {
          label: clean.substring(0, colonIdx).trim(),
          content: clean.substring(colonIdx + 1).trim()
        };
      }
      return {
        label: null,
        content: clean
      };
    });
  };

  const currentLoc = getLocalized(selectedAnnouncement);

  return (
    <div className="page-container max-w-6xl space-y-4">
      {/* 1. Header Card: Welcome & 1-Click Language Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.department} • {currentOrganization?.name || 'Organization'}
          </p>
        </div>

        {/* 1-Click Language Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">
            Language:
          </span>
          {LANGUAGES.map((lang) => {
            const isSelected = activeLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Split-View Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Notices Feed List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter Tabs */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-sm flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({announcements.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                filterTab === 'unread'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Action Needed ({unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('read')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                filterTab === 'read'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Read ({readCount})
            </button>
          </div>

          {/* Notices List */}
          <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                {filterTab === 'unread'
                  ? "✓ You're all caught up! No pending notices."
                  : 'No notices in this tab.'}
              </div>
            ) : (
              filteredAnnouncements.map((ann) => {
                const loc = getLocalized(ann);
                const isSelected = ann._id === currentSelectedId;
                const isAck = Boolean(ann.isAcknowledgedByMe);

                return (
                  <div
                    key={ann._id}
                    onClick={() => {
                      setSelectedAnnId(ann._id);
                      setShowOriginal(false);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(ann.category)}
                        <span className="text-[11px] font-bold text-slate-700 capitalize">
                          {ann.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ann.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {loc.title}
                    </h3>

                    <div className="flex items-center justify-between pt-1">
                      {isAck ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <Clock className="w-3 h-3" />
                          <span>Action Needed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Notice Reader */}
        <div className="lg:col-span-7">
          {selectedAnnouncement ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              {/* Notice Header & Audio */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {selectedAnnouncement.category}{' '}
                      {selectedAnnouncement.priority === 'Urgent'
                        ? '• Urgent'
                        : ''}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(
                        selectedAnnouncement.createdAt
                      ).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {showOriginal
                      ? selectedAnnouncement.title
                      : currentLoc.title}
                  </h2>
                </div>

                {/* Voice Note Player */}
                <div className="shrink-0">
                  <AudioPlayer
                    title={currentLoc.title}
                    text={
                      showOriginal
                        ? selectedAnnouncement.originalContent
                        : currentLoc.simplifiedContent
                    }
                    languageCode={showOriginal ? 'en' : activeLanguage}
                    onAudioUsed={() =>
                      setAudioUsedMap((prev) => ({
                        ...prev,
                        [selectedAnnouncement._id]: true
                      }))
                    }
                  />
                </div>
              </div>

              {/* Structured Message Cards */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {showOriginal
                    ? 'Original Notice (English)'
                    : `Simplified Explanation (${activeLanguage.toUpperCase()})`}
                </div>

                {showOriginal ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedAnnouncement.originalContent}
                  </div>
                ) : (
                  parseSections(currentLoc.simplifiedContent).map(
                    (sec, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          sec.label?.toLowerCase().includes('what to do') ||
                          sec.label?.toLowerCase().includes('action')
                            ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                            : sec.label?.toLowerCase().includes('contact')
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-blue-50/40 border-blue-100 text-slate-800'
                        }`}
                      >
                        {sec.label && (
                          <div className="font-bold text-[11px] uppercase tracking-wide mb-1 text-slate-900">
                            {sec.label}
                          </div>
                        )}
                        <p>{sec.content}</p>
                      </div>
                    )
                  )
                )}
              </div>

              {/* Toggle Original Text */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {showOriginal
                      ? 'Back to Simplified View'
                      : 'View Original English Notice'}
                  </span>
                  {showOriginal ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Bottom Action Footer: Acknowledge */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Please read or listen before confirming
                </span>

                {selectedAnnouncement.isAcknowledgedByMe ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You Acknowledged This Notice</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={submittingId === selectedAnnouncement._id}
                    onClick={() => handleConfirmAck(selectedAnnouncement)}
                    className="btn-green text-xs py-2.5 px-5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {submittingId === selectedAnnouncement._id
                        ? 'Confirming...'
                        : 'I Have Read & Understood'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Select a notice to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
