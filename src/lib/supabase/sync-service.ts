import { createClient, isSupabaseConfigured } from "./client";
import { repository } from "../data/repository";

export interface SyncStatus {
  connected: boolean;
  configured: boolean;
  message: string;
  latencyMs?: number;
  tables?: { [table: string]: number };
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
      const allProjects = repository.getProjects();
      const allProfiles = repository.getProfiles();

      // 1. Profiles
      if (allProfiles.length > 0) {
        const { error: profErr } = await supabase.from("profiles").upsert(
          allProfiles.map((p) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            role: p.role,
            phone: p.phone || null,
          })),
          { onConflict: "id" }
        );
        if (!profErr) totalSynced += allProfiles.length;
      }

      // 2. Projects
      if (allProjects.length > 0) {
        const { error: prjErr } = await supabase.from("projects").upsert(
          allProjects.map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            project_type: p.project_type,
            description: p.description,
            location: p.location,
            client: p.client,
            project_manager_id: p.project_manager_id || null,
            start_date: p.start_date,
            planned_completion_date: p.planned_completion_date,
            actual_completion_date: p.actual_completion_date || null,
            approved_budget: p.approved_budget,
            currency: p.currency,
            status: p.status,
          })),
          { onConflict: "id" }
        );
        if (!prjErr) totalSynced += allProjects.length;
      }

      // 3. For each project: Hierarchy, Activities, Materials, Daily Logs, Attendance, Expenses, Evidence
      for (const prj of allProjects) {
        const pId = prj.id;

        // Hierarchy
        const nodes = repository.getHierarchy(pId);
        if (nodes.length > 0) {
          await supabase.from("hierarchy_nodes").upsert(nodes, { onConflict: "id" });
          totalSynced += nodes.length;
        }

        // Activities
        const acts = repository.getActivities(pId);
        if (acts.length > 0) {
          await supabase.from("activities").upsert(acts, { onConflict: "id" });
          totalSynced += acts.length;
        }

        // Materials
        const mats = repository.getMaterials(pId);
        if (mats.length > 0) {
          await supabase.from("materials").upsert(mats, { onConflict: "id" });
          totalSynced += mats.length;
        }

        // Stock Movements
        const movements = repository.getStockMovements(pId);
        if (movements.length > 0) {
          await supabase.from("stock_movements").upsert(movements, { onConflict: "id" });
          totalSynced += movements.length;
        }

        // Daily Logs
        const logs = repository.getDailyLogs(pId);
        if (logs.length > 0) {
          await supabase.from("daily_logs").upsert(logs, { onConflict: "id" });
          totalSynced += logs.length;
        }

        // Daily Attendance
        const attendance = repository.getAttendance(pId);
        if (attendance.length > 0) {
          await supabase.from("daily_attendance").upsert(attendance, { onConflict: "id" });
          totalSynced += attendance.length;
        }

        // Expenses
        const expenses = repository.getExpenses(pId);
        if (expenses.length > 0) {
          await supabase.from("expenses").upsert(expenses, { onConflict: "id" });
          totalSynced += expenses.length;
        }

        // Evidence Files
        const evidence = repository.getEvidence(pId);
        if (evidence.length > 0) {
          await supabase.from("evidence_files").upsert(evidence, { onConflict: "id" });
          totalSynced += evidence.length;
        }

        // Quality Issues & Safety
        const quality = repository.getQualityIssues(pId);
        if (quality.length > 0) {
          await supabase.from("quality_issues").upsert(quality, { onConflict: "id" });
          totalSynced += quality.length;
        }

        const safety = repository.getSafetyObservations(pId);
        if (safety.length > 0) {
          await supabase.from("safety_observations").upsert(safety, { onConflict: "id" });
          totalSynced += safety.length;
        }
      }

      return { success: true, syncedRows: totalSynced };
    } catch (e: any) {
      console.error("Push data to Supabase error:", e);
      return { success: false, syncedRows: totalSynced, error: e.message || String(e) };
    }
  },

  /**
   * Automatically sync an individual write to Supabase in the background
   */
  async autoSaveRecord(table: string, record: any): Promise<void> {
    if (!isSupabaseConfigured() || typeof window === "undefined") return;

    try {
      const supabase = createClient();
      await supabase.from(table).upsert(record, { onConflict: "id" });
    } catch (e) {
      console.warn(`[Supabase AutoSync] Background write to ${table} failed:`, e);
    }
  },
};
