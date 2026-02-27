import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

import { scanAllSkills } from '@/lib/skill-parser';
import { isValidSkillId } from '@/lib/disabled-skills';

const execAsync = promisify(exec);

/**
 * POST /api/skills/update
 * Body: { id?: string } — if id provided, update that skill only; otherwise update all that support it.
 * Returns: { results: Array<{ id, ok, message? }> }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id != null ? String(body.id).trim() : undefined;

    if (id !== undefined && !isValidSkillId(id)) {
      return NextResponse.json(
        { error: 'Invalid skill id' },
        { status: 400 }
      );
    }

    const skills = scanAllSkills();
    const toUpdate = id ? skills.filter((s) => s.id === id) : skills;
    const results: Array<{ id: string; ok: boolean; message?: string }> = [];

    for (const skill of toUpdate) {
      const skillPath = skill.location;
      const gitDir = path.join(skillPath, '.git');

      if (!fs.existsSync(gitDir)) {
        results.push({
          id: skill.id,
          ok: false,
          message: 'Not a git repo (system or non-git skill)',
        });
        continue;
      }

      try {
        await execAsync(`git pull`, { cwd: skillPath, timeout: 30000 });
        results.push({ id: skill.id, ok: true });
      } catch (err: unknown) {
        const e = err as { message?: string; stderr?: string };
        results.push({
          id: skill.id,
          ok: false,
          message: e?.stderr || e?.message || 'git pull failed',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Skills update failed:', error);
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    );
  }
}
