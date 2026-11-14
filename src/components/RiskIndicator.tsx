import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RiskCategory } from '../types/student';

interface RiskLabelProps {
  category: RiskCategory;
  score?: number;
  showScore?: boolean;
}

export function RiskLabel({ category, score, showScore = false }: RiskLabelProps) {
  if (category === 'Low Risk') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Low Risk</span>
        {showScore && typeof score === 'number' && (
          <span className="font-mono tabular-nums text-emerald-600">({score}%)</span>
        )}
      </span>
    );
  }

  if (category === 'Medium Risk') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 whitespace-nowrap">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
        <span>Medium Risk</span>
        {showScore && typeof score === 'number' && (
          <span className="font-mono tabular-nums text-amber-600">({score}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 whitespace-nowrap">
      <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
      <span>High Risk</span>
      {showScore && typeof score === 'number' && (
        <span className="font-mono tabular-nums text-red-600">({score}%)</span>
      )}
    </span>
  );
}

interface RiskProgressBarProps {
  score: number;
  category: RiskCategory;
}

export function RiskProgressBar({ score, category }: RiskProgressBarProps) {
  const barColor =
    category === 'Low Risk'
      ? 'bg-emerald-600'
      : category === 'Medium Risk'
        ? 'bg-amber-500'
        : 'bg-red-600';

  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full overflow-hidden rounded-md bg-slate-100 border border-slate-200">
        {/* Threshold reference lines at 35% and 65% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300 z-10"
          style={{ left: '35%' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300 z-10"
          style={{ left: '65%' }}
          aria-hidden="true"
        />
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Dropout risk score ${score}%`}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
        <span>0% Low</span>
        <span>35% Threshold</span>
        <span>65% High</span>
        <span>100%</span>
      </div>
    </div>
  );
}
