import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Plus, Search } from 'lucide-react';
import { Department, RiskCategory, StudentRecord } from '../types/student';
import { RiskLabel } from './RiskIndicator';

interface StudentRecordsViewProps {
  records: StudentRecord[];
  onSelectStudent: (student: StudentRecord) => void;
  onPredictNew: () => void;
}

type SortKey =
  | 'riskScore'
  | 'studentName'
  | 'attendancePercentage'
  | 'currentSemesterGpa'
  | 'backlogs'
  | 'analyzedAt';

const DEPARTMENTS: Array<'All' | Department> = [
  'All',
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Biotechnology',
];

const RISK_FILTERS: Array<'All' | RiskCategory> = [
  'All',
  'Low Risk',
  'Medium Risk',
  'High Risk',
];

export function StudentRecordsView({
  records,
  onSelectStudent,
  onPredictNew,
}: StudentRecordsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<'All' | Department>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskCategory>('All');
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'studentName' ? 'asc' : 'desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = records.filter((r) => {
      if (deptFilter !== 'All' && r.department !== deptFilter) return false;
      if (riskFilter !== 'All' && r.prediction.riskCategory !== riskFilter) {
        return false;
      }
      if (q) {
        const matchId = r.studentId.toLowerCase().includes(q);
        const matchName = r.studentName.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDept) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'riskScore':
          comparison = a.prediction.riskScore - b.prediction.riskScore;
          break;
        case 'studentName':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'attendancePercentage':
          comparison = a.attendancePercentage - b.attendancePercentage;
          break;
        case 'currentSemesterGpa':
          comparison = a.currentSemesterGpa - b.currentSemesterGpa;
          break;
        case 'backlogs':
          comparison = a.backlogs - b.backlogs;
          break;
        case 'analyzedAt':
          comparison =
            new Date(a.prediction.analyzedAt).getTime() -
            new Date(b.prediction.analyzedAt).getTime();
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [records, searchQuery, deptFilter, riskFilter, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Toolbar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Student ID, name, or department..."
              aria-label="Search student records"
              className="block w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Department + Risk Level Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter by department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as 'All' | Department)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            <div
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Filter by risk level"
            >
              {RISK_FILTERS.map((level) => {
                const active = riskFilter === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskFilter(level)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {level === 'All' ? 'All Risks' : level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="font-mono tabular-nums">
            Showing {filteredAndSorted.length} of {records.length} student records
          </span>
          {(searchQuery || deptFilter !== 'All' || riskFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDeptFilter('All');
                setRiskFilter('All');
              }}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      </section>

      {/* Records Data Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filteredAndSorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-6 whitespace-nowrap">Student ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('studentName')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Student Name</span>
                      {renderSortIcon('studentName')}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Department</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('attendancePercentage')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      <span>Attendance</span>
                      {renderSortIcon('attendancePercentage')}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('currentSemesterGpa')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      <span>GPA</span>
                      {renderSortIcon('currentSemesterGpa')}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('backlogs')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      <span>Backlogs</span>
                      {renderSortIcon('backlogs')}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('riskScore')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      <span>Dropout Risk</span>
                      {renderSortIcon('riskScore')}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Risk Category</th>
                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSorted.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono tabular-nums text-xs font-medium text-slate-600 whitespace-nowrap">
                      {student.studentId}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{student.studentName}</p>
                      <p className="text-xs text-slate-500">{student.yearOfStudy}</p>
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
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {student.backlogs}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {student.prediction.riskScore}%
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskLabel category={student.prediction.riskCategory} />
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(student);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              No matching student records found
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Adjust your search query or risk filters, or run a new prediction to add a student record.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDeptFilter('All');
                  setRiskFilter('All');
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onPredictNew}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Predict Student</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
