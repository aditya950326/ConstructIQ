# ConstructIQ Database Schema & RLS Architecture

This document outlines the relational PostgreSQL data model and Row Level Security (RLS) policies implemented in ConstructIQ.

## Relational Entity Hierarchy

```
[organizations] (Optional multi-tenant root)
   │
   ├── [profiles] (Super Admin, Project Manager, Site Engineer)
   │
   └── [projects]
         ├── [project_memberships] (Role assignment per site)
         ├── [hierarchy_nodes] (Configurable WBS: Tower/Floor/Zone or Highway/Chainage)
         │      └── [activities] (Physical quantities, dates, weights, priorities)
         │             ├── [activity_dependencies] (Finish-to-Start lags)
         │             ├── [daily_log_activities] (Reported quantities)
         │             ├── [inspections] (Checklists & Pre-pour QA)
         │             │      └── [quality_issues] (Honeycombing, rebar misalignment)
         │             ├── [corrective_actions] (Remediation assignments & closure)
         │             └── [delay_risks] (Deterministic intelligence calculations)
         ├── [daily_logs] (Shift records, workforce, weather, blocker notes)
         ├── [evidence_files] (Photos, test certificates, cube strength reports)
         ├── [materials] (Steel, RMC, cement, shuttering ply catalogue)
         │      └── [stock_movements] (Inward receipts, issues to activities, wastage)
         └── [expenses] (Vouchers, subcontractor bills, commercial burn-down)
```

## Row Level Security (RLS) Policy Specifications

| Table | SELECT Policy | INSERT / UPDATE Policy |
| :--- | :--- | :--- |
| `profiles` | All authenticated users in organization | Self update on profile row |
| `projects` | Assigned project members or Super Admin | Project Manager or Super Admin |
| `hierarchy_nodes` | Assigned project members | Project Manager or Super Admin |
| `activities` | Assigned project members | Project Manager or Super Admin |
| `daily_logs` | Assigned project members | Created by Site Engineer; Approved by PM |
| `daily_log_activities` | Assigned project members | Created by Author; Verified by PM |
| `evidence_files` | Assigned project members | Any project member with capture metadata |
| `materials` | Assigned project members | Project Manager or Storekeeper |
| `stock_movements` | Assigned project members | Any project member (enforcing non-negative stock) |
| `expenses` | Assigned project members | Project Manager or Super Admin |
| `inspections` | Assigned project members | Quality Inspector or Site Engineer |
| `quality_issues` | Assigned project members | Site Engineer or QA Inspector |
| `safety_observations` | Assigned project members | Any project personnel (Stop-Work authority) |
| `corrective_actions` | Assigned project members | Assignee updates status; PM verifies closure |
| `delay_risks` | Assigned project members | Recalculated by rule engine; Overwritten by PM |
| `notifications` | Private to target user ID (`user_id = auth.uid()`) | System generated |
| `audit_logs` | Project Manager or Super Admin | System generated immutable inserts |

## Key Database Constraints & Invariants

1. **Non-Negative Stock Rule**: Material issue movements cannot reduce `current_stock` below zero.
2. **Double-Approval Prevention**: Approving a daily log updates `verified_quantity` on target activities once and locks against duplicate counting.
3. **Traceable Hierarchy**: Hierarchy nodes with child nodes or linked activities cannot be deleted without safe migration or archival.
