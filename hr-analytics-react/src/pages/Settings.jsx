import React, { useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { ScoreRing } from '../components/Atoms.jsx';

const WEIGHT_LABELS = { attendance: 'الحضور', turnover: 'الدوران الوظيفي', payroll_efficiency: 'كفاءة الرواتب', workforce_stability: 'استقرار القوى العاملة', overtime: 'العمل الإضافي', data_quality: 'جودة البيانات' };
const SAMPLE = { attendance: 75, turnover: 80, payroll_efficiency: 70, workforce_stability: 85, overtime: 60, data_quality: 90 };
const TABS = [
  { id: 'weights', label: 'أوزان التقييم' },
  { id: 'alerts', label: 'حدود التنبيهات' },
  { id: 'names', label: 'أسماء الشركات والفروع' },
  { id: 'turnover', label: 'تعريف الدوران' },
  { id: 'display', label: 'إعدادات العرض' },
];

export default function Settings() {
  const { data: HR_DATA, companyLabel } = useHrData();
  const [tab, setTab] = useState('weights');
  const [weights, setWeights] = useState({ attendance: 20, turnover: 20, payroll_efficiency: 20, workforce_stability: 20, overtime: 10, data_quality: 10 });
  const [alertPayrollGap, setAlertPayrollGap] = useState(15);
  const [alertQuality, setAlertQuality] = useState(70);
  const [alertBranchScore, setAlertBranchScore] = useState(60);
  const [alertTurnover, setAlertTurnover] = useState(20);
  const [turnDef, setTurnDef] = useState('full');
  const [excludeTransfers, setExcludeTransfers] = useState(true);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let previewScore = 0;
  Object.keys(weights).forEach((k) => { previewScore += (SAMPLE[k] * weights[k]) / 100; });
  previewScore = total ? Math.round((previewScore * 100) / total) : 0;

  return (
    <>
      <div className="pill-tabs mb-24">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'weights' ? (
        <div className="grid-2">
          <div className="card">
            <div className="section-head"><h2>أوزان تقييم الفرع</h2><span className="hint" style={{ color: total === 100 ? 'var(--success)' : 'var(--critical)' }}>المجموع: {total}%</span></div>
            <div>
              {Object.keys(weights).map((k) => (
                <div className="weight-row" key={k}>
                  <label>{WEIGHT_LABELS[k]}</label>
                  <input type="range" min="0" max="60" value={weights[k]} onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))} />
                  <span>{weights[k]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="section-head"><h2>معاينة حية</h2></div>
            <p className="small text-muted mb-16">مثال: فرع بدرجات فرعية افتراضية (75 حضور، 80 دوران، 70 كفاءة رواتب، 85 استقرار، 60 عمل إضافي، 90 جودة بيانات)</p>
            <div className="flex items-center gap-16">
              <ScoreRing score={previewScore} size={84} />
              <div>
                <div className="small text-muted">الدرجة المركّبة الناتجة</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>{previewScore} / 100</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'alerts' ? (
        <div className="card">
          <div className="section-head"><h2>حدود التنبيهات</h2></div>
          <div className="weight-row"><label>فجوة نمو الرواتب مقابل الموظفين</label><input type="range" min="5" max="50" value={alertPayrollGap} onChange={(e) => setAlertPayrollGap(Number(e.target.value))} /><span>{alertPayrollGap}%</span></div>
          <div className="weight-row"><label>الحد الأدنى لدرجة جودة البيانات</label><input type="range" min="40" max="95" value={alertQuality} onChange={(e) => setAlertQuality(Number(e.target.value))} /><span>{alertQuality}</span></div>
          <div className="weight-row"><label>الحد الأدنى لتقييم الفرع</label><input type="range" min="40" max="95" value={alertBranchScore} onChange={(e) => setAlertBranchScore(Number(e.target.value))} /><span>{alertBranchScore}</span></div>
          <div className="weight-row"><label>معدل دوران مرتفع (تنبيه)</label><input type="range" min="5" max="60" value={alertTurnover} onChange={(e) => setAlertTurnover(Number(e.target.value))} /><span>{alertTurnover}%</span></div>
        </div>
      ) : null}

      {tab === 'names' ? (
        <div className="card">
          <div className="section-head"><h2>أسماء الشركات (كما تظهر في الملفات الفعلية)</h2></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>الاسم الداخلي</th><th>الاسم المعروض</th></tr></thead>
              <tbody>
                {HR_DATA.meta.companies.map((c) => (
                  <tr key={c}>
                    <td className="mono">{c}</td>
                    <td><input type="text" defaultValue={companyLabel(c)} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', width: 220 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small text-muted mt-12">ملاحظة: تم تثبيت اسم "سواج جولد" كما هو مذكور فعليًا في ملفات الرواتب، ولم يُستبدل بـ"لاروش جولد" إلا بعد تأكيد رسمي.</p>
        </div>
      ) : null}

      {tab === 'turnover' ? (
        <div className="card">
          <div className="section-head"><h2>تعريف معدل الدوران الوظيفي</h2></div>
          <div className="flex gap-16 mb-16">
            <label className="flex items-center gap-8"><input type="radio" name="turndef" checked={turnDef === 'full'} onChange={() => setTurnDef('full')} /> يشمل: استقالة + إنهاء خدمة + عدم تجديد عقد التجربة</label>
          </div>
          <div className="flex gap-16 mb-16">
            <label className="flex items-center gap-8"><input type="radio" name="turndef" checked={turnDef === 'partial'} onChange={() => setTurnDef('partial')} /> يشمل: استقالة + إنهاء خدمة فقط (باستثناء عدم تجديد عقد التجربة)</label>
          </div>
          <label className="flex items-center gap-8"><input type="checkbox" checked={excludeTransfers} onChange={(e) => setExcludeTransfers(e.target.checked)} /> استثناء النقل بين شركات المجموعة من احتساب "الخروج"</label>
        </div>
      ) : null}

      {tab === 'display' ? (
        <div className="card">
          <div className="weight-row"><label>العملة المعروضة</label><select><option>ريال سعودي (﷼)</option></select><span></span></div>
          <div className="weight-row"><label>تنسيق التاريخ</label><select><option>يوم/شهر/سنة</option><option>سنة-شهر-يوم</option></select><span></span></div>
          <div className="weight-row"><label>عدد الصفوف بكل صفحة جدول</label><select defaultValue="50"><option>25</option><option value="50">50</option><option>100</option></select><span></span></div>
        </div>
      ) : null}
    </>
  );
}
