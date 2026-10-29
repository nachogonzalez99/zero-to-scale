import { mkdir, writeFile } from 'node:fs/promises';
import { stringify } from 'yaml';
import { buildApp } from '../src/app.ts';

const app = await buildApp({ logger: false });
await app.ready();

await mkdir('contract', { recursive: true });
await writeFile('contract/openapi.yaml', stringify(app.swagger()));
await app.close();

console.log('contract/openapi.yaml updated');
