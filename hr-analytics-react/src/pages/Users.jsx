import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { Icon } from '../utils/icons.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputStyle = { width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: '7px 10px', fontFamily: 'inherit', fontSize: 13 };
const ROLE_LABEL = { admin: 'مشرف', viewer: 'مستعرض' };

function UserForm({ initial, onSubmit, onCancel, busy, isEdit }) {
  const [form, setForm] = useState(
    initial || { username: '', password: '', full_name: '', role: 'viewer' }
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!isEdit ? (
        <div>
          <label className="small text-muted">اسم المستخدم</label>
          <input required value={form.username} onChange={set('username')} style={inputStyle} autoComplete="off" />
        </div>
      ) : (
        <div>
          <label className="small text-muted">اسم المستخدم</label>
          <input value={form.username} disabled style={{ ...inputStyle, background: 'var(--paper)', color: 'var(--text-muted)' }} />
        </div>
      )}
      <div>
        <label className="small text-muted">الاسم الكامل</label>
        <input value={form.full_name || ''} onChange={set('full_name')} style={inputStyle} />
      </div>
      <div>
        <label className="small text-muted">الصلاحية</label>
        <select value={form.role} onChange={set('role')} style={inputStyle}>
          <option value="viewer">مستعرض — عرض البيانات فقط</option>
          <option value="admin">مشرف — كل الصلاحيات بما فيها إدارة المستخدمين</option>
        </select>
      </div>
      <div>
        <label className="small text-muted">{isEdit ? 'كلمة مرور جديدة (اتركها خالية لعدم التغيير)' : 'كلمة المرور'}</label>
        <input
          type="text"
          required={!isEdit}
          value={form.password || ''}
          onChange={set('password')}
          style={inputStyle}
          autoComplete="off"
          placeholder={isEdit ? '••••••••' : ''}
        />
      </div>
      <div className="flex gap-8">
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'جارٍ الحفظ...' : 'حفظ'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  );
}

export default function Users() {
  const { apiJson } = useApi();
  const { user: me } = useAuth();
  const { openModal, closeModal } = useModal();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    apiJson('/api/users').then(setRows).catch((err) => setError(err.message || 'تعذر تحميل المستخدمين'));
  }, [apiJson]);

  useEffect(() => { load(); }, [load]);

  async function createUser(form) {
    setBusy(true);
    try {
      await apiJson('/api/users', { method: 'POST', body: JSON.stringify(form) });
      load();
      closeModal();
    } catch (err) {
      alert(err.message || 'تعذر إضافة المستخدم');
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(id, form) {
    setBusy(true);
    try {
      const payload = { full_name: form.full_name, role: form.role };
      if (form.password) payload.password = form.password;
      await apiJson(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      load();
      closeModal();
    } catch (err) {
      alert(err.message || 'تعذر تحديث المستخدم');
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${u.username}"؟`)) return;
    setBusy(true);
    try {
      await apiJson(`/api/users/${u.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message || 'تعذر حذف المستخدم');
    } finally {
      setBusy(false);
    }
  }

  function openCreateModal() {
    openModal(
      <>
        <ModalHead title="إضافة مستخدم جديد" onClose={closeModal} />
        <div className="modal-body">
          <UserForm onSubmit={createUser} onCancel={closeModal} busy={busy} />
        </div>
      </>
    );
  }

  function openEditModal(u) {
    openModal(
      <>
        <ModalHead title={`تعديل: ${u.username}`} onClose={closeModal} />
        <div className="modal-body">
          <UserForm
            initial={{ username: u.username, full_name: u.full_name || '', role: u.role, password: '' }}
            isEdit
            onSubmit={(form) => updateUser(u.id, form)}
            onCancel={closeModal}
            busy={busy}
          />
        </div>
      </>
    );
  }

  if (error) return <div className="card" style={{ color: 'var(--critical)' }}>{error}</div>;
  if (rows === null) return null;

  const cols = [
    { key: 'username', label: 'اسم المستخدم' },
    { key: 'full_name', label: 'الاسم الكامل' },
    { key: 'role', label: 'الصلاحية', render: (r) => <Badge tone={r.role === 'admin' ? 'high' : 'neutral'}>{ROLE_LABEL[r.role] || r.role}</Badge> },
    { key: 'created_at', label: 'تاريخ الإنشاء', render: (r) => new Date(r.created_at).toLocaleDateString('ar-SA') },
    {
      key: 'actions', label: '', render: (r) => (
        <div className="flex gap-8" onClick={(e) => e.stopPropagation()}>
          <button className="btn sm" onClick={() => openEditModal(r)}><Icon name="settings" size={13} /> تعديل</button>
          {r.id !== me?.id ? (
            <button className="btn danger sm" onClick={() => deleteUser(r)}>حذف</button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="card mb-16">
      <div className="table-toolbar">
        <div className="small text-muted">{rows.length} مستخدم</div>
        <button className="btn primary sm" onClick={openCreateModal}><Icon name="grid" size={13} /> إضافة مستخدم</button>
      </div>
      <DataTable
        columns={cols}
        rows={rows}
        opts={{ searchPlaceholder: 'ابحث بالاسم...', searchFields: ['username', 'full_name'], exportFilename: 'المستخدمون', exportSheetName: 'المستخدمون' }}
      />
    </div>
  );
}
