# 🧠 BangParjo Multi-Agent Skill

## Overview
Pipeline 3-agent: **Planner → Coder → Reviewer**
Untuk task development kompleks di project BangParjo.

## Agent Prompts
Tersimpan di `agents/*.prompt.md`:
- `agents/planner.prompt.md` — Analisa & buat rencana teknis
- `agents/coder.prompt.md` — Implementasi kode
- `agents/reviewer.prompt.md` — Audit & validasi

## Cara Penggunaan (Manual — RECOMMENDED)

Gunakan `sessions_spawn` tool untuk tiap agent secara berurutan.

### Step 1: Spawn Planner
```
sessions_spawn(
  task="<user request>",
  agentId="planner"  // optional, untuk identifikasi
)
```
System prompt otomatis dari `agents/planner.prompt.md`.
Agent ini akan menghasilkan PLAN.

### Step 2: Spawn Coder
```
sessions_spawn(
  task="<PLAN dari step 1>",
  agentId="coder"
)
```
System prompt dari `agents/coder.prompt.md`.
Agent ini akan menghasilkan KODE.

### Step 3: Spawn Reviewer
```
sessions_spawn(
  task="<KODE dari step 2>",
  agentId="reviewer"
)
```
System prompt dari `agents/reviewer.prompt.md`.
Agent ini akan menghasilkan REVIEW + FINAL CODE.

### Optional: Iteration Loop
Jika reviewer menemukan bug:
1. Fix bug → spawn Coder lagi dengan hasil review
2. Review ulang
3. Ulangi sampai "NO BUG"

## Cara Penggunaan (Auto — CLI)

Jalankan orchestrator:
```bash
node agents/orchestrator-v2.js "buat fitur contact form"
```

Ini akan:
1. Coba spawn sub-agent via OpenClaw API
2. Kalau API unreachable → simpan prompt ke `/tmp/` untuk manual run

---

## Files

| File | Fungsi |
|------|--------|
| `agents/planner.prompt.md` | Planner agent prompt |
| `agents/coder.prompt.md` | Coder agent prompt |
| `agents/reviewer.prompt.md` | Reviewer agent prompt |
| `agents/orchestrator.js` | CLI orchestrator v1 (manual) |
| `agents/orchestrator-v2.js` | CLI orchestrator v2 (auto + fallback) |
| `AGENTS.md` | Agent rules & project memory |
