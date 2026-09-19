# نظام التحليلات التنفيذية للموارد البشرية — React Version

React + Vite ma poora convert kiya gaya hai (original single-file HTML se). Same design,
same 17 pages, same logic — bas ab proper component-based React app hai.

## Chalane ka tarika

```bash
npm install
npm run dev       # local dev server, usually http://localhost:5173
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

## Data (HR_DATA.json)

App abhi bhi same tarike se data leta hai jaise original HTML:

1. **Dev/production server pe**: `public/HR_DATA.json` daal do (usi jagah jahan `public/favicon.svg` hai) —
   app boot pe automatically `fetch('/HR_DATA.json')` karega.
2. **Ya manually import**: agar file nahi milti, loader screen dikhega jahan se JSON file
   browse karke import kar sakte ho (bilkul original jaisa — koi backend zaroori nahi).

Data shape bilkul original jaisa hi expect hota hai: `meta`, `monthly`, `payroll_records`,
`company_summary`, `branches`, `branches_monthly`, `employees`, `employee_history`,
`overlap_cases`, `resolved_cases`, `movement_ledger`, `branch_transfers`,
`quality_scores`, `quality_summary`, `quality_issues_sample`, `correction_log`,
`files_summary`.

## Project structure

```
src/
  context/          DataContext (HR_DATA + loader), ModalContext, FiltersContext
  components/        Sidebar, Topbar, Shell (layout), DataTable, Atoms (badges/KPI/score ring)
  components/charts/  Chart.js wrappers (Line/Bar/Doughnut/DualAxis) + theme setup
  utils/             format.js, icons.jsx, excelExport.js (SheetJS)
  pages/             17 pages — ek-ek original PAGES['...'] module se 1:1 port kiya gaya
  routesConfig.js    route -> title/meta/filters config (original NAV_SECTIONS + per-page meta)
  App.jsx            HashRouter + route table (#/dashboard, #/branches?company=... etc — same URLs)
  main.jsx           entry point
```

## Kya same rakha gaya

- Same CSS classes/design tokens (`src/styles/global.css` — ek dum original `<style>` block se copy)
- Same URL scheme: `#/branches?company=Swag` jaisa hi kaam karta hai (HashRouter)
- Same Excel export (SheetJS) — per-table aur poora multi-sheet workbook (Reports page)
- Same business logic: branch score formula, company score formula, insights generation,
  risk detection, review-center decisions (session-only, jaise original), upload pipeline simulation

## Kya badla (sirf implementation, behavior same)

- Vanilla JS DOM manipulation → React state/props/hooks
- innerHTML template strings → JSX
- Global `PAGES` object → React Router routes + per-page components
- `location.hash` router → `react-router-dom` HashRouter (same URL format)
