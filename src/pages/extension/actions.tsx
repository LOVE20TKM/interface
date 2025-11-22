'use client';

import { useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useExtensionActions } from '@/src/hooks/extension/base/composite/useExtensionActions';
import ExtensionActionsList from '@/src/components/Extension/Base/Center/ExtensionActionsList';

/**
 * 扩展行动列表页面
 * 
 * 显示当前代币的所有扩展行动
 */
export default function ExtensionActionsPage() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  // 获取扩展行动数据
  const { extensionActionsData, isPending, error } = useExtensionActions(tokenAddress);

  return (
    <>
      <Header title="扩展行动" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <ExtensionActionsList
          tokenAddress={tokenAddress}
          extensionActionsData={extensionActionsData}
          isPending={isPending}
        />
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            加载失败: {error.message}
          </div>
        )}
      </main>
    </>
  );
}

