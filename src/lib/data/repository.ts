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
import { supabaseSyncService } from "../supabase/sync-service";

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

const STORAGE_KEY = "constructiq_db_v5";

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
    profiles: initialProfiles.map((p) => ({ ...p, assigned_project_ids: p.assigned_project_ids ? [...p.assigned_project_ids] : undefined })),
    projects: initialProjects.map((p) => ({ ...p })),
    memberships: initialProjectMemberships.map((m) => ({ ...m })),
    hierarchy: [...initialHierarchy],
    activities: initialActivities.map((a) => ({ ...a })),
    dependencies: [...initialDependencies],
    materials: initialMaterials.map((m) => ({ ...m })),
    stockMovements: initialStockMovements.map((s) => ({ ...s })),
    dailyLogs: initialDailyLogs.map((d) => ({ ...d })),
    dailyLogActivities: initialDailyLogActivities.map((da) => ({ ...da })),
    evidence: initialEvidence.map((e) => ({ ...e, tags: e.tags ? [...e.tags] : [] })),
    expenses: initialExpenses.map((ex) => ({ ...ex })),
    inspections: [...initialInspections],
    qualityIssues: [...initialQualityIssues],
    safetyObservations: [...initialSafetyObservations],
    correctiveActions: [...initialCorrectiveActions],
    notifications: [...initialNotifications],
    auditLogs: [...initialAuditLogs],
    attendance: [...initialAttendance],
    dismissedRisks: {},
  };
}

let memoryState: StoreState = getInitialState();

function saveState() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
      window.dispatchEvent(new CustomEvent("constructiq-data-update"));
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

  getProfileById(userId: string): Profile | undefined {
    return memoryState.profiles.find((p) => p.id === userId);
  },

  createProfile(data: {
    full_name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
    assigned_project_ids?: string[];
  }): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = (data.email || "").trim().toLowerCase();
    if (!cleanEmail || !data.full_name) {
      return { success: false, error: "Full name and email are required." };
    }

    const existing = memoryState.profiles.find((p) => (p.email || "").toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: `A user with email ${cleanEmail} already exists.` };
    }

    const newProfile: Profile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      full_name: data.full_name.trim(),
      role: data.role,
      password: data.password?.trim() || "Construct@123",
      phone: data.phone?.trim() || "",
      assigned_project_ids: data.assigned_project_ids || (memoryState.projects[0] ? [memoryState.projects[0].id] : []),
      created_at: new Date().toISOString(),
    };

    memoryState.profiles.push(newProfile);

    // If assigned projects, link memberships
    if (newProfile.assigned_project_ids && newProfile.assigned_project_ids.length > 0) {
      for (const prjId of newProfile.assigned_project_ids) {
        let memRole: "manager" | "engineer" | "supervisor" | "viewer" = "viewer";
        if (newProfile.role === "super_admin" || newProfile.role === "project_manager") memRole = "manager";
        else if (newProfile.role === "site_engineer") memRole = "engineer";
        else if (newProfile.role === "site_supervisor") memRole = "supervisor";

        memoryState.memberships.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          project_id: prjId,
          user_id: newProfile.id,
          project_role: memRole,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveState();
    return { success: true, user: newProfile };
  },

  updateProfile(
    userId: string,
    data: Partial<Omit<Profile, "id">>
  ): { success: boolean; user?: Profile; error?: string } {
    const profile = memoryState.profiles.find((p) => p.id === userId);
    if (!profile) {
      return { success: false, error: "User profile not found." };
    }

    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      const duplicate = memoryState.profiles.find(
        (p) => p.id !== userId && (p.email || "").toLowerCase() === cleanEmail
      );
      if (duplicate) {
        return { success: false, error: `Email ${cleanEmail} is already taken by another user.` };
      }
      profile.email = cleanEmail;
    }

    if (data.full_name !== undefined) profile.full_name = data.full_name.trim();
    if (data.role !== undefined) profile.role = data.role;
    if (data.password !== undefined && data.password.trim().length > 0) profile.password = data.password.trim();
    if (data.phone !== undefined) profile.phone = data.phone.trim();
    if (data.assigned_project_ids !== undefined) profile.assigned_project_ids = data.assigned_project_ids;

    // If current logged in user was modified, sync session
    if (memoryState.currentUserId === userId) {
      memoryState.currentUserRole = profile.role;
    }

    saveState();
    return { success: true, user: profile };
  },

  deleteProfile(userId: string): { success: boolean; error?: string } {
    const currentUser = this.getCurrentUser();
    if (currentUser.id === userId) {
      return { success: false, error: "Cannot delete your own active administrator account." };
    }

    const index = memoryState.profiles.findIndex((p) => p.id === userId);
    if (index === -1) {
      return { success: false, error: "User not found." };
    }

    memoryState.profiles.splice(index, 1);
    memoryState.memberships = memoryState.memberships.filter((m) => m.user_id !== userId);

    saveState();
    return { success: true };
  },

  // Authenticate user with email and password
  authenticate(
    email: string,
    password: string
  ): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // 1. Look up profile by email from active state
    let profile = memoryState.profiles.find(
      (p) => (p.email || "").toLowerCase() === cleanEmail
    );

    // Fallback for default super admin if not found in state
    if (!profile && cleanEmail === "adityabirare01@gmail.com") {
      profile = initialProfiles[0];
      memoryState.profiles.unshift(profile);
    }

    if (!profile) {
      return {
        success: false,
        error: `No user account found for ${cleanEmail}. Please check email or ask Admin to assign you.`,
      };
    }

    // Check password: match profile.password (or default fallback Aditya@123 if cleanEmail is default admin)
    const expectedPassword = profile.password || (cleanEmail === "adityabirare01@gmail.com" ? "Aditya@123" : "");
    if (expectedPassword && expectedPassword !== cleanPass) {
      return {
        success: false,
        error: cleanEmail === "adityabirare01@gmail.com"
          ? "Incorrect password for Super Administrator."
          : "Incorrect password for this account.",
      };
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
    supabaseSyncService.autoSaveRecord("projects", newProject);
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
    supabaseSyncService.autoSaveRecord("hierarchy_nodes", node);
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
    supabaseSyncService.autoSaveRecord("activities", activity);
    return activity;
  },

  updateActivity(activityId: string, updates: Partial<Activity>): Activity | undefined {
    const index = memoryState.activities.findIndex((a) => a.id === activityId);
    if (index === -1) return undefined;
    memoryState.activities[index] = { ...memoryState.activities[index], ...updates };
    saveState();
    supabaseSyncService.autoSaveRecord("activities", memoryState.activities[index]);
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
    supabaseSyncService.autoSaveRecord("daily_logs", newLog);
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
          supabaseSyncService.autoSaveRecord("activities", targetActivity);
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
    supabaseSyncService.autoSaveRecord("daily_logs", log);
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
    supabaseSyncService.autoSaveRecord("daily_attendance", item);
    return item;
  },

  deleteAttendance(id: string) {
    if (!memoryState.attendance) return;
    memoryState.attendance = memoryState.attendance.filter((a) => a.id !== id);
    saveState();
    supabaseSyncService.autoDeleteRecord("daily_attendance", id);
  },

  // Evidence Management
  getEvidence(projectId: string, filterByRole: boolean = true): EvidenceFile[] {
    const role = this.getCurrentUserRole();
    return memoryState.evidence
      .filter((e) => {
        if (e.project_id !== projectId) return false;
        // If current user is Project Manager, hide supervisor uploads that haven't been approved by Site Engineer
        if (filterByRole && role === "project_manager") {
          const isSupervisor = e.uploader_role === "site_supervisor" || 
            memoryState.profiles.some((p) => p.id === e.uploader_id && p.role === "site_supervisor");
          if (isSupervisor && (e.approval_status === "pending_engineer" || (!e.approval_status && e.review_status !== "verified"))) {
            return false; // Hidden from Project Manager until Site Engineer approves!
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  },

  getAllEvidence(projectId: string): EvidenceFile[] {
    return this.getEvidence(projectId, false);
  },

  addEvidence(data: Omit<EvidenceFile, "id" | "uploaded_at" | "review_status"> & { id?: string; review_status?: EvidenceFile["review_status"] }): EvidenceFile {
    const user = this.getCurrentUser();
    const isSupervisor = (data.uploader_role === "site_supervisor") || (user && user.role === "site_supervisor");

    const evidence: EvidenceFile = {
      ...data,
      id: data.id || `ev-${Date.now()}`,
      uploader_role: isSupervisor ? "site_supervisor" : (data.uploader_role || user?.role || "site_engineer"),
      review_status: isSupervisor ? (data.review_status || "unreviewed") : (data.review_status || "verified"),
      approval_status: isSupervisor ? (data.approval_status || "pending_engineer") : (data.approval_status || "approved"),
      uploaded_at: new Date().toISOString(),
    };
    memoryState.evidence.unshift(evidence);
    this.addAuditLog(evidence.project_id, "UPLOAD_EVIDENCE", "evidence", evidence.id, {
      title: evidence.title,
      type: evidence.evidence_type,
      approval_status: evidence.approval_status,
      uploaded_by_role: evidence.uploader_role,
    });

    if (isSupervisor) {
      // Notify Site Engineer that supervisor submitted photo/video for technical sign-off
      this.createNotification({
        user_id: "a0000000-0000-0000-0000-000000000003",
        project_id: evidence.project_id,
        title: "Supervisor Photo Awaiting Site Engineer Approval",
        message: `Supervisor uploaded "${evidence.title}". Please inspect and approve.`,
        type: "evidence_verification",
        link_url: `/app/projects/${evidence.project_id}/evidence`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("evidence_files", evidence);
    return evidence;
  },

  approveEvidenceByEngineer(evidenceId: string, engineerId?: string, notes?: string): EvidenceFile | null {
    const ev = memoryState.evidence.find((e) => e.id === evidenceId);
    if (!ev) return null;
    const user = this.getCurrentUser();
    const engId = engineerId || user?.id || "a0000000-0000-0000-0000-000000000003";

    ev.approval_status = "pending_manager";
    ev.review_status = "verified";
    ev.engineer_approved_by = engId;
    ev.engineer_approved_at = new Date().toISOString();
    if (notes) ev.engineer_notes = notes;

    this.addAuditLog(ev.project_id, "SITE_ENGINEER_APPROVE_PHOTO", "evidence", ev.id, {
      title: ev.title,
      approved_by: engId,
      notes: notes || "Physically approved on site by Site Engineer",
    });

    // Notify Project Manager that photo has been verified by Site Engineer and is now ready for PM sign-off
    this.createNotification({
      user_id: "a0000000-0000-0000-0000-000000000002",
      project_id: ev.project_id,
      title: "Photo Approved by Site Engineer (Awaiting PM Sign-off)",
      message: `Site Engineer approved "${ev.title}". Forwarded for Project Manager final authorization.`,
      type: "evidence_verification",
      link_url: `/app/projects/${ev.project_id}/evidence`,
    });

    saveState();
    supabaseSyncService.autoSaveRecord("evidence_files", ev);
    return ev;
  },

  approveEvidenceByManager(evidenceId: string, managerId?: string, notes?: string): EvidenceFile | null {
    const ev = memoryState.evidence.find((e) => e.id === evidenceId);
    if (!ev) return null;
    const user = this.getCurrentUser();
    const pmId = managerId || user?.id || "a0000000-0000-0000-0000-000000000002";

    ev.approval_status = "approved";
    ev.review_status = "verified";
    ev.manager_approved_by = pmId;
    ev.manager_approved_at = new Date().toISOString();
    if (notes) ev.manager_notes = notes;

    this.addAuditLog(ev.project_id, "PROJECT_MANAGER_APPROVE_PHOTO", "evidence", ev.id, {
      title: ev.title,
      approved_by: pmId,
      notes: notes || "Final sign-off by Project Manager",
    });

    if (ev.uploader_id) {
      this.createNotification({
        user_id: ev.uploader_id,
        project_id: ev.project_id,
        title: "Site Photo Authorized by Project Manager",
        message: `Your photo "${ev.title}" has received full approval from Project Manager.`,
        type: "evidence_verification",
        link_url: `/app/supervisor?tab=photos`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("evidence_files", ev);
    return ev;
  },

  rejectEvidence(evidenceId: string, rejectedById?: string, reason?: string): EvidenceFile | null {
    const ev = memoryState.evidence.find((e) => e.id === evidenceId);
    if (!ev) return null;
    const user = this.getCurrentUser();
    const userId = rejectedById || user?.id;

    ev.approval_status = "rejected";
    ev.review_status = "flagged";
    ev.rejection_reason = reason || "Declined during field inspection";

    this.addAuditLog(ev.project_id, "REJECT_PHOTO", "evidence", ev.id, {
      title: ev.title,
      rejected_by: userId,
      reason: ev.rejection_reason,
    });

    if (ev.uploader_id) {
      this.createNotification({
        user_id: ev.uploader_id,
        project_id: ev.project_id,
        title: "Photo Returned / Rejected",
        message: `Photo "${ev.title}" was not approved: ${ev.rejection_reason}`,
        type: "quality_alert",
        link_url: `/app/supervisor?tab=photos`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("evidence_files", ev);
    return ev;
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
    supabaseSyncService.autoSaveRecord("stock_movements", movement);
    supabaseSyncService.autoSaveRecord("materials", material);
    return { movement };
  },

  // Financials & Expenses
  getExpenses(projectId: string, filterByRole: boolean = true): Expense[] {
    const role = this.getCurrentUserRole();
    return memoryState.expenses
      .filter((e) => {
        if (e.project_id !== projectId) return false;
        // If current user is Project Manager, hide supervisor uploaded bills that haven't been approved by Site Engineer
        if (filterByRole && role === "project_manager") {
          const isSupervisor = e.uploader_role === "site_supervisor" ||
            memoryState.profiles.some((p) => p.id === e.uploader_id && p.role === "site_supervisor");
          if (isSupervisor && (e.status === "pending_engineer" || (e.status === "submitted" && !e.engineer_approved_by))) {
            return false; // Hidden from Project Manager until Site Engineer approves!
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  },

  getAllExpenses(projectId: string): Expense[] {
    return this.getExpenses(projectId, false);
  },

  addExpense(data: Omit<Expense, "id" | "created_at" | "status"> & { status?: Expense["status"] }): Expense {
    const user = this.getCurrentUser();
    const isSupervisor = (data.uploader_role === "site_supervisor") || (user && user.role === "site_supervisor");

    const expense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      uploader_role: isSupervisor ? "site_supervisor" : (data.uploader_role || user?.role || "project_manager"),
      status: isSupervisor ? (data.status || "pending_engineer") : (data.status || "approved"),
      created_at: new Date().toISOString(),
    };
    memoryState.expenses.unshift(expense);
    this.addAuditLog(expense.project_id, "ADD_EXPENSE", "expense", expense.id, {
      amount: expense.amount,
      category: expense.category,
      payee: expense.payee,
      status: expense.status,
      uploaded_by_role: expense.uploader_role,
    });

    if (isSupervisor) {
      // Notify Site Engineer that supervisor submitted bill for verification
      this.createNotification({
        user_id: "a0000000-0000-0000-0000-000000000003",
        project_id: expense.project_id,
        title: "Supervisor Bill Awaiting Site Engineer Review",
        message: `Supervisor submitted bill for ₹${expense.amount.toLocaleString()} (${expense.payee}). Requires Site Engineer approval.`,
        type: "financial_alert",
        link_url: `/app/projects/${expense.project_id}/financials`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("expenses", expense);
    return expense;
  },

  approveExpenseByEngineer(expenseId: string, engineerId?: string, notes?: string): Expense | null {
    const exp = memoryState.expenses.find((e) => e.id === expenseId);
    if (!exp) return null;
    const user = this.getCurrentUser();
    const engId = engineerId || user?.id || "a0000000-0000-0000-0000-000000000003";

    exp.status = "pending_manager";
    exp.engineer_approved_by = engId;
    exp.engineer_approved_at = new Date().toISOString();
    if (notes) exp.engineer_notes = notes;

    this.addAuditLog(exp.project_id, "SITE_ENGINEER_APPROVE_EXPENSE", "expense", exp.id, {
      payee: exp.payee,
      amount: exp.amount,
      approved_by: engId,
      notes: notes || "Voucher and site goods verified by Site Engineer",
    });

    // Notify Project Manager that bill is ready for payment authorization
    this.createNotification({
      user_id: "a0000000-0000-0000-0000-000000000002",
      project_id: exp.project_id,
      title: "Bill Approved by Site Engineer (Awaiting PM Sign-off)",
      message: `Site Engineer approved bill of ₹${exp.amount.toLocaleString()} (${exp.payee}). Forwarded for PM authorization.`,
      type: "financial_alert",
      link_url: `/app/projects/${exp.project_id}/financials`,
    });

    saveState();
    supabaseSyncService.autoSaveRecord("expenses", exp);
    return exp;
  },

  approveExpenseByManager(expenseId: string, managerId?: string, notes?: string): Expense | null {
    const exp = memoryState.expenses.find((e) => e.id === expenseId);
    if (!exp) return null;
    const user = this.getCurrentUser();
    const pmId = managerId || user?.id || "a0000000-0000-0000-0000-000000000002";

    exp.status = "approved";
    exp.approved_by = pmId;
    exp.manager_approved_by = pmId;
    exp.manager_approved_at = new Date().toISOString();
    if (notes) exp.manager_notes = notes;

    this.addAuditLog(exp.project_id, "PROJECT_MANAGER_APPROVE_EXPENSE", "expense", exp.id, {
      payee: exp.payee,
      amount: exp.amount,
      approved_by: pmId,
      notes: notes || "Final disbursement approved by Project Manager",
    });

    if (exp.uploader_id) {
      this.createNotification({
        user_id: exp.uploader_id,
        project_id: exp.project_id,
        title: "Site Bill Authorized & Approved by PM",
        message: `Your site bill for ₹${exp.amount.toLocaleString()} (${exp.payee}) was approved for payment disbursement.`,
        type: "financial_alert",
        link_url: `/app/supervisor?tab=bills`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("expenses", exp);
    return exp;
  },

  rejectExpense(expenseId: string, rejectedById?: string, reason?: string): Expense | null {
    const exp = memoryState.expenses.find((e) => e.id === expenseId);
    if (!exp) return null;
    const user = this.getCurrentUser();
    const userId = rejectedById || user?.id;

    exp.status = "rejected";
    exp.rejection_reason = reason || "Declined during commercial audit";

    this.addAuditLog(exp.project_id, "REJECT_EXPENSE", "expense", exp.id, {
      payee: exp.payee,
      amount: exp.amount,
      rejected_by: userId,
      reason: exp.rejection_reason,
    });

    if (exp.uploader_id) {
      this.createNotification({
        user_id: exp.uploader_id,
        project_id: exp.project_id,
        title: "Site Bill Rejected / Returned",
        message: `Bill of ₹${exp.amount.toLocaleString()} (${exp.payee}) was not approved: ${exp.rejection_reason}`,
        type: "financial_alert",
        link_url: `/app/supervisor?tab=bills`,
      });
    }

    saveState();
    supabaseSyncService.autoSaveRecord("expenses", exp);
    return exp;
  },

  getSupervisorApprovalsSummary(projectId?: string) {
    const allEvidence = memoryState.evidence.filter((e) => !projectId || e.project_id === projectId);
    const allExpenses = memoryState.expenses.filter((e) => !projectId || e.project_id === projectId);

    const isSupervisor = (userId?: string, role?: string) =>
      role === "site_supervisor" || memoryState.profiles.some((p) => p.id === userId && p.role === "site_supervisor");

    const pendingEngineerPhotos = allEvidence.filter(
      (e) => isSupervisor(e.uploader_id, e.uploader_role) && e.approval_status === "pending_engineer"
    );

    const pendingEngineerBills = allExpenses.filter(
      (e) => isSupervisor(e.uploader_id, e.uploader_role) && e.status === "pending_engineer"
    );

    const pendingManagerPhotos = allEvidence.filter(
      (e) => isSupervisor(e.uploader_id, e.uploader_role) && e.approval_status === "pending_manager"
    );

    const pendingManagerBills = allExpenses.filter(
      (e) => isSupervisor(e.uploader_id, e.uploader_role) && e.status === "pending_manager"
    );

    const role = this.getCurrentUserRole();
    let currentRolePendingCount = 0;
    if (role === "site_engineer") {
      currentRolePendingCount = pendingEngineerPhotos.length + pendingEngineerBills.length;
    } else if (role === "project_manager") {
      currentRolePendingCount = pendingManagerPhotos.length + pendingManagerBills.length;
    } else if (role === "super_admin") {
      currentRolePendingCount =
        pendingEngineerPhotos.length + pendingEngineerBills.length + pendingManagerPhotos.length + pendingManagerBills.length;
    }

    return {
      pendingEngineerPhotos,
      pendingEngineerBills,
      pendingManagerPhotos,
      pendingManagerBills,
      engineerTotal: pendingEngineerPhotos.length + pendingEngineerBills.length,
      managerTotal: pendingManagerPhotos.length + pendingManagerBills.length,
      currentRolePendingCount,
    };
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
    supabaseSyncService.autoSaveRecord("quality_issues", issue);
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
    supabaseSyncService.autoSaveRecord("safety_observations", observation);
    return observation;
  },

  resolveCorrectiveAction(actionId: string, verifiedBy: string): CorrectiveAction | undefined {
    const item = memoryState.correctiveActions.find((c) => c.id === actionId);
    if (!item) return undefined;
    item.status = "verified_closed";
    item.completed_at = new Date().toISOString();
    item.verified_by = verifiedBy;
    saveState();
    supabaseSyncService.autoSaveRecord("corrective_actions", item);
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

  // Remote Hydration from Supabase Cloud
  async hydrateFromSupabase(): Promise<{ success: boolean; message: string; remoteCounts?: Record<string, number> }> {
    try {
      const res = await supabaseSyncService.pullRemoteData();
      if (!res.success || !res.data) {
        return { success: false, message: res.error || "Failed to pull remote Supabase data" };
      }
      const d = res.data;
      let updated = false;

      if (Array.isArray(d.projects) && d.projects.length > 0) {
        const projectMap = new Map(memoryState.projects.map((p) => [p.id, p]));
        for (const rp of d.projects) {
          projectMap.set(rp.id, { ...projectMap.get(rp.id), ...rp });
        }
        memoryState.projects = Array.from(projectMap.values());
        updated = true;
      }

      if (Array.isArray(d.hierarchy) && d.hierarchy.length > 0) {
        const hMap = new Map(memoryState.hierarchy.map((h) => [h.id, h]));
        for (const rh of d.hierarchy) {
          hMap.set(rh.id, { ...hMap.get(rh.id), ...rh });
        }
        memoryState.hierarchy = Array.from(hMap.values());
        updated = true;
      }

      if (Array.isArray(d.activities) && d.activities.length > 0) {
        const actMap = new Map(memoryState.activities.map((a) => [a.id, a]));
        for (const ra of d.activities) {
          actMap.set(ra.id, { ...actMap.get(ra.id), ...ra });
        }
        memoryState.activities = Array.from(actMap.values());
        updated = true;
      }

      if (Array.isArray(d.materials) && d.materials.length > 0) {
        const matMap = new Map(memoryState.materials.map((m) => [m.id, m]));
        for (const rm of d.materials) {
          matMap.set(rm.id, { ...matMap.get(rm.id), ...rm });
        }
        memoryState.materials = Array.from(matMap.values());
        updated = true;
      }

      if (Array.isArray(d.stockMovements) && d.stockMovements.length > 0) {
        const smMap = new Map(memoryState.stockMovements.map((s) => [s.id, s]));
        for (const rsm of d.stockMovements) {
          smMap.set(rsm.id, { ...smMap.get(rsm.id), ...rsm });
        }
        memoryState.stockMovements = Array.from(smMap.values());
        updated = true;
      }

      if (Array.isArray(d.dailyLogs) && d.dailyLogs.length > 0) {
        const dlMap = new Map(memoryState.dailyLogs.map((l) => [l.id, l]));
        for (const rdl of d.dailyLogs) {
          dlMap.set(rdl.id, { ...dlMap.get(rdl.id), ...rdl });
        }
        memoryState.dailyLogs = Array.from(dlMap.values());
        updated = true;
      }

      if (Array.isArray(d.attendance) && d.attendance.length > 0) {
        const attMap = new Map(memoryState.attendance.map((a: any) => [a.id, a]));
        for (const ratt of d.attendance) {
          attMap.set(ratt.id, { ...attMap.get(ratt.id), ...ratt });
        }
        memoryState.attendance = Array.from(attMap.values());
        updated = true;
      }

      if (Array.isArray(d.expenses) && d.expenses.length > 0) {
        const expMap = new Map(memoryState.expenses.map((e) => [e.id, e]));
        for (const re of d.expenses) {
          expMap.set(re.id, { ...expMap.get(re.id), ...re });
        }
        memoryState.expenses = Array.from(expMap.values());
        updated = true;
      }

      if (Array.isArray(d.evidence) && d.evidence.length > 0) {
        const evMap = new Map(memoryState.evidence.map((e) => [e.id, e]));
        for (const rev of d.evidence) {
          evMap.set(rev.id, { ...evMap.get(rev.id), ...rev });
        }
        memoryState.evidence = Array.from(evMap.values());
        updated = true;
      }

      if (Array.isArray(d.qualityIssues) && d.qualityIssues.length > 0) {
        const qiMap = new Map(memoryState.qualityIssues.map((q) => [q.id, q]));
        for (const rqi of d.qualityIssues) {
          qiMap.set(rqi.id, { ...rqi.get(rqi.id), ...rqi });
        }
        memoryState.qualityIssues = Array.from(qiMap.values());
        updated = true;
      }

      if (Array.isArray(d.safetyObservations) && d.safetyObservations.length > 0) {
        const safeMap = new Map(memoryState.safetyObservations.map((s) => [s.id, s]));
        for (const rsafe of d.safetyObservations) {
          safeMap.set(rsafe.id, { ...safeMap.get(rsafe.id), ...rsafe });
        }
        memoryState.safetyObservations = Array.from(safeMap.values());
        updated = true;
      }

      if (updated) {
        saveState();
      }

      return {
        success: true,
        message: "Successfully synchronized with Supabase live cloud",
        remoteCounts: {
          projects: d.projects?.length || 0,
          activities: d.activities?.length || 0,
          materials: d.materials?.length || 0,
          expenses: d.expenses?.length || 0,
        },
      };
    } catch (err: any) {
      console.warn("[Repository] Hydration from Supabase error:", err);
      return { success: false, message: err?.message || String(err) };
    }
  },
};
