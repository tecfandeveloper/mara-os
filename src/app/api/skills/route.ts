import { NextResponse } from 'next/server';
import { scanAllSkills } from '@/lib/skill-parser';
import { readDisabledSkills } from '@/lib/disabled-skills';

export async function GET() {
  try {
    const skills = scanAllSkills();
    const disabled = readDisabledSkills();
    const skillsWithEnabled = skills.map((s) => ({
      ...s,
      enabled: !disabled.includes(s.id),
    }));
    return NextResponse.json({
      skills: skillsWithEnabled,
    });
  } catch (error) {
    console.error('Failed to scan skills:', error);
    return NextResponse.json({ skills: [] }, { status: 500 });
  }
}
