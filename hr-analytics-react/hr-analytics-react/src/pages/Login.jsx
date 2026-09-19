import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LangToggle from '../components/LangToggle.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t, isEn } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || (isEn ? 'Sign in failed' : 'فشل تسجيل الدخول'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loader-screen">
      <div className="loader-box" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, insetInlineEnd: 16 }}><LangToggle /></div>
        <div className="loader-mark">HR</div>
        <h1 style={{ margin: '0 0 8px', color: '#0E1B2E', fontSize: 22 }}>{t('loginTitle', 'نظام التحليلات التنفيذية')}</h1>
        <p style={{ margin: '0 0 20px', color: '#666B78' }}>{t('loginSubtitle', 'سجّل الدخول للمتابعة')}</p>
        <form onSubmit={handleSubmit} style={{ textAlign: isEn ? 'left' : 'right', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>{t('username', 'اسم المستخدم')}</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14 }}
            />
          </div>
          <div>
            <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>{t('password', 'كلمة المرور')}</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14 }}
            />
          </div>
          {error ? <p className="small" style={{ color: 'var(--critical)', margin: 0 }}>{error}</p> : null}
          <button type="submit" className="loader-import-btn" disabled={busy} style={{ border: 'none', width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
            {busy ? (isEn ? 'Signing in...' : 'جارٍ الدخول...') : t('signIn', 'تسجيل الدخول')}
          </button>
        </form>
      </div>
    </div>
  );
}
