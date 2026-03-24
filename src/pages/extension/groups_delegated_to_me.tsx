'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { ChevronRight, User } from 'lucide-react';

// Contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// Hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useExtension } from '@/src/hooks/extension/base/contracts/useExtensionCenter';
import { useCurrentRound as useVerifyCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import {
  useExtensionGroupInfosOfAction,
  GroupBasicInfo,
} from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupInfosOfAction';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { formatTokenAmount } from '@/src/lib/format';

// Components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

interface DelegatedGroupInfo extends GroupBasicInfo {
  isVerified: boolean;
}

const GroupsDelegatedToMePage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 输入的行动ID
  const [actionIdInput, setActionIdInput] = useState('');
  const [searchActionId, setSearchActionId] = useState<bigint | undefined>(undefined);

  // 从 URL query 恢复状态（浏览器返回时自动触发）
  useEffect(() => {
    const queryVal = router.query.actionId as string | undefined;
    if (queryVal && /^\d+$/.test(queryVal)) {
      setActionIdInput(queryVal);
      setSearchActionId(BigInt(queryVal));
    }
  }, [router.query.actionId]);

  // 获取当前加入轮次
  const { currentRound: joinRound } = useCurrentRound();

  // 获取当前验证轮次
  const { currentRound: voteCurrentRound } = useVerifyCurrentRound();
  const verifyRound = useMemo(() => {
    if (!voteCurrentRound || voteCurrentRound < BigInt(2)) return BigInt(0);
    return voteCurrentRound - BigInt(2);
  }, [voteCurrentRound]);

  // 通过行动ID获取extensionAddress
  const {
    extensionAddress,
    isPending: isPendingExtension,
    error: extensionError,
  } = useExtension(token?.address as `0x${string}`, searchActionId ?? BigInt(0));

  // 获取所有链群信息
  const {
    groups,
    isPending: isPendingGroups,
    error: groupsError,
  } = useExtensionGroupInfosOfAction({
    extensionAddress: searchActionId !== undefined ? extensionAddress : undefined,
    round: joinRound,
  });

  // 批量获取每个 groupId 的 delegateByGroupId
  const delegateContracts = useMemo(() => {
    if (!extensionAddress || !groups || groups.length === 0) return [];
    return groups.map((group) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'delegateByGroupId' as const,
      args: [extensionAddress, group.groupId] as const,
    }));
  }, [extensionAddress, groups]);

  const {
    data: delegateData,
    isPending: isPendingDelegates,
    error: delegatesError,
  } = useUniversalReadContracts({
    contracts: delegateContracts as any,
    query: {
      enabled: !!extensionAddress && groups.length > 0,
    },
  });

  // 过滤出委托给当前 account 的链群
  const delegatedGroupIds = useMemo(() => {
    if (!delegateData || !account || groups.length === 0) return [];
    const result: bigint[] = [];
    delegateData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const delegate = (item.result as string).toLowerCase();
        if (delegate === account.toLowerCase()) {
          result.push(groups[index].groupId);
        }
      }
    });
    return result;
  }, [delegateData, account, groups]);

  // 批量查询 isVerified
  const isVerifiedContracts = useMemo(() => {
    if (!extensionAddress || !verifyRound || delegatedGroupIds.length === 0) return [];
    return delegatedGroupIds.map((groupId) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'isVerified' as const,
      args: [extensionAddress, verifyRound, groupId] as const,
    }));
  }, [extensionAddress, verifyRound, delegatedGroupIds]);

  const {
    data: isVerifiedData,
    isPending: isPendingVerified,
    error: verifiedError,
  } = useUniversalReadContracts({
    contracts: isVerifiedContracts as any,
    query: {
      enabled: !!extensionAddress && !!verifyRound && delegatedGroupIds.length > 0,
    },
  });

  // 组装最终数据
  const delegatedGroups = useMemo<DelegatedGroupInfo[]>(() => {
    if (delegatedGroupIds.length === 0) return [];

    const delegatedGroupIdSet = new Set(delegatedGroupIds.map((id) => id.toString()));
    const filteredGroups = groups.filter((g) => delegatedGroupIdSet.has(g.groupId.toString()));

    return filteredGroups.map((group, index) => {
      const isVerified =
        isVerifiedData && isVerifiedData[index]?.status === 'success'
          ? (isVerifiedData[index].result as boolean)
          : false;
      return {
        ...group,
        isVerified,
      };
    });
  }, [groups, delegatedGroupIds, isVerifiedData]);

  // 点击链群跳转
  const handleGroupClick = (group: DelegatedGroupInfo) => {
    if (!token?.symbol || searchActionId === undefined) return;
    if (group.isVerified) {
      // 已验证 -> 跳转到结果页
      router.push(
        `/extension/group/?groupId=${group.groupId}&actionId=${searchActionId}&symbol=${token.symbol}&tab=scores&round=${verifyRound}`,
      );
    } else {
      // 待验证 -> 跳转到验证页
      router.push(`/extension/group_op/?actionId=${searchActionId}&groupId=${group.groupId}&op=verify`);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    const val = actionIdInput.trim();
    if (val && /^\d+$/.test(val)) {
      setSearchActionId(BigInt(val));
      router.replace(
        { pathname: router.pathname, query: { ...router.query, actionId: val } },
        undefined,
        { shallow: true },
      );
    }
  };

  const isSearching = searchActionId !== undefined;
  const isLoading = useMemo(() => {
    if (!isSearching) return false;
    if (isPendingExtension) return true;
    if (isPendingGroups) return true;
    if (groups.length === 0) return false;
    if (isPendingDelegates) return true;
    if (delegatedGroupIds.length === 0) return false;
    return isPendingVerified;
  }, [isSearching, isPendingExtension, isPendingGroups, groups.length, isPendingDelegates, delegatedGroupIds.length, isPendingVerified]);

  return (
    <>
      <Header title="委托给我验证的链群" showBackButton={true} />
      <main className="flex-grow">
        {!account ? (
          <div className="text-center text-sm text-greyscale-500 p-4 mt-4">请先连接钱包</div>
        ) : (
          <div className="flex flex-col space-y-4 p-4">
            {/* 搜索框 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium text-greyscale-700">查看某个行动下委托给我验证的链群：</label>
                <div className="flex space-x-3">
                  <Input
                    type="text"
                    placeholder="请输入行动编号"
                    value={actionIdInput}
                    onChange={(e) => setActionIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} className="text-white px-6">
                    查询
                  </Button>
                </div>
              </div>
            </div>

            {/* 结果展示 */}
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingIcon />
              </div>
            ) : isSearching && extensionAddress && groups.length > 0 && delegatedGroups.length === 0 ? (
              <div className="text-center text-sm text-greyscale-500 p-4 mt-4">该行动下没有链群委托给您验证</div>
            ) : isSearching && (!extensionAddress || groups.length === 0) && !isLoading ? (
              <div className="text-center text-sm text-greyscale-500 p-4 mt-4">该行动下没有链群</div>
            ) : delegatedGroups.length > 0 ? (
              <div>
                <LeftTitle title={`委托给我的链群 (${delegatedGroups.length})`} />
                <div className="space-y-3 mt-3">
                  {delegatedGroups.map((group) => (
                    <div
                      key={group.groupId.toString()}
                      onClick={() => handleGroupClick(group)}
                      className="border border-gray-200 rounded-lg py-3 pl-3 pr-0 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* 链群ID和名称 + 验证状态 */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center items-baseline">
                              <span className="text-gray-500 text-xs">#</span>
                              <span className="text-secondary text-base font-semibold">{group.groupId.toString()}</span>
                              <span className="font-semibold ml-1">{group.groupName}</span>
                            </div>
                            {group.isVerified ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">已验证</span>
                            ) : (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">待验证</span>
                            )}
                          </div>

                          {/* 链群服务者地址 */}
                          <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                            <User className="text-greyscale-400 h-3 w-3" />
                            <span className="text-greyscale-400 text-xs">服务者: </span>
                            <span className="text-greyscale-400">
                              <AddressWithCopyButton address={group.owner} showCopyButton={false} />
                            </span>
                          </div>

                          {/* 参与代币数和参与地址数 */}
                          <div className="flex items-center justify-between text-xs mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">参与代币数:</span>
                              <span className="text-gray-500">{formatTokenAmount(group.totalJoinedAmount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">参与地址数:</span>
                              <span className="text-gray-500">{group.accountCount.toString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* 右侧箭头 */}
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
};

export default GroupsDelegatedToMePage;
