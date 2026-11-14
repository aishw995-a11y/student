import { useMemo, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardView } from './components/DashboardView';
import { Layout } from './components/Layout';
import { PredictView } from './components/PredictView';
import { RecommendationsView } from './components/RecommendationsView';
import { StudentDetailDrawer } from './components/StudentDetailDrawer';
import { StudentRecordsView } from './components/StudentRecordsView';
import { AppView, StudentRecord } from './types/student';
import {
  exportRecordsToCsv,
  loadStudentRecords,
  resetToDemoDataset,
  saveStudentRecords,
  upsertStudentRecord,
} from './utils/storage';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [records, setRecords] = useState<StudentRecord[]>(() =>
    loadStudentRecords()
  );
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null
  );

  const highRiskCount = useMemo(
    () => records.filter((r) => r.prediction.riskCategory === 'High Risk').length,
    [records]
  );

  const handleSavePrediction = (newRecord: StudentRecord) => {
    setRecords((prev) => upsertStudentRecord(prev, newRecord));
  };

  const handleDeleteRecord = (studentId: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.studentId !== studentId);
      saveStudentRecords(updated);
      return updated;
    });
  };

  const handleResetDemo = () => {
    const seeded = resetToDemoDataset();
    setRecords(seeded);
    setSelectedStudent(null);
  };

  const handleExportCsv = () => {
    exportRecordsToCsv(records);
  };

  return (
    <>
      <Layout
        activeView={activeView}
        onNavigate={setActiveView}
        onExportCsv={handleExportCsv}
        onResetDemo={handleResetDemo}
        totalStudents={records.length}
        highRiskCount={highRiskCount}
      >
        {activeView === 'dashboard' && (
          <DashboardView
            records={records}
            onNavigate={setActiveView}
            onSelectStudent={setSelectedStudent}
          />
        )}

        {activeView === 'predict' && (
          <PredictView
            onSavePrediction={handleSavePrediction}
            onViewAllRecords={() => setActiveView('records')}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            records={records}
            onSelectStudent={setSelectedStudent}
          />
        )}

        {activeView === 'records' && (
          <StudentRecordsView
            records={records}
            onSelectStudent={setSelectedStudent}
            onPredictNew={() => setActiveView('predict')}
          />
        )}

        {activeView === 'recommendations' && (
          <RecommendationsView
            records={records}
            onSelectStudent={setSelectedStudent}
          />
        )}
      </Layout>

      <StudentDetailDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onDelete={handleDeleteRecord}
      />
    </>
  );
}
