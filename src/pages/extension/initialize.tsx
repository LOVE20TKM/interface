'use client';

import { useState, useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitializeExtension } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { clearCachedExtensionInfo } from '@/src/hooks/composite/useActionsExtensionInfo';
import toast from 'react-hot-toast';
import { isAddress } from 'viem';

export default function InitializeExtension() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  const [extensionAddress, setExtensionAddress] = useState<string>('');
  const [actionId, setActionId] = useState<string>('');

  const { initializeExtension, isPending, isConfirming, isConfirmed, writeError, hash } = useInitializeExtension();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!extensionAddress) {
      toast.error('请输入扩展合约地址');
      return;
    }

    if (!actionId) {
      toast.error('请输入行动ID');
      return;
    }

    if (!isAddress(extensionAddress)) {
      toast.error('请输入有效的扩展合约地址');
      return;
    }

    if (!tokenAddress) {
      toast.error('当前未选择代币');
      return;
    }

    // 验证 actionId 是否为有效数字
    const actionIdNum = parseInt(actionId);
    if (isNaN(actionIdNum) || actionIdNum < 0) {
      toast.error('请输入有效的行动ID（非负整数）');
      return;
    }

    try {
      await initializeExtension(extensionAddress as `0x${string}`, tokenAddress, BigInt(actionIdNum));

      // 清除该行动的缓存，以便重新查询最新的扩展信息
      clearCachedExtensionInfo(tokenAddress, BigInt(actionIdNum));
      console.log(`✅ 已清除 ActionId ${actionIdNum} 的扩展信息缓存`);

      toast.success('初始化扩展提交成功！');
      // 清空输入
      setExtensionAddress('');
      setActionId('');

      // 2秒钟后，跳转到 /extension/center/
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/extension/center`;
      }, 2000);
    } catch (error: any) {
      console.error('初始化扩展失败:', error);
      toast.error(error?.message || '初始化扩展失败');
    }
  };

  return (
    <>
      <Header title="初始化扩展" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>初始化扩展合约</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="extensionAddress">扩展合约地址</Label>
                <Input
                  id="extensionAddress"
                  type="text"
                  placeholder="0x..."
                  value={extensionAddress}
                  onChange={(e) => setExtensionAddress(e.target.value)}
                  disabled={isPending || isConfirming}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionId">行动ID</Label>
                <Input
                  id="actionId"
                  type="number"
                  placeholder="输入行动ID"
                  value={actionId}
                  onChange={(e) => setActionId(e.target.value)}
                  disabled={isPending || isConfirming}
                  min="0"
                />
              </div>

              {writeError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">错误: {writeError.message}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isConfirming || !extensionAddress || !actionId}
              >
                {isPending || isConfirming ? '处理中...' : '初始化扩展'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
