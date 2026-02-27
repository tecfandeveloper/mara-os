import { NextResponse } from 'next/server';

/**
 * Stub catalog for ClawHub — installable skills.
 * In the future this can be a remote JSON URL or OpenClaw registry.
 */
const STUB_CATALOG: Array<{
  id: string;
  name: string;
  description: string;
  source: 'git' | 'npm';
  url?: string;
}> = [
  {
    id: 'example-skill',
    name: 'Example Skill',
    description: 'Template skill for OpenClaw. Clone and customize.',
    source: 'git',
    url: 'https://github.com/openclaw/skill-example.git',
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Use before creative work — explores intent and design.',
    source: 'git',
    url: 'https://github.com/openclaw/skill-brainstorming.git',
  },
];

/**
 * GET /api/skills/clawhub — List skills available to install (ClawHub catalog).
 */
export async function GET() {
  return NextResponse.json({ skills: STUB_CATALOG });
}
