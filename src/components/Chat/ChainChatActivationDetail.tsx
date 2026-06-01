import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import { isGroupChatEnabled, useActivateDirectGroupChat, useGroupChatInfo } from '@/src/hooks/contracts/useGroupChat';
import {
  GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
  GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
  GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
  isGroupJoinScopeSourceEnabled,
  isGroupMemberScopeEnabled,
} from '@/src/hooks/contracts/useGroupChatModeration';
import { parseGroupChatInfo } from '@/src/hooks/composite/groupChatDataTypes';
import { isValidEthAddress } from '@/src/lib/addressUtils';
import { copyWithToast } from '@/src/lib/clipboardUtils';
import { ZERO_ADDRESS } from './chatConstants';
import { followGroupId } from './chatStorage';
import { useConfirmedTransactionEffect } from './useConfirmedTransactionEffect';

type RuleSlotKey = 'zero' | 'custom' | string;

type RuleSlotOption = {
  key: RuleSlotKey;
  chineseName: string;
  contractName: string;
  address: `0x${string}`;
  summary: string;
  description: string;
  enabled: boolean;
};

type RuleSlotValue = {
  selectedKey: RuleSlotKey;
  customAddress: `0x${string}`;
};

function normalizeCustomAddress(value: string): `0x${string}` | undefined {
  const trimmed = value.trim();
  if (!isValidEthAddress(trimmed)) return undefined;
  return trimmed.toLowerCase() as `0x${string}`;
}

function getRuleSlotAddress(value: RuleSlotValue, options: readonly RuleSlotOption[]) {
  if (value.selectedKey === 'custom') {
    return normalizeCustomAddress(value.customAddress) || value.customAddress;
  }
  return options.find((option) => option.key === value.selectedKey)?.address || ZERO_ADDRESS;
}

function getSelectedRuleSlotOption(value: RuleSlotValue, options: readonly RuleSlotOption[]): RuleSlotOption {
  if (value.selectedKey === 'custom') {
    const address = normalizeCustomAddress(value.customAddress) || value.customAddress;
    return {
      key: 'custom',
      chineseName: '自定义',
      contractName: 'CustomContract',
      address,
      summary: '使用自定义合约',
      description: '使用你手动输入的合约地址作为该规则槽的来源。适合接入尚未内置到前端的规则合约；如果不需要规则，请保持 0 地址。',
      enabled: true,
    };
  }
  return options.find((option) => option.key === value.selectedKey) || options[0];
}

function shortenAddress(address: string) {
  if (address.length <= 18) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

async function copyRuleSlotText(text: string, label: string) {
  await copyWithToast(text, `已复制${label}`);
}

function RuleSummaryItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rule-summary-item">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RuleSlotPicker({
  title,
  value,
  options,
  disabled,
  onChange,
}: {
  title: string;
  value: RuleSlotValue;
  options: readonly RuleSlotOption[];
  disabled: boolean;
  onChange: (value: RuleSlotValue) => void;
}) {
  const selectedOption = getSelectedRuleSlotOption(value, options);
  const customAddressError =
    value.selectedKey === 'custom' && !normalizeCustomAddress(value.customAddress)
      ? '请输入有效的 0x 合约地址'
      : '';
  const showsContractMeta = selectedOption.key !== 'zero' && selectedOption.key !== 'custom';
  const showsCustomAddress = selectedOption.key === 'custom';

  return (
    <article className="rule-slot-card">
      <div className="rule-slot-title">
        <strong>{title}</strong>
      </div>
      <div className="rule-slot-body">
        <select
          className="rule-slot-select"
          value={value.selectedKey}
          onChange={(event) => onChange({ ...value, selectedKey: event.target.value })}
          disabled={disabled}
        >
          {options.map((option) => (
            <option
              key={option.key}
              value={option.key}
              disabled={!option.enabled}
            >
              {option.chineseName}
            </option>
          ))}
          <option value="custom">自定义</option>
        </select>
        <p className="rule-slot-description">{selectedOption.description}</p>
        {showsContractMeta && (
          <div className="rule-slot-meta">
            <div className="rule-slot-value-row rule-slot-name-row">
              <code>{selectedOption.contractName}</code>
            </div>
            <div className="rule-slot-value-row rule-slot-address-row">
              <code title={selectedOption.address}>{shortenAddress(selectedOption.address)}</code>
              <button
                type="button"
                aria-label="复制合约地址"
                title="复制合约地址"
                onClick={() => copyRuleSlotText(selectedOption.address, '合约地址')}
              >
                <Copy size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {showsCustomAddress && (
          <div className="rule-slot-meta rule-slot-custom-meta">
            <div className="rule-slot-value-row rule-slot-address-row">
              <input
                aria-label={`${title}自定义合约地址`}
                value={value.customAddress}
                onChange={(event) =>
                  onChange({
                    ...value,
                    customAddress: event.target.value as `0x${string}`,
                  })
                }
                placeholder={ZERO_ADDRESS}
                disabled={disabled}
              />
            <button
              type="button"
              aria-label="复制合约地址"
              title="复制合约地址"
              onClick={() => copyRuleSlotText(value.customAddress, '合约地址')}
            >
              <Copy size={14} aria-hidden="true" />
            </button>
            </div>
            {customAddressError && <p className="rule-slot-error">{customAddressError}</p>}
          </div>
        )}
      </div>
    </article>
  );
}

export function ChainChatActivationDetail({
  isConnected,
  account,
  groupId,
  groupName,
  onOpen,
  onConfirmed,
}: {
  isConnected: boolean;
  account: `0x${string}` | undefined;
  groupId: bigint | undefined;
  groupName?: string;
  onOpen: (groupId: bigint) => void;
  onConfirmed: () => void;
}) {
  const recommendedScopeSource: RuleSlotValue = {
    selectedKey: isGroupJoinScopeSourceEnabled ? 'group-join-scope-source' : 'zero',
    customAddress: ZERO_ADDRESS,
  };
  const recommendedBanSource: RuleSlotValue = {
    selectedKey: GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS !== ZERO_ADDRESS ? 'admin-ban-source' : 'zero',
    customAddress: ZERO_ADDRESS,
  };
  const recommendedBeforePostPlugin: RuleSlotValue = {
    selectedKey: 'zero',
    customAddress: ZERO_ADDRESS,
  };
  const recommendedAfterPostPlugin: RuleSlotValue = {
    selectedKey: 'zero',
    customAddress: ZERO_ADDRESS,
  };
  const [scopeSource, setScopeSource] = useState<RuleSlotValue>(recommendedScopeSource);
  const [banSource, setBanSource] = useState<RuleSlotValue>(recommendedBanSource);
  const [beforePostPlugin, setBeforePostPlugin] = useState<RuleSlotValue>(recommendedBeforePostPlugin);
  const [afterPostPlugin, setAfterPostPlugin] = useState<RuleSlotValue>(recommendedAfterPostPlugin);
  const [configMode, setConfigMode] = useState<'recommended' | 'advanced'>('recommended');
  const activateTx = useActivateDirectGroupChat();
  const submittedGroupIdRef = useRef<bigint | undefined>();
  const { chatInfo: rawChatInfo, isPending: isChatInfoPending, error: chatInfoError } = useGroupChatInfo(groupId, !!groupId);
  const chatInfo = useMemo(() => parseGroupChatInfo(rawChatInfo), [rawChatInfo]);
  const accountOwnsGroup = !!account && !!chatInfo?.owner && chatInfo.owner.toLowerCase() === account.toLowerCase();
  let activationIssue = '';
  if (!isGroupChatEnabled) {
    activationIssue = '当前环境未配置 GroupChat 合约地址。';
  } else if (!groupId) {
    activationIssue = '缺少链群 NFT ID。';
  } else if (chatInfoError) {
    activationIssue = '链群 NFT 不存在或状态读取失败。';
  } else if (!isConnected || !account) {
    activationIssue = '请先连接钱包。';
  } else if (chatInfo?.activated) {
    activationIssue = '该链群已经激活。';
  } else if (chatInfo && !accountOwnsGroup) {
    activationIssue = '当前钱包不是该链群 NFT 的持有人。';
  }

  useEffect(() => {
    submittedGroupIdRef.current = undefined;
  }, [groupId]);

  useConfirmedTransactionEffect(activateTx, () => {
    toast.success('链群已激活');
    onConfirmed();
    if (submittedGroupIdRef.current) {
      followGroupId(account, submittedGroupIdRef.current);
      onOpen(submittedGroupIdRef.current);
    }
  });

  const scopeOptions: RuleSlotOption[] = [
    {
      key: 'zero',
      chineseName: '不设置',
      contractName: 'ZeroAddress',
      address: ZERO_ADDRESS,
      summary: '不限制发言资格',
      description: '不启用发言资格规则。群聊激活后不会从这个槽读取额外资格合约，适合先开通基础群聊，再按需要补充规则。',
      enabled: true,
    },
    {
      key: 'group-member-scope',
      chineseName: '管理员指定的群成员',
      contractName: 'GroupMemberScope',
      address: GROUP_CHAT_MEMBER_SCOPE_ADDRESS,
      summary: '仅管理员指定成员可发言',
      description: '只允许管理员指定的群成员发言。这个规则按链群成员名单判断发言资格，适合由管理员维护固定发言名单的群聊。',
      enabled: isGroupMemberScopeEnabled,
    },
    {
      key: 'group-join-scope-source',
      chineseName: '参与链群行动或管理员指定的群成员',
      contractName: 'GroupJoinScopeSource',
      address: GROUP_CHAT_JOIN_SCOPE_SOURCE_ADDRESS,
      summary: '行动参与者 + 管理员添加的成员可发言',
      description: '通过此链群参与行动的地址或显式加入成员名单的 NFT，即为群成员，可发言。',
      enabled: isGroupJoinScopeSourceEnabled,
    },
  ];
  const banOptions: RuleSlotOption[] = [
    {
      key: 'zero',
      chineseName: '不设置',
      contractName: 'ZeroAddress',
      address: ZERO_ADDRESS,
      summary: '不启用禁言名单',
      description: '不启用禁言管理。群聊不会从这个槽读取禁言状态，适合不需要维护禁言名单的轻量群聊。',
      enabled: true,
    },
    {
      key: 'admin-ban-source',
      chineseName: '管理员维护的禁言名单',
      contractName: 'AdminBanSource',
      address: GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS,
      summary: '管理员可设置禁言名单',
      description: '启用管理员维护的禁言名单。管理员或有权限的操作者可以维护禁言状态，群聊发言前会读取这里判断是否被禁止发言。',
      enabled: GROUP_CHAT_ADMIN_BAN_SOURCE_ADDRESS !== ZERO_ADDRESS,
    },
  ];
  const pluginOptions: RuleSlotOption[] = [
    {
      key: 'zero',
      chineseName: '不设置',
      contractName: 'ZeroAddress',
      address: ZERO_ADDRESS,
      summary: '不调用发言插件',
      description: '不启用发言插件。消息发送前后不会调用额外合约，适合当前还不需要自定义扩展逻辑的群聊。',
      enabled: true,
    },
  ];
  const activeScopeSource = configMode === 'recommended' ? recommendedScopeSource : scopeSource;
  const activeBanSource = configMode === 'recommended' ? recommendedBanSource : banSource;
  const activeBeforePostPlugin = configMode === 'recommended' ? recommendedBeforePostPlugin : beforePostPlugin;
  const activeAfterPostPlugin = configMode === 'recommended' ? recommendedAfterPostPlugin : afterPostPlugin;
  const selectedScopeOption = getSelectedRuleSlotOption(recommendedScopeSource, scopeOptions);
  const selectedBanOption = getSelectedRuleSlotOption(recommendedBanSource, banOptions);
  const scopeSourceAddress = getRuleSlotAddress(activeScopeSource, scopeOptions);
  const banSourceAddress = getRuleSlotAddress(activeBanSource, banOptions);
  const beforePostPluginAddress = getRuleSlotAddress(activeBeforePostPlugin, pluginOptions);
  const afterPostPluginAddress = getRuleSlotAddress(activeAfterPostPlugin, pluginOptions);
  const ruleSlotAddressError =
    [scopeSourceAddress, banSourceAddress, beforePostPluginAddress, afterPostPluginAddress].every(isValidEthAddress)
      ? ''
      : '自定义规则槽地址格式不正确。';

  const activateChainChat = async () => {
    if (!groupId) {
      toast.error('缺少链群 NFT ID');
      return;
    }
    if (!isConnected || !account) {
      toast.error('请先连接钱包');
      return;
    }
    if (chatInfo?.activated) {
      toast.error('该链群已经激活');
      return;
    }
    if (chatInfo && !accountOwnsGroup) {
      toast.error('当前钱包不是该链群 NFT 的持有人');
      return;
    }
    if (ruleSlotAddressError) {
      toast.error(ruleSlotAddressError);
      return;
    }

    try {
      submittedGroupIdRef.current = groupId;
      await activateTx.activateChat(
        groupId,
        scopeSourceAddress,
        banSourceAddress,
        beforePostPluginAddress,
        afterPostPluginAddress,
      );
      toast.success('已提交链群激活交易');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="activation-form chain-activation-detail">
      <div className="selected-chain-nft">
        <div className="selected-chain-nft-main">
          <strong>{groupName || '未命名链群'}</strong>
          <span>{groupId ? `NFT #${groupId.toString()}` : '未选择 NFT'}</span>
        </div>
      </div>
      <section className="activation-config-tabs">
        <div className="activation-tab-list" role="tablist" aria-label="激活配置模式">
          <button
            type="button"
            role="tab"
            aria-selected={configMode === 'recommended'}
            className="activation-tab inline-flex"
            onClick={() => setConfigMode('recommended')}
          >
            推荐设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={configMode === 'advanced'}
            className="activation-tab inline-flex"
            onClick={() => setConfigMode('advanced')}
          >
            高级设置
          </button>
        </div>

        {configMode === 'recommended' ? (
          <div className="activation-tab-panel activation-recommendation" role="tabpanel">
            <div className="rule-summary-grid">
              <RuleSummaryItem title="谁能发言" value={selectedScopeOption.summary} />
              <RuleSummaryItem title="禁言管理" value={selectedBanOption.summary} />
            </div>
            <p>默认配置覆盖常见群聊场景；只有需要接入自定义合约时，再切到高级设置。</p>
          </div>
        ) : (
          <div className="activation-tab-panel activation-advanced" role="tabpanel">
            <div className="rule-slot-list">
              <RuleSlotPicker
                title="发言资格"
                value={scopeSource}
                options={scopeOptions}
                disabled={!!chatInfo?.activated}
                onChange={setScopeSource}
              />
              <RuleSlotPicker
                title="禁言管理"
                value={banSource}
                options={banOptions}
                disabled={!!chatInfo?.activated}
                onChange={setBanSource}
              />
              <RuleSlotPicker
                title="发言前插件"
                value={beforePostPlugin}
                options={pluginOptions}
                disabled={!!chatInfo?.activated}
                onChange={setBeforePostPlugin}
              />
              <RuleSlotPicker
                title="发言后插件"
                value={afterPostPlugin}
                options={pluginOptions}
                disabled={!!chatInfo?.activated}
                onChange={setAfterPostPlugin}
              />
            </div>
          </div>
        )}
      </section>
      <div className="chain-activation-actionbar">
        {isChatInfoPending ? (
          <div className="notice-row">正在读取激活状态...</div>
        ) : ruleSlotAddressError ? (
          <div className="notice-row">{ruleSlotAddressError}</div>
        ) : activationIssue ? (
          <div className="notice-row">{activationIssue}</div>
        ) : null}
        <div className="activation-submit-row">
          <button
            className="sheet-button primary inline-flex"
            type="button"
            onClick={activateChainChat}
            disabled={
              !!activationIssue ||
              !!ruleSlotAddressError ||
              isChatInfoPending ||
              activateTx.isPending ||
              activateTx.isConfirming
            }
          >
            {activateTx.isPending || activateTx.isConfirming ? '提交中' : '激活'}
          </button>
        </div>
      </div>
    </section>
  );
}
