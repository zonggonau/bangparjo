#!/usr/bin/env node
/**
 * BangParjo Multi-Agent Orchestrator v2
 * 
 * True orchestrator that chains Planner → Coder → Reviewer
 * using OpenClaw sub-agent spawning via API.
 *
 * Prasyarat:
 *   - OpenClaw running (OPENCLAW_URL + OPENCLAW_TOKEN di .env)
 *
 * Usage:
 *   node agents/orchestrator-v2.js "buat halaman contact"
 *   node agents/orchestrator-v2.js --file task.txt
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PROMPT_DIR = __dirname;
const PROMPTS = {
  planner: loadPrompt('planner'),
  coder: loadPrompt('coder'),
  reviewer: loadPrompt('reviewer'),
};

// ── Config ─────────────────────────────────────────────────────────
const dotenvFile = path.join(__dirname, '..', '.env');
let OPENCLAW_URL = 'http://127.0.0.1:18789';
let OPENCLAW_TOKEN = '';

// Load from .env if available
if (fs.existsSync(dotenvFile)) {
  const env = fs.readFileSync(dotenvFile, 'utf-8');
  const urlMatch = env.match(/OPENCLAW_URL=(.+)/);
  const tokMatch = env.match(/OPENCLAW_TOKEN=(.+)/);
  if (urlMatch) OPENCLAW_URL = urlMatch[1].trim();
  if (tokMatch) OPENCLAW_TOKEN = tokMatch[1].trim();
}

// ── Helpers ────────────────────────────────────────────────────────

function loadPrompt(name) {
  const file = path.join(PROMPT_DIR, `${name}.prompt.md`);
  return fs.readFileSync(file, 'utf-8');
}

function log(emoji, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${emoji} ${msg}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── OpenClaw API Call ──────────────────────────────────────────────
function callOpenClaw(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, OPENCLAW_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Spawn a sub-agent ──────────────────────────────────────────────
async function spawnAgent(agentId, systemPrompt, userMessage) {
  log('🤖', `Spawning ${agentId}...`);

  const body = {
    task: userMessage,
    agentId: agentId || undefined,
    runtime: 'subagent',
    mode: 'run',
    cleanup: 'delete',
    attachments: [
      {
        name: 'system-prompt.txt',
        content: systemPrompt,
        encoding: 'utf8',
      }
    ],
  };

  try {
    const result = await callOpenClaw('POST', '/api/sessions/spawn', body);
    log('✅', `${agentId} selesai`);
    return result;
  } catch (err) {
    log('❌', `${agentId} gagal: ${err.message}`);
    
    // Fallback: simpan ke file + instruksi manual
    const fallbackFile = `/tmp/bangparjo-agent-${agentId}-${Date.now()}.txt`;
    fs.writeFileSync(fallbackFile, 
      `=== SESSION: ${agentId} ===\n\nSYSTEM:\n${systemPrompt}\n\nUSER:\n${userMessage}\n`
    );
    log('💡', `Prompt saved → ${fallbackFile}. Jalankan manual sebagai sub-agent ${agentId}.`);
    return { fallback: fallbackFile };
  }
}

// ── Orchestrator Pipeline ──────────────────────────────────────────
async function runPipeline(userInput) {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║   🚀 BangParjo Multi-Agent Pipeline v2                   ║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');
  log('👤', `Input: ${userInput.slice(0, 100)}`);

  // ── Phase 1: Planner ────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  log('🧩', 'PHASE 1/3: PLANNER → Analisa & Buat Plan');
  console.log('─'.repeat(60));

  const planPrompt = PROMPTS.planner.replace('{input}', userInput);
  const planResult = await spawnAgent('planner', planPrompt, userInput);

  // Simpan plan
  const planFile = `/tmp/bangparjo-plan-${Date.now()}.md`;
  const planText = planResult?.reply || planResult?.data?.reply || 
    `(Plan akan dihasilkan dari sub-agent Planner. Cek fallback file.)`;
  fs.writeFileSync(planFile, planText, 'utf-8');
  log('📋', `Plan saved → ${planFile}`);

  // ── Phase 2: Coder ─────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  log('💻', 'PHASE 2/3: CODER → Implementasi Berdasarkan Plan');
  console.log('─'.repeat(60));

  const coderPrompt = PROMPTS.coder.replace('{input}', planText);
  const codeResult = await spawnAgent('coder', coderPrompt, planText);

  // Simpan code
  const codeFile = `/tmp/bangparjo-code-${Date.now()}.md`;
  const codeText = codeResult?.reply || codeResult?.data?.reply ||
    `(Code akan dihasilkan dari sub-agent Coder. Cek fallback file.)`;
  fs.writeFileSync(codeFile, codeText, 'utf-8');
  log('📦', `Code saved → ${codeFile}`);

  // ── Phase 3: Reviewer ───────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  log('🔍', 'PHASE 3/3: REVIEWER → Audit & Validasi Kode');
  console.log('─'.repeat(60));

  const reviewerPrompt = PROMPTS.reviewer.replace('{input}', codeText);
  const reviewResult = await spawnAgent('reviewer', reviewerPrompt, codeText);

  // Simpan review
  const reviewFile = `/tmp/bangparjo-review-${Date.now()}.md`;
  const reviewText = reviewResult?.reply || reviewResult?.data?.reply ||
    `(Review akan dihasilkan dari sub-agent Reviewer. Cek fallback file.)`;
  fs.writeFileSync(reviewFile, reviewText, 'utf-8');
  log('📋', `Review saved → ${reviewFile}`);

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  log('✅', 'PIPELINE COMPLETE');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📁  Output files:');
  console.log(`  📋 Plan:     ${planFile}`);
  console.log(`  📦 Code:     ${codeFile}`);
  console.log(`  🔍 Review:   ${reviewFile}`);
  console.log('');
  console.log('💡 Jika sub-agent gagal spawn (OpenClaw API unreachable):');
  console.log('   Buka file prompt di agents/*.prompt.md');
  console.log('   Jalankan manual dengan sessions_spawn di OpenClaw.');
  console.log('');

  return { planFile, codeFile, reviewFile };
}

// ── CLI Entry ──────────────────────────────────────────────────────
const input = (() => {
  if (process.argv[2] && !process.argv[2].startsWith('--')) {
    return process.argv[2];
  }
  const fileIdx = process.argv.indexOf('--file');
  if (fileIdx !== -1 && process.argv[fileIdx + 1]) {
    return fs.readFileSync(process.argv[fileIdx + 1], 'utf-8');
  }
  return 'Tidak ada input. Berikan task description.';
})();

runPipeline(input).catch(err => {
  console.error('\n❌ Orchestrator failed:', err.message);
  process.exit(1);
});
