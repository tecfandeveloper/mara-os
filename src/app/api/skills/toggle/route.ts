import { NextResponse } from 'next/server';
import { readDisabledSkills, writeDisabledSkills, isValidSkillId } from '@/lib/disabled-skills';

/**
 * POST /api/skills/toggle — Enable or disable a skill.
 * Body: { id: string, enabled: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled } = body;
    if (id == null || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid id or enabled' },
        { status: 400 }
      );
    }
    const skillId = String(id).trim();
    if (!isValidSkillId(skillId)) {
      return NextResponse.json({ error: 'Invalid skill id' }, { status: 400 });
    }

    const disabled = readDisabledSkills();
    const currentlyDisabled = disabled.includes(skillId);

    if (enabled && currentlyDisabled) {
      writeDisabledSkills(disabled.filter((x) => x !== skillId));
    } else if (!enabled && !currentlyDisabled) {
      writeDisabledSkills([...disabled, skillId]);
    }

    return NextResponse.json({ id: skillId, enabled });
  } catch (error) {
    console.error('Skills toggle failed:', error);
    return NextResponse.json({ error: 'Toggle failed' }, { status: 500 });
  }
}
