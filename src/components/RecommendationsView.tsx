import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';
import { RiskCategory, StudentRecord } from '../types/student';
import { RiskLabel } from './RiskIndicator';

interface RecommendationsViewProps {
  records: StudentRecord[];
  onSelectStudent: (student: StudentRecord) => void;
}

interface TierPlaybook {
  category: RiskCategory;
  scoreRange: string;
  cadence: string;
  objective: string;
  strategies: string[];
  facultyChecklist: string[];
}

const PLAYBOOKS: TierPlaybook[] = [
  {
    category: 'High Risk',
    scoreRange: '66% – 100%',
    cadence: 'Immediate action within 5 business days · Weekly follow-ups',
    objective:
      'Prevent imminent academic withdrawal by addressing attendance collapse, multi-subject backlogs, and personal or financial barriers.',
    strategies: [
      'Arrange immediate 1-on-1 academic and personal counselling with a trained campus advisor.',
      'Identify financial, commuting, health, or family difficulties and connect with student welfare / scholarship aid.',
      'Provide special academic assistance including remedial bridge classes and structured backlog-clearance schedules.',
      'Create a formal Individual Student Improvement Plan (ISIP) co-signed by the student, mentor, and department head.',
    ],
    facultyChecklist: [
      'Schedule parent/guardian outreach call if consecutive absences exceed 5 days',
      'Assign intensive peer tutor for backlog subjects',
      'Provide campus laptop / library study-lab access if digital resources are limited',
    ],
  },
  {
    category: 'Medium Risk',
    scoreRange: '36% – 65%',
    cadence: 'Bi-weekly review · Mid-semester checkpoint',
    objective:
      'Stabilize early warning signals such as declining GPA, occasional backlogs, or attendance drifting below the 75% threshold.',
    strategies: [
      'Provide additional academic support through doubt-clearing workshops and lab prep sessions.',
      'Monitor attendance and internal assessment marks closely before mid-term evaluations.',
      'Assign a dedicated faculty mentor for bi-weekly 15-minute progress check-ins.',
      'Set incremental assignment submission milestones to prevent late-semester workload spikes.',
    ],
    facultyChecklist: [
      'Flag attendance drops below 75% in weekly advisor digest',
      'Review internal test scores and recommend targeted study groups',
      'Check scholarship renewal eligibility and financial aid requirements',
    ],
  },
  {
    category: 'Low Risk',
    scoreRange: '0% – 35%',
    cadence: 'Once per semester · End-of-term review',
    objective:
      'Sustain strong academic momentum, deepen campus engagement, and channel top performers into peer mentoring and leadership.',
    strategies: [
      'Continue regular academic monitoring through standard end-of-semester GPA and attendance audits.',
      'Encourage active participation in technical clubs, hackathons, research projects, and extracurricular activities.',
      'Invite high-performing students to serve as peer study mentors for 1st-year or medium-risk cohorts.',
      'Provide career guidance, internship readiness workshops, and honors project opportunities.',
    ],
    facultyChecklist: [
      'Recognize consistent 85%+ attendance and academic progression',
      'Recommend competitive fellowships, internships, or research assistantships',
      'Conduct light semester-start goal setting session',
    ],
  },
];

export function RecommendationsView({
  records,
  onSelectStudent,
}: RecommendationsViewProps) {
  const [activeTier, setActiveTier] = useState<'All' | RiskCategory>('All');

  const groupedStudents = useMemo(() => {
    return {
      'High Risk': records
        .filter((r) => r.prediction.riskCategory === 'High Risk')
        .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore),
      'Medium Risk': records
        .filter((r) => r.prediction.riskCategory === 'Medium Risk')
        .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore),
      'Low Risk': records
        .filter((r) => r.prediction.riskCategory === 'Low Risk')
        .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore),
    };
  }, [records]);

  const visiblePlaybooks =
    activeTier === 'All'
      ? PLAYBOOKS
      : PLAYBOOKS.filter((p) => p.category === activeTier);

  const tierIcon = (category: RiskCategory) => {
    if (category === 'Low Risk') {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
    }
    if (category === 'Medium Risk') {
      return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />;
    }
    return <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden="true" />;
  };

  return (
    <div className="space-y-6">
      {/* Tier Filter Bar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900">
            Risk-Tiered Intervention Playbooks
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
          role="group"
          aria-label="Filter intervention playbooks by risk tier"
        >
          {(['All', 'High Risk', 'Medium Risk', 'Low Risk'] as const).map((tier) => {
            const active = activeTier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setActiveTier(tier)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier === 'All' ? 'All Risk Tiers' : tier}
              </button>
            );
          })}
        </div>
      </section>

      {/* Playbook Sections */}
      <div className="space-y-6">
        {visiblePlaybooks.map((playbook) => {
          const matchingStudents = groupedStudents[playbook.category];
          return (
            <section
              key={playbook.category}
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
            >
              {/* Tier Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{tierIcon(playbook.category)}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 font-display">
                        {playbook.category} Intervention Plan
                      </h2>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        · Score {playbook.scoreRange}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{playbook.cadence}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Students in Tier</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {matchingStudents.length}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                {playbook.objective}
              </p>

              {/* Strategies & Checklist Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Core Institutional Actions
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-700 list-disc pl-5">
                    {playbook.strategies.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-5 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-8">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Advisor & Faculty Checklist
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-600 list-disc pl-5">
                    {playbook.facultyChecklist.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Live Matching Students Roster */}
              <div className="border-t border-slate-200 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    Students Currently in {playbook.category} ({matchingStudents.length})
                  </h3>
                </div>

                {matchingStudents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {matchingStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => onSelectStudent(student)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:bg-blue-50/60 hover:border-blue-200 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {student.studentName}
                          </p>
                          <p className="text-xs text-slate-500 font-mono tabular-nums truncate">
                            {student.studentId} · {student.attendancePercentage}% att
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RiskLabel
                            category={student.prediction.riskCategory}
                            score={student.prediction.riskScore}
                            showScore
                          />
                          <ArrowRight
                            className="h-3.5 w-3.5 text-slate-400"
                            aria-hidden="true"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No students currently categorized as {playbook.category}.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
