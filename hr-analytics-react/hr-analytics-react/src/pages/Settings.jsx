import React, { useEffect, useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { ScoreRing } from '../components/Atoms.jsx';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const WEIGHT_LABELS = { attendance: 'الحضور', turnover: 'الدوران الوظيفي', payroll_efficiency: 'كفاءة الرواتب', workforce_stability: 'استقرار القوى العاملة', overtime: 'العمل الإضافي', data_quality: 'جودة البيانات' };
const SAMPLE = { attendance: 75, turnover: 80, payroll_efficiency: 70, workforce_stability: 85, overtime: 60, data_quality: 90 };
const TABS = [
  { id: 'weights', label: 'أوزان التقييم' },
  { id: 'alerts', label: 'حدود التنبيهات' },
  { id: 'names', label: 'أسماء الشركات والفروع' },
  { id: 'turnover', label: 'تعريف الدوران' },
  { id: 'display', label: 'إعدادات العرض' },
];

const DEFAULTS = {
  weights: { attendance: 20, turnover: 20, payroll_efficiency: 20, workforce_stability: 20, overtime: 10, data_quality: 10 },
  alerts: { payrollGap: 15, quality: 70, branchScore: 60, turnover: 20 },
  turnoverDef: 'full',
  excludeTransfers: true,
  display: { currency: 'SAR', dateFormat: 'dmy', rowsPerPage: 50 },
  companyNameOverrides: {},
};

export default function Settings() {
  const { data: HR_DATA, companyLabel } = useHrData();
  const { apiJson } = useApi();
  const { tt } = useLanguage();
  const [tab, setTab] = useState('weights');
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    apiJson('/api/settings').then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, [apiJson]);

  async function save(next) {
    setSettings(next);
    setSaveMsg('');
    try {
      await apiJson('/api/settings', { method: 'PUT', body: JSON.stringify({ value: next }) });
      setSaveMsg(tt('تم الحفظ'));
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err.message || tt('تعذر الحفظ'));
    }
  }

  const weights = settings.weights;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let previewScore = 0;
  Object.keys(weights).forEach((k) => { previewScore += (SAMPLE[k] * weights[k]) / 100; });
  previewScore = total ? Math.round((previewScore * 100) / total) : 0;

  if (loading) return null;

  return (
    <>
      <div className="flex justify-between items-center mb-24">
        <div className="pill-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{tt(t.label)}</button>
          ))}
        </div>
        {saveMsg ? <span className="small text-muted">{saveMsg}</span> : null}
      </div>

      {tab === 'weights' ? (
        <div className="grid-2">
          <div className="card">
            <div className="section-head"><h2>{tt('أوزان تقييم الفرع')}</h2><span className="hint" style={{ color: total === 100 ? 'var(--success)' : 'var(--critical)' }}>{tt('المجموع:')} {total}%</span></div>
            <div>
              {Object.keys(weights).map((k) => (
                <div className="weight-row" key={k}>
                  <label>{tt(WEIGHT_LABELS[k])}</label>
                  <input type="range" min="0" max="60" value={weights[k]} onChange={(e) => save({ ...settings, weights: { ...weights, [k]: Number(e.target.value) } })} />
                  <span>{weights[k]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="section-head"><h2>{tt('معاينة حية')}</h2></div>
            <p className="small text-muted mb-16">{tt('مثال: فرع بدرجات فرعية افتراضية (75 حضور، 80 دوران، 70 كفاءة رواتب، 85 استقرار، 60 عمل إضافي، 90 جودة بيانات)')}</p>
            <div className="flex items-center gap-16">
              <ScoreRing score={previewScore} size={84} />
              <div>
                <div className="small text-muted">{tt('الدرجة المركّبة الناتجة')}</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>{previewScore} / 100</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'alerts' ? (
        <div className="card">
          <div className="section-head"><h2>{tt('حدود التنبيهات')}</h2></div>
          <div className="weight-row"><label>{tt('فجوة نمو الرواتب مقابل الموظفين')}</label><input type="range" min="5" max="50" value={settings.alerts.payrollGap} onChange={(e) => save({ ...settings, alerts: { ...settings.alerts, payrollGap: Number(e.target.value) } })} /><span>{settings.alerts.payrollGap}%</span></div>
          <div className="weight-row"><label>{tt('الحد الأدنى لدرجة جودة البيانات')}</label><input type="range" min="40" max="95" value={settings.alerts.quality} onChange={(e) => save({ ...settings, alerts: { ...settings.alerts, quality: Number(e.target.value) } })} /><span>{settings.alerts.quality}</span></div>
          <div className="weight-row"><label>{tt('الحد الأدنى لتقييم الفرع')}</label><input type="range" min="40" max="95" value={settings.alerts.branchScore} onChange={(e) => save({ ...settings, alerts: { ...settings.alerts, branchScore: Number(e.target.value) } })} /><span>{settings.alerts.branchScore}</span></div>
          <div className="weight-row"><label>{tt('معدل دوران مرتفع (تنبيه)')}</label><input type="range" min="5" max="60" value={settings.alerts.turnover} onChange={(e) => save({ ...settings, alerts: { ...settings.alerts, turnover: Number(e.target.value) } })} /><span>{settings.alerts.turnover}%</span></div>
        </div>
      ) : null}

      {tab === 'names' ? (
        <div className="card">
          <div className="section-head"><h2>{tt('أسماء الشركات (كما تظهر في الملفات الفعلية)')}</h2></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{tt('الاسم الداخلي')}</th><th>{tt('الاسم المعروض')}</th></tr></thead>
              <tbody>
                {HR_DATA.meta.companies.map((c) => (
                  <tr key={c}>
                    <td className="mono">{c}</td>
                    <td>
                      <input
                        type="text"
                        defaultValue={settings.companyNameOverrides[c] || companyLabel(c)}
                        onBlur={(e) => save({ ...settings, companyNameOverrides: { ...settings.companyNameOverrides, [c]: e.target.value } })}
                        style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', width: 220 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small text-muted mt-12">{tt('ملاحظة: تم تثبيت اسم "سواج جولد" كما هو مذكور فعليًا في ملفات الرواتب، ولم يُستبدل بـ"لاروش جولد" إلا بعد تأكيد رسمي.')}</p>
        </div>
      ) : null}

      {tab === 'turnover' ? (
        <div className="card">
          <div className="section-head"><h2>{tt('تعريف معدل الدوران الوظيفي')}</h2></div>
          <div className="flex gap-16 mb-16">
            <label className="flex items-center gap-8"><input type="radio" name="turndef" checked={settings.turnoverDef === 'full'} onChange={() => save({ ...settings, turnoverDef: 'full' })} /> {tt('يشمل: استقالة + إنهاء خدمة + عدم تجديد عقد التجربة')}</label>
          </div>
          <div className="flex gap-16 mb-16">
            <label className="flex items-center gap-8"><input type="radio" name="turndef" checked={settings.turnoverDef === 'partial'} onChange={() => save({ ...settings, turnoverDef: 'partial' })} /> {tt('يشمل: استقالة + إنهاء خدمة فقط (باستثناء عدم تجديد عقد التجربة)')}</label>
          </div>
          <label className="flex items-center gap-8"><input type="checkbox" checked={settings.excludeTransfers} onChange={(e) => save({ ...settings, excludeTransfers: e.target.checked })} /> {tt('استثناء النقل بين شركات المجموعة من احتساب "الخروج"')}</label>
        </div>
      ) : null}

      {tab === 'display' ? (
        <div className="card">
          <div className="weight-row"><label>{tt('العملة المعروضة')}</label><select value={settings.display.currency} onChange={(e) => save({ ...settings, display: { ...settings.display, currency: e.target.value } })}><option value="SAR">{tt('ريال سعودي (﷼)')}</option></select><span></span></div>
          <div className="weight-row"><label>{tt('تنسيق التاريخ')}</label><select value={settings.display.dateFormat} onChange={(e) => save({ ...settings, display: { ...settings.display, dateFormat: e.target.value } })}><option value="dmy">{tt('يوم/شهر/سنة')}</option><option value="ymd">{tt('سنة-شهر-يوم')}</option></select><span></span></div>
          <div className="weight-row"><label>{tt('عدد الصفوف بكل صفحة جدول')}</label><select value={settings.display.rowsPerPage} onChange={(e) => save({ ...settings, display: { ...settings.display, rowsPerPage: Number(e.target.value) } })}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select><span></span></div>
        </div>
      ) : null}
    </>
  );
}
