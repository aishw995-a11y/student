import { buildSampleStudentRecords } from '../data/sampleStudents';
import { StudentRecord } from '../types/student';

const STORAGE_KEY = 'sdpas_student_records_v1';

export function loadStudentRecords(): StudentRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildSampleStudentRecords();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as StudentRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = buildSampleStudentRecords();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    return buildSampleStudentRecords();
  }
}

export function saveStudentRecords(records: StudentRecord[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function upsertStudentRecord(
  records: StudentRecord[],
  newRecord: StudentRecord
): StudentRecord[] {
  const existingIndex = records.findIndex(
    (r) => r.studentId.trim().toLowerCase() === newRecord.studentId.trim().toLowerCase()
  );
  let updated: StudentRecord[];
  if (existingIndex >= 0) {
    updated = [...records];
    updated[existingIndex] = newRecord;
    // Move updated record to top of recent history
    updated.sort(
      (a, b) =>
        new Date(b.prediction.analyzedAt).getTime() -
        new Date(a.prediction.analyzedAt).getTime()
    );
  } else {
    updated = [newRecord, ...records];
  }
  saveStudentRecords(updated);
  return updated;
}

export function resetToDemoDataset(): StudentRecord[] {
  const seeded = buildSampleStudentRecords();
  saveStudentRecords(seeded);
  return seeded;
}

export function exportRecordsToCsv(records: StudentRecord[]): void {
  const headers = [
    'Student ID',
    'Student Name',
    'Age',
    'Gender',
    'Department',
    'Year of Study',
    'Attendance %',
    'Days Absent',
    'Consecutive Absences',
    'Previous GPA',
    'Current GPA',
    'Backlogs',
    'Internal Marks %',
    'Assignment Submission %',
    'Exam Performance %',
    'Dropout Risk %',
    'Risk Category',
    'Analyzed At',
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => [
    r.studentId,
    r.studentName,
    r.age,
    r.gender,
    r.department,
    r.yearOfStudy,
    r.attendancePercentage,
    r.daysAbsent,
    r.consecutiveAbsences,
    r.previousSemesterGpa.toFixed(2),
    r.currentSemesterGpa.toFixed(2),
    r.backlogs,
    r.internalMarks,
    r.assignmentSubmission,
    r.examPerformance,
    r.prediction.riskScore,
    r.prediction.riskCategory,
    r.prediction.analyzedAt,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `student-dropout-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
