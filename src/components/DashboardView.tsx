import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Percent,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppView, Department, StudentRecord } from '../types/student';
import { RiskLabel } from './RiskIndicator';

interface DashboardViewProps {
  records: StudentRecord[];
  onNavigate: (view: AppView) => void;
  onSelectStudent: (student: StudentRecord) => void;
}

const RISK_COLORS = {
  'Low Risk': '#16A34A',
  'Medium Risk': '#D97706',
  'High Risk': '#DC2626',
} as const;

const SHORT_DEPT: Record<Department, string> = {
  'Computer Science': 'CSE',
  'Electrical Engineering': 'EEE',
  'Mechanical Engineering': 'MECH',
  'Civil Engineering': 'CIVIL',
  'Business Administration': 'BBA',
  Biotechnology: 'BIOTECH',
};

export function DashboardView({
  records,
  onNavigate,
  onSelectStudent,
}: DashboardViewProps) {
  const stats = useMemo(() => {
    const total = records.length;
    const low = records.filter((r) => r.prediction.riskCategory === 'Low Risk').length;
    const medium = records.filter((r) => r.prediction.riskCategory === 'Medium Risk').length;
    const high = records.filter((r) => r.prediction.riskCategory === 'High Risk').length;
    const overallRisk =
      total > 0
        ? Math.round(
            records.reduce((acc, r) => acc + r.prediction.riskScore, 0) / total
          )
        : 0;

    return { total, low, medium, high, overallRisk };
  }, [records]);

  const distributionData = useMemo(
    () => [
      { name: 'Low Risk', value: stats.low, color: RISK_COLORS['Low Risk'] },
      { name: 'Medium Risk', value: stats.medium, color: RISK_COLORS['Medium Risk'] },
      { name: 'High Risk', value: stats.high, color: RISK_COLORS['High Risk'] },
    ],
    [stats]
  );

  const attendanceAnalytics = useMemo(() => {
    const buckets = [
      { label: '< 60%', min: 0, max: 59.99 },
      { label: '60–74%', min: 60, max: 74.99 },
      { label: '75–84%', min: 75, max: 84.99 },
      { label: '85%+', min: 85, max: 100 },
    ];
    return buckets.map((b) => {
      const subset = records.filter(
        (r) => r.attendancePercentage >= b.min && r.attendancePercentage <= b.max
      );
      const avgRisk =
        subset.length > 0
          ? Math.round(
              subset.reduce((acc, r) => acc + r.prediction.riskScore, 0) /
                subset.length
            )
          : 0;
      return {
        bracket: b.label,
        students: subset.length,
        avgRisk,
      };
    });
  }, [records]);

  const academicPerformanceData = useMemo(() => {
    const tiers = [
      { label: '< 5.5 GPA', min: 0, max: 5.49 },
      { label: '5.5–6.9 GPA', min: 5.5, max: 6.99 },
      { label: '7.0–8.4 GPA', min: 7.0, max: 8.49 },
      { label: '8.5+ GPA', min: 8.5, max: 10 },
    ];
    return tiers.map((t) => {
      const subset = records.filter(
        (r) => r.currentSemesterGpa >= t.min && r.currentSemesterGpa <= t.max
      );
      const avgRisk =
        subset.length > 0
          ? Math.round(
              subset.reduce((acc, r) => acc + r.prediction.riskScore, 0) /
                subset.length
            )
          : 0;
      const avgMarks =
        subset.length > 0
          ? Math.round(
              subset.reduce((acc, r) => acc + r.examPerformance, 0) / subset.length
            )
          : 0;
      return {
        tier: t.label,
        avgRisk,
        avgMarks,
        students: subset.length,
      };
    });
  }, [records]);

  const departmentAnalysis = useMemo(() => {
    const depts = Object.keys(SHORT_DEPT) as Department[];
    return depts.map((dept) => {
      const subset = records.filter((r) => r.department === dept);
      const avgRisk =
        subset.length > 0
          ? Math.round(
              subset.reduce((acc, r) => acc + r.prediction.riskScore, 0) /
                subset.length
            )
          : 0;
      const highRisk = subset.filter(
        (r) => r.prediction.riskCategory === 'High Risk'
      ).length;
      return {
        department: SHORT_DEPT[dept],
        fullName: dept,
        avgRisk,
        highRiskCount: highRisk,
        total: subset.length,
      };
    });
  }, [records]);

  const recentHistory = useMemo(
    () =>
      [...records]
        .sort(
          (a, b) =>
            new Date(b.prediction.analyzedAt).getTime() -
            new Date(a.prediction.analyzedAt).getTime()
        )
        .slice(0, 6),
    [records]
  );

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section aria-label="Key dropout analytics metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Students Analyzed</span>
              <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-slate-900">
              {stats.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">Active cohort records</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Low-Risk Students</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-emerald-700">
              {stats.low}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {stats.total > 0 ? Math.round((stats.low / stats.total) * 100) : 0}% of cohort · Score 0–35
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Medium-Risk Students</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-amber-700">
              {stats.medium}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {stats.total > 0 ? Math.round((stats.medium / stats.total) * 100) : 0}% of cohort · Score 36–65
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>High-Risk Students</span>
              <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-red-700">
              {stats.high}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0}% of cohort · Score 66+
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Overall Dropout Risk</span>
              <Percent className="h-4 w-4 text-violet-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-violet-700">
              {stats.overallRisk}%
            </p>
            <p className="mt-1 text-xs text-slate-500">Weighted cohort mean</p>
          </div>
        </div>
      </section>

      {/* Primary Charts Row: Distribution & Attendance Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Dropout Risk Distribution */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Dropout Risk Distribution
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Cohort breakdown across Low, Medium, and High risk tiers
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Deep Dive</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} students`, 'Count']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Attendance Percentage Analytics */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Attendance Percentage Analytics
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Average dropout risk score vs. student volume by attendance bracket
              </p>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={attendanceAnalytics}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="bracket"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="avgRisk"
                  name="Avg Dropout Risk (%)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="students"
                  name="Students in Bracket"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7C3AED' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Secondary Charts Row: Academic Performance & Department-wise Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Academic Performance Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Academic Performance Analysis
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              GPA brackets compared against average exam scores and predicted risk
            </p>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={academicPerformanceData}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="tier"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="avgMarks"
                  name="Avg Exam Score (%)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="avgRisk"
                  name="Avg Dropout Risk (%)"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Department-wise Dropout Analysis */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Department-wise Dropout Analysis
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mean risk percentage and high-risk student count across academic departments
            </p>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentAnalysis}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ''
                  }
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="avgRisk"
                  name="Mean Risk Score (%)"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="highRiskCount"
                  name="High-Risk Students"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Recent Prediction History */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Recent Prediction History
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Latest student evaluations stored locally — select any row to inspect factors and action plan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('records')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>View All Records</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Attendance</th>
                <th className="py-3 px-4 text-right">Current GPA</th>
                <th className="py-3 px-4 text-right">Risk Score</th>
                <th className="py-3 px-6">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentHistory.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-6 font-mono tabular-nums text-xs font-medium text-slate-600 whitespace-nowrap">
                    {student.studentId}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {student.studentName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {student.department}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {student.attendancePercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {student.currentSemesterGpa.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {student.prediction.riskScore}%
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <RiskLabel category={student.prediction.riskCategory} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
