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

function checkFrontendArchitecture() {
  checkFileContains('src/components/Chat/ChatPage.tsx', /import Header from '@\/src\/components\/Header'/, 'must use existing Header');
  checkFileContains('src/components/Chat/ChatPage.tsx', /TokenContext/, 'must read token from TokenContext');
  checkFileContains('src/components/Chat/ChatPage.tsx', /symbol: token\.symbol/g, 'must keep symbol query routing');
  checkFileContains('src/components/Chat/ChatPage.tsx', /import \{ ActionChatPanel \} from '\.\/ActionChatPanel'/, 'action activation panel must stay split from ChatPage');
  checkFileContains('src/components/Chat/ChatPage.tsx', /import \{ ChainChatPanel \} from '\.\/ChainChatPanel'/, 'chain activation panel must stay split from ChatPage');
  checkFileContains('src/components/Chat/RoomPanel.tsx', /import \{ ChatRoomToolbar \} from '\.\/ChatRoomToolbar'/, 'room toolbar must stay split from RoomPanel');
  checkFileContains('src/components/Chat/BlacklistPanel.tsx', /import \{ GovVoterSheet \} from '\.\/GovVoterSheet'/, 'governance voter sheet must stay split from BlacklistPanel');
  checkFileContains('src/components/Common/BottomNavigation.tsx', /title: '聊天'[\s\S]*url: `\/chat\/\?symbol=\$\{token\.symbol\}`/, 'first bottom nav slot must be chat with symbol URL');
  checkFileContains('src/components/Header.tsx', /<WalletButton \/>/, 'must keep existing wallet button in Header');

  const chatPage = read('src/components/Chat/ChatPage.tsx');
  assert(!/<BottomNavigation|from '@\/src\/components\/Common\/BottomNavigation'/.test(chatPage), 'ChatPage must not mount a prototype bottom nav');
  assert(!/<WalletButton|from '@\/src\/components\/WalletButton'/.test(chatPage), 'ChatPage must not replace Header wallet controls');

  const bottomNavigation = read('src/components/Common/BottomNavigation.tsx');
  assert(
    /title: '应用'[\s\S]*url: '\/apps'/.test(bottomNavigation) &&
      /title: '社区行动'[\s\S]*url: `\/acting\/\?symbol=\$\{token\.symbol\}`/.test(bottomNavigation) &&
      /title: '治理'[\s\S]*url: `\/gov\/\?symbol=\$\{token\.symbol\}`/.test(bottomNavigation) &&
      /title: '我的'[\s\S]*url: `\/my\/\?symbol=\$\{token\.symbol\}`/.test(bottomNavigation),
    'bottom navigation non-chat slots must keep the existing app routes',
  );
}

function checkPrototypeStructure() {
  const css = read('src/components/Chat/ChatPage.module.css');
  const inboxPanel = read('src/components/Chat/InboxPanel.tsx');
  const activationCard = read('src/components/Chat/ActivationCard.tsx');
  const actionChatPanel = read('src/components/Chat/ActionChatPanel.tsx');
  const chatPage = read('src/components/Chat/ChatPage.tsx');
  [
    'conversation-list',
    'inbox-action-row',
    'activation-header',
    'activation-list',
    'chat-tools',
    'chat-menu',
    'message-list',
    'message-row',
    'message-bubble',
    'composer',
    'workspace-band',
    'filter-tabs',
    'status-sheet',
    'message-row.banned',
  ].forEach((className) => {
    assert(css.includes(className), `Chat CSS is missing prototype class ${className}`);
  });
  assert(/data-long-press-conversation/.test(inboxPanel), 'conversation row menu must stay long-press driven like the prototype');
  assert(!/conversation-menu-button/.test(inboxPanel), 'inbox conversation rows must not render a visible menu button');
  assert(!/conversation-menu-button/.test(css), 'inbox conversation rows must not style a visible menu button');
  assert(/onTogglePin\(item\.groupId\);[\s\S]*setMenuOpen\(false\);/.test(inboxPanel), 'pinning from the inbox row menu must close the menu like the prototype');
  assert(/activationActionButtonClass\(activated\)/.test(activationCard), 'activation cards must use the shared prototype action button style helper');
  assert(/activationActionButtonClass\(activated\)\} inline-flex/.test(activationCard), 'activation card buttons must opt out of the global bare-button reset');
  assert(/sheet-button activation-enter-button/.test(activationCard), 'activated chats must render the lighter prototype enter button style');
  assert(/sheet-button primary/.test(activationCard), 'inactive chats must render the primary activation button style');
  assert(/picker-button inline-flex/.test(chatPage), 'activation tabs must opt out of the global bare-button reset');
  const managerActivationPage = read('src/components/Chat/ManagerActivationPage.tsx');
  assert(
    /<div className="screen-heading">\s*<h1>\{pageTitle\}<\/h1>\s*<span>\{tokenSymbol \|\| '当前代币'\}<\/span>\s*<\/div>/.test(managerActivationPage),
    'manager activation header must keep the prototype title/token structure',
  );
  assert(
    /const pageTitle = isMain \? '激活代币主群' : '激活代币治理群'/.test(managerActivationPage) &&
      /const pageTitle = isMain \? '激活行动主群' : '激活行动治理群'/.test(managerActivationPage),
    'manager activation pages must use explicit token/action activation titles',
  );
  assert(!/activation-subtitle-row/.test(chatPage), 'activation header must not split the prototype token label into an extra subtitle row');
  const managerActivationForm = read('src/components/Chat/ManagerActivationForm.tsx');
  assert(/openedConfirmedGroupRef/.test(managerActivationForm) && /onOpen\(existingGroupId\)/.test(managerActivationForm), 'manager activation must switch into the newly minted group after the manager mapping refreshes');
  assert(
    /fields\.map/.test(managerActivationForm) && /activation-readonly-value/.test(managerActivationForm),
    'manager activation form must show prototype-style readonly activation params',
  );
  assert(/useConfirmedTransactionEffect/.test(managerActivationForm) && /activationHash/.test(managerActivationForm), 'manager activation confirmations must be keyed by the submitted transaction hash');
  assert(/onBack/.test(managerActivationForm) && /返回列表/.test(managerActivationForm), 'manager activation form must return to the activation list like the prototype');
  assert(/variant\?: 'card' \| 'subrow'/.test(activationCard), 'activation cards must support prototype action subrows');
  assert(/className="activation-subrow"/.test(activationCard), 'action activation rows must use the prototype subrow structure');
  assert(/variant="subrow"/.test(actionChatPanel), 'action activation entries must not nest full activation cards inside action cards');
  assert(!/<div className="activation-list">/.test(actionChatPanel), 'action activation must not nest a second activation-list around the action cards');
  assert(
      /\/chat\/activate\/token-action-main-manager/.test(actionChatPanel) &&
      /\/chat\/activate\/token-action-gov-manager/.test(actionChatPanel) &&
      /actionId: selection\.actionId\.toString\(\)/.test(actionChatPanel),
    'action activation must route to the shared manager activation form before submitting',
  );
  assert(
    /actionExists && \(/.test(actionChatPanel) &&
      /title="行动主群"/.test(actionChatPanel) &&
      /title="行动治理群"/.test(actionChatPanel),
    'action activation must reveal action chat rows only after a valid Action ID is selected',
  );
  assert(/请输入行动编号/.test(actionChatPanel) && /只支持非负整数 Action ID/.test(actionChatPanel), 'action activation must explain how to reveal activation actions');
  assert(
    /className="action-id-input-row"/.test(actionChatPanel) && /className="activation-sublist action-id-result"/.test(actionChatPanel),
    'action activation must expose the manual activation path',
  );
  const tokenActivationPanel = read('src/components/Chat/ActivationPanels.tsx');
  assert(
    /\/chat\/activate\/token-main-manager/.test(tokenActivationPanel) &&
      /\/chat\/activate\/token-gov-manager/.test(tokenActivationPanel),
    'token activation must route to the shared manager activation form before submitting',
  );

  const chainChatPanel = read('src/components/Chat/ChainChatPanel.tsx');
  const chainChatActivationDetail = read('src/components/Chat/ChainChatActivationDetail.tsx');
  const chainChatActivationPage = read('src/pages/chat/activate/chain.tsx');
  assert(!/showForm|ActivationCard|onActivate=\{\(\) => setShowForm\(true\)\}/.test(chainChatPanel), 'chain activation tab must not add an extra entry layer before the form');
  assert(!/activation-card activation-card-chain-service|typeClass="activation-card-chain-service"/.test(chainChatPanel), 'chain activation tab must not render a redundant activation card');
  assert(!/GroupNFT 直接激活|GroupChat\.activateChat|选择群聊 NFT/.test(chainChatPanel), 'chain activation tab must not repeat already-visible tab context');
  assert(/ChainGroupNftPicker/.test(chainChatPanel), 'chain activation must select from the current wallet NFT list');
  assert(/pathname: '\/chat\/activate\/chain'/.test(chainChatPanel), 'chain activation must open the selected NFT detail route');
  assert(/selected-chain-nft/.test(chainChatActivationDetail), 'chain activation detail must show the selected NFT');
  assert(
    /const chainListUrl =/.test(chainChatActivationPage) &&
      /activationType: 'chain'/.test(chainChatActivationPage) &&
      /<Header title="激活链群" backUrl=\{chainListUrl\} \/>/.test(chainChatActivationPage),
    'chain activation page must allow going back to the NFT list',
  );
  assert(/activateTx\.activateChat\(\s*groupId/.test(chainChatActivationDetail), 'chain activation must submit the selected wallet NFT id');
  assert(!/groupIdInput|chain-group-id-input|parsePositiveBigIntInput|请输入有效 GroupNFT ID/.test(chainChatPanel), 'chain activation must not expose manual GroupNFT ID input');
  assert(/GroupMemberScope/.test(chainChatActivationDetail) && /GroupJoinScopeSource/.test(chainChatActivationDetail) && /AdminBanSource/.test(chainChatActivationDetail), 'chain activation rule slot labels must follow the prototype contract names');
  assert(/onClick=\{activateChainChat\}/.test(chainChatActivationDetail), 'chain activation form must submit the real activation transaction');
  assert(/sheet-button primary inline-flex/.test(chainChatActivationDetail), 'chain activation submit button must remain visible under narrow-screen button reset');
  assert(/submittedGroupIdRef/.test(chainChatActivationDetail) && /onOpen\(submittedGroupIdRef\.current\)/.test(chainChatActivationDetail), 'direct GroupNFT activation must enter the activated group after confirmation');
  assert(!/metaTitle|metaDescription|metadata|toHex/.test(chainChatPanel), 'chain activation must follow the simplified prototype and not render removed metadata inputs');

  const chainGroupNftPicker = read('src/components/Chat/ChainGroupNftPicker.tsx');
  assert(/NFT_PAGE_SIZE = 100/.test(chainGroupNftPicker), 'chain NFT picker must default to loading 100 NFTs');
  assert(/useMyGroupsPage\(account, loadedNftLimit, 'recent'\)/.test(chainGroupNftPicker), 'chain NFT picker must reuse the existing wallet NFT page hook');
  assert(/IntersectionObserver/.test(chainGroupNftPicker), 'chain NFT picker must load more when scrolled to the bottom');
  assert(/setLoadedNftLimit\(\(prev\) => prev \+ NFT_PAGE_SIZE\)/.test(chainGroupNftPicker), 'chain NFT picker must page through wallet NFTs in 100 item increments');
  assert(/role="list"/.test(chainGroupNftPicker) && /role="listitem"/.test(chainGroupNftPicker), 'chain NFT picker must expose selectable NFT list semantics');
  assert(/onActivate\(group\)/.test(chainGroupNftPicker), 'chain NFT picker must enter the activation form by selecting a concrete wallet NFT');
  assert(/chain-nft-option chain-nft-row inline-flex/.test(chainGroupNftPicker), 'chain NFT picker option buttons must avoid the global transparent button reset');
  assert(!/选择当前钱包的 NFT|用于激活这个 NFT 对应的链群/.test(chainGroupNftPicker), 'chain NFT picker must avoid redundant explanatory copy');
  assert(!/<Input|placeholder="输入你持有|inputMode="numeric"/.test(chainGroupNftPicker), 'chain NFT picker must not fall back to manual NFT input');
}

function checkExistingControlReuse() {
  checkFileContains('src/components/Chat/ChatNftLookupActions.tsx', /NftOwnerLookup/, 'must reuse existing NFT lookup control');
  checkFileContains('src/components/Chat/BlacklistPanel.tsx', /BlacklistQueryControls/, 'blacklist query controls must stay split from the main panel');
  checkFileContains('src/components/Chat/BlacklistQueryControls.tsx', /NftOwnerLookup/, 'blacklist NFT query must reuse existing NFT lookup control');
  checkFileContains('src/components/Chat/ChatSettingsPanel.tsx', /NftOwnerLookup/, 'delegate NFT query must reuse existing NFT lookup control');
  checkFileContains('src/components/Chat/chatUtils.ts', /normalizeAddressInput/, 'address parsing must reuse shared address utility');
}

function checkManagerOwnedPermissionGuards() {
  checkFileContains('src/components/Chat/ChatSettingsPanel.tsx', /const managerOwned = isManagerOwnedChat\(room\.chatInfo\?\.owner\);/, 'settings must detect manager-owned chats');
  checkFileContains('src/components/Chat/ChatSettingsPanel.tsx', /resolveOwnerManagedChatPermission/, 'settings must centralize owner/manager permission guards');
  checkFileContains('src/components/Chat/ChatSettingsPanel.tsx', /const canEditRules = ownerPermission\.canEdit;/, 'settings must not expose direct owner writes for manager-owned chats');
  checkFileContains('src/components/Chat/AdminsPanel.tsx', /const managerOwned = isManagerOwnedChat\(room\.chatInfo\?\.owner\);/, 'admins panel must detect manager-owned chats');
  checkFileContains('src/components/Chat/AdminsPanel.tsx', /const isPermissionLoading = ownerPermission\.isPending;/, 'admins panel must not show a premature permission denial while ownership is loading');
  checkFileContains('src/components/Chat/AdminsPanel.tsx', /const canEditAdmins = ownerPermission\.canEdit;/, 'admins panel must not expose direct GroupAdmin writes for manager-owned chats');
}

function checkMobileLayoutGuards() {
  const css = read('src/components/Chat/ChatPage.module.css');
  assert(/\.chatPrototype :global\(\.picker-button\)[\s\S]*background:\s*#fff !important/.test(css), 'picker buttons must override the global transparent button reset');
  assert(/\.chatPrototype :global\(\.sheet-button\.primary\)[\s\S]*background:\s*var\(--primary-action\) !important/.test(css), 'primary sheet buttons must override the global transparent button reset');
  fs.readdirSync(path.join(root, 'src/components/Chat'))
    .filter((file) => file.endsWith('.tsx'))
    .forEach((file) => {
      const componentPath = `src/components/Chat/${file}`;
      const content = read(componentPath);
      assert(!/className="(?:sheet-button|send-button|picker-button)(?![^"]*inline-flex)/.test(content), `${componentPath} standard chat buttons must include inline-flex to avoid the global button reset`);
      assert(!/className=\{cn\('(?:sheet-button|picker-button|filter-tab)(?![^']*inline-flex)/.test(content), `${componentPath} dynamic chat buttons must include inline-flex to avoid the global button reset`);
      assert(!/className="chat-menu-button(?![^"]*inline-flex)/.test(content), `${componentPath} chat menu button must include inline-flex to avoid the global button reset`);
    });
  assert(/--global-bottom-nav-offset:\s*4rem/.test(css), 'chat CSS must reserve the existing global bottom nav height');
  assert(/--chat-mobile-chrome-offset:\s*90px/.test(css), 'mobile chat CSS must account for the existing header chrome');
  assert(/--detail-input-bottom-safe:\s*calc\(128px \+ env\(safe-area-inset-bottom\)\)/.test(css), 'chat CSS must define detail input safe area');
  assert(/@media \(max-width:\s*899px\)[\s\S]*--detail-input-bottom-safe:\s*calc\(176px \+ env\(safe-area-inset-bottom\)\)/.test(css), 'mobile chat CSS must expand input safe area');
  assert(/\.chatPrototype :global\(\.workspace-screen\)[\s\S]*padding:\s*12px 16px var\(--detail-input-bottom-safe\)/.test(css), 'workspace screens must leave room for bottom controls');
  assert(/\.chatPrototype :global\(\.workspace-screen\)[\s\S]*scroll-padding-bottom:\s*var\(--detail-input-bottom-safe\)/.test(css), 'workspace screens must scroll focused inputs above bottom controls');
  assert(
    /\.chatPrototype\[data-detail="true"\] :global\(\.composer\),\s*\n\.chatPrototype\[data-detail="true"\] :global\(\.composer-banned\)[\s\S]*position:\s*fixed;[\s\S]*bottom:\s*var\(--detail-composer-bottom\)/.test(css),
    'chat composer must stay fixed at the room bottom',
  );
  assert(/\.chatPrototype :global\(\.chat-room-shell\)[\s\S]*overflow:\s*hidden/.test(css), 'chat detail shell must keep the composer inside the visible flex column');
  assert(/height:\s*calc\(100dvh - var\(--chat-mobile-chrome-offset\) - var\(--global-bottom-nav-offset\)\)/.test(css), 'mobile chat surface must fill the visible area above the global bottom nav');
  assert(/\.chatPrototype\[data-detail="true"\][\s\S]*overflow:\s*hidden/.test(css), 'mobile chat detail must lock the room inside the visible viewport');
  assert(/\.chatPrototype :global\(\.inbox-action-row\)\s*\{[^}]*margin-top:\s*16px/.test(css), 'inbox action row must follow the prototype content-flow spacing');
  assert(!/\.chatPrototype :global\(\.inbox-action-row\)\s*\{[^}]*position:\s*sticky/.test(css), 'inbox action row must not float over the prototype list');
  assert(/\.chatPrototype :global\(\.inbox-preference-button\)\s*\{[^}]*border:\s*1px solid var\(--greyscale-300\)/.test(css), 'preference button must use the prototype sheet-button outline');
  assert(/\.chatPrototype :global\(\.inbox-activate-button\)\s*\{[^}]*background:\s*var\(--primary-action\)/.test(css), 'activate button must use the prototype primary sheet-button style');

  const inboxPanel = read('src/components/Chat/InboxPanel.tsx');
  assert(/className="sheet-button inline-flex inbox-preference-button"/.test(inboxPanel), 'preference button must opt out of the global bare-button reset');
  assert(/className="sheet-button primary inline-flex inbox-activate-button"/.test(inboxPanel), 'activate button must opt out of the global bare-button reset');

  const blacklistQueryControls = read('src/components/Chat/BlacklistQueryControls.tsx');
  assert(/'filter-tab inline-flex'/.test(blacklistQueryControls), 'blacklist query tabs must opt out of the global bare-button reset');
  assert(/className="sheet-button inline-flex"/.test(blacklistQueryControls), 'blacklist secondary action buttons must opt out of the global bare-button reset');
  assert(/className="sheet-button primary inline-flex"/.test(blacklistQueryControls), 'blacklist primary action buttons must opt out of the global bare-button reset');
}

function checkRoomDetailGuards() {
  const types = read('src/hooks/composite/groupChatDataTypes.ts');
  assert(/const managerLabel = symbol \|\| `G#\$\{item\.groupId\}`/.test(types), 'manager-owned chat titles must not fall back to LOVE20 NFT group names');
  assert(!/symbol \|\| item\.groupName/.test(types), 'manager-owned chat titles must not use NFT groupName while token metadata is loading');
  assert(/if \(item\.kind === 'token-community'\)[\s\S]*if \(item\.meta\?\.title\) return item\.meta\.title/.test(types), 'manager-owned chat titles must take precedence over generic titles');
  assert(!/configVersion/.test(types), 'chat info parsing must match the simplified GroupChat ChatInfo tuple without configVersion');
  assert(/actionTitle\?: string/.test(types), 'action manager chat titles must carry action titles');
  assert(/No\.\$\{item\.actionId \?\? '\?'\} \$\{item\.actionTitle \|\| '行动'\} 行动主群/.test(types), 'action main chat titles must use actionInfo title');

  const roomPanel = read('src/components/Chat/RoomPanel.tsx');
  assert(/title\?: string/.test(roomPanel), 'room panel must accept the manager-classified inbox title');
  assert(/useGroupChatManagedTitle/.test(roomPanel), 'room panel must resolve manager titles when opened directly by groupId');
  assert(/managedTitle\.title[\s\S]*title[\s\S]*room\.groupName/.test(roomPanel), 'room title must prefer managed title before non-manager NFT name fallback');
  assert(/!managerOwned && !managedTitle\.isPending/.test(roomPanel), 'manager-owned detail title must not use meta/NFT title fallback while managed title is loading');
  assert(!/room\.meta\.title \|\| title \|\| room\.groupName/.test(roomPanel), 'manager-owned detail title must not fall back to NFT groupName');

  const chatPage = read('src/components/Chat/ChatPage.tsx');
  assert(/selectedInboxItem\?\.title/.test(chatPage), 'chat detail must pass the classified inbox title into RoomPanel');
  assert(/data-detail=\{isChatDetail \? 'true' : 'false'\}/.test(chatPage), 'chat detail must expose a local layout state without replacing global navigation');

  const detailHeader = read('src/components/Chat/ChatGroupDetailHeader.tsx');
  assert(/export function useGroupDetailSubtitle/.test(detailHeader), 'group detail pages must share the prototype subtitle behavior');
  assert(/useGroupChatManagedTitle/.test(detailHeader), 'group detail subtitles must reuse manager title resolution');
  assert(/!managerOwned && !managedTitle\.isPending \? room\.groupName/.test(detailHeader), 'non-manager detail subtitles may fall back to NFT name');
  assert(/subtitle \|\| `群聊 #\$\{groupId\.toString\(\)\}`/.test(detailHeader), 'group detail header must display a group display subtitle, not only a raw group id');
  assert(!/data-action="toggle-chat-menu"|details-menu-button/.test(detailHeader), 'group detail pages must not render a top-right menu button');
  [
    'src/components/Chat/ChatSettingsPanel.tsx',
    'src/components/Chat/MembersPanel.tsx',
    'src/components/Chat/AdminsPanel.tsx',
    'src/components/Chat/BlacklistPanel.tsx',
  ].forEach((file) => {
    checkFileContains(file, /useGroupDetailSubtitle/, 'group detail page must pass the resolved group subtitle');
    checkFileContains(file, /subtitle=\{detailSubtitle\}/, 'group detail page must render the resolved group subtitle');
  });

  const settings = read('src/components/Chat/ChatSettingsPanel.tsx');
  assert(/const chatInfoRows = \[/.test(settings), 'manager-owned group settings must render the prototype chain rule table from chatInfo');
  assert(
    /<h2>规则说明<\/h2>[\s\S]*contract-rule-grid/.test(settings) &&
      /<h2>相关系统合约<\/h2>[\s\S]*settings-contract-table/.test(settings) &&
      /managerOwned \? \([\s\S]*去中心化群聊由 Manager 持有群聊 NFT，激活后无人有权再修改群设置/.test(settings) &&
      /<details className="raw-settings-details">[\s\S]*chatInfoRows\.map/.test(settings),
    'manager-owned group settings must show readable rules, system contracts, permission notice, and raw chain fields',
  );
  assert(/<dt>当前发言身份<\/dt>[\s\S]*room\.defaultSenderId/.test(settings), 'group settings status card must expose the current default sender');
  assert(/<dt>我能否发言<\/dt>[\s\S]*canPostText/.test(settings) && /room\.canPostReasonCode/.test(settings), 'group settings status card must expose the canPost reason code');

  const messageList = read('src/components/Chat/ChatMessageList.tsx');
  assert(/room\.isMessageFeedPending && room\.messages\.length === 0/.test(messageList), 'empty rooms must not keep loading because unrelated room reads are pending');

  const toolbar = read('src/components/Chat/ChatRoomToolbar.tsx');
  assert(/document\.addEventListener\('pointerdown', closeOnPointerDown\)/.test(toolbar), 'chat room menu must close on outside pointer down');
  assert(/event\.key === 'Escape'/.test(toolbar), 'chat room menu must close on Escape');

  const composer = read('src/components/Chat/ChatComposer.tsx');
  const composerState = read('src/components/Chat/useChatComposerState.ts');
  const utils = read('src/components/Chat/chatUtils.ts');
  const css = read('src/components/Chat/ChatPage.module.css');
  assert(!/Megaphone/.test(composer), 'composer must not add a separate @all button outside the prototype input');
  assert(!/mentionedSenderIds\.map/.test(composer), 'mentioned sender IDs must stay in composer text, not composer chips');
  assert(!/onRemoveMention|onToggleMentionAll|onClearMentionAll/.test(composer), 'mention chips must not be removable controls outside composer text');
  assert(/\.chatPrototype :global\(\.composer-row\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) 54px/.test(css), 'composer row must use the prototype two-column input/send layout');
  assert(/mentionSenderIdsValidationHint/.test(utils) && /已去重/.test(utils) && /超过 \$\{maxMentionedSenderIds\} 个，请删除/.test(utils), 'mention validation hints must explain duplicate dedupe and over-limit blocking like the prototype');
  assert(/mentionValidationHint/.test(composerState) && /mentionValidationBlocking/.test(composerState), 'composer state must expose mention validation state');
  assert(/draftMentions\.overLimitCount > 0/.test(composerState), 'send disabling must use parsed composer mentions, not only the selected mention array');
  assert(/composer-mention-hint/.test(composer) && /mentionValidationHint/.test(composer), 'chat composer must render the mention validation hint near the input');
  assert(/composer-mention-hint\.blocking/.test(css), 'blocking mention validation hints must have visible warning styling');

  assert(/data-long-press-mention/.test(messageList), 'message avatars must keep the prototype long-press mention affordance');
  assert(!/提及该身份/.test(messageList), 'message action menu must not add a separate mention button');
  assert(/renderMessageContent/.test(messageList) && /messageMentionTokens/.test(messageList), 'message mentions must be rendered inline from message content');

  const data = read('src/hooks/composite/useGroupChatData.ts');
  assert(/useGroupChatInfos\(groupIds/.test(data), 'inbox data must batch read chatInfo through GroupChat.chatInfos');
  assert(!/chatInfoContracts/.test(data), 'inbox data must not build one chatInfo multicall per group');
  checkFileContains('src/hooks/contracts/useGroupChat.ts', /functionName: 'chatInfos'/, 'group chat hooks must expose the chatInfos batch reader');
  assert(/LOVE20SubmitAbi/.test(data) && /functionName: 'actionInfo' as const/.test(data), 'inbox data must read actionInfo for manager action chat titles');
  assert(/isPendingActionInfos/.test(data) && /actionInfoError/.test(data) && /refetchActionInfos\(\)/.test(data), 'actionInfo title reads must participate in pending, error, and refetch state');
  assert(/export function useGroupChatManagedTitle/.test(data), 'direct chat detail must expose managed title reads');
  assert(/const shouldReadActionInfo[\s\S]*classification\.kind === 'action'/.test(data), 'direct action chat detail title must read actionInfo only for action managers');
}

function checkDefaultSenderComposerGuards() {
  const composer = read('src/components/Chat/ChatComposer.tsx');
  assert(!/senderIdInput|onSenderIdInputChange|aria-label="发言 NFT ID"/.test(composer), 'chat composer must not expose manual senderId input for normal posting');
  assert(/请先设置默认 LOVE20 NFT 后再发言/.test(composer), 'chat composer must guide users to set a default LOVE20 NFT');
  assert(/href=\{defaultNftHref\}/.test(composer), 'chat composer must link to the LOVE20 NFT page when no default identity is set');

  const composerState = read('src/components/Chat/useChatComposerState.ts');
  assert(/const activeSenderId = room\.defaultSenderId;/.test(composerState), 'chat composer state must use GroupDefaults default NFT as the active sender');
  assert(!/parsePositiveBigIntInput|senderIdFromInput|isCustomSenderInputActive/.test(composerState), 'chat composer state must not keep the manual senderId path');
  assert(/needsDefaultSenderSetup/.test(composerState), 'chat composer state must expose the no-default-NFT setup state');

  const roomPanel = read('src/components/Chat/RoomPanel.tsx');
  assert(/postAsDefaultSender\(/.test(roomPanel), 'normal chat sending must call postAsDefaultSender');
  assert(!/usePostGroupChatMessage|postTx\.post/.test(roomPanel), 'normal chat sending must not call raw post with a manual senderId');
  assert(/\/group\/groupids\/\?symbol=\$\{encodeURIComponent\(tokenSymbol\)\}/.test(roomPanel), 'default NFT setup link must preserve the current token symbol');
}

function checkMembersPanelScopeGuards() {
  const members = read('src/components/Chat/MembersPanel.tsx');
  assert(/managerMemberScopeDescription\(room\.chatInfo\?\.owner\)/.test(members), 'members page must branch first by manager owner');
  assert(/const hasMemberListScope = !managerScope && \(hasGroupMemberScope \|\| hasGroupJoinScope\)/.test(members), 'members page must only show GroupMember lists for known non-manager member scopes');
  assert(/useGroupMemberIds\(groupId, memberOffset, BigInt\(MEMBER_PAGE_SIZE\), hasMemberListScope\)/.test(members), 'members page must not read member lists for manager-owned or unknown-scope chats');
  assert(/ownerOrDelegateId/.test(read('src/hooks/contracts/useGroupChatModeration.ts')) && /operatorKind/.test(members), 'member management permission must accept owner/delegate as well as GroupAdmin admins');
  assert(!/defaultGroupId 不在 GroupAdmin 管理员名单/.test(members), 'members page must not describe GroupAdmin adminId as the only management permission');
  assert(/managerScope \? null : !hasMemberListScope/.test(members), 'manager-owned members page must show only the manager scope description, not the generic source rule table');
  assert(/TokenMainManager/.test(members) || /managerScope\.label/.test(members), 'members page must display manager rule descriptions');
  assert(/GroupJoinScopeSource/.test(members) && /GroupMemberScope/.test(members), 'members page must describe known member scopes');

  const utils = read('src/components/Chat/chatUtils.ts');
  assert(/managerMemberScopeDescription/.test(utils), 'manager member scope descriptions must be centralized');
  assert(/TokenMainManager[\s\S]*持有该代币余额/.test(utils), 'TokenMainManager member scope text must describe token holder/action/gov eligibility');
  assert(/TokenGovManager[\s\S]*治理票权/.test(utils), 'TokenGovManager member scope text must describe governance eligibility');
  assert(/TokenActionMainManager[\s\S]*参与过该行动/.test(utils), 'TokenActionMainManager member scope text must describe action eligibility');
  assert(/TokenActionGovManager[\s\S]*投过该行动票/.test(utils), 'TokenActionGovManager member scope text must describe action governance eligibility');
}

function checkMessageStateGuards() {
  checkFileContains(
    'src/components/Chat/ChatMessageList.tsx',
    /className=\{cn\('message-row', mine && 'mine', banned && 'banned'\)\}/,
    'blacklisted messages must keep the prototype banned row state class',
  );
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /message-ban-badge/, 'blacklisted messages must show a visible badge');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /onQuoteMessage/, 'message actions must support quoting');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /onCopyMessage/, 'message actions must support copying');
  checkFileContains('src/components/Chat/chatUtils.ts', /export function quotedMessageSummary/, 'quoted message summary must be centralized');
  checkFileContains('src/components/Chat/chatUtils.ts', /replace\(\/\\s\+\/g, ' '\)\.trim\(\)/, 'quoted message summary must normalize whitespace like the prototype');
  checkFileContains('src/components/Chat/ChatMessageList.tsx', /quoted \? quotedMessageSummary\(quoted\) : '引用消息未在当前分页中'/, 'message quote previews must show only summarized quoted content');
  checkFileContains('src/components/Chat/ChatComposer.tsx', /引用 \{quotedMessageSummary\(quotedMessage, 18\)\}/, 'composer quote chip must show the prototype quote summary');
  checkFileContains('src/hooks/composite/groupChatDataTypes.ts', /latestMessageBanned:\s*boolean/, 'inbox data must expose whether latest message is blacklisted');
  checkFileContains('src/hooks/composite/groupChatDataTypes.ts', /recentBannedMessageIds:\s*Record<string, boolean>/, 'inbox data must expose recent blacklisted message ids');
  checkFileContains('src/hooks/composite/useGroupChatData.ts', /latestMessageBanContracts/, 'inbox data must check latest message against banSource');
  checkFileContains('src/hooks/composite/useGroupChatData.ts', /recentMessageBanContracts/, 'inbox data must check recent messages against banSource');
  const inboxPanel = read('src/components/Chat/InboxPanel.tsx');
  const messageList = read('src/components/Chat/ChatMessageList.tsx');
  const composer = read('src/components/Chat/ChatComposer.tsx');
  assert(!/latestMessage\?\.content/.test(inboxPanel), 'inbox rows must not preview potentially hidden blacklisted message content');
  assert(/visibleUnreadCount/.test(inboxPanel) && /recentBannedMessageIds/.test(inboxPanel), 'inbox unread badges must honor hidden blacklisted messages');
  assert(!/#\{message\.quotedMessageId\.toString\(\)\}/.test(messageList), 'message quote previews must not prefix the quoted message id');
  assert(!/引用 #\{quotedMessage\.messageId\.toString\(\)\}/.test(composer), 'composer quote chips must not prefix the quoted message id');
}

function checkGovBlacklistStateGuards() {
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteStatusBySenderAddresses'/, 'governance blacklist address rows must read settled banned status');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteStatusBySenderIds'/, 'governance blacklist NFT rows must read settled banned status');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteWeightsBySenderAddressesByVoter'/, 'governance blacklist address rows must read the current account vote state');
  checkFileContains('src/hooks/contracts/useGroupChatModeration.ts', /functionName: 'voteWeightsBySenderIdsByVoter'/, 'governance blacklist NFT rows must read the current account vote state');
  checkFileContains('src/hooks/contracts/groupChatModerationTypes.ts', /mySupportWeight:\s*bigint/, 'governance blacklist records must expose current account support weight');
  checkFileContains('src/hooks/contracts/groupChatModerationTypes.ts', /myOpposeWeight:\s*bigint/, 'governance blacklist records must expose current account oppose weight');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /record\.banned \? 'pill-bad' : 'pill-ok'/, 'governance blacklist rows must display contract banned status');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /我的投票：支持/, 'governance blacklist rows must show current account support votes');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /我的投票：反对/, 'governance blacklist rows must show current account oppose votes');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /我的投票：未投票/, 'governance blacklist rows must show current account no-vote state');
  checkFileContains('src/components/Chat/BlacklistPanel.tsx', /useGroupNames/, 'NFT blacklist rows must reuse the existing group name read path');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /function nftLabel/, 'NFT blacklist rows must centralize NFT name fallback');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /<strong>\{nftLabel\(senderNames, record\.senderId\)\}<\/strong>/, 'NFT blacklist rows must show the NFT name as the primary label when available');
  checkFileContains('src/components/Chat/BlacklistRows.tsx', /NFT #\{record\.senderId\.toString\(\)\}/, 'NFT blacklist rows must keep the token id in detail text');
  const rows = read('src/components/Chat/BlacklistRows.tsx');
  assert(!/supportWeight > record\.opposeWeight/.test(rows), 'governance blacklist UI must not infer banned status from support > oppose');

  const panel = read('src/components/Chat/BlacklistPanel.tsx');
  assert(/const openGovAddressVoters[\s\S]*setActiveBlacklistMenuKey\(undefined\);[\s\S]*setActiveGovTarget/.test(panel), 'opening governance address voters must close the row menu like the prototype');
  assert(/const openGovSenderVoters[\s\S]*setActiveBlacklistMenuKey\(undefined\);[\s\S]*setActiveGovTarget/.test(panel), 'opening governance NFT voters must close the row menu like the prototype');
  assert(/onOpenAddressVoters=\{openGovAddressVoters\}/.test(panel), 'governance address voter sheet must use the menu-closing opener');
  assert(/onOpenSenderVoters=\{openGovSenderVoters\}/.test(panel), 'governance NFT voter sheet must use the menu-closing opener');

  const sheet = read('src/components/Chat/GovVoterSheet.tsx');
  assert(/className="status-sheet"/.test(sheet), 'governance voter list must render as a fixed status sheet');
  assert(/className="sheet-handle"/.test(sheet), 'governance voter sheet must keep the prototype handle');
  assert(/className="workspace-band gov-voter-panel"/.test(sheet), 'governance voter list must use the prototype workspace band');
  assert(/onRefreshQueriedVoter/.test(sheet) && /重算输入地址/.test(sheet), 'governance voter sheet must support voter revalidation');
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
    'src/components/Chat/RoomPanel.tsx',
    'src/components/Chat/BlacklistPanel.tsx',
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
  checkFrontendArchitecture();
  checkPrototypeStructure();
  checkExistingControlReuse();
  checkManagerOwnedPermissionGuards();
  checkMobileLayoutGuards();
  checkRoomDetailGuards();
  checkDefaultSenderComposerGuards();
  checkMembersPanelScopeGuards();
  checkMessageStateGuards();
  checkGovBlacklistStateGuards();
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
