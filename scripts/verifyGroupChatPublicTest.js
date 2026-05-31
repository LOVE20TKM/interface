#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
  assert,
  isAddress,
  loadEnv,
  read,
  root,
  run,
} = require('./groupChatVerifyUtils');

const withRpc = process.argv.includes('--rpc');

function checkFileContains(file, pattern, message) {
  const content = read(file);
  assert(pattern.test(content), `${file}: ${message}`);
}

function checkPublicTestEnv() {
  const env = loadEnv('.env.public_test');
  const requiredAddresses = [
    'NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_JOIN_SCOPE_SOURCE',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER',
    'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER',
  ];

  assert(env.NEXT_PUBLIC_CHAIN === 'thinkium70001', '.env.public_test must target thinkium70001');
  assert(env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL === 'TestLOVE20', '.env.public_test must use TestLOVE20 first token symbol');
  assert(Boolean(env.NEXT_PUBLIC_THINKIUM_RPC_URL), '.env.public_test must define NEXT_PUBLIC_THINKIUM_RPC_URL');
  requiredAddresses.forEach((key) => {
    assert(isAddress(env[key]), `.env.public_test ${key} must be a valid address`);
  });

  const groupChatParamsPath = path.resolve(root, '../group-chat/script/network/thinkium70001_public_test/address.group.chat.params');
  if (fs.existsSync(groupChatParamsPath)) {
    const params = Object.fromEntries(
      fs.readFileSync(groupChatParamsPath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const [key, ...value] = line.split('=');
          return [key, value.join('=')];
        }),
    );
    const mapping = {
      groupAdminAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN',
      groupBanListAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST',
      adminBanSourceAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE',
      govVotedBanSourceAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE',
      groupMemberAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER',
      groupMemberScopeAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_MEMBER_SCOPE',
      groupJoinScopeSourceAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_JOIN_SCOPE_SOURCE',
      groupChatAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT',
      tokenMainManagerAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER',
      tokenGovManagerAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER',
      tokenActionMainManagerAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER',
      tokenActionGovManagerAddress: 'NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER',
    };
    Object.entries(mapping).forEach(([paramKey, envKey]) => {
      assert(params[paramKey]?.toLowerCase() === env[envKey]?.toLowerCase(), `.env.public_test ${envKey} must match group-chat ${paramKey}`);
    });
  }
  return env;
}

function checkAbiFunctions() {
  const required = {
    'src/abis/GroupChat.ts': [
      'groupIdsCount',
      'groupIds',
      'chatInfo',
      'chatInfos',
      'messagesCount',
      'messages',
      'message',
      'canPost',
      'post',
      'postAsDefaultSender',
      'activateChat',
      'setPostingAllowed',
      'setScopeSource',
      'setBanSource',
      'setBeforePostPlugin',
      'setAfterPostPlugin',
    ],
    'src/abis/TokenMainManager.ts': ['activate', 'groupIdOfToken', 'tokenOfGroup', 'voteWeightOf', 'totalVoteWeight'],
    'src/abis/TokenGovManager.ts': ['activate', 'groupIdOfToken', 'tokenOfGroup', 'voteWeightOf', 'totalVoteWeight'],
    'src/abis/TokenActionMainManager.ts': ['activate', 'groupIdOfAction', 'actionOfGroup', 'voteWeightOf', 'totalVoteWeight'],
    'src/abis/TokenActionGovManager.ts': ['activate', 'groupIdOfAction', 'actionOfGroup', 'voteWeightOf', 'totalVoteWeight'],
    'src/abis/GroupAdmin.ts': ['addAdmins', 'removeAdmins', 'adminIds', 'adminIdOf', 'ownerOrDelegateIdOf'],
    'src/abis/GroupMember.ts': ['addMemberIds', 'removeMemberIds', 'memberIds', 'memberIdsCount', 'isMemberId'],
    'src/abis/GroupBanList.ts': [
      'banBySenderAddresses',
      'unbanBySenderAddresses',
      'banBySenderIds',
      'unbanBySenderIds',
      'banBySenders',
      'unbanBySenders',
      'isBanned',
    ],
    'src/abis/GovVotedBanSource.ts': [
      'voteBySenderAddress',
      'voteBySenderId',
      'voteBySender',
      'clearVoteBySenderAddress',
      'clearVoteBySenderId',
      'clearVoteBySender',
      'refreshVoteBySenderAddress',
      'refreshVoteBySenderId',
      'refreshVoteBySender',
      'voteStatusBySenderAddress',
      'voteStatusBySenderAddresses',
      'voteStatusBySenderId',
      'voteStatusBySenderIds',
      'voteWeightsBySenderAddressesByVoter',
      'voteWeightsBySenderIdsByVoter',
      'votersBySenderAddress',
      'votersBySenderId',
      'isBanned',
      'stateVersion',
    ],
    'src/abis/AdminBanSource.ts': ['isBanned'],
  };

  Object.entries(required).forEach(([file, functions]) => {
    const content = read(file);
    functions.forEach((name) => {
      assert(new RegExp(`"name": "${name}"`).test(content), `${file} is missing ${name}`);
    });
  });

  const groupChatAbi = read('src/abis/GroupChat.ts');
  assert(!/"name": "metaValue"|"name": "setMetaBatch"|"name": "setMeta"/.test(groupChatAbi), 'GroupChat ABI must match the simplified no-meta surface');
  ['src/abis/GroupAdmin.ts', 'src/abis/GroupBanList.ts', 'src/abis/GroupMember.ts'].forEach((file) => {
    assert(!/"name": "stateVersion"/.test(read(file)), `${file} must match the simplified no-stateVersion surface`);
  });
}

function loadAbi(file, exportName) {
  const content = read(file);
  const exportIndex = content.indexOf(`export const ${exportName} =`);
  assert(exportIndex >= 0, `${file} must export ${exportName}`);
  const arrayStart = content.indexOf('[', exportIndex);
  const arrayEnd = content.lastIndexOf(']');
  assert(arrayStart >= 0 && arrayEnd > arrayStart, `${file} must contain ABI array`);
  return Function(`return ${content.slice(arrayStart, arrayEnd + 1)}`)();
}

async function checkWriteEncoding() {
  const { encodeFunctionData } = await import('viem');
  const zero = '0x0000000000000000000000000000000000000000';
  const one = '0x0000000000000000000000000000000000000001';
  const two = '0x0000000000000000000000000000000000000002';
  const groupId = 59n;
  const senderId = 49n;

  const cases = [
    {
      file: 'src/abis/LOVE20Token.ts',
      exportName: 'LOVE20TokenAbi',
      calls: [['approve', [one, 1n]]],
    },
    {
      file: 'src/abis/GroupChat.ts',
      exportName: 'GroupChatAbi',
      calls: [
        ['activateChat', [groupId, zero, zero, zero, zero]],
        ['postAsDefaultSender', [groupId, 'hello', [], false, 0n]],
        ['post', [groupId, senderId, 'hello', [1n], true, 0n]],
        ['setPostingAllowed', [groupId, true]],
        ['setScopeSource', [groupId, zero]],
        ['setBanSource', [groupId, zero]],
        ['setBeforePostPlugin', [groupId, zero]],
        ['setAfterPostPlugin', [groupId, zero]],
      ],
    },
    {
      file: 'src/abis/TokenMainManager.ts',
      exportName: 'TokenMainManagerAbi',
      calls: [['activate', [one]]],
    },
    {
      file: 'src/abis/TokenGovManager.ts',
      exportName: 'TokenGovManagerAbi',
      calls: [['activate', [one]]],
    },
    {
      file: 'src/abis/TokenActionMainManager.ts',
      exportName: 'TokenActionMainManagerAbi',
      calls: [['activate', [one, 1n]]],
    },
    {
      file: 'src/abis/TokenActionGovManager.ts',
      exportName: 'TokenActionGovManagerAbi',
      calls: [['activate', [one, 1n]]],
    },
    {
      file: 'src/abis/GroupAdmin.ts',
      exportName: 'GroupAdminAbi',
      calls: [
        ['addAdmins', [groupId, [senderId]]],
        ['removeAdmins', [groupId, [senderId]]],
      ],
    },
    {
      file: 'src/abis/GroupMember.ts',
      exportName: 'GroupMemberAbi',
      calls: [
        ['addMemberIds', [groupId, [senderId]]],
        ['removeMemberIds', [groupId, [senderId]]],
      ],
    },
    {
      file: 'src/abis/GroupBanList.ts',
      exportName: 'GroupBanListAbi',
      calls: [
        ['banBySenderAddresses', [groupId, [one]]],
        ['unbanBySenderAddresses', [groupId, [one]]],
        ['banBySenderIds', [groupId, [senderId]]],
        ['unbanBySenderIds', [groupId, [senderId]]],
        ['banBySenders', [groupId, [senderId], [one]]],
        ['unbanBySenders', [groupId, [senderId], [one]]],
      ],
    },
    {
      file: 'src/abis/GovVotedBanSource.ts',
      exportName: 'GovVotedBanSourceAbi',
      calls: [
        ['voteBySenderAddress', [groupId, one, true]],
        ['voteBySenderId', [groupId, senderId, true]],
        ['voteBySender', [groupId, senderId, one, true]],
        ['clearVoteBySenderAddress', [groupId, one]],
        ['clearVoteBySenderId', [groupId, senderId]],
        ['clearVoteBySender', [groupId, senderId, one]],
        ['refreshVoteBySenderAddress', [groupId, one, two]],
        ['refreshVoteBySenderId', [groupId, senderId, two]],
        ['refreshVoteBySender', [groupId, senderId, one, two]],
      ],
    },
  ];

  cases.forEach(({ file, exportName, calls }) => {
    const abi = loadAbi(file, exportName);
    calls.forEach(([functionName, args]) => {
      const data = encodeFunctionData({ abi, functionName, args });
      assert(/^0x[0-9a-f]+$/i.test(data) && data.length >= 10, `${file} ${functionName} did not encode call data`);
    });
  });
}

function checkCriticalFrontendGuards() {
  checkFileContains('src/components/Chat/GroupChatHome.tsx', /buildChatActivationHref\(token\?\.symbol\)/, 'chat activation routing must preserve the current token symbol');
  checkFileContains('src/components/Chat/GroupChatHome.tsx', /TokenContext/, 'chat page must read token from TokenContext');
  checkFileContains('src/components/Chat/GroupChatDetailPage.tsx', /parseGroupId\(router\.query\.groupId\)/, 'chat detail route must read groupId from the URL');
  checkFileContains('src/components/Chat/GroupChatDetailPage.tsx', /buildChatIndexHref\(tokenSymbol\)/, 'chat detail back link must preserve the current token symbol');
  checkFileContains('src/components/Chat/chatUtils.ts', /return `\/chat\/group\?\$\{params\.toString\(\)\}`;/, 'group chat detail route must live under /chat/group');
  checkFileContains('src/components/Chat/chatUtils.ts', /return `\/chat\/group\/\$\{panel\}\?\$\{params\.toString\(\)\}`;/, 'group chat panel routes must live under /chat/group');
  checkFileContains('src/components/Chat/chatUtils.ts', /if \(tokenSymbol\) params\.set\('symbol', tokenSymbol\);/, 'chat route builders must keep symbol-based token routing');
  checkFileContains('src/components/Common/BottomNavigation.tsx', /title: '聊天'[\s\S]*url: `\/chat\/\?symbol=\$\{token\.symbol\}`/, 'bottom navigation chat entry must preserve the current token symbol');
  checkFileContains('src/components/Header.tsx', /<WalletButton \/>/, 'global header must keep the shared wallet control');

  const settings = read('src/components/Chat/ChatSettingsPanel.tsx');
  assert(/const managerOwned = isManagerOwnedChat\(publicData\.chatInfo\?\.owner\);/.test(settings), 'settings must detect manager-owned chats before exposing writes');
  assert(/resolveOwnerManagedChatPermission/.test(settings), 'settings must centralize owner/manager permission guards');
  assert(/const canEditRules = ownerPermission\.canEdit;/.test(settings), 'settings writes must be gated by owner/manager permission');

  const admins = read('src/components/Chat/AdminsPanel.tsx');
  assert(/const managerOwned = isManagerOwnedChat\(publicData\.chatInfo\?\.owner\);/.test(admins), 'admins panel must detect manager-owned chats before exposing writes');
  assert(/resolveOwnerManagedChatPermission/.test(admins), 'admins panel must centralize owner/manager permission guards');
  assert(/const isPermissionLoading = ownerPermission\.isPending;/.test(admins), 'admins panel must not show a premature permission denial while ownership is loading');
  assert(/const canEditAdmins = ownerPermission\.canEdit;/.test(admins), 'admin writes must be gated by owner/manager permission');

  const members = read('src/components/Chat/MembersPanel.tsx');
  assert(/managerMemberScopeDescription\(publicData\.chatInfo\?\.owner\)/.test(members), 'members page must branch first by manager owner');
  assert(/const hasMemberListScope = !managerScope && \(hasGroupMemberScope \|\| hasGroupJoinScope\)/.test(members), 'members page must only show GroupMember lists for known non-manager member scopes');
  assert(/useGroupMemberIds\(groupId, memberOffset, BigInt\(MEMBER_PAGE_SIZE\), hasMemberListScope\)/.test(members), 'members page must not read member lists for manager-owned or unknown-scope chats');
  assert(/ownerOrDelegateId/.test(read('src/hooks/contracts/useGroupChatModeration.ts')) && /memberPermission\.canOperate/.test(members), 'member management permission must accept owner/delegate as well as GroupAdmin admins');
  assert(!/defaultGroupId 不在 GroupAdmin 管理员名单/.test(members), 'members page must not describe GroupAdmin adminId as the only management permission');

  const utils = read('src/components/Chat/chatUtils.ts');
  assert(/managerMemberScopeDescription/.test(utils), 'manager member scope descriptions must be centralized');
  assert(/TokenMainManager[\s\S]*持有该代币余额/.test(utils), 'TokenMainManager member scope text must describe token holder/action/gov eligibility');
  assert(/TokenGovManager[\s\S]*治理票权/.test(utils), 'TokenGovManager member scope text must describe governance eligibility');
  assert(/TokenActionMainManager[\s\S]*参与过该行动/.test(utils), 'TokenActionMainManager member scope text must describe action eligibility');
  assert(/TokenActionGovManager[\s\S]*投过该行动票/.test(utils), 'TokenActionGovManager member scope text must describe action governance eligibility');

  const composer = read('src/components/Chat/ChatComposer.tsx');
  assert(!/senderIdInput|onSenderIdInputChange|aria-label="发言 NFT ID"/.test(composer), 'chat composer must not expose manual senderId input for normal posting');
  assert(/请先设置默认 LOVE20 NFT 后再发言/.test(composer), 'chat composer must guide users to set a default LOVE20 NFT');
  assert(/href=\{defaultNftHref\}/.test(composer), 'chat composer must link to the default NFT setup path');
  assert(/引用 \{quotedMessageSummary\(quotedMessage, 18\)\}/.test(composer), 'composer quote chip must show a summarized quoted message');

  const composerState = read('src/components/Chat/useChatComposerState.ts');
  assert(/const activeSenderId = accountData\.defaultSenderId;/.test(composerState), 'chat composer state must use GroupDefaults default NFT as the active sender');
  assert(!/parsePositiveBigIntInput|senderIdFromInput|isCustomSenderInputActive/.test(composerState), 'chat composer state must not keep a manual senderId path');
  assert(/needsDefaultSenderSetup/.test(composerState), 'chat composer state must expose the no-default-NFT setup state');
  assert(/mentionValidationHint/.test(composerState) && /mentionValidationBlocking/.test(composerState), 'composer state must expose mention validation state');
  assert(/draftMentions\.overLimitCount > 0/.test(composerState), 'send disabling must use parsed composer mentions, not only the selected mention array');

  const groupChatPanel = read('src/components/Chat/GroupChatPanel.tsx');
  assert(/title\?: string/.test(groupChatPanel), 'group chat panel must accept the manager-classified inbox title');
  assert(/useGroupChatManagedTitle/.test(groupChatPanel), 'group chat panel must resolve manager titles when opened directly by groupId');
  assert(/managedTitle\.title[\s\S]*title[\s\S]*publicData\.groupName/.test(groupChatPanel), 'group chat title must prefer managed title before non-manager NFT name fallback');
  assert(/!managerOwned && !managedTitle\.isPending/.test(groupChatPanel), 'manager-owned detail title must not use meta/NFT title fallback while managed title is loading');
  assert(/postAsDefaultSender\(/.test(groupChatPanel), 'normal chat sending must call postAsDefaultSender');
  assert(!/usePostGroupChatMessage|postTx\.post/.test(groupChatPanel), 'normal chat sending must not call raw post with a manual senderId');
  assert(/\/group\/groupids\/\?symbol=\$\{encodeURIComponent\(tokenSymbol\)\}/.test(groupChatPanel), 'default NFT setup link must preserve the current token symbol');

  const data = read('src/hooks/composite/useGroupChatData.ts');
  const types = read('src/hooks/composite/groupChatDataTypes.ts');
  assert(/const managerLabel = symbol \|\| `G#\$\{item\.groupId\}`/.test(types), 'manager-owned chat titles must not fall back to LOVE20 NFT group names');
  assert(!/symbol \|\| item\.groupName/.test(types), 'manager-owned chat titles must not use NFT groupName while token metadata is loading');
  assert(!/configVersion/.test(types), 'chat info parsing must match the simplified GroupChat ChatInfo tuple without configVersion');
  assert(/actionTitle\?: string/.test(types), 'action manager chat titles must carry action titles');
  assert(/No\.\$\{item\.actionId \?\? '\?'\} \$\{item\.actionTitle \|\| '行动'\} 行动主群/.test(types), 'action main chat titles must use actionInfo title');
  assert(/useGroupChatInfos\(uncachedInfoGroupIds/.test(data), 'inbox data must batch read uncached chatInfo through GroupChat.chatInfos');
  assert(!/chatInfoContracts/.test(data), 'inbox data must not build one chatInfo multicall per group');
  checkFileContains('src/hooks/contracts/useGroupChat.ts', /functionName: 'chatInfos'/, 'group chat hooks must expose the chatInfos batch reader');
  assert(/LOVE20SubmitAbi/.test(data) && /functionName: 'actionInfo' as const/.test(data), 'inbox data must read actionInfo for manager action chat titles');
  assert(/isPendingActionInfos/.test(data) && /actionInfoError/.test(data) && /refetchActionInfos\(\)/.test(data), 'actionInfo title reads must participate in pending, error, and refetch state');
  assert(/export function useGroupChatManagedTitle/.test(data), 'direct chat detail must expose managed title reads');
  assert(/const shouldReadActionInfo[\s\S]*classification\.kind === 'action'/.test(data), 'direct action chat detail title must read actionInfo only for action managers');

  checkFileContains('src/hooks/composite/groupChatDataTypes.ts', /bannedMessageIds:\s*Record<string, boolean>/, 'group chat data must expose blacklisted message ids');
  assert(/functionName:\s*'isBanned'/.test(data) && /const bannedMessageIds = useMemo/.test(data), 'group chat data must check visible messages against banSource');

  const inboxPanel = read('src/components/Chat/InboxPanel.tsx');
  assert(!/latestMessage\?\.content/.test(inboxPanel), 'inbox rows must not preview potentially hidden blacklisted message content');
  assert(
    /const visibleUnreadCount =[\s\S]*syncState\.unreadCount[\s\S]*rawUnreadCount/.test(inboxPanel),
    'inbox unread badges must stay cheap and avoid per-message blacklist reads',
  );

  const messageList = read('src/components/Chat/ChatMessageList.tsx');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /onQuoteMessage/, 'message actions must support quoting');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /onCopyMessage/, 'message actions must support copying');
  checkFileContains('src/components/Chat/chatUtils.ts', /export function quotedMessageSummary/, 'quoted message summary must be centralized');
  checkFileContains('src/components/Chat/chatUtils.ts', /replace\(\/\\s\+\/g, ' '\)\.trim\(\)/, 'quoted message summary must normalize whitespace');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /quoted \? quotedMessageSummary\(quoted\) : '引用消息未在当前分页中'/, 'message quote previews must show only summarized quoted content');
  assert(!/#\{message\.quotedMessageId\.toString\(\)\}/.test(messageList), 'message quote previews must not prefix the quoted message id');
  assert(!/引用 #\{quotedMessage\.messageId\.toString\(\)\}/.test(composer), 'composer quote chips must not prefix the quoted message id');
  assert(/renderMessageContent/.test(messageList) && /messageMentionTokens/.test(messageList), 'message mentions must be rendered inline from message content');

  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteStatusBySenderAddresses'/, 'governance blacklist address rows must read settled banned status');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteStatusBySenderIds'/, 'governance blacklist NFT rows must read settled banned status');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteWeightsBySenderAddressesByVoter'/, 'governance blacklist address rows must read the current account vote state');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteWeightsBySenderIdsByVoter'/, 'governance blacklist NFT rows must read the current account vote state');
  checkFileContains('src/hooks/contracts/groupChatModerationTypes.ts', /mySupportWeight:\s*bigint/, 'governance blacklist records must expose current account support weight');
  checkFileContains('src/hooks/contracts/groupChatModerationTypes.ts', /myOpposeWeight:\s*bigint/, 'governance blacklist records must expose current account oppose weight');
  checkFileContains('src/components/Chat/BanListRows.tsx', /banStatusPillClass\(record\.banned\)/, 'governance blacklist rows must display contract banned status');
  checkFileContains('src/components/Chat/BanListRows.tsx', /我的投票：支持/, 'governance blacklist rows must show current account support votes');
  checkFileContains('src/components/Chat/BanListRows.tsx', /我的投票：反对/, 'governance blacklist rows must show current account oppose votes');
  checkFileContains('src/components/Chat/BanListRows.tsx', /我的投票：未投票/, 'governance blacklist rows must show current account no-vote state');
  checkFileContains('src/components/Chat/BanListPanel.tsx', /useGroupNames/, 'NFT blacklist rows must reuse the existing group name read path');
  assert(!/supportWeight > record\.opposeWeight/.test(read('src/components/Chat/BanListRows.tsx')), 'governance blacklist UI must not infer banned status from support > oppose');
  checkFileContains('src/components/Chat/GovVoterSheet.tsx', /onRefreshQueriedVoter/, 'governance voter sheet must support voter revalidation');

  const css = read('src/components/Chat/ChatPage.module.css');
  assert(/--global-bottom-nav-offset:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/.test(css), 'chat CSS must reserve the existing global bottom nav height and safe area');
  assert(/--detail-input-bottom-safe:\s*calc\(128px \+ env\(safe-area-inset-bottom\)\)/.test(css), 'chat CSS must define detail input safe area');
  assert(/@media \(max-width:\s*899px\)[\s\S]*--detail-input-bottom-safe:\s*calc\(176px \+ env\(safe-area-inset-bottom\)\)/.test(css), 'mobile chat CSS must expand input safe area');
  assert(/height:\s*calc\(100dvh - var\(--chat-mobile-chrome-offset\) - var\(--global-bottom-nav-offset\)\)/.test(css), 'mobile chat surface must fill the visible area above the global bottom nav');
}

function checkWritePaths() {
  const groupChatHook = read('src/hooks/contracts/useGroupChat.ts');
  assert(/tx\.execute\(\[groupId, scopeSource, banSource, beforePostPlugin, afterPostPlugin\]\)/.test(groupChatHook), 'direct activation must use the simplified activateChat signature');
  assert(!/useSetGroupChatMetaBatch|setMetaBatch|metaKeys|metaValues/.test(groupChatHook), 'GroupChat hooks must not expose removed metadata writes');

  const groupChatData = read('src/hooks/composite/useGroupChatData.ts');
  assert(!/metaValue|metaEntries/.test(groupChatData), 'GroupChat data hooks must not read removed metadata functions');

  [
    'src/hooks/contracts/useGroupChat.ts',
    'src/hooks/contracts/useGroupChatManagers.ts',
    'src/hooks/contracts/useGroupChatModeration.ts',
    'src/hooks/contracts/useLOVE20Token.ts',
  ].forEach((file) => {
    checkFileContains(file, /useUniversalTransaction/, 'write hooks must use useUniversalTransaction');
  });

  const filesToScan = [
    ...fs.readdirSync(path.join(root, 'src/components/Chat')).map((file) => `src/components/Chat/${file}`),
    'src/hooks/contracts/useGroupChat.ts',
    'src/hooks/contracts/useGroupChatManagers.ts',
    'src/hooks/contracts/useGroupChatModeration.ts',
  ];
  const forbidden = /\b(useWriteContract|writeContract|sendTransaction)\b/;
  filesToScan.forEach((file) => {
    if (!/\.(ts|tsx)$/.test(file)) return;
    assert(!forbidden.test(read(file)), `${file} must not bypass useUniversalTransaction`);
  });
}

function checkTransactionLifecycleGuards() {
  checkFileContains(
    'src/lib/universalTransaction.ts',
    /setHash\(undefined\);/,
    'new transactions must clear stale hash before waiting for confirmation',
  );
  checkFileContains(
    'src/components/Chat/useConfirmedTransactionEffect.ts',
    /handledHashRef/,
    'confirmed transaction effect must handle each hash only once',
  );
  [
    'src/components/Chat/ChainChatActivationDetail.tsx',
    'src/components/Chat/ManagerActivationForm.tsx',
    'src/components/Chat/ChatSettingsPanel.tsx',
    'src/components/Chat/AdminsPanel.tsx',
    'src/components/Chat/MembersPanel.tsx',
    'src/components/Chat/GroupChatPanel.tsx',
    'src/components/Chat/BanListPanel.tsx',
  ].forEach((file) => {
    checkFileContains(file, /useConfirmedTransactionEffect/, 'writes must refetch after transaction confirmation');
  });
}

function checkForkVerificationGuards() {
  const forkVerifier = read('scripts/verifyGroupChatPublicTestFork.js');
  checkFileContains('package.json', /"verify:group-chat:fork": "node scripts\/verifyGroupChatPublicTestFork\.js"/, 'must expose fork write verification script');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /anvil.*--fork-url/s, 'fork verification must run against a local public-test fork');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /anvil_impersonateAccount/, 'fork verification must impersonate on-chain permission holders');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /postAsDefaultSender/, 'fork verification must cover default identity posting');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /setPostingAllowed/, 'fork verification must cover chat settings writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /setBeforePostPlugin/, 'fork verification must cover before-post plugin settings');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /setAfterPostPlugin/, 'fork verification must cover after-post plugin settings');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /addAdmins/, 'fork verification must cover GroupAdmin writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /addMemberIds/, 'fork verification must cover GroupMember writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /owner delegate addMemberIds/, 'fork verification must cover GroupMember owner/delegate fallback writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /banBySenders/, 'fork verification must cover GroupBanList paired writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /owner delegate banBySenders/, 'fork verification must cover GroupBanList owner/delegate fallback writes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /function parseUintArrays/, 'fork verification must parse cast array outputs for strong assertions');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /function expectVoteWeights/, 'fork verification must assert governance vote weights, not only transaction success');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /voteBySenderId support weights/, 'fork verification must assert senderId vote weights after voting');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /clearVoteBySenderId weights/, 'fork verification must assert senderId vote weights are cleared');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /voteBySenderAddress oppose weights/, 'fork verification must assert sender address vote weights after voting');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /clearVoteBySenderAddress weights/, 'fork verification must assert sender address vote weights are cleared');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /voteBySenderId/, 'fork verification must cover governance senderId votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /clearVoteBySenderId/, 'fork verification must cover clearing governance senderId votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /refreshVoteBySenderId/, 'fork verification must cover refreshing governance senderId votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /voteBySenderAddress/, 'fork verification must cover governance sender address votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /clearVoteBySenderAddress/, 'fork verification must cover clearing governance sender address votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /refreshVoteBySenderAddress/, 'fork verification must cover refreshing governance sender address votes');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /findUnactivatedActionId/, 'fork verification must dynamically find an unactivated action');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /'approve\(address,uint256\)'/, 'fork verification must approve the real manager before activation');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /'activate\(address,uint256\)'/, 'fork verification must send real token-action manager activation transactions');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /groupIdOfAction/, 'fork verification must assert action manager mapping after activation');
  checkFileContains('scripts/verifyGroupChatPublicTestFork.js', /actionOfGroup/, 'fork verification must assert reverse action manager mapping after activation');
  assert(!/setMetaBatch|metaValue/.test(forkVerifier), 'fork verification must not call removed GroupChat meta functions');
}

function expectEmptyRpcCall(args, label) {
  const output = run('cast', args);
  assert(output === '0x', `${label} must simulate successfully, got ${output || '<empty output>'}`);
}

function parseCastUint(output, label) {
  const match = output.match(/^\d+/);
  assert(match, `${label} must start with a uint value, got ${output}`);
  return BigInt(match[0]);
}

function checkRpc(env) {
  const cast = run('which', ['cast']);
  assert(cast, 'cast is required for --rpc checks');

  const rpc = env.NEXT_PUBLIC_THINKIUM_RPC_URL;
  const groupChat = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT;
  const firstToken = env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN;
  const groupAdmin = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN;
  const groupBanList = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_BAN_LIST;
  const adminBan = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_ADMIN_BAN_SOURCE;
  const tokenMain = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER;
  const tokenGov = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER;
  const govBan = env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_GOV_VOTED_BAN_SOURCE;

  [
    ['GroupChat', groupChat],
    ['GroupAdmin', groupAdmin],
    ['GroupBanList', groupBanList],
    ['AdminBanSource', adminBan],
    ['GovVotedBanSource', govBan],
    ['TokenMainManager', tokenMain],
    ['TokenGovManager', tokenGov],
  ].forEach(([label, address]) => {
    const code = run('cast', ['code', '--rpc-url', rpc, address]);
    assert(code && code !== '0x', `public-test ${label} must have deployed bytecode`);
  });

  const groupAdminFromChat = run('cast', ['call', '--rpc-url', rpc, groupChat, 'GROUP_ADMIN_ADDRESS()(address)']);
  assert(groupAdminFromChat.toLowerCase() === groupAdmin.toLowerCase(), 'public-test GroupChat must point to GroupAdmin');
  const groupChatFromMain = run('cast', ['call', '--rpc-url', rpc, tokenMain, 'GROUP_CHAT_ADDRESS()(address)']);
  assert(groupChatFromMain.toLowerCase() === groupChat.toLowerCase(), 'public-test TokenMainManager must point to GroupChat');
  const groupChatFromGov = run('cast', ['call', '--rpc-url', rpc, tokenGov, 'GROUP_CHAT_ADDRESS()(address)']);
  assert(groupChatFromGov.toLowerCase() === groupChat.toLowerCase(), 'public-test TokenGovManager must point to GroupChat');
  const groupAdminFromBanList = run('cast', ['call', '--rpc-url', rpc, groupBanList, 'GROUP_ADMIN_ADDRESS()(address)']);
  assert(groupAdminFromBanList.toLowerCase() === groupAdmin.toLowerCase(), 'public-test GroupBanList must point to GroupAdmin');
  const groupBanListFromAdminBan = run('cast', ['call', '--rpc-url', rpc, adminBan, 'GROUP_BAN_LIST_ADDRESS()(address)']);
  assert(groupBanListFromAdminBan.toLowerCase() === groupBanList.toLowerCase(), 'public-test AdminBanSource must point to GroupBanList');
  const thresholdRatio = parseCastUint(
    run('cast', ['call', '--rpc-url', rpc, govBan, 'BAN_THRESHOLD_RATIO()(uint256)']),
    'BAN_THRESHOLD_RATIO',
  );
  assert(thresholdRatio > 0n, 'public-test GovVotedBanSource must expose a positive threshold ratio');

  const groupIdsCount = parseCastUint(run('cast', ['call', '--rpc-url', rpc, groupChat, 'groupIdsCount()(uint256)']), 'groupIdsCount');
  const mainGroupId = parseCastUint(
    run('cast', ['call', '--rpc-url', rpc, tokenMain, 'groupIdOfToken(address)(uint256)', firstToken]),
    'token main groupIdOfToken',
  );
  const govGroupId = parseCastUint(
    run('cast', ['call', '--rpc-url', rpc, tokenGov, 'groupIdOfToken(address)(uint256)', firstToken]),
    'token gov groupIdOfToken',
  );
  const latestLimit = groupIdsCount < 2n ? groupIdsCount : 2n;
  const latestIds = latestLimit > 0n
    ? run('cast', ['call', '--rpc-url', rpc, groupChat, 'groupIds(uint256,uint256,bool)(uint256[])', '0', latestLimit.toString(), 'true'])
    : '[]';

  const batchAddressStatus = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    govBan,
    'voteStatusBySenderAddresses(uint256,address[])(bool[],uint256[],uint256[])',
    '1',
    '[0x0000000000000000000000000000000000000001]',
  ]);
  const batchSenderStatus = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    govBan,
    'voteStatusBySenderIds(uint256,uint256[])(bool[],uint256[],uint256[])',
    '1',
    '[1]',
  ]);
  assert(/\[false\]/.test(batchAddressStatus), 'public-test GovVotedBanSource must support batch address vote status');
  assert(/\[false\]/.test(batchSenderStatus), 'public-test GovVotedBanSource must support batch sender vote status');

  if (groupIdsCount === 0n) {
    assert(mainGroupId === 0n, 'empty public-test deployment must not report an activated token main chat');
    assert(govGroupId === 0n, 'empty public-test deployment must not report an activated token gov chat');
    console.log(
      `rpc: groupIdsCount=0, latest=[], tokenMain=0, tokenGov=0, thresholdRatio=${thresholdRatio.toString()}`,
    );
    return;
  }

  assert(mainGroupId > 0n, 'non-empty public-test token main chat must be activated');
  assert(govGroupId > 0n, 'non-empty public-test token gov chat must be activated');
  const messagesCount = parseCastUint(
    run('cast', ['call', '--rpc-url', rpc, groupChat, 'messagesCount(uint256)(uint256)', mainGroupId.toString()]),
    'messagesCount',
  );
  const chatInfo = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    groupChat,
    'chatInfo(uint256)((uint256,address,bool,bool,address,address,address,address,address,uint256,uint256))',
    mainGroupId.toString(),
  ]);
  assert(chatInfo.includes(`${mainGroupId.toString()},`), 'public-test main chat must return chatInfo for its groupId');
  const chatInfoMatch = chatInfo.match(
    /^\((\d+),\s*(0x[0-9a-fA-F]{40}),\s*(true|false),\s*(true|false),/,
  );
  assert(chatInfoMatch, 'public-test main chat must return a fully decoded chatInfo tuple');
  assert(chatInfoMatch[2].toLowerCase() === tokenMain.toLowerCase(), 'public-test main chat owner must be TokenMainManager');
  assert(chatInfoMatch[3] === 'true', 'public-test main chat must be activated');
  assert(chatInfoMatch[4] === 'true', 'public-test main chat must currently allow posting');

  if (messagesCount === 0n) {
    console.log(
      `rpc: groupIdsCount=${groupIdsCount}, latest=${latestIds}, tokenMain=${mainGroupId}, tokenGov=${govGroupId}, mainMessages=0`,
    );
    return;
  }

  const firstMessage = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    groupChat,
    'message(uint256,uint256)((uint256,uint256,address,uint256,uint256,string,uint256,uint256,uint256[],bool,uint256))',
    mainGroupId.toString(),
    '1',
  ]);
  assert(firstMessage.includes(`(${mainGroupId.toString()},`), 'public-test GroupChat must return decoded message tuples');
  assert(/\".+\"/.test(firstMessage), 'public-test GroupChat message tuple must include message content');

  const messageMatch = firstMessage.match(/^\((\d+),\s*(\d+),\s*(0x[0-9a-fA-F]{40}),/);
  assert(messageMatch, 'public-test GroupChat first message must expose senderId and senderAddress');
  const knownSenderId = messageMatch[2];
  const knownSenderAddress = messageMatch[3];
  const canPost = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    groupChat,
    'canPost(uint256,uint256,address)(bool,bytes4)',
    mainGroupId.toString(),
    knownSenderId,
    knownSenderAddress,
  ]);
  assert(/^true\s+0x00000000$/m.test(canPost), 'public-test GroupChat canPost must accept the known message sender');

  const defaultSenderId = run('cast', [
    'call',
    '--rpc-url',
    rpc,
    env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS,
    'defaultGroupIdOf(address)(uint256)',
    knownSenderAddress,
  ]);
  assert(defaultSenderId === knownSenderId, 'public-test known sender must keep the same default NFT identity used by postAsDefaultSender');

  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      knownSenderAddress,
      groupChat,
      'post(uint256,uint256,string,uint256[],bool,uint256)',
      mainGroupId.toString(),
      knownSenderId,
      'verify dry run',
      '[]',
      'false',
      '0',
    ],
    'public-test GroupChat.post',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      knownSenderAddress,
      groupChat,
      'postAsDefaultSender(uint256,string,uint256[],bool,uint256)',
      mainGroupId.toString(),
      'verify dry run default',
      '[]',
      'false',
      '0',
    ],
    'public-test GroupChat.postAsDefaultSender',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      tokenMain,
      groupChat,
      'setPostingAllowed(uint256,bool)',
      mainGroupId.toString(),
      'true',
    ],
    'public-test GroupChat.setPostingAllowed',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      tokenMain,
      groupChat,
      'setScopeSource(uint256,address)',
      mainGroupId.toString(),
      '0x0000000000000000000000000000000000000000',
    ],
    'public-test GroupChat.setScopeSource',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      tokenMain,
      groupChat,
      'setBanSource(uint256,address)',
      mainGroupId.toString(),
      govBan,
    ],
    'public-test GroupChat.setBanSource',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      knownSenderAddress,
      govBan,
      'voteBySenderAddress(uint256,address,bool)',
      mainGroupId.toString(),
      '0x0000000000000000000000000000000000000001',
      'true',
    ],
    'public-test GovVotedBanSource.voteBySenderAddress',
  );
  expectEmptyRpcCall(
    [
      'call',
      '--rpc-url',
      rpc,
      '--from',
      knownSenderAddress,
      govBan,
      'voteBySenderId(uint256,uint256,bool)',
      mainGroupId.toString(),
      knownSenderId,
      'true',
    ],
    'public-test GovVotedBanSource.voteBySenderId',
  );

  console.log(
    `rpc: groupIdsCount=${groupIdsCount}, latest=${latestIds}, tokenMain=${mainGroupId}, tokenGov=${govGroupId}, mainMessages=${messagesCount}, dryRunSender=${knownSenderId}`,
  );
}

async function main() {
  const env = checkPublicTestEnv();
  checkAbiFunctions();
  await checkWriteEncoding();
  checkCriticalFrontendGuards();
  checkWritePaths();
  checkTransactionLifecycleGuards();
  checkForkVerificationGuards();
  if (withRpc) checkRpc(env);
  console.log(`Group chat verification passed${withRpc ? ' with RPC checks' : ''}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
