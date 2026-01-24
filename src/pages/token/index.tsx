'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import { useAccount, useBlockNumber } from 'wagmi';
import { formatUnits as viemFormatUnits } from 'viem';
import Link from 'next/link';

// ui
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HandCoins, TableOfContents, Pickaxe, Blocks, BarChart2, Users, Rocket, Info } from 'lucide-react';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

// my hooks
import { useTokenStatistics } from '@/src/hooks/contracts/useLOVE20TokenViewer';
import { useLaunchInfo } from '@/src/hooks/contracts/useLOVE20Launch';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useUSDTPairTokenBalance } from '@/src/hooks/composite/useUSDTPairTokenBalance';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage } from '@/src/lib/format';

// 简单的字段组件
function Field({
  label,
  value,
  percentage,
  font = '',
}: {
  label: string;
  value: string;
  percentage?: string;
  font?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`text-sm text-muted-foreground ${font}`}>{label}</div>
      <div className={`text-sm font-medium break-all text-secondary ${font}`}>
        {value}
        {percentage && <span className="text-sm text-muted-foreground ml-1">({percentage})</span>}
      </div>
    </div>
  );
}

// 带信息图标的字段组件
function FieldWithInfo({
  label,
  value,
  percentage,
  font,
  infoTitle,
  infoContent,
}: {
  label: string;
  value: string;
  percentage?: string;
  font?: string;
  infoTitle: string;
  infoContent: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-1 text-sm text-muted-foreground ${font}`}>
        <span>{label}</span>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center p-0.5 rounded hover:bg-gray-100 transition-colors"
              aria-label={`查看${infoTitle}`}
            >
              <Info className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{infoTitle}</DialogTitle>
            </DialogHeader>
            <div className="pt-2 pb-4 text-sm text-gray-700">{infoContent}</div>
          </DialogContent>
        </Dialog>
      </div>
      <div className={`text-sm font-medium break-all text-secondary ${font}`}>
        {value}
        {percentage && <span className="text-sm text-muted-foreground ml-1">({percentage})</span>}
      </div>
    </div>
  );
}

// 地址展示卡片
function AddressItem({
  name,
  address,
  nameClassName = 'text-base',
}: {
  name: string;
  address?: string;
  nameClassName?: string;
}) {
  return (
    <div className="rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <div className={nameClassName}>{name}</div>
        <AddressWithCopyButton address={address as `0x${string}`} />
      </div>
    </div>
  );
}

// 数字格式化（带千分位）
function formatBigIntWithCommas(v?: bigint) {
  if (v === undefined || v === null) return '0';
  const s = v.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 金额格式化：使用当前 token 的 decimals
function formatAmount(value?: bigint, decimals?: number, symbol?: string) {
  if (value === undefined || value === null) return '0';
  const d = typeof decimals === 'number' ? decimals : 18;
  const str = viemFormatUnits(value, d);
  // 默认按 0/2/4 的常用小数展示，并尽量短
  const num = Number(str);
  let formatted: string;
  if (num === 0) formatted = '0';
  else if (Math.abs(num) >= 1000) formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  else if (Math.abs(num) >= 10) formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  else formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(num);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

const TokenPage = () => {
  const { isConnected } = useAccount();
  const { data: currentBlockNumber } = useBlockNumber();
  const { token: currentToken } = useContext(TokenContext) || {};
  const { currentRound, isPending: isPendingCurrentRound } = useCurrentRound();

  const launchEnded = !!currentToken && currentToken.hasEnded;
  const {
    tokenStatistics,
    error: errorTokenStatistics,
    isPending: isPendingTokenStatistics,
  } = useTokenStatistics(
    (currentToken?.address as `0x${string}`) || '0x0000000000000000000000000000000000000000',
    launchEnded,
  );

  const {
    launchInfo,
    error: errorLaunchInfo,
    isPending: isPendingLaunchInfo,
  } = useLaunchInfo((currentToken?.address as `0x${string}`) || '0x0000000000000000000000000000000000000000');

  // 获取 USDT-Token pair 中当前代币的质押量
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}` | undefined;
  const { tokenBalanceInUSDTPair, isPending: isPendingUSDTPair } = useUSDTPairTokenBalance(
    currentToken?.address as `0x${string}` | undefined,
    usdtAddress,
    launchEnded, // 只有在发射完成后才查询
  );

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorTokenStatistics) handleContractError(errorTokenStatistics, 'roundViewer');
    if (errorLaunchInfo) handleContractError(errorLaunchInfo, 'launch');
  }, [errorTokenStatistics, errorLaunchInfo]);

  const decimals = currentToken?.decimals ?? 18;
  const parentSymbol = currentToken?.parentTokenSymbol ?? '';

  // 代币统计（变量命名与 TokenStats 保持一致）
  const maxSupply = BigInt(process.env.NEXT_PUBLIC_MAX_SUPPLY ?? 0);
  const totalSupply = launchEnded
    ? tokenStatistics?.totalSupply ?? BigInt(0)
    : BigInt(process.env.NEXT_PUBLIC_LAUNCH_AMOUNT ?? 0);
  const reservedAvailable = tokenStatistics?.reservedAvailable ?? BigInt(0);
  const rewardAvailable = tokenStatistics?.rewardAvailable ?? BigInt(0);
  const stakedTokenAmountForSt = tokenStatistics?.stakedTokenAmountForSt ?? BigInt(0);
  const joinedTokenAmount = tokenStatistics?.joinedTokenAmount ?? BigInt(0);
  const tokenAmountForSl = tokenStatistics?.tokenAmountForSl ?? BigInt(0);
  const parentPool = tokenStatistics?.parentPool ?? BigInt(0);
  const finishedRounds = tokenStatistics?.finishedRounds ?? BigInt(0);
  const actionsCount = tokenStatistics?.actionsCount ?? BigInt(0);
  const joiningActionsCount = tokenStatistics?.joiningActionsCount ?? BigInt(0);
  const childTokensCount = tokenStatistics?.childTokensCount ?? BigInt(0);
  const launchingChildTokensCount = tokenStatistics?.launchingChildTokensCount ?? BigInt(0);
  const launchedChildTokensCount = tokenStatistics?.launchedChildTokensCount ?? BigInt(0);
  const unminted = maxSupply > totalSupply ? maxSupply - totalSupply : BigInt(0);
  const usdtPairBalance = tokenBalanceInUSDTPair ?? BigInt(0);
  const otherBalance = totalSupply - joinedTokenAmount - tokenAmountForSl - stakedTokenAmountForSt - usdtPairBalance;
  // 计算 TVL：流动性质押*2 + 加速激励质押 + U池*2 + 行动参与
  const tvl = tokenAmountForSl * BigInt(2) + stakedTokenAmountForSt + usdtPairBalance * BigInt(2) + joinedTokenAmount;

  // 发射区块
  const startBlock = launchInfo?.startBlock;
  const endBlock = launchInfo?.endBlock;

  // 常量合约地址（来自环境变量）
  const constantsAddresses = {
    TokenFactory: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TOKEN_FACTORY,
    Launch: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LAUNCH,
    Stake: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE,
    Submit: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT,
    Vote: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE,
    Join: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN,
    Verify: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY,
    Mint: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MINT,
    Random: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_RANDOM,
    UniswapV2Factory: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY,
    UniswapV2Router02: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER,
    TokenViewer: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER,
    RoundViewer: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER,
    MintViewer: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_MINTVIEWER,
    Hub: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_HUB,
    Group: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP,
    ExtensionCenter: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER,
    ExtensionGroupManager: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER,
    ExtensionGroupJoin: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN,
    ExtensionGroupVerify: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY,
    ExtensionGroupActionFactory: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY,
    ExtensionGroupServiceFactory: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY,
    ExtensionLpFactory: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY,
  } as const;

  // 当前代币相关地址
  const currentAddresses = {
    token: currentToken?.address,
    parent: currentToken?.parentTokenAddress,
    usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`,
    sl: currentToken?.slTokenAddress,
    st: currentToken?.stTokenAddress,
    pair: currentToken?.uniswapV2PairAddress,
  } as const;

  if ((launchEnded && isPendingTokenStatistics) || isPendingLaunchInfo) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <>
      <Header title="代币首页" />
      <main className="flex-grow">
        {!isConnected ? (
          <div className="flex flex-col items-center p-4 mt-4">
            <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
          </div>
        ) : !currentToken ? (
          <LoadingIcon />
        ) : (
          <div className="p-4 md:p-6">
            <header className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight font-mono">{currentToken.symbol}</h1>
                    <Button variant="outline" size="sm" className="text-secondary border-secondary -mt-2" asChild>
                      <Link href={`/token/intro?symbol=${currentToken.symbol}`}>代币简介 &gt;&gt;</Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Pickaxe className="h-4 w-4" />
                      已铸造：
                      <span className="font-mono">{`${formatAmount(totalSupply, decimals)}`}</span>
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="inline-flex items-center gap-1">{`Decimals: ${decimals}`}</span>
                  </div>
                </div>
              </div>
            </header>

            <Tabs defaultValue="stats" className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats" className="gap-2">
                  <BarChart2 className="h-4 w-4" />
                  统计
                </TabsTrigger>
                <TabsTrigger value="contracts" className="gap-2">
                  <Blocks className="h-4 w-4" />
                  合约地址
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <TableOfContents className="h-5 w-5 text-primary" />
                            基本信息
                          </div>
                          {/* 当存在父币且父币不是第一个父币时显示返回父币链接 */}
                          {currentToken.parentTokenAddress &&
                            currentToken.parentTokenAddress !== '0x0000000000000000000000000000000000000000' &&
                            currentToken.parentTokenSymbol &&
                            currentToken.parentTokenSymbol !== process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL && (
                              <Link
                                href={`/acting/?symbol=${currentToken.parentTokenSymbol}`}
                                className="text-sm text-secondary hover:text-secondary/80 transition-colors"
                              >
                                返回父币 &gt;&gt;
                              </Link>
                            )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 grid-cols-2 px-4 pt-2 pb-4">
                        <Field label="Symbol" value={currentToken.symbol} font="font-mono" />
                        <Field label="Name" value={currentToken.name} font="font-mono" />
                        <Field label="父币 Symbol" value={parentSymbol} font="font-mono" />
                        <Field label="父币 Name" value={currentToken.parentTokenName} font="font-mono" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Pickaxe className="h-5 w-5 text-primary" />
                          铸造情况
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                          <Field label="最大铸造量" value={formatAmount(maxSupply, decimals)} />
                          <Field
                            label="已铸造（总流通量）"
                            value={formatAmount(totalSupply, decimals)}
                            percentage={formatPercentage((Number(totalSupply) / Number(maxSupply)) * 100)}
                          />
                          <Field
                            label="未铸造量"
                            value={formatAmount(unminted, decimals)}
                            percentage={formatPercentage((Number(unminted) / Number(maxSupply)) * 100)}
                          />
                          <Field
                            label="未来轮次待铸造量"
                            value={formatAmount(rewardAvailable, decimals)}
                            percentage={formatPercentage((Number(rewardAvailable) / Number(maxSupply)) * 100)}
                          />
                          <Field
                            label="过去轮次已分配未铸造量"
                            value={formatAmount(reservedAvailable, decimals)}
                            percentage={formatPercentage((Number(reservedAvailable) / Number(maxSupply)) * 100)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <HandCoins className="h-5 w-5 text-primary" />
                          已铸代币分布
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                          <FieldWithInfo
                            label="TVL"
                            value={formatAmount(tvl, decimals)}
                            percentage={formatPercentage((Number(tvl) / Number(totalSupply)) * 100)}
                            infoTitle="TVL 计算公式"
                            infoContent={
                              <div className="space-y-2">
                                <p className="font-medium">LOVE20 TVL 计算公式：</p>
                                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                                  <div>TVL = 流动性质押 × 2 + 加速激励质押 + U池 × 2 + 行动参与</div>
                                </div>
                              </div>
                            }
                          />
                          <Field
                            label="行动参与量"
                            value={formatAmount(joinedTokenAmount, decimals)}
                            percentage={formatPercentage((Number(joinedTokenAmount) / Number(totalSupply)) * 100)}
                          />
                          <Field
                            label="流动性质押量"
                            value={formatAmount(tokenAmountForSl, decimals)}
                            percentage={formatPercentage((Number(tokenAmountForSl) / Number(totalSupply)) * 100)}
                          />
                          <Field
                            label="加速激励质押量"
                            value={formatAmount(stakedTokenAmountForSt, decimals)}
                            percentage={formatPercentage((Number(stakedTokenAmountForSt) / Number(totalSupply)) * 100)}
                          />
                          <Field
                            label="U池"
                            value={formatAmount(usdtPairBalance, decimals)}
                            percentage={formatPercentage((Number(usdtPairBalance) / Number(totalSupply)) * 100)}
                          />
                          <Field
                            label="其他"
                            value={formatAmount(otherBalance, decimals)}
                            percentage={formatPercentage((Number(otherBalance) / Number(totalSupply)) * 100)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            公平发射
                          </div>
                          <Link
                            href="/launch"
                            className="text-sm text-secondary hover:text-secondary/80 transition-colors"
                          >
                            查看详情 &gt;&gt;
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 px-4 pt-2 pb-4">
                        <Field label="启动公平发射区块" value={formatBigIntWithCommas(startBlock)} />
                        <Field label="完成公平发射区块" value={formatBigIntWithCommas(endBlock)} />
                        <Field label="托底池父币数量" value={formatAmount(parentPool, decimals, parentSymbol)} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5 text-primary" />
                          治理情况
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 px-4 pt-2 pb-4">
                        <Field label="首次治理轮次" value={String(currentToken.initialStakeRound ?? 0)} />
                        <Field label="已完成轮数" value={formatBigIntWithCommas(finishedRounds)} />
                        <Field label="最新轮次" value={isPendingCurrentRound ? '...' : String(currentRound)} />
                        <Field label="当前区块高度" value={String(currentBlockNumber)} />
                        <Field label="累计发起行动数" value={formatBigIntWithCommas(actionsCount)} />
                        <Field label="进行中的行动数" value={formatBigIntWithCommas(joiningActionsCount)} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pt-4 pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <Blocks className="h-5 w-5 text-primary" />
                            子币情况
                          </div>
                          <div>
                            {currentToken.parentTokenAddress &&
                              currentToken.parentTokenAddress !== '0x0000000000000000000000000000000000000000' &&
                              currentToken.parentTokenSymbol &&
                              currentToken.parentTokenSymbol !== process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL && (
                                <Link
                                  href={`/acting/?symbol=${currentToken.parentTokenSymbol}`}
                                  className="text-sm text-secondary hover:text-secondary/80 transition-colors mr-4"
                                >
                                  返回父币 &gt;&gt;
                                </Link>
                              )}
                            <Link
                              href={`/tokens/children/?symbol=${currentToken.symbol}`}
                              className="text-sm text-secondary hover:text-secondary/80 transition-colors"
                            >
                              子币列表 &gt;&gt;
                            </Link>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 px-4 pt-2 pb-4">
                        <Field label="子币数量" value={formatBigIntWithCommas(childTokensCount)} />
                        <Field label="发射中的子币数量" value={formatBigIntWithCommas(launchingChildTokensCount)} />
                        <Field label="发射完成的子币数量" value={formatBigIntWithCommas(launchedChildTokensCount)} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contracts" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="px-4 pt-4 pb-2">
                      <CardTitle className="text-lg">LOVE20 核心合约地址：</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 pt-2 pb-4">
                      <AddressItem name="TokenFactory" address={constantsAddresses.TokenFactory} />
                      <AddressItem name="Launch" address={constantsAddresses.Launch} />
                      <AddressItem name="Stake" address={constantsAddresses.Stake} />
                      <AddressItem name="Submit" address={constantsAddresses.Submit} />
                      <AddressItem name="Vote" address={constantsAddresses.Vote} />
                      <AddressItem name="Join" address={constantsAddresses.Join} />
                      <AddressItem name="Verify" address={constantsAddresses.Verify} />
                      <AddressItem name="Mint" address={constantsAddresses.Mint} />
                      <AddressItem name="Random" address={constantsAddresses.Random} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 pt-4 pb-2">
                      <CardTitle className="text-lg">{`${currentToken.symbol} 相关代币地址：`}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 pt-2 pb-4">
                      <AddressItem name={`${currentToken.symbol}(当前代币)`} address={currentAddresses.token} />
                      <AddressItem name={`${currentToken.parentTokenSymbol}(父币)`} address={currentAddresses.parent} />
                      <AddressItem
                        name={`${process.env.NEXT_PUBLIC_USDT_SYMBOL}(稳定币)`}
                        address={currentAddresses.usdt}
                      />
                      <AddressItem name="流动性质押凭证SL代币" address={currentAddresses.sl} />
                      <AddressItem name="代币质押凭证ST代币" address={currentAddresses.st} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 pt-4 pb-2">
                      <CardTitle className="text-lg">UniswapV2 合约地址：</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 pt-2 pb-4">
                      <AddressItem name="UniswapV2Factory" address={constantsAddresses.UniswapV2Factory} />
                      <AddressItem name="UniswapV2Pair" address={currentAddresses.pair} />
                      <AddressItem name="UniswapV2Router02" address={constantsAddresses.UniswapV2Router02} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 pt-4 pb-2">
                      <CardTitle className="text-lg">LOVE20 外围合约地址：</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 pt-2 pb-4">
                      <AddressItem name="TokenViewer" address={constantsAddresses.TokenViewer} />
                      <AddressItem name="RoundViewer" address={constantsAddresses.RoundViewer} />
                      <AddressItem name="MintViewer" address={constantsAddresses.MintViewer} />
                      <AddressItem name="Hub" address={constantsAddresses.Hub} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="px-4 pt-4 pb-2">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>LOVE20 生态合约地址：</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 pt-2 pb-4">
                      <AddressItem name="Group" address={constantsAddresses.Group} />
                      <AddressItem name="ExtensionCenter" address={constantsAddresses.ExtensionCenter} />
                      <AddressItem name="ExtensionLpFactory" address={constantsAddresses.ExtensionLpFactory} />
                      <AddressItem name="GroupManager" address={constantsAddresses.ExtensionGroupManager} />
                      <AddressItem name="GroupJoin" address={constantsAddresses.ExtensionGroupJoin} />
                      <AddressItem name="GroupVerify" address={constantsAddresses.ExtensionGroupVerify} />
                      <AddressItem
                        name="ExtensionGroupActionFactory"
                        nameClassName="text-sm"
                        address={constantsAddresses.ExtensionGroupActionFactory}
                      />
                      <AddressItem
                        name="ExtensionGroupServiceFactory"
                        nameClassName="text-sm"
                        address={constantsAddresses.ExtensionGroupServiceFactory}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </>
  );
};

export default TokenPage;
