import { FormEvent, useRef, useState } from 'react';
import {
  ArrowRight,
  Cpu,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { predictDropoutRisk } from '../engine/dropoutPredictor';
import {
  Department,
  ExtracurricularLevel,
  Gender,
  IncomeCategory,
  ResourceAccess,
  ScholarshipStatus,
  StudentInput,
  StudentRecord,
  YearOfStudy,
} from '../types/student';
import { RiskLabel, RiskProgressBar } from './RiskIndicator';

interface PredictViewProps {
  onSavePrediction: (record: StudentRecord) => void;
  onViewAllRecords: () => void;
}

const DEPARTMENTS: Department[] = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Biotechnology',
];

const GENDERS: Gender[] = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
const YEARS: YearOfStudy[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const INCOMES: IncomeCategory[] = [
  'Low Income',
  'Middle Income',
  'Upper-Middle Income',
  'High Income',
];
const SCHOLARSHIPS: ScholarshipStatus[] = [
  'None',
  'Partial Scholarship',
  'Full Scholarship',
];
const EXTRACURRICULARS: ExtracurricularLevel[] = ['None', 'Occasional', 'Active'];
const RESOURCES: ResourceAccess[] = ['Limited', 'Adequate', 'Full Access'];

interface FormState {
  studentId: string;
  studentName: string;
  age: string;
  gender: Gender;
  department: Department;
  yearOfStudy: YearOfStudy;
  previousSemesterGpa: string;
  currentSemesterGpa: string;
  backlogs: string;
  internalMarks: string;
  assignmentSubmission: string;
  examPerformance: string;
  attendancePercentage: string;
  daysAbsent: string;
  consecutiveAbsences: string;
  familyIncomeCategory: IncomeCategory;
  scholarshipStatus: ScholarshipStatus;
  extracurricularParticipation: ExtracurricularLevel;
  learningResourcesAccess: ResourceAccess;
}

const EMPTY_FORM: FormState = {
  studentId: '',
  studentName: '',
  age: '20',
  gender: 'Male',
  department: 'Computer Science',
  yearOfStudy: '2nd Year',
  previousSemesterGpa: '',
  currentSemesterGpa: '',
  backlogs: '0',
  internalMarks: '',
  assignmentSubmission: '',
  examPerformance: '',
  attendancePercentage: '',
  daysAbsent: '0',
  consecutiveAbsences: '0',
  familyIncomeCategory: 'Middle Income',
  scholarshipStatus: 'None',
  extracurricularParticipation: 'Occasional',
  learningResourcesAccess: 'Adequate',
};

const DEMO_HIGH_RISK: FormState = {
  studentId: 'STU-2026-204',
  studentName: 'Arun',
  age: '20',
  gender: 'Male',
  department: 'Computer Science',
  yearOfStudy: '2nd Year',
  previousSemesterGpa: '6.7',
  currentSemesterGpa: '4.9',
  backlogs: '3',
  internalMarks: '46',
  assignmentSubmission: '44',
  examPerformance: '48',
  attendancePercentage: '58',
  daysAbsent: '21',
  consecutiveAbsences: '6',
  familyIncomeCategory: 'Low Income',
  scholarshipStatus: 'None',
  extracurricularParticipation: 'None',
  learningResourcesAccess: 'Limited',
};

const DEMO_MEDIUM_RISK: FormState = {
  studentId: 'STU-2026-205',
  studentName: 'Tanvi Rao',
  age: '19',
  gender: 'Female',
  department: 'Electrical Engineering',
  yearOfStudy: '1st Year',
  previousSemesterGpa: '7.4',
  currentSemesterGpa: '6.2',
  backlogs: '1',
  internalMarks: '64',
  assignmentSubmission: '69',
  examPerformance: '61',
  attendancePercentage: '71',
  daysAbsent: '13',
  consecutiveAbsences: '4',
  familyIncomeCategory: 'Middle Income',
  scholarshipStatus: 'Partial Scholarship',
  extracurricularParticipation: 'Occasional',
  learningResourcesAccess: 'Adequate',
};

const DEMO_LOW_RISK: FormState = {
  studentId: 'STU-2026-206',
  studentName: 'Nikhil Subramanian',
  age: '21',
  gender: 'Male',
  department: 'Biotechnology',
  yearOfStudy: '3rd Year',
  previousSemesterGpa: '8.4',
  currentSemesterGpa: '8.7',
  backlogs: '0',
  internalMarks: '86',
  assignmentSubmission: '93',
  examPerformance: '88',
  attendancePercentage: '92',
  daysAbsent: '4',
  consecutiveAbsences: '1',
  familyIncomeCategory: 'Upper-Middle Income',
  scholarshipStatus: 'None',
  extracurricularParticipation: 'Active',
  learningResourcesAccess: 'Full Access',
};

export function PredictView({
  onSavePrediction,
  onViewAllRecords,
}: PredictViewProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [resultRecord, setResultRecord] = useState<StudentRecord | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): StudentInput | null => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.studentId.trim()) {
      nextErrors.studentId = 'Student ID is required.';
    }
    if (!form.studentName.trim()) {
      nextErrors.studentName = 'Student Name is required.';
    }

    const age = Number(form.age);
    if (!form.age || Number.isNaN(age) || age < 16 || age > 45) {
      nextErrors.age = 'Age must be between 16 and 45.';
    }

    const prevGpa = Number(form.previousSemesterGpa);
    if (
      form.previousSemesterGpa === '' ||
      Number.isNaN(prevGpa) ||
      prevGpa < 0 ||
      prevGpa > 10
    ) {
      nextErrors.previousSemesterGpa = 'Enter a GPA between 0.0 and 10.0.';
    }

    const currGpa = Number(form.currentSemesterGpa);
    if (
      form.currentSemesterGpa === '' ||
      Number.isNaN(currGpa) ||
      currGpa < 0 ||
      currGpa > 10
    ) {
      nextErrors.currentSemesterGpa = 'Enter a GPA between 0.0 and 10.0.';
    }

    const backlogs = Number(form.backlogs);
    if (
      form.backlogs === '' ||
      Number.isNaN(backlogs) ||
      !Number.isInteger(backlogs) ||
      backlogs < 0 ||
      backlogs > 20
    ) {
      nextErrors.backlogs = 'Enter an integer between 0 and 20.';
    }

    const checkPct = (field: keyof FormState, label: string) => {
      const val = Number(form[field]);
      if (form[field] === '' || Number.isNaN(val) || val < 0 || val > 100) {
        nextErrors[field] = `${label} must be between 0 and 100%.`;
      }
      return val;
    };

    const internalMarks = checkPct('internalMarks', 'Internal marks');
    const assignmentSubmission = checkPct(
      'assignmentSubmission',
      'Assignment submission'
    );
    const examPerformance = checkPct('examPerformance', 'Exam performance');
    const attendancePercentage = checkPct('attendancePercentage', 'Attendance');

    const daysAbsent = Number(form.daysAbsent);
    if (
      form.daysAbsent === '' ||
      Number.isNaN(daysAbsent) ||
      daysAbsent < 0 ||
      daysAbsent > 180
    ) {
      nextErrors.daysAbsent = 'Enter days absent between 0 and 180.';
    }

    const consecutiveAbsences = Number(form.consecutiveAbsences);
    if (
      form.consecutiveAbsences === '' ||
      Number.isNaN(consecutiveAbsences) ||
      consecutiveAbsences < 0 ||
      consecutiveAbsences > 90
    ) {
      nextErrors.consecutiveAbsences = 'Enter consecutive days between 0 and 90.';
    } else if (!Number.isNaN(daysAbsent) && consecutiveAbsences > daysAbsent) {
      nextErrors.consecutiveAbsences =
        'Consecutive absences cannot exceed total days absent.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      studentId: form.studentId.trim(),
      studentName: form.studentName.trim(),
      age,
      gender: form.gender,
      department: form.department,
      yearOfStudy: form.yearOfStudy,
      previousSemesterGpa: prevGpa,
      currentSemesterGpa: currGpa,
      backlogs,
      internalMarks,
      assignmentSubmission,
      examPerformance,
      attendancePercentage,
      daysAbsent,
      consecutiveAbsences,
      familyIncomeCategory: form.familyIncomeCategory,
      scholarshipStatus: form.scholarshipStatus,
      extracurricularParticipation: form.extracurricularParticipation,
      learningResourcesAccess: form.learningResourcesAccess,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validInput = validate();
    if (!validInput) return;

    setIsPredicting(true);
    try {
      const prediction = await predictDropoutRisk(validInput);
      const record: StudentRecord = {
        ...validInput,
        id: validInput.studentId,
        prediction,
      };
      setResultRecord(record);
      onSavePrediction(record);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setResultRecord(null);
  };

  const applyPreset = (preset: FormState) => {
    setForm(preset);
    setErrors({});
  };

  const inputClass = (field: keyof FormState) =>
    `mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
    }`;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
      {/* Left: Student Input Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-8"
      >
        {/* Demo Preset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Student Evaluation Form
            </h2>
            <p className="text-xs text-slate-500">
              Fill all metrics below or load a sample student profile for quick testing
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset(DEMO_HIGH_RISK)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Demo: High Risk (Arun)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(DEMO_MEDIUM_RISK)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Demo: Medium Risk
            </button>
            <button
              type="button"
              onClick={() => applyPreset(DEMO_LOW_RISK)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Demo: Low Risk
            </button>
          </div>
        </div>

        {/* 1. Personal Information */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            01. Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="studentId" className="block text-xs font-medium text-slate-700">
                Student ID <span className="text-red-600">*</span>
              </label>
              <input
                id="studentId"
                type="text"
                placeholder="e.g. STU-2026-204"
                value={form.studentId}
                onChange={(e) => updateField('studentId', e.target.value)}
                className={`${inputClass('studentId')} font-mono`}
              />
              {errors.studentId && (
                <p className="mt-1 text-xs text-red-600">{errors.studentId}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="studentName" className="block text-xs font-medium text-slate-700">
                Student Name <span className="text-red-600">*</span>
              </label>
              <input
                id="studentName"
                type="text"
                placeholder="Full student name"
                value={form.studentName}
                onChange={(e) => updateField('studentName', e.target.value)}
                className={inputClass('studentName')}
              />
              {errors.studentName && (
                <p className="mt-1 text-xs text-red-600">{errors.studentName}</p>
              )}
            </div>

            <div>
              <label htmlFor="age" className="block text-xs font-medium text-slate-700">
                Age
              </label>
              <input
                id="age"
                type="number"
                min={16}
                max={45}
                value={form.age}
                onChange={(e) => updateField('age', e.target.value)}
                className={`${inputClass('age')} font-mono tabular-nums`}
              />
              {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
            </div>

            <div>
              <label htmlFor="gender" className="block text-xs font-medium text-slate-700">
                Gender
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value as Gender)}
                className={inputClass('gender')}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="yearOfStudy" className="block text-xs font-medium text-slate-700">
                Year of Study
              </label>
              <select
                id="yearOfStudy"
                value={form.yearOfStudy}
                onChange={(e) => updateField('yearOfStudy', e.target.value as YearOfStudy)}
                className={inputClass('yearOfStudy')}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="department" className="block text-xs font-medium text-slate-700">
                Department
              </label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => updateField('department', e.target.value as Department)}
                className={inputClass('department')}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* 2. Academic Information */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            02. Academic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="previousSemesterGpa"
                className="block text-xs font-medium text-slate-700"
              >
                Previous Semester GPA (0–10)
              </label>
              <input
                id="previousSemesterGpa"
                type="number"
                step="0.01"
                min={0}
                max={10}
                placeholder="e.g. 7.20"
                value={form.previousSemesterGpa}
                onChange={(e) => updateField('previousSemesterGpa', e.target.value)}
                className={`${inputClass('previousSemesterGpa')} font-mono tabular-nums`}
              />
              {errors.previousSemesterGpa && (
                <p className="mt-1 text-xs text-red-600">{errors.previousSemesterGpa}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="currentSemesterGpa"
                className="block text-xs font-medium text-slate-700"
              >
                Current Semester GPA (0–10)
              </label>
              <input
                id="currentSemesterGpa"
                type="number"
                step="0.01"
                min={0}
                max={10}
                placeholder="e.g. 6.40"
                value={form.currentSemesterGpa}
                onChange={(e) => updateField('currentSemesterGpa', e.target.value)}
                className={`${inputClass('currentSemesterGpa')} font-mono tabular-nums`}
              />
              {errors.currentSemesterGpa && (
                <p className="mt-1 text-xs text-red-600">{errors.currentSemesterGpa}</p>
              )}
            </div>

            <div>
              <label htmlFor="backlogs" className="block text-xs font-medium text-slate-700">
                Number of Backlogs
              </label>
              <input
                id="backlogs"
                type="number"
                min={0}
                max={20}
                value={form.backlogs}
                onChange={(e) => updateField('backlogs', e.target.value)}
                className={`${inputClass('backlogs')} font-mono tabular-nums`}
              />
              {errors.backlogs && (
                <p className="mt-1 text-xs text-red-600">{errors.backlogs}</p>
              )}
            </div>

            <div>
              <label htmlFor="internalMarks" className="block text-xs font-medium text-slate-700">
                Internal Assessment Marks (%)
              </label>
              <input
                id="internalMarks"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={form.internalMarks}
                onChange={(e) => updateField('internalMarks', e.target.value)}
                className={`${inputClass('internalMarks')} font-mono tabular-nums`}
              />
              {errors.internalMarks && (
                <p className="mt-1 text-xs text-red-600">{errors.internalMarks}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="assignmentSubmission"
                className="block text-xs font-medium text-slate-700"
              >
                Assignment Submission (%)
              </label>
              <input
                id="assignmentSubmission"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={form.assignmentSubmission}
                onChange={(e) => updateField('assignmentSubmission', e.target.value)}
                className={`${inputClass('assignmentSubmission')} font-mono tabular-nums`}
              />
              {errors.assignmentSubmission && (
                <p className="mt-1 text-xs text-red-600">{errors.assignmentSubmission}</p>
              )}
            </div>

            <div>
              <label htmlFor="examPerformance" className="block text-xs font-medium text-slate-700">
                Exam Performance (%)
              </label>
              <input
                id="examPerformance"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={form.examPerformance}
                onChange={(e) => updateField('examPerformance', e.target.value)}
                className={`${inputClass('examPerformance')} font-mono tabular-nums`}
              />
              {errors.examPerformance && (
                <p className="mt-1 text-xs text-red-600">{errors.examPerformance}</p>
              )}
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* 3. Attendance Information */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            03. Attendance Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="attendancePercentage"
                className="block text-xs font-medium text-slate-700"
              >
                Overall Attendance (%)
              </label>
              <input
                id="attendancePercentage"
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={form.attendancePercentage}
                onChange={(e) => updateField('attendancePercentage', e.target.value)}
                className={`${inputClass('attendancePercentage')} font-mono tabular-nums`}
              />
              {errors.attendancePercentage && (
                <p className="mt-1 text-xs text-red-600">{errors.attendancePercentage}</p>
              )}
            </div>

            <div>
              <label htmlFor="daysAbsent" className="block text-xs font-medium text-slate-700">
                Number of Days Absent
              </label>
              <input
                id="daysAbsent"
                type="number"
                min={0}
                max={180}
                value={form.daysAbsent}
                onChange={(e) => updateField('daysAbsent', e.target.value)}
                className={`${inputClass('daysAbsent')} font-mono tabular-nums`}
              />
              {errors.daysAbsent && (
                <p className="mt-1 text-xs text-red-600">{errors.daysAbsent}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="consecutiveAbsences"
                className="block text-xs font-medium text-slate-700"
              >
                Consecutive Absences (Days)
              </label>
              <input
                id="consecutiveAbsences"
                type="number"
                min={0}
                max={90}
                value={form.consecutiveAbsences}
                onChange={(e) => updateField('consecutiveAbsences', e.target.value)}
                className={`${inputClass('consecutiveAbsences')} font-mono tabular-nums`}
              />
              {errors.consecutiveAbsences && (
                <p className="mt-1 text-xs text-red-600">{errors.consecutiveAbsences}</p>
              )}
            </div>
          </div>
        </section>

        <hr className="border-slate-200" />

        {/* 4. Other Factors */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            04. Socio-Economic & Support Factors
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="familyIncomeCategory"
                className="block text-xs font-medium text-slate-700"
              >
                Family Income Category
              </label>
              <select
                id="familyIncomeCategory"
                value={form.familyIncomeCategory}
                onChange={(e) =>
                  updateField('familyIncomeCategory', e.target.value as IncomeCategory)
                }
                className={inputClass('familyIncomeCategory')}
              >
                {INCOMES.map((inc) => (
                  <option key={inc} value={inc}>
                    {inc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="scholarshipStatus"
                className="block text-xs font-medium text-slate-700"
              >
                Scholarship Status
              </label>
              <select
                id="scholarshipStatus"
                value={form.scholarshipStatus}
                onChange={(e) =>
                  updateField('scholarshipStatus', e.target.value as ScholarshipStatus)
                }
                className={inputClass('scholarshipStatus')}
              >
                {SCHOLARSHIPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="extracurricularParticipation"
                className="block text-xs font-medium text-slate-700"
              >
                Extracurricular Participation
              </label>
              <select
                id="extracurricularParticipation"
                value={form.extracurricularParticipation}
                onChange={(e) =>
                  updateField(
                    'extracurricularParticipation',
                    e.target.value as ExtracurricularLevel
                  )
                }
                className={inputClass('extracurricularParticipation')}
              >
                {EXTRACURRICULARS.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="learningResourcesAccess"
                className="block text-xs font-medium text-slate-700"
              >
                Access to Learning Resources
              </label>
              <select
                id="learningResourcesAccess"
                value={form.learningResourcesAccess}
                onChange={(e) =>
                  updateField(
                    'learningResourcesAccess',
                    e.target.value as ResourceAccess
                  )
                }
                className={inputClass('learningResourcesAccess')}
              >
                {RESOURCES.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>Reset Form</span>
          </button>

          <button
            type="submit"
            disabled={isPredicting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isPredicting ? 'Analyzing...' : 'Predict Dropout Risk'}</span>
          </button>
        </div>
      </form>

      {/* Right: Prediction Result & Methodology */}
      <div ref={resultRef} className="xl:col-span-5 space-y-6">
        {resultRecord ? (
          <section
            className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-mono tabular-nums text-slate-500">
                  {resultRecord.studentId} · {resultRecord.department} ·{' '}
                  {resultRecord.yearOfStudy}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 font-display">
                  {resultRecord.studentName}
                </h2>
              </div>
              <RiskLabel category={resultRecord.prediction.riskCategory} />
            </div>

            {/* Score & Progress */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Predicted Dropout Risk
                </span>
                <span className="text-4xl font-bold font-mono tabular-nums text-slate-900">
                  {resultRecord.prediction.riskScore}%
                </span>
              </div>
              <RiskProgressBar
                score={resultRecord.prediction.riskScore}
                category={resultRecord.prediction.riskCategory}
              />
            </div>

            <hr className="border-slate-200" />

            {/* Weight Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Scoring Dimension Breakdown
              </h3>
              <div className="space-y-2.5">
                {resultRecord.prediction.contributions.map((c) => {
                  const pct = Math.round((c.score / c.maxScore) * 100);
                  return (
                    <div key={c.dimension} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{c.dimension}</span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {c.score} / {c.maxScore} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-violet-600 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Identified Factors */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Identified Factors
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-4">
                {resultRecord.prediction.identifiedFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>

            <hr className="border-slate-200" />

            {/* Personalized Recommendations */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Personalized Recommendations
              </h3>
              <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-4">
                {resultRecord.prediction.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs">
              <span className="text-emerald-700 font-medium">
                Saved to Student Records & Analytics
              </span>
              <button
                type="button"
                onClick={onViewAllRecords}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                <span>Open Records</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Ready for Prediction Analysis
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Complete the student form on the left and click{' '}
                <span className="font-semibold text-slate-900">Predict Dropout Risk</span>{' '}
                to generate a 0–100 risk score, category classification, factor breakdown, and personalized intervention steps.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Classification Thresholds</p>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-emerald-700 font-medium">Low Risk</span>
                <span>0 – 35%</span>
              </div>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-amber-700 font-medium">Medium Risk</span>
                <span>36 – 65%</span>
              </div>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-red-700 font-medium">High Risk</span>
                <span>66 – 100%</span>
              </div>
            </div>
          </section>
        )}

        {/* Transparent Model Explanation Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 font-display">
            Prediction Architecture Note
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Initial risk scores are computed using a{' '}
            <span className="font-semibold text-slate-800">
              transparent weighted scoring model
            </span>{' '}
            (Attendance 30 pts, Academic GPA & Assessments 30 pts, Backlogs 20 pts, Assignments 12 pts, Support Factors 8 pts) rather than a trained machine-learning model. The prediction module is cleanly decoupled via an async adapter interface so a trained ML model (e.g. Random Forest or XGBoost API) can be connected in the future.
          </p>
        </section>
      </div>
    </div>
  );
}
