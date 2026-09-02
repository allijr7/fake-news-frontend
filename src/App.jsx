import { useState, useEffect } from 'react';
import './App.css';
import { User, Lock, ShieldCheck, History as HistoryIcon, Sparkles, FileText, Link2, Search, LogOut, Eye, EyeOff } from 'lucide-react';


const API_BASE = import.meta.env.DEV
  ? 'http://127.0.0.1:5000'
  : 'https://fake-news-detector-api-oa3e.onrender.com';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');
  const [page, setPage] = useState('checker'); // 'checker' | 'history'

  // --- Auth form state ---
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
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
  const [error, setError] = useState('');

  // --- History state ---
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminChecks, setAdminChecks] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('users');

  // --- Menu state ---
  const [menuOpen, setMenuOpen] = useState(false);

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
      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Something went wrong');
      } else if (authMode === 'login' && loginRole === 'admin' && data.role !== 'admin') {
        setAuthError('This account does not have admin access.');
      } else {
        setToken(data.token);
        setUsername(data.username);
        setRole(data.role);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
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
    setRole('user');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
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

      const data = await response.json();

      if (response.status === 401 || response.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
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
  
  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const [usersRes, checksRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/checks`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (usersRes.status === 401 || usersRes.status === 422) {
        handleLogout();
        setAuthError('Your session expired — please log in again.');
        return;
      }
      const usersData = await usersRes.json();
      const checksData = await checksRes.json();
      if (usersRes.ok) setAdminUsers(usersData);
      if (checksRes.ok) setAdminChecks(checksData);
    } catch (err) {
      // silent fail acceptable
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their history? This cannot be undone.')) return;
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
          <p className="kicker">Editorial Verification Desk</p>
          <h1>Fake News Detector</h1>
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
        <p className="kicker">Editorial Verification Desk</p>
        <h1>Fake News Detector</h1>
      </div>
      <hr className="rule" />

      <div className="nav-bar">
        <div className="profile-menu-wrapper">
          <button className="profile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="avatar-circle"><User size={16} /></span>
            <span className="profile-name">{username}</span>
          </button>

          {menuOpen && (
            <>
              <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
              <div className="profile-dropdown">
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
            </div>

            {inputType === 'text' ? (
              <textarea
                placeholder="Paste article text here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={8}
              />
            ) : (
              <input
                type="text"
                placeholder="Paste article URL here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            )}

            <button className="check-btn" onClick={handleCheck} disabled={loading}>
              {loading ? 'Checking...' : <><Search size={15} /> Check the record</>}
            </button>

            {error && <p className="error">{error}</p>}

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
          </>
        )}

        {page === 'history' && (
          <>
            <h2 className="content-title">Your Record</h2>
            <p className="subtitle content-subtitle">Every article you've checked, most recent first.</p>

            <div className="history">
              {historyLoading && <div className="spinner"/>}

              {!historyLoading && history.length === 0 && (
                <p className="subtitle">No checks yet — head to the Checker tab to verify your first article.</p>
              )}

              {!historyLoading && history.map((item) => (
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
            </div>

            {adminLoading && <div className="spinner" />}

            {!adminLoading && adminTab === 'users' && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Checks</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                        <td>{u.check_count}</td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>Remove</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!adminLoading && adminTab === 'checks' && (
              <div className="admin-table-wrapper">
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
                    {adminChecks.map((c) => (
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
            )}
          </>
        )}
      </div>
      <footer className="app-footer">
        Built by Alphonce Musyoka (Alli Jnr) — Multimedia University of Kenya
      </footer>
    </div>
  );
}

export default App;