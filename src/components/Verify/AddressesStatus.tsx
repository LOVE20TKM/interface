import React, { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { ChevronDown, ChevronRight } from 'lucide-react';

// my types & funcs
import { ActionInfo } from '@/src/types/love20types';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useVerificationInfosByAction, useVerifiedAddressesByAction } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useScoreByActionIdByAccount } from '@/src/hooks/contracts/useLOVE20Verify';
import { useVotesNumByActionId } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';

// my utils
import { LinkIfUrl } from '@/src/lib/stringUtils';
import { formatPercentage, formatTokenAmountInteger } from '@/src/lib/format';
import RoundLite from '../Common/RoundLite';

interface VerifyAddressesProps {
  currentRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
}

const AddressesStatus: React.FC<VerifyAddressesProps> = ({ currentRound, actionId, actionInfo }) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 获取弃权票数
  const {
    scoreByActionIdByAccount: abstainVotes,
    isPending: isPendingAbstainVotes,
    error: errorAbstainVotes,
  } = useScoreByActionIdByAccount(
    token?.address as `0x${string}`,
    currentRound,
    actionId,
    '0x0000000000000000000000000000000000000000',
  );

  // 读取验证地址的激励
  const {
    verifiedAddresses,
    isPending: isPendingVerifiedAddresses,
    error: errorVerifiedAddresses,
  } = useVerifiedAddressesByAction(token?.address as `0x${string}`, currentRound, actionId);

  // 获取参与验证的地址
  const {
    verificationInfos,
    isPending: isPendingVerificationInfosByAction,
    error: errorVerificationInfosByAction,
  } = useVerificationInfosByAction(token?.address as `0x${string}`, currentRound, actionId);

  // 总验证票数
  const {
    votesNumByActionId: totalVotesNum,
    isPending: isPendingTotalVotesNum,
    error: errorTotalVotesNum,
  } = useVotesNumByActionId(token?.address as `0x${string}`, currentRound, actionId);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorVerifiedAddresses) {
      handleContractError(errorVerifiedAddresses, 'dataViewer');
    }
    if (errorVerificationInfosByAction) {
      handleContractError(errorVerificationInfosByAction, 'dataViewer');
    }
    if (errorAbstainVotes) {
      handleContractError(errorAbstainVotes, 'verify');
    }
    if (errorTotalVotesNum) {
      handleContractError(errorTotalVotesNum, 'vote');
    }
  }, [errorVerifiedAddresses, errorVerificationInfosByAction, errorAbstainVotes, errorTotalVotesNum]);

  const toggleRow = (address: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedRows(newExpanded);
  };

  // 累计当前已验证票数（包含弃权票）
  const addressVotesNum = verifiedAddresses?.reduce((acc, addr) => acc + addr.score, BigInt(0)) || BigInt(0);
  const verifiedVotesNum = addressVotesNum + (abstainVotes || BigInt(0));
  const verifiedVotesPercent = (Number(verifiedVotesNum) / Number(totalVotesNum || BigInt(0))) * 100;

  return (
    <div className="relative px-4 pb-4 w-full">
      <div className="flex items-center">
        <LeftTitle title="当前轮最新验证结果" />
        <span className="text-sm text-greyscale-500 ml-2">(验证进度：{formatPercentage(verifiedVotesPercent)})</span>
      </div>
      <div className="flex justify-left mt-2">
        <RoundLite currentRound={currentRound} roundType="verify" />
      </div>

      {isPendingVerificationInfosByAction || isPendingVerifiedAddresses || isPendingAbstainVotes ? (
        <div className="flex justify-center items-center h-full">
          <LoadingIcon />
        </div>
      ) : !verificationInfos || verificationInfos.length === 0 ? (
        <div className="text-center text-sm text-greyscale-400 p-4">没有验证地址</div>
      ) : (
        <table className="table w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th></th>
              <th>被抽中地址</th>
              <th className="px-1 text-right">获得验证票</th>
              <th className="px-1 text-right">验证票占比</th>
            </tr>
          </thead>
          <tbody>
            {verificationInfos
              .map((info) => {
                const verifiedAddress = verifiedAddresses?.find((addr) => addr.account === info.account);
                return {
                  ...info,
                  score: verifiedAddress?.score || BigInt(0),
                };
              })
              .sort((a, b) => {
                if (a.score > b.score) return -1;
                if (a.score < b.score) return 1;
                return 0;
              })
              .map((info) => {
                const verifiedAddress = verifiedAddresses?.find((addr) => addr.account === info.account);
                const isExpanded = expandedRows.has(info.account);

                return (
                  <React.Fragment key={info.account}>
                    <tr className={`border-b border-gray-100 ${info.account === account ? 'text-secondary' : ''}`}>
                      <td className="px-1 w-8">
                        <button
                          onClick={() => toggleRow(info.account)}
                          className="text-greyscale-400 hover:text-greyscale-600"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="px-1">
                        <AddressWithCopyButton
                          address={info.account}
                          showCopyButton={true}
                          word={info.account === account ? '(我)' : ''}
                        />
                      </td>
                      <td className="px-1 text-right">
                        {formatTokenAmountInteger(verifiedAddress?.score || BigInt(0))}
                      </td>
                      <td className="px-1 text-right">
                        {formatPercentage(
                          (Number(verifiedAddress?.score || BigInt(0)) / Number(verifiedVotesNum || BigInt(0))) * 100,
                        )}
                      </td>
                    </tr>

                    {actionInfo && isExpanded && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td></td>
                        <td colSpan={2} className="px-1 py-3">
                          <div className="text-sm text-greyscale-600">
                            <div className="text-xs text-greyscale-400 mb-2">验证信息:</div>
                            {actionInfo.body.verificationKeys.map((key, i) => (
                              <div key={i} className="mb-1">
                                <span className="text-greyscale-500">{key}:</span> <LinkIfUrl text={info.infos[i]} />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            <tr>
              <td className="px-1"></td>
              <td className="px-1 text-greyscale-500">弃权票</td>
              <td className="px-1 text-right">{formatTokenAmountInteger(abstainVotes || BigInt(0))}</td>
              <td className="px-1 text-right">
                {formatPercentage((Number(abstainVotes || BigInt(0)) / Number(verifiedVotesNum || BigInt(0))) * 100)}
              </td>
            </tr>
            <tr>
              <td className="px-1"></td>
              <td className="px-1 text-greyscale-500">汇总 </td>
              <td className="px-1 text-right">{formatTokenAmountInteger(verifiedVotesNum || BigInt(0))}</td>
              <td className="px-1 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AddressesStatus;
