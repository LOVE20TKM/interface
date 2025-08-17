import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useChainId } from 'wagmi';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useContext } from 'react';

// my types & funcs
import { ActionInfo } from '@/src/types/love20types';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useVerificationInfosByAction } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useVerify } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// my utils
import { LinkIfUrl } from '@/src/lib/stringUtils';
import { NavigationUtils } from '@/src/lib/navigationUtils';
import { formatPercentage } from '@/src/lib/format';

interface VerifyAddressesProps {
  currentRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  remainingVotes: bigint;
}

const AddressesForVerifying: React.FC<VerifyAddressesProps> = ({
  currentRound,
  actionId,
  actionInfo,
  remainingVotes,
}) => {
  const { token } = useContext(TokenContext) || {};
  const chainId = useChainId();
  const router = useRouter();

  // 获取参与验证的地址
  const {
    verificationInfos,
    isPending: isPendingVerificationInfosByAction,
    error: errorVerificationInfosByAction,
  } = useVerificationInfosByAction(token?.address as `0x${string}`, currentRound, actionId);

  // 表单状态
  const [scores, setScores] = useState<{ [address: string]: string }>({});
  const [abstainScore, setAbstainScore] = useState<string>('0');

  // 初始化打分值
  useEffect(() => {
    if (verificationInfos && verificationInfos.length > 0) {
      const initialScores: { [address: string]: string } = {};
      verificationInfos.forEach((info) => {
        initialScores[info.account] = '';
      });
      setScores(initialScores);
      setAbstainScore('');
    }
  }, [verificationInfos]);

  // 计算百分比
  const calculatePercentages = () => {
    const addressScores = Object.values(scores).map((val) => parseInt(val) || 0);
    const abstainScoreValue = parseInt(abstainScore) || 0;
    const totalScore = addressScores.reduce((sum, val) => sum + val, 0) + abstainScoreValue;

    if (totalScore === 0) return { addressPercentages: {}, abstainPercentage: 0 };

    const addressPercentages: { [address: string]: number } = {};
    Object.keys(scores).forEach((address) => {
      const score = parseInt(scores[address]) || 0;
      addressPercentages[address] = (score / totalScore) * 100;
    });
    const abstainPercentage = (abstainScoreValue / totalScore) * 100;

    return { addressPercentages, abstainPercentage };
  };

  const { addressPercentages, abstainPercentage } = calculatePercentages();

  // 处理分数变化
  const handleScoreChange = (address: string, value: string) => {
    // 只允许整数或0
    if (value === '' || /^[0-9]+$/.test(value)) {
      setScores({ ...scores, [address]: value });
    }
  };

  // 处理弃权分数变化
  const handleAbstainScoreChange = (value: string) => {
    // 只允许整数或0
    if (value === '' || /^[0-9]+$/.test(value)) {
      setAbstainScore(value);
    }
  };

  // 提交验证
  const { verify, isPending, isConfirming, isConfirmed, writeError: submitError } = useVerify();
  const checkInput = () => {
    if (remainingVotes <= 2n) {
      toast.error('剩余票数不足，无法验证');
      return false;
    }
    const allScoresZero =
      Object.values(scores).every((score) => parseInt(score) === 0 || score === '') &&
      (parseInt(abstainScore) === 0 || abstainScore === '');

    if (allScoresZero) {
      toast.error('请至少给一个地址或弃权投票打分');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!checkInput()) {
      return;
    }

    // 获取打分总和
    const scoreSum =
      Object.values(scores).reduce((sum, score) => sum + (parseInt(score) || 0), 0) + (parseInt(abstainScore) || 0);

    console.log('-------handleSubmit()-------');
    console.log('scoreSum', scoreSum);

    // 计算每个地址的票数（整数部分）
    const scoresArrayForSubmit: bigint[] = [];
    let allocatedVotes = 0n;

    // 计算每个地址的票数（整数部分）
    verificationInfos.forEach((info, index) => {
      const score = parseInt(scores[info.account]) || 0;
      const ratio = score / scoreSum;
      const exactVotes = Number(remainingVotes) * ratio;
      const votes = BigInt(Math.floor(exactVotes));

      // 误差处理，避免验证票数超过剩余票数(ratio有可能最后1位五入了)
      allocatedVotes += votes;
      if (allocatedVotes > remainingVotes) {
        const leftoverVotes = allocatedVotes - remainingVotes;
        allocatedVotes -= leftoverVotes;
        scoresArrayForSubmit.push(votes - leftoverVotes);
      } else {
        scoresArrayForSubmit.push(votes);
      }
    });

    // 计算弃权票数并提交
    const scoresArrayTotal = scoresArrayForSubmit.reduce((sum, votes) => sum + votes, 0n);

    console.log('remainingVotes', remainingVotes);
    console.log('scoresArrayTotal', scoresArrayTotal);
    console.log('scoresArrayForSubmit', scoresArrayForSubmit);

    // if 有弃权票
    if (parseInt(abstainScore) > 0) {
      const abstainVotes = remainingVotes > scoresArrayTotal ? remainingVotes - scoresArrayTotal : 0n;
      console.log('abstainVotes', abstainVotes);
      verify(token?.address as `0x${string}`, actionId, abstainVotes, scoresArrayForSubmit);
    } else {
      // else 无弃权票

      // 误差处理：如果误差丢掉了一些票，则简单将这些票分配给第一个得分不为0的地址
      if (scoresArrayTotal < remainingVotes) {
        const firstNonZeroIndex = scoresArrayForSubmit.findIndex((votes) => votes > 0n);
        if (firstNonZeroIndex !== -1) {
          scoresArrayForSubmit[firstNonZeroIndex] += remainingVotes - scoresArrayTotal;
        }
      }

      console.log('abstainVotes', 0n);
      verify(token?.address as `0x${string}`, actionId, 0n, scoresArrayForSubmit);
    }
  };

  // 提交成功
  useEffect(() => {
    if (isConfirmed && !submitError) {
      toast.success('提交成功', {
        duration: 2000, // 2秒
      });
      setTimeout(() => {
        NavigationUtils.reloadWithOverlay();
      }, 2000);
    }
  }, [isConfirmed, submitError]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (submitError) {
      handleContractError(submitError, 'verify');
    }
    if (errorVerificationInfosByAction) {
      handleContractError(errorVerificationInfosByAction, 'dataViewer');
    }
  }, [submitError, errorVerificationInfosByAction]);

  // 渲染
  return (
    <>
      <div className="w-full max-w-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left text-sm text-greyscale-500">被抽中的行动参与者</th>
              <th className="pb-3 pl-2 text-left whitespace-nowrap w-20 text-sm text-greyscale-500">打分</th>
              <th className="pb-3 text-center whitespace-nowrap w-16 text-sm text-greyscale-500">分配</th>
            </tr>
          </thead>
          <tbody>
            {isPendingVerificationInfosByAction && <LoadingIcon />}
            {verificationInfos && verificationInfos.length > 0 ? (
              verificationInfos.map((info, index) => (
                <tr key={info.account} className="border-b border-gray-100">
                  <td className="py-2">
                    <div className="text-left">
                      <div className="font-mono">
                        <AddressWithCopyButton address={info.account} />
                      </div>
                      {actionInfo && (
                        <div className="text-sm text-greyscale-800">
                          {actionInfo.body.verificationKeys.map((key, i) => (
                            <div key={i}>
                              {key}: <LinkIfUrl text={info.infos[i]} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 w-20">
                    <div className="flex items-center text-left">
                      <input
                        type="number"
                        min="0"
                        value={scores[info.account] || ''}
                        placeholder="0"
                        onChange={(e) => handleScoreChange(info.account, e.target.value)}
                        className="w-11 px-1 py-1 border rounded"
                        disabled={isPending || isConfirmed}
                      />
                      <span className="text-greyscale-500 text-sm">分</span>
                    </div>
                  </td>
                  <td className="py-2 text-center w-16 whitespace-nowrap">
                    <div className="text-greyscale-500 text-sm">
                      {formatPercentage(addressPercentages[info.account] || 0)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  暂无数据
                </td>
              </tr>
            )}
            {verificationInfos && (
              <tr>
                <td className="py-2">
                  <div className="text-left">
                    <div className="text-sm text-greyscale-800">
                      <span>弃权票数：</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 w-20">
                  <div className="flex items-center text-left">
                    <input
                      type="number"
                      min="0"
                      value={abstainScore}
                      placeholder="0"
                      onChange={(e) => handleAbstainScoreChange(e.target.value)}
                      className="w-11 px-1 py-1 border rounded"
                      disabled={isPending || isConfirmed}
                    />
                    <span className="text-greyscale-500 text-sm">分</span>
                  </div>
                </td>
                <td className="py-2 text-center w-16 whitespace-nowrap">
                  <div className="text-greyscale-500 text-sm">{formatPercentage(abstainPercentage)}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSubmit} disabled={isPending || isConfirming || isConfirmed} className="mt-6 w-1/2">
        {!isPending && !isConfirming && !isConfirmed && '提交验证'}
        {isPending && '提交中...'}
        {isConfirming && '确认中...'}
        {isConfirmed && '已验证'}
      </Button>

      <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
    </>
  );
};

export default AddressesForVerifying;
