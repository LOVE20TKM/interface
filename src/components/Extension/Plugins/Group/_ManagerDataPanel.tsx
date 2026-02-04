// // components/Extension/Plugins/Group/_ManagerDataPanel.tsx
// // 服务者数据面板组件

// 'use client';

// // React
// import React, { useContext } from 'react';

// // 上下文
// import { TokenContext } from '@/src/contexts/TokenContext';

// // hooks
// import { AccountGroupInfo } from '@/src/hooks/extension/plugins/group/composite';

// // 工具函数
// import { formatTokenAmount } from '@/src/lib/format';

// // 组件
// import LeftTitle from '@/src/components/Common/LeftTitle';

// interface ManagerDataPanelProps {
//   groups: AccountGroupInfo[];
// }

// /**
//  * 服务者数据面板组件
//  *
//  * 功能：
//  * 1. 显示行动者参与总量（从所有链群汇总）
//  * 2. 显示链群数量
//  */
// const _ManagerDataPanel: React.FC<ManagerDataPanelProps> = ({ groups }) => {
//   const { token } = useContext(TokenContext) || {};

//   // 计算行动者参与总量（所有链群的 totalJoinedAmount 之和）
//   const totalJoinedAmount = groups.reduce((sum, group) => sum + group.totalJoinedAmount, BigInt(0));

//   // 链群数量
//   const groupCount = groups.length;

//   return (
//     <div>
//       <LeftTitle title="我的服务数据" />

//       {/* 行动者参与总量和链群数量 */}
//       <div className="stats w-full mt-2 grid grid-cols-2 bg-gray-50 rounded-lg pt-2 pb-1 border border-gray-200">
//         <div className="stat place-items-center p-1">
//           <div className="stat-title text-sm">行动者参与总量</div>
//           <div className="stat-value h-6 flex items-center">
//             <span className="text-xl text-secondary">{formatTokenAmount(totalJoinedAmount)}</span>
//           </div>
//           <div className="text-xs text-greyscale-500 mt-1">{token?.symbol}</div>
//         </div>
//         <div className="stat place-items-center p-1">
//           <div className="stat-title text-sm">链群数量</div>
//           <div className="stat-value h-6 flex items-center">
//             <span className="text-xl text-secondary">{groupCount}</span>
//           </div>
//           <div className="text-xs text-greyscale-500 mt-1">个链群</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default _ManagerDataPanel;
