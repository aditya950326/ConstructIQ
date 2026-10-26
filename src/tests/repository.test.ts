import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { repository } from "../lib/data/repository";

describe("ConstructIQ Core Repository & Workflows", () => {
  beforeEach(() => {
    repository.resetDemoData();
  });

  test("loads seeded projects and activities reliably", () => {
    const projects = repository.getProjects();
    assert.ok(projects.length >= 2, "Should load at least two demonstration projects");

    const riverside = repository.getProjectById(projects[0].id);
    assert.ok(riverside !== undefined, "Riverside project should exist");

    const activities = repository.getActivities(riverside.id);
    assert.ok(activities.length > 0, "Riverside should have configured activities");
  });

  test("approving daily log increases activity verified quantity without double-counting", () => {
    const projects = repository.getProjects();
    const projectId = projects[0].id;

    // Pick an in_progress activity
    const activity = repository.getActivities(projectId).find((a) => a.code === "ACT-104");
    assert.ok(activity !== undefined, "ACT-104 columns should exist");
    const initialVerified = activity.verified_quantity;

    // Create a new daily log for ACT-104
    const newLog = repository.createDailyLog(
      {
        project_id: projectId,
        log_date: "2026-10-24",
        author_id: "a0000000-0000-0000-0000-000000000003",
        weather_condition: "sunny",
        workforce_count: 25,
        status: "submitted",
      },
      [
        {
          activity_id: activity.id,
          reported_quantity: 4,
          work_performed: "Casting 4 additional columns",
        },
      ]
    );

    assert.strictEqual(newLog.status, "submitted");

    // Review and Approve the log
    repository.reviewDailyLog(newLog.id, "approve", "a0000000-0000-0000-0000-000000000002", "Quality verified");

    // Verify activity's verified_quantity was updated by 4
    const updatedActivity = repository.getActivityById(activity.id);
    assert.ok(updatedActivity !== undefined);
    assert.strictEqual(updatedActivity.verified_quantity, initialVerified + 4);

    // Call review again with approve to test duplicate prevention
    repository.reviewDailyLog(newLog.id, "approve", "a0000000-0000-0000-0000-000000000002", "Re-approval attempt");

    const doubleCheckActivity = repository.getActivityById(activity.id);
    assert.ok(doubleCheckActivity !== undefined);
    assert.strictEqual(
      doubleCheckActivity.verified_quantity,
      initialVerified + 4,
      "Double approval should not count verified quantity twice!"
    );
  });

  test("rejects stock movement that causes negative inventory", () => {
    const projects = repository.getProjects();
    const materials = repository.getMaterials(projects[0].id);
    const rebar = materials[0];

    // Try to issue more stock than currently available
    const excessiveIssue = rebar.current_stock + 500;
    const result = repository.recordStockMovement({
      project_id: projects[0].id,
      material_id: rebar.id,
      movement_type: "issue",
      quantity: excessiveIssue,
      unit_cost: rebar.unit_cost,
      reference_no: "TEST-INV-NEG",
      performed_by: "a0000000-0000-0000-0000-000000000003",
    });

    assert.ok(result.error !== undefined, "Should reject negative stock issue");
    assert.ok(result.error?.includes("Insufficient stock"));
  });

  test("calculates project progress and overdue counts accurately", () => {
    const projects = repository.getProjects();
    const metrics = repository.getProjectMetrics(projects[0].id);

    assert.ok(metrics.actualPercent >= 0 && metrics.actualPercent <= 100);
    assert.ok(metrics.plannedPercent >= 0 && metrics.plannedPercent <= 100);
    assert.ok(metrics.totalApprovedBudget > 0);
  });

  test("authenticates default admin adityabirare01@gmail.com with password Aditya@123", () => {
    const authSuccess = repository.authenticate("adityabirare01@gmail.com", "Aditya@123");
    assert.strictEqual(authSuccess.success, true);
    assert.ok(authSuccess.user);
    assert.strictEqual(authSuccess.user.role, "super_admin");
    assert.strictEqual(authSuccess.user.email, "adityabirare01@gmail.com");

    const authFail = repository.authenticate("adityabirare01@gmail.com", "WrongPassword");
    assert.strictEqual(authFail.success, false);
    assert.ok(authFail.error?.includes("Incorrect password"));
  });

  test("admin assigns project manager with email and password, and PM gets access to project data", () => {
    const projects = repository.getAllProjects();
    const targetProject = projects[0];

    const assignResult = repository.assignProjectManager(targetProject.id, {
      fullName: "Vikram Rathore",
      email: "vikram.pm@site.com",
      password: "Vikram@123",
      phone: "+91 99887 76655",
    });

    assert.strictEqual(assignResult.success, true);
    assert.ok(assignResult.user);
    assert.strictEqual(assignResult.user.role, "project_manager");

    // Authenticate as the new project manager
    const pmAuth = repository.authenticate("vikram.pm@site.com", "Vikram@123");
    assert.strictEqual(pmAuth.success, true);
    assert.strictEqual(repository.getCurrentUserRole(), "project_manager");

    // Check project access for this PM
    const pmProjects = repository.getProjects();
    assert.ok(pmProjects.some((p) => p.id === targetProject.id));

    // PM can assign Site Engineer and Site Supervisor
    const engResult = repository.assignSitePersonnel(targetProject.id, "site_engineer", {
      fullName: "Neha Sharma",
      email: "neha.eng@site.com",
      password: "Neha@123",
      phone: "+91 98111 22334",
    });
    assert.strictEqual(engResult.success, true);

    const supResult = repository.assignSitePersonnel(targetProject.id, "site_supervisor", {
      fullName: "Ganesh Mane",
      email: "ganesh.sup@site.com",
      password: "Ganesh@123",
      phone: "+91 98222 33445",
    });
    assert.strictEqual(supResult.success, true);

    const members = repository.getProjectMembers(targetProject.id);
    assert.strictEqual(members.projectManager?.email, "vikram.pm@site.com");
    assert.ok(members.siteEngineers.some((e) => e.email === "neha.eng@site.com"));
    assert.ok(members.siteSupervisors.some((s) => s.email === "ganesh.sup@site.com"));
  });

  test("supports adding and retrieving video evidence", () => {
    const projects = repository.getProjects();
    const projectId = projects[0].id;

    const videoEvidence = repository.addEvidence({
      project_id: projectId,
      evidence_type: "video",
      title: "Drone 4K Site Flyover",
      description: "Aerial footage of Tower Alpha top floor casting",
      uploader_id: "a0000000-0000-0000-0000-000000000001",
      file_path: "https://example.com/site-drone.mp4",
      file_type: "video/mp4",
      file_size_bytes: 25000000,
      review_status: "verified",
      tags: ["drone", "video", "flyover"],
    });

    assert.ok(videoEvidence.id);
    assert.strictEqual(videoEvidence.evidence_type, "video");

    const allEvidence = repository.getEvidence(projectId);
    const found = allEvidence.find((e) => e.id === videoEvidence.id);
    assert.ok(found);
    assert.strictEqual(found.evidence_type, "video");
  });

  test("two-tier approval workflow: supervisor photos and bills require Site Engineer approval before showing to Project Manager", () => {
    const projects = repository.getProjects();
    const projectId = projects[0].id;
    const supervisorId = "a0000000-0000-0000-0000-000000000004";
    const engineerId = "a0000000-0000-0000-0000-000000000003";
    const managerId = "a0000000-0000-0000-0000-000000000002";

    // 1. Supervisor uploads a photo
    repository.setCurrentUserRole("site_supervisor");
    const newPhoto = repository.addEvidence({
      project_id: projectId,
      evidence_type: "photo",
      title: "Column C7 Shuttering Line Test",
      description: "Plumb line alignment test by supervisor",
      uploader_id: supervisorId,
      uploader_role: "site_supervisor",
      file_path: "https://example.com/c7.jpg",
      file_type: "image/jpeg",
      file_size_bytes: 1048576,
      tags: ["formwork"],
    });

    // 2. Supervisor uploads a bill
    const newBill = repository.addExpense({
      project_id: projectId,
      category: "Materials",
      expense_date: "2026-10-24",
      amount: 4500,
      currency: "INR",
      payee: "Shree Ganesh Hardware",
      description: "Chalk line dori and plumb bobs",
      uploader_id: supervisorId,
      uploader_role: "site_supervisor",
    });

    assert.strictEqual(newPhoto.approval_status, "pending_engineer");
    assert.strictEqual(newBill.status, "pending_engineer");

    // 3. Check visibility for Site Engineer: Site Engineer CAN see them
    repository.setCurrentUserRole("site_engineer");
    const engEvidence = repository.getEvidence(projectId);
    const engExpenses = repository.getExpenses(projectId);
    assert.ok(engEvidence.some((e) => e.id === newPhoto.id), "Site engineer must see pending photo");
    assert.ok(engExpenses.some((b) => b.id === newBill.id), "Site engineer must see pending bill");

    // 4. Check visibility for Project Manager: PM MUST NOT see them yet!
    repository.setCurrentUserRole("project_manager");
    const pmEvidenceBefore = repository.getEvidence(projectId);
    const pmExpensesBefore = repository.getExpenses(projectId);
    assert.strictEqual(
      pmEvidenceBefore.some((e) => e.id === newPhoto.id),
      false,
      "Project Manager MUST NOT see photo before Site Engineer approves"
    );
    assert.strictEqual(
      pmExpensesBefore.some((b) => b.id === newBill.id),
      false,
      "Project Manager MUST NOT see bill before Site Engineer approves"
    );

    // 5. Site Engineer physically approves the photo and bill
    repository.setCurrentUserRole("site_engineer");
    const approvedPhotoByEng = repository.approveEvidenceByEngineer(newPhoto.id, engineerId, "Alignment verified");
    const approvedBillByEng = repository.approveExpenseByEngineer(newBill.id, engineerId, "Hardware verified");

    assert.strictEqual(approvedPhotoByEng?.approval_status, "pending_manager");
    assert.strictEqual(approvedBillByEng?.status, "pending_manager");

    // 6. Check visibility for Project Manager: NOW it shows to Project Manager!
    repository.setCurrentUserRole("project_manager");
    const pmEvidenceAfter = repository.getEvidence(projectId);
    const pmExpensesAfter = repository.getExpenses(projectId);
    assert.ok(
      pmEvidenceAfter.some((e) => e.id === newPhoto.id),
      "Project Manager must now see photo after Site Engineer approval"
    );
    assert.ok(
      pmExpensesAfter.some((b) => b.id === newBill.id),
      "Project Manager must now see bill after Site Engineer approval"
    );

    // 7. Project Manager physically approves both
    const finalPhoto = repository.approveEvidenceByManager(newPhoto.id, managerId, "Sign-off authorized");
    const finalBill = repository.approveExpenseByManager(newBill.id, managerId, "Disbursement approved");

    assert.strictEqual(finalPhoto?.approval_status, "approved");
    assert.strictEqual(finalPhoto?.review_status, "verified");
    assert.strictEqual(finalBill?.status, "approved");
  });
});
