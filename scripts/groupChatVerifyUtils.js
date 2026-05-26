const childProcess = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadEnv(file) {
  return Object.fromEntries(
    read(file)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
      }),
  );
}

function isAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(value || '');
}

function run(command, args, options = {}) {
  return childProcess.execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout || 30000,
  }).trim();
}

function castCall(rpc, to, signature, args = []) {
  return run('cast', ['call', '--rpc-url', rpc, to, signature, ...args]);
}

function castRpc(rpc, method, params) {
  return run('cast', ['rpc', '--rpc-url', rpc, method, ...params.map(String)]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

module.exports = {
  assert,
  castCall,
  castRpc,
  childProcess,
  freePort,
  isAddress,
  loadEnv,
  read,
  root,
  run,
  wait,
};
