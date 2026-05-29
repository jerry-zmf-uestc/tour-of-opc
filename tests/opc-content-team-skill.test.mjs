import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const skillPath = path.resolve('.skills/openclaw-content-team/SKILL.md');
const skillRoot = path.dirname(skillPath);

test('openclaw-content-team skill documents reusable content workflow contracts', () => {
  assert.ok(fs.existsSync(skillPath), 'expected content team skill to exist');

  const skill = fs.readFileSync(skillPath, 'utf8');

  for (const expected of [
    'name: openclaw-content-team',
    'content-leader',
    'content-research',
    'content-drafting',
    'content-publishing',
    'outline_review',
    'final_review',
    'publish_review',
    '01-evidence-pack.md',
    '06-final.md',
    'lessons.yaml',
    'opc-router'
  ]) {
    assert.match(skill, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('openclaw-content-team skill provides references and reusable templates', () => {
  for (const relative of [
    'SETUP.md',
    'references/workflow.md',
    'references/artifact-contract.md',
    'references/quality-gates.md',
    'references/channel-drafts.md',
    'assets/templates/publish-plan.md',
    'assets/templates/publish-log.md',
    'assets/templates/publisher-handoff.md',
    'evals/evals.json'
  ]) {
    const file = path.join(skillRoot, relative);
    assert.ok(fs.existsSync(file), `expected ${relative} to exist`);
    assert.ok(fs.readFileSync(file, 'utf8').trim().length > 80, `expected ${relative} to be documented`);
  }
});

test('openclaw-content-team skill evals cover routing and publish handoff', () => {
  const evals = JSON.parse(fs.readFileSync(path.join(skillRoot, 'evals/evals.json'), 'utf8'));

  assert.equal(evals.skill_name, 'openclaw-content-team');
  assert.ok(evals.evals.some((item) => item.id === 'content-local-loop'));
  assert.ok(evals.evals.some((item) => item.id === 'publisher-handoff'));
});

test('openclaw-content-team is split into focused subskills', () => {
  const expectedSubskills = [
    '.skills/content-research/SKILL.md',
    '.skills/content-planning/SKILL.md',
    '.skills/content-drafting/SKILL.md',
    '.skills/content-publishing/SKILL.md',
    '.skills/content-memory/SKILL.md',
    '.skills/skill-evolution/SKILL.md'
  ];

  for (const relative of expectedSubskills) {
    const file = path.join(skillRoot, relative);
    assert.ok(fs.existsSync(file), `expected ${relative} to exist`);
    const content = fs.readFileSync(file, 'utf8');
    assert.match(content, /^---\nname: /);
    assert.match(content, /opc-router|openclaw-content-team|artifact/i);
  }

  const setup = fs.readFileSync(path.join(skillRoot, 'SETUP.md'), 'utf8');
  assert.match(setup, /Subskills/);
  assert.match(setup, /LLM-owned/);
  assert.match(setup, /Router-owned/);
});

test('openclaw content subskills absorb older standalone article skills', () => {
  for (const removed of [
    '.skills/obsidian-article-research',
    '.skills/obsidian-article-draft',
    '.skills/multi-channel-publisher'
  ]) {
    assert.equal(fs.existsSync(path.resolve(removed)), false, `expected ${removed} to be consolidated`);
  }

  const research = fs.readFileSync(path.join(skillRoot, '.skills/content-research/SKILL.md'), 'utf8');
  const drafting = fs.readFileSync(path.join(skillRoot, '.skills/content-drafting/SKILL.md'), 'utf8');
  const publishing = fs.readFileSync(path.join(skillRoot, '.skills/content-publishing/SKILL.md'), 'utf8');

  assert.match(research, /Article Research Brief Format/);
  assert.match(drafting, /Content Modes/);
  assert.match(publishing, /Channel Rules/);
});
