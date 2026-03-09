import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let database = null;

function init(db) {
  database = db;
}

/**
 * Get the skills directory (for file-based skill imports)
 */
function getSkillsDir() {
  const dir = path.join(app.getPath('userData'), 'skills');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Create a new skill from instructions text
 */
function createSkill({ name, description, instructions, category }) {
  if (!database || !name || !instructions) return null;
  const id = crypto.randomUUID();
  database.insert('skills', {
    id,
    name,
    description: description || '',
    instructions,
    category: category || 'general',
    is_active: 0,
  });

  // Also save to file for backup
  const filePath = path.join(getSkillsDir(), `${id}.md`);
  const content = `# ${name}\n\n${description ? `> ${description}\n\n` : ''}${instructions}`;
  fs.writeFileSync(filePath, content, 'utf-8');

  console.log(`[Skills] Created skill: ${name}`);
  return id;
}

/**
 * Import a skill from a markdown file
 */
function importSkillFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('File not found');

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, path.extname(filePath));

  // Try to parse heading as name
  const headingMatch = content.match(/^#\s+(.+)$/m);
  const name = headingMatch ? headingMatch[1].trim() : fileName;

  // Try to parse blockquote as description
  const descMatch = content.match(/^>\s+(.+)$/m);
  const description = descMatch ? descMatch[1].trim() : '';

  // Instructions are everything after heading and description
  let instructions = content;
  if (headingMatch) {
    instructions = content.substring(content.indexOf('\n', content.indexOf(headingMatch[0])) + 1).trim();
  }
  if (descMatch && instructions.startsWith('>')) {
    instructions = instructions.substring(instructions.indexOf('\n', instructions.indexOf(descMatch[0])) + 1).trim();
  }

  return createSkill({ name, description, instructions, category: 'imported' });
}

/**
 * List all skills
 */
function listSkills() {
  if (!database) return [];
  try {
    return database.getAll('SELECT * FROM skills ORDER BY is_active DESC, name ASC');
  } catch {
    return [];
  }
}

/**
 * Get a single skill by ID
 */
function getSkill(id) {
  if (!database) return null;
  return database.getOne('SELECT * FROM skills WHERE id = ?', [id]);
}

/**
 * Get all active skills
 */
function getActiveSkills() {
  if (!database) return [];
  try {
    return database.getAll('SELECT * FROM skills WHERE is_active = 1 ORDER BY name ASC');
  } catch {
    return [];
  }
}

/**
 * Activate or deactivate a skill
 */
function toggleSkill(id, active) {
  if (!database) return;
  database.run(
    'UPDATE skills SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [active ? 1 : 0, id]
  );
}

/**
 * Update a skill
 */
function updateSkill(id, updates) {
  if (!database) return;
  const fields = [];
  const values = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.instructions !== undefined) { fields.push('instructions = ?'); values.push(updates.instructions); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active); }
  if (!fields.length) return;
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  database.run(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`, values);
}

/**
 * Delete a skill
 */
function deleteSkill(id) {
  if (!database) return;
  database.run('DELETE FROM skills WHERE id = ?', [id]);
  // Remove file backup
  const filePath = path.join(getSkillsDir(), `${id}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/**
 * Build skill context to inject into system prompt
 */
function buildSkillContext() {
  const activeSkills = getActiveSkills();
  if (!activeSkills.length) return '';

  let context = '\n\n--- ACTIVE SKILLS / PLUGINS ---\n';
  context += 'Follow these skill instructions precisely when they are relevant to the user\'s request:\n\n';

  for (const skill of activeSkills) {
    context += `### SKILL: ${skill.name}\n`;
    if (skill.description) context += `${skill.description}\n`;
    context += `${skill.instructions}\n\n`;
  }

  context += '--- END SKILLS ---\n';
  return context;
}

export default {
  init,
  createSkill,
  importSkillFile,
  listSkills,
  getSkill,
  getActiveSkills,
  toggleSkill,
  updateSkill,
  deleteSkill,
  buildSkillContext,
  getSkillsDir,
};
