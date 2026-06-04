#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const readline = require('node:readline');
const { URLSearchParams } = require('node:url');
const { ethers } = require('ethers');
const {
  assert,
  childProcess,
  freePort,
  isAddress,
  root,
  wait,
} = require('../groupChatVerifyUtils');

const DEFAULT_GROUP_SCAN_LIMIT = 30n;
const DEFAULT_MESSAGE_PREFIX = 'public_test_e2e';
const KEYSTORE_DIR = path.join(process.env.HOME || '', '.foundry', 'keystores');
const PASSWORD_SENTINEL = '__LOVE20_EMPTY_PASSWORD__';
const ARTIFACT_DIR = path.join(root, 'test-results', 'group-chat-public-test');

function shellQuoteForAppleScript(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function promptPassword(title, message) {
  if (process.stdin.isTTY) {
    return promptPasswordFromTty(message);
  }
  const script = [
    'tell application "System Events" to activate',
    `display dialog "${shellQuoteForAppleScript(message)}"`,
    `with title "${shellQuoteForAppleScript(title)}"`,
    'default answer "" with hidden answer',
    'buttons {"取消", "确定"} default button "确定" cancel button "取消"',
  ].join(' ');
  const output = childProcess.execFileSync('osascript', ['-e', script], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const text = output.replace(/^button returned:.*?, text returned:/, '');
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

async function promptPasswordFromTty(message) {
  const mutableStdout = new (require('node:stream').Writable)({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });
  return await new Promise((resolve) => {
    process.stdout.write(`${message}: `);
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function promptCredentialsInBrowser(defaultAccountName = 'dev1') {
  const port = await freePort();
  const token = crypto.randomBytes(16).toString('hex');
  let server;
  const resultPromise = new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      if (req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LOVE20 public_test E2E</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f7f9; color: #111827; }
    form { width: min(420px, calc(100vw - 32px)); background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; box-shadow: 0 16px 40px rgba(15, 23, 42, .12); }
    h1 { font-size: 18px; margin: 0 0 16px; }
    label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 6px; }
    input { box-sizing: border-box; width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 15px; }
    button { margin-top: 18px; width: 100%; border: 0; border-radius: 6px; padding: 11px 12px; font-weight: 700; color: white; background: #2563eb; cursor: pointer; }
    p { margin: 10px 0 0; color: #6b7280; font-size: 13px; line-height: 1.45; }
  </style>
</head>
<body>
  <form method="post" action="/submit">
    <input type="hidden" name="token" value="${token}" />
    <h1>LOVE20 public_test E2E</h1>
    <label for="accountName">Foundry keystore 名字</label>
    <input id="accountName" name="accountName" value="${defaultAccountName}" autocomplete="off" required autofocus />
    <label for="password">Keystore 密码</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />
    <button type="submit">开始测试</button>
    <p>表单只提交到 127.0.0.1 的当前测试进程；密码不会写入文件或打印。</p>
  </form>
</body>
</html>`);
        return;
      }
      if (req.method !== 'POST' || req.url !== '/submit') {
        res.writeHead(404);
        res.end();
        return;
      }
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const params = new URLSearchParams(body);
        if (params.get('token') !== token) {
          res.writeHead(403);
          res.end('invalid token');
          return;
        }
        const accountName = params.get('accountName') || '';
        const password = params.get('password') || '';
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<!doctype html><meta charset="utf-8"><title>OK</title><body style="font-family:sans-serif;padding:24px">已收到，可以关闭此页面。</body>');
        resolve({ accountName, password });
      });
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1');
  });
  const url = `http://127.0.0.1:${port}`;
  console.log(`请在浏览器中输入 keystore 信息: ${url}`);
  childProcess.spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
  try {
    return await resultPromise;
  } finally {
    server.close();
  }
}

async function readPromptedCredentials() {
  const prompted =
    process.env.PUBLIC_TEST_KEYSTORE && process.env.PUBLIC_TEST_KEYSTORE_PASSWORD !== undefined
      ? undefined
      : await promptCredentialsInBrowser(process.env.PUBLIC_TEST_KEYSTORE || 'dev1');
  const accountName = process.env.PUBLIC_TEST_KEYSTORE || prompted?.accountName || '';
  assert(accountName && !accountName.includes('/') && !accountName.includes('\\'), 'keystore 名字无效');

  const password =
    process.env.PUBLIC_TEST_KEYSTORE_PASSWORD === PASSWORD_SENTINEL
      ? ''
      : process.env.PUBLIC_TEST_KEYSTORE_PASSWORD ?? prompted?.password ?? await promptPassword('LOVE20 public_test E2E', `输入 ${accountName} 的 keystore 密码`);

  return { accountName, password };
}

function loadPublicTestEnv() {
  const env = Object.fromEntries(
    fs.readFileSync(path.join(root, '.env.public_test'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index);
        let value = line.slice(index + 1).trim();
        if (!/^['"]/.test(value)) {
          value = value.replace(/\s+#.*$/, '').trim();
        }
        value = value.replace(/^(['"])(.*)\1$/, '$2');
        return [key, value];
      }),
  );
  assert(env.NEXT_PUBLIC_CHAIN === 'thinkium70001', '.env.public_test must target thinkium70001');
  assert(env.NEXT_PUBLIC_CHAIN_ID === '70001', '.env.public_test must set NEXT_PUBLIC_CHAIN_ID=70001');
  assert(Boolean(env.NEXT_PUBLIC_THINKIUM_RPC_URL), '.env.public_test must define NEXT_PUBLIC_THINKIUM_RPC_URL');
  assert(Boolean(env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL), '.env.public_test must define NEXT_PUBLIC_FIRST_TOKEN_SYMBOL');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT), '.env.public_test must define GroupChat address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS), '.env.public_test must define GroupDefaults address');
  return env;
}

async function importViem() {
  const viem = await import('viem');
  return viem;
}

async function unlockWallet(accountName, password) {
  const keystorePath = path.join(KEYSTORE_DIR, accountName);
  assert(fs.existsSync(keystorePath), `未找到 Foundry keystore: ${keystorePath}`);
  const encryptedJson = fs.readFileSync(keystorePath, 'utf8');
  const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
  return wallet;
}

function makeJsonRpc(rpcUrl) {
  let id = 1;
  return async function rpc(method, params = []) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: id++, method, params }),
    });
    const payload = await response.json();
    if (payload.error) {
      const error = new Error(payload.error.message || `RPC ${method} failed`);
      error.code = payload.error.code;
      error.data = payload.error.data;
      throw error;
    }
    return payload.result;
  };
}

function tupleValue(value, key, index) {
  return value?.[key] ?? value?.[index];
}

async function createChainTools(env) {
  const {
    createPublicClient,
    formatEther,
    getAddress,
    http: viemHttp,
    parseAbi,
  } = await importViem();

  const chain = {
    id: Number(env.NEXT_PUBLIC_CHAIN_ID),
    name: env.NEXT_PUBLIC_CHAIN_NAME || 'Thinkium Mainnet Chain 1',
    nativeCurrency: { name: 'TKM', symbol: env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM', decimals: 18 },
    rpcUrls: { default: { http: [env.NEXT_PUBLIC_THINKIUM_RPC_URL] } },
  };
  const publicClient = createPublicClient({
    chain,
    transport: viemHttp(env.NEXT_PUBLIC_THINKIUM_RPC_URL),
  });
  const groupChatAbi = parseAbi([
    'function groupIdsCount() view returns (uint256)',
    'function groupIds(uint256 offset,uint256 limit,bool reverse) view returns (uint256[])',
    'function chatInfo(uint256 groupId) view returns (uint256 groupId,address owner,bool activated,bool postingAllowed,address scopeSource,address banSource,address beforePostPlugin,address afterPostPlugin,address firstActivatedOwner,uint256 firstActivatedBlockNumber,uint256 firstActivatedTimestamp)',
    'function messagesCount(uint256 groupId) view returns (uint256)',
    'function message(uint256 groupId,uint256 messageId) view returns ((uint256 groupId,uint256 senderId,address senderAddress,uint256 round,uint256 messageId,string content,uint256 blockNumber,uint256 timestamp,uint256[] mentionedSenderIds,bool mentionAll,uint256 quotedMessageId))',
    'function canPost(uint256 groupId,uint256 senderId,address senderAddress) view returns (bool,bytes4)',
    'function postAsDefaultSender(uint256 groupId,string content,uint256[] mentionedSenderIds,bool mentionAll,uint256 quotedMessageId)',
  ]);
  const groupDefaultsAbi = parseAbi([
    'function defaultGroupIdOf(address account) view returns (uint256)',
  ]);

  return {
    chain,
    formatEther,
    getAddress,
    groupChatAbi,
    groupDefaultsAbi,
    publicClient,
  };
}

async function resolveTestGroup({ env, tools, walletAddress }) {
  const explicit = process.env.PUBLIC_TEST_GROUP_ID;
  if (explicit) {
    const groupId = BigInt(explicit);
    assert(groupId > 0n, 'PUBLIC_TEST_GROUP_ID must be positive');
    return groupId;
  }

  const defaultGroupId = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS,
    abi: tools.groupDefaultsAbi,
    functionName: 'defaultGroupIdOf',
    args: [walletAddress],
  });
  assert(defaultGroupId > 0n, `${walletAddress} 未设置默认 LOVE20 NFT，无法用 postAsDefaultSender 发言`);

  const count = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'groupIdsCount',
  });
  assert(count > 0n, 'public_test GroupChat 没有已登记群聊');

  const limit = count < DEFAULT_GROUP_SCAN_LIMIT ? count : DEFAULT_GROUP_SCAN_LIMIT;
  const ids = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'groupIds',
    args: [0n, limit, true],
  });

  for (const groupId of ids) {
    try {
      const info = await tools.publicClient.readContract({
        address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
        abi: tools.groupChatAbi,
        functionName: 'chatInfo',
        args: [groupId],
      });
      if (!tupleValue(info, 'activated', 2) || !tupleValue(info, 'postingAllowed', 3)) continue;
      const canPost = await tools.publicClient.readContract({
        address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
        abi: tools.groupChatAbi,
        functionName: 'canPost',
        args: [groupId, defaultGroupId, walletAddress],
      });
      if (canPost[0]) return groupId;
    } catch (error) {
      console.warn(`跳过 groupId=${groupId.toString()}: ${error.message}`);
    }
  }

  throw new Error(`最近 ${limit.toString()} 个群聊里没有找到 ${walletAddress} 可发言的群；请设置 PUBLIC_TEST_GROUP_ID`);
}

async function createWalletRpcHandler({ env, wallet, tools }) {
  const rpc = makeJsonRpc(env.NEXT_PUBLIC_THINKIUM_RPC_URL);
  const provider = new ethers.providers.JsonRpcProvider(env.NEXT_PUBLIC_THINKIUM_RPC_URL, {
    name: env.NEXT_PUBLIC_CHAIN_NAME || 'thinkium70001',
    chainId: Number(env.NEXT_PUBLIC_CHAIN_ID),
  });
  const signer = wallet.connect(provider);
  const address = tools.getAddress(wallet.address);
  const chainIdHex = `0x${Number(env.NEXT_PUBLIC_CHAIN_ID).toString(16)}`;

  return async function handleWalletRpc(payload) {
    const { method, params = [] } = payload;
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [address];
      case 'eth_chainId':
        return chainIdHex;
      case 'net_version':
        return String(Number(env.NEXT_PUBLIC_CHAIN_ID));
      case 'wallet_switchEthereumChain':
      case 'wallet_addEthereumChain':
        return null;
      case 'personal_sign': {
        const [message, account] = params;
        assert(!account || account.toLowerCase() === address.toLowerCase(), 'personal_sign account mismatch');
        const bytes = ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : ethers.utils.toUtf8Bytes(message);
        return await signer.signMessage(bytes);
      }
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        throw new Error(`${method} is not implemented by this E2E wallet yet`);
      case 'eth_sendTransaction': {
        const tx = params[0] || {};
        assert(!tx.from || tx.from.toLowerCase() === address.toLowerCase(), 'eth_sendTransaction from mismatch');
        const request = {
          to: tx.to,
          data: tx.data,
          value: tx.value ? ethers.BigNumber.from(tx.value) : undefined,
          gasLimit: tx.gas ? ethers.BigNumber.from(tx.gas) : undefined,
          gasPrice: tx.gasPrice ? ethers.BigNumber.from(tx.gasPrice) : undefined,
        };
        if (!request.gasPrice) {
          if (tx.maxFeePerGas) request.maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas);
          if (tx.maxPriorityFeePerGas) request.maxPriorityFeePerGas = ethers.BigNumber.from(tx.maxPriorityFeePerGas);
        }
        Object.keys(request).forEach((key) => {
          if (request[key] === undefined) delete request[key];
        });
        const response = await signer.sendTransaction(request);
        return response.hash;
      }
      default:
        return await rpc(method, params);
    }
  };
}

async function startWalletBridge(handleWalletRpc, { allowedOrigin }) {
  const port = await freePort();
  const token = crypto.randomBytes(32).toString('hex');
  const corsHeaders = {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-love20-e2e-token',
  };
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && origin !== allowedOrigin) {
      res.writeHead(403);
      res.end('origin not allowed');
      return;
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }
    if (req.headers['x-love20-e2e-token'] !== token) {
      res.writeHead(403, corsHeaders);
      res.end('invalid token');
      return;
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await handleWalletRpc(payload);
        res.writeHead(200, {
          'content-type': 'application/json',
          ...corsHeaders,
        });
        res.end(JSON.stringify({ ok: true, result }));
      } catch (error) {
        res.writeHead(200, {
          'content-type': 'application/json',
          ...corsHeaders,
        });
        res.end(JSON.stringify({
          ok: false,
          error: {
            message: error.message || String(error),
            code: error.code,
            data: error.data,
          },
        }));
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', resolve);
    server.on('error', reject);
  });
  return {
    url: `http://127.0.0.1:${port}`,
    token,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function waitForHttp(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {}
    await wait(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startNextServer(env) {
  const port = Number(process.env.PUBLIC_TEST_E2E_PORT || (await freePort()));
  const nodeBin = process.execPath;
  const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  const childEnv = {
    ...process.env,
    ...env,
    NODE_ENV: 'development',
    BASE_PATH: env.NEXT_PUBLIC_BASE_PATH || '',
    ASSET_PREFIX: env.NEXT_PUBLIC_BASE_PATH || '',
    NEXT_TELEMETRY_DISABLED: '1',
    SENTRY_TUNNEL: 'false',
  };
  const next = childProcess.spawn(nodeBin, [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  next.stdout.on('data', (chunk) => process.stdout.write(`[next] ${chunk}`));
  next.stderr.on('data', (chunk) => process.stderr.write(`[next] ${chunk}`));
  next.on('exit', (code) => {
    if (code !== null && code !== 0) console.error(`next dev exited with code ${code}`);
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForHttp(url);
  return {
    url,
    close: () => {
      if (!next.killed) next.kill('SIGTERM');
    },
  };
}

async function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    throw new Error('缺少 playwright 依赖。请先安装依赖后再运行 e2e:group-chat:public-test');
  }
}

async function injectWallet(page, { bridgeUrl, bridgeToken, address, chainId }) {
  await page.addInitScript(({ bridgeUrl: injectedBridgeUrl, bridgeToken: injectedBridgeToken, address: injectedAddress, chainId: injectedChainId }) => {
    const listeners = {};
    const provider = {
      isMetaMask: true,
      selectedAddress: injectedAddress,
      chainId: injectedChainId,
      request: async ({ method, params = [] }) => {
        const response = await fetch(injectedBridgeUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-love20-e2e-token': injectedBridgeToken,
          },
          body: JSON.stringify({ method, params }),
        });
        const payload = await response.json();
        if (!payload.ok) {
          const error = new Error(payload.error?.message || `${method} failed`);
          error.code = payload.error?.code;
          error.data = payload.error?.data;
          throw error;
        }
        return payload.result;
      },
      on: (event, handler) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      },
      removeListener: (event, handler) => {
        listeners[event] = (listeners[event] || []).filter((item) => item !== handler);
      },
      emit: (event, value) => {
        (listeners[event] || []).forEach((handler) => handler(value));
      },
    };
    Object.defineProperty(window, 'ethereum', {
      value: provider,
      configurable: true,
    });
    window.dispatchEvent(new Event('ethereum#initialized'));
  }, { bridgeUrl, bridgeToken, address, chainId });
}

async function findLastMessageByContent({ env, tools, groupId, content }) {
  const count = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'messagesCount',
    args: [groupId],
  });
  const start = count > 20n ? count - 20n : 0n;
  for (let messageId = count; messageId > start; messageId--) {
    const message = await tools.publicClient.readContract({
      address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
      abi: tools.groupChatAbi,
      functionName: 'message',
      args: [groupId, messageId],
    });
    if (tupleValue(message, 'content', 5) === content) return { messageId, message };
  }
  return undefined;
}

async function main() {
  const env = loadPublicTestEnv();
  const { accountName, password } = await readPromptedCredentials();
  const wallet = await unlockWallet(accountName, password);
  const tools = await createChainTools(env);
  const walletAddress = tools.getAddress(wallet.address);
  const chainId = await tools.publicClient.getChainId();
  assert(chainId === Number(env.NEXT_PUBLIC_CHAIN_ID), `RPC chainId mismatch: ${chainId}`);

  const balance = await tools.publicClient.getBalance({ address: walletAddress });
  console.log(`钱包: ${accountName} ${walletAddress}`);
  console.log(`余额: ${tools.formatEther(balance)} ${env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM'}`);
  assert(balance > 0n, `${walletAddress} public_test 余额为 0，无法发送交易`);

  const groupId = await resolveTestGroup({ env, tools, walletAddress });
  const content = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')}`;
  console.log(`测试群聊 groupId=${groupId.toString()}`);
  console.log(`测试消息 ${content}`);

  let next;
  let bridge;
  let browser;

  try {
    next = await startNextServer(env);
    const handleWalletRpc = await createWalletRpcHandler({ env, wallet, tools });
    bridge = await startWalletBridge(handleWalletRpc, { allowedOrigin: new URL(next.url).origin });
    const playwright = await loadPlaywright();
    browser = await playwright.chromium.launch({ headless: process.env.HEADLESS !== '0' });

    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(`[browser] ${message.text()}`);
    });
    page.on('pageerror', (error) => console.error(`[browser] ${error.message}`));

    const chainIdHex = `0x${Number(env.NEXT_PUBLIC_CHAIN_ID).toString(16)}`;
    await injectWallet(page, { bridgeUrl: bridge.url, bridgeToken: bridge.token, address: walletAddress, chainId: chainIdHex });

    const basePath = env.NEXT_PUBLIC_BASE_PATH || '';
    const targetUrl = `${next.url}${basePath}/chat/group?symbol=${encodeURIComponent(env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL)}&groupId=${groupId.toString()}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    const connectButton = page.getByRole('button', { name: /连接钱包/ });
    await connectButton.waitFor({ state: 'visible', timeout: 60000 });
    await connectButton.click();

    try {
      await page.getByLabel('消息内容').waitFor({ state: 'visible', timeout: 90000 });
    } catch (error) {
      const screenshotPath = path.join(ARTIFACT_DIR, `composer-timeout-${Date.now()}.png`);
      const htmlPath = path.join(ARTIFACT_DIR, `composer-timeout-${Date.now()}.html`);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      fs.writeFileSync(htmlPath, await page.content(), 'utf8');
      const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
      console.error(`未找到消息输入框，截图: ${screenshotPath}`);
      console.error(`页面 HTML: ${htmlPath}`);
      console.error(`页面文本片段:\n${bodyText.slice(0, 4000)}`);
      throw error;
    }
    await page.getByLabel('消息内容').fill(content);
    await page.getByRole('button', { name: /^发送$/ }).click();

    await page.getByText(content, { exact: true }).waitFor({ state: 'visible', timeout: 180000 });

    const deadline = Date.now() + 180000;
    let found;
    while (Date.now() < deadline) {
      found = await findLastMessageByContent({ env, tools, groupId, content });
      if (found) break;
      await wait(3000);
    }
    assert(found, '前端显示已发送，但链上没有读到对应消息');
    const senderAddress = tupleValue(found.message, 'senderAddress', 2);
    assert(senderAddress.toLowerCase() === walletAddress.toLowerCase(), '链上消息 senderAddress 不匹配');
    console.log(`E2E 通过: messageId=${found.messageId.toString()}`);
  } finally {
    await browser?.close().catch(() => {});
    next?.close();
    await bridge?.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
