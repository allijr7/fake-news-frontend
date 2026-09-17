import { useState, useEffect } from 'react';
import './App.css';
import { User, Lock, ShieldCheck, History as HistoryIcon, Sparkles, FileText, Link2, Search, LogOut, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const API_BASE = import.meta.env.DEV
  ? 'http://127.0.0.1:5000'
  : 'https://fake-news-detector-api-oa3e.onrender.com';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [isSuperAdmin, setIsSuperAdmin] = useState(localStorage.getItem('isSuperAdmin') === 'true');
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');
  const [page, setPage] = useState('checker'); // 'checker' | 'history'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  // --- Auth form state ---
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginRole, setLoginRole] = useState('user'); // 'user' | 'admin'

  // --- Checker state ---
  const [inputType, setInputType] = useState('text');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  // shape: { message: string, onConfirm: function } | null
  const [error, setError] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  useEffect(() => {
    if (page !== 'settings') {
      setNameMessage('');
      setNameError('');
      setUsernameMessage('');
      setUsernameError('');
      setPasswordMessage('');
      setPasswordError('');
      setCurrentPassword('');
      setNewPassword('');
    }
    if (page !== 'checker') {
      setInputValue('');
      setResult(null);
      setBatchResults(null);
      setError('');
      setRetryCountdown(0);
    }
  }, [page]);

  useEffect(() => {
    setNameInput(name);
    setUsernameInput(username);
  }, [name, username]);

  useEffect(() => {
    setAuthUsername('');
    setAuthPassword('');
    setAuthError('');
  }, [authMode]);

  useEffect(() => {
    if (authMode !== 'register' || !authUsername.trim()) {
      setUsernameAvailability(null);
      return;
    }
    setUsernameAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/check-username?username=${encodeURIComponent(authUsername.trim())}`);
        const data = await res.json();
        if (data.error) {
          setUsernameAvailability('invalid');
        } else {
          setUsernameAvailability(data.available ? 'available' : 'taken');
        }
      } catch (e) {
        setUsernameAvailability(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [authUsername, authMode]);

  // --- History state ---
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyScrolled, setHistoryScrolled] = useState(false); // tracks scroll position for the floating "Top" button

  // --- Admin state ---
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminChecks, setAdminChecks] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('users');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminScrolled, setAdminScrolled] = useState(false); // tracks scroll position for the floating "Top" button
  const [analytics, setAnalytics] = useState(null);

  // --- Menu state ---
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  // --- Setting page state ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [usernameInput, setUsernameInput] = useState(username);
  const [nameMessage, setNameMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [settingsUsernameAvailability, setSettingsUsernameAvailability] = useState(null);

    useEffect(() => {
    if (page !== 'settings' || !usernameInput.trim() || usernameInput.trim() === username) {
      setSettingsUsernameAvailability(null);
      return;
    }
    setSettingsUsernameAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/check-username?username=${encodeURIComponent(usernameInput.trim())}`);
        const data = await res.json();
        if (data.error) {
          setSettingsUsernameAvailability('invalid');
        } else {
          setSettingsUsernameAvailability(data.available ? 'available' : 'taken');
        }
      } catch (e) {
        setSettingsUsernameAvailability(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput, page, username]);

  const getPasswordChecks = (pwd) => ({
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd),
  });

  const handleAuth = async () => {
    if (!authUsername.trim() || !authPassword) return;
    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (response.status === 429) {
        setAuthError('Too many attempts in a short time — please wait a moment and try again.');
        setAuthLoading(false);
        return;
      }

      if (!response.ok) {
        setAuthError(data.error || 'Something went wrong');
      } else if (authMode === 'login' && loginRole === 'admin' && data.role !== 'admin') {
        setAuthError('This account does not have admin access.');
      } else {
        setToken(data.token);
        setUsername(data.username);
        setRole(data.role);
        setIsSuperAdmin(data.is_super_admin);
        setName(data.name || '');
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        localStorage.setItem('isSuperAdmin', data.is_super_admin);
        localStorage.setItem('name', data.name || '');
        setAuthUsername('');
        setAuthPassword('');
        if (data.role === 'admin' && loginRole === 'admin') {
          setPage('admin');
        }
      }
    } catch (err) {
      setAuthError('Could not reach the server. Is the Flask API running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setName('');
    setRole('user');
    setIsSuperAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('isSuperAdmin');
    setResult(null);
    setHistory([]);
    setPage('checker');
  };

  const handleCheck = async () => {
    if (!inputValue.trim()) return;

    if (inputType === 'url') {
      const looksLikeUrl = /^https?:\/\/.+\..+/i.test(inputValue.trim());
      if (!looksLikeUrl) {
        setError('Please enter a valid URL starting with http:// or https://');
        return;
      }
    } else if (inputValue.trim().length < 30) {
      setError('Please paste more of the article — very short text is hard to evaluate.');
      return;
    }

    setLoading(true);

    try {
      const body = inputType === 'text' ? { text: inputValue } : { url: inputValue };

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        setRetryCountdown(seconds);
        setError(`Too many checks in a short time — try again in ${seconds}s.`);
      } else if (!response.ok) {
        setError(data.error || data.msg || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Could not reach the server. Is the Flask API running?');
    } finally {
      setLoading(false);
    }
  };

    const handleBatchCheck = async () => {
    const urls = inputValue.split('\n').map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    if (urls.length > 10) {
      setError('Maximum 10 URLs per batch.');
      return;
    }

    setBatchLoading(true);
    setBatchResults(null);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/predict-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ urls }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (response.status === 429) {
        setError('Too many batch checks in a short time — please wait a moment.');
      } else if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setBatchResults(data.results);
      }
    } catch (err) {
      setError('Could not reach the server. Is the Flask API running?');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');
    if (!currentPassword || !newPassword) return;
    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }
      if (response.status === 401 && data.msg === 'Token has expired') {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (!response.ok) {
        setPasswordError(data.error || data.msg || 'Something went wrong');
      } else {
        setPasswordMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPasswordError('Could not reach the server.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeName = async () => {
    setNameError('');
    setNameMessage('');
    try {
      const response = await fetch(`${API_BASE}/change-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: nameInput }),
      });
      let data = {};
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (!response.ok) {
        setNameError(data.error || data.msg || 'Something went wrong');
      } else {
        setName(data.name || '');
        localStorage.setItem('name', data.name || '');
        setNameMessage('Name updated.');
      }
    } catch (err) {
      setNameError('Could not reach the server.');
    }
  };

  const submitUsernameChange = async () => {
    try {
      const response = await fetch(`${API_BASE}/change-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username: usernameInput }),
      });
      let data = {};
      try { data = await response.json(); } catch (e) { data = {}; }

      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (!response.ok) {
        setUsernameError(data.error || data.msg || 'Something went wrong');
      } else {
        setUsername(data.username);
        localStorage.setItem('username', data.username);
        setUsernameMessage('Username updated.');
      }
    } catch (err) {
      setUsernameError('Could not reach the server.');
    }
  };

  const handleChangeUsername = () => {
    setUsernameError('');
    setUsernameMessage('');

    if (usernameInput.trim() === username) {
      setUsernameError('That is already your username');
      return;
    }

    setConfirmDialog({
      message: `Change your username to "${usernameInput}"? You won't be able to change it again for 14 days.`,
      onConfirm: () => {
        setConfirmDialog(null);
        submitUsernameChange();
      },
    });
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [usersRes, checksRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/checks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/analytics`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (usersRes.status === 401 || usersRes.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
        return;
      }
      const usersData = await usersRes.json();
      const checksData = await checksRes.json();
      const analyticsData = await analyticsRes.json();
      if (usersRes.ok) setAdminUsers(usersData);
      if (checksRes.ok) setAdminChecks(checksData);
      if (analyticsRes.ok) setAnalytics(analyticsData);
    } catch (err) {
      // silent fail acceptable
    } finally {
      setAdminLoading(false);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setAdminUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      // silent fail acceptable
    }
  };

  const handleDeleteUser = (id) => {
    setConfirmDialog({
      message: 'Delete this user and all their history? This cannot be undone.',
      onConfirm: () => {
        setConfirmDialog(null);
        submitDeleteUser(id);
      },
    });
  };

  const submitDeleteUser = async (id) => {
    try {
      await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setAdminUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      // silent fail acceptable
    }
  };

  const handleToggleSuspend = (id, currentlySuspended) => {
    setConfirmDialog({
      message: currentlySuspended
        ? "Reactivate this user's account?"
        : "Suspend this user? They won't be able to log in until reactivated.",
      onConfirm: () => {
        setConfirmDialog(null);
        submitToggleSuspend(id);
      },
    });
  };

  const submitToggleSuspend = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/suspend`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdminUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_suspended: data.is_suspended } : u)));
      }
    } catch (err) {
      // silent fail acceptable
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE}/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
      } else if (response.ok) {
        setHistory(data);
      }
    } catch (err) {
      // silent fail is fine here; history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportHistory = () => {
    if (history.length === 0) return;

    const headers = ['Date', 'Type', 'Verdict', 'Confidence', 'Preview'];
    const rows = history.map((item) => [
      new Date(item.checked_at).toLocaleString(),
      item.input_type,
      item.label,
      `${item.confidence}%`,
      `"${item.text_preview.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `check-history-${username}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Fake News Detector — Check History', 14, 18);
    doc.setFontSize(10);
    doc.text(`User: ${username}`, 14, 25);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [['Date', 'Type', 'Verdict', 'Confidence', 'Preview']],
      body: history.map((item) => [
        new Date(item.checked_at).toLocaleString(),
        item.input_type,
        item.label,
        `${item.confidence}%`,
        item.text_preview.length > 60 ? item.text_preview.slice(0, 60) + '...' : item.text_preview,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [31, 29, 27] },
    });

    doc.save(`check-history-${username}.pdf`);
  };

  const handleDeleteHistory = async (id) => {
    try {
      await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      // silent fail is acceptable here
    }
  };

  useEffect(() => {
    if (token && page === 'history') {
      loadHistory();
    }
    if (token && page === 'admin') {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  // ---------- LOGGED OUT VIEW ----------
  if (!token) {
    return (
      <div className="auth-page">
        <div className="masthead top-masthead">
          <h1>Fake News Detector</h1>
          <p className="kicker">Editorial Verification Desk</p>
        </div>

        <div className="auth-split">
          <div className="auth-left">
            <h2>Verify before you trust.</h2>
            <p className="auth-left-sub">
              A quick, evidence-based read on any article — powered by a model trained
              to spot the patterns behind misinformation.
            </p>
            <ul className="feature-list">
              <li><ShieldCheck size={18} /> Instant credibility scoring</li>
              <li><Sparkles size={18} /> See the words driving each verdict</li>
              <li><HistoryIcon size={18} /> Every check saved to your record</li>
            </ul>
          </div>

          <div className="auth-right">
            <div className="auth-card">
              <h2 className="auth-card-title">{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
              <p className="subtitle">
                {authMode === 'login'
                  ? 'Enter your credentials to access your record.'
                  : 'Set up an account to start verifying articles.'}
              </p>

              {authMode === 'login' && (
                <div className="role-tabs">
                  <button
                    className={loginRole === 'user' ? 'active' : ''}
                    onClick={() => setLoginRole('user')}
                  >
                    User
                  </button>
                  <button
                    className={loginRole === 'admin' ? 'active' : ''}
                    onClick={() => setLoginRole('admin')}
                  >
                    Admin
                  </button>
                </div>
              )}

              <label className="field-label">Username</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                />
              </div>
              {authMode === 'register' && usernameAvailability && (
                <p className={`username-status ${usernameAvailability}`}>
                  {usernameAvailability === 'checking' && 'Checking availability...'}
                  {usernameAvailability === 'available' && '✓ Username available'}
                  {usernameAvailability === 'taken' && '✕ Username already taken'}
                  {usernameAvailability === 'invalid' && '✕ 3-20 characters: letters, numbers, _ .'}
                </p>
              )}

              <label className="field-label">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {authMode === 'register' && authPassword && (
                <ul className="password-checklist">
                  {Object.entries({
                    length: 'At least 8 characters',
                    uppercase: 'One uppercase letter',
                    number: 'One number',
                    special: 'One special character (!@#$% etc.)',
                  }).map(([key, label]) => (
                    <li key={key} className={getPasswordChecks(authPassword)[key] ? 'met' : ''}>
                      {getPasswordChecks(authPassword)[key] ? '✓' : '○'} {label}
                    </li>
                  ))}
                </ul>
              )}
              <button className="check-btn" onClick={handleAuth} disabled={authLoading}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              {authError && <p className="error">{authError}</p>}

              <p className="auth-switch">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  className="link-btn"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                >
                  {authMode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ---------- LOGGED IN VIEW ----------
  return (
    <div className="app">
      <div className="masthead">
        <h1>Fake News Detector</h1>
        <p className="kicker">Editorial Verification Desk</p>
      </div>
      <hr className="rule" />

      <div className="nav-bar">
        <div className="profile-menu-wrapper">
          <button className="profile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="avatar-circle"><User size={16} /></span>
            <span className="profile-name">{name || username}</span>
          </button>

          {menuOpen && (
            <>
              <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
              <div className="profile-dropdown">
                <div className="dropdown-identity">
                  <p className="dropdown-name">{name || username}</p>
                  <p className="dropdown-username">@{username}</p>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className={page === 'checker' ? 'active' : ''}
                  onClick={() => { setPage('checker'); setMenuOpen(false); }}
                >
                  <Search size={15} /> Dashboard
                </button>
                <button
                  className={page === 'history' ? 'active' : ''}
                  onClick={() => { setPage('history'); setMenuOpen(false); }}
                >
                  <HistoryIcon size={15} /> History
                </button>
                {role === 'admin' && (
                  <button
                    className={page === 'admin' ? 'active' : ''}
                    onClick={() => { setPage('admin'); setMenuOpen(false); }}
                  >
                    <ShieldCheck size={15} /> Admin
                  </button>
                )}
                <button
                  className={page === 'settings' ? 'active' : ''}
                  onClick={() => { setPage('settings'); setMenuOpen(false); }}
                >
                  <Lock size={15} /> Settings
                </button>

                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                  {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                  {theme === 'light' ? 'Dark mode' : 'Light mode'}
                </button>
                <hr className="dropdown-divider" />
                <button className="logout-item" onClick={handleLogout}>
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="content-card">
        {page === 'checker' && (
          <>
            <h2 className="content-title">Check an Article</h2>
            <p className="subtitle content-subtitle">Paste an article's text or a link — we'll tell you what the evidence says.</p>

            <div className="toggle">
              <button className={inputType === 'text' ? 'active' : ''} onClick={() => setInputType('text')}>
                <FileText size={14} /> Text
              </button>
              <button className={inputType === 'url' ? 'active' : ''} onClick={() => setInputType('url')}>
                <Link2 size={14} /> URL
              </button>
              <button className={inputType === 'batch' ? 'active' : ''} onClick={() => setInputType('batch')}>
                <Search size={14} /> Batch
              </button>
            </div>

            {inputType === 'text' && (
              <textarea
                placeholder="Paste article text here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={8}
              />
            )}

            {inputType === 'url' && (
              <input
                type="text"
                placeholder="Paste article URL here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}

            {inputType === 'batch' && (
              <textarea
                placeholder="Paste up to 10 URLs, one per line..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={8}
              />
            )}

            <button
              className="check-btn"
              onClick={inputType === 'batch' ? handleBatchCheck : handleCheck}
              disabled={inputType === 'batch' ? batchLoading : loading}
            >
              {inputType === 'batch'
                ? (batchLoading ? 'Checking batch...' : <><Search size={15} /> Check All</>)
                : (loading ? 'Checking...' : <><Search size={15} /> Check the record</>)}
            </button>

            {loading && (
              <div className="skeleton-result">
                <div className="skeleton-line skeleton-stamp"></div>
                <div className="skeleton-line skeleton-bar"></div>
                <div className="skeleton-line skeleton-text"></div>
                <div className="skeleton-line skeleton-text short"></div>
              </div>
            )}

            {error && (
              <p className="error">
                {retryCountdown > 0
                  ? `Too many checks in a short time — try again in ${retryCountdown}s.`
                  : error}
              </p>
            )}

            {result && (
              <div className={`result ${result.label.toLowerCase()}`}>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Verdict: ${result.label} (${result.confidence}% confidence)\n"${result.extracted_text_preview}..."`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy result'}
                </button>
                <div className="stamp">{result.label === 'Real' ? 'Verified' : result.label === 'Fake' ? 'Flagged' : 'Uncertain'}</div>
                <p className="confidence">Confidence: {result.confidence}%</p>
                <div className="confidence-bar-track">
                  <div
                    className={`confidence-bar-fill ${result.label.toLowerCase()}`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <p className="preview">"{result.extracted_text_preview}..."</p>

                {result.top_words && result.top_words.length > 0 && (
                  <div className="top-words">
                    <p className="top-words-label">Key words influencing this result</p>
                    <div className="word-chips">
                      {result.top_words.map((item, i) => (
                        <span key={i} className="word-chip">{item.word}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {batchLoading && (
              <div className="skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-stamp"></div>
                    <div className="skeleton-line skeleton-text"></div>
                  </div>
                ))}
              </div>
            )}

            {batchResults && (
              <div className="batch-results">
                {batchResults.map((item, i) => (
                  <div key={i} className={`batch-item ${item.error ? 'error-item' : item.label?.toLowerCase()}`}>
                    <p className="batch-url">{item.url}</p>
                    {item.error ? (
                      <p className="batch-error">{item.error}</p>
                    ) : (
                      <>
                        <span className={`mini-stamp ${item.label.toLowerCase()}`}>
                          {item.label === 'Real' ? 'Verified' : item.label === 'Fake' ? 'Flagged' : 'Uncertain'}
                        </span>
                        <span className="batch-confidence">{item.confidence}%</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === 'history' && (
          <>
            <h2 className="content-title">Your Record</h2>
            <p className="subtitle content-subtitle">Every article you've checked, most recent first.</p>

            {!historyLoading && history.length > 0 && (
              <div className="export-wrapper">
                <button className="export-btn" onClick={() => setExportMenuOpen(!exportMenuOpen)}>
                  Export ▾
                </button>
                {exportMenuOpen && (
                  <>
                    <div className="menu-overlay" onClick={() => setExportMenuOpen(false)} />
                    <div className="export-dropdown">
                      <button onClick={() => { handleExportHistory(); setExportMenuOpen(false); }}>
                        Export as CSV
                      </button>
                      <button onClick={() => { handleExportPDF(); setExportMenuOpen(false); }}>
                        Export as PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {historyLoading && (
              <div className="skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-stamp"></div>
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text short"></div>
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="subtitle">No checks yet — head to the Checker tab to verify your first article.</p>
            )}

            {/* Scrollable history list with a floating "back to top" button that only
                appears once the user has scrolled down inside this section. */}
            {!historyLoading && history.length > 0 && (
              <div className="scroll-container">
                <div
                  className="history history-scroll"
                  id="history-scroll"
                  onScroll={(e) => setHistoryScrolled(e.target.scrollTop > 40)}
                >
                  {history.map((item) => (
                    <div key={item.id} className={`history-item ${item.label.toLowerCase()}`}>
                      <div className="history-item-header">
                        <span className={`mini-stamp ${item.label.toLowerCase()}`}>{item.label === 'Real' ? 'Verified' : item.label === 'Fake' ? 'Flagged' : 'Uncertain'}</span>
                        <span className="history-date">{new Date(item.checked_at).toLocaleString()}</span>
                      </div>
                      <p className="preview">"{item.text_preview}..."</p>
                      <div className="history-footer">
                        <p className="history-confidence">Confidence: {item.confidence}%</p>
                        <button className="delete-btn" onClick={() => handleDeleteHistory(item.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                {historyScrolled && (
                  <button
                    className="back-to-top floating"
                    onClick={() => document.getElementById('history-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    ↑ Top
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {page === 'admin' && role === 'admin' && (
          <>
            <h2 className="content-title">Admin Panel</h2>
            <p className="subtitle content-subtitle">System-wide users and activity.</p>

            <div className="toggle">
              <button className={adminTab === 'users' ? 'active' : ''} onClick={() => setAdminTab('users')}>
                Users
              </button>
              <button className={adminTab === 'checks' ? 'active' : ''} onClick={() => setAdminTab('checks')}>
                Activity
              </button>
              <button className={adminTab === 'analytics' ? 'active' : ''} onClick={() => setAdminTab('analytics')}>
                Analytics
              </button>
            </div>

            {adminLoading && (
              <div className="skeleton-table">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-row"></div>
                ))}
              </div>
            )}

            {!adminLoading && (
              <input
                type="text"
                className="admin-search"
                placeholder={adminTab === 'users' ? 'Search by username...' : 'Search by username or verdict...'}
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            )}

            {/* Same scrollable + floating "back to top" pattern as History, applied to
                whichever admin table is currently active. */}
            {!adminLoading && adminTab === 'users' && (
              <div className="scroll-container">
                <div
                  className="admin-table-wrapper admin-scroll"
                  id="admin-scroll"
                  onScroll={(e) => setAdminScrolled(e.target.scrollTop > 40)}
                >
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Checks</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers
                        .filter((u) => u.username.toLowerCase().includes(adminSearch.toLowerCase()))
                        .map((u) => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>
                              {isSuperAdmin && !u.is_super_admin ? (
                                <select
                                  className="role-select"
                                  value={u.role}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                >
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              ) : (
                                <span className={`role-badge ${u.role}`}>
                                  {u.is_super_admin ? 'super admin' : u.role}
                                </span>
                              )}
                            </td>
                            <td>{u.check_count}</td>
                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td>
                              {u.is_suspended && <span className="suspended-badge">Suspended</span>}
                            </td>
                            <td>
                              {!u.is_super_admin && (
                                <div className="admin-actions">
                                  <button
                                    className="suspend-btn"
                                    onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                                  >
                                    {u.is_suspended ? 'Reactivate' : 'Suspend'}
                                  </button>
                                  <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>Remove</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {adminScrolled && (
                  <button
                    className="back-to-top floating"
                    onClick={() => document.getElementById('admin-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    ↑ Top
                  </button>
                )}
              </div>
            )}

            {!adminLoading && adminTab === 'checks' && (
              <div className="scroll-container">
                <div
                  className="admin-table-wrapper admin-scroll"
                  id="admin-scroll"
                  onScroll={(e) => setAdminScrolled(e.target.scrollTop > 40)}
                >
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Type</th>
                        <th>Verdict</th>
                        <th>Confidence</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminChecks
                        .filter((c) =>
                          c.username.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          c.label.toLowerCase().includes(adminSearch.toLowerCase())
                        )
                        .map((c) => (
                          <tr key={c.id}>
                            <td>{c.username}</td>
                            <td>{c.input_type}</td>
                            <td><span className={`mini-stamp ${c.label.toLowerCase()}`}>{c.label}</span></td>
                            <td>{c.confidence}%</td>
                            <td>{new Date(c.checked_at).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {adminScrolled && (
                  <button
                    className="back-to-top floating"
                    onClick={() => document.getElementById('admin-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    ↑ Top
                  </button>
                )}
              </div>
            )}

            {!adminLoading && adminTab === 'analytics' && analytics && (
              <div className="analytics-view">
                <div className="stat-cards">
                  <div className="stat-card">
                    <p className="stat-number">{analytics.total_users}</p>
                    <p className="stat-label">Total Users</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-number">{analytics.total_checks}</p>
                    <p className="stat-label">Total Checks</p>
                  </div>
                </div>

                <h3 className="chart-title">Checks over the last 14 days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--ink-muted)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--ink-muted)" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>

                <h3 className="chart-title">Verdict breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics.by_label}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.label}: ${entry.count}`}
                    >
                      {analytics.by_label.map((entry, i) => (
                        <Cell key={i} fill={
                          entry.label === 'Real' ? '#1F6F54' :
                          entry.label === 'Fake' ? '#9C2B1F' : '#8A6E4B'
                        } />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {page === 'settings' && (
          <>
            <h2 className="content-title">Account Settings</h2>
            <p className="subtitle content-subtitle">Manage your name, username, and password.</p>

            <label className="field-label">Display Name</label>
            <input
              type="text"
              placeholder="Any name you like — emojis welcome ✨"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button className="check-btn" onClick={handleChangeName}>Update Name</button>
            {nameError && <p className="error">{nameError}</p>}
            {nameMessage && <p className="success-message">{nameMessage}</p>}

            <hr className="dropdown-divider" style={{ margin: '24px 0' }} />

            <label className="field-label">Username</label>
            <input
              type="text"
              placeholder="3-20 characters: letters, numbers, _ ."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            {settingsUsernameAvailability && (
              <p className={`username-status ${settingsUsernameAvailability}`}>
                {settingsUsernameAvailability === 'checking' && 'Checking availability...'}
                {settingsUsernameAvailability === 'available' && '✓ Username available'}
                {settingsUsernameAvailability === 'taken' && '✕ Username already taken'}
                {settingsUsernameAvailability === 'invalid' && '✕ 3-20 characters: letters, numbers, _ .'}
              </p>
            )}
            <p className="password-hint">Can be changed once every 14 days</p>
            <button className="check-btn" onClick={handleChangeUsername}>Update Username</button>
            {usernameError && <p className="error">{usernameError}</p>}
            {usernameMessage && <p className="success-message">{usernameMessage}</p>}

            <hr className="dropdown-divider" style={{ margin: '24px 0' }} />

            <label className="field-label">Current Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="field-label">New Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <ul className="password-checklist">
                {Object.entries({
                  length: 'At least 8 characters',
                  uppercase: 'One uppercase letter',
                  number: 'One number',
                  special: 'One special character (!@#$% etc.)',
                }).map(([key, label]) => (
                  <li key={key} className={getPasswordChecks(newPassword)[key] ? 'met' : ''}>
                    {getPasswordChecks(newPassword)[key] ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            )}

            <button className="check-btn" onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>

            {passwordError && <p className="error">{passwordError}</p>}
            {passwordMessage && <p className="success-message">{passwordMessage}</p>}
          </>
        )}
      </div>
      <footer className="app-footer">
        Built by Alphonce Musyoka (Alli Jnr) — Multimedia University of Kenya
      </footer>

      {confirmDialog && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p>{confirmDialog.message}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="confirm-ok" onClick={confirmDialog.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;