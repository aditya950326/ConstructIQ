import {
  Activity,
  ActivityDependency,
  DailyLog,
  Material,
  QualityIssue,
  SafetyObservation,
  DelayRisk,
  RiskLevel,
} from "@/types/database";

export interface RiskEvaluationContext {
  activities: Activity[];
  dependencies: ActivityDependency[];
  materials: Material[];
  dailyLogs: DailyLog[];
  qualityIssues: QualityIssue[];
  safetyObservations: SafetyObservation[];
}

export interface RiskAnalysisResult {
  activityId: string;
  projectId: string;
  riskLevel: RiskLevel;
  score: number;
  ruleTriggered: string;
  varianceDays: number;
  evidenceSummary: string;
  recommendedAction: string;
}

/**
 * Deterministic Explainable Delay-Risk Engine
 * Evaluates progress variance, overdue status, dependencies, material stock, and defects.
 */
export function evaluateActivityRisk(
  activity: Activity,
  context: RiskEvaluationContext
): RiskAnalysisResult | null {
  if (activity.status === "completed" || activity.status === "cancelled") {
    return null;
  }

  const today = new Date();
  const plannedStart = new Date(activity.start_date);
  const plannedFinish = new Date(activity.planned_finish_date);
  
  let riskScore = 0;
  const triggeredRules: string[] = [];
  const evidencePoints: string[] = [];
  const actions: string[] = [];

  // 1. RULE: Overdue Schedule Check
  const msPerDay = 1000 * 60 * 60 * 24;
  let varianceDays = 0;
  
  if (today > plannedFinish) {
    varianceDays = Math.ceil((today.getTime() - plannedFinish.getTime()) / msPerDay);
    if (varianceDays > 7) {
      riskScore += 45;
      triggeredRules.push("RULE-01: Critical Schedule Breach (>7 Days Overdue)");
      evidencePoints.push(`Exceeded planned completion by ${varianceDays} days`);
      actions.push("Conduct immediate schedule compression review and re-baseline critical path.");
    } else if (varianceDays > 0) {
      riskScore += 25;
      triggeredRules.push("RULE-01: Schedule Slippage Overdue");
      evidencePoints.push(`Currently ${varianceDays} days past planned finish date (${activity.planned_finish_date})`);
      actions.push("Expedite daily shift targets and deploy auxiliary resources.");
    }
  }

  // 2. RULE: Progress Quantity Deficit
  if (activity.planned_quantity > 0) {
    const progressPercent = (activity.verified_quantity / activity.planned_quantity) * 100;
    const totalDuration = Math.max(1, (plannedFinish.getTime() - plannedStart.getTime()) / msPerDay);
    const elapsedDuration = Math.max(0, (today.getTime() - plannedStart.getTime()) / msPerDay);
    const expectedProgressPercent = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

    const quantityDeficit = expectedProgressPercent - progressPercent;
    if (quantityDeficit > 30) {
      riskScore += 30;
      triggeredRules.push("RULE-02: Severe Physical Quantity Lag (>30% Deficit)");
      evidencePoints.push(`Verified ${activity.verified_quantity} ${activity.unit} (${progressPercent.toFixed(1)}%) vs planned expected ${expectedProgressPercent.toFixed(1)}%`);
      actions.push(`Increase production rate from current velocity to recover ${(activity.planned_quantity - activity.verified_quantity).toFixed(1)} ${activity.unit}.`);
    } else if (quantityDeficit > 15) {
      riskScore += 15;
      triggeredRules.push("RULE-02: Moderate Physical Quantity Deficit");
      evidencePoints.push(`Verified progress is ${quantityDeficit.toFixed(1)}% behind time elapsed`);
      actions.push("Review daily manpower logs to verify gang productivity.");
    }
  }

  // 3. RULE: Predecessor Dependency Blockers
  const predecessors = context.dependencies.filter((d) => d.activity_id === activity.id);
  for (const dep of predecessors) {
    const predActivity = context.activities.find((a) => a.id === dep.predecessor_id);
    if (predActivity && predActivity.status !== "completed") {
      riskScore += 35;
      triggeredRules.push(`RULE-03: Blocked by Unfinished Predecessor (${predActivity.code})`);
      evidencePoints.push(`Predecessor '${predActivity.name}' (${predActivity.code}) is still ${predActivity.status} (${predActivity.verified_quantity}/${predActivity.planned_quantity} ${predActivity.unit})`);
      actions.push(`Expedite sign-off of predecessor ${predActivity.code} before proceeding.`);
    }
  }

  // 4. RULE: Critical Material Shortage
  // Check if any materials match project scope and have stock < minimum
  const lowMaterials = context.materials.filter((m) => m.current_stock < m.minimum_stock_level);
  if (lowMaterials.length > 0 && activity.status === "in_progress") {
    const mat = lowMaterials[0];
    riskScore += 25;
    triggeredRules.push(`RULE-04: Material Stock Buffer Depletion (${mat.name})`);
    evidencePoints.push(`Material stock for '${mat.name}' is ${mat.current_stock} ${mat.unit} (minimum buffer is ${mat.minimum_stock_level} ${mat.unit})`);
    actions.push(`Expedite purchase order dispatch for ${mat.name} to avoid site stoppage.`);
  }

  // 5. RULE: Open Quality Defects & Safety Stops
  const openQuality = context.qualityIssues.filter(
    (q) => q.activity_id === activity.id && (q.severity === "high" || q.severity === "critical") && q.status !== "resolved" && q.status !== "closed"
  );
  if (openQuality.length > 0) {
    riskScore += 25;
    triggeredRules.push(`RULE-05: Critical Quality Non-Conformance (${openQuality[0].title})`);
    evidencePoints.push(`Open defect: "${openQuality[0].title}" (${openQuality[0].severity} severity) awaiting resolution`);
    actions.push(`Complete required corrective action for quality defect before next pour or stage.`);
  }

  // Determine Risk Category
  let riskLevel: RiskLevel = "low";
  if (riskScore >= 65) {
    riskLevel = "critical";
  } else if (riskScore >= 40) {
    riskLevel = "high";
  } else if (riskScore >= 20) {
    riskLevel = "moderate";
  } else {
    // If score is negligible, no significant risk flag
    return null;
  }

  return {
    activityId: activity.id,
    projectId: activity.project_id,
    riskLevel,
    score: riskScore,
    ruleTriggered: triggeredRules.join("; "),
    varianceDays,
    evidenceSummary: evidencePoints.join(" • "),
    recommendedAction: actions.join(" "),
  };
}

/**
 * Evaluates all activities in a project and returns an array of delay risks.
 */
export function evaluateProjectDelayRisks(context: RiskEvaluationContext): DelayRisk[] {
  const risks: DelayRisk[] = [];

  for (const activity of context.activities) {
    const analysis = evaluateActivityRisk(activity, context);
    if (analysis) {
      risks.push({
        id: `risk-${activity.id}`,
        project_id: activity.project_id,
        activity_id: activity.id,
        risk_level: analysis.riskLevel,
        calculated_at: new Date().toISOString(),
        rule_triggered: analysis.ruleTriggered,
        variance_days: analysis.varianceDays,
        evidence_summary: analysis.evidenceSummary,
        recommended_action: analysis.recommendedAction,
        acknowledgement_status: "unacknowledged",
      });
    }
  }

  return risks;
}
