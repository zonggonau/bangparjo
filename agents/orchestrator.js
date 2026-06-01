#!/usr/bin/env node
/**
 * BangParjo Multi-Agent Orchestrator
 *
 * Runs Planner → Coder → Reviewer pipeline using OpenClaw sub-agents.
 *
 * Usage:
 *   node agents/orchestrator.js "buat fitur kategori"
 *   node agents/orchestrator.js --file task.txt
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROMPT_DIR = __dirname;

function loadPrompt(name) {
  return fs.readFileSync(path.join(PROMPT_DIR, `${name}.prompt.md`), 'utf-8');
}

function log(emoji, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${emoji} ${msg}`);
}

// ── OpenClaw sub-agent runner ──────────────────────────────────────
// Uses sessions_spawn to create isolated agent sessions.
// Falls back to writing to a temp file for manual review.
function runSubAgent(promptFile, input, outputFile) {
  const prompt = loadPrompt(promptFile)
    .replace('{input}', input);

  const planFile = `/tmp/bangparjo-agent-${promptFile}-${Date.now()}.txt`;
  fs.writeFileSync(planFile, prompt, 'utf-8');

  log('📝', `Prompt saved → ${planFile}`);
  log('💡', `Next: spawn sub-agent with prompt from ${planFile}`);
  log('💡', `Or run manually: cat ${planFile} | pbcopy`);

  return planFile;
}

// ── Orchestrator ───────────────────────────────────────────────────
async function runPipeline(userInput) {
  log('🚀', '=== BangParjo Multi-Agent Pipeline ===');
  log('👤', `Input: ${userInput.slice(0, 80)}...`);

  // === Phase 1: PLANNER ===
  log('🧩', 'Phase 1: PLANNER → generating plan...');
  const planFile = runSubAgent('planner', userInput, 'planner-output.txt');
  
  // Output untuk user: prompt yang harus dijalankan ke Planner sub-agent
  console.log('\n' + '='.repeat(60));
  console.log('📋 INSTRUKSI: Jalankan Planner sub-agent dengan prompt berikut:');
  console.log('='.repeat(60));
  console.log(fs.readFileSync(planFile, 'utf-8'));
  console.log('='.repeat(60));
  console.log('\nCara: copy prompt di atas, spawn sub-agent Planner, paste hasilnya.\n');

  console.log('Atau gunakan OpenClaw CLI:');
  console.log(`  openclaw agent spawn --system "$(cat agents/planner.prompt.md | sed 's/{input}/'"'"'"${userInput}"'"'"'/g')"`);

  return planFile;
}

// ── CLI Entry ──────────────────────────────────────────────────────
const input = process.argv[2]
  || (process.argv.includes('--file') && fs.readFileSync(process.argv[process.argv.indexOf('--file') + 1], 'utf-8'))
  || 'Tidak ada input. Berikan task description.';

runPipeline(input).catch(err => {
  console.error('❌ Orchestrator failed:', err.message);
  process.exit(1);
});
