import { useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

import { useStakeLiquidity } from '@/src/hooks/contracts/useLOVE20Stake';
import { useApprove } from '@/src/hooks/contracts/useLOVE20Token';
import { TokenContext, Token } from '@/src/contexts/TokenContext';
import { formatTokenAmount, formatUnits, parseUnits } from '@/src/lib/format';
import { useGetAmountsIn, useGetAmountsOut } from '@/src/components/Stake/getAmountHooks';
import Loading from '@/src/components/Common/Loading';

interface StakeLiquidityPanelProps {
  tokenBalance: bigint;
  parentTokenBalance: bigint;
  stakedTokenAmountOfLP: bigint;
}

const StakeLiquidityPanel: React.FC<StakeLiquidityPanelProps> = ({
  tokenBalance,
  parentTokenBalance,
  stakedTokenAmountOfLP,
}) => {
  const { address: accountAddress } = useAccount();
  const { token } = useContext(TokenContext) || {};

  // Hooks: 授权(approve)、质押(stakeLiquidity)
  const {
    approve: approveToken,
    isWriting: isPendingApproveToken,
    isConfirmed: isConfirmedApproveToken,
    writeError: errApproveToken,
  } = useApprove(token?.address as `0x${string}`);
  const {
    approve: approveParentToken,
    isWriting: isPendingApproveParentToken,
    isConfirmed: isConfirmedApproveParentToken,
    writeError: errApproveParentToken,
  } = useApprove(token?.parentTokenAddress as `0x${string}`);
  const {
    stakeLiquidity,
    isWriting: isPendingStakeLiquidity,
    isConfirming: isConfirmingStakeLiquidity,
    isConfirmed: isConfirmedStakeLiquidity,
    writeError: errStakeLiquidity,
  } = useStakeLiquidity();

  // 捕获表单状态
  const [parentToken, setParentToken] = useState('');
  const [stakeToken, setStakeToken] = useState('');
  const [releasePeriod, setReleasePeriod] = useState('4');
  const [isParentTokenChangedByUser, setIsParentTokenChangedByUser] = useState(false); //是否是用户手动输入
  const [isTokenChangedByUser, setIsTokenChangedByUser] = useState(false); //是否是用户手动输入

  // 计算LP对应的另一种代币数量
  const pairExists = stakedTokenAmountOfLP > 0n;
  const {
    data: amountsOut,
    error: amountsOutError,
    isLoading: isAmountsOutLoading,
  } = useGetAmountsOut(
    parseUnits(parentToken),
    [token?.parentTokenAddress as `0x${string}`, token?.address as `0x${string}`],
    token as Token,
    pairExists,
    isParentTokenChangedByUser,
  );
  const {
    data: amountsIn,
    error: amountsInError,
    isLoading: isAmountsInLoading,
  } = useGetAmountsIn(
    parseUnits(stakeToken),
    [token?.parentTokenAddress as `0x${string}`, token?.address as `0x${string}`],
    token as Token,
    pairExists,
    isTokenChangedByUser,
  );

  // console.log('---stake: amountsOut', amountsOut);
  // console.log('---stake: amountsOutError', amountsOutError);
  // console.log('---stake: isAmountsOutLoading', isAmountsOutLoading);

  // 提交质押
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput(parentToken) || !validateInput(stakeToken)) {
      toast.error('请输入有效的数量，最多支持9位小数');
      return;
    }

    try {
      setIsSubmitted(true);
      const stakeAmount = parseUnits(stakeToken);
      const parentAmount = parseUnits(parentToken);
      if (stakeAmount === null || parentAmount === null) {
        toast.error('输入格式错误');
        setIsSubmitted(false);
        return;
      }

      // 发送授权交易
      await approveToken(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`, stakeAmount);
      await approveParentToken(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`, parentAmount);
    } catch (error) {
      console.error('Approve failed', error);
      setIsSubmitted(false);
    }
  };

  // 验证输入是否为有效的数字且最多9位小数
  const validateInput = (value: string) => {
    const regex = /^\d+(\.\d{0,9})?$/;
    return regex.test(value);
  };

  // 监听授权交易的确认状态
  useEffect(() => {
    const bothApproved = isConfirmedApproveToken && isConfirmedApproveParentToken && isSubmitted;

    if (bothApproved) {
      const stakeAmount = parseUnits(stakeToken);
      const parentAmount = parseUnits(parentToken);
      if (stakeAmount === null || parentAmount === null) {
        toast.error('转换金额时出错');
        setIsSubmitted(false);
        return;
      }

      // 调用质押函数
      stakeLiquidity(
        token?.address as `0x${string}`,
        stakeAmount,
        parentAmount,
        BigInt(releasePeriod),
        accountAddress as `0x${string}`,
      )
        .then(() => {
          setIsSubmitted(false); // 重置提交状态
        })
        .catch((error) => {
          console.error('Stake failed', error);
          setIsSubmitted(false);
        });
    }
  }, [
    isConfirmedApproveToken,
    isConfirmedApproveParentToken,
    isSubmitted,
    stakeLiquidity,
    token,
    releasePeriod,
    accountAddress,
    parentToken,
    stakeToken,
  ]);

  // 如果质押成功，则用toast显示质押成功并重新加载数据
  useEffect(() => {
    if (isConfirmedStakeLiquidity) {
      toast.success('质押成功');
      // 重置表单
      setParentToken('');
      setStakeToken('');
      setReleasePeriod('4');
      // 2秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmedStakeLiquidity]);

  // 处理父币输入变化
  const handleParentTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // console.log('!!!stake: handleParentTokenChange', value);
    setIsParentTokenChangedByUser(true);
    if (value === '' || validateInput(value)) {
      setParentToken(value);
    }
    if (!value) {
      setStakeToken('0');
    }
  };
  // 设置需要的子币数量
  useEffect(() => {
    if (amountsOut && amountsOut.length > 1) {
      setIsTokenChangedByUser(false);
      setIsParentTokenChangedByUser(false);
      const amountOut = formatUnits(BigInt(amountsOut[1]));
      const amountOutShow = Number(amountOut)
        .toFixed(12)
        .replace(/\.?0+$/, '');
      setStakeToken(amountOutShow);
    }
  }, [amountsOut]);

  // 处理质押token输入变化
  const handleStakeTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // console.log('---stake: handleStakeTokenChange', value);
    setIsTokenChangedByUser(true);
    if (value === '' || validateInput(value)) {
      setStakeToken(value);
    }
    if (!value) {
      setParentToken('0');
    }
  };
  // 设置父币数量
  useEffect(() => {
    if (amountsIn && amountsIn.length > 1) {
      setIsParentTokenChangedByUser(false);
      setIsTokenChangedByUser(false);
      const amountIn = formatUnits(BigInt(amountsIn[0]));
      const amountInShow = Number(amountIn)
        .toFixed(12)
        .replace(/\.?0+$/, '');
      setParentToken(amountInShow);

      // console.log('--------begin---------');
      // console.log('amountsIn', amountsIn);
      // console.log('amountsIn[0]', amountsIn[0]);
      // console.log('amountIn', amountIn);
      // console.log('amountInShow', amountInShow);
      // console.log('--------end---------');
    }
  }, [amountsIn]);

  return (
    <>
      <div className="w-full flex flex-col items-center rounded p-4 bg-base-100 mt-1">
        <div className="w-full text-left mb-4">
          <h2 className="relative pl-4 text-gray-700 text-base font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500">
            质押获取治理票：
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="mb-4">
            <label className="block text-left mb-1 text-sm text-gray-500">
              质押父币数 (当前持有：{formatTokenAmount(parentTokenBalance)} {token?.parentTokenSymbol})
            </label>
            <input
              type="text"
              placeholder={`输入 ${token?.parentTokenSymbol} 数量`}
              value={parentToken}
              onChange={handleParentTokenChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-left mb-1 text-sm text-gray-500">
              质押token数 (当前持有：{formatTokenAmount(tokenBalance)} {token?.symbol})
            </label>
            <input
              type="text"
              placeholder={`输入 ${token?.symbol} 数量`}
              value={stakeToken}
              onChange={handleStakeTokenChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-left mb-1 text-sm text-gray-500">释放期</label>
            <select
              value={releasePeriod}
              onChange={(e) => setReleasePeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              required
            >
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 4} value={i + 4}>
                  {i + 4}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-1/2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              disabled={isPendingStakeLiquidity || isConfirmingStakeLiquidity}
            >
              {isPendingStakeLiquidity || isConfirmingStakeLiquidity ? '质押中...' : '质押'}
            </button>
          </div>
        </form>
        {errStakeLiquidity && <div className="text-red-500">{errStakeLiquidity.message}</div>}
        {errApproveToken && <div className="text-red-500">{errApproveToken.message}</div>}
        {errApproveParentToken && <div className="text-red-500">{errApproveParentToken.message}</div>}
      </div>
    </>
  );
};

export default StakeLiquidityPanel;
