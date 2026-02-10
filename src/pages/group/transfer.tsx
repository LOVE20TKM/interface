/**
 * 链群 NFT 转移页面
 */

'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { safeToBigInt } from '@/src/lib/clientUtils';

// my components
import Header from '@/src/components/Header';
import GroupTransfer from '@/src/components/Extension/Base/Group/GroupTransfer';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

export default function GroupTransferPage() {
  const router = useRouter();
  const [tokenId, setTokenId] = useState<bigint | null>(null);

  // 从 URL query 参数获取 tokenId
  useEffect(() => {
    const { tokenId: tokenIdParam } = router.query;
    if (tokenIdParam) {
      try {
        const id = safeToBigInt(tokenIdParam);
        if (id !== undefined) {
          setTokenId(id);
        } else {
          console.error('无效的 tokenId 参数:', tokenIdParam);
        }
      } catch (error) {
        console.error('解析 tokenId 失败:', error);
      }
    }
  }, [router.query]);

  // 如果还没有获取到 tokenId，显示加载状态
  if (!tokenId) {
    return (
      <>
        <Header title="转让链群NFT" showBackButton={true} />
        <main className="flex-grow px-3 sm:px-0">
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex justify-center py-8">
              <LoadingIcon />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="转让链群NFT" showBackButton={true} />
      <main className="flex-grow px-3 sm:px-0">
        <div className="w-full max-w-2xl mx-auto">
          <GroupTransfer tokenId={tokenId} />
        </div>
      </main>
    </>
  );
}
