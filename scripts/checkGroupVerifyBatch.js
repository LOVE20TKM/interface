const { spawnSync } = require('child_process');

const result = spawnSync(
  process.execPath,
  ['node_modules/.bin/ts-node', '--project', 'test/tsconfig.json', 'test/group-verify-batch.ts'],
  { stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
