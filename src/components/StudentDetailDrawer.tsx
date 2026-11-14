import { useEffect } from 'react';
import { X, Trash2, Info } from 'lucide-react';
import { StudentRecord } from '../types/student';
import { RiskLabel, RiskProgressBar } from './RiskIndicator';

interface StudentDetailDrawerProps {
  student: StudentRecord | null;
  onClose: () => void;
  onDelete?: (studentId: string) => void;
}

export function StudentDetailDrawer({
  student,
  onClose,
  onDelete,
}: StudentDetailDrawerProps) {
  useEffect(() => {
    if (!student) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [student, onClose]);

  if (!student) return null;

  const { prediction } = student;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-drawer-title"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-2xl flex-col bg-white border-l border-slate-200 shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-mono tabular-nums text-slate-500">
              {student.studentId} · {student.department} · {student.yearOfStudy}
            </p>
            <h2
              id="student-drawer-title"
              className="mt-1 text-xl font-bold text-slate-900 font-display"
            >
              {student.studentName}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(student.studentId);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors whitespace-nowrap"
                title="Remove student record"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Close student details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-8 px-6 py-6">
          {/* Risk Overview */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Dropout Risk Score</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-bold font-mono tabular-nums text-slate-900">
                    {prediction.riskScore}%
                  </span>
                  <RiskLabel category={prediction.riskCategory} />
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Analyzed on</p>
                <p className="font-mono tabular-nums text-slate-700">
                  {new Date(prediction.analyzedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <RiskProgressBar
              score={prediction.riskScore}
              category={prediction.riskCategory}
            />
          </section>

          <hr className="border-slate-200" />

          {/* Dimension Weights */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Weighted Risk Contribution Breakdown
            </h3>
            <div className="space-y-3">
              {prediction.contributions.map((item) => {
                const pct = Math.round((item.score / item.maxScore) * 100);
                return (
                  <div key={item.dimension} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{item.dimension}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {item.score} / {item.maxScore} pts
                      </span>
                    </div>
                    <div className="h-2 w-full rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{item.summary}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* Identified Factors & Recommendations */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Identified Risk Factors
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-4">
                {prediction.identifiedFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Recommended Interventions
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-4">
                {prediction.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </section>
          </div>

          <hr className="border-slate-200" />

          {/* Raw Profile Attributes */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Recorded Student Attributes
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Age / Gender</dt>
                <dd className="font-medium text-slate-900 tabular-nums">
                  {student.age} yrs · {student.gender}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Previous GPA</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.previousSemesterGpa.toFixed(2)} / 10.0
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Current GPA</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.currentSemesterGpa.toFixed(2)} / 10.0
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Active Backlogs</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.backlogs}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Attendance</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.attendancePercentage}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Absenteeism</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.daysAbsent}d ({student.consecutiveAbsences}d streak)
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Internal Marks</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.internalMarks}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Assignments</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.assignmentSubmission}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Exam Score</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {student.examPerformance}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Income Tier</dt>
                <dd className="font-medium text-slate-900">
                  {student.familyIncomeCategory}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Scholarship</dt>
                <dd className="font-medium text-slate-900">
                  {student.scholarshipStatus}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Resources / Clubs</dt>
                <dd className="font-medium text-slate-900">
                  {student.learningResourcesAccess} · {student.extracurricularParticipation}
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Score generated via the transparent{' '}
              <span className="font-medium text-slate-800">{prediction.modelEngine}</span>{' '}
              (rule-based weighted model, not a trained ML classifier). Ready for future ML API integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
