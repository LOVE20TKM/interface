// 'use client';
// /**
//  * 表单: 选择要投票行动的列表
//  */

// import { useRouter } from 'next/router';
// import { toast } from 'react-hot-toast';
// import { UserPen } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import { useAccount } from 'wagmi';
// import Link from 'next/link';
// import React, { useContext, useEffect, useState } from 'react';

// // my hooks
// import { VotingAction } from '@/src/types/love20types';
// import { useVotingActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';

// // my utils
// import { useHandleContractError } from '@/src/lib/errorUtils';
// import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// // my contexts
// import { TokenContext } from '@/src/contexts/TokenContext';

// // my components
// import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
// import LeftTitle from '@/src/components/Common/LeftTitle';
// import LoadingIcon from '@/src/components/Common/LoadingIcon';

// interface VotingActionListProps {
//   currentRound: bigint;
// }

// const ActionListToVote: React.FC<VotingActionListProps> = ({ currentRound }) => {
//   const { address: account } = useAccount();
//   const { token } = useContext(TokenContext) || {};
//   const router = useRouter();

//   // 获取所有投票中的行动
//   const { votingActions, isPending, error } = useVotingActions(
//     (token?.address as `0x${string}`) || '',
//     currentRound,
//     account as `0x${string}`,
//   );

//   // 选择复选框
//   const [selectedActions, setSelectedActions] = useState<Set<bigint>>(new Set());
//   const handleCheckboxChange = (actionId: bigint) => {
//     setSelectedActions((prevSelected) => {
//       const newSelected = new Set(prevSelected);
//       if (newSelected.has(actionId)) {
//         newSelected.delete(actionId);
//       } else {
//         newSelected.add(actionId);
//       }
//       return newSelected;
//     });
//   };

//   // 计算投票总数： 累计
//   const totalVotes = votingActions.reduce((acc, votingAction) => acc + votingAction.votesNum, BigInt(0));

//   // 投票
//   const handleSubmit = () => {
//     const selectedIds = Array.from(selectedActions).join(',');
//     if (selectedIds.length === 0) {
//       toast.error('请选择行动');
//       return;
//     }
//     router.push(`/vote/vote?ids=${selectedIds}&symbol=${token?.symbol}`);
//   };

//   // 错误处理
//   const { handleContractError } = useHandleContractError();
//   useEffect(() => {
//     if (error) {
//       handleContractError(error, 'vote');
//     }
//   }, [error, handleContractError]);

//   // 加载中
//   if (isPending) {
//     return (
//       <div className="p-4 flex justify-center items-center">
//         <LoadingIcon />
//       </div>
//     );
//   }

//   if (!token) {
//     return <LoadingIcon />;
//   }

//   // // 如果只有1个投票，就直接跳到投票页面
//   // if (votingActions.length === 1) {
//   //   router.push(`/vote/vote?ids=${votingActions[0].action.head.id}&symbol=${token?.symbol}`);
//   // }

//   return (
//     <div className="p-4">
//       <div className="flex justify-between items-center mb-4">
//         <LeftTitle title="投票中的行动" />
//         {token && (
//           <div className="flex space-x-2">
//             <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
//               <Link href={`/action/new/?symbol=${token?.symbol}`}>推举新行动</Link>
//             </Button>
//             <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
//               <Link href={`/submit/actions?symbol=${token?.symbol}`}>推举历史行动</Link>
//             </Button>
//           </div>
//         )}
//       </div>
//       <div className="space-y-4">
//         {votingActions.length > 0 ? (
//           <>
//             {votingActions
//               .sort((a, b) => Number(b.votesNum - a.votesNum)) // 按投票数倒序排序
//               .map((votingAction: VotingAction, index: number) => {
//                 const action = votingAction.action;
//                 // const submitter = votingAction.submitter;

//                 return (
//                   <Card key={action.head.id} className="shadow-none flex items-center">
//                     <input
//                       type="checkbox"
//                       className="checkbox accent-secondary ml-2"
//                       checked={selectedActions.has(BigInt(action.head.id))}
//                       onChange={() => handleCheckboxChange(BigInt(action.head.id))}
//                     />
//                     <Link
//                       href={`/action/detail?id=${action.head.id}&type=vote&symbol=${token?.symbol}`}
//                       key={action.head.id}
//                       className="w-full"
//                     >
//                       <CardHeader className="px-3 pt-2 pb-1 flex-row justify-start items-baseline">
//                         <span className="text-greyscale-400 text-sm mr-1">{`No.`}</span>
//                         <span className="text-secondary text-xl font-bold mr-2">{String(action.head.id)}</span>
//                         <span className="font-bold text-greyscale-800">{`${action.body.title}`}</span>
//                       </CardHeader>
//                       <CardContent className="px-3 pt-1 pb-2">
//                         <div className="flex justify-between mt-1 text-sm">
//                           <span className="flex items-center">
//                             <UserPen className="text-greyscale-400 mr-1 h-3 w-3" />
//                             <span className="text-greyscale-400">
//                               <AddressWithCopyButton
//                                 address={action.head.author as `0x${string}`}
//                                 showCopyButton={false}
//                               />
//                             </span>
//                           </span>
//                           <span>
//                             <span className="text-greyscale-400 mr-1">投票数</span>
//                             <span className="text-secondary">{formatTokenAmount(votingAction.votesNum)}</span>
//                           </span>
//                           <span>
//                             <span className="text-greyscale-400 mr-1">占比</span>
//                             <span className="text-secondary">
//                               {totalVotes === BigInt(0)
//                                 ? '-'
//                                 : formatPercentage((Number(votingAction.votesNum) * 100) / Number(totalVotes))}
//                             </span>
//                           </span>
//                         </div>
//                       </CardContent>
//                     </Link>
//                   </Card>
//                 );
//               })}
//             <div className="flex justify-center mt-4">
//               <Button variant="outline" className="w-1/2 text-secondary border-secondary" onClick={handleSubmit}>
//                 给选中的行动投票
//               </Button>
//             </div>
//             <div className="mt-2 text-sm text-greyscale-500 text-center">提示: 每轮最大可投票数，等于您的治理票数</div>
//           </>
//         ) : (
//           <div className="text-center mt-8">
//             <div className="text-base text-greyscale-500 mb-4">还没有推举行动，请先推举！</div>
//             <Button asChild>
//               <Link href={`/submit/actions?symbol=${token?.symbol}`}>去推举行动</Link>
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ActionListToVote;
