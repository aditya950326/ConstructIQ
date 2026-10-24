export type UserRole = "super_admin" | "project_manager" | "site_engineer" | "site_supervisor";

export interface DailyAttendance {
  id: string;
  project_id: string;
  date: string;
  supervisor_id: string;
  labor_category: string; // "Masons", "Carpenters", "Bar Benders", "Helpers", "Welder", "Electrician"
  headcount: number;
  shift: "day" | "night";
  contractor_name?: string;
  notes?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  assigned_project_ids?: string[];
  created_at: string;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "delayed" | "completed";

export interface Project {
  id: string;
  name: string;
  code: string;
  project_type: "residential" | "commercial" | "infrastructure" | "industrial";
  description: string;
  location: string;
  timezone: string;
  client: string;
  project_manager_id: string;
  start_date: string;
  planned_completion_date: string;
  actual_completion_date?: string;
  approved_budget: number;
  currency: string;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectMembership {
  id: string;
  project_id: string;
  user_id: string;
  project_role: "manager" | "engineer" | "supervisor" | "viewer";
  created_at: string;
}

export interface HierarchyNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  node_type: string; // "Block", "Floor", "Zone", "Section", "Chainage", etc.
  name: string;
  code: string;
  order_index: number;
  created_at: string;
}

export type ActivityStatus = "not_started" | "in_progress" | "submitted" | "blocked" | "completed" | "cancelled";
export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface Activity {
  id: string;
  project_id: string;
  hierarchy_node_id: string;
  code: string;
  name: string;
  description: string;
  responsible_id: string;
  start_date: string;
  planned_finish_date: string;
  actual_start_date?: string;
  actual_finish_date?: string;
  planned_quantity: number;
  verified_quantity: number;
  unit: string;
  priority: PriorityLevel;
  status: ActivityStatus;
  approval_required: boolean;
  evidence_required: boolean;
  weight_percent?: number;
  created_at: string;
}

export interface ActivityDependency {
  id: string;
  activity_id: string;
  predecessor_id: string;
  dependency_type: "FS" | "SS" | "FF" | "SF"; // Finish-to-Start default
  lag_days: number;
}

export type LogStatus = "draft" | "submitted" | "approved" | "rejected";

export interface DailyLog {
  id: string;
  project_id: string;
  hierarchy_node_id?: string;
  log_date: string;
  author_id: string;
  weather_condition: "sunny" | "cloudy" | "rainy" | "stormy" | "windy";
  temperature?: number;
  workforce_count: number;
  equipment_used?: string;
  delays_summary?: string;
  general_notes?: string;
  status: LogStatus;
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface DailyLogActivity {
  id: string;
  daily_log_id: string;
  activity_id: string;
  reported_quantity: number;
  work_performed: string;
  blockers?: string;
  verified_quantity?: number;
  verification_status: "pending" | "approved" | "rejected";
}

export type EvidenceType = "photo" | "video" | "drawing" | "document" | "inspection_sheet" | "rfi" | "material_receipt" | "certificate";

export interface EvidenceFile {
  id: string;
  project_id: string;
  activity_id?: string;
  hierarchy_node_id?: string;
  daily_log_id?: string;
  evidence_type: EvidenceType;
  title: string;
  description?: string;
  uploader_id: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  capture_date?: string;
  uploaded_at: string;
  review_status: "unreviewed" | "verified" | "flagged";
  tags: string[];
}

export interface Material {
  id: string;
  project_id: string;
  code: string;
  name: string;
  category: "Aggregates" | "Steel" | "Cement & Concrete" | "Masonry" | "Pipes & Plumbing" | "Electrical" | "Finishing";
  unit: string;
  unit_cost: number;
  minimum_stock_level: number;
  current_stock: number;
  supplier_name?: string;
  status: "active" | "archived";
}

export type MovementType = "receipt" | "issue" | "adjustment" | "return" | "wastage";

export interface StockMovement {
  id: string;
  project_id: string;
  material_id: string;
  activity_id?: string;
  movement_type: MovementType;
  quantity: number; // positive for receipt/return, negative for issue/wastage
  unit_cost: number;
  total_cost: number;
  reference_no: string;
  notes?: string;
  performed_by: string;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  activity_id?: string;
  category: "Materials" | "Labor" | "Equipment" | "Subcontractor" | "Permits & Safety" | "Overhead";
  expense_date: string;
  amount: number;
  currency: string;
  payee: string;
  description: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  approved_by?: string;
  receipt_evidence_id?: string;
  receipt_url?: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  project_id: string;
  activity_id?: string;
  hierarchy_node_id?: string;
  title: string;
  inspection_type: "structural" | "concrete_pour" | "rebar_mesh" | "safety_audit" | "finishing_qa";
  inspector_id: string;
  inspection_date: string;
  status: "passed" | "failed" | "conditional" | "pending";
  summary_notes?: string;
  created_at: string;
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  item_text: string;
  status: "pass" | "fail" | "na" | "pending";
  notes?: string;
  evidence_id?: string;
}

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface QualityIssue {
  id: string;
  project_id: string;
  activity_id?: string;
  inspection_id?: string;
  title: string;
  severity: SeverityLevel;
  status: "open" | "in_review" | "corrective_action" | "resolved" | "closed";
  description: string;
  identified_by: string;
  due_date: string;
  closure_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SafetyObservation {
  id: string;
  project_id: string;
  hierarchy_node_id?: string;
  title: string;
  observation_type: "hazard" | "near_miss" | "unsafe_act" | "incident";
  risk_level: SeverityLevel;
  status: "open" | "mitigated" | "closed";
  immediate_action_taken?: string;
  corrective_action_required?: string;
  reported_by: string;
  reported_at: string;
  closed_at?: string;
}

export interface CorrectiveAction {
  id: string;
  project_id: string;
  source_type: "quality_issue" | "safety_observation" | "inspection";
  source_id: string;
  action_text: string;
  assignee_id: string;
  due_date: string;
  status: "pending" | "in_progress" | "submitted" | "verified_closed";
  completed_at?: string;
  verified_by?: string;
  created_at: string;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface DelayRisk {
  id: string;
  project_id: string;
  activity_id: string;
  risk_level: RiskLevel;
  calculated_at: string;
  rule_triggered: string;
  variance_days: number;
  evidence_summary: string;
  recommended_action: string;
  acknowledgement_status: "unacknowledged" | "acknowledged" | "dismissed";
  acknowledged_by?: string;
  dismissed_reason?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  message: string;
  type: "risk_alert" | "approval_request" | "material_shortage" | "quality_issue" | "system";
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  project_id?: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}
