/**
 * 我的链群 NFT 列表组件
 */

'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';

// my hooks
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useTotalSupply, useTotalBurnedForMint } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { formatTokenAmount } from '@/src/lib/format';

// my components
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';

const FIRST_TOKEN_SYMBOL = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL as string;

export default function MyGroups() {
  const { address: account, isConnected } = useAccount();

  const { myGroups, balance, isPending, error } = useMyGroups(account);

  // 获取统计数据
  const { totalSupply } = useTotalSupply();
  const { totalBurnedForMint } = useTotalBurnedForMint();

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
      <div className="px-2 mt-4">
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
      {/* 统计信息提示框 */}
      <div className="bg-gray-100 rounded-lg p-3 mb-4 space-y-2">
        <div className="text-sm text-gray-600">
          社区共铸造 NFT：
          <span className="font-medium text-gray-800 ml-1">
            {totalSupply !== undefined ? totalSupply.toString() : '...'} 个
          </span>
        </div>
        <div className="text-sm text-gray-600">
          累计销毁 {FIRST_TOKEN_SYMBOL} 代币：
          <span className="font-medium text-gray-800 ml-1">
            {totalBurnedForMint !== undefined ? formatTokenAmount(totalBurnedForMint) : '...'}
          </span>
        </div>
      </div>

      {/* LeftTitle 和铸造链接 */}
      <div className="flex items-center justify-between mb-4">
        <LeftTitle title="我的链群NFT" />
        <Link href="/group/mint" className="text-sm text-secondary hover:underline">
          铸造链群 NFT &gt;&gt;
        </Link>
      </div>

      <div className="mb-4">
        {balance > 3 && (
          <>
            <span className="text-gray-500 mr-1">数量:</span>
            <span className="font-mono text-secondary">{balance?.toString() || '0'}</span>
          </>
        )}
      </div>

      {myGroups.length === 0 ? (
        <div className="text-center text-sm text-greyscale-500 p-8">
          <div className="mb-8">您还没有链群NFT</div>
          <Button variant="outline" className="w-1/2 text-secondary border-secondary" asChild>
            <Link href="/group/mint">去铸造NFT &gt;&gt;</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-2 text-left">ID</th>
                <th className="px-2 text-left">名称</th>
                <th className="pr-6 text-right w-auto">操作</th>
              </tr>
            </thead>
            <tbody>
              {myGroups.map((group) => (
                <tr key={group.tokenId.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 font-mono text-secondary">{group.tokenId.toString()}</td>
                  <td className="px-2">
                    <span className="font-medium">{group.groupName}</span>
                  </td>
                  <td className="px-2 text-right w-auto">
                    <Button variant="outline" size="sm" className="text-secondary border-secondary" asChild>
                      <Link href={`/group/transfer?tokenId=${group.tokenId.toString()}`}>转让</Link>
                    </Button>
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
