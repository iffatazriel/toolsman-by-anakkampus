import { cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'fonts');
const target = join(root, 'public', 'excalidraw', 'fonts');

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log('Font Excalidraw disalin ke public/excalidraw/fonts.');
