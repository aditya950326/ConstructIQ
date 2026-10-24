-- ========================================================================
-- ConstructIQ - PostgreSQL Schema & Row Level Security (RLS) Migrations
-- AI-Based Construction Site Management & Evidence-Linked Intelligence
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'project_manager', 'site_engineer', 'site_supervisor')),
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
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on_hold', 'delayed', 'completed')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PROJECT MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.project_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_role TEXT NOT NULL CHECK (project_role IN ('manager', 'engineer', 'supervisor', 'viewer')),
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

-- 7. DAILY ATTENDANCE (Field Supervisor Work 1)
CREATE TABLE IF NOT EXISTS public.daily_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    supervisor_id UUID REFERENCES public.profiles(id),
    labor_category TEXT NOT NULL,
    headcount INT NOT NULL DEFAULT 0,
    shift TEXT NOT NULL CHECK (shift IN ('morning', 'evening', 'night')),
    contractor_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. EVIDENCE MANAGEMENT (Photos, Videos, Drawings, Inspections)
CREATE TABLE IF NOT EXISTS public.evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    hierarchy_node_id UUID REFERENCES public.hierarchy_nodes(id) ON DELETE SET NULL,
    daily_log_id UUID REFERENCES public.daily_logs(id) ON DELETE SET NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'video', 'drawing', 'document', 'inspection_sheet', 'rfi', 'material_receipt', 'certificate')),
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

-- 9. MATERIALS & INVENTORY LEDGER
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

-- 10. FINANCIALS & EXPENSES (Field Supervisor Bills & PM Commercials)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Materials', 'Labor', 'Equipment', 'Subcontractor', 'Permits & Safety', 'Overhead')),
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payee TEXT NOT NULL,
    expense_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paid')) DEFAULT 'pending_approval',
    approved_by UUID REFERENCES public.profiles(id),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. QUALITY MANAGEMENT (Inspections & Issues)
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspection_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    conducted_date DATE,
    result TEXT NOT NULL CHECK (result IN ('pending', 'passed', 'failed', 'conditional_pass')) DEFAULT 'pending',
    checkpoints_total INT NOT NULL DEFAULT 0,
    checkpoints_passed INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')) DEFAULT 'minor',
    status TEXT NOT NULL CHECK (status IN ('open', 'under_investigation', 'rectification_in_progress', 'resolved', 'closed')) DEFAULT 'open',
    assigned_to UUID REFERENCES public.profiles(id),
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    evidence_file_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. SAFETY & HSE
CREATE TABLE IF NOT EXISTS public.safety_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    observer_id UUID NOT NULL REFERENCES public.profiles(id),
    observation_type TEXT NOT NULL CHECK (observation_type IN ('hazard', 'near_miss', 'incident', 'positive_behavior')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    title TEXT NOT NULL,
    location_details TEXT NOT NULL,
    immediate_action_taken TEXT,
    status TEXT NOT NULL CHECK (status IN ('open', 'action_required', 'closed')) DEFAULT 'open',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('quality', 'safety')),
    source_id UUID NOT NULL, -- references quality_issues(id) or safety_observations(id)
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id),
    due_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'pending_verification', 'verified_closed')) DEFAULT 'assigned',
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. EXPLAINABLE DELAY RISKS
CREATE TABLE IF NOT EXISTS public.delay_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    rule_code VARCHAR(20) NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    reason_code TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    delay_impact_days INT NOT NULL DEFAULT 0,
    acknowledgement_status TEXT NOT NULL CHECK (acknowledgement_status IN ('unacknowledged', 'acknowledged', 'dismissed')) DEFAULT 'unacknowledged',
    dismissed_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. NOTIFICATIONS
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

-- 15. AUDIT LOGS (Immutable Traceability Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB,
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
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
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

-- Seamless Demo & Production Access Policies (Supports anon client key and authenticated users)
CREATE POLICY "Allow all operations for anon and authenticated" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.project_memberships FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.hierarchy_nodes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.activity_dependencies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.daily_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.daily_log_activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.daily_attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.evidence_files FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.stock_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.inspections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.quality_issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.safety_observations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.corrective_actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.delay_risks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
