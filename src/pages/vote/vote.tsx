// 'use client';

// import { useState, useEffect, useContext } from 'react';
// import { useRouter } from 'next/router';
// import { useAccount } from 'wagmi';
// import { toast } from 'react-hot-toast';
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// // my hooks
// import { useCurrentRound, useVotesNumByAccount, useVote } from '@/src/hooks/contracts/useLOVE20Vote';
// import { useValidGovVotes } from '@/src/hooks/contracts/useLOVE20Stake';
// import { useActionInfosByIds } from '@/src/hooks/contracts/useLOVE20RoundViewer';
// import { useHandleContractError } from '@/src/lib/errorUtils';

// // my types & functions
// import { ActionInfo } from '@/src/types/love20types';
// import { formatTokenAmount } from '@/src/lib/format';

// // my contexts
// import { TokenContext } from '@/src/contexts/TokenContext';

// // my components
// import Header from '@/src/components/Header';
// import LoadingIcon from '@/src/components/Common/LoadingIcon';
// import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// const VotingSubmitPage = () => {
//   const { token } = useContext(TokenContext) || {};
//   const [percentages, setPercentages] = useState<{ [key: string]: number }>({});
//   const { address: account } = useAccount();
//   const { currentRound, isPending: isPendingCurrentRound, error: errCurrentRound } = useCurrentRound();

//   const router = useRouter();
//   const { ids } = router.query as { ids: string };
//   const [idList, setIdList] = useState<number[]>([]);

//   useEffect(() => {
//     if (ids) {
//       setIdList(ids.split(',').map((id: string) => parseInt(id, 10)));
//     }
//   }, [ids]);

//   useEffect(() => {
//     // 只在idList第一次设置时初始化percentages，避免覆盖用户的修改
//     if (idList.length > 0 && Object.keys(percentages).length === 0) {
//       if (idList.length === 1) {
//         setPercentages({ [idList[0]]: 100 });
//       } else {
//         const initialPercentages: { [key: number]: number } = {};
//         const equalPercentage = Math.floor(100 / idList.length);
//         idList.forEach((id, index) => {
//           if (index === idList.length - 1) {
//             initialPercentages[id] = 100 - equalPercentage * (idList.length - 1);
//           } else {
//             initialPercentages[id] = equalPercentage;
//           }
//         });
//         setPercentages(initialPercentages);
//       }
//     }
//   }, [idList, percentages]);

//   const handlePercentageChange = (actionId: string, value: number) => {
//     if (idList.length === 1) {
//       setPercentages({ [actionId]: value });
//       return;
//     }

//     const updatedPercentages = { ...percentages, [actionId]: value };
//     const otherIds = idList.slice(0, -1);
//     const total = otherIds.reduce((sum, id) => sum + (updatedPercentages[id] || 0), 0);

//     if (total > 100) {
//       toast.error('投票百分比之和不能超过100%');
//       return;
//     }

//     const lastId = idList[idList.length - 1];
//     updatedPercentages[lastId] = 100 - total;

//     setPercentages(updatedPercentages);
//   };

//   // 获取剩余票数
//   const {
//     validGovVotes,
//     isPending: isPendingValidGovVotes,
//     error: errorValidGovVotes,
//   } = useValidGovVotes(token?.address as `0x${string}`, account as `0x${string}`);
//   const {
//     votesNumByAccount,
//     isPending: isPendingVotesNumByAccount,
//     error: errorVotesNumByAccount,
//   } = useVotesNumByAccount(token?.address as `0x${string}`, currentRound, account as `0x${string}`);

//   // 获取行动列表
//   const actionIds = idList?.map((id: number) => BigInt(id)) || [];
//   const {
//     actionInfos,
//     isPending: isPendingActionInfosByIds,
//     error: errorActionInfosByIds,
//   } = useActionInfosByIds(token?.address as `0x${string}`, actionIds);

//   // 提交投票
//   const { vote, isPending, isConfirming, isConfirmed, writeError: submitVoteError } = useVote();

//   // 检查输入
//   const checkInput = () => {
//     // 检查剩余票数
//     if (validGovVotes - votesNumByAccount < BigInt(2)) {
//       toast.error('剩余票数不足，不能投票');
//       return false;
//     }

//     // percentages 百分比之和必须为100
//     const totalPercentage = Object.values(percentages).reduce((sum, percentage) => sum + percentage, 0);
//     if (idList.length > 1 && totalPercentage !== 100) {
//       toast.error('百分比之和必须为100');
//       return false;
//     }
//     return true;
//   };

//   // 提交投票
//   const handleSubmit = async () => {
//     if (!checkInput()) {
//       return;
//     }
//     // 计算每个action的投票数
//     const actionIds = idList.map((id) => BigInt(id));
//     const votes = idList.map((id) => {
//       const percentage = percentages[id] || 0;
//       return (BigInt(percentage) * (validGovVotes - votesNumByAccount)) / BigInt(100);
//     });

//     // 提交投票
//     try {
//       await vote(token?.address as `0x${string}`, actionIds, votes);
//     } catch (error) {
//       console.error('投票提交失败:', error);
//       toast.error('提交失败，请重试');
//     }
//   };

//   // 错误处理
//   const { handleContractError } = useHandleContractError();
//   useEffect(() => {
//     if (errCurrentRound) {
//       handleContractError(errCurrentRound, 'vote');
//     }
//     if (submitVoteError) {
//       handleContractError(submitVoteError, 'vote');
//     }
//     if (errorVotesNumByAccount) {
//       handleContractError(errorVotesNumByAccount, 'vote');
//     }
//     if (errorActionInfosByIds) {
//       handleContractError(errorActionInfosByIds, 'submit');
//     }
//     if (errorValidGovVotes) {
//       handleContractError(errorValidGovVotes, 'stake');
//     }
//   }, [errCurrentRound, submitVoteError, errorActionInfosByIds, errorValidGovVotes, errorVotesNumByAccount]);

//   // 提交成功
//   useEffect(() => {
//     if (isConfirmed && !submitVoteError) {
//       toast.success('提交成功', {
//         duration: 2000, // 2秒
//       });
//       setTimeout(() => {
//         router.push(`/vote/actions/?symbol=${token?.symbol}`);
//       }, 2000);
//     }
//   }, [isConfirmed, submitVoteError]);

//   useEffect(() => {
//     if (document.activeElement instanceof HTMLElement) {
//       document.activeElement.blur();
//     }
//   }, []);

//   return (
//     <>
//       <Header title="投票" />
//       <main className="flex-grow">
//         {!token || isPendingActionInfosByIds ? (
//           <LoadingIcon />
//         ) : (
//           <>
//             <div className="stats w-full">
//               <div className="stat place-items-center">
//                 <div className="stat-title text-sm">我的剩余票数</div>
//                 <div className="stat-value text-secondary mt-2">
//                   {isPendingValidGovVotes || isPendingVotesNumByAccount ? (
//                     <LoadingIcon />
//                   ) : (
//                     formatTokenAmount(validGovVotes - votesNumByAccount || BigInt(0))
//                   )}
//                 </div>
//                 <div className="stat-desc text-sm mt-2">
//                   如需更多票数，请先{' '}
//                   <Link href={`/gov/stakelp/?symbol=${token?.symbol}`} className="text-secondary">
//                     获取治理票
//                   </Link>
//                 </div>
//               </div>
//             </div>

//             {/* 行动列表 */}
//             <div className="px-4">
//               <div className="space-y-4">
//                 {actionInfos?.map((action: ActionInfo, index: number) => {
//                   const isLast = index === actionInfos.length - 1;
//                   const otherIds = idList.slice(0, -1);
//                   const total = otherIds.reduce((sum, id) => sum + (percentages[id] || 0), 0);
//                   const lastValue = 100 - total;

//                   return (
//                     <div key={action.head.id} className="p-4 rounded-lg mb-4 flex justify-between items-center">
//                       <Link
//                         href={`/action/detail?id=${action.head.id}&type=vote&symbol=${token.symbol}`}
//                         key={action.head.id}
//                         className="flex-grow"
//                       >
//                         <div className="font-semibold mb-2">
//                           <span className="text-greyscale-400 text-sm mr-1">{`No.${action.head.id}`}</span>
//                           <span className="text-greyscale-900">{`${action.body.title}`}</span>
//                         </div>
//                       </Link>
//                       <div className="flex items-center">
//                         <input
//                           type="number"
//                           min="1"
//                           max="100"
//                           value={
//                             idList.length === 1
//                               ? percentages[action.head.id.toString()] || 100
//                               : isLast
//                               ? lastValue
//                               : percentages[action.head.id.toString()] || ''
//                           }
//                           onChange={(e) => handlePercentageChange(action.head.id.toString(), Number(e.target.value))}
//                           className="p-2 border rounded w-16"
//                           disabled={idList.length > 1 && isLast}
//                           placeholder=""
//                         />
//                         %
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//               <div className="flex justify-center mt-4">
//                 <Button
//                   className="w-1/2 focus:outline-none focus:ring-0"
//                   onFocus={(e) => e.currentTarget.blur()}
//                   onClick={handleSubmit}
//                   disabled={isPending || isConfirming || isConfirmed}
//                 >
//                   {isPending ? '提交中...' : isConfirming ? '确认中...' : isConfirmed ? '已提交' : '提交投票'}
//                 </Button>
//               </div>
//             </div>
//             <div className="flex flex-col w-full p-4 mt-4">
//               <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 mb-8 text-sm">
//                 <div className="text-base font-bold text-greyscale-700 pb-1">注意：</div>
//                 <div className="text-sm text-greyscale-500 pb-1">1、每轮最大可投票数，等于您的治理票数；</div>
//                 <div className="text-sm text-greyscale-500 pb-1">2、APP帮您自动计算并提交100%票数；</div>
//                 <div className="text-sm text-greyscale-500 pb-1">
//                   3、投票时需持有完整数量的质押资产凭证：SL 类(流动性质押)、ST 类(代币质押)。
//                 </div>
//               </div>
//             </div>
//             <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
//           </>
//         )}
//       </main>
//     </>
//   );
// };

// export default VotingSubmitPage;
