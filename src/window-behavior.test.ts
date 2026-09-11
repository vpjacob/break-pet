import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('desktop window startup behavior', () => {
  it('keeps the main window hidden until a foreground launch requests it', () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src-tauri/tauri.conf.json'), 'utf8'),
    ) as { app?: { windows?: Array<{ label?: string; visible?: boolean }> } };
    const mainWindow = config.app?.windows?.find((window) => window.label === 'main');

    expect(mainWindow?.visible).toBe(false);
  });
});
