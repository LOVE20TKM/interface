'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { PlugZap, Power, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input } from '@/components/ui/input';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import {
  useGroupChatGroupDelegateAddress,
  useGroupDelegateId,
  useSetGroupChatAfterPostPlugin,
  useSetGroupChatBanSource,
  useSetGroupChatBeforePostPlugin,
  useSetGroupChatPostingAllowed,
  useSetGroupChatScopeSource,
  useSetGroupDelegateId,
} from '@/src/hooks/contracts/useGroupChat';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
  GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
  useGroupOwnerOrDelegatePermission,
} from '@/src/hooks/contracts/useGroupChatModeration';
import {
  GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS,
  GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS,
} from '@/src/hooks/contracts/useGroupChatManagers';
import {
  useGroupChatRoomAccountData,
  useGroupChatRoomPublicData,
} from '@/src/hooks/composite/useGroupChatData';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { resolveOwnerManagedChatPermission } from '@/src/lib/groupChatPermissions';
import { cn } from '@/lib/utils';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { ZERO_ADDRESS } from './chatConstants';
import {
  formatCanPostReason,
  isManagerOwnedChat,
  managerMemberScopeDescription,
  parseAddressInput,
  sameAddress,
} from './chatUtils';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

type ContractExplanation = {
  label: string;
  title: string;
  description: string;
  status?: string;
};

function isZeroAddress(address?: `0x${string}`) {
  return !address || sameAddress(address, ZERO_ADDRESS);
}

function explainOwnerContract(owner?: `0x${string}`): ContractExplanation {
  if (!owner) {
    return {
      label: 'owner',
      title: '正在读取管理方式',
      description: '读取完成后会显示这个群由个人 NFT 持有人管理，还是由系统 Manager 合约自动管理。',
      status: '读取中',
    };
  }
  const managerScope = managerMemberScopeDescription(owner);
  if (sameAddress(owner, GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS)) {
    return {
      label: 'TokenMainManager',
      title: '代币主群管理器',
      description: managerScope?.text || '这个群由代币主群管理器自动创建和持有，发言范围跟代币社区身份相关。',
      status: '系统管理',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS)) {
    return {
      label: 'TokenGovManager',
      title: '代币治理群管理器',
      description: managerScope?.text || '这个群由代币治理群管理器自动创建和持有，发言范围跟治理票权相关。',
      status: '系统管理',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS)) {
    return {
      label: 'TokenActionMainManager',
      title: '行动主群管理器',
      description: managerScope?.text || '这个群由行动主群管理器自动创建和持有，发言范围跟行动参与关系相关。',
      status: '系统管理',
    };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS)) {
    return {
      label: 'TokenActionGovManager',
      title: '行动治理群管理器',
      description: managerScope?.text || '这个群由行动治理群管理器自动创建和持有，发言范围跟行动投票关系相关。',
      status: '系统管理',
    };
  }
  return {
    label: 'owner',
    title: 'NFT 持有人管理',
    description: '这个群由当前群聊 NFT owner 管理；owner 或设置的 delegate NFT 可以修改发言规则。',
    status: '可配置',
  };
}

function explainScopeContract(address?: `0x${string}`): ContractExplanation {
  if (!address) {
    return {
      label: 'scopeSource',
      title: '正在读取发言范围',
      description: '读取完成后会显示这个群的发言资格由哪个规则判断。',
      status: '读取中',
    };
  }
  if (isZeroAddress(address)) {
    return {
      label: '不设置',
      title: '默认开放发言',
      description: '没有额外挂载发言范围合约；群聊已激活、发言总开关开启、默认 NFT 有效且未被禁言时即可发言。',
      status: '开放',
    };
  }
  if (sameAddress(address, GROUP_CHAT_MEMBER_SCOPE_ADDRESS)) {
    return {
      label: 'GroupMemberScope',
      title: '成员名单发言',
      description: '普通发言者需要使用 GroupMember 成员名单里的 NFT ID 发言。',
      status: '成员制',
    };
  }
  if (sameAddress(address, GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS)) {
    return {
      label: 'GroupJoinScopeSource',
      title: '成员名单或加入关系',
      description: '通过此链群参与行动的地址或显式加入成员名单的 NFT，即为群成员，可发言。',
      status: '成员制',
    };
  }
  const managerScope = managerMemberScopeDescription(address);
  if (managerScope) {
    return {
      label: managerScope.label,
      title: '管理器发言范围',
      description: managerScope.text,
      status: '系统规则',
    };
  }
  return {
    label: '自定义 scopeSource',
    title: '自定义发言范围',
    description: '发言资格由这个自定义合约实时判断；前端无法枚举完整成员，只能展示链上地址。',
    status: '自定义',
  };
}

function explainBanContract(address?: `0x${string}`): ContractExplanation {
  if (!address) {
    return {
      label: 'banSource',
      title: '正在读取禁言规则',
      description: '读取完成后会显示这个群是否启用了管理员禁言名单、治理禁言或自定义禁言源。',
      status: '读取中',
    };
  }
  if (isZeroAddress(address)) {
    return {
      label: '不设置',
      title: '不启用禁言源',
      description: '群聊不会额外查询禁言合约；是否能发言主要取决于激活状态、总开关和发言范围。',
      status: '未启用',
    };
  }
  if (sameAddress(address, GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS)) {
    return {
      label: 'AdminBanSource',
      title: '管理员禁言名单',
      description: 'owner、delegate 或 GroupAdmin 管理员可以维护地址/NFT 禁言名单；命中后不能发言。',
      status: '管理员维护',
    };
  }
  if (sameAddress(address, GROUP_CHAT_GOV_VOTED_BAN_SOURCE_ADDRESS)) {
    return {
      label: 'GovVotedBanSource',
      title: '治理投票禁言',
      description: '社区通过治理票对地址或 NFT 发起禁言投票；达到规则后实时生效。',
      status: '治理维护',
    };
  }
  return {
    label: '自定义 banSource',
    title: '自定义禁言规则',
    description: '禁言状态由这个自定义合约实时判断；前端会按标准禁言接口查询。',
    status: '自定义',
  };
}

function explainPluginContract(address: `0x${string}` | undefined, timing: 'before' | 'after'): ContractExplanation {
  if (!address) {
    return {
      label: timing === 'before' ? 'beforePostPlugin' : 'afterPostPlugin',
      title: timing === 'before' ? '正在读取发言前插件' : '正在读取发送后插件',
      description: timing === 'before'
        ? '读取完成后会显示发言前是否有额外检查或联动。'
        : '读取完成后会显示消息写入后是否有额外联动。',
      status: '读取中',
    };
  }
  if (isZeroAddress(address)) {
    return {
      label: '不设置',
      title: timing === 'before' ? '无发言前插件' : '无发送后插件',
      description: timing === 'before'
        ? '发言前不会额外调用插件；只执行群聊自身的资格和禁言检查。'
        : '消息写入后不会额外调用插件；只保存群聊消息本身。',
      status: '未启用',
    };
  }
  const managerScope = managerMemberScopeDescription(address);
  if (managerScope) {
    return {
      label: managerScope.label,
      title: timing === 'before' ? '管理器发言前插件' : '管理器发送后插件',
      description: timing === 'before'
        ? '发言交易会先经过这个管理器插件，可做额外检查或同步。'
        : '消息写入后会通知这个管理器插件，用于同步行动、代币或治理相关状态。',
      status: '系统插件',
    };
  }
  return {
    label: timing === 'before' ? '自定义 beforePostPlugin' : '自定义 afterPostPlugin',
    title: timing === 'before' ? '自定义发言前插件' : '自定义发送后插件',
    description: timing === 'before'
      ? '发言交易会先调用这个自定义插件；插件可以让交易继续，也可能拒绝。'
      : '消息写入后会调用这个自定义插件，用于外部联动或记录。',
    status: '自定义',
  };
}

function ContractAddressValue({ address }: { address?: `0x${string}` }) {
  if (!address) return <span>读取中</span>;
  if (isZeroAddress(address)) return <span>未设置</span>;
  return <AddressWithCopyButton address={address} showCopyButton colorClassName="text-greyscale-700" />;
}

function ContractRuleCard({
  eyebrow,
  address,
  explanation,
}: {
  eyebrow: string;
  address?: `0x${string}`;
  explanation: ContractExplanation;
}) {
  return (
    <article className="contract-rule-card">
      <div className="card-topline">
        <span>{eyebrow}</span>
        {explanation.status && <span className="tag">{explanation.status}</span>}
      </div>
      <strong>{explanation.title}</strong>
      <p>{explanation.description}</p>
      <div className="contract-address-row">
        <span>{explanation.label}</span>
        <ContractAddressValue address={address} />
      </div>
    </article>
  );
}

function StatusMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  return (
    <div className={cn('settings-metric', `tone-${tone}`)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SettingsPanelSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-panel-section">
      <div className="settings-section-heading">
        <span className="settings-section-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function ChatSettingsPanel({
  groupId,
  account,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  onChanged: () => void;
}) {
  const room = useGroupChatRoomPublicData(groupId);
  const accountRoom = useGroupChatRoomAccountData(groupId, account, room.senderNames);
  const [scopeSource, setScopeSource] = useState('');
  const [banSource, setBanSource] = useState('');
  const [beforePostPlugin, setBeforePostPlugin] = useState('');
  const [afterPostPlugin, setAfterPostPlugin] = useState('');
  const postingTx = useSetGroupChatPostingAllowed();
  const scopeTx = useSetGroupChatScopeSource();
  const banTx = useSetGroupChatBanSource();
  const beforePluginTx = useSetGroupChatBeforePostPlugin();
  const afterPluginTx = useSetGroupChatAfterPostPlugin();
  const groupDelegate = useGroupChatGroupDelegateAddress();
  const delegateState = useGroupDelegateId(groupDelegate.groupDelegateAddress, groupId);
  const delegateTx = useSetGroupDelegateId(groupDelegate.groupDelegateAddress);
  const delegateLookup = useNftOwnerLookup({ initialMode: 'id' });
  const editPermission = useGroupOwnerOrDelegatePermission(groupId, account);
  const managerOwned = isManagerOwnedChat(room.chatInfo?.owner);
  const ownerPermission = resolveOwnerManagedChatPermission({
    account,
    owner: room.chatInfo?.owner,
    ownerOrDelegateId: editPermission.ownerOrDelegateId,
    isOwnerOrDelegatePending: editPermission.isPending,
    managerOwned,
    hasChatInfo: !!room.chatInfo,
  });
  const canEditRules = ownerPermission.canEdit;
  const detailSubtitle = useGroupDetailSubtitle(groupId, room);
  const ownerExplanation = explainOwnerContract(room.chatInfo?.owner);
  const scopeExplanation = explainScopeContract(room.chatInfo?.scopeSource);
  const banExplanation = explainBanContract(room.chatInfo?.banSource);
  const beforePluginExplanation = explainPluginContract(room.chatInfo?.beforePostPlugin, 'before');
  const afterPluginExplanation = explainPluginContract(room.chatInfo?.afterPostPlugin, 'after');
  const canPostText = accountRoom.canPost
    ? '可以发言'
    : formatCanPostReason(accountRoom.canPostReasonCode) || '当前地址暂时不满足这个群聊的发言条件。';
  const activationText = room.chatInfo ? (room.chatInfo.activated ? '已激活' : '未激活') : '读取中';
  const postingText = room.chatInfo ? (room.chatInfo.postingAllowed ? '允许发言' : '暂停发言') : '读取中';
  const delegateText = delegateState.isPending ? '读取中' : `NFT #${delegateState.delegateId?.toString() || '0'}`;

  const refetchSettings = useCallback(() => {
    room.refetch();
    delegateState.refetch();
    onChanged();
  }, [delegateState, onChanged, room]);
  useConfirmedTransactionEffect(postingTx, refetchSettings);
  useConfirmedTransactionEffect(scopeTx, refetchSettings);
  useConfirmedTransactionEffect(banTx, refetchSettings);
  useConfirmedTransactionEffect(beforePluginTx, refetchSettings);
  useConfirmedTransactionEffect(afterPluginTx, refetchSettings);
  useConfirmedTransactionEffect(delegateTx, refetchSettings);

  useEffect(() => {
    if (room.chatInfo) {
      setScopeSource(room.chatInfo.scopeSource);
      setBanSource(room.chatInfo.banSource);
      setBeforePostPlugin(room.chatInfo.beforePostPlugin);
      setAfterPostPlugin(room.chatInfo.afterPostPlugin);
    }
  }, [room.chatInfo]);

  useEffect(() => {
    if (delegateState.delegateId !== undefined && !delegateLookup.lookupValue) {
      delegateLookup.setLookupMode('id');
      delegateLookup.setLookupValue(delegateState.delegateId.toString());
    }
  }, [delegateLookup, delegateState.delegateId]);

  const updatePostingAllowed = async (value: boolean) => {
    try {
      await postingTx.setPostingAllowed(groupId, value);
      toast.success('已提交群发言状态更新');
    } catch (error) {
      console.error(error);
    }
  };

  const updateRuleAddress = async (
    value: string,
    label: string,
    update: (groupId: bigint, address: `0x${string}`) => Promise<unknown>,
  ) => {
    const address = parseAddressInput(value);
    if (!address) {
      toast.error(`请输入有效 ${label} 地址`);
      return;
    }
    try {
      await update(groupId, address);
      toast.success(`已提交 ${label} 更新`);
    } catch (error) {
      console.error(error);
    }
  };

  const resolveDelegateIdInput = () => {
    const trimmed = delegateLookup.lookupValue.trim();
    if (!trimmed) {
      toast.error(delegateLookup.lookupMode === 'name' ? '请输入代理 NFT 名称或 0' : '请输入代理 NFT ID 或 0');
      return undefined;
    }
    if (trimmed === '0') return BigInt(0);
    if (delegateLookup.lookupResult?.status === 'resolved') {
      return delegateLookup.lookupResult.tokenId;
    }
    toast.error('请先输入并解析有效代理 NFT，或输入 0 取消代理');
    return undefined;
  };

  const updateDelegateId = async () => {
    const delegateId = resolveDelegateIdInput();
    if (delegateId === undefined) return;
    if (!groupDelegate.groupDelegateAddress || groupDelegate.groupDelegateAddress === ZERO_ADDRESS) {
      toast.error('GroupDelegate 地址未加载');
      return;
    }
    try {
      await delegateTx.setDelegateId(groupId, delegateId);
      toast.success('已提交代理 NFT 更新');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="workspace-screen settings-screen">
      <section className="workspace-band settings-workspace">
        <GroupDetailHeader
          title="群设置"
          groupId={groupId}
          subtitle={detailSubtitle}
          meta={managerOwned ? 'Manager 持有 NFT' : canEditRules ? '可管理' : '只读'}
        />

        <section className="settings-overview">
          <div className="settings-overview-main">
            <div className="settings-overview-title">
              <span className="settings-section-icon"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></span>
              <div>
                <h2>运行状态</h2>
                <p>{detailSubtitle}</p>
              </div>
            </div>
            <div className="settings-metric-grid">
              <StatusMetric label="群 NFT" value={`#${groupId.toString()}`} />
              <StatusMetric label="激活状态" value={activationText} tone={room.chatInfo?.activated ? 'good' : 'warn'} />
              <StatusMetric label="发言开关" value={postingText} tone={room.chatInfo?.postingAllowed ? 'good' : 'warn'} />
              {!managerOwned && (
                <StatusMetric
                  label="当前身份"
                  value={accountRoom.defaultSenderId ? `NFT #${accountRoom.defaultSenderId.toString()}` : '未设置'}
                  tone={accountRoom.defaultSenderId ? 'good' : 'warn'}
                />
              )}
              <StatusMetric label="我能否发言" value={room.chatInfo ? canPostText : '读取中'} tone={accountRoom.canPost ? 'good' : 'warn'} />
              {!managerOwned && <StatusMetric label="代理 NFT" value={delegateText} />}
            </div>
          </div>
        </section>

        {managerOwned ? (
          <div className="settings-layout">
            <div className="settings-main-column">
              <div className="notice-row permission-row permission-warn settings-permission-banner">
                去中心化群聊由 Manager 持有群聊 NFT，激活后无人有权再修改群设置。
              </div>
            </div>
            <aside className="settings-side-column">
              <SettingsPanelSection icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="规则概览">
                <div className="contract-rule-grid">
                  <ContractRuleCard eyebrow="谁管理这个群" address={room.chatInfo?.owner} explanation={ownerExplanation} />
                  <ContractRuleCard eyebrow="谁能发言" address={room.chatInfo?.scopeSource} explanation={scopeExplanation} />
                  <ContractRuleCard eyebrow="谁被禁言" address={room.chatInfo?.banSource} explanation={banExplanation} />
                  <ContractRuleCard eyebrow="发言前" address={room.chatInfo?.beforePostPlugin} explanation={beforePluginExplanation} />
                  <ContractRuleCard eyebrow="发送后" address={room.chatInfo?.afterPostPlugin} explanation={afterPluginExplanation} />
                </div>
              </SettingsPanelSection>
            </aside>
          </div>
        ) : (
          <div className="settings-layout">
            <div className="settings-main-column">
              <div className={cn('notice-row permission-row settings-permission-banner', canEditRules ? 'permission-ok' : 'permission-warn')}>
                {canEditRules
                  ? '有权限：当前身份是 owner/delegate，可修改发言开关、规则合约和代理 NFT。'
                  : '无权限：群设置只允许当前 owner 或有效 delegate 修改；本页只读。'}
              </div>
              <SettingsPanelSection icon={<Power className="h-4 w-4" aria-hidden="true" />} title="常用操作">
                <div className="settings-control-card">
                  <div>
                    <strong>发言总开关</strong>
                    <span>控制整个群是否允许新消息写入。</span>
                  </div>
                  <div className="choice-group settings-switch-group">
                    <button className={cn('picker-button inline-flex', room.chatInfo?.postingAllowed && 'active')} type="button" onClick={() => updatePostingAllowed(true)} disabled={!canEditRules}>
                      允许发言
                    </button>
                    <button className={cn('picker-button inline-flex', room.chatInfo && !room.chatInfo.postingAllowed && 'active')} type="button" onClick={() => updatePostingAllowed(false)} disabled={!canEditRules}>
                      暂停发言
                    </button>
                  </div>
                </div>
                <div className="delegate-panel settings-control-card">
                  <div className="card-topline">
                    <strong>代理 NFT</strong>
                    <span>delegateId</span>
                  </div>
                  <div className="query-result">
                    当前 {delegateText}；输入 0 表示不设置代理。
                  </div>
                  <div className="query-row delegate-query-row">
                    <NftOwnerLookup
                      lookupMode={delegateLookup.lookupMode}
                      onLookupModeChange={delegateLookup.setLookupMode}
                      lookupValue={delegateLookup.lookupValue}
                      onLookupValueChange={delegateLookup.setLookupValue}
                      lookupResult={delegateLookup.lookupValue.trim() === '0' ? null : delegateLookup.lookupResult}
                      disabled={!canEditRules}
                    />
                    <button className="sheet-button primary inline-flex" type="button" onClick={updateDelegateId} disabled={!canEditRules}>确认</button>
                  </div>
                </div>
              </SettingsPanelSection>
              <SettingsPanelSection icon={<PlugZap className="h-4 w-4" aria-hidden="true" />} title="规则合约">
                <div className="settings-field-block">
                  <div className="field-row">
                    <label htmlFor="chat-scope-source">发言范围</label>
                    <Input id="chat-scope-source" value={scopeSource} onChange={(event) => setScopeSource(event.target.value)} readOnly={!canEditRules} />
                    <button className="sheet-button inline-flex" type="button" onClick={() => updateRuleAddress(scopeSource, '发言范围合约', scopeTx.setScopeSource)} disabled={!canEditRules}>更新</button>
                  </div>
                  <p>{scopeExplanation.description}</p>
                </div>
                <div className="settings-field-block">
                  <div className="field-row">
                    <label htmlFor="chat-ban-source">禁言规则</label>
                    <Input id="chat-ban-source" value={banSource} onChange={(event) => setBanSource(event.target.value)} readOnly={!canEditRules} />
                    <button className="sheet-button inline-flex" type="button" onClick={() => updateRuleAddress(banSource, '禁言规则合约', banTx.setBanSource)} disabled={!canEditRules}>更新</button>
                  </div>
                  <p>{banExplanation.description}</p>
                </div>
                <div className="settings-field-block">
                  <div className="field-row">
                    <label htmlFor="chat-before-plugin">发言前插件</label>
                    <Input id="chat-before-plugin" value={beforePostPlugin} onChange={(event) => setBeforePostPlugin(event.target.value)} readOnly={!canEditRules} />
                    <button className="sheet-button inline-flex" type="button" onClick={() => updateRuleAddress(beforePostPlugin, '发言前插件', beforePluginTx.setBeforePostPlugin)} disabled={!canEditRules}>更新</button>
                  </div>
                  <p>{beforePluginExplanation.description}</p>
                </div>
                <div className="settings-field-block">
                  <div className="field-row">
                    <label htmlFor="chat-after-plugin">发送后插件</label>
                    <Input id="chat-after-plugin" value={afterPostPlugin} onChange={(event) => setAfterPostPlugin(event.target.value)} readOnly={!canEditRules} />
                    <button className="sheet-button inline-flex" type="button" onClick={() => updateRuleAddress(afterPostPlugin, '发送后插件', afterPluginTx.setAfterPostPlugin)} disabled={!canEditRules}>更新</button>
                  </div>
                  <p>{afterPluginExplanation.description}</p>
                </div>
              </SettingsPanelSection>
            </div>

            <aside className="settings-side-column">
              <SettingsPanelSection icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="规则概览">
                <div className="contract-rule-grid">
                  <ContractRuleCard eyebrow="谁管理这个群" address={room.chatInfo?.owner} explanation={ownerExplanation} />
                  <ContractRuleCard eyebrow="谁能发言" address={room.chatInfo?.scopeSource} explanation={scopeExplanation} />
                  <ContractRuleCard eyebrow="谁被禁言" address={room.chatInfo?.banSource} explanation={banExplanation} />
                  <ContractRuleCard eyebrow="发言前" address={room.chatInfo?.beforePostPlugin} explanation={beforePluginExplanation} />
                  <ContractRuleCard eyebrow="发送后" address={room.chatInfo?.afterPostPlugin} explanation={afterPluginExplanation} />
                </div>
              </SettingsPanelSection>
            </aside>
          </div>
        )}

      </section>
    </section>
  );
}
