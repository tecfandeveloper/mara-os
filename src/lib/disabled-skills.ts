import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DISABLED_SKILLS_PATH = path.join(DATA_DIR, 'disabled-skills.json');

export interface DisabledSkillsData {
  disabled: string[];
}

const DEFAULT_DATA: DisabledSkillsData = { disabled: [] };

export function readDisabledSkills(): string[] {
  try {
    if (!fs.existsSync(DISABLED_SKILLS_PATH)) return DEFAULT_DATA.disabled;
    const raw = fs.readFileSync(DISABLED_SKILLS_PATH, 'utf-8');
    const data = JSON.parse(raw) as DisabledSkillsData;
    return Array.isArray(data?.disabled) ? data.disabled : DEFAULT_DATA.disabled;
  } catch {
    return DEFAULT_DATA.disabled;
  }
}

export function writeDisabledSkills(disabled: string[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data: DisabledSkillsData = { disabled: [...disabled] };
  fs.writeFileSync(DISABLED_SKILLS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/** Validate skill id: only safe chars to avoid path traversal / injection */
export function isValidSkillId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(id.trim());
}
