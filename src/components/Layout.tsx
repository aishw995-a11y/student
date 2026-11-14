import { ReactNode, useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  Download,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import { AppView } from '../types/student';

interface LayoutProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onExportCsv: () => void;
  onResetDemo: () => void;
  totalStudents: number;
  highRiskCount: number;
  children: ReactNode;
}

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predict', label: 'Predict Risk', icon: GraduationCap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'records', label: 'Student Records', icon: Users },
  { id: 'recommendations', label: 'Recommendations', icon: BookOpenCheck },
];

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Institutional Overview',
    subtitle: 'Cohort dropout risk distribution, attendance health, and recent evaluations',
  },
  predict: {
    title: 'Student Dropout Risk Prediction',
    subtitle: 'Enter student academic, attendance, and support attributes to compute risk score',
  },
  analytics: {
    title: 'Cohort & Trend Analytics',
    subtitle: 'Interactive cross-department comparisons, attendance correlations, and semester trends',
  },
  records: {
    title: 'Student Records Directory',
    subtitle: 'Search, filter, sort, and inspect stored student evaluations',
  },
  recommendations: {
    title: 'Intervention Recommendations',
    subtitle: 'Risk-tiered academic advising playbooks and priority student action lists',
  },
};

export function Layout({
  activeView,
  onNavigate,
  onExportCsv,
  onResetDemo,
  totalStudents,
  highRiskCount,
  children,
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentMeta = VIEW_TITLES[activeView];

  const handleSelectNav = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-slate-900 font-display truncate">
              EduGuard Analytics
            </p>
            <p className="text-xs text-slate-500 truncate">Dropout Risk Platform</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'records' && (
                  <span className="font-mono tabular-nums text-xs text-slate-500">
                    {totalStudents}
                  </span>
                )}
                {item.id === 'recommendations' && highRiskCount > 0 && (
                  <span className="font-mono tabular-nums text-xs font-semibold text-red-600">
                    {highRiskCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800">Scoring Engine</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Weighted Risk Model (0–100). Local browser storage active.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemo}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>Restore Demo Data</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="relative flex w-72 max-w-[85vw] flex-col bg-white h-full border-r border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-slate-900 font-display">
                  EduGuard Analytics
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'records' && (
                      <span className="font-mono tabular-nums text-xs text-slate-500">
                        {totalStudents}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  setMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restore Demo Data</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">
                Student Dropout Prediction and Analytics System
              </p>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 font-display truncate">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onExportCsv}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            {activeView !== 'predict' && (
              <button
                type="button"
                onClick={() => onNavigate('predict')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Predict Student</span>
              </button>
            )}
          </div>
        </header>

        {/* Subheader Context Strip */}
        <div className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-xs sm:text-sm text-slate-600">{currentMeta.subtitle}</p>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
