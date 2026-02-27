import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

import { OPENCLAW_WORKSPACE } from '@/lib/paths';
import { isValidSkillId } from '@/lib/disabled-skills';

const execAsync = promisify(exec);

const WORKSPACE_SKILLS = path.join(OPENCLAW_WORKSPACE, 'skills');

/** Allow only https Git URLs; no spaces or shell metacharacters */
const GIT_HTTPS_REGEX = /^https:\/\/[^\s'"]+$/;

/**
 * POST /api/skills/install
 * Body: { idOrName: string, source?: 'git' | 'npm', url?: string }
 * For source 'git': url required. Clones into workspace/skills/<idOrName>.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idOrName, source = 'git', url } = body;

    if (!idOrName || typeof idOrName !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid idOrName' },
        { status: 400 }
      );
    }

    const name = idOrName.trim();
    if (!isValidSkillId(name)) {
      return NextResponse.json(
        { error: 'Invalid idOrName: use only letters, numbers, dash, underscore' },
        { status: 400 }
      );
    }

    if (source === 'git') {
      const cloneUrl = (url || idOrName).trim();
      if (!GIT_HTTPS_REGEX.test(cloneUrl)) {
        return NextResponse.json(
          { error: 'Invalid or missing Git URL. Use https://.../*.git' },
          { status: 400 }
        );
      }

      const targetDir = path.join(WORKSPACE_SKILLS, name);
      if (fs.existsSync(targetDir)) {
        return NextResponse.json(
          { error: `Skill "${name}" already exists at ${targetDir}` },
          { status: 400 }
        );
      }

      if (!fs.existsSync(WORKSPACE_SKILLS)) {
        fs.mkdirSync(WORKSPACE_SKILLS, { recursive: true });
      }

      await execAsync(`git clone ${cloneUrl} "${targetDir}"`, {
        timeout: 60000,
      });

      return NextResponse.json({
        success: true,
        id: name,
        path: targetDir,
        message: 'Skill installed. Restart gateway or refresh to see it.',
      });
    }

    if (source === 'npm') {
      return NextResponse.json(
        { error: 'npm install not implemented yet. Use source: "git" with a repository URL.' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: 'Unsupported source. Use "git" or "npm".' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; stderr?: string };
    console.error('Skill install failed:', err);
    const message = err?.stderr || err?.message || 'Install failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
