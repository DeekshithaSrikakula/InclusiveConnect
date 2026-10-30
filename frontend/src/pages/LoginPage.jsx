import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Shield, User, PlusCircle } from 'lucide-react';

export default function LoginPage({
  organizations = [],
  users = [],
  initialOrgId = '',
  initialMode = 'login', // 'login' | 'register'
  onLogin,
  onRegisterOrganization,
  onBackToLanding,
  loading,
  error
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [selectedOrgId, setSelectedOrgId] = useState(
    initialOrgId || organizations[0]?._id || 'org_apex_mfg'
  );
  const [roleTab, setRoleTab] = useState('employee'); // 'employee' | 'admin'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');

  // Register New Organization Form State
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [industry, setIndustry] = useState('Manufacturing & Warehouse');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Keep selectedOrgId valid when organizations load
  useEffect(() => {
    if (initialOrgId) {
      setSelectedOrgId(initialOrgId);
    } else if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0]._id);
    }
  }, [initialOrgId, organizations, selectedOrgId]);

  // Users belonging to the currently selected organization and role
  const orgUsersForRole = users.filter(
    (u) =>
      u.organizationId === selectedOrgId &&
      u.role === (roleTab === 'admin' ? 'ADMIN' : 'EMPLOYEE')
  );

  // Automatically pre-fill the first matching user's email when switching Organization or Role tab
  useEffect(() => {
    const match = users.find(
      (u) =>
        u.organizationId === selectedOrgId &&
        u.role === (roleTab === 'admin' ? 'ADMIN' : 'EMPLOYEE')
    );
    if (match) {
      setIdentifier(match.email || match.employeeId);
      setPassword('password123');
    }
  }, [selectedOrgId, roleTab, users]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin({ identifier, password });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    onRegisterOrganization({
      orgName,
      orgCode,
      industry,
      adminName,
      adminEmail
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Back to Home Link */}
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Clean Card */}
        <div className="clean-card space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
              IC
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              InclusiveConnect Workspace
            </h1>
            <p className="text-xs text-slate-500">
              Sign in to an existing organization or register a new organization
            </p>
          </div>

          {/* Top Mode Switcher: Sign In vs Register Organization */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Organization</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* MODE 1: SIGN IN TO AN ORGANIZATION */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Step 1: Select Organization Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="input-field font-semibold cursor-pointer"
                >
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.orgCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Role Selection (Employee vs Admin) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRoleTab('employee')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      roleTab === 'employee'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Employee Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleTab('admin')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      roleTab === 'admin'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Login</span>
                  </button>
                </div>
              </div>

              {/* Quick Account Selector for the Chosen Organization (if multiple accounts exist) */}
              {orgUsersForRole.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select {roleTab === 'admin' ? 'Admin' : 'Employee'} Account
                  </label>
                  <select
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field text-xs cursor-pointer"
                  >
                    {orgUsersForRole.map((u) => (
                      <option key={u._id} value={u.email}>
                        {u.name} — {u.department} ({u.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email / Employee ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email or Employee ID
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or Employee ID"
                  className="input-field"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-blue w-full py-3"
              >
                {loading
                  ? 'Signing in...'
                  : roleTab === 'admin'
                  ? 'Sign In as Organization Admin'
                  : 'Sign In as Employee'}
              </button>
            </form>
          ) : (
            /* MODE 2: REGISTER A NEW ORGANIZATION */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Sunrise Textiles Pvt Ltd"
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organization Code *
                  </label>
                  <input
                    type="text"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SUNRISE-01"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="input-field"
                  >
                    <option value="Manufacturing & Warehouse">Manufacturing</option>
                    <option value="Healthcare & Hospital">Healthcare</option>
                    <option value="Education & Campus">Education</option>
                    <option value="IT & Corporate">IT & Corporate</option>
                    <option value="Retail & Hospitality">Retail & Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Name *
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g., Ananya Rao"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g., admin@sunrise.com"
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-green w-full py-3 mt-1"
              >
                {loading
                  ? 'Creating Workspace...'
                  : 'Create Organization Workspace'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
