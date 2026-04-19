"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowRight, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import _GroupServiceSetRecipients from "@/src/components/Extension/Plugins/GroupService/_GroupServiceSetRecipients";
import { useCurrentRound } from "@/src/hooks/contracts/useLOVE20Verify";
import { useExtensionParams } from "@/src/hooks/extension/plugins/group/composite/useExtensionParams";
import { useRecipients } from "@/src/hooks/extension/plugins/group-service/contracts/useGroupRecipients";
import { invalidateGroupRecipientsQueries } from "@/src/hooks/extension/plugins/group-service/contracts/groupRecipientsQueryUtils";

interface GroupSetRecipientsTriggerProps {
  actionId: bigint;
  actionTitle: string;
  extensionAddress: `0x${string}`;
  groupId: bigint;
  groupName?: string;
  variant?: "card" | "button";
}

const _GroupSetRecipientsTrigger: React.FC<GroupSetRecipientsTriggerProps> = ({
  actionId,
  actionTitle,
  extensionAddress,
  groupId,
  groupName,
  variant = "card",
}) => {
  const { address: account } = useAccount();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { currentRound, isPending: isRoundPending } = useCurrentRound();
  const { tokenAddress, isPending: isParamsPending } = useExtensionParams(extensionAddress);
  const {
    addrs,
    ratios,
    remarks,
    isPending: isRecipientsPending,
  } = useRecipients(account as `0x${string}` | undefined, tokenAddress, actionId, groupId, currentRound);

  const isReady = !!account && !!tokenAddress && currentRound !== undefined;
  const isLoading = isRoundPending || isParamsPending || isRecipientsPending;

  const handleOpen = () => {
    if (!account) {
      toast.error("请先连接钱包");
      return;
    }

    if (!isReady) {
      toast.error("激励分配信息加载中，请稍后重试");
      return;
    }

    setOpen(true);
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleOpen}
          disabled={!isReady && isLoading}
        >
          <Coins className="w-4 h-4 mr-2" />
          设置激励分配
        </Button>
      ) : (
        <div
          onClick={handleOpen}
          className={`flex items-center justify-between py-3 px-4 border rounded-lg transition-all group ${
            isReady
              ? "border-greyscale-200 hover:border-secondary hover:bg-secondary/5 cursor-pointer"
              : "border-greyscale-200 bg-gray-50 cursor-not-allowed opacity-70"
          }`}
        >
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-secondary" />
            <div>
              <div className="text-base font-medium">设置激励分配</div>
              <div className="text-sm text-gray-500">
                {isLoading ? "正在加载当前配置..." : "将自己本行动产生的链群服务激励进行二次分配"}
              </div>
            </div>
          </div>
          <ArrowRight
            className={`w-5 h-5 ${
              isReady ? "text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1" : "text-greyscale-300"
            } transition-all`}
          />
        </div>
      )}

      <_GroupServiceSetRecipients
        extensionAddress={extensionAddress}
        groupActionTokenAddress={tokenAddress}
        actionId={actionId}
        actionTitle={actionTitle}
        groupId={groupId}
        groupName={groupName}
        currentAddrs={addrs}
        currentRatios={ratios}
        currentRemarks={remarks}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          toast.success("激励分配已更新");
          invalidateGroupRecipientsQueries(queryClient);
        }}
      />
    </>
  );
};

export default _GroupSetRecipientsTrigger;
