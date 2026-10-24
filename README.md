# ConstructIQ
### AI-Based Construction Site Management & Evidence-Linked Project Intelligence Platform

> **"Every site decision, backed by evidence."**  
> *Connect site progress, materials, quality, safety, and schedule risk in one place.*

---

## 🏗️ Overview

**ConstructIQ** is a modern construction site management platform designed to replace fragmented reporting (spreadsheets, paper registers, unorganized WhatsApp photos) with an **evidence-linked operational workflow**.

- **Configurable Site Hierarchies**: Supports multi-tier structures (Towers → Substructure → Zones or Highway Sections → Chainages).
- **Physical Progress Verification**: Separates self-reported work from PM-verified progress backed by inspection evidence.
- **Explainable Delay-Risk Engine**: Deterministic schedule risk calculations identifying root causes (material buffer depletion, dependency slippage, quality defects).
- **Non-Negative Material Ledger**: Strict receipt, allocation, and issuance controls preventing negative inventory.
- **Connected QA/QC & Safety**: Pre-pour inspection checklists, non-conformance registers, and stop-work governance.
- **Reporting & Exports**: 14 stakeholder reports with live Excel spreadsheet generation and formatted print exports.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Unit Tests
```bash
npm test
```
Executes test suites validating the Explainable Delay-Risk Engine, daily log approvals, non-negative inventory controls, and progress calculations.

### 4. Build for Production
```bash
npm run build
```

---

## 👥 Persona Switching & Demonstration Accounts

ConstructIQ includes a 1-click persona switcher in the bottom sidebar and login screen:

1. **Super Administrator** (`admin@constructiq.io`)
   - Persona: Aditya Birare
   - Full organization governance, project enrollment, and user permissions.
2. **Project Manager** (`pm.arjun@constructiq.io`)
   - Persona: Arjun Gundge
   - Progress sign-offs, schedule baselines, commercial budgets, and risk review.
3. **Site Engineer** (`engineer.kalyani@constructiq.io`)
   - Persona: Kalyani Jadhav
   - Daily site logs, evidence uploads, material issues, and safety observations.

---

## 🗄️ Database & Supabase Integration

### Option A: Local Sandbox Mode (Default)
ConstructIQ runs immediately out of the box with persistent local storage and pre-loaded demonstration data for:
- *Riverside Residential Towers* (Twin 32-story premium development)
- *Metro Line 4 - Elevated Viaduct* (11.2 km transit package)

### Option B: Supabase Hosted PostgreSQL
1. Create a project in [Supabase](https://supabase.com).
2. Apply the migration script: `supabase/migrations/20261023000000_init_constructiq.sql`
3. Load the seed script: `supabase/seed.sql`
4. Create `.env.local` with your project keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 🔬 Academic Foundation

ConstructIQ addresses the core problem statement defined in academic research at MIT Chh. Sambhajinagar:
- Unifies fragmented site streams into a relational data model.
- Solves the computer vision reliability gap by enforcing human-in-the-loop evidence sign-offs.
- Provides transparent root-cause explanation for schedule delay indicators.

---

## 📄 License
ConstructIQ Project © 2026. All rights reserved.
