'use client';

import { useState, useContext, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Header from '@/src/components/Header';
import { TokenContext } from '@/src/contexts/TokenContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddFactory } from '@/src/hooks/extension/base/contracts';
import { useCanSubmit } from '@/src/hooks/contracts/useLOVE20Submit';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import toast from 'react-hot-toast';
import { isAddress } from 'viem';

export default function AddFactory() {
  const context = useContext(TokenContext);
  const tokenAddress = context?.token?.address || ('' as `0x${string}`);
  const { address: account } = useAccount();
  const [factoryAddress, setFactoryAddress] = useState<string>('');

  // 检查当前用户是否有推举权
  const {
    canSubmit,
    isPending: isCheckingPermission,
    error: permissionError,
  } = useCanSubmit(tokenAddress, account || ('0x0' as `0x${string}`));

  const { addFactory, isPending, isConfirming, isConfirmed, writeError, hash } = useAddFactory();

  // 监听交易确认状态
  useEffect(() => {
    if (isConfirmed) {
      toast.success('添加工厂成功！');
      // 清空输入
      setFactoryAddress('');
    }
  }, [isConfirmed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!factoryAddress) {
      toast.error('请输入工厂合约地址');
      return;
    }

    if (!isAddress(factoryAddress)) {
      toast.error('请输入有效的合约地址');
      return;
    }

    try {
      await addFactory(tokenAddress, factoryAddress as `0x${string}`);
      toast.success('添加工厂提交成功！');
    } catch (error: any) {
      console.error('添加工厂失败:', error);
      toast.error(error?.message || '添加工厂失败');
    }
  };

  return (
    <>
      <Header title="添加扩展协议工厂" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>添加扩展协议工厂</CardTitle>
            <CardDescription>添加一个新的扩展协议工厂地址到当前代币</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 权限检查中 */}
            {isCheckingPermission ? (
              <div className="flex justify-center items-center py-8">
                <LoadingIcon />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 没有权限的提示 */}
                {!canSubmit && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">当前地址没有推举权，不能添加扩展协议工厂</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="factoryAddress">工厂合约地址</Label>
                  <Input
                    id="factoryAddress"
                    type="text"
                    placeholder="0x..."
                    value={factoryAddress}
                    onChange={(e) => setFactoryAddress(e.target.value)}
                    disabled={!canSubmit || isPending || isConfirming}
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
                  disabled={!canSubmit || isPending || isConfirming || !factoryAddress}
                >
                  {isPending || isConfirming ? '处理中...' : '添加工厂'}
                </Button>

                <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-4 w-full">
                  <p className="mb-1">说明：</p>
                  <p>
                    有效治理票数 ≥ 总治理票的{Number(process.env.NEXT_PUBLIC_SUBMIT_MIN_PER_THOUSAND) / 10}
                    %，才能添加扩展协议工厂；
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
