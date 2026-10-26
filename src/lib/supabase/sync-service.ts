import { createClient, isSupabaseConfigured } from "./client";

export interface SyncStatus {
  connected: boolean;
  configured: boolean;
  message: string;
  latencyMs?: number;
  tables?: { [table: string]: number };
}

/**
 * Ensures an ID matches standard PostgreSQL UUID syntax deterministically.
 */
function ensureUuid(id?: string): string {
  if (!id) return "00000000-0000-0000-0000-000000000000";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
}

export const supabaseSyncService = {
  /**
   * Ping Supabase to test connectivity and latency
   */
  async testConnection(): Promise<SyncStatus> {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        configured: false,
        message: "Supabase credentials are not configured in environment variables.",
      };
    }

    const supabase = createClient();
    const start = performance.now();

    try {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      const latencyMs = Math.round(performance.now() - start);

      if (error) {
        return {
          connected: false,
          configured: true,
          latencyMs,
          message: `Supabase query error: ${error.message}`,
        };
      }

      return {
        connected: true,
        configured: true,
        latencyMs,
        message: `Successfully connected to Supabase PostgreSQL (Response time: ${latencyMs}ms)`,
      };
    } catch (err: any) {
      return {
        connected: false,
        configured: true,
        message: `Network error connecting to Supabase: ${err.message || String(err)}`,
      };
    }
  },

  /**
   * Fetch row counts across main tables
   */
  async getTableCounts(): Promise<{ [table: string]: number }> {
    if (!isSupabaseConfigured()) return {};
    const supabase = createClient();
    const tables = [
      "projects",
      "activities",
      "daily_logs",
      "daily_attendance",
      "materials",
      "stock_movements",
      "expenses",
      "evidence_files",
      "profiles",
    ];

    const counts: { [table: string]: number } = {};

    await Promise.all(
      tables.map(async (table) => {
        try {
          const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
          counts[table] = count || 0;
        } catch (e) {
          counts[table] = 0;
        }
      })
    );

    return counts;
  },

  /**
   * Push all current site data from local memory/repository into Supabase PostgreSQL tables
   */
  async pushAllLocalDataToSupabase(): Promise<{ success: boolean; syncedRows: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, syncedRows: 0, error: "Supabase is not configured." };
    }

    const supabase = createClient();
    let totalSynced = 0;

    try {
      const { repository } = await import("../data/repository");
      const allProjects = repository.getProjects();
      const allProfiles = repository.getProfiles();

      // 1. Profiles
      if (allProfiles.length > 0) {
        const payload = allProfiles.map((p) => ({
          id: ensureUuid(p.id),
          email: p.email,
          full_name: p.full_name,
          role: p.role,
          phone: p.phone || null,
        }));
        const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        if (error) console.warn("Sync profiles error:", error.message);
        else totalSynced += payload.length;
      }

      // 2. Projects
      if (allProjects.length > 0) {
        const payload = allProjects.map((p) => ({
          id: ensureUuid(p.id),
          name: p.name,
          code: p.code,
          project_type: p.project_type,
          description: p.description,
          location: p.location,
          client: p.client,
          project_manager_id: p.project_manager_id ? ensureUuid(p.project_manager_id) : null,
          start_date: p.start_date,
          planned_completion_date: p.planned_completion_date,
          actual_completion_date: p.actual_completion_date || null,
          approved_budget: p.approved_budget,
          currency: p.currency || "INR",
          status: p.status,
        }));
        const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
        if (error) console.warn("Sync projects error:", error.message);
        else totalSynced += payload.length;
      }

      // 3. For each project: Hierarchy, Activities, Materials, Daily Logs, Attendance, Expenses, Evidence
      for (const prj of allProjects) {
        const pId = prj.id;
        const validProjectId = ensureUuid(pId);

        // Hierarchy
        const nodes = repository.getHierarchy(pId);
        if (nodes.length > 0) {
          const payload = nodes.map((n) => ({
            id: ensureUuid(n.id),
            project_id: validProjectId,
            parent_id: n.parent_id ? ensureUuid(n.parent_id) : null,
            node_type: n.node_type,
            name: n.name,
            code: n.code,
            order_index: n.order_index || 0,
          }));
          const { error } = await supabase.from("hierarchy_nodes").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Activities
        const acts = repository.getActivities(pId);
        if (acts.length > 0) {
          const payload = acts.map((a) => ({
            id: ensureUuid(a.id),
            project_id: validProjectId,
            hierarchy_node_id: a.hierarchy_node_id ? ensureUuid(a.hierarchy_node_id) : null,
            code: a.code,
            name: a.name,
            description: a.description,
            responsible_id: a.responsible_id ? ensureUuid(a.responsible_id) : null,
            start_date: a.start_date,
            planned_finish_date: a.planned_finish_date,
            actual_start_date: a.actual_start_date || null,
            actual_finish_date: a.actual_finish_date || null,
            planned_quantity: a.planned_quantity || 0,
            verified_quantity: a.verified_quantity || 0,
            unit: a.unit,
            priority: a.priority,
            status: a.status,
            weight_percent: a.weight_percent || 1,
          }));
          const { error } = await supabase.from("activities").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Materials
        const mats = repository.getMaterials(pId);
        if (mats.length > 0) {
          const payload = mats.map((m) => ({
            id: ensureUuid(m.id),
            project_id: validProjectId,
            code: m.code,
            name: m.name,
            category: m.category,
            unit: m.unit,
            unit_cost: m.unit_cost || 0,
            minimum_stock_level: m.minimum_stock_level || 0,
            current_stock: m.current_stock || 0,
            supplier_name: m.supplier_name || null,
            status: m.status,
          }));
          const { error } = await supabase.from("materials").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Stock Movements
        const movements = repository.getStockMovements(pId);
        if (movements.length > 0) {
          const payload = movements.map((m) => ({
            id: ensureUuid(m.id),
            project_id: validProjectId,
            material_id: ensureUuid(m.material_id),
            activity_id: m.activity_id ? ensureUuid(m.activity_id) : null,
            movement_type: m.movement_type,
            quantity: m.quantity,
            unit_cost: m.unit_cost || 0,
            total_cost: m.total_cost || 0,
            reference_no: m.reference_no,
            notes: m.notes || null,
            performed_by: ensureUuid(m.performed_by),
          }));
          const { error } = await supabase.from("stock_movements").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Daily Logs
        const logs = repository.getDailyLogs(pId);
        if (logs.length > 0) {
          const payload = logs.map((l) => ({
            id: ensureUuid(l.id),
            project_id: validProjectId,
            hierarchy_node_id: l.hierarchy_node_id ? ensureUuid(l.hierarchy_node_id) : null,
            log_date: l.log_date,
            author_id: ensureUuid(l.author_id),
            weather_condition: l.weather_condition || "sunny",
            temperature: l.temperature || null,
            workforce_count: l.workforce_count || 0,
            equipment_used: l.equipment_used || null,
            delays_summary: l.delays_summary || null,
            general_notes: l.general_notes || null,
            status: l.status,
            reviewed_by: l.reviewed_by ? ensureUuid(l.reviewed_by) : null,
            review_notes: l.review_notes || null,
          }));
          const { error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Daily Attendance
        const attendance = repository.getAttendance(pId);
        if (attendance.length > 0) {
          const payload = attendance.map((a) => ({
            id: ensureUuid(a.id),
            project_id: validProjectId,
            date: a.date,
            supervisor_id: a.supervisor_id ? ensureUuid(a.supervisor_id) : null,
            labor_category: a.labor_category,
            skill_level: a.skill_level || "skilled",
            full_day_count: a.full_day_count || 0,
            half_day_count: a.half_day_count || 0,
            headcount: a.headcount,
            daily_wage_rate: a.daily_wage_rate || 0,
            total_payout: a.total_payout || 0,
            shift: a.shift === "day" ? "morning" : a.shift,
            contractor_name: a.contractor_name || null,
            notes: a.notes || null,
          }));
          const { error } = await supabase.from("daily_attendance").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Expenses
        const expenses = repository.getExpenses(pId);
        if (expenses.length > 0) {
          const payload = expenses.map((e) => ({
            id: ensureUuid(e.id),
            project_id: validProjectId,
            activity_id: e.activity_id ? ensureUuid(e.activity_id) : null,
            category: e.category,
            description: e.description,
            amount: e.amount,
            currency: e.currency || "INR",
            payee: e.payee,
            expense_date: e.expense_date,
            status: e.status || "approved",
            approved_by: e.approved_by ? ensureUuid(e.approved_by) : null,
          }));
          const { error } = await supabase.from("expenses").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }

        // Evidence Files
        const evidence = repository.getEvidence(pId);
        if (evidence.length > 0) {
          const payload = evidence.map((ev) => ({
            id: ensureUuid(ev.id),
            project_id: validProjectId,
            activity_id: ev.activity_id ? ensureUuid(ev.activity_id) : null,
            hierarchy_node_id: ev.hierarchy_node_id ? ensureUuid(ev.hierarchy_node_id) : null,
            daily_log_id: ev.daily_log_id ? ensureUuid(ev.daily_log_id) : null,
            evidence_type: ev.evidence_type,
            title: ev.title,
            description: ev.description || null,
            uploader_id: ensureUuid(ev.uploader_id),
            file_path: ev.file_path,
            file_type: ev.file_type || "image/jpeg",
            file_size_bytes: ev.file_size_bytes || 0,
            review_status: ev.review_status || "verified",
          }));
          const { error } = await supabase.from("evidence_files").upsert(payload, { onConflict: "id" });
          if (!error) totalSynced += payload.length;
        }
      }

      return { success: true, syncedRows: totalSynced };
    } catch (e: any) {
      console.error("Push data to Supabase error:", e);
      return { success: false, syncedRows: totalSynced, error: e.message || String(e) };
    }
  },

  /**
   * Pull all records from Supabase tables to hydrate the local application
   */
  async pullRemoteData(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase is not configured." };
    }

    try {
      const supabase = createClient();
      const [
        { data: projects },
        { data: hierarchy },
        { data: activities },
        { data: materials },
        { data: stockMovements },
        { data: dailyLogs },
        { data: attendance },
        { data: expenses },
        { data: evidence },
        { data: inspections },
        { data: qualityIssues },
        { data: safetyObservations },
      ] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("hierarchy_nodes").select("*"),
        supabase.from("activities").select("*"),
        supabase.from("materials").select("*"),
        supabase.from("stock_movements").select("*"),
        supabase.from("daily_logs").select("*"),
        supabase.from("daily_attendance").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("evidence_files").select("*"),
        supabase.from("inspections").select("*"),
        supabase.from("quality_issues").select("*"),
        supabase.from("safety_observations").select("*"),
      ]);

      return {
        success: true,
        data: {
          projects: projects || [],
          hierarchy: hierarchy || [],
          activities: activities || [],
          materials: materials || [],
          stockMovements: stockMovements || [],
          dailyLogs: dailyLogs || [],
          attendance: attendance || [],
          expenses: expenses || [],
          evidence: evidence || [],
          inspections: inspections || [],
          qualityIssues: qualityIssues || [],
          safetyObservations: safetyObservations || [],
        },
      };
    } catch (err: any) {
      console.warn("[Supabase Pull] Error fetching remote data:", err);
      return { success: false, error: err.message || String(err) };
    }
  },

  /**
   * Automatically sync an individual write to Supabase in the background
   */
  async autoSaveRecord(table: string, rawRecord: any): Promise<void> {
    if (!isSupabaseConfigured() || !rawRecord) return;

    try {
      const supabase = createClient();
      const record = { ...rawRecord };

      // Normalize UUIDs and constraints for PostgreSQL
      if (record.id) record.id = ensureUuid(record.id);
      if (record.project_id) record.project_id = ensureUuid(record.project_id);
      if (record.hierarchy_node_id) record.hierarchy_node_id = ensureUuid(record.hierarchy_node_id);
      if (record.activity_id) record.activity_id = ensureUuid(record.activity_id);
      if (record.author_id) record.author_id = ensureUuid(record.author_id);
      if (record.supervisor_id) record.supervisor_id = ensureUuid(record.supervisor_id);
      if (record.uploader_id) record.uploader_id = ensureUuid(record.uploader_id);
      if (record.performed_by) record.performed_by = ensureUuid(record.performed_by);
      if (record.material_id) record.material_id = ensureUuid(record.material_id);
      if (record.project_manager_id) record.project_manager_id = ensureUuid(record.project_manager_id);
      if (record.responsible_id) record.responsible_id = ensureUuid(record.responsible_id);
      if (record.reviewed_by) record.reviewed_by = ensureUuid(record.reviewed_by);
      if (record.approved_by) record.approved_by = ensureUuid(record.approved_by);
      if (record.assigned_to) record.assigned_to = ensureUuid(record.assigned_to);
      if (record.observer_id) record.observer_id = ensureUuid(record.observer_id);
      if (record.inspector_id) record.inspector_id = ensureUuid(record.inspector_id);
      if (record.source_id) record.source_id = ensureUuid(record.source_id);
      if (record.verified_by) record.verified_by = ensureUuid(record.verified_by);
      if (record.evidence_file_id) record.evidence_file_id = ensureUuid(record.evidence_file_id);
      if (record.daily_log_id) record.daily_log_id = ensureUuid(record.daily_log_id);
      if (record.parent_id) record.parent_id = ensureUuid(record.parent_id);
      if (record.shift === "day") record.shift = "morning";

      // Daily attendance specific payload mapping
      if (table === "daily_attendance") {
        const attPayload = {
          id: record.id,
          project_id: record.project_id,
          date: record.date,
          supervisor_id: record.supervisor_id ? ensureUuid(record.supervisor_id) : null,
          labor_category: record.labor_category,
          skill_level: record.skill_level || "skilled",
          full_day_count: Number(record.full_day_count) || 0,
          half_day_count: Number(record.half_day_count) || 0,
          headcount: Number(record.headcount) || 0,
          daily_wage_rate: Number(record.daily_wage_rate) || 0,
          total_payout: Number(record.total_payout) || 0,
          shift: record.shift === "day" ? "morning" : record.shift,
          contractor_name: record.contractor_name || null,
          notes: record.notes || null,
        };
        const { error } = await supabase.from("daily_attendance").upsert(attPayload, { onConflict: "id" });
        if (error) {
          console.warn("[Supabase AutoSave] Write to daily_attendance failed:", error.message);
        }
        return;
      }

      // Expenses specific payload mapping (matching PostgreSQL table schema)
      if (table === "expenses") {
        let validStatus = "pending_approval";
        if (["approved", "rejected", "draft", "paid"].includes(record.status)) {
          validStatus = record.status;
        }
        const expensePayload = {
          id: record.id,
          project_id: record.project_id,
          activity_id: record.activity_id || null,
          category: record.category || "Materials",
          description: record.description || record.payee || "Site Expense",
          amount: Number(record.amount) || 0,
          currency: record.currency || "INR",
          payee: record.payee || "Vendor",
          expense_date: record.expense_date || new Date().toISOString().split("T")[0],
          status: validStatus,
          approved_by: record.approved_by || record.manager_approved_by ? ensureUuid(record.approved_by || record.manager_approved_by) : null,
          receipt_url: record.receipt_url || null,
        };
        const { error } = await supabase.from("expenses").upsert(expensePayload, { onConflict: "id" });
        if (error) {
          console.warn("[Supabase AutoSave] Background write to expenses failed:", error.message);
        }
        return;
      }

      // Quality issues specific payload mapping
      if (table === "quality_issues") {
        const qiPayload = {
          id: record.id,
          project_id: record.project_id,
          activity_id: record.activity_id || null,
          inspection_id: record.inspection_id || null,
          title: record.title,
          description: record.description || "",
          severity: record.severity || "minor",
          status: record.status || "open",
          assigned_to: record.assigned_to ? ensureUuid(record.assigned_to) : null,
          due_date: record.due_date || null,
          resolved_at: record.resolved_at || null,
          evidence_file_id: record.evidence_file_id ? ensureUuid(record.evidence_file_id) : null,
        };
        const { error } = await supabase.from("quality_issues").upsert(qiPayload, { onConflict: "id" });
        if (error) console.warn("[Supabase AutoSave] Background write to quality_issues failed:", error.message);
        return;
      }

      // Safety observations specific payload mapping
      if (table === "safety_observations") {
        const safePayload = {
          id: record.id,
          project_id: record.project_id,
          observer_id: record.observer_id ? ensureUuid(record.observer_id) : "a0000000-0000-0000-0000-000000000003",
          observation_type: record.observation_type || "hazard",
          risk_level: record.risk_level || "medium",
          title: record.title,
          location_details: record.location_details || "Site Work Area",
          immediate_action_taken: record.immediate_action_taken || null,
          status: record.status || "open",
        };
        const { error } = await supabase.from("safety_observations").upsert(safePayload, { onConflict: "id" });
        if (error) console.warn("[Supabase AutoSave] Background write to safety_observations failed:", error.message);
        return;
      }

      // Corrective actions specific payload mapping
      if (table === "corrective_actions") {
        const caPayload = {
          id: record.id,
          project_id: record.project_id,
          issue_type: record.issue_type || "quality",
          source_id: record.source_id ? ensureUuid(record.source_id) : ensureUuid(record.id),
          title: record.title,
          description: record.description || "",
          assigned_to: record.assigned_to ? ensureUuid(record.assigned_to) : "a0000000-0000-0000-0000-000000000003",
          due_date: record.due_date || new Date().toISOString().split("T")[0],
          completed_at: record.completed_at || null,
          status: record.status || "assigned",
          verified_by: record.verified_by ? ensureUuid(record.verified_by) : null,
        };
        const { error } = await supabase.from("corrective_actions").upsert(caPayload, { onConflict: "id" });
        if (error) console.warn("[Supabase AutoSave] Background write to corrective_actions failed:", error.message);
        return;
      }

      const { error } = await supabase.from(table).upsert(record, { onConflict: "id" });
      if (error) {
        console.warn(`[Supabase AutoSave] Background write to ${table} failed:`, error.message);
      }
    } catch (e: any) {
      console.warn(`[Supabase AutoSave] Background write to ${table} failed:`, e?.message || e);
    }
  },

  /**
   * Delete record from Supabase
   */
  async autoDeleteRecord(table: string, id: string): Promise<void> {
    if (!isSupabaseConfigured() || !id) return;

    try {
      const supabase = createClient();
      const validId = ensureUuid(id);
      const { error } = await supabase.from(table).delete().eq("id", validId);
      if (error) {
        console.warn(`[Supabase AutoDelete] Delete from ${table} failed:`, error.message);
      }
    } catch (e: any) {
      console.warn(`[Supabase AutoDelete] Delete from ${table} failed:`, e?.message || e);
    }
  },
};
