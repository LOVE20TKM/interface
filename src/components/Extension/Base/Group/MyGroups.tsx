/**
 * 我的链群 NFT 列表组件
 */

'use client';

import { useAccount } from 'wagmi';

// my hooks
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

export default function MyGroups() {
  const { address: account, isConnected } = useAccount();

  const { myGroups, balance, isPending, error } = useMyGroups(account);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center p-4 mt-4">
        <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 mt-4">
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>加载链群数据失败: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4">
      <LeftTitle title="我的链群ID" />

      <div className="mb-4">
        {balance > 3 && (
          <>
            <span className="text-gray-500 mr-1">数量:</span>
            <span className="font-mono text-secondary">{balance?.toString() || '0'}</span>
          </>
        )}
      </div>

      {myGroups.length === 0 ? (
        <div className="text-center text-sm text-greyscale-400 p-8">
          <div className="mb-2">您还没有链群 ID</div>
          <div className="text-xs">去铸造一个链群 ID 吧！</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-2 text-left">ID</th>
                <th className="px-2 text-left">名称</th>
              </tr>
            </thead>
            <tbody>
              {myGroups.map((group) => (
                <tr key={group.tokenId.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 font-mono text-secondary">{group.tokenId.toString()}</td>
                  <td className="px-2">
                    <span className="font-medium">{group.groupName}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
