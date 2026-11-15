import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = new URL('../../', import.meta.url);
const venvPython = fileURLToPath(new URL(
  process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python', root,
));
const python = process.env.PYTHON ?? (existsSync(venvPython) ? venvPython : 'python');
const result = spawnSync(python, [
  fileURLToPath(new URL('./generate_api_types.py', import.meta.url)), ...process.argv.slice(2),
], { stdio: 'inherit', cwd: fileURLToPath(root) });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
