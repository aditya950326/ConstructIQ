import {
  Profile,
  Project,
  ProjectMembership,
  HierarchyNode,
  Activity,
  ActivityDependency,
  DailyLog,
  DailyLogActivity,
  EvidenceFile,
  Material,
  StockMovement,
  Expense,
  Inspection,
  QualityIssue,
  SafetyObservation,
  CorrectiveAction,
  DelayRisk,
  NotificationItem,
  AuditLog,
  UserRole,
  DailyAttendance,
} from "@/types/database";

import {
  initialProfiles,
  initialProjects,
  initialProjectMemberships,
  initialHierarchy,
  initialActivities,
  initialDependencies,
  initialMaterials,
  initialStockMovements,
  initialDailyLogs,
  initialDailyLogActivities,
  initialEvidence,
  initialExpenses,
  initialInspections,
  initialQualityIssues,
  initialSafetyObservations,
  initialCorrectiveActions,
  initialNotifications,
  initialAuditLogs,
  initialAttendance,
} from "./mock-data";

import { evaluateProjectDelayRisks } from "../intelligence/risk-engine";

interface StoreState {
  currentUserRole: UserRole;
  currentUserId?: string;
  profiles: Profile[];
  projects: Project[];
  memberships: ProjectMembership[];
  hierarchy: HierarchyNode[];
  activities: Activity[];
  dependencies: ActivityDependency[];
  materials: Material[];
  stockMovements: StockMovement[];
  dailyLogs: DailyLog[];
  dailyLogActivities: DailyLogActivity[];
  evidence: EvidenceFile[];
  expenses: Expense[];
  inspections: Inspection[];
  qualityIssues: QualityIssue[];
  safetyObservations: SafetyObservation[];
  correctiveActions: CorrectiveAction[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  attendance: DailyAttendance[];
  dismissedRisks: Record<string, string>; // riskId -> reason
}

const STORAGE_KEY = "constructiq_db_v4";

function getInitialState(): StoreState {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoreState = JSON.parse(stored);
        
        // Ensure default admin is set to adityabirare01@gmail.com with Aditya@123
        if (parsed.profiles && Array.isArray(parsed.profiles)) {
          const adminProf = parsed.profiles.find((p) => p.role === "super_admin");
          if (adminProf) {
            adminProf.email = "adityabirare01@gmail.com";
            adminProf.password = "Aditya@123";
            adminProf.full_name = "Aditya Birare";
          } else {
            parsed.profiles.unshift(initialProfiles[0]);
          }

          // Ensure passwords exist on other standard demo profiles if missing
          for (const initP of initialProfiles) {
            const existing = parsed.profiles.find((p) => p.id === initP.id || p.email === initP.email);
            if (existing && !existing.password && initP.password) {
              existing.password = initP.password;
            }
          }
        } else {
          parsed.profiles = initialProfiles;
        }

        // Ensure memberships exist
        if (!parsed.memberships || !Array.isArray(parsed.memberships)) {
          parsed.memberships = initialProjectMemberships;
        }

        // Ensure attendance exists
        if (!parsed.attendance || !Array.isArray(parsed.attendance)) {
          parsed.attendance = initialAttendance;
        }

        // Ensure video sample evidence exists
        if (parsed.evidence && !parsed.evidence.some((e) => e.evidence_type === "video")) {
          const videoItems = initialEvidence.filter((e) => e.evidence_type === "video");
          parsed.evidence.push(...videoItems);
        }

        return parsed;
      }
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
    }
  }

  return {
    currentUserRole: "super_admin",
    currentUserId: "a0000000-0000-0000-0000-000000000001",
    profiles: initialProfiles,
    projects: initialProjects,
    memberships: initialProjectMemberships,
    hierarchy: initialHierarchy,
    activities: initialActivities,
    dependencies: initialDependencies,
    materials: initialMaterials,
    stockMovements: initialStockMovements,
    dailyLogs: initialDailyLogs,
    dailyLogActivities: initialDailyLogActivities,
    evidence: initialEvidence,
    expenses: initialExpenses,
    inspections: initialInspections,
    qualityIssues: initialQualityIssues,
    safetyObservations: initialSafetyObservations,
    correctiveActions: initialCorrectiveActions,
    notifications: initialNotifications,
    auditLogs: initialAuditLogs,
    attendance: initialAttendance,
    dismissedRisks: {},
  };
}

let memoryState: StoreState = getInitialState();

function saveState() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS
// -------------------------------------------------------------

export const repository = {
  // Current Session & Role
  getCurrentUser(): Profile {
    // Re-sync with localStorage if in browser
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.currentUserRole) {
            memoryState.currentUserRole = parsed.currentUserRole;
          }
          if (parsed.currentUserId) {
            memoryState.currentUserId = parsed.currentUserId;
          }
        }
      } catch (e) {}
    }

    if (memoryState.currentUserId) {
      const byId = memoryState.profiles.find((p) => p.id === memoryState.currentUserId);
      if (byId) return byId;
    }

    const role = memoryState.currentUserRole || "super_admin";
    return (
      memoryState.profiles.find((p) => p.role === role) ||
      initialProfiles.find((p) => p.role === role) ||
      memoryState.profiles[0]
    );
  },

  getCurrentUserRole(): UserRole {
    return memoryState.currentUserRole || "super_admin";
  },

  getProfiles(): Profile[] {
    return memoryState.profiles && memoryState.profiles.length > 0
      ? memoryState.profiles
      : initialProfiles;
  },

  setCurrentUser(user: Profile) {
    memoryState.currentUserId = user.id;
    memoryState.currentUserRole = user.role;
    saveState();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("constructiq-role-change", { detail: user.role }));
    }
  },

  setCurrentUserRole(role: UserRole) {
    memoryState.currentUserRole = role;
    const matchingProfile = memoryState.profiles.find((p) => p.role === role);
    if (matchingProfile) {
      memoryState.currentUserId = matchingProfile.id;
    }
    saveState();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("constructiq-role-change", { detail: role }));
    }
  },

  // Authenticate user with email and password
  authenticate(
    email: string,
    password: string
  ): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Default Super Admin hardcoded rule: adityabirare01@gmail.com / Aditya@123
    if (cleanEmail === "adityabirare01@gmail.com") {
      if (cleanPass === "Aditya@123") {
        let admin = memoryState.profiles.find((p) => p.role === "super_admin");
        if (!admin) {
          admin = initialProfiles[0];
          memoryState.profiles.unshift(admin);
        }
        admin.email = "adityabirare01@gmail.com";
        admin.password = "Aditya@123";
        this.setCurrentUser(admin);
        return { success: true, user: admin };
      } else {
        return { success: false, error: "Incorrect password for Super Administrator." };
      }
    }

    // Lookup profile by email (case-insensitive)
    const profile = memoryState.profiles.find(
      (p) => (p.email || "").toLowerCase() === cleanEmail
    );

    if (!profile) {
      return {
        success: false,
        error: `No user account found for ${cleanEmail}. Please check email or ask Admin to assign you.`,
      };
    }

    // Check password if set
    if (profile.password && profile.password !== cleanPass) {
      return { success: false, error: "Incorrect password for this account." };
    }

    // Set current active user & session
    this.setCurrentUser(profile);
    return { success: true, user: profile };
  },

  logout() {
    memoryState.currentUserId = undefined;
    memoryState.currentUserRole = "super_admin";
    saveState();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("constructiq-role-change", { detail: "logout" }));
    }
  },

  // Reset to initial baseline data
  restoreBaselineData() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    memoryState = getInitialState();
    saveState();
  },

  resetDemoData() {
    this.restoreBaselineData();
  },

  // Export full site database as JSON for archiving & PMC submission
  exportSiteDataJson(): string {
    return JSON.stringify(memoryState, null, 2);
  },

  // Import full site database from JSON backup
  importSiteDataJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.profiles)) {
        memoryState = parsed;
        saveState();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to parse site backup JSON:", e);
      return false;
    }
  },

  // Projects Access Control
  // Admin has access to watch working projects (e.g. Project 1 and active projects).
  // Assigned Project Manager has access to their assigned project(s).
  // Site Engineer & Supervisor have access to their assigned project(s).
  getProjects(): Project[] {
    const user = this.getCurrentUser();
    
    // Super Admin has access to watch all working projects
    if (user.role === "super_admin") {
      return memoryState.projects;
    }

    // Project Manager: only assigned projects
    if (user.role === "project_manager") {
      const pmMemberships = new Set(
        memoryState.memberships
          .filter((m) => m.user_id === user.id && m.project_role === "manager")
          .map((m) => m.project_id)
      );
      const userAssigned = new Set(user.assigned_project_ids || []);

      const assignedProjects = memoryState.projects.filter(
        (p) => p.project_manager_id === user.id || pmMemberships.has(p.id) || userAssigned.has(p.id)
      );

      // If newly logged in demo PM, default to Project 1 (Riverside)
      return assignedProjects.length > 0 ? assignedProjects : [memoryState.projects[0]];
    }

    // Site Engineer or Supervisor: only their assigned project(s)
    const assignedIds = new Set([
      ...(user.assigned_project_ids || []),
      ...memoryState.memberships
        .filter((m) => m.user_id === user.id)
        .map((m) => m.project_id),
    ]);

    const userProjects = memoryState.projects.filter((p) => assignedIds.has(p.id));
    return userProjects.length > 0 ? userProjects : [memoryState.projects[0]];
  },

  // Unfiltered projects list for admin portfolio view
  getAllProjects(): Project[] {
    return memoryState.projects;
  },

  // Project Members & Team Assignments
  getProjectMembers(projectId: string): {
    projectManager?: Profile;
    siteEngineers: Profile[];
    siteSupervisors: Profile[];
    allMembers: Profile[];
  } {
    const project = memoryState.projects.find((p) => p.id === projectId);
    const memberships = memoryState.memberships.filter((m) => m.project_id === projectId);
    
    // Project Manager
    let projectManager = memoryState.profiles.find((p) => p.id === project?.project_manager_id);
    if (!projectManager) {
      const pmMem = memberships.find((m) => m.project_role === "manager");
      if (pmMem) {
        projectManager = memoryState.profiles.find((p) => p.id === pmMem.user_id);
      }
    }
    if (!projectManager) {
      projectManager = memoryState.profiles.find((p) => p.role === "project_manager");
    }

    // Site Engineers
    const engIds = new Set(
      memberships.filter((m) => m.project_role === "engineer").map((m) => m.user_id)
    );
    const siteEngineers = memoryState.profiles.filter(
      (p) =>
        p.role === "site_engineer" &&
        (engIds.has(p.id) || p.assigned_project_ids?.includes(projectId))
    );

    // Site Supervisors
    const supIds = new Set(
      memberships.filter((m) => m.project_role === "supervisor").map((m) => m.user_id)
    );
    const siteSupervisors = memoryState.profiles.filter(
      (p) =>
        p.role === "site_supervisor" &&
        (supIds.has(p.id) || p.assigned_project_ids?.includes(projectId))
    );

    const allMembers = [
      ...(projectManager ? [projectManager] : []),
      ...siteEngineers,
      ...siteSupervisors,
    ];

    return {
      projectManager,
      siteEngineers,
      siteSupervisors,
      allMembers,
    };
  },

  // Admin assigns Project Manager to a particular project with email & password
  assignProjectManager(
    projectId: string,
    data: { fullName: string; email: string; password: string; phone?: string }
  ): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = (data.email || "").trim().toLowerCase();
    if (!cleanEmail || !data.password || !data.fullName) {
      return { success: false, error: "Full Name, Email, and Password are required." };
    }

    const project = memoryState.projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: "Project not found." };

    // Check if profile exists
    let pmProfile = memoryState.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (pmProfile) {
      pmProfile.full_name = data.fullName.trim();
      pmProfile.password = data.password.trim();
      pmProfile.role = "project_manager";
      if (data.phone) pmProfile.phone = data.phone.trim();
      if (!pmProfile.assigned_project_ids) pmProfile.assigned_project_ids = [];
      if (!pmProfile.assigned_project_ids.includes(projectId)) {
        pmProfile.assigned_project_ids.push(projectId);
      }
    } else {
      pmProfile = {
        id: `usr-pm-${Date.now()}`,
        email: cleanEmail,
        password: data.password.trim(),
        full_name: data.fullName.trim(),
        role: "project_manager",
        phone: data.phone?.trim() || "",
        assigned_project_ids: [projectId],
        created_at: new Date().toISOString(),
      };
      memoryState.profiles.push(pmProfile);
    }

    // Set as project manager on project
    project.project_manager_id = pmProfile.id;

    // Update or add membership
    const existingMem = memoryState.memberships.find(
      (m) => m.project_id === projectId && m.project_role === "manager"
    );
    if (existingMem) {
      existingMem.user_id = pmProfile.id;
    } else {
      memoryState.memberships.push({
        id: `mem-${Date.now()}`,
        project_id: projectId,
        user_id: pmProfile.id,
        project_role: "manager",
        created_at: new Date().toISOString(),
      });
    }

    this.addAuditLog(projectId, "ASSIGN_PROJECT_MANAGER", "project", projectId, {
      managerName: pmProfile.full_name,
      managerEmail: pmProfile.email,
    });

    saveState();
    return { success: true, user: pmProfile };
  },

  // Admin or Project Manager assigns Site Engineer or Site Supervisor with details
  assignSitePersonnel(
    projectId: string,
    role: "site_engineer" | "site_supervisor",
    data: { fullName: string; email: string; password: string; phone?: string }
  ): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = (data.email || "").trim().toLowerCase();
    if (!cleanEmail || !data.password || !data.fullName) {
      return { success: false, error: "Full Name, Email, and Password are required." };
    }

    const project = memoryState.projects.find((p) => p.id === projectId);
    if (!project) return { success: false, error: "Project not found." };

    let personnelProfile = memoryState.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (personnelProfile) {
      personnelProfile.full_name = data.fullName.trim();
      personnelProfile.password = data.password.trim();
      personnelProfile.role = role;
      if (data.phone) personnelProfile.phone = data.phone.trim();
      if (!personnelProfile.assigned_project_ids) personnelProfile.assigned_project_ids = [];
      if (!personnelProfile.assigned_project_ids.includes(projectId)) {
        personnelProfile.assigned_project_ids.push(projectId);
      }
    } else {
      personnelProfile = {
        id: `usr-${role === "site_engineer" ? "eng" : "sup"}-${Date.now()}`,
        email: cleanEmail,
        password: data.password.trim(),
        full_name: data.fullName.trim(),
        role,
        phone: data.phone?.trim() || "",
        assigned_project_ids: [projectId],
        created_at: new Date().toISOString(),
      };
      memoryState.profiles.push(personnelProfile);
    }

    // Add membership
    const memRole = role === "site_engineer" ? "engineer" : "supervisor";
    const existing = memoryState.memberships.find(
      (m) => m.project_id === projectId && m.user_id === personnelProfile!.id && m.project_role === memRole
    );
    if (!existing) {
      memoryState.memberships.push({
        id: `mem-${Date.now()}`,
        project_id: projectId,
        user_id: personnelProfile.id,
        project_role: memRole,
        created_at: new Date().toISOString(),
      });
    }

    this.addAuditLog(
      projectId,
      role === "site_engineer" ? "ASSIGN_SITE_ENGINEER" : "ASSIGN_SITE_SUPERVISOR",
      "project",
      projectId,
      {
        personnelName: personnelProfile.full_name,
        personnelEmail: personnelProfile.email,
        role,
      }
    );

    saveState();
    return { success: true, user: personnelProfile };
  },

  // Remove member from project
  removeProjectPersonnel(projectId: string, userId: string) {
    memoryState.memberships = memoryState.memberships.filter(
      (m) => !(m.project_id === projectId && m.user_id === userId)
    );
    const profile = memoryState.profiles.find((p) => p.id === userId);
    if (profile && profile.assigned_project_ids) {
      profile.assigned_project_ids = profile.assigned_project_ids.filter((id) => id !== projectId);
    }
    saveState();
  },

  getProjectById(projectId: string): Project | undefined {
    return memoryState.projects.find((p) => p.id === projectId);
  },

  createProject(data: Omit<Project, "id" | "created_at">): Project {
    const newProject: Project = {
      ...data,
      id: `prj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.projects.unshift(newProject);
    this.addAuditLog(newProject.id, "CREATE_PROJECT", "project", newProject.id, {
      name: newProject.name,
      code: newProject.code,
    });
    saveState();
    return newProject;
  },

  // Hierarchy Nodes
  getHierarchy(projectId: string): HierarchyNode[] {
    return memoryState.hierarchy
      .filter((h) => h.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  addHierarchyNode(data: Omit<HierarchyNode, "id" | "created_at">): HierarchyNode {
    const node: HierarchyNode = {
      ...data,
      id: `node-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.hierarchy.push(node);
    this.addAuditLog(node.project_id, "ADD_HIERARCHY_NODE", "hierarchy_node", node.id, {
      name: node.name,
      type: node.node_type,
    });
    saveState();
    return node;
  },

  // Activities
  getActivities(projectId: string): Activity[] {
    return memoryState.activities.filter((a) => a.project_id === projectId);
  },

  getActivityById(activityId: string): Activity | undefined {
    return memoryState.activities.find((a) => a.id === activityId);
  },

  createActivity(data: Omit<Activity, "id" | "created_at">): Activity {
    const activity: Activity = {
      ...data,
      id: `act-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.activities.push(activity);
    this.addAuditLog(activity.project_id, "CREATE_ACTIVITY", "activity", activity.id, {
      code: activity.code,
      name: activity.name,
    });
    saveState();
    return activity;
  },

  updateActivity(activityId: string, updates: Partial<Activity>): Activity | undefined {
    const index = memoryState.activities.findIndex((a) => a.id === activityId);
    if (index === -1) return undefined;
    memoryState.activities[index] = { ...memoryState.activities[index], ...updates };
    saveState();
    return memoryState.activities[index];
  },

  getDependencies(projectId: string): ActivityDependency[] {
    const activityIds = new Set(this.getActivities(projectId).map((a) => a.id));
    return memoryState.dependencies.filter((d) => activityIds.has(d.activity_id));
  },

  // Daily Site Logs & Progress Verification Workflow
  getDailyLogs(projectId: string): DailyLog[] {
    return memoryState.dailyLogs
      .filter((l) => l.project_id === projectId)
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  },

  getDailyLogActivities(dailyLogId: string): DailyLogActivity[] {
    return memoryState.dailyLogActivities.filter((dla) => dla.daily_log_id === dailyLogId);
  },

  createDailyLog(
    logData: Omit<DailyLog, "id" | "created_at">,
    activitiesData: Array<{ activity_id: string; reported_quantity: number; work_performed: string; blockers?: string }>
  ): DailyLog {
    const newLog: DailyLog = {
      ...logData,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.dailyLogs.unshift(newLog);

    for (const act of activitiesData) {
      memoryState.dailyLogActivities.push({
        id: `dla-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        daily_log_id: newLog.id,
        activity_id: act.activity_id,
        reported_quantity: act.reported_quantity,
        work_performed: act.work_performed,
        blockers: act.blockers,
        verification_status: "pending",
      });
    }

    this.addAuditLog(newLog.project_id, "CREATE_DAILY_LOG", "daily_log", newLog.id, {
      date: newLog.log_date,
      status: newLog.status,
    });
    saveState();
    return newLog;
  },

  reviewDailyLog(
    logId: string,
    action: "approve" | "reject",
    reviewerId: string,
    reviewNotes?: string
  ): DailyLog | undefined {
    const log = memoryState.dailyLogs.find((l) => l.id === logId);
    if (!log) return undefined;

    // Prevent duplicate approval counting
    const wasAlreadyApproved = log.status === "approved";

    log.status = action === "approve" ? "approved" : "rejected";
    log.reviewed_by = reviewerId;
    log.review_notes = reviewNotes;
    log.reviewed_at = new Date().toISOString();

    // If approved, update verified_quantity on each associated activity
    if (action === "approve" && !wasAlreadyApproved) {
      const logActivities = memoryState.dailyLogActivities.filter((d) => d.daily_log_id === logId);
      for (const dla of logActivities) {
        dla.verification_status = "approved";
        dla.verified_quantity = dla.reported_quantity;

        const targetActivity = memoryState.activities.find((a) => a.id === dla.activity_id);
        if (targetActivity) {
          targetActivity.verified_quantity = Math.min(
            targetActivity.planned_quantity,
            targetActivity.verified_quantity + dla.reported_quantity
          );
          if (targetActivity.verified_quantity >= targetActivity.planned_quantity) {
            targetActivity.status = "completed";
            targetActivity.actual_finish_date = log.log_date;
          } else {
            targetActivity.status = "in_progress";
            if (!targetActivity.actual_start_date) {
              targetActivity.actual_start_date = log.log_date;
            }
          }
        }
      }
    } else if (action === "reject") {
      const logActivities = memoryState.dailyLogActivities.filter((d) => d.daily_log_id === logId);
      for (const dla of logActivities) {
        dla.verification_status = "rejected";
      }
    }

    this.addAuditLog(
      log.project_id,
      action === "approve" ? "APPROVE_DAILY_LOG" : "REJECT_DAILY_LOG",
      "daily_log",
      log.id,
      { reviewNotes }
    );
    saveState();
    return log;
  },

  // Daily Employee Attendance (Supervisor Work 1)
  getAttendance(projectId?: string, date?: string): DailyAttendance[] {
    let list = memoryState.attendance || [];
    if (projectId) {
      list = list.filter((a) => a.project_id === projectId);
    }
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  recordAttendance(data: Omit<DailyAttendance, "id" | "created_at">): DailyAttendance {
    const item: DailyAttendance = {
      ...data,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    if (!memoryState.attendance) memoryState.attendance = [];
    memoryState.attendance.unshift(item);
    this.addAuditLog(item.project_id, "RECORD_ATTENDANCE", "attendance", item.id, {
      category: item.labor_category,
      headcount: item.headcount,
      shift: item.shift,
    });
    saveState();
    return item;
  },

  deleteAttendance(id: string) {
    if (!memoryState.attendance) return;
    memoryState.attendance = memoryState.attendance.filter((a) => a.id !== id);
    saveState();
  },

  // Evidence Management
  getEvidence(projectId: string): EvidenceFile[] {
    return memoryState.evidence
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  },

  addEvidence(data: Omit<EvidenceFile, "id" | "uploaded_at"> & { id?: string }): EvidenceFile {
    const evidence: EvidenceFile = {
      ...data,
      id: data.id || `ev-${Date.now()}`,
      uploaded_at: new Date().toISOString(),
    };
    memoryState.evidence.unshift(evidence);
    this.addAuditLog(evidence.project_id, "UPLOAD_EVIDENCE", "evidence", evidence.id, {
      title: evidence.title,
      type: evidence.evidence_type,
    });
    saveState();
    return evidence;
  },

  // Materials & Inventory Ledger
  getMaterials(projectId: string): Material[] {
    return memoryState.materials.filter((m) => m.project_id === projectId);
  },

  getStockMovements(projectId: string): StockMovement[] {
    return memoryState.stockMovements
      .filter((sm) => sm.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  recordStockMovement(
    data: Omit<StockMovement, "id" | "created_at" | "total_cost">
  ): { movement?: StockMovement; error?: string } {
    const material = memoryState.materials.find((m) => m.id === data.material_id);
    if (!material) return { error: "Material not found" };

    // Prevent negative stock unless receipt
    const delta = data.movement_type === "receipt" || data.movement_type === "return" 
      ? Math.abs(data.quantity) 
      : -Math.abs(data.quantity);

    if (material.current_stock + delta < 0) {
      return {
        error: `Insufficient stock! Current stock is ${material.current_stock} ${material.unit}, cannot deduct ${Math.abs(data.quantity)} ${material.unit}.`,
      };
    }

    material.current_stock += delta;

    const movement: StockMovement = {
      ...data,
      id: `sm-${Date.now()}`,
      quantity: delta,
      total_cost: Math.abs(delta) * data.unit_cost,
      created_at: new Date().toISOString(),
    };

    memoryState.stockMovements.unshift(movement);

    // If stock dropped below minimum, create low-stock notification
    if (material.current_stock < material.minimum_stock_level) {
      this.createNotification({
        user_id: "a0000000-0000-0000-0000-000000000002",
        project_id: data.project_id,
        title: `Low Stock Alert: ${material.name}`,
        message: `Current stock (${material.current_stock} ${material.unit}) is below minimum buffer (${material.minimum_stock_level} ${material.unit}).`,
        type: "material_shortage",
        link_url: `/app/projects/${data.project_id}/materials`,
      });
    }

    this.addAuditLog(data.project_id, "RECORD_STOCK_MOVEMENT", "stock_movement", movement.id, {
      material: material.name,
      delta,
      newStock: material.current_stock,
    });
    saveState();
    return { movement };
  },

  // Financials & Expenses
  getExpenses(projectId: string): Expense[] {
    return memoryState.expenses
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  },

  addExpense(data: Omit<Expense, "id" | "created_at">): Expense {
    const expense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.expenses.unshift(expense);
    this.addAuditLog(expense.project_id, "ADD_EXPENSE", "expense", expense.id, {
      amount: expense.amount,
      category: expense.category,
      payee: expense.payee,
    });
    saveState();
    return expense;
  },

  // Quality, Safety, Corrective Actions
  getInspections(projectId: string): Inspection[] {
    return memoryState.inspections.filter((i) => i.project_id === projectId);
  },

  getQualityIssues(projectId: string): QualityIssue[] {
    return memoryState.qualityIssues.filter((q) => q.project_id === projectId);
  },

  getSafetyObservations(projectId: string): SafetyObservation[] {
    return memoryState.safetyObservations.filter((s) => s.project_id === projectId);
  },

  getCorrectiveActions(projectId: string): CorrectiveAction[] {
    return memoryState.correctiveActions.filter((c) => c.project_id === projectId);
  },

  addQualityIssue(data: Omit<QualityIssue, "id" | "created_at">): QualityIssue {
    const issue: QualityIssue = {
      ...data,
      id: `qi-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    memoryState.qualityIssues.unshift(issue);
    saveState();
    return issue;
  },

  addSafetyObservation(data: Omit<SafetyObservation, "id" | "reported_at">): SafetyObservation {
    const observation: SafetyObservation = {
      ...data,
      id: `safe-${Date.now()}`,
      reported_at: new Date().toISOString(),
    };
    memoryState.safetyObservations.unshift(observation);
    saveState();
    return observation;
  },

  resolveCorrectiveAction(actionId: string, verifiedBy: string): CorrectiveAction | undefined {
    const item = memoryState.correctiveActions.find((c) => c.id === actionId);
    if (!item) return undefined;
    item.status = "verified_closed";
    item.completed_at = new Date().toISOString();
    item.verified_by = verifiedBy;
    saveState();
    return item;
  },

  // Explainable Delay-Risk Engine Integration
  getProjectDelayRisks(projectId: string): DelayRisk[] {
    const activities = this.getActivities(projectId);
    const dependencies = this.getDependencies(projectId);
    const materials = this.getMaterials(projectId);
    const dailyLogs = this.getDailyLogs(projectId);
    const qualityIssues = this.getQualityIssues(projectId);
    const safetyObservations = this.getSafetyObservations(projectId);

    // Run deterministic intelligence engine
    const computedRisks = evaluateProjectDelayRisks({
      activities,
      dependencies,
      materials,
      dailyLogs,
      qualityIssues,
      safetyObservations,
    });

    // Apply any user acknowledgements or dismissals
    return computedRisks.map((r) => {
      if (memoryState.dismissedRisks[r.id]) {
        return {
          ...r,
          acknowledgement_status: "dismissed",
          dismissed_reason: memoryState.dismissedRisks[r.id],
        };
      }
      return r;
    });
  },

  dismissRiskAlert(riskId: string, reason: string) {
    memoryState.dismissedRisks[riskId] = reason;
    saveState();
  },

  // Calculated Project Metrics
  getProjectMetrics(projectId: string) {
    const project = this.getProjectById(projectId);
    const activities = this.getActivities(projectId);
    const materials = this.getMaterials(projectId);
    const expenses = this.getExpenses(projectId);
    const quality = this.getQualityIssues(projectId);
    const safety = this.getSafetyObservations(projectId);
    const risks = this.getProjectDelayRisks(projectId);
    const logs = this.getDailyLogs(projectId);

    // Weighted Planned vs Verified Actual Progress
    let totalWeight = 0;
    let actualWeightedProgress = 0;
    let plannedWeightedProgress = 0;
    let overdueCount = 0;
    const today = new Date();

    for (const act of activities) {
      const weight = act.weight_percent || 1;
      totalWeight += weight;

      const actActualRatio = act.planned_quantity > 0 ? act.verified_quantity / act.planned_quantity : 0;
      actualWeightedProgress += Math.min(1, actActualRatio) * weight;

      // Planned expected progress based on dates
      const start = new Date(act.start_date).getTime();
      const finish = new Date(act.planned_finish_date).getTime();
      const now = today.getTime();
      let plannedRatio = 0;
      if (now >= finish) {
        plannedRatio = 1;
      } else if (now > start && finish > start) {
        plannedRatio = (now - start) / (finish - start);
      }
      plannedWeightedProgress += Math.min(1, Math.max(0, plannedRatio)) * weight;

      if (now > finish && act.status !== "completed") {
        overdueCount++;
      }
    }

    const actualPercent = totalWeight > 0 ? (actualWeightedProgress / totalWeight) * 100 : 0;
    const plannedPercent = totalWeight > 0 ? (plannedWeightedProgress / totalWeight) * 100 : 0;

    // Financials
    const totalApprovedBudget = project?.approved_budget || 0;
    const totalExpenses = expenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.amount, 0);

    // Shortages
    const lowStockCount = materials.filter((m) => m.current_stock < m.minimum_stock_level).length;
    const openQualityCount = quality.filter((q) => q.status !== "resolved" && q.status !== "closed").length;
    const openSafetyCount = safety.filter((s) => s.status !== "closed").length;
    const pendingLogsCount = logs.filter((l) => l.status === "submitted").length;
    const highRiskCount = risks.filter((r) => r.risk_level === "high" || r.risk_level === "critical").length;

    return {
      actualPercent: Math.round(actualPercent * 10) / 10,
      plannedPercent: Math.round(plannedPercent * 10) / 10,
      variancePercent: Math.round((actualPercent - plannedPercent) * 10) / 10,
      overdueCount,
      totalApprovedBudget,
      totalExpenses,
      budgetConsumedPercent: totalApprovedBudget > 0 ? Math.round((totalExpenses / totalApprovedBudget) * 100) : 0,
      lowStockCount,
      openQualityCount,
      openSafetyCount,
      pendingLogsCount,
      highRiskCount,
      totalActivities: activities.length,
      completedActivities: activities.filter((a) => a.status === "completed").length,
    };
  },

  // Notifications
  getNotifications(userId?: string): NotificationItem[] {
    return memoryState.notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  markNotificationRead(notificationId: string) {
    const notif = memoryState.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.is_read = true;
      saveState();
    }
  },

  createNotification(data: Omit<NotificationItem, "id" | "created_at" | "is_read">) {
    memoryState.notifications.unshift({
      ...data,
      id: `notif-${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    saveState();
  },

  // Audit Logs
  getAuditLogs(projectId?: string): AuditLog[] {
    let logs = memoryState.auditLogs;
    if (projectId) {
      logs = logs.filter((l) => l.project_id === projectId);
    }
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addAuditLog(
    projectId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, any>
  ) {
    const user = this.getCurrentUser();
    memoryState.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      project_id: projectId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: JSON.stringify(details),
      created_at: new Date().toISOString(),
    });
    saveState();
  },

  // Global Search across entities
  search(query: string, projectId?: string) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      id: string;
      title: string;
      category: string;
      snippet: string;
      link: string;
    }> = [];

    // Search Projects
    for (const p of memoryState.projects) {
      if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          title: `${p.code} — ${p.name}`,
          category: "Project",
          snippet: p.description,
          link: `/app/projects/${p.id}`,
        });
      }
    }

    // Search Activities
    for (const a of memoryState.activities) {
      if (projectId && a.project_id !== projectId) continue;
      if (a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
        results.push({
          id: a.id,
          title: `${a.code}: ${a.name}`,
          category: "Activity",
          snippet: `${a.status.replace("_", " ")} • Planned ${a.planned_quantity} ${a.unit}`,
          link: `/app/projects/${a.project_id}/schedule`,
        });
      }
    }

    // Search Materials
    for (const m of memoryState.materials) {
      if (projectId && m.project_id !== projectId) continue;
      if (m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) {
        results.push({
          id: m.id,
          title: `${m.code}: ${m.name}`,
          category: "Material",
          snippet: `Stock: ${m.current_stock} ${m.unit} • Buffer: ${m.minimum_stock_level} ${m.unit}`,
          link: `/app/projects/${m.project_id}/materials`,
        });
      }
    }

    // Search Quality & Safety
    for (const qItem of memoryState.qualityIssues) {
      if (projectId && qItem.project_id !== projectId) continue;
      if (qItem.title.toLowerCase().includes(q) || qItem.description.toLowerCase().includes(q)) {
        results.push({
          id: qItem.id,
          title: `Defect: ${qItem.title}`,
          category: "Quality",
          snippet: `${qItem.severity} severity • ${qItem.status}`,
          link: `/app/projects/${qItem.project_id}/quality`,
        });
      }
    }

    for (const s of memoryState.safetyObservations) {
      if (projectId && s.project_id !== projectId) continue;
      if (s.title.toLowerCase().includes(q) || (s.immediate_action_taken && s.immediate_action_taken.toLowerCase().includes(q))) {
        results.push({
          id: s.id,
          title: `Safety: ${s.title}`,
          category: "Safety",
          snippet: `${s.risk_level} risk • ${s.observation_type}`,
          link: `/app/projects/${s.project_id}/safety`,
        });
      }
    }

    return results;
  },
};
