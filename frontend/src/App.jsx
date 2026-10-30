import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeePortal from './pages/EmployeePortal';
import {
  fetchDemoUsers,
  loginUser,
  registerOrganizationApi,
  joinEmployeeApi,
  updatePreferredLanguage,
  fetchAnnouncements,
  generateAIFormats,
  createAnnouncementApi,
  deleteAnnouncementApi,
  submitAcknowledgementApi,
  fetchAnalyticsApi
} from './services/api';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ic_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ic_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 'landing' | 'login'
  const [publicPage, setPublicPage] = useState('landing');
  const [loginMode, setLoginMode] = useState('login'); // 'login' | 'register'
  const [preselectedOrgId, setPreselectedOrgId] = useState('');

  const [organizations, setOrganizations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [sampleTemplates, setSampleTemplates] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [orgEmployees, setOrgEmployees] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState(user?.preferredLanguage || 'en');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const loadDirectory = useCallback(() => {
    fetchDemoUsers()
      .then((data) => {
        setOrganizations(data.organizations || []);
        setAllUsers(data.users || []);
        setSampleTemplates(data.sampleTemplates || []);
      })
      .catch((err) => console.error('Init fetch error:', err));
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const loadWorkspaceData = useCallback(async (activeToken, currentUser) => {
    if (!activeToken || !currentUser) return;
    try {
      const annData = await fetchAnnouncements(activeToken);
      setAnnouncements(annData.announcements || []);
      setOrgEmployees(annData.employees || []);

      if (currentUser.role === 'ADMIN') {
        const stats = await fetchAnalyticsApi(activeToken);
        setAnalytics(stats);
      }
    } catch (err) {
      console.error('Workspace load error:', err);
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      loadWorkspaceData(token, user);
    }
  }, [token, user, loadWorkspaceData]);

  const handleLogin = async (payload) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await loginUser(payload);
      setToken(data.token);
      setUser(data.user);
      setActiveLanguage(data.user.preferredLanguage || 'en');
      localStorage.setItem('ic_token', data.token);
      localStorage.setItem('ic_user', JSON.stringify(data.user));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterOrganization = async (payload) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await registerOrganizationApi(payload);
      loadDirectory();
      setToken(data.token);
      setUser(data.user);
      setActiveLanguage(data.user.preferredLanguage || 'en');
      localStorage.setItem('ic_token', data.token);
      localStorage.setItem('ic_user', JSON.stringify(data.user));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddEmployee = async (payload) => {
    const res = await joinEmployeeApi(payload);
    loadDirectory();
    await loadWorkspaceData(token, user);
    return res;
  };

  const handleLogout = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setToken('');
    setUser(null);
    setPublicPage('landing');
    localStorage.removeItem('ic_token');
    localStorage.removeItem('ic_user');
  };

  const handleLanguageChange = async (langCode) => {
    setActiveLanguage(langCode);
    if (token && user) {
      try {
        const res = await updatePreferredLanguage(token, langCode);
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('ic_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.error('Language update error:', err);
      }
    }
  };

  const handleGenerateAI = async (payload) => {
    return await generateAIFormats(token, payload);
  };

  const handleCreateAnnouncement = async (payload) => {
    const res = await createAnnouncementApi(token, payload);
    await loadWorkspaceData(token, user);
    return res;
  };

  const handleDeleteAnnouncement = async (id) => {
    await deleteAnnouncementApi(token, id);
    await loadWorkspaceData(token, user);
  };

  const handleAcknowledge = async (payload) => {
    await submitAcknowledgementApi(token, payload);
    await loadWorkspaceData(token, user);
  };

  const currentOrganization = organizations.find(
    (o) => o._id === user?.organizationId || o.orgCode === user?.orgCode
  );

  if (!token || !user) {
    if (publicPage === 'landing') {
      return (
        <LandingPage
          organizations={organizations}
          onNavigateToLogin={(orgId = '') => {
            setAuthError('');
            setPreselectedOrgId(orgId || '');
            setLoginMode('login');
            setPublicPage('login');
          }}
          onNavigateToRegister={() => {
            setAuthError('');
            setLoginMode('register');
            setPublicPage('login');
          }}
        />
      );
    }

    return (
      <LoginPage
        organizations={organizations}
        users={allUsers}
        initialOrgId={preselectedOrgId}
        initialMode={loginMode}
        onLogin={handleLogin}
        onRegisterOrganization={handleRegisterOrganization}
        onBackToLanding={() => {
          setAuthError('');
          setPublicPage('landing');
        }}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        currentOrganization={currentOrganization}
        activeLanguage={activeLanguage}
        onLanguageChange={handleLanguageChange}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {user.role === 'ADMIN' ? (
          <AdminDashboard
            user={user}
            currentOrganization={currentOrganization}
            announcements={announcements}
            employees={orgEmployees}
            analytics={analytics}
            sampleTemplates={sampleTemplates}
            onGenerateAI={handleGenerateAI}
            onCreateAnnouncement={handleCreateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onAddEmployee={handleAddEmployee}
          />
        ) : (
          <EmployeePortal
            user={user}
            currentOrganization={currentOrganization}
            announcements={announcements}
            activeLanguage={activeLanguage}
            onLanguageChange={handleLanguageChange}
            onAcknowledge={handleAcknowledge}
          />
        )}
      </main>
    </div>
  );
}
