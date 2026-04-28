import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { normalizeAddressInput, validateAddressInput } from '@/src/lib/addressUtils';

// 导入格式化函数
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 导入hooks
import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
import { useGovData } from '@/src/hooks/contracts/useLOVE20RoundViewer';

// 导入组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import NftOwnerLookup from '@/src/components/Extension/Base/Group/NftOwnerLookup';
import { Copy, Check } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { useNftOwnerLookup } from '@/src/hooks/extension/base/composite/useNftOwnerLookup';

// 导入contexts
import { TokenContext } from '@/src/contexts/TokenContext';

type GovQueryMode = 'address' | 'nftOwner';

const GovQueryPanel = () => {
  const { token: currentToken } = useContext(TokenContext) || {};

  const [queryMode, setQueryMode] = useState<GovQueryMode>('address');
  const [inputAddress, setInputAddress] = useState<string>('');
  const [queryAddress, setQueryAddress] = useState<`0x${string}` | null>(null);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [copiedVotes, setCopiedVotes] = useState<boolean>(false);
  const [copiedPercentage, setCopiedPercentage] = useState<boolean>(false);
  const {
    lookupMode: nftLookupMode,
    setLookupMode: setNftLookupMode,
    lookupValue: nftLookupValue,
    setLookupValue: setNftLookupValue,
    lookupResult: nftLookupResult,
    resetLookup,
  } = useNftOwnerLookup({ enabled: queryMode === 'nftOwner' });

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

  // 处理查询
  const handleQuery = () => {
    if (queryMode === 'nftOwner') {
      if (nftLookupResult?.status !== 'resolved') {
        alert('请先输入并解析有效NFT');
        return;
      }

      setQueryAddress(nftLookupResult.owner);
      setHasQueried(true);
      return;
    }

    if (!inputAddress.trim()) {
      alert('请输入有效的地址');
      return;
    }

    const normalizedAddress = normalizeAddressInput(inputAddress);
    if (validateAddressInput(inputAddress) !== null || !normalizedAddress) {
      alert('请输入有效的地址格式（支持 0x、TH 格式）');
      return;
    }

    setQueryAddress(normalizedAddress as `0x${string}`);
    setHasQueried(true);
  };

  // 重置查询
  const handleReset = () => {
    setInputAddress('');
    resetLookup();
    setQueryAddress(null);
    setHasQueried(false);
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

  const isQuerying = hasQueried && (isPendingValidGovVotes || isPendingGovData);
  const isQueryDisabled =
    queryMode === 'address' ? !inputAddress.trim() || isQuerying : nftLookupResult?.status !== 'resolved' || isQuerying;

  return (
    <div className="mt-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">治理票查询</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs value={queryMode} onValueChange={(value) => setQueryMode(value as GovQueryMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="address">地址</TabsTrigger>
                <TabsTrigger value="nftOwner">NFT持有地址</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              {queryMode === 'address' ? (
                <>
                  <Label htmlFor="address-input">输入要查询的地址:</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="address-input"
                      type="text"
                      placeholder="请输入地址（支持 0x、TH 格式）"
                      value={inputAddress}
                      onChange={(e) => setInputAddress(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleQuery();
                        }
                      }}
                    />
                    <Button onClick={handleQuery} disabled={isQueryDisabled}>
                      {isQuerying ? '查询中...' : '查询'}
                    </Button>
                    {hasQueried && (
                      <Button variant="outline" onClick={handleReset}>
                        重置
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <NftOwnerLookup
                    lookupMode={nftLookupMode}
                    onLookupModeChange={setNftLookupMode}
                    lookupValue={nftLookupValue}
                    onLookupValueChange={setNftLookupValue}
                    lookupResult={nftLookupResult}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleQuery} disabled={isQueryDisabled}>
                      {isQuerying ? '查询中...' : '查询'}
                    </Button>
                    {hasQueried && (
                      <Button variant="outline" onClick={handleReset}>
                        重置
                      </Button>
                    )}
                  </div>
                </>
              )}
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
                  <span className="font-medium">查询目标地址:</span>
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
                      <div className="text-sm text-gray-600 mb-3">治理票数</div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatTokenAmount(validGovVotes || BigInt(0))}
                        </div>
                        {/* @ts-ignore */}
                        <CopyToClipboard text={formatTokenAmount(validGovVotes || BigInt(0))} onCopy={handleCopyVotes}>
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
                        <div className="text-2xl font-bold text-gray-900">{formatPercentage(governancePercentage)}</div>
                        {/* @ts-ignore */}
                        <CopyToClipboard text={formatPercentage(governancePercentage)} onCopy={handleCopyPercentage}>
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
                    <div className="text-xs text-gray-500">票数为有效治理票；如果已经申请解除治理质押，则治理票为0</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovQueryPanel;
