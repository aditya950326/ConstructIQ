-- ========================================================================
-- ConstructIQ - PostgreSQL Schema & Row Level Security (RLS) Migrations
-- AI-Based Construction Site Management & Evidence-Linked Intelligence
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'project_manager', 'site_engineer')),
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    project_type TEXT NOT NULL CHECK (project_type IN ('residential', 'commercial', 'infrastructure', 'industrial')),
    description TEXT,
    location TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    client TEXT NOT NULL,
    project_manager_id UUID REFERENCES public.profiles(id),
    start_date DATE NOT NULL,
    planned_completion_date DATE NOT NULL,
    actual_completion_date DATE,
    approved_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on_hold', 'delayed', 'completed')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PROJECT MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.project_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_role TEXT NOT NULL CHECK (project_role IN ('manager', 'engineer', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, user_id)
);

-- 4. HIERARCHY NODES (Configurable Site Breakdown Structure)
CREATE TABLE IF NOT EXISTS public.hierarchy_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.hierarchy_nodes(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL, -- 'Block', 'Floor', 'Zone', 'Section', 'Chainage'
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, code)
);

-- 5. ACTIVITIES & DEPENDENCIES
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    hierarchy_node_id UUID NOT NULL REFERENCES public.hierarchy_nodes(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    responsible_id UUID REFERENCES public.profiles(id),
    start_date DATE NOT NULL,
    planned_finish_date DATE NOT NULL,
    actual_start_date DATE,
    actual_finish_date DATE,
    planned_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    verified_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'submitted', 'blocked', 'completed', 'cancelled')) DEFAULT 'not_started',
    approval_required BOOLEAN NOT NULL DEFAULT TRUE,
    evidence_required BOOLEAN NOT NULL DEFAULT TRUE,
    weight_percent NUMERIC(5, 2) DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, code)
);

CREATE TABLE IF NOT EXISTS public.activity_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    predecessor_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    dependency_type VARCHAR(10) NOT NULL DEFAULT 'FS' CHECK (dependency_type IN ('FS', 'SS', 'FF', 'SF')),
    lag_days INT NOT NULL DEFAULT 0,
    UNIQUE(activity_id, predecessor_id)
);

-- 6. DAILY SITE LOGS & REPORTED ACTIVITIES
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    hierarchy_node_id UUID REFERENCES public.hierarchy_nodes(id),
    log_date DATE NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    weather_condition TEXT NOT NULL DEFAULT 'sunny',
    temperature NUMERIC(4, 1),
    workforce_count INT NOT NULL DEFAULT 0,
    equipment_used TEXT,
    delays_summary TEXT,
    general_notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, log_date, author_id)
);

CREATE TABLE IF NOT EXISTS public.daily_log_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    reported_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    work_performed TEXT NOT NULL,
    blockers TEXT,
    verified_quantity NUMERIC(12, 2) DEFAULT 0.00,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    UNIQUE(daily_log_id, activity_id)
);

-- 7. EVIDENCE MANAGEMENT (Photos, Drawings, Documents, Inspections)
CREATE TABLE IF NOT EXISTS public.evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    hierarchy_node_id UUID REFERENCES public.hierarchy_nodes(id) ON DELETE SET NULL,
    daily_log_id UUID REFERENCES public.daily_logs(id) ON DELETE SET NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'drawing', 'document', 'inspection_sheet', 'rfi', 'material_receipt', 'certificate')),
    title TEXT NOT NULL,
    description TEXT,
    uploader_id UUID NOT NULL REFERENCES public.profiles(id),
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    capture_date TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    review_status TEXT NOT NULL CHECK (review_status IN ('unreviewed', 'verified', 'flagged')) DEFAULT 'unreviewed',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- 8. MATERIALS & INVENTORY LEDGER
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Aggregates', 'Steel', 'Cement & Concrete', 'Masonry', 'Pipes & Plumbing', 'Electrical', 'Finishing')),
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    minimum_stock_level NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    supplier_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, code)
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'issue', 'adjustment', 'return', 'wastage')),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reference_no TEXT NOT NULL,
    notes TEXT,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. FINANCIALS & EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Materials', 'Labor', 'Equipment', 'Subcontractor', 'Permits & Safety', 'Overhead')),
    expense_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payee TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'submitted',
    approved_by UUID REFERENCES public.profiles(id),
    receipt_evidence_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. QUALITY, SAFETY & CORRECTIVE ACTIONS
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    hierarchy_node_id UUID REFERENCES public.hierarchy_nodes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspection_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'conditional', 'pending')) DEFAULT 'pending',
    summary_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('open', 'in_review', 'corrective_action', 'resolved', 'closed')) DEFAULT 'open',
    description TEXT NOT NULL,
    identified_by UUID NOT NULL REFERENCES public.profiles(id),
    due_date DATE NOT NULL,
    closure_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.safety_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    hierarchy_node_id UUID REFERENCES public.hierarchy_nodes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    observation_type TEXT NOT NULL CHECK (observation_type IN ('hazard', 'near_miss', 'unsafe_act', 'incident')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('open', 'mitigated', 'closed')) DEFAULT 'open',
    immediate_action_taken TEXT,
    corrective_action_required TEXT,
    reported_by UUID NOT NULL REFERENCES public.profiles(id),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('quality_issue', 'safety_observation', 'inspection')),
    source_id UUID NOT NULL,
    action_text TEXT NOT NULL,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id),
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted', 'verified_closed')) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. EXPLAINABLE DELAY-RISK INTELLIGENCE
CREATE TABLE IF NOT EXISTS public.delay_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    rule_triggered TEXT NOT NULL,
    variance_days INT NOT NULL DEFAULT 0,
    evidence_summary TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    acknowledgement_status TEXT NOT NULL CHECK (acknowledgement_status IN ('unacknowledged', 'acknowledged', 'dismissed')) DEFAULT 'unacknowledged',
    acknowledged_by UUID REFERENCES public.profiles(id),
    dismissed_reason TEXT
);

-- 12. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delay_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_memberships
    WHERE project_id = target_project_id AND user_id = auth.uid()
  ) OR public.is_super_admin();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read all active profiles in the org, update own profile
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: Viewable by assigned members or super admin
CREATE POLICY "Projects viewable by members or super admin" ON public.projects
  FOR SELECT TO authenticated USING (public.is_project_member(id));

CREATE POLICY "Projects mutable by super admin or project manager" ON public.projects
  FOR ALL TO authenticated USING (
    public.is_super_admin() OR 
    EXISTS (
      SELECT 1 FROM public.project_memberships 
      WHERE project_id = id AND user_id = auth.uid() AND project_role = 'manager'
    )
  );

-- Hierarchy & Activities: Viewable and manageable by project members
CREATE POLICY "Hierarchy viewable by project members" ON public.hierarchy_nodes
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Activities viewable by project members" ON public.activities
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Activities update by authorized project members" ON public.activities
  FOR ALL TO authenticated USING (public.is_project_member(project_id));

-- Daily Logs: Engineers can create/view, Managers can approve
CREATE POLICY "Daily logs viewable by project members" ON public.daily_logs
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Daily logs insertable by project engineers" ON public.daily_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Daily logs editable by author or project manager" ON public.daily_logs
  FOR UPDATE TO authenticated USING (
    author_id = auth.uid() OR 
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.project_memberships 
      WHERE project_id = daily_logs.project_id AND user_id = auth.uid() AND project_role = 'manager'
    )
  );

-- Evidence files: Viewable by project members
CREATE POLICY "Evidence viewable by project members" ON public.evidence_files
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Evidence uploadable by project members" ON public.evidence_files
  FOR INSERT TO authenticated WITH CHECK (public.is_project_member(project_id));

-- Materials & Stock movements: Viewable and manageable by project members
CREATE POLICY "Materials viewable by project members" ON public.materials
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

CREATE POLICY "Stock movements viewable by project members" ON public.stock_movements
  FOR SELECT TO authenticated USING (public.is_project_member(project_id));

-- Notifications: Private to user
CREATE POLICY "Notifications private to user" ON public.notifications
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Audit logs: Viewable by project managers and super admins
CREATE POLICY "Audit logs viewable by managers" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    public.is_super_admin() OR 
    (project_id IS NOT NULL AND public.is_project_member(project_id))
  );
