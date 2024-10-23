import { useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

import { TokenContext } from '../../contexts/TokenContext';
import { ActionInfo } from '../../types/life20types';
import { useJoin } from '../../hooks/contracts/useLOVE20Join';
import { useApprove, useBalanceOf } from '../../hooks/contracts/useLOVE20Token';
import { formatTokenAmount } from '../../utils/format';

interface SubmitJoinProps {
  actionInfo: ActionInfo;
  stakedAmount: bigint | undefined;
}

const SubmitJoin: React.FC<SubmitJoinProps> = ({ actionInfo, stakedAmount }) => {
  const router = useRouter();
  const decimals = process.env.NEXT_PUBLIC_TOKEN_DECIMALS || 18;

  const { token } = useContext(TokenContext) || {};
  const { address: accountAddress } = useAccount();

  // 表单状态管理
  const [additionalStakeAmount, setAdditionalStakeAmount] = useState('');
  const [rounds, setRounds] = useState('');
  const [verificationInfo, setVerificationInfo] = useState('');

  // 获取代币余额
  const { balance: tokenBalance, error: errorTokenBalance } = useBalanceOf(
    token?.address as `0x${string}`,
    accountAddress as `0x${string}`,
  );

  // 授权(approve)
  const {
    approve: approveToken,
    isWriting: isPendingApproveToken,
    isConfirmed: isConfirmedApproveToken,
    writeError: errApproveToken,
  } = useApprove(token?.address as `0x${string}`);

  // 执行加入提交
  const {
    join,
    isPending: isPendingJoin,
    isConfirming: isConfirmingJoin,
    isConfirmed: isConfirmedJoin,
    error: errorJoin,
  } = useJoin();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = async () => {
    if (
      stakedAmount &&
      BigInt(additionalStakeAmount) * 10n ** BigInt(decimals) + stakedAmount > BigInt(actionInfo.body.maxStake)
    ) {
      toast.error('增加的代币数不能超过最大参与代币数');
      return;
    }
    if (!stakedAmount && !additionalStakeAmount) {
      toast.error('请输入增加的代币数');
      return;
    }

    try {
      setIsSubmitted(true);
      // 发送授权交易
      await approveToken(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`,
        BigInt(additionalStakeAmount) * 10n ** BigInt(decimals),
      );
    } catch (error) {
      console.error('Approve failed', error);
      setIsSubmitted(false);
    }
  };

  // 监听授权交易的确认状态
  useEffect(() => {
    const bothApproved = isConfirmedApproveToken && isSubmitted;

    if (bothApproved) {
      join(
        token?.address as `0x${string}`,
        BigInt(actionInfo.head.id),
        BigInt(additionalStakeAmount) * 10n ** BigInt(decimals),
        verificationInfo,
        BigInt(rounds),
      )
        .then(() => {
          setIsSubmitted(false); // 重置提交状态
        })
        .catch((error) => {
          console.error('Stake failed', error);
          setIsSubmitted(false);
        });
    }
  }, [isConfirmedApproveToken, isSubmitted]);

  // 如果质押成功，则用toast显示质押成功并重新加载数据
  useEffect(() => {
    if (isConfirmedJoin) {
      toast.success('加入成功');
      // 重置表单
      setAdditionalStakeAmount('');
      setRounds('');
      setVerificationInfo('');
      // 2秒后返回
      setTimeout(() => {
        router.push(`/action/${actionInfo.head.id}?type=join`);
      }, 2000);
    }
  }, [isConfirmedJoin]);

  return (
    <>
      <div className="w-full flex flex-col rounded p-4 bg-base-100 mt-1">
        <div className="mb-4">
          <label className="block text-left mb-1 text-sm text-gray-500">
            增加参与代币: (当前持有：{formatTokenAmount(tokenBalance || 0n)} {token?.symbol})
          </label>
          <input
            type="number"
            placeholder={`${token?.symbol} 数量，不能超过 ${formatTokenAmount(
              BigInt(actionInfo.body.maxStake) - (stakedAmount || 0n),
            )}`}
            value={additionalStakeAmount}
            onChange={(e) => setAdditionalStakeAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-left mb-1 text-sm text-gray-500">参与轮数:</label>
          <input
            type="number"
            placeholder="输入参数轮数"
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-left mb-1 text-sm text-gray-500">验证信息:</label>
          <textarea
            placeholder={`${actionInfo?.body.verificationInfoGuide}`}
            value={verificationInfo}
            onChange={(e) => setVerificationInfo(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex justify-center">
          {isConfirmedJoin ? (
            <button className="mt-4 w-1/2 bg-blue-500 text-white py-2 px-4 rounded">加入成功</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPendingJoin || isConfirmingJoin}
              className="mt-4 w-1/2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isPendingJoin || isConfirmingJoin ? '加入中...' : '加入行动'}
            </button>
          )}
        </div>
        {errorTokenBalance && <div className="text-red-500 text-center">{errorTokenBalance.message}</div>}
        {errApproveToken && <div className="text-red-500 text-center">{errApproveToken.message}</div>}
        {errorJoin && <div className="text-red-500 text-center">{errorJoin.message}</div>}
      </div>
    </>
  );
};

export default SubmitJoin;
