'use client';
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

// my hooks
import { useActionsCount } from '@/src/hooks/contracts/useLOVE20Submit';
import { useActionInfosByPage, useActionSubmits } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my context
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import { ActionInfo } from '@/src/types/love20types';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '../Common/AddressWithCopyButton';
import { UserPen } from 'lucide-react';

interface SubmitingActionListProps {
  currentRound: bigint;
}

const PAGE_SIZE = 40; // 每页加载40个行动

const SubmitingActionList: React.FC<SubmitingActionListProps> = ({ currentRound }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取行动总数
  const {
    actionNum,
    isPending: isPendingActionNum,
    error: errorActionNum,
  } = useActionsCount((token?.address as `0x${string}`) || '');

  // 分页状态
  const [allActionInfos, setAllActionInfos] = useState<ActionInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstPageLoaded, setIsFirstPageLoaded] = useState(false); // 标记第一页是否已加载
  const observerTarget = useRef<HTMLDivElement>(null);

  // 计算当前页的起始和结束位置（从后往前）
  const getPageRange = useCallback(
    (page: number) => {
      if (!actionNum) return { start: BigInt(0), end: BigInt(0) };

      const totalActions = Number(actionNum);
      // end 是本页的结束位置（不含），从后往前
      const end = totalActions - page * PAGE_SIZE;
      // start 是本页的起始位置
      const start = Math.max(0, end - PAGE_SIZE);

      return {
        start: BigInt(start),
        end: BigInt(end),
      };
    },
    [actionNum],
  );

  // 获取当前页的行动信息
  const pageRange = getPageRange(currentPage);
  const {
    actionInfos: currentPageActions,
    isPending: isPendingActionInfosByPage,
    error: errorActionInfosByPage,
  } = useActionInfosByPage((token?.address as `0x${string}`) || '', pageRange.start, pageRange.end);

  // 获取已推举的行动列表
  const {
    actionSubmits,
    isPending: isPendingActionSubmits,
    error: errorActionSubmits,
  } = useActionSubmits((token?.address as `0x${string}`) || '', currentRound);

  // 当获取到新的行动数据时，合并到列表中
  useEffect(() => {
    if (currentPageActions && currentPageActions.length > 0) {
      setAllActionInfos((prev) => {
        // 避免重复添加
        const existingIds = new Set(prev.map((action) => action.head.id));
        const newActions = currentPageActions.filter((action) => !existingIds.has(action.head.id));
        return [...prev, ...newActions];
      });

      // 标记第一页已加载
      if (currentPage === 0) {
        setIsFirstPageLoaded(true);
      }

      // 检查是否还有更多数据：当 start === 0 时说明已经到头了
      if (pageRange.start === BigInt(0)) {
        setHasMore(false);
      }
    }
  }, [currentPageActions, currentPage, pageRange.start]);

  // 无限滚动实现
  useEffect(() => {
    // 只有在第一页加载完成后才启用滚动监听
    if (!isFirstPageLoaded) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPendingActionInfosByPage) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isPendingActionInfosByPage, isFirstPageLoaded, currentPage]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionNum) {
      handleContractError(errorActionNum, 'submit');
    }
    if (errorActionInfosByPage) {
      handleContractError(errorActionInfosByPage, 'submit');
    }
    if (errorActionSubmits) {
      handleContractError(errorActionSubmits, 'submit');
    }
  }, [errorActionNum, errorActionInfosByPage, errorActionSubmits]);

  if (!token) {
    return <LoadingIcon />;
  }

  // 初次加载时显示加载状态
  if (isPendingActionNum || (currentPage === 0 && isPendingActionInfosByPage) || isPendingActionSubmits) {
    return <LoadingIcon />;
  }

  // 过滤未推举的行动并倒序排序
  const unsubmittedActions =
    allActionInfos
      ?.filter((action: ActionInfo) => {
        const isSubmitted = actionSubmits?.some((submit) => submit.actionId === action.head.id);
        return !isSubmitted; // 只显示未推举的行动
      })
      ?.sort((a, b) => Number(b.head.id - a.head.id)) || []; // 按id倒序排序，最新的在前

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <LeftTitle title="未推举的行动" />
        <Link href="/extension/factories/">
          <Button variant="outline" size="sm" className="text-secondary border-secondary">
            发起新行动
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {allActionInfos.length === 0 && !isPendingActionInfosByPage && (
          <div className="text-sm mt-4 text-greyscale-500 text-center">暂无行动</div>
        )}

        {unsubmittedActions.map((action: ActionInfo) => {
          return (
            <Card key={action.head.id} className="shadow-none">
              <Link href={`/submit/submit?id=${action.head.id}&symbol=${token.symbol}&submitted=false`}>
                <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
                  <span className="text-greyscale-400 text-sm">{`No.`}</span>
                  <span className="text-secondary text-xl font-bold mr-2">{String(action.head.id)}</span>
                  <span className="font-bold text-greyscale-800">{`${action.body.title}`}</span>
                </CardHeader>
                <CardContent className="px-3 pt-1 pb-2">
                  {/* <div className="text-base text-greyscale-600">{action.body.consensus}</div> */}
                  <div className="flex justify-between mt-1 text-sm">
                    <span className="flex items-center">
                      <UserPen className="text-greyscale-400 mr-1 h-3 w-3 -translate-y-0.5" />
                      <span className="text-greyscale-400">
                        <AddressWithCopyButton
                          address={action.head.author as `0x${string}`}
                          showCopyButton={false}
                          colorClassName2="text-secondary"
                        />
                      </span>
                    </span>
                    <span className="text-sm text-greyscale-600">未推举</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}

        {/* 加载更多的触发器 */}
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center py-4">
            {isPendingActionInfosByPage && <LoadingIcon />}
          </div>
        )}

        {/* 已加载完所有数据的提示 */}
        {!hasMore && allActionInfos.length > 0 && (
          <div className="text-sm text-greyscale-400 text-center py-4">已加载全部行动</div>
        )}
      </div>
    </div>
  );
};

export default SubmitingActionList;
