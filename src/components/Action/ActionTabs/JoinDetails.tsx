import { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Search } from 'lucide-react';
import { isAddress } from 'viem';

// 地址转换工具
import { normalizeAddressInput, validateAddressInput, formatAddressForDisplay } from '@/src/lib/addressUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useJoinedAmountByActionIdByAccount } from '@/src/hooks/contracts/useLOVE20Join';

// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import AlertBox from '@/src/components/Common/AlertBox';

// my utils
import { formatTokenAmount } from '@/src/lib/format';

interface JoinDetailsProps {
  actionId: bigint;
}

export default function JoinDetails({ actionId }: JoinDetailsProps) {
  const { token } = useContext(TokenContext) || {};
  const [searchAddress, setSearchAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState<`0x${string}` | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // 使用hook查询参与金额 - 只有当有查询地址时才启用
  const { joinedAmountByActionIdByAccount, isPending, error } = useJoinedAmountByActionIdByAccount(
    token?.address as `0x${string}`,
    actionId,
    queryAddress as `0x${string}`,
  );

  // 处理地址输入变化
  const handleAddressChange = (value: string) => {
    setSearchAddress(value);
    // 实时验证地址
    const error = validateAddressInput(value);
    setAddressError(error);
  };

  // 处理查询
  const handleSearch = () => {
    if (!searchAddress.trim()) {
      return;
    }

    // 使用地址工具函数标准化地址
    const normalizedAddress = normalizeAddressInput(searchAddress);
    if (!normalizedAddress) {
      setAddressError('请输入有效的地址格式（支持 0x 或 TH 格式）');
      return;
    }

    setQueryAddress(normalizedAddress as `0x${string}`);
    setAddressError(null);
  };

  // 处理输入框回车
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 地址验证状态
  const isValidAddress = !addressError;

  return (
    <div className="space-y-2">
      {/* 查询表单 */}
      <Card className="border-0 md:border shadow-none md:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            查询地址参与情况
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              id="address"
              placeholder="请输入要查询的钱包地址 (支持 0x 或 TH 格式)"
              value={searchAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className={addressError ? 'border-red-500' : ''}
            />
            {addressError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {addressError}
              </p>
            )}
          </div>
          <div className="flex justify-center">
            <Button
              onClick={handleSearch}
              disabled={!searchAddress.trim() || !isValidAddress || (!!queryAddress && isPending)}
              className="px-8"
            >
              {queryAddress && isPending ? <LoadingIcon /> : '查询'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 查询结果 */}
      {queryAddress && (
        <Card className="border-0 md:border shadow-none md:shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">查询结果</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <LoadingIcon />
                <span className="ml-2">查询中...</span>
              </div>
            ) : error ? (
              <AlertBox type="error" message={`查询失败：${error.message}`} />
            ) : (
              <div className="space-y-4">
                {/* 查询地址信息 */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">查询地址</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <code className="text-sm font-mono break-all">{queryAddress}</code>
                      {searchAddress !== queryAddress && (
                        <div className="text-xs text-gray-500">原始输入：{searchAddress}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 参与情况显示 */}
                {joinedAmountByActionIdByAccount !== undefined && joinedAmountByActionIdByAccount > BigInt(0) ? (
                  /* 有参与：显示参与数量 */
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">参与代币数量</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold">
                        {formatTokenAmount(joinedAmountByActionIdByAccount)} {token?.symbol || ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 未参与：显示提示信息 */
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">该地址未参与此行动</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">参与代币数量为 0</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="border-0 md:border shadow-none md:shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• 支持两种地址格式：0x 开头的以太坊地址 或 TH 开头的 TKM 地址</p>
          <p>• 查询结果显示该地址参与此行动质押的代币总数量</p>
          <p>• 如果显示 0，表示该地址未参与此行动</p>
        </CardContent>
      </Card>
    </div>
  );
}
