-- ========================================================================
-- ConstructIQ - Realistic Demonstration Data Seed Script
-- Project: "Riverside Residential Development" & "Metro Line 4"
-- ========================================================================

-- Deterministic UUIDs for demo records
DO $$
DECLARE
    uid_admin UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    uid_pm UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
    uid_eng UUID := 'a0000000-0000-0000-0000-000000000003'::UUID;
    
    prj_riverside UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
    prj_metro UUID := 'b0000000-0000-0000-0000-000000000002'::UUID;

    node_twa UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
    node_sub UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;
    node_fnd UUID := 'c0000000-0000-0000-0000-000000000003'::UUID;
    node_sup UUID := 'c0000000-0000-0000-0000-000000000004'::UUID;
    node_lvl1 UUID := 'c0000000-0000-0000-0000-000000000005'::UUID;

    act_excav UUID := 'd0000000-0000-0000-0000-000000000001'::UUID;
    act_rebar UUID := 'd0000000-0000-0000-0000-000000000002'::UUID;
    act_raft UUID := 'd0000000-0000-0000-0000-000000000003'::UUID;
    act_col UUID := 'd0000000-0000-0000-0000-000000000004'::UUID;
    act_slab UUID := 'd0000000-0000-0000-0000-000000000005'::UUID;

    mat_rebar UUID := 'e0000000-0000-0000-0000-000000000001'::UUID;
    mat_rmc UUID := 'e0000000-0000-0000-0000-000000000002'::UUID;
    mat_cement UUID := 'e0000000-0000-0000-0000-000000000003'::UUID;
    mat_plywood UUID := 'e0000000-0000-0000-0000-000000000004'::UUID;

    ev_rebar UUID := 'f0000000-0000-0000-0000-000000000001'::UUID;
    ev_pour UUID := 'f0000000-0000-0000-0000-000000000002'::UUID;
    ev_test UUID := 'f0000000-0000-0000-0000-000000000003'::UUID;
BEGIN

    -- 1. Profiles (Upsert)
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES 
        (uid_admin, 'admin@constructiq.io', 'Aditya Birare', 'super_admin', '+91 98765 43210'),
        (uid_pm, 'pm.arjun@constructiq.io', 'Arjun Gundge', 'project_manager', '+91 98765 43211'),
        (uid_eng, 'engineer.kalyani@constructiq.io', 'Kalyani Jadhav', 'site_engineer', '+91 98765 43212')
    ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    -- 2. Projects
    INSERT INTO public.projects (id, name, code, project_type, description, location, timezone, client, project_manager_id, start_date, planned_completion_date, approved_budget, currency, status)
    VALUES 
        (prj_riverside, 'Riverside Residential Development', 'PRJ-RIV-01', 'residential', 'Twin 32-story premium residential towers featuring modern post-tensioned slabs and sustainable construction standards.', 'Chh. Sambhajinagar, MH', 'Asia/Kolkata', 'Godrej Infrastructure Partners', uid_pm, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 18500000.00, 'INR', 'active'),
        (prj_metro, 'Metro Line 4 - Viaduct & Stations', 'PRJ-METRO-04', 'infrastructure', 'Elevated 11.2 km rail viaduct package including 8 elevated passenger stations and pre-cast girder launching.', 'Wakad - Hinjawadi Corridor', 'Asia/Kolkata', 'Metropolitan Transport Corp', uid_pm, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '450 days', 65000000.00, 'INR', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Project Memberships
    INSERT INTO public.project_memberships (project_id, user_id, project_role)
    VALUES 
        (prj_riverside, uid_admin, 'manager'),
        (prj_riverside, uid_pm, 'manager'),
        (prj_riverside, uid_eng, 'engineer'),
        (prj_metro, uid_admin, 'manager'),
        (prj_metro, uid_pm, 'manager')
    ON CONFLICT DO NOTHING;

    -- 4. Site Hierarchy (Riverside)
    INSERT INTO public.hierarchy_nodes (id, project_id, parent_id, node_type, name, code, order_index)
    VALUES 
        (node_twa, prj_riverside, NULL, 'Tower', 'Tower Alpha (Tower A)', 'TOW-A', 1),
        (node_sub, prj_riverside, node_twa, 'Substructure', 'Basement & Substructure', 'TOW-A-SUB', 1),
        (node_fnd, prj_riverside, node_sub, 'Zone', 'Raft Foundation Zone 1', 'TOW-A-FND-Z1', 1),
        (node_sup, prj_riverside, node_twa, 'Superstructure', 'Superstructure Podium', 'TOW-A-SUP', 2),
        (node_lvl1, prj_riverside, node_sup, 'Floor', 'Level 01 Podium Slab & Columns', 'TOW-A-L01', 1)
    ON CONFLICT DO NOTHING;

    -- 5. Activities
    INSERT INTO public.activities (id, project_id, hierarchy_node_id, code, name, description, responsible_id, start_date, planned_finish_date, actual_start_date, planned_quantity, verified_quantity, unit, priority, status, approval_required, evidence_required, weight_percent)
    VALUES 
        (act_excav, prj_riverside, node_fnd, 'ACT-101', 'Bulk Earthwork & Raft Excavation', 'Excavation to hard rock strata including dewatering and perimeter shoring.', uid_eng, CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '55 days', 4200.00, 4200.00, 'Cu.m', 'high', 'completed', TRUE, TRUE, 15.00),
        (act_rebar, prj_riverside, node_fnd, 'ACT-102', 'Raft Mat Reinforcement Binding (TMT Fe500D)', 'Binding bottom and top mat rebar with shear chairs and starter bars.', uid_eng, CURRENT_DATE - INTERVAL '34 days', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '33 days', 185.00, 185.00, 'Tonnes', 'critical', 'completed', TRUE, TRUE, 25.00),
        (act_raft, prj_riverside, node_fnd, 'ACT-103', 'Mass Concrete Pour for Raft (M35 Grade)', 'Monolithic continuous pour of 1450 cu.m using twin boom pumps.', uid_eng, CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '13 days', 1450.00, 1450.00, 'Cu.m', 'critical', 'completed', TRUE, TRUE, 30.00),
        (act_col, prj_riverside, node_lvl1, 'ACT-104', 'Level 01 Columns Shuttering & Casting', 'Installation of steel formwork, rebar cage and pouring 48 columns.', uid_eng, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days', 48.00, 18.00, 'Columns', 'high', 'in_progress', TRUE, TRUE, 12.00),
        (act_slab, prj_riverside, node_lvl1, 'ACT-105', 'Level 01 Post-Tensioned Slab Decking & Concreting', 'Staging, decking plywood, laying tendons, conduit and concrete pour.', uid_eng, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '18 days', NULL, 850.00, 0.00, 'Sq.m', 'critical', 'not_started', TRUE, TRUE, 18.00)
    ON CONFLICT DO NOTHING;

    -- Activity Dependencies: Raft -> Columns -> Slab
    INSERT INTO public.activity_dependencies (activity_id, predecessor_id, dependency_type, lag_days)
    VALUES 
        (act_rebar, act_excav, 'FS', 1),
        (act_raft, act_rebar, 'FS', 0),
        (act_col, act_raft, 'FS', 2),
        (act_slab, act_col, 'FS', 1)
    ON CONFLICT DO NOTHING;

    -- 6. Materials & Stock Ledger
    INSERT INTO public.materials (id, project_id, code, name, category, unit, unit_cost, minimum_stock_level, current_stock, supplier_name, status)
    VALUES 
        (mat_rebar, prj_riverside, 'MAT-STL-01', 'TMT Steel Rebar Fe500D (16mm-25mm)', 'Steel', 'Tonnes', 62500.00, 25.00, 14.50, 'Tata Steel Ltd', 'active'), -- Low Stock alert!
        (mat_rmc, prj_riverside, 'MAT-RMC-35', 'Ready-Mix Concrete Grade M35', 'Cement & Concrete', 'Cu.m', 4850.00, 100.00, 280.00, 'UltraTech ReadyMix', 'active'),
        (mat_cement, prj_riverside, 'MAT-CEM-53', 'OPC 53 Grade Cement Bags', 'Cement & Concrete', 'Bags', 390.00, 500.00, 1200.00, 'Ambuja Cements', 'active'),
        (mat_plywood, prj_riverside, 'MAT-PLY-12', 'Film Faced Shuttering Plywood 12mm', 'Finishing', 'Sheets', 1450.00, 200.00, 480.00, 'Century Plyboards', 'active')
    ON CONFLICT DO NOTHING;

    -- 7. Stock Movements
    INSERT INTO public.stock_movements (id, project_id, material_id, activity_id, movement_type, quantity, unit_cost, total_cost, reference_no, notes, performed_by)
    VALUES 
        (uuid_generate_v4(), prj_riverside, mat_rebar, act_rebar, 'receipt', 200.00, 62500.00, 12500000.00, 'PO-2026-081', 'Received at yard from Tata Steel consignment', uid_pm),
        (uuid_generate_v4(), prj_riverside, mat_rebar, act_rebar, 'issue', -185.50, 62500.00, 11593750.00, 'ISS-001', 'Issued for Tower A Raft Mat fabrication', uid_eng),
        (uuid_generate_v4(), prj_riverside, mat_rmc, act_raft, 'receipt', 1450.00, 4850.00, 7032500.00, 'PO-2026-094', 'Direct dispatch pour for raft monolith', uid_pm),
        (uuid_generate_v4(), prj_riverside, mat_rmc, act_raft, 'issue', -1450.00, 4850.00, 7032500.00, 'ISS-002', 'Consumed in Raft Foundation monolithic pour', uid_eng)
    ON CONFLICT DO NOTHING;

    -- 8. Evidence Files
    INSERT INTO public.evidence_files (id, project_id, activity_id, hierarchy_node_id, evidence_type, title, description, uploader_id, file_path, file_type, file_size_bytes, capture_date, review_status, tags)
    VALUES 
        (ev_rebar, prj_riverside, act_rebar, node_fnd, 'photo', 'Tower A Raft Bottom Mat Rebar Inspection', 'Verified spacing @ 150mm c/c with cover blocks of 75mm clear cover.', uid_eng, '/evidence/raft-rebar-inspection.jpg', 'image/jpeg', 2450890, CURRENT_DATE - INTERVAL '15 days', 'verified', ARRAY['rebar', 'raft', 'qa-passed']),
        (ev_pour, prj_riverside, act_raft, node_fnd, 'photo', 'Monolithic Raft Concrete Pour Progress', 'Concrete slump recorded at 130mm, 2 boom pumps operating continuously.', uid_eng, '/evidence/raft-pour-photo.jpg', 'image/jpeg', 3892100, CURRENT_DATE - INTERVAL '13 days', 'verified', ARRAY['concreting', 'pour', 'day-log']),
        (ev_test, prj_riverside, act_raft, node_fnd, 'document', '28-Day Compressive Strength Cube Test Report', 'Average cube compressive strength achieved 42.4 MPa vs 35.0 MPa required.', uid_pm, '/evidence/cube-strength-report.pdf', 'application/pdf', 845200, CURRENT_DATE - INTERVAL '2 days', 'verified', ARRAY['lab-test', 'ndt', 'signoff'])
    ON CONFLICT DO NOTHING;

    -- 9. Daily Site Logs
    INSERT INTO public.daily_logs (id, project_id, hierarchy_node_id, log_date, author_id, weather_condition, temperature, workforce_count, equipment_used, delays_summary, general_notes, status, reviewed_by, review_notes, reviewed_at)
    VALUES 
        (uuid_generate_v4(), prj_riverside, node_lvl1, CURRENT_DATE - INTERVAL '1 day', uid_eng, 'sunny', 31.5, 42, '1x Tower Crane, 2x Concrete Vibrators, 1x Bar Bending Machine', 'Minor delay of 1.5 hrs due to concrete transit mixer congestion on entry gate.', 'Completed shuttering and rebar binding for 6 columns in Grid C-F.', 'approved', uid_pm, 'Verified on site. Alignment checked with plumb bob.', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours')
    ON CONFLICT DO NOTHING;

    -- 10. Quality Inspections & Defects
    INSERT INTO public.inspections (id, project_id, activity_id, hierarchy_node_id, title, inspection_type, inspector_id, inspection_date, status, summary_notes)
    VALUES 
        (uuid_generate_v4(), prj_riverside, act_col, node_lvl1, 'Level 01 Column C-4 Shuttering & Rebar Audit', 'structural', uid_eng, CURRENT_DATE - INTERVAL '2 days', 'conditional', 'Rebar cage alignment acceptable. Need additional bracing on eastern face prior to concreting.')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.quality_issues (id, project_id, activity_id, title, severity, status, description, identified_by, due_date)
    VALUES 
        (uuid_generate_v4(), prj_riverside, act_col, 'Column C-2 Honeycombing & Surface Void', 'medium', 'corrective_action', 'Minor honeycombing detected at the column base (approx 150x80mm) after formwork de-shuttering.', uid_eng, CURRENT_DATE + INTERVAL '2 days')
    ON CONFLICT DO NOTHING;

    -- 11. Safety Observations
    INSERT INTO public.safety_observations (id, project_id, hierarchy_node_id, title, observation_type, risk_level, status, immediate_action_taken, corrective_action_required, reported_by)
    VALUES 
        (uuid_generate_v4(), prj_riverside, node_lvl1, 'Missing Perimeter Edge Toe-Board on Level 01 Deck', 'hazard', 'high', 'open', 'Temporarily stopped work near grid A-2 edge.', 'Install double guard-rail and 150mm wooden toe-board along complete perimeter.', uid_eng)
    ON CONFLICT DO NOTHING;

    -- 12. Explainable Delay-Risk Intelligence Alerts
    INSERT INTO public.delay_risks (id, project_id, activity_id, risk_level, rule_triggered, variance_days, evidence_summary, recommended_action, acknowledgement_status)
    VALUES 
        (uuid_generate_v4(), prj_riverside, act_col, 'high', 'RULE-04: Critical Path Material Shortage & Slow Production Velocity', 3, 'TMT Steel stock (14.5T) is below safety buffer (25T). Current column casting velocity (2.8 cols/day) will miss target date by 4.2 days.', 'Expedite Tata Steel dispatch order PO-2026-098 and deploy additional shuttering carpentry gang.', 'unacknowledged'),
        (uuid_generate_v4(), prj_riverside, act_slab, 'moderate', 'RULE-02: Predecessor Activity Slippage Impact on Milestones', 2, 'Predecessor ACT-104 (Columns) projected completion is delayed by 3 days, encroaching on PT Slab tendon staging window.', 'Notify PT specialist sub-contractor of revised deck handover date (Nov 02).', 'unacknowledged')
    ON CONFLICT DO NOTHING;

    -- 13. Notifications
    INSERT INTO public.notifications (id, user_id, project_id, title, message, type, link_url)
    VALUES 
        (uuid_generate_v4(), uid_pm, prj_riverside, 'High Delay Risk Detected: Level 01 Columns', 'ACT-104 is trending 3 days behind planned finish date due to low steel stock.', 'risk_alert', '/app/projects/' || prj_riverside || '/risk'),
        (uuid_generate_v4(), uid_pm, prj_riverside, 'Low Stock Alert: TMT Rebar Fe500D', 'Current stock (14.5 Tonnes) has fallen below minimum buffer threshold (25.0 Tonnes).', 'material_shortage', '/app/projects/' || prj_riverside || '/materials'),
        (uuid_generate_v4(), uid_eng, prj_riverside, 'Safety Action Required: Edge Protection', 'Perimeter edge toe-board installation due on Level 01 Deck within 24 hours.', 'quality_issue', '/app/projects/' || prj_riverside || '/safety')
    ON CONFLICT DO NOTHING;

END $$;
