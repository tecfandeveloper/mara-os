import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { OPENCLAW_WORKSPACE } from '@/lib/paths';

const VALID_IDS = ['telegram', 'twitter', 'google'] as const;

function getOpenClawConfigPath(): string {
  const base = process.env.OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');
  return path.join(base, 'openclaw.json');
}

/**
 * POST /api/system/integrations/test
 * Body: { id: 'telegram' | 'twitter' | 'google' }
 * Returns: { id, ok, message? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id || !VALID_IDS.includes(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing id. Use telegram, twitter, or google.' },
        { status: 400 }
      );
    }

    let ok = false;
    let message = '';

    if (id === 'telegram') {
      try {
        const configPath = getOpenClawConfigPath();
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const telegram = config?.channels?.telegram;
        ok = !!(telegram?.enabled);
        const accounts = telegram?.accounts ? Object.keys(telegram.accounts).length : 0;
        message = ok ? `${accounts} bot(s) configured` : 'Telegram not enabled in openclaw.json';
      } catch (e) {
        ok = false;
        message = 'Could not read OpenClaw config or Telegram section';
      }
    } else if (id === 'twitter') {
      try {
        const toolsPath = path.join(OPENCLAW_WORKSPACE, 'TOOLS.md');
        const content = fs.existsSync(toolsPath) ? fs.readFileSync(toolsPath, 'utf-8') : '';
        ok = content.includes('bird') && content.includes('auth_token');
        message = ok ? 'bird CLI and auth_token found in TOOLS.md' : 'Add bird and auth_token to TOOLS.md';
      } catch (e) {
        ok = false;
        message = 'Could not check TOOLS.md';
      }
    } else if (id === 'google') {
      try {
        const configPath = getOpenClawConfigPath();
        let configured = false;
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          configured = !!(config?.plugins?.entries?.['google-gemini-cli-auth']?.enabled);
        }
        if (!configured) {
          const gogPath = path.join(os.homedir(), '.config', 'gog');
          configured = fs.existsSync(gogPath);
        }
        ok = configured;
        message = ok ? 'GOG plugin or ~/.config/gog found' : 'Enable google-gemini-cli-auth or run gog auth';
      } catch (e) {
        ok = false;
        message = 'Could not check Google/GOG config';
      }
    }

    return NextResponse.json({ id, ok, message });
  } catch (error) {
    console.error('Integration test failed:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
