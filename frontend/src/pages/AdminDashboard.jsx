import React, { useState } from 'react';
import {
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Send,
  UserPlus,
  FileText,
  Search,
  Shield,
  Briefcase,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { LANGUAGES } from '../utils/uiTranslations';

export default function AdminDashboard({
  user,
  currentOrganization,
  announcements = [],
  employees = [],
  sampleTemplates,
  onGenerateAI,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onAddEmployee
}) {
  // 'announcements' | 'create' | 'employees'
  const [activeTab, setActiveTab] = useState('announcements');
  const [selectedAnnId, setSelectedAnnId] = useState(
    announcements[0]?._id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Create Announcement Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Safety');
  const [priority, setPriority] = useState('Urgent');
  const [originalContent, setOriginalContent] = useState('');
  const [simplifiedContent, setSimplifiedContent] = useState('');
  const [translations, setTranslations] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Add Employee Form State
  const [empName, setEmpName] = useState('');
  const [empId, setEmpId] = useState('');
  const [empDept, setEmpDept] = useState('Operations');
  const [empLang, setEmpLang] = useState('te');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [empSuccessMsg, setEmpSuccessMsg] = useState('');

  // Keep a valid selected announcement
  const currentSelectedId =
    selectedAnnId && announcements.some((a) => a._id === selectedAnnId)
      ? selectedAnnId
      : announcements[0]?._id || null;

  const selectedAnnouncement = announcements.find(
    (a) => a._id === currentSelectedId
  );

  const handleFillSample = () => {
    const sample = sampleTemplates?.[0];
    if (!sample) return;
    setTitle(sample.title);
    setCategory(sample.category);
    setPriority(sample.priority);
    setOriginalContent(sample.originalContent);
    setSimplifiedContent('');
    setTranslations(null);
  };

  const handleGenerate = async () => {
    if (!title.trim() || !originalContent.trim()) {
      alert('Please enter a Title and Announcement Content first.');
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await onGenerateAI({ title, originalContent, category });
      setSimplifiedContent(res.simplifiedContent || '');
      setTranslations(res.translations || null);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !originalContent.trim()) return;
    setPublishing(true);
    try {
      const res = await onCreateAnnouncement({
        title,
        category,
        priority,
        targetAudience: 'All Employees',
        originalContent,
        simplifiedContent,
        translations
      });
      setTitle('');
      setOriginalContent('');
      setSimplifiedContent('');
      setTranslations(null);
      if (res?.announcement?._id) {
        setSelectedAnnId(res.announcement._id);
      }
      setActiveTab('announcements');
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!empName.trim()) return;
    setAddingEmployee(true);
    setEmpSuccessMsg('');
    try {
      const res = await onAddEmployee({
        organizationId: user?.organizationId,
        orgCode: user?.orgCode,
        name: empName,
        employeeId: empId,
        department: empDept,
        preferredLanguage: empLang
      });
      setEmpName('');
      setEmpId('');
      setEmpSuccessMsg(
        `Added ${res.user.name} (ID: ${res.user.employeeId}, Password: password123)`
      );
    } finally {
      setAddingEmployee(false);
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesCategory =
      categoryFilter === 'all' ||
      ann.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.simplifiedContent?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'safety':
        return <Shield className="w-4 h-4 text-amber-600" />;
      case 'hr':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
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

  return (
    <div className="page-container max-w-6xl space-y-4">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {currentOrganization?.orgCode?.substring(0, 2) || 'IC'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                {currentOrganization?.name || 'Workspace'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {currentOrganization?.orgCode || user?.orgCode}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Admin Console • {user?.name}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notices ({announcements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER-DETAIL SPLIT-VIEW FOR NOTICES */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Notices Feed List */}
          <div className="lg:col-span-5 space-y-3">
            {/* Search & Filter */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-sm space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notices..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold pt-0.5">
                {['all', 'safety', 'hr', 'operations'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] capitalize cursor-pointer transition ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Notices */}
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {filteredAnnouncements.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No notices match your filter.
                </div>
              ) : (
                filteredAnnouncements.map((ann) => {
                  const isSelected = ann._id === currentSelectedId;
                  const rate = ann.completionRate ?? 0;

                  return (
                    <div
                      key={ann._id}
                      onClick={() => setSelectedAnnId(ann._id)}
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
                        {ann.title}
                      </h3>

                      {/* Mini Progress Indicator */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          {ann.acknowledgementCount} / {ann.totalEmployees} Read
                        </span>
                        <span
                          className={`font-bold ${
                            rate >= 100
                              ? 'text-emerald-700'
                              : rate > 0
                              ? 'text-blue-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {rate}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Notice Detail & Management */}
          <div className="lg:col-span-7">
            {selectedAnnouncement ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
                {/* Notice Header & Actions */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {selectedAnnouncement.category}{' '}
                        {selectedAnnouncement.priority === 'Urgent'
                          ? '• Urgent'
                          : ''}
                      </span>
                      <span className="text-xs text-slate-400">
                        Posted on{' '}
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
                      {selectedAnnouncement.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete notice "${selectedAnnouncement.title}"?`
                        )
                      ) {
                        onDeleteAnnouncement(selectedAnnouncement._id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Structured Notice Content Blocks */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Simplified Announcement
                  </div>

                  {parseSections(selectedAnnouncement.simplifiedContent).map(
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
                  )}
                </div>

                {/* Employee Read Status Tracker */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      Employee Acknowledgements:
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {selectedAnnouncement.acknowledgementCount} of{' '}
                      {selectedAnnouncement.totalEmployees} Confirmed (
                      {selectedAnnouncement.completionRate}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          selectedAnnouncement.completionRate,
                          100
                        )}%`
                      }}
                    />
                  </div>

                  {/* Confirmed vs Pending Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Confirmed */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Confirmed (
                          {selectedAnnouncement.acknowledgements?.length || 0})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {(selectedAnnouncement.acknowledgements || []).length ===
                        0 ? (
                          <div className="text-[11px] text-slate-400 italic">
                            No employees have confirmed yet.
                          </div>
                        ) : (
                          (selectedAnnouncement.acknowledgements || []).map(
                            (ack) => (
                              <div
                                key={ack._id}
                                className="bg-white p-2 rounded-lg border border-emerald-200 flex items-center justify-between text-[11px]"
                              >
                                <span className="font-semibold text-slate-800">
                                  {ack.userName}
                                </span>
                                <span className="text-slate-500 uppercase font-bold text-[10px]">
                                  {ack.languageViewed}
                                  {ack.usedAudio ? ' • 🔊' : ''}
                                </span>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>

                    {/* Pending */}
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
                      <div className="font-bold text-amber-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Pending (
                          {selectedAnnouncement.pendingEmployees?.length || 0})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {(selectedAnnouncement.pendingEmployees || []).length ===
                        0 ? (
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            ✓ All employees have confirmed!
                          </div>
                        ) : (
                          (selectedAnnouncement.pendingEmployees || []).map(
                            (emp) => (
                              <div
                                key={emp._id}
                                className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between text-[11px]"
                              >
                                <span className="font-semibold text-slate-800">
                                  {emp.name}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {emp.department}
                                </span>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Select an announcement from the list to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POST NOTICE COMPOSER */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Post New Announcement
              </h2>
              <p className="text-xs text-slate-500">
                Write in standard English. The platform automatically simplifies and translates for your team.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Fill Sample
            </button>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notice Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Warehouse Gate 3 Safety Protocol"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="Safety">Safety</option>
                  <option value="HR">HR & Policy</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Content (English) *
              </label>
              <textarea
                rows={4}
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                placeholder="Paste or write the corporate announcement..."
                className="input-field leading-relaxed"
                required
              />
            </div>

            {/* AI Preview */}
            {simplifiedContent && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Simplified Preview (Also translated to Telugu, Hindi, Tamil):
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={simplifiedContent}
                  onChange={(e) => setSimplifiedContent(e.target.value)}
                  className="input-field bg-white text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={generatingAI}
                onClick={handleGenerate}
                className="btn-outline text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {generatingAI
                    ? 'Simplifying with AI...'
                    : 'Preview Simplified Text'}
                </span>
              </button>

              <button
                type="submit"
                disabled={publishing}
                className="btn-blue text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {publishing ? 'Publishing...' : 'Publish to All Employees'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TEAM DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Add Employee Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Add Team Member
              </h2>
            </div>

            {empSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {empSuccessMsg}
              </div>
            )}

            <form
              onSubmit={handleCreateEmployee}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2.5"
            >
              <input
                type="text"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="Full Name *"
                className="input-field text-xs"
                required
              />
              <input
                type="text"
                value={empDept}
                onChange={(e) => setEmpDept(e.target.value)}
                placeholder="Department *"
                className="input-field text-xs"
                required
              />
              <select
                value={empLang}
                onChange={(e) => setEmpLang(e.target.value)}
                className="input-field text-xs cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addingEmployee}
                className="btn-green text-xs py-2"
              >
                {addingEmployee ? 'Adding...' : '+ Add Member'}
              </button>
            </form>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div
                key={emp._id}
                className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{emp.name}</div>
                  <div className="text-slate-500 text-[11px]">
                    ID: <code>{emp.employeeId}</code> • {emp.department}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase text-[10px]">
                  {emp.preferredLanguage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
