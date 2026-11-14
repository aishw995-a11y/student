export type Department =
  | 'Computer Science'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Business Administration'
  | 'Biotechnology';

export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say';

export type YearOfStudy = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type IncomeCategory = 'Low Income' | 'Middle Income' | 'Upper-Middle Income' | 'High Income';

export type ScholarshipStatus = 'None' | 'Partial Scholarship' | 'Full Scholarship';

export type ExtracurricularLevel = 'None' | 'Occasional' | 'Active';

export type ResourceAccess = 'Limited' | 'Adequate' | 'Full Access';

export type RiskCategory = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface StudentInput {
  // Personal Information
  studentId: string;
  studentName: string;
  age: number;
  gender: Gender;
  department: Department;
  yearOfStudy: YearOfStudy;

  // Academic Information
  previousSemesterGpa: number; // 0.0 - 10.0
  currentSemesterGpa: number; // 0.0 - 10.0
  backlogs: number;
  internalMarks: number; // 0 - 100
  assignmentSubmission: number; // 0 - 100
  examPerformance: number; // 0 - 100

  // Attendance Information
  attendancePercentage: number; // 0 - 100
  daysAbsent: number;
  consecutiveAbsences: number;

  // Other Factors
  familyIncomeCategory: IncomeCategory;
  scholarshipStatus: ScholarshipStatus;
  extracurricularParticipation: ExtracurricularLevel;
  learningResourcesAccess: ResourceAccess;
}

export interface WeightContribution {
  dimension: string;
  score: number;
  maxScore: number;
  summary: string;
}

export interface PredictionResult {
  riskScore: number; // 0 - 100
  riskCategory: RiskCategory;
  identifiedFactors: string[];
  recommendations: string[];
  contributions: WeightContribution[];
  modelEngine: 'Weighted Scoring Model (v1.0)';
  isMachineLearningModel: boolean;
  analyzedAt: string;
}

export interface StudentRecord extends StudentInput {
  id: string; // internal unique key
  prediction: PredictionResult;
}

export type AppView =
  | 'dashboard'
  | 'predict'
  | 'analytics'
  | 'records'
  | 'recommendations';
