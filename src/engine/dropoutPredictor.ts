import {
  PredictionResult,
  RiskCategory,
  StudentInput,
  WeightContribution,
} from '../types/student';

/**
 * Decoupled prediction interface so a future trained ML API (e.g. FastAPI / Flask / Vertex AI)
 * can replace or augment the weighted scoring engine without modifying UI components.
 */
export interface PredictionEngineAdapter {
  readonly engineName: string;
  readonly isMachineLearningModel: boolean;
  predict(input: StudentInput): Promise<PredictionResult>;
}

export const RISK_THRESHOLDS = {
  lowMax: 35,
  mediumMax: 65,
} as const;

export function classifyRiskScore(score: number): RiskCategory {
  if (score <= RISK_THRESHOLDS.lowMax) return 'Low Risk';
  if (score <= RISK_THRESHOLDS.mediumMax) return 'Medium Risk';
  return 'High Risk';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Weighted Risk-Scoring Algorithm (0–100)
 *
 * Weights:
 *  - Attendance & Absenteeism: max 30 pts
 *  - Academic Performance & GPA Trend: max 30 pts
 *  - Number of Backlogs: max 20 pts
 *  - Assignment Submission Consistency: max 12 pts
 *  - Socio-Economic & Resource Support: max 8 pts
 *
 * Note: Deterministic rule-and-weight scoring model, not a trained ML classifier.
 */
export function calculateWeightedDropoutRisk(input: StudentInput): PredictionResult {
  const factors: string[] = [];
  const recommendations: string[] = [];

  // 1. Attendance & Absenteeism (Max 30 pts)
  let attendanceScore = 0;
  if (input.attendancePercentage < 60) {
    attendanceScore += 16 + ((60 - input.attendancePercentage) / 60) * 6; // 16 - 22
    factors.push(`Low overall attendance (${input.attendancePercentage}% — below 60% threshold)`);
  } else if (input.attendancePercentage < 75) {
    attendanceScore += 8 + ((75 - input.attendancePercentage) / 15) * 8; // 8 - 16
    factors.push(`Sub-optimal attendance (${input.attendancePercentage}% — below 75% requirement)`);
  } else if (input.attendancePercentage < 85) {
    attendanceScore += ((85 - input.attendancePercentage) / 10) * 6; // 0 - 6
  }

  let absenteeismPenalty = 0;
  if (input.consecutiveAbsences >= 7) {
    absenteeismPenalty += 5;
    factors.push(`Extended consecutive absences (${input.consecutiveAbsences} days in a row)`);
  } else if (input.consecutiveAbsences >= 4) {
    absenteeismPenalty += 3;
    factors.push(`Repeated consecutive absences (${input.consecutiveAbsences} consecutive days)`);
  } else if (input.consecutiveAbsences >= 2) {
    absenteeismPenalty += 1;
  }

  if (input.daysAbsent >= 20) {
    absenteeismPenalty += 3;
  } else if (input.daysAbsent >= 12) {
    absenteeismPenalty += 2;
  } else if (input.daysAbsent >= 6) {
    absenteeismPenalty += 1;
  }

  const totalAttendancePoints = clamp(Math.round(attendanceScore + absenteeismPenalty), 0, 30);

  // 2. Academic Performance & GPA Trend (Max 30 pts)
  let gpaScore = 0;
  if (input.currentSemesterGpa < 4.5) {
    gpaScore += 13 + ((4.5 - input.currentSemesterGpa) / 4.5) * 3; // 13 - 16
    factors.push(`Critically low current GPA (${input.currentSemesterGpa.toFixed(2)} / 10.0)`);
  } else if (input.currentSemesterGpa < 6.0) {
    gpaScore += 7 + ((6.0 - input.currentSemesterGpa) / 1.5) * 6; // 7 - 13
    factors.push(`Below-average academic GPA (${input.currentSemesterGpa.toFixed(2)} / 10.0)`);
  } else if (input.currentSemesterGpa < 7.5) {
    gpaScore += ((7.5 - input.currentSemesterGpa) / 1.5) * 5; // 0 - 5
  }

  const gpaDrop = input.previousSemesterGpa - input.currentSemesterGpa;
  let gpaTrendPenalty = 0;
  if (gpaDrop >= 1.5) {
    gpaTrendPenalty = 5;
    factors.push(`Sharp GPA decline of ${gpaDrop.toFixed(2)} points from previous semester`);
  } else if (gpaDrop >= 0.75) {
    gpaTrendPenalty = 3;
    factors.push(`Noticeable GPA drop (${gpaDrop.toFixed(2)} points) compared to last semester`);
  } else if (gpaDrop >= 0.3) {
    gpaTrendPenalty = 1;
  }

  const compositeEval = input.internalMarks * 0.45 + input.examPerformance * 0.55;
  let evalPenalty = 0;
  if (compositeEval < 45) {
    evalPenalty = 9;
    factors.push(`Poor internal & exam performance (${Math.round(compositeEval)}% composite average)`);
  } else if (compositeEval < 60) {
    evalPenalty = 6;
    factors.push(`Weak assessment scores (${Math.round(compositeEval)}% composite average)`);
  } else if (compositeEval < 75) {
    evalPenalty = 2;
  }

  const totalAcademicPoints = clamp(Math.round(gpaScore + gpaTrendPenalty + evalPenalty), 0, 30);

  // 3. Number of Backlogs (Max 20 pts)
  let backlogPoints = 0;
  if (input.backlogs >= 4) {
    backlogPoints = 20;
    factors.push(`Severe backlog load (${input.backlogs} active backlogs)`);
  } else if (input.backlogs === 3) {
    backlogPoints = 16;
    factors.push('Multiple active backlogs (3 subjects pending)');
  } else if (input.backlogs === 2) {
    backlogPoints = 11;
    factors.push('Accumulated backlogs (2 subjects pending)');
  } else if (input.backlogs === 1) {
    backlogPoints = 6;
    factors.push('Single active backlog (1 subject requiring clearance)');
  }

  // 4. Assignment Submission Percentage (Max 12 pts)
  let assignmentPoints = 0;
  if (input.assignmentSubmission < 50) {
    assignmentPoints = 10 + ((50 - input.assignmentSubmission) / 50) * 2;
    factors.push(`Very low assignment submission rate (${input.assignmentSubmission}%)`);
  } else if (input.assignmentSubmission < 70) {
    assignmentPoints = 5 + ((70 - input.assignmentSubmission) / 20) * 4;
    factors.push(`Inconsistent assignment completion (${input.assignmentSubmission}%)`);
  } else if (input.assignmentSubmission < 85) {
    assignmentPoints = ((85 - input.assignmentSubmission) / 15) * 3;
  }
  assignmentPoints = clamp(Math.round(assignmentPoints), 0, 12);

  // 5. Socio-Economic, Extracurricular & Resource Factors (Max 8 pts)
  let supportPoints = 0;
  if (input.familyIncomeCategory === 'Low Income' && input.scholarshipStatus === 'None') {
    supportPoints += 4;
    factors.push('Financial strain risk (low-income bracket without scholarship support)');
  } else if (input.familyIncomeCategory === 'Low Income' && input.scholarshipStatus === 'Partial Scholarship') {
    supportPoints += 2;
  }

  if (input.learningResourcesAccess === 'Limited') {
    supportPoints += 3;
    factors.push('Limited access to computing or digital learning resources');
  } else if (input.learningResourcesAccess === 'Adequate') {
    supportPoints += 1;
  }

  if (input.extracurricularParticipation === 'None') {
    supportPoints += 1;
  }
  supportPoints = clamp(supportPoints, 0, 8);

  const rawTotal =
    totalAttendancePoints +
    totalAcademicPoints +
    backlogPoints +
    assignmentPoints +
    supportPoints;

  const riskScore = clamp(Math.round(rawTotal), 0, 100);
  const riskCategory = classifyRiskScore(riskScore);

  // Build personalized recommendations based on specific triggered dimensions & risk category
  if (totalAttendancePoints >= 14) {
    recommendations.push('Monitor attendance weekly with automated advisor check-ins and guardian alerts.');
  } else if (totalAttendancePoints >= 7) {
    recommendations.push('Review missed class sessions and verify scheduling or commute barriers.');
  }

  if (totalAcademicPoints >= 15 || input.backlogs >= 2) {
    recommendations.push('Arrange structured peer tutoring and remedial bridge classes for backlog subjects.');
  } else if (totalAcademicPoints >= 8 || input.backlogs === 1) {
    recommendations.push('Schedule bi-weekly academic coaching focused on internal assessment preparation.');
  }

  if (assignmentPoints >= 6) {
    recommendations.push('Set incremental milestone deadlines for coursework and track lab/assignment submissions.');
  }

  if (input.familyIncomeCategory === 'Low Income' && input.scholarshipStatus !== 'Full Scholarship') {
    recommendations.push('Connect student with financial aid office for institutional scholarships or fee waivers.');
  }

  if (input.learningResourcesAccess === 'Limited') {
    recommendations.push('Provide priority campus library laptop lending, study-lab hours, and offline material kits.');
  }

  if (riskCategory === 'High Risk') {
    recommendations.unshift('Provide immediate 1-on-1 academic & personal counselling within 5 working days.');
    recommendations.push('Create a documented Individual Student Improvement Plan (ISIP) with faculty mentor sign-off.');
  } else if (riskCategory === 'Medium Risk') {
    recommendations.unshift('Assign a dedicated faculty mentor for bi-weekly progress reviews.');
    recommendations.push('Monitor internal assessment marks closely ahead of mid-semester examinations.');
  } else {
    if (factors.length === 0) {
      factors.push('Strong attendance, consistent coursework submission, and healthy GPA trajectory.');
    }
    recommendations.push('Continue regular semester academic monitoring and mid-term progress check-ins.');
    recommendations.push('Encourage leadership in clubs, hackathons, or peer-mentoring initiatives.');
  }

  // Deduplicate recommendations cleanly
  const uniqueRecommendations = Array.from(new Set(recommendations));

  const contributions: WeightContribution[] = [
    {
      dimension: 'Attendance & Absenteeism',
      score: totalAttendancePoints,
      maxScore: 30,
      summary: `${input.attendancePercentage}% attendance · ${input.daysAbsent} days absent`,
    },
    {
      dimension: 'Academic Performance',
      score: totalAcademicPoints,
      maxScore: 30,
      summary: `GPA ${input.currentSemesterGpa.toFixed(2)} (prev ${input.previousSemesterGpa.toFixed(2)}) · ${Math.round(compositeEval)}% eval`,
    },
    {
      dimension: 'Backlog Burden',
      score: backlogPoints,
      maxScore: 20,
      summary: `${input.backlogs} active ${input.backlogs === 1 ? 'backlog' : 'backlogs'}`,
    },
    {
      dimension: 'Assignment Engagement',
      score: assignmentPoints,
      maxScore: 12,
      summary: `${input.assignmentSubmission}% submission rate`,
    },
    {
      dimension: 'Support & Resources',
      score: supportPoints,
      maxScore: 8,
      summary: `${input.scholarshipStatus} · ${input.learningResourcesAccess} resources`,
    },
  ];

  return {
    riskScore,
    riskCategory,
    identifiedFactors: factors,
    recommendations: uniqueRecommendations,
    contributions,
    modelEngine: 'Weighted Scoring Model (v1.0)',
    isMachineLearningModel: false,
    analyzedAt: new Date().toISOString(),
  };
}

export const defaultWeightedAdapter: PredictionEngineAdapter = {
  engineName: 'Weighted Scoring Model (v1.0)',
  isMachineLearningModel: false,
  async predict(input: StudentInput): Promise<PredictionResult> {
    return calculateWeightedDropoutRisk(input);
  },
};

/**
 * Future ML API integration entry point:
 * Swap `defaultWeightedAdapter` with an HTTP adapter calling `POST /api/ml/predict`
 * without altering any UI components or local state management.
 */
export async function predictDropoutRisk(
  input: StudentInput,
  adapter: PredictionEngineAdapter = defaultWeightedAdapter
): Promise<PredictionResult> {
  return adapter.predict(input);
}
