import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Eye, Filter } from 'lucide-react';
import { SEMESTER_TREND_BASELINE } from '../data/sampleStudents';
import { Department, StudentRecord, YearOfStudy } from '../types/student';
import { RiskLabel } from './RiskIndicator';

interface AnalyticsViewProps {
  records: StudentRecord[];
  onSelectStudent: (student: StudentRecord) => void;
}

const DEPARTMENTS: Array<'All' | Department> = [
  'All',
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Biotechnology',
];

const YEARS: Array<'All' | YearOfStudy> = [
  'All',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

const SHORT_DEPT: Record<Department, string> = {
  'Computer Science': 'CSE',
  'Electrical Engineering': 'EEE',
  'Mechanical Engineering': 'MECH',
  'Civil Engineering': 'CIVIL',
  'Business Administration': 'BBA',
  Biotechnology: 'BIOTECH',
};

export function AnalyticsView({
  records,
  onSelectStudent,
}: AnalyticsViewProps) {
  const [selectedDept, setSelectedDept] = useState<'All' | Department>('All');
  const [selectedYear, setSelectedYear] = useState<'All' | YearOfStudy>('All');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedDept !== 'All' && r.department !== selectedDept) return false;
      if (selectedYear !== 'All' && r.yearOfStudy !== selectedYear) return false;
      return true;
    });
  }, [records, selectedDept, selectedYear]);

  const riskPieData = useMemo(() => {
    const low = filteredRecords.filter(
      (r) => r.prediction.riskCategory === 'Low Risk'
    ).length;
    const med = filteredRecords.filter(
      (r) => r.prediction.riskCategory === 'Medium Risk'
    ).length;
    const high = filteredRecords.filter(
      (r) => r.prediction.riskCategory === 'High Risk'
    ).length;
    return [
      { name: 'Low Risk', value: low, color: '#16A34A' },
      { name: 'Medium Risk', value: med, color: '#D97706' },
      { name: 'High Risk', value: high, color: '#DC2626' },
    ];
  }, [filteredRecords]);

  const attendanceVsRiskData = useMemo(() => {
    const brackets = [
      { label: '0–59%', min: 0, max: 59.99 },
      { label: '60–69%', min: 60, max: 69.99 },
      { label: '70–79%', min: 70, max: 79.99 },
      { label: '80–89%', min: 80, max: 89.99 },
      { label: '90–100%', min: 90, max: 100 },
    ];
    return brackets.map((b) => {
      const subset = filteredRecords.filter(
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
        range: b.label,
        avgRisk,
        studentCount: subset.length,
      };
    });
  }, [filteredRecords]);

  const departmentComparison = useMemo(() => {
    const deptList = Object.keys(SHORT_DEPT) as Department[];
    return deptList.map((dept) => {
      const subset = records.filter(
        (r) =>
          r.department === dept &&
          (selectedYear === 'All' || r.yearOfStudy === selectedYear)
      );
      return {
        dept: SHORT_DEPT[dept],
        fullName: dept,
        low: subset.filter((r) => r.prediction.riskCategory === 'Low Risk').length,
        medium: subset.filter((r) => r.prediction.riskCategory === 'Medium Risk').length,
        high: subset.filter((r) => r.prediction.riskCategory === 'High Risk').length,
        avgRisk:
          subset.length > 0
            ? Math.round(
                subset.reduce((acc, r) => acc + r.prediction.riskScore, 0) /
                  subset.length
              )
            : 0,
      };
    });
  }, [records, selectedYear]);

  const academicCorrelation = useMemo(() => {
    const backlogGroups = [
      { label: '0 Backlogs', match: (b: number) => b === 0 },
      { label: '1 Backlog', match: (b: number) => b === 1 },
      { label: '2 Backlogs', match: (b: number) => b === 2 },
      { label: '3+ Backlogs', match: (b: number) => b >= 3 },
    ];
    return backlogGroups.map((g) => {
      const subset = filteredRecords.filter((r) => g.match(r.backlogs));
      const avgRisk =
        subset.length > 0
          ? Math.round(
              subset.reduce((acc, r) => acc + r.prediction.riskScore, 0) /
                subset.length
            )
          : 0;
      const avgGpaScaled =
        subset.length > 0
          ? Number(
              (
                subset.reduce((acc, r) => acc + r.currentSemesterGpa, 0) /
                subset.length
              ).toFixed(2)
            )
          : 0;
      return {
        group: g.label,
        avgRisk,
        avgGpaPct: Math.round(avgGpaScaled * 10),
        avgGpa: avgGpaScaled,
        count: subset.length,
      };
    });
  }, [filteredRecords]);

  const highRiskStudents = useMemo(
    () =>
      filteredRecords
        .filter((r) => r.prediction.riskCategory === 'High Risk')
        .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore),
    [filteredRecords]
  );

  return (
    <div className="space-y-6">
      {/* Interactive Filter Toolbar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>Cohort Filters</span>
          <span className="text-xs font-normal text-slate-500 font-mono tabular-nums">
            ({filteredRecords.length} of {records.length} students)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-dept" className="text-xs font-medium text-slate-600">
              Department
            </label>
            <select
              id="analytics-dept"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as 'All' | Department)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="analytics-year" className="text-xs font-medium text-slate-600">
              Year
            </label>
            <select
              id="analytics-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as 'All' | YearOfStudy)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y === 'All' ? 'All Years' : y}
                </option>
              ))}
            </select>
          </div>

          {(selectedDept !== 'All' || selectedYear !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept('All');
                setSelectedYear('All');
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Row 1: Pie Distribution & Attendance vs Dropout Risk */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Dropout Risk Distribution
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Proportion of filtered students across risk classifications
          </p>
          <div className="mt-4 h-64 w-full">
            {filteredRecords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry) => (
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
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No students match the selected cohort filter.
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Attendance vs. Dropout Risk
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Mean dropout risk percentage across granular attendance intervals
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceVsRiskData}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="range"
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
                  dataKey="avgRisk"
                  name="Mean Risk Score (%)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 2: Semester-wise Dropout Trends & Department Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Semester-wise Dropout Trends
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Historical institutional dropout risk trajectory and average attendance across Semesters 1–8
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={SEMESTER_TREND_BASELINE}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="semester"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="avgDropoutRate"
                  name="Observed Dropout Rate (%)"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7C3AED' }}
                />
                <Line
                  type="monotone"
                  dataKey="attendanceAvg"
                  name="Avg Attendance (%)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Department-wise Dropout Comparison
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Stacked risk-level headcount across departments
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentComparison}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="dept"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
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
                <Bar dataKey="low" stackId="a" name="Low Risk" fill="#16A34A" />
                <Bar dataKey="medium" stackId="a" name="Medium Risk" fill="#D97706" />
                <Bar
                  dataKey="high"
                  stackId="a"
                  name="High Risk"
                  fill="#DC2626"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: Academic Performance Analysis & High-Risk Identification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Backlogs & Academic Performance Impact
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            How active backlogs correlate with GPA index (x10) and dropout risk
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={academicCorrelation}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
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
                  dataKey="avgRisk"
                  name="Avg Dropout Risk (%)"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="avgGpaPct"
                  name="GPA Index (GPA × 10)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* High-Risk Student Identification */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                High-Risk Student Identification
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Students scoring 66% or above requiring immediate counselling
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs font-semibold text-red-700">
              {highRiskStudents.length} Flagged
            </span>
          </div>

          {highRiskStudents.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-6">Student</th>
                    <th className="py-2.5 px-4">Dept</th>
                    <th className="py-2.5 px-4 text-right">Attendance</th>
                    <th className="py-2.5 px-4 text-right">Backlogs</th>
                    <th className="py-2.5 px-4 text-right">Risk</th>
                    <th className="py-2.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {highRiskStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <p className="font-medium text-slate-900">
                          {student.studentName}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-500">
                          {student.studentId}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {SHORT_DEPT[student.department]}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {student.attendancePercentage}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {student.backlogs}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RiskLabel
                          category={student.prediction.riskCategory}
                          score={student.prediction.riskScore}
                          showScore
                        />
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-500">
              No high-risk students found in the selected filter.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
