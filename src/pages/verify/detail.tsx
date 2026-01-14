'use client';

import { useEffect, useContext, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// my hooks

import { useActionDetailData } from '@/src/hooks/composite/useActionDetailData';
import { useActionVerificationMatrixPaged } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import Header from '@/src/components/Header';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import ActionHeader from '@/src/components/Action/ActionHeader';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import InfoTooltip from '@/src/components/Common/InfoTooltip';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';
import { formatPercentage, formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';

const VerifyDetailPage = () => {
  const router = useRouter();
  const { id, round } = router.query;
  const actionId = id ? BigInt(id as string) : undefined;
  const roundNum = round ? BigInt(round as string) : undefined;
  const { address: account } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const [selectedRound, setSelectedRound] = useState<bigint>(BigInt(0));

  // 零地址常量，用于识别弃权票
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  // 获取页面数据
  const { actionInfo, participantCount, totalAmount, isJoined, isPending, error, currentRound } = useActionDetailData({
    tokenAddress: token?.address,
    actionId,
    account,
  });

  // 初始化selectedRound
  useEffect(() => {
    if (roundNum) {
      // 如果URL中有round参数，使用它
      setSelectedRound(roundNum);
    } else if (token && currentRound && currentRound - BigInt(token.initialStakeRound) >= BigInt(2)) {
      // 否则默认使用当前轮次-2（最新可验证轮次）
      setSelectedRound(currentRound - BigInt(2));
    }
  }, [roundNum, currentRound, token]);

  // 获取验证矩阵数据（使用分页查询）
  const {
    verificationMatrix,
    isPending: isMatrixPending,
    error: matrixError,
    progress,
  } = useActionVerificationMatrixPaged(
    token?.address || ('0x' as `0x${string}`),
    selectedRound || BigInt(0),
    actionId || BigInt(0),
    10, // 每页20个验证者
  );

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
    // 同时更新URL参数
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, round: round.toString() },
      },
      undefined,
      { shallow: true },
    );
  };

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) {
      handleContractError(error, 'verify_detail');
    }
    if (matrixError) {
      handleContractError(matrixError, 'verify_detail_matrix');
    }
  }, [error, matrixError]);

  // 提前计算验证矩阵数据（必须在组件顶层使用 useMemo）
  const matrixCalculations = useMemo(() => {
    if (!verificationMatrix || !verificationMatrix.verifiers || verificationMatrix.verifiers.length === 0) {
      return null;
    }

    const { verifiers, verifiees, scores } = verificationMatrix;

    // 计算每个被验证者（行动参与者）获得的总票数
    const verifieeeTotalScores = verifiees.map((_, verifieeIndex) => {
      return verifiers.reduce((total, _, verifierIndex) => {
        const score = scores[verifierIndex]?.[verifieeIndex];
        return total + (score !== undefined ? Number(score) : 0);
      }, 0);
    });

    // 创建被验证者索引数组并按总分从大到小排序
    const sortedVerifieeIndices = verifiees
      .map((_, index) => index)
      .sort((a, b) => verifieeeTotalScores[b] - verifieeeTotalScores[a]);

    // 计算每个验证者（列）的总票数
    const verifierTotalScores = verifiers.map((_, verifierIndex) => {
      return verifiees.reduce((total, _, verifieeIndex) => {
        const score = scores[verifierIndex]?.[verifieeIndex];
        return total + (score !== undefined ? Number(score) : 0);
      }, 0);
    });

    // 计算总票数（所有参与者得票数之和）
    const grandTotalVotes = verifieeeTotalScores.reduce((sum, score) => sum + score, 0);

    // 计算百分比的辅助函数
    const calculatePercentage = (verifierIndex: number, verifieeIndex: number): string => {
      const score = scores[verifierIndex]?.[verifieeIndex];
      const verifierTotalScore = verifierTotalScores[verifierIndex];

      if (score === undefined || verifierTotalScore === 0) {
        return '0%';
      }

      const percentage = (Number(score) / verifierTotalScore) * 100;
      return `${formatPercentage(percentage)}`;
    };

    return {
      verifiers,
      verifiees,
      scores,
      verifieeeTotalScores,
      sortedVerifieeIndices,
      verifierTotalScores,
      grandTotalVotes,
      calculatePercentage,
    };
  }, [verificationMatrix]);

  // 如果没有actionId，显示错误
  if (actionId === undefined) {
    return (
      <>
        <Header title="验证详情" showBackButton={true} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-red-500">参数错误：缺少行动ID参数</div>
          </div>
        </main>
      </>
    );
  }

  const renderVerificationMatrix = () => {
    if (isMatrixPending) {
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <LoadingIcon />
            <p className="mt-4 text-gray-600">正在加载验证矩阵数据...</p>
            {progress && progress.loadedVerifiers > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                <p>已加载 {progress.loadedVerifiers} 个验证者，请稍候...</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (matrixError) {
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center text-red-500">
            加载验证矩阵失败：{matrixError.message || '获取验证矩阵失败，请稍后重试'}
          </div>
        </div>
      );
    }

    // 如果没有计算结果，显示暂无数据
    if (!matrixCalculations) {
      return (
        <div className="bg-white rounded-lg p-8">
          <div className="text-center text-gray-600">暂无验证数据</div>
        </div>
      );
    }

    // 从预计算的结果中获取数据
    const {
      verifiers,
      verifiees,
      scores,
      verifieeeTotalScores,
      sortedVerifieeIndices,
      verifierTotalScores,
      grandTotalVotes,
      calculatePercentage,
    } = matrixCalculations;

    return (
      <>
        {/* 标题部分 */}
        <div className="bg-white rounded-lg mx-4 mb-4">
          <div className="px-4 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {selectedRound > 0 && (
                  <>
                    <LeftTitle title={`第 ${selectedRound.toString()} 轮验证明细`} />
                    <span className="text-sm text-greyscale-500 ml-2">(</span>
                    <ChangeRound
                      currentRound={
                        token && currentRound ? formatRoundForDisplay(currentRound - BigInt(2), token) : BigInt(0)
                      }
                      handleChangedRound={handleChangedRound}
                    />
                    <span className="text-sm text-greyscale-500">)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 表格外层包装器 - 严格控制宽度，防止影响页面 */}
        <div className="w-full max-w-full overflow-hidden px-4">
          {/* 表格容器 - 仅此处允许横向滚动，WebView优化 */}
          <div className="overflow-x-auto bg-white max-w-full table-container-webview">
            <table className="w-full min-w-[846px]" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th
                    className="border border-gray-300 p-2 bg-gray-50 sticky left-0 z-30"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '156px',
                      minWidth: '156px',
                      maxWidth: '156px',
                      backgroundColor: '#f9fafb',
                      boxShadow: '1px 0 0 0 #d1d5db',
                    }}
                  >
                    <div className="text-gray-600 mb-1 whitespace-nowrap" style={{ fontSize: '12px' }}>
                      <div className="flex items-center">
                        <span className="flex flex-col items-center mr-1">
                          <span className="text-xs text-gray-400 mt-[-2px]">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              className="inline"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 2v8M6 10l3-3M6 10L3 7"
                                stroke="#A3A3A3"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </span>
                        <span>行动参与者</span>
                        <span className="mx-1 text-gray-400">/</span>
                        <span className="flex flex-row items-center">
                          <span>验证者</span>
                          <span className="text-xs text-gray-400 ml-1">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              className="inline"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2 6h8M10 6l-3-3M10 6l-3 3"
                                stroke="#A3A3A3"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </span>
                      </div>
                    </div>
                  </th>
                  <th
                    className="border border-gray-300 p-2 bg-gray-50 sticky left-[156px] z-30"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '46px',
                      minWidth: '46px',
                      maxWidth: '46px',
                      backgroundColor: '#f9fafb',
                      boxShadow: '1px 0 0 0 #d1d5db',
                    }}
                  >
                    <div className="text-gray-600 mb-1 whitespace-nowrap" style={{ fontSize: '12px' }}>
                      得票
                      <br />
                      占比
                    </div>
                  </th>
                  {verifiers.map((verifier, index) => (
                    <th
                      key={`verifier-${index}`}
                      className="border border-gray-300 p-1 bg-gray-50"
                      style={{
                        WebkitTextSizeAdjust: '100%',
                        width: '148px',
                        minWidth: '148px',
                        maxWidth: '148px',
                      }}
                    >
                      <div>
                        <AddressWithCopyButton address={verifier} colorClassName="text-gray-700" />
                      </div>
                    </th>
                  ))}
                  {/* 总票数列 */}
                  <th
                    className="border border-gray-300 p-1 bg-gray-50"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '152px',
                      minWidth: '152px',
                      maxWidth: '152px',
                    }}
                  >
                    <div className="text-gray-600 text-sm font-medium">得票总数(占比)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVerifieeIndices.map((verifieeIndex, sortIndex) => {
                  const verifiee = verifiees[verifieeIndex];
                  return (
                    <tr key={`verifiee-${verifieeIndex}`}>
                      <td
                        className="border border-gray-300 p-2 bg-gray-50 sticky left-0 z-20"
                        style={{
                          WebkitTextSizeAdjust: '100%',
                          width: '156px',
                          minWidth: '156px',
                          maxWidth: '156px',
                          backgroundColor: '#f9fafb',
                          boxShadow: '1px 0 0 0 #d1d5db',
                        }}
                      >
                        <div style={{ fontSize: '12px' }}>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 font-mono min-w-[16px] mt-0.5">
                              {sortIndex + 1}.
                            </span>
                            <div className="flex-1">
                              {verifiee === ZERO_ADDRESS ? (
                                <span className="text-sm text-gray-700 font-medium">弃权票</span>
                              ) : (
                                <AddressWithCopyButton address={verifiee} colorClassName="text-gray-700" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="border border-gray-300 p-1 bg-gray-50 sticky left-[156px] z-20"
                        style={{
                          WebkitTextSizeAdjust: '100%',
                          width: '46px',
                          minWidth: '46px',
                          maxWidth: '46px',
                          backgroundColor: '#f9fafb',
                          boxShadow: '1px 0 0 0 #d1d5db',
                        }}
                      >
                        <div className="text-center">
                          <span className="text-xs font-bold text-gray-700">
                            {grandTotalVotes > 0
                              ? formatPercentage((verifieeeTotalScores[verifieeIndex] / grandTotalVotes) * 100)
                              : '0%'}
                          </span>
                        </div>
                      </td>
                      {verifiers.map((_, verifierIndex) => (
                        <td
                          key={`score-${verifierIndex}-${verifieeIndex}`}
                          className="border border-gray-300 p-1 text-center"
                          style={{
                            WebkitTextSizeAdjust: '100%',
                            width: '148px',
                            minWidth: '148px',
                            maxWidth: '148px',
                          }}
                        >
                          {scores[verifierIndex]?.[verifieeIndex] !== undefined ? (
                            <div>
                              <span className="text-sm font-mono whitespace-nowrap">
                                {formatTokenAmount(scores[verifierIndex][verifieeIndex])}
                              </span>
                              <span className="text-gray-500">
                                ({calculatePercentage(verifierIndex, verifieeIndex)})
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono whitespace-nowrap" style={{ fontSize: '14px' }}>
                              -
                            </span>
                          )}
                        </td>
                      ))}
                      {/* 总票数列 */}
                      <td
                        className="border border-gray-300 p-1 text-center bg-blue-50"
                        style={{
                          WebkitTextSizeAdjust: '100%',
                          width: '152px',
                          minWidth: '152px',
                          maxWidth: '152px',
                        }}
                      >
                        <div>
                          <span className="text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                            {formatTokenAmount(BigInt(verifieeeTotalScores[verifieeIndex]))}
                          </span>
                          <span className="text-blue-500">
                            (
                            {grandTotalVotes > 0
                              ? formatPercentage((verifieeeTotalScores[verifieeIndex] / grandTotalVotes) * 100)
                              : '0%'}
                            )
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* 汇总行 */}
                <tr className="">
                  <td
                    className="border border-gray-300 p-2 bg-blue-50 sticky left-0 z-20 font-bold"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '156px',
                      minWidth: '156px',
                      maxWidth: '156px',
                      backgroundColor: '#dbeafe',
                      boxShadow: '1px 0 0 0 #d1d5db',
                    }}
                  >
                    <div className="flex items-center justify-center gap-1 text-sm text-blue-600">
                      汇总 ({verifiees.length - 1} 个地址)
                      <InfoTooltip
                        title="最大激励地址数说明"
                        content={
                          <p className="leading-relaxed text-base">
                            每轮从所有参与行动的代币中，随机抽取
                            <span className="font-mono font-bold text-blue-600 mx-1 text-base">
                              {actionInfo?.body.maxRandomAccounts.toString()}
                            </span>
                            份代币，返回对应地址。若多份代币对应相同地址，则会合并为一个地址。
                          </p>
                        }
                      />
                    </div>
                  </td>
                  <td
                    className="border border-gray-300 p-1 bg-blue-50 sticky left-[156px] z-20 font-bold"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '46px',
                      minWidth: '46px',
                      maxWidth: '46px',
                      backgroundColor: '#dbeafe',
                      boxShadow: '1px 0 0 0 #d1d5db',
                    }}
                  >
                    <div className="text-center text-xs text-blue-600">100%</div>
                  </td>
                  {verifiers.map((verifier, verifierIndex) => {
                    // 使用预计算的验证者总票数
                    const columnTotal = verifierTotalScores[verifierIndex];

                    // 计算百分比
                    const percentage = grandTotalVotes > 0 ? (columnTotal / grandTotalVotes) * 100 : 0;

                    return (
                      <td
                        key={`summary-${verifierIndex}`}
                        className="border border-gray-300 p-1 text-center bg-blue-50"
                        style={{
                          WebkitTextSizeAdjust: '100%',
                          width: '148px',
                          minWidth: '148px',
                          maxWidth: '148px',
                        }}
                      >
                        <div>
                          <span className="text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                            {formatTokenAmount(BigInt(columnTotal))}
                          </span>
                          <span className="text-blue-500">({formatPercentage(percentage)})</span>
                        </div>
                      </td>
                    );
                  })}
                  {/* 总计列 */}
                  <td
                    className="border border-gray-300 p-1 text-center bg-blue-50"
                    style={{
                      WebkitTextSizeAdjust: '100%',
                      width: '152px',
                      minWidth: '152px',
                      maxWidth: '152px',
                    }}
                  >
                    <div>
                      <span className="text-sm font-mono font-bold text-blue-600 whitespace-nowrap">
                        {formatTokenAmount(BigInt(grandTotalVotes))}
                      </span>
                      <span className="text-blue-500">(100%)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="bg-white mx-4 mt-4 rounded-lg">
          <div className="px-4 py-3 text-xs text-gray-500">
            <p className="md:hidden text-blue-600">• 手机端请左右滑动表格查看完整内容</p>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <Header title="验证详情" showBackButton={true} />
      <div className="flex-grow">
        {/* 头部信息 - 保持padding */}
        <div className="px-4 pt-0 pb-3">
          {actionInfo && (
            <ActionHeader
              actionInfo={actionInfo}
              participantCount={participantCount}
              totalAmount={totalAmount}
              isJoined={isJoined}
              isPending={isPending}
              showActionButtons={false}
              linkToActionInfo={true}
            />
          )}
        </div>

        {/* 主要内容 - 表格突破padding限制 */}
        {isPending ? (
          <div className="px-4">
            <div className="bg-white rounded-lg p-8">
              <div className="text-center">
                <LoadingIcon />
                <p className="mt-4 text-gray-600">加载数据中...</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="px-4">
            <div className="bg-white rounded-lg p-8">
              <div className="text-center text-red-500">
                加载失败：{error.message || '获取行动信息失败，请稍后重试'}
              </div>
            </div>
          </div>
        ) : actionInfo ? (
          renderVerificationMatrix()
        ) : (
          <div className="px-4">
            <div className="bg-white rounded-lg p-8">
              <div className="text-center text-yellow-600">行动不存在：找不到指定的行动信息</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerifyDetailPage;
