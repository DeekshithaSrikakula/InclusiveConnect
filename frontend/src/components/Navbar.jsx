import React from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar({
  user,
  currentOrganization,
  onLogout
}) {
  return (
    <header className="top-navbar">
      <div className="top-navbar-inner">
        {/* Left: Brand & Organization Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
            IC
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white">
              InclusiveConnect
            </span>
            {currentOrganization && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                • {currentOrganization.name}
              </span>
            )}
          </div>
        </div>

        {/* Right: User Name + Logout */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-300 hidden sm:block">
            <span className="font-semibold text-white">{user?.name}</span>
            <span className="text-slate-400">
              {' '}
              ({user?.role === 'ADMIN' ? 'Admin' : 'Employee'})
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
