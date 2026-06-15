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

const DEFAULT_MESSAGE_PREFIX = 'public_test_e2e';
const DEFAULT_KEYSTORE_NAMES = ['dev1', 'dev2', 'dev3', 'dev4'];
const KEYSTORE_DIR = path.join(process.env.HOME || '', '.foundry', 'keystores');
const PASSWORD_SENTINEL = '__LOVE20_EMPTY_PASSWORD__';
const ARTIFACT_DIR = path.join(root, 'test-results', 'group-chat-public-test');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const APPROVAL_BUFFER_BPS = 10010n;
const BPS_DENOMINATOR = 10000n;

const ERC20_WRITE_ABI = [
  'function approve(address spender,uint256 amount) returns (bool)',
];
const GROUP_WRITE_ABI = [
  'function mint(string groupName)',
];
const GROUP_CHAT_WRITE_ABI = [
  'function activateChat(uint256 groupId,address scopeSource,address banSource,address beforePostPlugin,address afterPostPlugin)',
];
const GROUP_DELEGATE_WRITE_ABI = [
  'function setDelegateId(uint256 groupId,uint256 delegateId)',
];
const GROUP_ADMIN_WRITE_ABI = [
  'function addAdmins(uint256 groupId,uint256[] adminIds)',
];
const GROUP_MEMBER_WRITE_ABI = [
  'function addMemberIds(uint256 groupId,uint256[] memberIds)',
];
const GROUP_BAN_LIST_WRITE_ABI = [
  'function banBySenderIds(uint256 groupId,uint256[] senderIds)',
  'function unbanBySenderIds(uint256 groupId,uint256[] senderIds)',
];

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

async function promptCredentialsInBrowser({ defaultAccountName = 'dev1', accountNames } = {}) {
  const multiAccountNames = accountNames && accountNames.length > 0 ? accountNames : undefined;
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
    ${multiAccountNames
      ? `<p>将使用 Foundry keystore: ${multiAccountNames.join(', ')}</p>`
      : `<label for="accountName">Foundry keystore 名字</label>
    <input id="accountName" name="accountName" value="${defaultAccountName}" autocomplete="off" required autofocus />`}
    <label for="password">Keystore 密码</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required ${multiAccountNames ? 'autofocus' : ''} />
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
        const accountName = multiAccountNames ? '' : params.get('accountName') || '';
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

function parseKeystoreNamesFromEnv() {
  const raw = process.env.PUBLIC_TEST_KEYSTORES;
  if (!raw) return process.env.PUBLIC_TEST_KEYSTORE ? undefined : DEFAULT_KEYSTORE_NAMES;
  const names = raw.split(',').map((item) => item.trim()).filter(Boolean);
  assert(names.length > 0, 'PUBLIC_TEST_KEYSTORES 不能为空');
  names.forEach((name) => {
    assert(name && !name.includes('/') && !name.includes('\\'), `keystore 名字无效: ${name}`);
  });
  return names;
}

async function readPromptedCredentials() {
  const accountNames = parseKeystoreNamesFromEnv();
  if (accountNames) {
    const prompted =
      process.env.PUBLIC_TEST_KEYSTORE_PASSWORD !== undefined
        ? undefined
        : await promptCredentialsInBrowser({ accountNames });
    const password =
      process.env.PUBLIC_TEST_KEYSTORE_PASSWORD === PASSWORD_SENTINEL
        ? ''
        : process.env.PUBLIC_TEST_KEYSTORE_PASSWORD ?? prompted?.password ?? await promptPassword('LOVE20 public_test E2E', `输入 ${accountNames.join(', ')} 的共享 keystore 密码`);
    return accountNames.map((accountName) => ({ accountName, password }));
  }

  const prompted =
    process.env.PUBLIC_TEST_KEYSTORE && process.env.PUBLIC_TEST_KEYSTORE_PASSWORD !== undefined
      ? undefined
      : await promptCredentialsInBrowser({ defaultAccountName: process.env.PUBLIC_TEST_KEYSTORE || 'dev1' });
  const accountName = process.env.PUBLIC_TEST_KEYSTORE || prompted?.accountName || '';
  assert(accountName && !accountName.includes('/') && !accountName.includes('\\'), 'keystore 名字无效');

  const password =
    process.env.PUBLIC_TEST_KEYSTORE_PASSWORD === PASSWORD_SENTINEL
      ? ''
      : process.env.PUBLIC_TEST_KEYSTORE_PASSWORD ?? prompted?.password ?? await promptPassword('LOVE20 public_test E2E', `输入 ${accountName} 的 keystore 密码`);

  return [{ accountName, password }];
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
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN), '.env.public_test must define first token address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP), '.env.public_test must define Group address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT), '.env.public_test must define GroupChat address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS), '.env.public_test must define GroupDefaults address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN), '.env.public_test must define GroupAdmin address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST), '.env.public_test must define GroupBanList address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER), '.env.public_test must define GroupMember address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE), '.env.public_test must define GroupMemberScope address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE), '.env.public_test must define AdminBanSource address');
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
  try {
    return await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
  } catch (error) {
    throw new Error(`解锁 Foundry keystore ${accountName} 失败: ${error.message || String(error)}`);
  }
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

function makeLocalTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absOffsetMinutes / 60);
  const offsetRemainderMinutes = absOffsetMinutes % 60;
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    offsetSign,
    pad(offsetHours),
    pad(offsetRemainderMinutes),
  ].join('');
}

function makeTestGroupName() {
  const scriptName = path.basename(__filename, path.extname(__filename));
  const timestamp = makeLocalTimestamp();
  const prefix = process.env.PUBLIC_TEST_GROUP_NAME_PREFIX || scriptName;
  return `${prefix}-${timestamp}-${crypto.randomBytes(3).toString('hex')}`;
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
    'function GROUP_DELEGATE_ADDRESS() view returns (address)',
    ...GROUP_CHAT_WRITE_ABI,
    'function postAsDefaultSender(uint256 groupId,string content,uint256[] mentionedSenderIds,bool mentionAll,uint256 quotedMessageId)',
  ]);
  const groupDefaultsAbi = parseAbi([
    'function defaultGroupIdOf(address account) view returns (uint256)',
  ]);
  const erc20Abi = parseAbi(ERC20_WRITE_ABI);
  const groupAbi = parseAbi([
    'function calculateMintCost(string groupName) view returns (uint256)',
    'function tokenIdOf(string groupName) view returns (uint256)',
    ...GROUP_WRITE_ABI,
    'event Mint(uint256 indexed tokenId,address indexed owner,string groupName,string normalizedName,uint256 cost)',
  ]);
  const groupAdminAbi = parseAbi([
    'function adminIds(uint256 groupId) view returns (uint256[] ids,bool[] isEffective)',
    'function ownerOrDelegateIdOf(uint256 groupId,address account) view returns (uint256)',
    ...GROUP_ADMIN_WRITE_ABI,
  ]);
  const groupDelegateAbi = parseAbi([
    'function delegateIdOf(uint256 groupId) view returns (uint256)',
    ...GROUP_DELEGATE_WRITE_ABI,
  ]);
  const groupMemberAbi = parseAbi([
    'function memberIds(uint256 groupId,uint256 offset,uint256 limit) view returns (uint256[])',
    'function isMemberId(uint256 groupId,uint256 memberId) view returns (bool)',
    ...GROUP_MEMBER_WRITE_ABI,
  ]);
  const groupBanListAbi = parseAbi([
    'function isSenderIdBanned(uint256 groupId,uint256 senderId) view returns (bool)',
    ...GROUP_BAN_LIST_WRITE_ABI,
  ]);

  return {
    chain,
    erc20Abi,
    formatEther,
    getAddress,
    groupAbi,
    groupAdminAbi,
    groupBanListAbi,
    groupChatAbi,
    groupDelegateAbi,
    groupDefaultsAbi,
    groupMemberAbi,
    publicClient,
  };
}

async function defaultGroupIdOf({ env, tools, walletAddress }) {
  const defaultGroupId = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS,
    abi: tools.groupDefaultsAbi,
    functionName: 'defaultGroupIdOf',
    args: [walletAddress],
  });
  assert(defaultGroupId > 0n, `${walletAddress} 未设置默认 LOVE20 NFT，无法用 postAsDefaultSender 发言`);
  return defaultGroupId;
}

function createEthersProvider(env) {
  return new ethers.providers.JsonRpcProvider(env.NEXT_PUBLIC_THINKIUM_RPC_URL, {
    name: env.NEXT_PUBLIC_CHAIN_NAME || 'thinkium70001',
    chainId: Number(env.NEXT_PUBLIC_CHAIN_ID),
  });
}

async function sendContractTx({ env, tools, participant, address, abi, functionName, args, label }) {
  const { encodeFunctionData } = await importViem();
  const signer = participant.wallet.connect(createEthersProvider(env));
  const data = encodeFunctionData({ abi, functionName, args });
  const tx = await signer.sendTransaction({ to: address, data });
  console.log(`${label}: ${tx.hash}`);
  const receipt = await tools.publicClient.waitForTransactionReceipt({
    hash: tx.hash,
    timeout: 180000,
  });
  assert(receipt.status === 'success', `${label} 交易失败: ${tx.hash}`);
  return receipt;
}

async function mintFreshGroup({ env, tools, participant, groupName }) {
  const mintCost = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP,
    abi: tools.groupAbi,
    functionName: 'calculateMintCost',
    args: [groupName],
  });
  const approveAmount = (mintCost * APPROVAL_BUFFER_BPS) / BPS_DENOMINATOR;
  await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN,
    abi: tools.erc20Abi,
    functionName: 'approve',
    args: [env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP, approveAmount],
    label: `${participant.accountName} approve group mint`,
  });
  const receipt = await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP,
    abi: tools.groupAbi,
    functionName: 'mint',
    args: [groupName],
    label: `${participant.accountName} mint group`,
  });
  const { parseEventLogs } = await importViem();
  const mintLogs = parseEventLogs({
    abi: tools.groupAbi,
    logs: receipt.logs,
    eventName: 'Mint',
  });
  const mintLog = mintLogs.find((log) => log.args?.owner?.toLowerCase?.() === participant.address.toLowerCase());
  assert(mintLog?.args?.tokenId > 0n, `mint receipt 中未找到 groupName=${groupName} 的 Mint 事件`);
  const groupId = mintLog.args.tokenId;
  return groupId;
}

async function activateFreshGroupChat({ env, tools, participant, groupId }) {
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE), '.env.public_test must define GroupMemberScope address');
  assert(isAddress(env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE), '.env.public_test must define AdminBanSource address');
  await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'activateChat',
    args: [
      groupId,
      env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE,
      env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
    ],
    label: `${participant.accountName} activate group chat`,
  });
  const info = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'chatInfo',
    args: [groupId],
  });
  assert(tupleValue(info, 'activated', 2) === true, '新链群激活后 chatInfo.activated 应为 true');
  assert(tupleValue(info, 'scopeSource', 4).toLowerCase() === env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE.toLowerCase(), '新链群 scopeSource 不匹配');
  assert(tupleValue(info, 'banSource', 5).toLowerCase() === env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE.toLowerCase(), '新链群 banSource 不匹配');
  return info;
}

async function addGroupMembers({ env, tools, participant, groupId, memberIds }) {
  await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER,
    abi: tools.groupMemberAbi,
    functionName: 'addMemberIds',
    args: [groupId, memberIds],
    label: `${participant.accountName} add group members`,
  });
  for (const memberId of memberIds) {
    const isMember = await tools.publicClient.readContract({
      address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER,
      abi: tools.groupMemberAbi,
      functionName: 'isMemberId',
      args: [groupId, memberId],
    });
    assert(isMember === true, `成员 NFT #${memberId.toString()} 未加入成员名单`);
  }
}

async function addGroupAdmins({ env, tools, participant, groupId, adminIds }) {
  await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN,
    abi: tools.groupAdminAbi,
    functionName: 'addAdmins',
    args: [groupId, adminIds],
    label: `${participant.accountName} add group admins`,
  });
  const records = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN,
    abi: tools.groupAdminAbi,
    functionName: 'adminIds',
    args: [groupId],
  });
  const ids = tupleArray(records, 'ids', 0);
  const effectiveFlags = tupleArray(records, 'isEffective', 1);
  const effective = new Set(ids.filter((_id, index) => Boolean(effectiveFlags[index])).map((id) => id.toString()));
  adminIds.forEach((adminId) => {
    assert(effective.has(adminId.toString()), `管理员 NFT #${adminId.toString()} 未生效`);
  });
}

async function readGroupDelegateAddress({ env, tools }) {
  const address = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'GROUP_DELEGATE_ADDRESS',
  });
  assert(isAddress(address) && address.toLowerCase() !== ZERO_ADDRESS, 'GroupChat.GROUP_DELEGATE_ADDRESS 未配置');
  return address;
}

async function setGroupDelegate({ env, tools, participant, groupId, delegateId }) {
  const delegateAddress = await readGroupDelegateAddress({ env, tools });
  await sendContractTx({
    env,
    tools,
    participant,
    address: delegateAddress,
    abi: tools.groupDelegateAbi,
    functionName: 'setDelegateId',
    args: [groupId, delegateId],
    label: `${participant.accountName} set group delegate ${delegateId.toString()}`,
  });
  const effectiveDelegateId = await tools.publicClient.readContract({
    address: delegateAddress,
    abi: tools.groupDelegateAbi,
    functionName: 'delegateIdOf',
    args: [groupId],
  });
  assert(effectiveDelegateId === delegateId, `代理 NFT 不匹配: expected ${delegateId.toString()}, got ${effectiveDelegateId.toString()}`);
}

async function assertOwnerOrDelegate({ env, tools, groupId, participant }) {
  const ownerOrDelegateId = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN,
    abi: tools.groupAdminAbi,
    functionName: 'ownerOrDelegateIdOf',
    args: [groupId, participant.address],
  });
  assert(
    ownerOrDelegateId === participant.defaultGroupId,
    `${participant.accountName} ownerOrDelegateIdOf 不匹配: expected ${participant.defaultGroupId.toString()}, got ${ownerOrDelegateId.toString()}`,
  );
}

async function setSenderIdBan({ env, tools, participant, groupId, senderId, banned }) {
  await sendContractTx({
    env,
    tools,
    participant,
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST,
    abi: tools.groupBanListAbi,
    functionName: banned ? 'banBySenderIds' : 'unbanBySenderIds',
    args: [groupId, [senderId]],
    label: `${participant.accountName} ${banned ? 'ban' : 'unban'} senderId ${senderId.toString()}`,
  });
  const isBanned = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST,
    abi: tools.groupBanListAbi,
    functionName: 'isSenderIdBanned',
    args: [groupId, senderId],
  });
  assert(Boolean(isBanned) === banned, `senderId ${senderId.toString()} 禁言状态不匹配`);
}

async function walletCanPostInGroup({ env, tools, groupId, participant }) {
  const canPost = await tools.publicClient.readContract({
    address: env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT,
    abi: tools.groupChatAbi,
    functionName: 'canPost',
    args: [groupId, participant.defaultGroupId, participant.address],
  });
  return Boolean(canPost[0]);
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
    SENTRY_DSN: '',
    NEXT_PUBLIC_SENTRY_DSN: '',
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

async function sendMessageFromComposer(page, content) {
  const composer = page.getByLabel('消息内容');
  const sendButton = page.getByRole('button', { name: /^发送$/ });
  await composer.fill(content);
  await sendButton.waitFor({ state: 'visible', timeout: 30000 });
  await sendButton.waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForFunction(
    (button) => button instanceof HTMLButtonElement && !button.disabled,
    await sendButton.elementHandle(),
    { timeout: 180000 },
  );
  await sendButton.click();
  await page.waitForFunction(
    (textarea) => textarea instanceof HTMLTextAreaElement && textarea.value.trim() === '',
    await composer.elementHandle(),
    { timeout: 180000 },
  );
}

async function waitForChainMessage({ env, tools, groupId, content, timeoutMs = 180000 }) {
  const deadline = Date.now() + timeoutMs;
  let found;
  while (Date.now() < deadline) {
    found = await findLastMessageByContent({ env, tools, groupId, content });
    if (found) return found;
    await wait(3000);
  }
  return undefined;
}

async function openMessageMenu(page, content) {
  const messageRow = page.locator('article.message-row', { hasText: content }).last();
  await messageRow.waitFor({ state: 'visible', timeout: 30000 });
  await messageRow.click();
  return messageRow;
}

function tupleArray(value, key, index) {
  return Array.from(tupleValue(value, key, index) || []);
}

async function openChatAsParticipant({ browser, env, next, bridge, participant, groupId }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`[browser:${participant.accountName}] ${message.text()}`);
  });
  page.on('pageerror', (error) => console.error(`[browser:${participant.accountName}] ${error.message}`));
  page.on('response', (response) => {
    if (response.status() === 429) {
      console.error(`[browser:${participant.accountName}] 429 ${response.url()}`);
    }
  });

  const chainIdHex = `0x${Number(env.NEXT_PUBLIC_CHAIN_ID).toString(16)}`;
  await injectWallet(page, {
    bridgeUrl: bridge.url,
    bridgeToken: bridge.token,
    address: participant.address,
    chainId: chainIdHex,
  });

  const basePath = env.NEXT_PUBLIC_BASE_PATH || '';
  const targetUrl = `${next.url}${basePath}/chat/group?symbol=${encodeURIComponent(env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL)}&groupId=${groupId.toString()}`;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  const connectButton = page.getByRole('button', { name: /连接钱包/ });
  await connectButton.waitFor({ state: 'visible', timeout: 60000 });
  await connectButton.click();

  try {
    await page.getByLabel('消息内容').waitFor({ state: 'visible', timeout: 90000 });
  } catch (error) {
    const screenshotPath = path.join(ARTIFACT_DIR, `composer-timeout-${participant.accountName}-${Date.now()}.png`);
    const htmlPath = path.join(ARTIFACT_DIR, `composer-timeout-${participant.accountName}-${Date.now()}.html`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    fs.writeFileSync(htmlPath, await page.content(), 'utf8');
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    console.error(`未找到消息输入框，截图: ${screenshotPath}`);
    console.error(`页面 HTML: ${htmlPath}`);
    console.error(`页面文本片段:\n${bodyText.slice(0, 4000)}`);
    await context.close().catch(() => {});
    throw error;
  }

  return { context, page };
}

async function main() {
  const env = loadPublicTestEnv();
  const credentials = await readPromptedCredentials();
  const tools = await createChainTools(env);
  const chainId = await tools.publicClient.getChainId();
  assert(chainId === Number(env.NEXT_PUBLIC_CHAIN_ID), `RPC chainId mismatch: ${chainId}`);

  const participants = [];
  for (const credential of credentials) {
    const wallet = await unlockWallet(credential.accountName, credential.password);
    const address = tools.getAddress(wallet.address);
    const balance = await tools.publicClient.getBalance({ address });
    const defaultGroupId = await defaultGroupIdOf({ env, tools, walletAddress: address });
    console.log(`钱包: ${credential.accountName} ${address}`);
    console.log(`余额: ${tools.formatEther(balance)} ${env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM'}`);
    console.log(`默认 NFT: ${defaultGroupId.toString()}`);
    assert(balance > 0n, `${address} public_test 余额为 0，无法发送交易`);
    participants.push({ ...credential, wallet, address, defaultGroupId });
  }
  const primary = participants[0];
  const nonPrimaryParticipants = participants.filter((item) => item.address.toLowerCase() !== primary.address.toLowerCase());
  const distinctAddresses = new Set(participants.map((participant) => participant.address.toLowerCase()));
  assert(
    participants.length >= 4 && distinctAddresses.size >= 4 && nonPrimaryParticipants.length >= 3,
    'public_test 群聊 E2E 至少需要 4 个不同地址的钱包，分别覆盖 owner、mention target、admin、delegate',
  );
  const mentionTarget = nonPrimaryParticipants[0];
  const adminTarget = nonPrimaryParticipants[1];
  const delegateTarget = nonPrimaryParticipants[2];
  const delegateBanTarget = mentionTarget;
  const groupName = makeTestGroupName();
  const content = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:member:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')}`;
  const mentionAllContent = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:all:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')} @所有人`;
  const adminMentionAllContent = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:admin-all:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')} @所有人`;
  const delegateMentionAllContent = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:delegate-all:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')} @所有人`;
  const replyContent = `${process.env.PUBLIC_TEST_MESSAGE_PREFIX || DEFAULT_MESSAGE_PREFIX}:reply:${new Date().toISOString()}:${crypto.randomBytes(4).toString('hex')}`;

  const groupId = await mintFreshGroup({ env, tools, participant: primary, groupName });
  await activateFreshGroupChat({ env, tools, participant: primary, groupId });
  await addGroupMembers({
    env,
    tools,
    participant: primary,
    groupId,
    memberIds: participants.map((participant) => participant.defaultGroupId),
  });
  await addGroupAdmins({
    env,
    tools,
    participant: primary,
    groupId,
    adminIds: [adminTarget.defaultGroupId],
  });
  await setGroupDelegate({
    env,
    tools,
    participant: primary,
    groupId,
    delegateId: delegateTarget.defaultGroupId,
  });
  await assertOwnerOrDelegate({ env, tools, groupId, participant: delegateTarget });
  await setSenderIdBan({
    env,
    tools,
    participant: primary,
    groupId,
    senderId: mentionTarget.defaultGroupId,
    banned: true,
  });
  assert(!await walletCanPostInGroup({ env, tools, groupId, participant: mentionTarget }), `${mentionTarget.accountName} 被禁言后仍可发言`);
  await setSenderIdBan({
    env,
    tools,
    participant: primary,
    groupId,
    senderId: mentionTarget.defaultGroupId,
    banned: false,
  });
  assert(await walletCanPostInGroup({ env, tools, groupId, participant: mentionTarget }), `${mentionTarget.accountName} 解禁后仍不可发言`);
  await setSenderIdBan({
    env,
    tools,
    participant: delegateTarget,
    groupId,
    senderId: delegateBanTarget.defaultGroupId,
    banned: true,
  });
  assert(!await walletCanPostInGroup({ env, tools, groupId, participant: delegateBanTarget }), `${delegateTarget.accountName} 作为代理禁言 ${delegateBanTarget.accountName} 后，对方仍可发言`);
  await setSenderIdBan({
    env,
    tools,
    participant: delegateTarget,
    groupId,
    senderId: delegateBanTarget.defaultGroupId,
    banned: false,
  });
  assert(await walletCanPostInGroup({ env, tools, groupId, participant: delegateBanTarget }), `${delegateTarget.accountName} 作为代理解禁 ${delegateBanTarget.accountName} 后，对方仍不可发言`);

  console.log(`测试新链群 groupId=${groupId.toString()} name=${groupName}`);
  console.log(`测试代理 ${delegateTarget.accountName} NFT=${delegateTarget.defaultGroupId.toString()}`);
  console.log(`测试成员消息 ${content}`);
  console.log(`测试 @所有人 ${mentionAllContent}`);
  console.log(`测试管理员 @所有人 ${adminMentionAllContent}`);
  console.log(`测试代理 @所有人 ${delegateMentionAllContent}`);
  console.log(`测试回复 ${replyContent}`);

  let next;
  const bridges = [];
  let browser;

  try {
    next = await startNextServer(env);
    const playwright = await loadPlaywright();
    browser = await playwright.chromium.launch({ headless: process.env.HEADLESS !== '0' });

    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    const participantMessages = new Map();

    for (const participant of nonPrimaryParticipants) {
      const handleWalletRpc = await createWalletRpcHandler({ env, wallet: participant.wallet, tools });
      const bridge = await startWalletBridge(handleWalletRpc, { allowedOrigin: new URL(next.url).origin });
      bridges.push(bridge);
      const { context, page } = await openChatAsParticipant({ browser, env, next, bridge, participant, groupId });
      try {
        const participantContent = `${content}:${participant.accountName}`;
        await sendMessageFromComposer(page, participantContent);
        const found = await waitForChainMessage({ env, tools, groupId, content: participantContent });
        assert(found, `${participant.accountName} 前端显示已发送，但链上没有读到对应消息`);
        const senderAddress = tupleValue(found.message, 'senderAddress', 2);
        assert(senderAddress.toLowerCase() === participant.address.toLowerCase(), `${participant.accountName} 链上消息 senderAddress 不匹配`);
        const senderId = tupleValue(found.message, 'senderId', 1);
        assert(senderId === participant.defaultGroupId, `${participant.accountName} 链上消息 senderId 不匹配`);
        participantMessages.set(participant.accountName, { content: participantContent, found, senderId });
        console.log(`${participant.accountName} 发言通过: messageId=${found.messageId.toString()}`);
        if (participant === adminTarget) {
          await sendMessageFromComposer(page, adminMentionAllContent);
          const adminMentionAll = await waitForChainMessage({ env, tools, groupId, content: adminMentionAllContent });
          assert(adminMentionAll, `${participant.accountName} 前端显示管理员 @所有人 已发送，但链上没有读到对应消息`);
          assert(tupleValue(adminMentionAll.message, 'mentionAll', 9) === true, '链上管理员 @所有人 消息 mentionAll 应为 true');
          const adminSenderAddress = tupleValue(adminMentionAll.message, 'senderAddress', 2);
          assert(adminSenderAddress.toLowerCase() === participant.address.toLowerCase(), '链上管理员 @所有人 senderAddress 不匹配');
          console.log(`${participant.accountName} 管理员 @所有人 通过: messageId=${adminMentionAll.messageId.toString()}`);
        }
        if (participant === delegateTarget) {
          await sendMessageFromComposer(page, delegateMentionAllContent);
          const delegateMentionAll = await waitForChainMessage({ env, tools, groupId, content: delegateMentionAllContent });
          assert(delegateMentionAll, `${participant.accountName} 前端显示代理 @所有人 已发送，但链上没有读到对应消息`);
          assert(tupleValue(delegateMentionAll.message, 'mentionAll', 9) === true, '链上代理 @所有人 消息 mentionAll 应为 true');
          const delegateSenderAddress = tupleValue(delegateMentionAll.message, 'senderAddress', 2);
          assert(delegateSenderAddress.toLowerCase() === participant.address.toLowerCase(), '链上代理 @所有人 senderAddress 不匹配');
          console.log(`${participant.accountName} 代理 @所有人 通过: messageId=${delegateMentionAll.messageId.toString()}`);
        }
      } finally {
        await context.close().catch(() => {});
      }
    }

    const targetMessage = participantMessages.get(mentionTarget.accountName);
    assert(targetMessage, `${mentionTarget.accountName} 没有可用于提及/引用的测试消息`);
    const handleWalletRpc = await createWalletRpcHandler({ env, wallet: primary.wallet, tools });
    const bridge = await startWalletBridge(handleWalletRpc, { allowedOrigin: new URL(next.url).origin });
    bridges.push(bridge);
    const { context, page } = await openChatAsParticipant({ browser, env, next, bridge, participant: primary, groupId });
    try {
      await page.getByText(targetMessage.content, { exact: true }).waitFor({ state: 'visible', timeout: 180000 });
      await sendMessageFromComposer(page, mentionAllContent);
      const mentionAllMessage = await waitForChainMessage({ env, tools, groupId, content: mentionAllContent });
      assert(mentionAllMessage, '前端显示 @所有人 已发送，但链上没有读到对应消息');
      assert(tupleValue(mentionAllMessage.message, 'mentionAll', 9) === true, '链上 @所有人 消息 mentionAll 应为 true');
      assert(tupleArray(mentionAllMessage.message, 'mentionedSenderIds', 8).length === 0, '链上 @所有人 消息不应携带 mentionedSenderIds');

      let targetMessageRow = await openMessageMenu(page, targetMessage.content);
      await targetMessageRow.getByRole('button', { name: '提及' }).click();
      const composer = page.getByLabel('消息内容');
      const mentionDraft = await waitForMentionDraft(composer);

      targetMessageRow = await openMessageMenu(page, targetMessage.content);
      await targetMessageRow.getByRole('button', { name: '引用' }).click();
      await page.getByText(`引用 ${targetMessage.content.slice(0, 17)}…`).waitFor({ state: 'visible', timeout: 30000 });

      const finalReplyContent = `${mentionDraft}${replyContent}`;
      await sendMessageFromComposer(page, finalReplyContent);
      const reply = await waitForChainMessage({ env, tools, groupId, content: finalReplyContent });
      assert(reply, '前端显示引用回复已发送，但链上没有读到对应消息');
      const replySenderAddress = tupleValue(reply.message, 'senderAddress', 2);
      assert(replySenderAddress.toLowerCase() === primary.address.toLowerCase(), '链上回复 senderAddress 不匹配');
      const mentionedSenderIds = tupleArray(reply.message, 'mentionedSenderIds', 8).map((value) => BigInt(value));
      assert(
        mentionedSenderIds.length === 1 && mentionedSenderIds[0] === targetMessage.senderId,
        `链上回复 mentionedSenderIds 不匹配: expected [${targetMessage.senderId.toString()}], got [${mentionedSenderIds.map((value) => value.toString()).join(',')}]`,
      );
      assert(tupleValue(reply.message, 'mentionAll', 9) === false, '链上回复不应设置 mentionAll');
      assert(tupleValue(reply.message, 'quotedMessageId', 10) === targetMessage.found.messageId, '链上回复 quotedMessageId 不匹配');
      await page.getByText(targetMessage.content, { exact: true }).last().waitFor({ state: 'visible', timeout: 180000 });

      console.log(`E2E 通过: quotedMessageId=${targetMessage.found.messageId.toString()}, replyMessageId=${reply.messageId.toString()}`);
    } finally {
      await context.close().catch(() => {});
    }
  } finally {
    await browser?.close().catch(() => {});
    next?.close();
    await Promise.all(bridges.map((bridge) => bridge.close().catch(() => {})));
  }
}

async function waitForMentionDraft(locator, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastValue = '';
  while (Date.now() < deadline) {
    lastValue = await locator.inputValue().catch(() => '');
    if (lastValue.trim().startsWith('@')) return lastValue;
    await wait(250);
  }
  throw new Error(`textarea value should contain a mention draft, got ${lastValue}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
