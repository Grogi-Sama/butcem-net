#!/usr/bin/env node
// Expo's web dev server doesn't read the PORT env var on its own — it only reacts to
// --port. A fixed port (explicit or Expo's own 8081 default) can still collide with another
// process between Expo's "is it free" check and the actual listen() call, which crashes with
// EADDRINUSE instead of prompting. "--port 0" tells Expo to scan for any free port itself,
// sidestepping that race entirely. PORT is still honored when explicitly set (e.g. by preview
// tooling), since a specific requested port should win over auto-selection.
const { spawnSync } = require('child_process');

const port = process.env.PORT || '0';
const result = spawnSync('npx', ['expo', 'start', '--web', '--port', port], {
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
