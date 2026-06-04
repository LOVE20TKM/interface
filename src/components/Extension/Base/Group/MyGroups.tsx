/**
 * 我的 LOVE20 NFT 列表组件
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Link from "next/link";

// my hooks
import { useMyGroups } from "@/src/hooks/extension/base/composite/useMyGroups";
import { useTotalBurnedForMint, useTotalSupply } from "@/src/hooks/extension/base/contracts/useLOVE20Group";
import {
  invalidateGroupDefaultsQueries,
  isGroupDefaultsEnabled,
  useClearDefaultGroupId,
  useDefaultGroupIdOf,
  useSetDefaultGroupId,
} from "@/src/hooks/extension/base/contracts/useGroupDefaults";
import { formatTokenAmount } from "@/src/lib/format";
import { useIsOnTargetChain } from "@/src/hooks/useIsOnTargetChain";

// my components
import LeftTitle from "@/src/components/Common/LeftTitle";
import LoadingIcon from "@/src/components/Common/LoadingIcon";
import { Button } from "@/components/ui/button";

const FIRST_TOKEN_SYMBOL = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL as string;

type PendingDefaultAction = {
  type: "set" | "clear";
  tokenId: string;
} | null;

export default function MyGroups() {
  const { address: account, isConnected } = useAccount();
  const isOnTargetChain = useIsOnTargetChain();
  const queryClient = useQueryClient();
  const [lastProcessedSetDefaultHash, setLastProcessedSetDefaultHash] = useState<string | null>(null);
  const [lastProcessedClearDefaultHash, setLastProcessedClearDefaultHash] = useState<string | null>(null);
  const [pendingDefaultAction, setPendingDefaultAction] = useState<PendingDefaultAction>(null);

  const { myGroups, balance, isPending, error } = useMyGroups(account);
  const { totalSupply } = useTotalSupply();
  const { totalBurnedForMint } = useTotalBurnedForMint();

  const canManageDefaultGroup = isGroupDefaultsEnabled && isConnected && isOnTargetChain;
  const { defaultGroupId, refetch: refetchDefaultGroup } = useDefaultGroupIdOf(account, canManageDefaultGroup);
  const hasDefaultGroup = defaultGroupId !== undefined && defaultGroupId > BigInt(0);

  const {
    setDefaultGroupId,
    isPending: isPendingSetDefault,
    isConfirming: isConfirmingSetDefault,
    isConfirmed: isConfirmedSetDefault,
    hash: setDefaultHash,
    writeError: setDefaultError,
  } = useSetDefaultGroupId();
  const {
    clearDefaultGroupId,
    isPending: isPendingClearDefault,
    isConfirming: isConfirmingClearDefault,
    isConfirmed: isConfirmedClearDefault,
    hash: clearDefaultHash,
    writeError: clearDefaultError,
  } = useClearDefaultGroupId();

  const isUpdatingDefault =
    isPendingSetDefault || isConfirmingSetDefault || isPendingClearDefault || isConfirmingClearDefault;

  const renderGroupActions = (groupId: bigint) => {
    const isCurrentDefault = hasDefaultGroup && defaultGroupId === groupId;
    const isRowPending = pendingDefaultAction?.tokenId === groupId.toString();

    return (
      <div className="flex flex-nowrap items-center justify-end gap-1.5">
        {canManageDefaultGroup &&
          (isCurrentDefault ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-[88px] px-2 text-sm leading-none text-secondary border-secondary"
              onClick={() => handleClearDefault(groupId)}
              disabled={isUpdatingDefault}
            >
              {isRowPending && pendingDefaultAction?.type === "clear" ? "处理中..." : "取消默认"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-[88px] px-2 text-sm leading-none text-secondary border-secondary"
              onClick={() => handleSetDefault(groupId)}
              disabled={isUpdatingDefault}
            >
              {isRowPending && pendingDefaultAction?.type === "set" ? "处理中..." : "设为默认"}
            </Button>
          ))}

        {isCurrentDefault ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-[56px] px-2 text-sm leading-none text-secondary border-secondary opacity-50 cursor-not-allowed hover:bg-background hover:text-secondary"
            aria-disabled="true"
            title="当前地址已设置此NFT为默认关联NFT"
            onClick={() => toast.error("当前地址已设置此NFT为默认关联NFT")}
          >
            转让
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-9 w-[56px] px-2 text-sm leading-none text-secondary border-secondary" asChild>
            <Link href={`/group/transfer?tokenId=${groupId.toString()}`}>转让</Link>
          </Button>
        )}
      </div>
    );
  };

  const sortedGroups = useMemo(() => {
    if (!hasDefaultGroup) {
      return myGroups;
    }

    return [...myGroups].sort((a, b) => {
      if (a.tokenId === defaultGroupId) return -1;
      if (b.tokenId === defaultGroupId) return 1;
      return 0;
    });
  }, [defaultGroupId, hasDefaultGroup, myGroups]);

  useEffect(() => {
    const currentTxHash = setDefaultHash;
    if (
      pendingDefaultAction?.type !== "set" ||
      !isConfirmedSetDefault ||
      !currentTxHash ||
      currentTxHash === lastProcessedSetDefaultHash
    ) {
      return;
    }

    toast.success("默认NFT设置成功");
    void refetchDefaultGroup();
    void invalidateGroupDefaultsQueries(queryClient);
    setLastProcessedSetDefaultHash(currentTxHash);
    setPendingDefaultAction(null);
  }, [
    isConfirmedSetDefault,
    lastProcessedSetDefaultHash,
    pendingDefaultAction,
    queryClient,
    refetchDefaultGroup,
    setDefaultHash,
  ]);

  useEffect(() => {
    const currentTxHash = clearDefaultHash;
    if (
      pendingDefaultAction?.type !== "clear" ||
      !isConfirmedClearDefault ||
      !currentTxHash ||
      currentTxHash === lastProcessedClearDefaultHash
    ) {
      return;
    }

    toast.success("默认NFT已取消");
    void refetchDefaultGroup();
    void invalidateGroupDefaultsQueries(queryClient);
    setLastProcessedClearDefaultHash(currentTxHash);
    setPendingDefaultAction(null);
  }, [
    clearDefaultHash,
    isConfirmedClearDefault,
    lastProcessedClearDefaultHash,
    pendingDefaultAction,
    queryClient,
    refetchDefaultGroup,
  ]);

  useEffect(() => {
    if (setDefaultError || clearDefaultError) {
      setPendingDefaultAction(null);
    }
  }, [clearDefaultError, setDefaultError]);

  const handleSetDefault = async (groupId: bigint) => {
    setPendingDefaultAction({
      type: "set",
      tokenId: groupId.toString(),
    });

    try {
      await setDefaultGroupId(groupId);
    } catch (error) {
      console.error("set default group failed:", error);
      setPendingDefaultAction(null);
    }
  };

  const handleClearDefault = async (groupId: bigint) => {
    setPendingDefaultAction({
      type: "clear",
      tokenId: groupId.toString(),
    });

    try {
      await clearDefaultGroupId();
    } catch (error) {
      console.error("clear default group failed:", error);
      setPendingDefaultAction(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center p-4 mt-4">
        <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 mt-4">
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>加载 LOVE20 NFT 数据失败: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4">
      <div className="bg-gray-100 rounded-lg p-3 mb-4 space-y-2">
        <div className="text-sm text-gray-600">
          社区共铸造 NFT：
          <span className="font-medium text-gray-800 ml-1">
            {totalSupply !== undefined ? totalSupply.toString() : "..."} 个
          </span>
        </div>
        <div className="text-sm text-gray-600">
          累计销毁 {FIRST_TOKEN_SYMBOL} 代币：
          <span className="font-medium text-gray-800 ml-1">
            {totalBurnedForMint !== undefined ? formatTokenAmount(totalBurnedForMint) : "..."}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <LeftTitle title="我的NFT" />
        <Link href="/group/mint" className="text-sm text-secondary hover:underline">
          铸造NFT &gt;&gt;
        </Link>
      </div>

      <div className="mb-4">
        {balance > 3 && (
          <>
            <span className="text-gray-500 mr-1">数量:</span>
            <span className="font-mono text-secondary">{balance.toString()}</span>
          </>
        )}
      </div>

      {canManageDefaultGroup && (
        <div className="text-xs text-gray-500 mb-3">
          LOVE20 NFT
          是LOVE20生态的身份凭证，既可作为链上社群的唯一凭证，又可作为个人的身份凭证。个人可将自己的钱包地址设置一个默认NFT，以用于转账、群聊等应用场景下的默认身份。
        </div>
      )}
      {isGroupDefaultsEnabled && !isOnTargetChain && (
        <div className="text-xs text-amber-600 mb-3">切换到目标网络后才可设置默认NFT。</div>
      )}

      {myGroups.length === 0 ? (
        <div className="text-center text-sm text-greyscale-500 p-8">
          <div className="mb-8">您还没有LOVE20 NFT</div>
          <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
            <Link href="/group/mint">去铸造NFT &gt;&gt;</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-[64px] px-2 text-left">ID</th>
                <th className="px-2 text-left">名称</th>
                <th className="w-[160px] px-1 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => {
                const isCurrentDefault = hasDefaultGroup && defaultGroupId === group.tokenId;

                return (
                  <tr
                    key={group.tokenId.toString()}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${isCurrentDefault ? "bg-secondary/5" : ""}`}
                  >
                    <td className="w-[64px] px-2 font-mono text-secondary">{group.tokenId.toString()}</td>
                    <td className="px-2">
                      <div className="flex flex-col gap-1">
                        <span className={`font-medium break-all ${isCurrentDefault ? "text-secondary" : ""}`}>
                          {group.groupName}
                        </span>
                        {isCurrentDefault && (
                          <span className="inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full bg-secondary text-white">
                            默认
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="w-[160px] px-1">{renderGroupActions(group.tokenId)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
