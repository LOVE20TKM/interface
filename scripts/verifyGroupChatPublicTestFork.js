#!/usr/bin/env node

const {
  assert,
  castCall,
  castRpc,
  childProcess,
  freePort,
  isAddress,
  loadEnv,
  root,
  run,
  wait,
} = require('./groupChatVerifyUtils');

const HIGH_GAS_PRICE = '1000gwei';
const LARGE_BALANCE = '0x3635C9ADC5DEA00000';
const APPROVAL_BUFFER_BPS = 10010n;
const BPS_DENOMINATOR = 10000n;

function castSend(rpc, from, to, signature, args, label) {
  const output = run(
    'cast',
    [
      'send',
      '--legacy',
      '--gas-price',
      HIGH_GAS_PRICE,
      '--unlocked',
      '--rpc-url',
      rpc,
      '--from',
      from,
      to,
      signature,
      ...args,
    ],
    { timeout: 60000 },
  );
  assert(/status\s+1 \(success\)/.test(output), `${label} did not succeed`);
}

function expectCall(rpc, to, signature, args, expected, label) {
  const output = castCall(rpc, to, signature, args);
  assert(output === expected, `${label} expected ${expected}, got ${output}`);
}

function parseUint(output, label) {
  const match = output.match(/^\d+/);
  assert(match, `${label} must start with a uint value, got ${output}`);
  return BigInt(match[0]);
}

function parseUintArrays(output, label) {
  const arrays = [...output.matchAll(/\[([^\]]*)\]/g)].map((match) => {
    const body = match[1].trim();
    if (!body) return [];
    return body.split(',').map((value) => {
      const match = value.trim().match(/^\d+/);
      assert(match, `${label} array item must start with a uint value, got ${value}`);
      return BigInt(match[0]);
    });
  });
  assert(arrays.length >= 2, `${label} must decode at least two uint arrays, got ${output}`);
  return arrays;
}

function expectVoteWeights(output, expectedSupport, expectedOppose, label) {
  const [supportWeights, opposeWeights] = parseUintArrays(output, label);
  const support = supportWeights[0] || 0n;
  const oppose = opposeWeights[0] || 0n;
  assert(
    expectedSupport === 'positive' ? support > 0n : support === BigInt(expectedSupport),
    `${label} support weight mismatch: ${support.toString()}`,
  );
  assert(
    expectedOppose === 'positive' ? oppose > 0n : oppose === BigInt(expectedOppose),
    `${label} oppose weight mismatch: ${oppose.toString()}`,
  );
}

function chatInfoOwner(output) {
  const match = output.match(/^\((\d+),\s*(0x[0-9a-fA-F]{40}),\s*(true|false),/);
  assert(match, `chatInfo output is not decoded: ${output}`);
  return {
    groupId: match[1],
    owner: match[2],
    activated: match[3] === 'true',
  };
}

function findUnactivatedActionId(rpc, submit, manager, token) {
  const actionsCount = parseUint(castCall(rpc, submit, 'actionsCount(address)(uint256)', [token]), 'actionsCount');
  assert(actionsCount > 0n, 'public-test token must have at least one action for activation verification');

  for (let actionId = actionsCount - 1n; actionId >= 0n; actionId--) {
    const existingGroupId = parseUint(
      castCall(rpc, manager, 'groupIdOfAction(address,uint256)(uint256)', [token, actionId.toString()]),
      'groupIdOfAction',
    );
    if (existingGroupId === 0n) {
      return actionId;
    }
    if (actionId === 0n) break;
  }

  throw new Error('public-test token has no unactivated action for manager activation verification');
}

function verifyActionActivation({
  forkRpc,
  payer,
  token,
  group,
  groupChat,
  submit,
  manager,
  label,
}) {
  const actionId = findUnactivatedActionId(forkRpc, submit, manager, token);
  const mintCost = parseUint(castCall(forkRpc, group, 'calculateMintCost(string)(uint256)', ['GroupChatCost']), 'mintCost');
  const approveAmount = ((mintCost * APPROVAL_BUFFER_BPS) / BPS_DENOMINATOR).toString();

  castSend(
    forkRpc,
    payer,
    token,
    'approve(address,uint256)',
    [manager, approveAmount],
    `${label} approve mint cost`,
  );
  castSend(
    forkRpc,
    payer,
    manager,
    'activate(address,uint256)',
    [token, actionId.toString()],
    `${label} activate`,
  );

  const activatedGroupId = castCall(forkRpc, manager, 'groupIdOfAction(address,uint256)(uint256)', [
    token,
    actionId.toString(),
  ]);
  assert(parseUint(activatedGroupId, `${label} groupIdOfAction`) > 0n, `${label} groupIdOfAction must be set after activation`);

  const actionOfGroup = castCall(forkRpc, manager, 'actionOfGroup(uint256)((address,uint256))', [activatedGroupId]);
  assert(
    actionOfGroup.toLowerCase().includes(token.toLowerCase()) && actionOfGroup.includes(actionId.toString()),
    `${label} actionOfGroup must point back to token/action ${token}/${actionId.toString()}`,
  );

  const info = chatInfoOwner(
    castCall(
      forkRpc,
      groupChat,
      'chatInfo(uint256)((uint256,address,bool,bool,address,address,address,address,address,uint256,uint256))',
      [activatedGroupId],
    ),
  );
  assert(info.groupId === activatedGroupId, `${label} chatInfo groupId mismatch`);
  assert(info.activated, `${label} chatInfo must be activated`);
  assert(info.owner.toLowerCase() === manager.toLowerCase(), `${label} chat owner must be the manager`);

  return { actionId: actionId.toString(), groupId: activatedGroupId };
}

async function startFork(rpcUrl) {
  const port = await freePort();
  const forkRpc = `http://127.0.0.1:${port}`;
  const output = [];
  const anvil = childProcess.spawn(
    'anvil',
    ['--fork-url', rpcUrl, '--host', '127.0.0.1', '--port', String(port), '--silent'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  anvil.stdout.on('data', (chunk) => output.push(chunk.toString()));
  anvil.stderr.on('data', (chunk) => output.push(chunk.toString()));

  for (let attempt = 0; attempt < 40; attempt++) {
    if (anvil.exitCode !== null) {
      throw new Error(`anvil exited early: ${output.join('').trim()}`);
    }
    try {
      run('cast', ['block-number', '--rpc-url', forkRpc], { timeout: 1000 });
      return { anvil, forkRpc };
    } catch {
      await wait(500);
    }
  }
  anvil.kill('SIGTERM');
  throw new Error(`anvil fork did not start: ${output.join('').trim()}`);
}

function checkEnv(env) {
  const required = [
    'NEXT_PUBLIC_THINKIUM_RPC_URL',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT',
  ];
  required.forEach((key) => assert(env[key], `.env.public_test must define ${key}`));
  required
    .filter((key) => key !== 'NEXT_PUBLIC_THINKIUM_RPC_URL')
    .forEach((key) => assert(isAddress(env[key]), `.env.public_test ${key} must be a valid address`));
}

async function main() {
  run('which', ['anvil']);
  run('which', ['cast']);

  const env = loadEnv('.env.public_test');
  checkEnv(env);

  const { anvil, forkRpc } = await startFork(env.NEXT_PUBLIC_THINKIUM_RPC_URL);
  try {
    const groupChat = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT;
    const groupAdmin = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN;
    const groupMember = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER;
    const groupBanList = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST;
    const tokenMain = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER;
    const tokenActionMain = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER;
    const tokenActionGov = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER;
    const groupDefaults = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS;
    const group = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP;
    const submit = env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT;
    const firstToken = env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN;
    const govBan = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE;
    const zero = '0x0000000000000000000000000000000000000000';

    const senderAddress = env.NEXT_PUBLIC_GROUP_CHAT_VERIFY_SENDER || '0xF54fE3eb23c2068A4502A6302927333e93e43CA1';
    const senderId = castCall(forkRpc, groupDefaults, 'defaultGroupIdOf(address)(uint256)', [senderAddress]);
    assert(BigInt(senderId) > 0n, 'fork verification sender must have a default NFT');

    [tokenMain, senderAddress].forEach((account) => {
      castRpc(forkRpc, 'anvil_impersonateAccount', [account]);
      castRpc(forkRpc, 'anvil_setBalance', [account, LARGE_BALANCE]);
    });

    let groupId = castCall(forkRpc, tokenMain, 'groupIdOfToken(address)(uint256)', [firstToken]);
    if (BigInt(groupId) === 0n) {
      const mintCost = parseUint(castCall(forkRpc, group, 'calculateMintCost(string)(uint256)', ['GroupChatCost']), 'mintCost');
      const approveAmount = ((mintCost * APPROVAL_BUFFER_BPS) / BPS_DENOMINATOR).toString();
      castSend(
        forkRpc,
        senderAddress,
        firstToken,
        'approve(address,uint256)',
        [tokenMain, approveAmount],
        'TokenMainManager approve mint cost',
      );
      castSend(forkRpc, senderAddress, tokenMain, 'activate(address)', [firstToken], 'TokenMainManager activate');
      groupId = castCall(forkRpc, tokenMain, 'groupIdOfToken(address)(uint256)', [firstToken]);
    }
    assert(BigInt(groupId) > 0n, 'public-test token main chat must be activated on the fork');
    expectCall(
      forkRpc,
      groupDefaults,
      'defaultGroupIdOf(address)(uint256)',
      [senderAddress],
      senderId,
      'known sender default NFT',
    );

    castSend(
      forkRpc,
      senderAddress,
      groupChat,
      'postAsDefaultSender(uint256,string,uint256[],bool,uint256)',
      [groupId, 'verify fork default post', '[]', 'false', '0'],
      'postAsDefaultSender',
    );
    castSend(
      forkRpc,
      tokenMain,
      groupChat,
      'setPostingAllowed(uint256,bool)',
      [groupId, 'false'],
      'setPostingAllowed false',
    );
    expectCall(forkRpc, groupChat, 'postingAllowed(uint256)(bool)', [groupId], 'false', 'postingAllowed false');
    castSend(
      forkRpc,
      tokenMain,
      groupChat,
      'setPostingAllowed(uint256,bool)',
      [groupId, 'true'],
      'setPostingAllowed true',
    );
    expectCall(forkRpc, groupChat, 'postingAllowed(uint256)(bool)', [groupId], 'true', 'postingAllowed true');
    castSend(forkRpc, tokenMain, groupChat, 'setScopeSource(uint256,address)', [groupId, zero], 'setScopeSource zero');
    expectCall(forkRpc, groupChat, 'scopeSource(uint256)(address)', [groupId], zero, 'scopeSource zero');
    castSend(forkRpc, tokenMain, groupChat, 'setScopeSource(uint256,address)', [groupId, tokenMain], 'setScopeSource token manager');
    expectCall(forkRpc, groupChat, 'scopeSource(uint256)(address)', [groupId], tokenMain, 'scopeSource token manager');
    castSend(forkRpc, tokenMain, groupChat, 'setBanSource(uint256,address)', [groupId, zero], 'setBanSource zero');
    expectCall(forkRpc, groupChat, 'banSource(uint256)(address)', [groupId], zero, 'banSource zero');
    castSend(forkRpc, tokenMain, groupChat, 'setBanSource(uint256,address)', [groupId, govBan], 'setBanSource gov');
    expectCall(forkRpc, groupChat, 'banSource(uint256)(address)', [groupId], govBan, 'banSource gov');
    castSend(forkRpc, tokenMain, groupChat, 'setBeforePostPlugin(uint256,address)', [groupId, tokenMain], 'setBeforePostPlugin token manager');
    expectCall(forkRpc, groupChat, 'beforePostPlugin(uint256)(address)', [groupId], tokenMain, 'beforePostPlugin token manager');
    castSend(forkRpc, tokenMain, groupChat, 'setBeforePostPlugin(uint256,address)', [groupId, zero], 'setBeforePostPlugin zero');
    expectCall(forkRpc, groupChat, 'beforePostPlugin(uint256)(address)', [groupId], zero, 'beforePostPlugin zero');
    castSend(forkRpc, tokenMain, groupChat, 'setAfterPostPlugin(uint256,address)', [groupId, tokenMain], 'setAfterPostPlugin token manager');
    expectCall(forkRpc, groupChat, 'afterPostPlugin(uint256)(address)', [groupId], tokenMain, 'afterPostPlugin token manager');
    castSend(forkRpc, tokenMain, groupChat, 'setAfterPostPlugin(uint256,address)', [groupId, zero], 'setAfterPostPlugin zero');
    expectCall(forkRpc, groupChat, 'afterPostPlugin(uint256)(address)', [groupId], zero, 'afterPostPlugin zero');

    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'voteBySenderId(uint256,uint256,bool)',
      [groupId, senderId, 'true'],
      'voteBySenderId support',
    );
    expectVoteWeights(
      castCall(
        forkRpc,
        govBan,
        'voteWeightsBySenderIdsByVoter(uint256,uint256[],address)(uint256[],uint256[])',
        [groupId, `[${senderId}]`, senderAddress],
      ),
      'positive',
      0,
      'voteBySenderId support weights',
    );
    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'refreshVoteBySenderId(uint256,uint256,address)',
      [groupId, senderId, senderAddress],
      'refreshVoteBySenderId',
    );
    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'clearVoteBySenderId(uint256,uint256)',
      [groupId, senderId],
      'clearVoteBySenderId',
    );
    const clearedSenderWeights = castCall(
      forkRpc,
      govBan,
      'voteWeightsBySenderIdsByVoter(uint256,uint256[],address)(uint256[],uint256[])',
      [groupId, `[${senderId}]`, senderAddress],
    );
    expectVoteWeights(clearedSenderWeights, 0, 0, 'clearVoteBySenderId weights');

    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'voteBySenderAddress(uint256,address,bool)',
      [groupId, senderAddress, 'false'],
      'voteBySenderAddress oppose',
    );
    expectVoteWeights(
      castCall(
        forkRpc,
        govBan,
        'voteWeightsBySenderAddressesByVoter(uint256,address[],address)(uint256[],uint256[])',
        [groupId, `[${senderAddress}]`, senderAddress],
      ),
      0,
      'positive',
      'voteBySenderAddress oppose weights',
    );
    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'refreshVoteBySenderAddress(uint256,address,address)',
      [groupId, senderAddress, senderAddress],
      'refreshVoteBySenderAddress',
    );
    castSend(
      forkRpc,
      senderAddress,
      govBan,
      'clearVoteBySenderAddress(uint256,address)',
      [groupId, senderAddress],
      'clearVoteBySenderAddress',
    );
    const clearedAddressWeights = castCall(
      forkRpc,
      govBan,
      'voteWeightsBySenderAddressesByVoter(uint256,address[],address)(uint256[],uint256[])',
      [groupId, `[${senderAddress}]`, senderAddress],
    );
    expectVoteWeights(clearedAddressWeights, 0, 0, 'clearVoteBySenderAddress weights');

    castSend(forkRpc, tokenMain, groupAdmin, 'addAdmins(uint256,uint256[])', [groupId, `[${senderId}]`], 'addAdmins');
    expectCall(forkRpc, groupAdmin, 'adminIdOf(uint256,address)(uint256)', [groupId, senderAddress], senderId, 'adminIdOf');
    castSend(
      forkRpc,
      senderAddress,
      groupChat,
      'post(uint256,uint256,string,uint256[],bool,uint256)',
      [groupId, senderId, 'verify fork mention all', '[]', 'true', '0'],
      'admin mention-all post',
    );
    castSend(forkRpc, senderAddress, groupMember, 'addMemberIds(uint256,uint256[])', [groupId, `[${senderId}]`], 'addMemberIds');
    expectCall(forkRpc, groupMember, 'isMemberId(uint256,uint256)(bool)', [groupId, senderId], 'true', 'member added');
    castSend(
      forkRpc,
      senderAddress,
      groupMember,
      'removeMemberIds(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'removeMemberIds',
    );
    expectCall(forkRpc, groupMember, 'isMemberId(uint256,uint256)(bool)', [groupId, senderId], 'false', 'member removed');

    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'banBySenderIds(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'banBySenderIds',
    );
    expectCall(forkRpc, groupBanList, 'isSenderIdBanned(uint256,uint256)(bool)', [groupId, senderId], 'true', 'sender id banned');
    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'unbanBySenderIds(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'unbanBySenderIds',
    );
    expectCall(forkRpc, groupBanList, 'isSenderIdBanned(uint256,uint256)(bool)', [groupId, senderId], 'false', 'sender id unbanned');
    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'banBySenderAddresses(uint256,address[])',
      [groupId, `[${senderAddress}]`],
      'banBySenderAddresses',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isAddressBanned(uint256,address)(bool)',
      [groupId, senderAddress],
      'true',
      'sender address banned',
    );
    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'unbanBySenderAddresses(uint256,address[])',
      [groupId, `[${senderAddress}]`],
      'unbanBySenderAddresses',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isAddressBanned(uint256,address)(bool)',
      [groupId, senderAddress],
      'false',
      'sender address unbanned',
    );
    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'banBySenders(uint256,uint256[],address[])',
      [groupId, `[${senderId}]`, `[${senderAddress}]`],
      'banBySenders',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isBanned(uint256,uint256,address)(bool)',
      [groupId, senderId, senderAddress],
      'true',
      'sender pair banned',
    );
    castSend(
      forkRpc,
      senderAddress,
      groupBanList,
      'unbanBySenders(uint256,uint256[],address[])',
      [groupId, `[${senderId}]`, `[${senderAddress}]`],
      'unbanBySenders',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isBanned(uint256,uint256,address)(bool)',
      [groupId, senderId, senderAddress],
      'false',
      'sender pair unbanned',
    );
    castSend(
      forkRpc,
      tokenMain,
      groupAdmin,
      'removeAdmins(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'removeAdmins',
    );
    expectCall(forkRpc, groupAdmin, 'adminIdOf(uint256,address)(uint256)', [groupId, senderAddress], '0', 'admin removed');
    castSend(
      forkRpc,
      tokenMain,
      groupMember,
      'addMemberIds(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'owner delegate addMemberIds',
    );
    expectCall(forkRpc, groupMember, 'isMemberId(uint256,uint256)(bool)', [groupId, senderId], 'true', 'owner delegate member added');
    castSend(
      forkRpc,
      tokenMain,
      groupMember,
      'removeMemberIds(uint256,uint256[])',
      [groupId, `[${senderId}]`],
      'owner delegate removeMemberIds',
    );
    expectCall(forkRpc, groupMember, 'isMemberId(uint256,uint256)(bool)', [groupId, senderId], 'false', 'owner delegate member removed');
    castSend(
      forkRpc,
      tokenMain,
      groupBanList,
      'banBySenders(uint256,uint256[],address[])',
      [groupId, `[${senderId}]`, `[${senderAddress}]`],
      'owner delegate banBySenders',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isBanned(uint256,uint256,address)(bool)',
      [groupId, senderId, senderAddress],
      'true',
      'owner delegate sender pair banned',
    );
    castSend(
      forkRpc,
      tokenMain,
      groupBanList,
      'unbanBySenders(uint256,uint256[],address[])',
      [groupId, `[${senderId}]`, `[${senderAddress}]`],
      'owner delegate unbanBySenders',
    );
    expectCall(
      forkRpc,
      groupBanList,
      'isBanned(uint256,uint256,address)(bool)',
      [groupId, senderId, senderAddress],
      'false',
      'owner delegate sender pair unbanned',
    );

    const actionMainActivation = verifyActionActivation({
      forkRpc,
      payer: senderAddress,
      token: firstToken,
      group,
      groupChat,
      submit,
      manager: tokenActionMain,
      label: 'TokenActionMainManager',
    });
    const actionGovActivation = verifyActionActivation({
      forkRpc,
      payer: senderAddress,
      token: firstToken,
      group,
      groupChat,
      submit,
      manager: tokenActionGov,
      label: 'TokenActionGovManager',
    });

    console.log(
      `fork: group=${groupId}, admin=${senderId}, sender=${senderAddress}, ` +
        `actionMain=${actionMainActivation.actionId}->${actionMainActivation.groupId}, ` +
        `actionGov=${actionGovActivation.actionId}->${actionGovActivation.groupId}`,
    );
    console.log('Group chat fork write verification passed.');
  } finally {
    anvil.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
