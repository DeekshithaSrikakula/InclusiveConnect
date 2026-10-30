import React from 'react';
import {
  ArrowRight,
  Building2,
  FileText,
  Globe,
  Volume2,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';

export default function LandingPage({
  organizations = [],
  onNavigateToLogin,
  onNavigateToRegister
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Clean Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-base">
              IC
            </div>
            <span className="font-bold text-lg text-slate-900">
              InclusiveConnect
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="btn-outline hidden sm:inline-flex"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Register Organization</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="btn-blue"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-14 space-y-14">
        {/* Hero Section */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
            Multi-Organization Workplace Communication Platform
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
            Making Workplace Information Accessible for Any Organization
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            One unified platform where multiple organizations can publish announcements, automatically simplify and translate them into regional languages with audio, and track employee acknowledgements.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="btn-blue px-7 py-3.5 text-base"
            >
              <span>Sign In to Organization</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onNavigateToRegister}
              className="btn-outline px-6 py-3.5 text-base"
            >
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>Register New Organization</span>
            </button>
          </div>
        </div>

        {/* 4 Simple Workflow Steps */}
        <div className="space-y-4">
          <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-500">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            <div className="clean-card space-y-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">
                1. Admin Posts Notice
              </h3>
              <p className="text-sm text-slate-600">
                Each organization’s Admin creates a workplace announcement in English.
              </p>
            </div>

            <div className="clean-card space-y-2">
              <Globe className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">
                2. Simplify & Translate
              </h3>
              <p className="text-sm text-slate-600">
                System simplifies complex text and translates it into regional languages.
              </p>
            </div>

            <div className="clean-card space-y-2">
              <Volume2 className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">
                3. Read or Listen
              </h3>
              <p className="text-sm text-slate-600">
                Employees select their preferred language from a dropdown and read or listen.
              </p>
            </div>

            <div className="clean-card space-y-2">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">
                4. Track Status
              </h3>
              <p className="text-sm text-slate-600">
                Employees acknowledge reading, and their Organization Admin tracks completion.
              </p>
            </div>
          </div>
        </div>

        {/* Active Organizations on the Platform */}
        {organizations.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Organizations on This Platform ({organizations.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Click any organization below to sign in to its workspace, or register your own organization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  onClick={() => onNavigateToLogin(org._id)}
                  className="clean-card hover:border-blue-500 transition cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        <Building2 className="w-3.5 h-3.5" />
                        {org.orgCode}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {org.industry}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">
                      {org.name}
                    </h3>
                  </div>

                  <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <span>Sign in to workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        InclusiveConnect — Multi-Organization Workplace Communication Platform
      </footer>
    </div>
  );
}
