import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { ChevronDown, ChevronRight } from 'lucide-react';

// my hooks
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useVerificationInfosByAction, useVerifiedAddressesByAction } from '@/src/hooks/contracts/useLOVE20RoundViewer';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types
import { ActionInfo, VerifiedAddress } from '@/src/types/love20types';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// my funcs
import { formatRoundForDisplay, formatTokenAmountInteger } from '@/src/lib/format';
import { LinkIfUrl } from '@/src/lib/stringUtils';

const VerifiedAddressesByAction: React.FC<{
  currentJoinRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo;
}> = ({ currentJoinRound, actionId, actionInfo }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [selectedRound, setSelectedRound] = useState(BigInt(0));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 从URL获取round参数
  const { round: urlRound } = router.query;

  // 初始化轮次状态
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (token && currentJoinRound - BigInt(token.initialStakeRound) >= BigInt(2)) {
      setSelectedRound(currentJoinRound - BigInt(2));
    }
  }, [urlRound, currentJoinRound, token]);

  // 读取验证地址的激励
  const {
    verifiedAddresses,
    isPending: isPendingVerifiedAddresses,
    error: errorVerifiedAddresses,
  } = useVerifiedAddressesByAction(
    token?.address as `0x${string}`,
    token && selectedRound ? selectedRound : BigInt(0),
    actionId,
  );

  // 获取验证地址的验证信息
  const {
    verificationInfos,
    isPending: isPendingVerificationInfosByAction,
    error: errorVerificationInfosByAction,
  } = useVerificationInfosByAction(
    token?.address as `0x${string}`,
    token && selectedRound ? selectedRound : BigInt(0),
    actionId,
  );

  const [addresses, setAddresses] = useState<VerifiedAddress[]>([]);
  useEffect(() => {
    if (verifiedAddresses) {
      setAddresses(verifiedAddresses);
    }
  }, [verifiedAddresses]);

  const handleChangedRound = (round: number) => {
    const newRound = BigInt(round);
    setSelectedRound(newRound);

    // 更新URL参数并添加到历史记录
    const currentQuery = { ...router.query };
    currentQuery.round = newRound.toString();

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorVerifiedAddresses) {
      handleContractError(errorVerifiedAddresses, 'dataViewer');
    }
    if (errorVerificationInfosByAction) {
      handleContractError(errorVerificationInfosByAction, 'dataViewer');
    }
  }, [errorVerifiedAddresses, errorVerificationInfosByAction]);

  // 当地址数据加载完成后，展开获得验证票最多的地址
  useEffect(() => {
    if (addresses.length > 0 && expandedRows.size === 0) {
      const sortedAddresses = [...addresses].sort((a, b) => {
        if (a.score > b.score) return -1;
        if (a.score < b.score) return 1;
        return 0;
      });

      setExpandedRows(new Set([sortedAddresses[0].account]));
    }
  }, [addresses]);

  // 创建排序后的地址数组用于渲染
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.score > b.score) return -1;
    if (a.score < b.score) return 1;
    return 0;
  });

  // 计算汇总数据
  const totalReward = sortedAddresses.reduce((sum, item) => sum + (item.reward || BigInt(0)), BigInt(0));

  const toggleRow = (address: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="relative ">
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无验证结果</div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {selectedRound > 0 && (
            <>
              <LeftTitle title={`第 ${selectedRound.toString()} 轮验证结果`} />
              <span className="text-sm text-greyscale-500 ml-2">(</span>
              <ChangeRound
                currentRound={
                  token && currentJoinRound ? formatRoundForDisplay(currentJoinRound - BigInt(2), token) : BigInt(0)
                }
                handleChangedRound={handleChangedRound}
              />
              <span className="text-sm text-greyscale-500">)</span>
            </>
          )}
        </div>
        {selectedRound > 0 && addresses.length > 0 && (
          <button
            onClick={() => router.push(`/verify/detail?symbol=${token?.symbol}&id=${actionId}&round=${selectedRound}`)}
            className="text-sm text-secondary hover:text-secondary-600 transition-colors"
          >
            查看明细 &gt;&gt;
          </button>
        )}
      </div>
      {isPendingVerifiedAddresses || isPendingVerificationInfosByAction ? (
        <div className="flex justify-center items-center h-full">
          <LoadingIcon />
        </div>
      ) : addresses.length === 0 ? (
        selectedRound > BigInt(0) && <div className="text-center text-sm text-greyscale-400 p-4">没有验证地址</div>
      ) : (
        <table className="table w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th></th>
              <th>被抽中地址</th>
              <th className="px-1 text-right">获得验证票</th>
              <th className="px-1 text-right">可铸造激励</th>
            </tr>
          </thead>
          <tbody>
            {sortedAddresses.map((item) => {
              const verificationInfo = verificationInfos?.find((info) => info.account === item.account);
              const isExpanded = expandedRows.has(item.account);

              return (
                <React.Fragment key={item.account}>
                  <tr className={`border-b border-gray-100 ${item.account === account ? 'text-secondary' : ''}`}>
                    <td className="px-1 w-8">
                      {verificationInfo && (
                        <button
                          onClick={() => toggleRow(item.account)}
                          className="text-greyscale-400 hover:text-greyscale-600"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      )}
                    </td>
                    <td className="px-1 ">
                      <AddressWithCopyButton
                        address={item.account}
                        showCopyButton={true}
                        word={item.account === account ? '(我)' : ''}
                      />
                    </td>
                    <td className="px-1 text-right">{formatTokenAmountInteger(item.score)}</td>
                    <td className="px-1 text-right">{formatTokenAmountInteger(item.reward || BigInt(0))}</td>
                  </tr>

                  {verificationInfo && actionInfo && isExpanded && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td></td>
                      <td colSpan={3} className="px-1 py-3">
                        <div className="text-sm text-greyscale-600">
                          <div className="text-xs text-greyscale-400 mb-2">验证信息:</div>
                          {actionInfo.body.verificationKeys.map((key, i) => (
                            <div key={i} className="mb-1">
                              <span className="text-greyscale-500">{key}:</span>{' '}
                              <LinkIfUrl text={verificationInfo.infos[i]} />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {/* 汇总行 */}
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <td></td>
              <td colSpan={2} className="px-1">
                汇总激励
              </td>
              <td className="px-1 text-right">{formatTokenAmountInteger(totalReward)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VerifiedAddressesByAction;
