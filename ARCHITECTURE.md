# ConstructIQ Platform Architecture & Intelligence Engine

## 1. System Overview

**ConstructIQ** is an AI-based construction site management and project intelligence platform designed to replace fragmented site monitoring with an **evidence-linked operational workflow**.

### Architectural Layers

1. **Presentation & UX Layer**:
   - Next.js 14 App Router with React and TypeScript.
   - Tailwind CSS with an architectural design system (warm white surfaces, charcoal typography `#202321`, construction orange accent `#F36B32`).
   - SVG vector brand identity badge and icons.
   - Framer Motion micro-interactions and transitions.
   - Accessible data tables, hierarchy trees, and Gantt timeline strips.

2. **Application & Business Logic Layer**:
   - Domain-separated services: Projects, WBS Hierarchy, Scheduling, Daily Logs, Evidence Vault, Material Ledger, QA/QC, Safety, Financials, and Risk Intelligence.
   - Deterministic Explainable Delay-Risk Engine (`src/lib/intelligence/risk-engine.ts`).
   - Role-Based Access Control (RBAC) with instantaneous persona testing for Super Admin, Project Manager, and Site Engineer.

3. **Data Persistence & Database Layer**:
   - Official Supabase SSR integration (`@supabase/ssr`, `@supabase/supabase-js`) backed by PostgreSQL with complete migrations and Row Level Security (RLS).
   - Resilient persistent offline/local storage fallback allowing full end-to-end functionality, realistic seeding, and tests without remote network dependency.

---

## 2. Explainable Delay-Risk Engine Specification

Unlike speculative machine learning models that lack training datasets and produce untraceable confidence scores, ConstructIQ employs a **deterministic, rule-based inference engine**.

### Inference Rules

| Rule Identifier | Trigger Condition | Severity Impact | Action Mandate |
| :--- | :--- | :--- | :--- |
| **RULE-01** | `Current Date > Planned Finish Date` and `status != completed` | +25 to +45 pts (High/Critical) | Schedule compression review & critical path re-baseline |
| **RULE-02** | `Elapsed Time % - Physical Progress % > 15%` | +15 to +30 pts (Moderate/High) | Shift velocity review & auxiliary labor deployment |
| **RULE-03** | Predecessor activity `status != completed` while successor start date is approaching | +35 pts (High) | Predecessor sign-off expediting |
| **RULE-04** | Linked material `current_stock < minimum_stock_level` on active activities | +25 pts (High) | Purchase order delivery acceleration |
| **RULE-05** | Open unresolved quality defects or active safety stop-work orders | +25 pts (High) | Corrective action sign-off before concrete pour |

### Risk Classification Thresholds

- **Score < 20**: Low / Normal site variance.
- **Score 20 – 39**: Moderate Risk.
- **Score 40 – 64**: High Schedule Risk.
- **Score ≥ 65**: Critical Delay Threat.

Every alert includes the affected activity code, rule formula, exact quantitative variance, evidence links, and suggested next actions.

---

## 3. Academic Grounding

Grounding in research presented at MIT Chh. Sambhajinagar (*"AI-Based Construction Site Management"*):

- **Sarkar et al. (2022)**: Integrated BIM-ERP-IoT for large infrastructure. ConstructIQ provides a lightweight, accessible web-based hierarchy that eliminates prohibitive IoT hardware overhead.
- **Reja, Varghese & Ha (2022)**: Computer vision monitoring. Acknowledged computer vision limitations due to dust, occlusion, and lighting; ConstructIQ enforces human-in-the-loop multi-modal evidence sign-off.
- **Wang et al. (2024)**: Real-time quality monitoring. ConstructIQ connects QA non-conformance records directly to schedule risk and material buffer consumption.
