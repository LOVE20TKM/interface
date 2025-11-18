'use client';
/**
 * @description 查询当前地址的投票历史
 */
import React, { useContext, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useAccountVotingHistory } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

// utils
import { formatPercentage, formatRoundForDisplay, formatTokenAmount } from '@/src/lib/format';

// types
import { AccountVotingAction, ActionInfo } from '@/src/types/love20types';

const ROUNDS_PER_PAGE = BigInt(20);

type RoundVotingData = {
  round: bigint;
  actions: Array<{
    actionInfo: ActionInfo;
    votingAction: AccountVotingAction;
    votePercentage: number;
  }>;
  hasVoting: boolean;
};

const VoteHistoryPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();
  const [startRound, setStartRound] = useState<bigint>(BigInt(0));
  const [endRound, setEndRound] = useState<bigint>(BigInt(0));
  const [hasMoreRounds, setHasMoreRounds] = useState(true);
  const [allRoundsData, setAllRoundsData] = useState<RoundVotingData[]>([]);
  const [scrollFailureCount, setScrollFailureCount] = useState(0);

  // 引入参考元素，用于无限滚动加载
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 获取 account 参数（如果没有则使用当前连接的账户）
  const targetAccount = useMemo(() => {
    const accountParam = router.query.account as string;
    return (accountParam as `0x${string}`) || account;
  }, [router.query.account, account]);

  // 格式化地址显示：前4位 + ... + 后4位
  const formatAddress = (address: string) => {
    if (!address || address.length < 8) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 获取当前轮次
  const { currentRound, isPending: isLoadingCurrentRound, error: errorLoadingCurrentRound } = useCurrentRound();

  // 初始化轮次范围
  useEffect(() => {
    if (currentRound !== undefined && currentRound > BigInt(0)) {
      const initialEndRound = currentRound;
      const initialStartRound =
        currentRound - ROUNDS_PER_PAGE + BigInt(1) > BigInt(0) ? currentRound - ROUNDS_PER_PAGE + BigInt(1) : BigInt(1);
      setEndRound(initialEndRound);
      setStartRound(initialStartRound);
    }
  }, [currentRound]);

  // 获取投票历史数据
  const {
    votingHistory,
    isPending: isLoadingHistory,
    error: errorLoadingHistory,
  } = useAccountVotingHistory(token?.address as `0x${string}`, targetAccount as `0x${string}`, startRound, endRound);

  // 处理投票历史数据并生成完整的轮次列表
  useEffect(() => {
    if (
      !votingHistory?.accountActions ||
      !votingHistory?.actionInfos ||
      startRound === BigInt(0) ||
      endRound === BigInt(0)
    ) {
      return;
    }

    const { accountActions, actionInfos } = votingHistory;

    // 创建 ActionInfo 映射
    const actionInfoMap = new Map<string, ActionInfo>();
    actionInfos.forEach((info) => {
      actionInfoMap.set(info.head.id.toString(), info);
    });

    // 按轮次分组投票数据
    const roundMap = new Map<
      string,
      Array<{
        actionInfo: ActionInfo;
        votingAction: AccountVotingAction;
        votePercentage: number;
      }>
    >();

    accountActions.forEach((votingAction) => {
      const roundKey = votingAction.round.toString();
      const actionInfo = actionInfoMap.get(votingAction.actionId.toString());

      if (actionInfo) {
        const votePercentage =
          votingAction.totalVoteCount > BigInt(0)
            ? Number((votingAction.myVoteCount * BigInt(10000)) / votingAction.totalVoteCount) / 100
            : 0;

        if (!roundMap.has(roundKey)) {
          roundMap.set(roundKey, []);
        }

        roundMap.get(roundKey)!.push({
          actionInfo,
          votingAction,
          votePercentage,
        });
      }
    });

    // 生成当前范围内所有轮次的数据（包括没有投票的轮次）
    const newRoundsData: RoundVotingData[] = [];
    for (let round = endRound; round >= startRound; round--) {
      const roundKey = round.toString();
      const actions = roundMap.get(roundKey) || [];

      // 按行动 ID 从大到小排序
      actions.sort((a, b) => {
        return a.actionInfo.head.id > b.actionInfo.head.id ? -1 : 1;
      });

      newRoundsData.push({
        round,
        actions,
        hasVoting: actions.length > 0,
      });
    }

    // 将新数据添加到现有数据中（去重）
    setAllRoundsData((prev) => {
      const existingRounds = new Set(prev.map((item) => item.round.toString()));
      const filteredNewData = newRoundsData.filter((item) => !existingRounds.has(item.round.toString()));
      const result = [...prev, ...filteredNewData].sort((a, b) => (a.round > b.round ? -1 : 1));
      return result;
    });
  }, [votingHistory, startRound, endRound]);

  // 根据当前起始轮次判断是否还有更多可以加载
  useEffect(() => {
    // 关键修复：只要 startRound > 1，就说明还有更早的轮次可以加载
    const hasMore = startRound > BigInt(1);
    setHasMoreRounds(hasMore);
  }, [startRound]);

  // 防抖状态，避免频繁触发
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 无限滚动加载更多轮次 - 优化的版本，支持防抖和重复调用检测
  const loadMoreRounds = useCallback(async () => {
    // 防抖检测：如果正在加载或者防抖期间，跳过
    if (isLoadingHistory || isLoadingMore) {
      console.log('正在加载中或防抖期间，跳过本次请求');
      return;
    }

    // 设置防抖状态
    setIsLoadingMore(true);

    // 检查是否还能加载更多
    const currentCanLoad = startRound > BigInt(1);
    if (currentCanLoad) {
      const newStart = startRound - ROUNDS_PER_PAGE >= BigInt(1) ? startRound - ROUNDS_PER_PAGE : BigInt(1);
      setStartRound(newStart);
    } else {
      console.log('已经到达最早轮次，不再加载');
    }

    // 短暂防抖后解除限制
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1000);
  }, [isLoadingHistory, isLoadingMore, startRound]);

  // 使用 IntersectionObserver + 传统滚动事件的双重检测机制
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const target = loadMoreRef.current;

    // 检测设备类型和用户代理
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    let intersectionObserver: IntersectionObserver | null = null;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    // 传统滚动事件检测函数（作为备用方案）
    const checkScrollPosition = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isNearBottom = rect.top <= windowHeight + 150; // 增大检测范围

        if (isNearBottom && hasMoreRounds && !isLoadingHistory && !isLoadingMore) {
          console.log('通过滚动事件触发加载');
          loadMoreRounds();
        }
      }, 100); // 100ms防抖
    };

    // IntersectionObserver 配置（移动端优化）
    const observerOptions = {
      root: null,
      rootMargin: isMobile ? '80px' : '100px', // 移动端使用更小的margin
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], // 多个threshold提高检测精度
    };

    // 尝试使用 IntersectionObserver
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreRounds && !isLoadingHistory && !isLoadingMore) {
            loadMoreRounds();
          }
        });
      }, observerOptions);

      intersectionObserver.observe(target);
    }

    // 添加传统滚动事件监听作为备用方案（特别适用于移动端）
    const scrollContainer = document.documentElement || document.body;
    scrollContainer.addEventListener('scroll', checkScrollPosition, { passive: true });
    scrollContainer.addEventListener('touchmove', checkScrollPosition, { passive: true });

    // 立即检查一次初始状态
    const initialCheck = () => {
      const rect = target.getBoundingClientRect();
      if (rect.bottom <= window.innerHeight + 80 && hasMoreRounds && !isLoadingHistory) {
        setTimeout(() => loadMoreRounds(), 500); // 延迟500ms触发
      }
    };

    // 延迟执行初始检查，确保DOM已经渲染完成
    setTimeout(initialCheck, 1000);

    // 移动端兼容性检测：如果3秒后仍未触发任何加载且有更多内容，则启用更激进的检测
    const fallbackCheck = setTimeout(() => {
      if (hasMoreRounds && !isLoadingHistory && !isLoadingMore && allRoundsData.length > 0) {
        setScrollFailureCount((prev) => prev + 1);

        // 如果检测失败次数过多，强制触发一次加载
        if (scrollFailureCount >= 2) {
          console.log('检测失败次数过多，强制触发加载');
          loadMoreRounds();
          setScrollFailureCount(0);
        }
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackCheck);
      if (intersectionObserver) {
        intersectionObserver.unobserve(target);
        intersectionObserver.disconnect();
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
      scrollContainer.removeEventListener('touchmove', checkScrollPosition);
    };
  }, [loadMoreRounds, hasMoreRounds, isLoadingHistory, isLoadingMore, scrollFailureCount, allRoundsData.length]); // 扩展依赖列表

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorLoadingCurrentRound) handleContractError(errorLoadingCurrentRound, 'dataViewer');
    if (errorLoadingHistory) handleContractError(errorLoadingHistory, 'dataViewer');
  }, [errorLoadingCurrentRound, errorLoadingHistory, handleContractError]);

  return (
    <>
      <Header title="投票历史" showBackButton={true} />
      <main
        className="flex-grow"
        style={{
          WebkitOverflowScrolling: 'touch', // iOS 平滑滚动
          overscrollBehaviorY: 'contain', // 防止过度滚动
          transformStyle: 'preserve-3d', // 3D变换优化
        }}
      >
        {!token || !targetAccount ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-4 p-4">
            <LeftTitle
              title={`${targetAccount !== account ? ` 投票记录（${formatAddress(targetAccount)}）` : '我的投票记录'}`}
            />

            {isLoadingCurrentRound ? (
              <LoadingIcon />
            ) : allRoundsData.length === 0 && !isLoadingHistory ? (
              <div className="text-center text-greyscale-500 py-8">没有投票记录</div>
            ) : (
              <>
                {allRoundsData.map((roundData) => (
                  <div
                    key={roundData.round.toString()}
                    className={`border border-gray-100 rounded-lg py-2 px-2 shadow-sm ${
                      !roundData.hasVoting ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-greyscale-500 mr-2">轮次:</span>
                      <span className={`text-xl font-bold ${roundData.hasVoting ? 'text-secondary' : 'text-gray-400'}`}>
                        {formatRoundForDisplay(roundData.round, token).toString()}
                      </span>
                    </div>

                    {roundData.hasVoting ? (
                      <div className="space-y-4">
                        {roundData.actions.map((item) => (
                          <div key={item.actionInfo.head.id.toString()} className="border-l-4 border-secondary/20 pl-4">
                            {/* 第一行：ID + 标题 */}
                            <div className="flex items-baseline mb-2">
                              <span className="text-greyscale-500 mr-1">No.</span>
                              <span className="text-secondary text-lg font-bold mr-2">
                                {item.actionInfo.head.id.toString()}
                              </span>
                              <span className="font-bold text-greyscale-800">{item.actionInfo.body.title}</span>
                            </div>

                            {/* 第二行：数据 */}
                            <div className="flex items-center space-x-6 text-sm text-greyscale-600">
                              <div className="flex items-center">
                                <span className="mr-1">我的投票:</span>
                                <span className="font-semibold text-secondary">
                                  {formatTokenAmount(item.votingAction.myVoteCount)}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">占比:</span>
                                <span className="font-semibold text-primary">
                                  {formatPercentage(item.votePercentage)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-greyscale-400">该轮次没有投票</div>
                    )}
                  </div>
                ))}

                {/* 无限滚动加载更多 - 优化移动端检测 */}
                <div
                  ref={loadMoreRef}
                  className="h-24 flex justify-center items-center mt-4 mb-8 px-4"
                  style={{
                    minHeight: '96px', // 增加高度确保更好的检测
                    opacity: 1,
                    visibility: 'visible',
                    transform: 'translateZ(0)', // 触发硬件加速，提高检测精度
                  }}
                >
                  {isLoadingHistory || isLoadingMore ? (
                    <div className="flex flex-col items-center space-y-2">
                      <LoadingIcon />
                      <span className="text-sm text-gray-500">正在加载更多轮次...</span>
                    </div>
                  ) : hasMoreRounds ? (
                    <div
                      className="flex flex-col items-center space-y-2 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => {
                        console.log('用户点击手动加载');
                        loadMoreRounds();
                      }}
                    >
                      <span className="text-sm text-gray-500 text-center">下滑自动加载更多轮次</span>
                      <span className="text-xs text-gray-400 text-center">或点击此处手动加载</span>
                      {/* 可见的检测标记 */}
                      <div className="w-8 h-1 bg-gray-200 rounded opacity-50 mt-2"></div>
                    </div>
                  ) : allRoundsData.length > 0 ? (
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-sm text-gray-300">已加载所有轮次</span>
                      <div className="w-12 h-0.5 bg-gray-200 rounded opacity-30"></div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default VoteHistoryPage;
