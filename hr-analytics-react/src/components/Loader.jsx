import React from 'react';
import { useHrData } from '../context/DataContext.jsx';

export default function Loader() {
  const { error, importFile } = useHrData();

  return (
    <div className="loader-screen">
      <div className="loader-box">
        <div className="loader-mark">HR</div>
        <h1 style={{ margin: '0 0 8px', color: '#0E1B2E', fontSize: 22 }}>نظام التحليلات التنفيذية</h1>
        <p style={{ margin: '0 0 20px', color: '#666B78' }}>اختر ملف HR_DATA.json لعرض كل التقارير والبيانات</p>
        <label className="loader-import-btn">
          استيراد ملف JSON
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => importFile(e.target.files && e.target.files[0])}
          />
        </label>
        <p style={{ margin: '16px 0 0', color: '#9096A2', fontSize: 12 }}>
          ضع ملف JSON بجانب المشروع عند فتحه محليًا، ثم استورده من هنا.
        </p>
        {error ? <p style={{ margin: '12px 0 0', color: '#AF2E2E', fontSize: 12 }}>{error}</p> : null}
      </div>
    </div>
  );
}
