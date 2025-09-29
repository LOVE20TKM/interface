import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { isAddress } from 'viem';

// 导入格式化函数
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 导入hooks
import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import { useGovData } from '@/src/hooks/contracts/useLOVE20RoundViewer';

// 导入组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import Header from '@/src/components/Header';
import { Copy, Check } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';

// 导入contexts
import { TokenContext } from '@/src/contexts/TokenContext';

const GovQueryPage = () => {
  const router = useRouter();
  const { symbol } = router.query;
  const { token: currentToken } = useContext(TokenContext) || {};

  const [inputAddress, setInputAddress] = useState<string>('');
  const [queryAddress, setQueryAddress] = useState<`0x${string}` | null>(null);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [copiedVotes, setCopiedVotes] = useState<boolean>(false);
  const [copiedPercentage, setCopiedPercentage] = useState<boolean>(false);

  // 获取指定地址的治理票数 - 使用封装好的hook
  const {
    validGovVotes,
    isPending: isPendingValidGovVotes,
    error: errorValidGovVotes,
  } = useValidGovVotes(
    currentToken?.address && queryAddress && hasQueried
      ? (currentToken.address as `0x${string}`)
      : '0x0000000000000000000000000000000000000000',
    queryAddress && hasQueried ? queryAddress : '0x0000000000000000000000000000000000000000',
  );

  // 获取总的治理票数
  const {
    govData,
    isPending: isPendingGovData,
    error: errorGovData,
  } = useGovData(currentToken?.address as `0x${string}`);

  // 计算治理票占比
  const governancePercentage =
    govData?.govVotes && validGovVotes && hasQueried && queryAddress
      ? (Number(validGovVotes) / Number(govData.govVotes)) * 100
      : 0;

  // 格式化百分比为固定2位小数
  const formatPercentageFixed2 = (value: number): string => {
    return value.toFixed(2) + '%';
  };

  // 处理查询
  const handleQuery = () => {
    console.log('handleQuery called with:', inputAddress);

    if (!inputAddress.trim()) {
      alert('请输入有效的地址');
      return;
    }

    if (!isAddress(inputAddress)) {
      alert('请输入有效的以太坊地址格式');
      return;
    }

    console.log('Setting query address:', inputAddress);
    setQueryAddress(inputAddress as `0x${string}`);
    setHasQueried(true);
  };

  // 重置查询
  const handleReset = () => {
    setInputAddress('');
    setQueryAddress(null);
    setHasQueried(false);
  };

  // 返回治理首页
  const handleGoBack = () => {
    router.push(symbol ? `/gov?symbol=${symbol}` : '/gov');
  };

  // 复制处理函数
  const handleCopyVotes = (text: string, result: boolean) => {
    if (result) {
      setCopiedVotes(true);
      toast.success('治理票数已复制');
      setTimeout(() => setCopiedVotes(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleCopyPercentage = (text: string, result: boolean) => {
    if (result) {
      setCopiedPercentage(true);
      toast.success('占比已复制');
      setTimeout(() => setCopiedPercentage(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  if (!currentToken) {
    return (
      <>
        <Header title="地址治理票查询" />
        <div className="flex justify-center items-center h-screen">
          <LoadingIcon />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="地址治理票查询" showBackButton={true} />
      <main className="flex-grow px-4">
        <div className="mt-4">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">治理票查询</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 地址输入区域 */}
                <div className="space-y-2">
                  <Label htmlFor="address-input">输入要查询的地址:</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="address-input"
                      type="text"
                      placeholder="0x..."
                      value={inputAddress}
                      onChange={(e) => setInputAddress(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleQuery();
                        }
                      }}
                    />
                    <Button
                      onClick={handleQuery}
                      disabled={!inputAddress.trim() || (hasQueried && (isPendingValidGovVotes || isPendingGovData))}
                    >
                      {hasQueried && (isPendingValidGovVotes || isPendingGovData) ? '查询中...' : '查询'}
                    </Button>
                    {hasQueried && (
                      <Button variant="outline" onClick={handleReset}>
                        重置
                      </Button>
                    )}
                  </div>
                </div>

                {/* 错误显示 */}
                {(errorValidGovVotes || errorGovData) && hasQueried && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    查询出错：{errorValidGovVotes?.message || errorGovData?.message || '请检查地址格式或稍后重试'}
                  </div>
                )}

                {/* 查询结果显示 */}
                {hasQueried && queryAddress && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <span className="font-medium">查询地址:</span>
                      <div className="font-mono text-xs mt-1 break-all">{queryAddress}</div>
                    </div>

                    {isPendingValidGovVotes || isPendingGovData ? (
                      <div className="flex justify-center p-8">
                        <div className="text-center">
                          <LoadingIcon />
                          <p className="text-gray-500 mt-2">正在查询中...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 治理票数 */}
                        <div className="border rounded-lg p-6 bg-white">
                          <div className="text-sm text-gray-600 mb-3">该地址治理票数</div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatTokenAmount(validGovVotes || BigInt(0))}
                            </div>
                            {/* @ts-ignore */}
                            <CopyToClipboard
                              text={formatTokenAmount(validGovVotes || BigInt(0))}
                              onCopy={handleCopyVotes}
                            >
                              <button
                                className="flex items-center justify-center p-2 rounded hover:bg-gray-100 focus:outline-none"
                                aria-label="复制治理票数"
                              >
                                {copiedVotes ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                            </CopyToClipboard>
                          </div>
                        </div>

                        {/* 治理票占比 */}
                        <div className="border rounded-lg p-6 bg-white">
                          <div className="text-sm text-gray-600 mb-3">占总治理票比例</div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatPercentageFixed2(governancePercentage)}
                            </div>
                            {/* @ts-ignore */}
                            <CopyToClipboard
                              text={formatPercentageFixed2(governancePercentage)}
                              onCopy={handleCopyPercentage}
                            >
                              <button
                                className="flex items-center justify-center p-2 rounded hover:bg-gray-100 focus:outline-none"
                                aria-label="复制占比"
                              >
                                {copiedPercentage ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                            </CopyToClipboard>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 说明信息 */}
                    {hasQueried && !isPendingValidGovVotes && !isPendingGovData && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">备注：</div>
                        <div className="text-xs text-gray-500">
                          票数为有效治理票；如果已经申请解除治理质押，则治理票为0
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default GovQueryPage;
