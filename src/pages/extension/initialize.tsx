'use client';

import { useState, useContext } from 'react';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterExtension } from '@/src/hooks/extension/base/contracts';
import { clearContractInfoCache } from '@/src/hooks/extension/base/composite/useExtensionBaseData';
import toast from 'react-hot-toast';
import { isAddress } from 'viem';

export default function InitializeExtension() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);

  const [extensionAddress, setExtensionAddress] = useState<string>('');

  const { registerExtension, isPending, isConfirming, isConfirmed, writeError, hash } = useRegisterExtension();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!extensionAddress) {
      toast.error('请输入扩展合约地址');
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

    try {
      // 注意：新版本中 registerExtension 不需要参数
      await registerExtension();

      toast.success('注册扩展提交成功！');
      // 清空输入
      setExtensionAddress('');

      // 2秒钟后，跳转到 /extension/actions
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/extension/actions`;
      }, 2000);
    } catch (error: any) {
      console.error('注册扩展失败:', error);
      toast.error(error?.message || '注册扩展失败');
    }
  };

  return (
    <>
      <Header title="初始化扩展" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>注册扩展合约（已废弃）</CardTitle>
            <CardDescription>
              ⚠️ 此功能已废弃，extension 会在第一个用户 join 时自动注册到 center
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 警告信息 */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-yellow-800">⚠️ 重要提示：</p>
              <p className="text-sm text-yellow-700">
                在新版扩展协议中，扩展会在第一个用户 join 行动时自动完成初始化和注册到 center，
                <strong>无需手动调用此页面的功能</strong>。
              </p>
              <p className="text-sm text-yellow-700">
                此页面保留仅用于特殊情况下的手动注册。正常情况下，请直接让用户 join 即可。
              </p>
            </div>

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
                <p className="text-xs text-greyscale-500">
                  注意：registerExtension 会从 extension 合约自动读取 tokenAddress 和 actionId
                </p>
              </div>

              {writeError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">错误: {writeError.message}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isConfirming || !extensionAddress}
              >
                {isPending || isConfirming ? '处理中...' : '手动注册扩展（不推荐）'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
