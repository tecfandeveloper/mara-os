import { NextResponse } from 'next/server';
import fs from 'fs';

import { OPENCLAW_CONFIG } from '@/lib/paths';
import { maskSecrets } from '@/lib/config-mask';
import {
  CONFIG_ALLOWLIST,
  isPathAllowed,
  validateValue,
  setAtPath,
  affectsGateway,
} from '@/lib/config-allowlist';

/**
 * GET /api/config — Read OpenClaw config (openclaw.json) with secrets masked.
 */
export async function GET() {
  try {
    if (!fs.existsSync(OPENCLAW_CONFIG)) {
      return NextResponse.json(
        { config: null, error: 'Config file not found', path: OPENCLAW_CONFIG },
        { status: 404 }
      );
    }
    const raw = fs.readFileSync(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw) as unknown;
    const masked = maskSecrets(JSON.parse(JSON.stringify(config)));
    return NextResponse.json({
      config: masked,
      path: OPENCLAW_CONFIG,
      allowlist: CONFIG_ALLOWLIST,
    });
  } catch (error) {
    console.error('Failed to read config:', error);
    return NextResponse.json(
      { error: 'Failed to read or parse config' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/config — Update a single allowed path. Body: { path: string, value: unknown }
 * Returns { success, restartRecommended?: boolean }.
 */
export async function PATCH(request: Request) {
  try {
    if (!fs.existsSync(OPENCLAW_CONFIG)) {
      return NextResponse.json(
        { error: 'Config file not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { path: keyPath, value } = body;
    if (!keyPath || typeof keyPath !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid path' }, { status: 400 });
    }

    const trimmedPath = keyPath.trim();
    if (!isPathAllowed(trimmedPath)) {
      return NextResponse.json(
        { error: 'Path not allowed for editing. Use only safe keys.' },
        { status: 400 }
      );
    }

    const validation = validateValue(trimmedPath, value);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const raw = fs.readFileSync(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw) as Record<string, unknown>;
    setAtPath(config, trimmedPath, value);
    fs.writeFileSync(OPENCLAW_CONFIG, JSON.stringify(config, null, 2), 'utf-8');

    const restartRecommended = affectsGateway(trimmedPath);
    return NextResponse.json({ success: true, restartRecommended });
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
