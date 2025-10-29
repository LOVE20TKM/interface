// components/Action/ActionParticipationStats.tsx
// 行动参与统计组件（自动支持普通行动和扩展行动）

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Coins, CheckCircle2, Rocket } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useActionParticipationData } from '@/src/hooks/composite/useActionParticipationData';
import { formatUnits } from 'viem';

interface ActionParticipationStatsProps {
  tokenAddress: `0x${string}`;
  actionId: bigint;
  tokenDecimals?: number;
  tokenSymbol?: string;

  // 可选：普通行动的 core 数据（用于回退）
  coreData?: {
    participantCount?: bigint;
    totalAmount?: bigint;
    userJoinedAmount?: bigint;
    isJoined?: boolean;
  };

  // 可选：显示配置
  showUserStatus?: boolean;
  className?: string;
}

/**
 * 行动参与统计组件
 *
 * @description
 * 这是一个示例组件，展示如何使用 useActionParticipationData Hook。
 * 它会自动判断是普通行动还是扩展行动，并展示相应的数据。
 *
 * @features
 * - 自动识别行动类型（普通/扩展）
 * - 显示参与统计（人数、金额）
 * - 显示用户参与状态（如果已连接钱包）
 * - 响应式布局
 * - 加载状态处理
 */
export function ActionParticipationStats({
  tokenAddress,
  actionId,
  tokenDecimals = 18,
  tokenSymbol = 'TOKEN',
  coreData,
  showUserStatus = true,
  className = '',
}: ActionParticipationStatsProps) {
  // 获取用户地址
  const { address: account, isConnected } = useAccount();

  // 获取参与数据（自动处理普通行动和扩展行动）
  const {
    isExtensionAction,
    extensionAddress,
    participantCount,
    totalAmount,
    userJoinedAmount,
    isJoined,
    isPending,
    error,
  } = useActionParticipationData(tokenAddress, actionId, showUserStatus && account ? account : undefined, coreData);

  // 格式化金额
  const formatAmount = (amount: bigint | undefined) => {
    if (!amount) return '0';
    try {
      return parseFloat(formatUnits(amount, tokenDecimals)).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    } catch {
      return '0';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">参与统计</CardTitle>

          {/* 行动类型标识 */}
          {!isPending && (
            <Badge variant={isExtensionAction ? 'default' : 'secondary'}>
              {isExtensionAction ? (
                <>
                  <Rocket className="w-3 h-3 mr-1" />
                  扩展行动
                </>
              ) : (
                '普通行动'
              )}
            </Badge>
          )}
        </div>

        {/* 扩展合约地址（仅扩展行动显示） */}
        {isExtensionAction && extensionAddress && (
          <p className="text-xs text-muted-foreground mt-1">
            扩展合约: {extensionAddress.slice(0, 6)}...{extensionAddress.slice(-4)}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 加载状态 */}
        {isPending && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">加载数据失败: {error.message}</div>
        )}

        {/* 数据展示 */}
        {!isPending && !error && (
          <>
            {/* 参与统计 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 参与人数 */}
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">参与人数</p>
                  <p className="text-lg font-semibold truncate">{participantCount?.toString() ?? '0'}</p>
                </div>
              </div>

              {/* 参与总额 */}
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Coins className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">参与总额</p>
                  <p className="text-lg font-semibold truncate">{formatAmount(totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{tokenSymbol}</p>
                </div>
              </div>
            </div>

            {/* 用户参与状态（仅在已连接钱包且 showUserStatus 为 true 时显示） */}
            {showUserStatus && isConnected && account && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">我的参与</p>

                <div className="space-y-3">
                  {/* 参与状态 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">参与状态</span>
                    <div className="flex items-center space-x-1">
                      {isJoined ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">已参与</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">未参与</span>
                      )}
                    </div>
                  </div>

                  {/* 参与金额 */}
                  {isJoined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">参与金额</span>
                      <span className="text-sm font-medium">
                        {formatAmount(userJoinedAmount)} {tokenSymbol}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 简化版：仅显示统计数据
 */
export function ActionParticipationStatsSimple({
  tokenAddress,
  actionId,
  tokenDecimals = 18,
  tokenSymbol = 'TOKEN',
  coreData,
}: Omit<ActionParticipationStatsProps, 'showUserStatus' | 'className'>) {
  const { participantCount, totalAmount, isPending } = useActionParticipationData(
    tokenAddress,
    actionId,
    undefined, // 不传 account，只获取统计数据
    coreData,
  );

  const formatAmount = (amount: bigint | undefined) => {
    if (!amount) return '0';
    try {
      return parseFloat(formatUnits(amount, tokenDecimals)).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    } catch {
      return '0';
    }
  };

  if (isPending) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span>{participantCount?.toString() ?? '0'} 人参与</span>
      </div>
      <div className="flex items-center space-x-1">
        <Coins className="w-4 h-4 text-muted-foreground" />
        <span>
          {formatAmount(totalAmount)} {tokenSymbol}
        </span>
      </div>
    </div>
  );
}
