import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the base prompts directory.
 * In dev, reads from project root. In production, reads from resources directory.
 */
function getPromptsDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'prompts');
  }
  // Development: project root
  return path.join(__dirname, '../../prompts');
}

/**
 * Load a domain-specific prompt from .md files.
 * @param {string} domain - e.g. 'tax', 'audit', 'qs'
 * @param {string} subdomain - e.g. 'income-tax', 'vat', 'general'
 * @returns {string} The prompt text
 */
function loadPrompt(domain, subdomain) {
  const promptsDir = getPromptsDir();
  const promptPath = path.join(promptsDir, domain, `${subdomain}.md`);

  try {
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf8');
    }
  } catch (e) {
    console.warn(`[PromptEngine] Error reading prompt ${promptPath}:`, e.message);
  }

  // Fallback: try a general.md in the domain folder
  const generalPath = path.join(promptsDir, domain, 'general.md');
  try {
    if (fs.existsSync(generalPath)) {
      console.log(`[PromptEngine] Falling back to general prompt for ${domain}/${subdomain}`);
      return fs.readFileSync(generalPath, 'utf8');
    }
  } catch (e) {
    console.warn(`[PromptEngine] Error reading fallback prompt:`, e.message);
  }

  // Default fallback prompt
  console.warn(
    `[PromptEngine] No prompt found for ${domain}/${subdomain}, using default`
  );
  return `You are AME Pro AI, a professional assistant for South African accountants. You are currently helping with ${domain} matters${subdomain ? ` (specifically ${subdomain})` : ''}. Provide accurate, professional advice based on current South African legislation and standards. Always cite relevant Acts, regulations, or standards where applicable.`;
}

/**
 * List all available domains and subdomains by scanning the prompts directory.
 * @returns {Object} { domain: [subdomain1, subdomain2, ...], ... }
 */
function listDomains() {
  const promptsDir = getPromptsDir();
  const domains = {};

  try {
    if (!fs.existsSync(promptsDir)) {
      console.warn('[PromptEngine] Prompts directory does not exist:', promptsDir);
      return domains;
    }

    const entries = fs.readdirSync(promptsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const domainDir = path.join(promptsDir, entry.name);
        const files = fs.readdirSync(domainDir);
        domains[entry.name] = files
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.replace('.md', ''));
      }
    }
  } catch (e) {
    console.error('[PromptEngine] Error listing domains:', e);
  }

  return domains;
}

export default {
  loadPrompt,
  listDomains,
  getPromptsDir,
};
