// pages/extension/group_trial.tsx
// 体验列表页面

import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useExtensionContractInfo } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import { useContractError } from '@/src/errors/useContractError';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AlertBox from '@/src/components/Common/AlertBox';
import Header from '@/src/components/Header';
import _GroupTrial from '@/src/components/Extension/Plugins/Group/_GroupTrial';
import LeftTitle from '@/src/components/Common/LeftTitle';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';

const GroupTrialPage: React.FC = () => {
  const router = useRouter();
  const { groupId, actionId: actionIdParam } = router.query;
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 从 query 获取必要参数
  const actionId = actionIdParam ? BigInt(actionIdParam as string) : undefined;
  const groupIdBigInt = groupId ? BigInt(groupId as string) : undefined;

  // 获取行动信息
  const {
    actionInfo,
    isPending: isPendingAction,
    error: errorAction,
  } = useActionInfo(token?.address as `0x${string}`, actionId || BigInt(0));

  // 获取扩展合约地址
  const {
    contractInfo,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionContractInfo({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
  });
  const extensionAddress = contractInfo?.extension;

  // 错误处理
  const { handleError } = useContractError();
  React.useEffect(() => {
    if (errorAction) handleError(errorAction);
    if (errorExtension) handleError(errorExtension);
  }, [errorAction, errorExtension, handleError]);

  // 参数校验
  if (!groupIdBigInt || !actionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="缺少必要参数：需要 actionId 和 groupId" />
      </div>
    );
  }

  if (isPendingAction || isPendingExtension) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center py-12">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载链群信息...</p>
        </div>
      </div>
    );
  }

  if (!actionInfo || !extensionAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertBox type="error" message="未找到行动或扩展信息" />
      </div>
    );
  }

  // 复制分享链接到剪贴板
  const handleCopyShareLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ? '/' + process.env.NEXT_PUBLIC_BASE_PATH : '';
      const shareUrl = `${baseUrl}${basePath}/acting/join/?tab=join&groupId=${groupId}&id=${actionId}&provider=${account}&symbol=${
        token?.symbol || ''
      }`;

      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    }
  };

  return (
    <>
      <Header title="体验列表" showBackButton={true} />
      <main className="flex-grow">
        <div className="px-4 pt-0 pb-3">
          <div className="my-4 flex items-center justify-between">
            <LeftTitle title="我设置的体验地址" />

            <Button
              onClick={handleCopyShareLink}
              size="sm"
              variant="outline"
              className="px-4 py-2 text-sm text-secondary border border-secondary rounded hover:bg-secondary/5 transition-colors"
            >
              复制分享链接
            </Button>
          </div>
          <_GroupTrial extensionAddress={extensionAddress} groupId={groupIdBigInt} actionId={actionId} />
        </div>
      </main>
    </>
  );
};

export default GroupTrialPage;
