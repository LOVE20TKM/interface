'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Info, PlugZap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input } from '@/components/ui/input';
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
  useGroupChatPublicData,
} from '@/src/hooks/composite/useGroupChatData';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';
import { resolveOwnerManagedChatPermission } from '@/src/lib/groupChatPermissions';
import { cn } from '@/lib/utils';
import { GroupDetailHeader, useGroupDetailSubtitle } from './ChatGroupDetailHeader';
import { ZERO_ADDRESS } from './chatConstants';
import {
  buildGroupChatPanelHref,
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
      label: '成员名单规则',
      title: '成员名单发言',
      description: '只有加入本群成员名单的默认发言身份可以发言。',
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
      title: `${managerScope.summary}可发言`,
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

function ContractRuleSummary({
  label,
  explanation,
}: {
  label: string;
  explanation: ContractExplanation;
}) {
  return (
    <div className="contract-rule-summary">
      <span>{label}</span>
      <strong>{explanation.title}</strong>
    </div>
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

function formatDelegateIdText(isPending: boolean, delegateId: bigint | undefined) {
  if (isPending) return '读取中';
  if (delegateId === undefined || delegateId === BigInt(0)) return '未设置';
  return `NFT #${delegateId.toString()}`;
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
  tokenSymbol,
  onChanged,
}: {
  groupId: bigint;
  account: `0x${string}` | undefined;
  tokenSymbol?: string;
  onChanged: () => void;
}) {
  const publicData = useGroupChatPublicData(groupId);
  const [scopeSource, setScopeSource] = useState('');
  const [banSource, setBanSource] = useState('');
  const [beforePostPlugin, setBeforePostPlugin] = useState('');
  const [afterPostPlugin, setAfterPostPlugin] = useState('');
  const [permissionExpanded, setPermissionExpanded] = useState(false);
  const [delegateExpanded, setDelegateExpanded] = useState(false);
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
  const managerOwned = isManagerOwnedChat(publicData.chatInfo?.owner);
  const ownerPermission = resolveOwnerManagedChatPermission({
    account,
    owner: publicData.chatInfo?.owner,
    ownerOrDelegateId: editPermission.ownerOrDelegateId,
    isOwnerOrDelegatePending: editPermission.isPending,
    managerOwned,
    hasChatInfo: !!publicData.chatInfo,
  });
  const canEditRules = ownerPermission.canEdit;
  const detailSubtitle = useGroupDetailSubtitle(groupId, publicData);
  const scopeExplanation = explainScopeContract(publicData.chatInfo?.scopeSource);
  const banExplanation = explainBanContract(publicData.chatInfo?.banSource);
  const beforePluginExplanation = explainPluginContract(publicData.chatInfo?.beforePostPlugin, 'before');
  const afterPluginExplanation = explainPluginContract(publicData.chatInfo?.afterPostPlugin, 'after');
  const activationText = publicData.chatInfo ? (publicData.chatInfo.activated ? '已激活' : '未激活') : '读取中';
  const delegateText = formatDelegateIdText(groupDelegate.isPending || delegateState.isPending, delegateState.delegateId);
  const adminsHref = buildGroupChatPanelHref('admins', tokenSymbol, groupId, { from: 'settings' });
  const permissionSummary = (() => {
    if (managerOwned) return { text: '自动管理', tone: 'neutral' as const };
    if (ownerPermission.isPending) return { text: '读取中', tone: 'loading' as const };
    return canEditRules
      ? { text: '可管理', tone: 'ok' as const }
      : { text: '只读', tone: 'neutral' as const };
  })();
  const permissionStatusDetail = managerOwned
    ? '这个群由系统自动管理，当前不能手动修改设置。'
    : !account
      ? '连接钱包后才能判断你是否能修改设置。'
      : ownerPermission.isPending
        ? '持有本群 NFT 或代理 NFT 的钱包可以修改设置。'
        : canEditRules
          ? ownerPermission.accountIsOwner
            ? '你持有本群 NFT，可以修改设置。'
            : `你持有代理 NFT #${editPermission.ownerOrDelegateId.toString()}，可以修改设置。`
          : '你没有修改权限。需要持有本群 NFT 或代理 NFT。';
  const canShowEditableControls = !managerOwned;

  const refetchSettings = useCallback(() => {
    publicData.refetch();
    delegateState.refetch();
    onChanged();
  }, [delegateState, onChanged, publicData]);
  useConfirmedTransactionEffect(postingTx, refetchSettings);
  useConfirmedTransactionEffect(scopeTx, refetchSettings);
  useConfirmedTransactionEffect(banTx, refetchSettings);
  useConfirmedTransactionEffect(beforePluginTx, refetchSettings);
  useConfirmedTransactionEffect(afterPluginTx, refetchSettings);
  useConfirmedTransactionEffect(delegateTx, refetchSettings);

  useEffect(() => {
    if (publicData.chatInfo) {
      setScopeSource(publicData.chatInfo.scopeSource);
      setBanSource(publicData.chatInfo.banSource);
      setBeforePostPlugin(publicData.chatInfo.beforePostPlugin);
      setAfterPostPlugin(publicData.chatInfo.afterPostPlugin);
    }
  }, [publicData.chatInfo]);

  useEffect(() => {
    if (delegateState.delegateId !== undefined && delegateState.delegateId > BigInt(0) && !delegateLookup.lookupValue) {
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
          subtitle={`G#${groupId.toString()} ${detailSubtitle}`}
          actions={(
            <div className="permission-status-inline">
              <span className={cn('pill', permissionSummary.tone === 'ok' ? 'pill-ok' : 'pill-neutral')}>{permissionSummary.text}</span>
              <button
                className="permission-status-info-button"
                type="button"
                aria-label="查看权限原因"
                aria-expanded={permissionExpanded}
                onClick={() => setPermissionExpanded((expanded) => !expanded)}
              >
                <Info size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
              {permissionExpanded && (
                <span className="permission-status-popover" role="status">
                  {permissionStatusDetail}
                </span>
              )}
            </div>
          )}
        />

        <section className="settings-overview" aria-label="群设置摘要">
          <div className="settings-overview-main">
            <div className="settings-metric-grid">
              <StatusMetric label="激活状态" value={activationText} tone={publicData.chatInfo?.activated ? 'good' : 'warn'} />
            </div>
          </div>
        </section>

        <div className="settings-main-column">
          {canShowEditableControls && (
            <section className="settings-panel-section settings-actions-panel" aria-label="群操作">
              <div className="settings-control-row">
                <div className="settings-control-copy">
                  <strong>发言开关</strong>
                </div>
                <div className="choice-group settings-switch-group">
                  <button className={cn('picker-button inline-flex', publicData.chatInfo?.postingAllowed && 'active')} type="button" onClick={() => updatePostingAllowed(true)} disabled={!canEditRules}>
                    允许
                  </button>
                  <button className={cn('picker-button inline-flex', publicData.chatInfo && !publicData.chatInfo.postingAllowed && 'active')} type="button" onClick={() => updatePostingAllowed(false)} disabled={!canEditRules}>
                    暂停
                  </button>
                </div>
              </div>

              <div className="settings-control-row delegate-control-row">
                <div className="settings-control-copy">
                  <strong>代理 NFT</strong>
                  <span>当前 {delegateText}</span>
                </div>
                <div className="delegate-settings-area">
                  <button
                    className="sheet-button inline-flex"
                    type="button"
                    onClick={() => setDelegateExpanded((expanded) => !expanded)}
                    disabled={!canEditRules}
                    aria-expanded={delegateExpanded}
                  >
                    {delegateExpanded ? '收起' : '设置'}
                  </button>
                </div>
                {delegateExpanded && (
                  <div className="query-row delegate-query-row">
                    <NftOwnerLookup
                      lookupMode={delegateLookup.lookupMode}
                      onLookupModeChange={delegateLookup.setLookupMode}
                      lookupValue={delegateLookup.lookupValue}
                      onLookupValueChange={delegateLookup.setLookupValue}
                      lookupResult={delegateLookup.lookupValue.trim() === '0' ? null : delegateLookup.lookupResult}
                      disabled={!canEditRules}
                      className="settings-delegate-lookup"
                      resultVariant="compact"
                    />
                    <button className="sheet-button primary inline-flex" type="button" onClick={updateDelegateId} disabled={!canEditRules}>确认</button>
                  </div>
                )}
              </div>

              <div className="settings-control-row">
                <div className="settings-control-copy">
                  <strong>管理员名单</strong>
                </div>
                <a className="sheet-button inline-flex" href={adminsHref}>
                  设置
                </a>
              </div>
            </section>
          )}

          <SettingsPanelSection icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="当前规则">
            <div className="contract-rule-summary-grid">
              <ContractRuleSummary label="发言" explanation={scopeExplanation} />
              <ContractRuleSummary label="禁言" explanation={banExplanation} />
              <ContractRuleSummary label="发言前" explanation={beforePluginExplanation} />
              <ContractRuleSummary label="发送后" explanation={afterPluginExplanation} />
            </div>
          </SettingsPanelSection>

          <details className="settings-advanced">
            <summary>
              <span className="settings-section-icon"><PlugZap className="h-4 w-4" aria-hidden="true" /></span>
              <strong>高级设置</strong>
              <ChevronDown className="settings-advanced-chevron h-4 w-4" aria-hidden="true" />
            </summary>
            <div className="settings-advanced-body">
              {managerOwned && (
                <div className="settings-readonly-note">
                  {permissionStatusDetail}
                </div>
              )}
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
            </div>
          </details>
        </div>

      </section>
    </section>
  );
}
