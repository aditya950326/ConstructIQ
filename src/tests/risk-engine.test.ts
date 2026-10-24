import { test, describe } from "node:test";
import assert from "node:assert";
import { evaluateActivityRisk, RiskEvaluationContext } from "../lib/intelligence/risk-engine";
import { Activity } from "../types/database";

describe("ConstructIQ Explainable Delay-Risk Engine", () => {
  const baseActivity: Activity = {
    id: "act-test-01",
    project_id: "prj-test",
    hierarchy_node_id: "node-1",
    code: "ACT-001",
    name: "Foundation Concreting",
    description: "Mass pour of foundation pad",
    responsible_id: "user-1",
    start_date: "2026-09-01",
    planned_finish_date: "2026-09-15", // In the past -> Overdue!
    planned_quantity: 100,
    verified_quantity: 40, // 40% vs 100% expected -> Severe deficit
    unit: "Cu.m",
    priority: "high",
    status: "in_progress",
    approval_required: true,
    evidence_required: true,
    created_at: "2026-08-01T00:00:00Z",
  };

  const dummyContext: RiskEvaluationContext = {
    activities: [baseActivity],
    dependencies: [],
    materials: [],
    dailyLogs: [],
    qualityIssues: [],
    safetyObservations: [],
  };

  test("correctly flags overdue activity and generates explainable rule details", () => {
    const risk = evaluateActivityRisk(baseActivity, dummyContext);

    assert.ok(risk !== null, "Risk should be detected for overdue activity with lag");
    assert.strictEqual(risk.activityId, "act-test-01");
    assert.ok(risk.varianceDays > 0, "Variance days should be greater than 0");
    assert.ok(risk.ruleTriggered.includes("RULE-01"), "Should trigger RULE-01 (Schedule Slippage)");
    assert.ok(risk.evidenceSummary.length > 0, "Evidence summary should not be empty");
    assert.ok(risk.recommendedAction.length > 0, "Recommended action should be provided");
  });

  test("returns null risk when activity is already completed", () => {
    const completedActivity: Activity = {
      ...baseActivity,
      status: "completed",
      verified_quantity: 100,
    };

    const risk = evaluateActivityRisk(completedActivity, dummyContext);
    assert.strictEqual(risk, null, "Completed activity should have no delay risk");
  });

  test("triggers RULE-03 when predecessor dependency is not completed", () => {
    const blockedActivity: Activity = {
      ...baseActivity,
      id: "act-test-02",
      start_date: "2026-11-01",
      planned_finish_date: "2026-11-10",
      status: "not_started",
    };

    const contextWithDep: RiskEvaluationContext = {
      ...dummyContext,
      activities: [baseActivity, blockedActivity],
      dependencies: [
        {
          id: "dep-1",
          activity_id: "act-test-02",
          predecessor_id: "act-test-01",
          dependency_type: "FS",
          lag_days: 0,
        },
      ],
    };

    const risk = evaluateActivityRisk(blockedActivity, contextWithDep);
    assert.ok(risk !== null, "Risk should be detected due to unfinished predecessor");
    assert.ok(risk.ruleTriggered.includes("RULE-03"), "Should trigger predecessor dependency rule");
  });

  test("triggers RULE-04 when critical material stock falls below threshold", () => {
    const contextWithLowStock: RiskEvaluationContext = {
      ...dummyContext,
      materials: [
        {
          id: "mat-1",
          project_id: "prj-test",
          code: "MAT-STL",
          name: "Reinforcement Steel",
          category: "Steel",
          unit: "Tonnes",
          unit_cost: 60000,
          minimum_stock_level: 20,
          current_stock: 5, // Below buffer!
          status: "active",
        },
      ],
    };

    const risk = evaluateActivityRisk(baseActivity, contextWithLowStock);
    assert.ok(risk !== null);
    assert.ok(risk.ruleTriggered.includes("RULE-04"), "Should flag material stock buffer depletion");
  });
});
