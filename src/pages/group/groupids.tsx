/**
 * 链群 NFT 管理页面
 */

'use client';

// my components
import Header from '@/src/components/Header';
import MyGroups from '@/src/components/Extension/Base/Group/MyGroups';

export default function GroupPage() {
  return (
    <>
      <Header title="我的链群NFT" showBackButton={true} />
      <main className="flex-grow px-2 sm:px-0">
        <div className="w-full max-w-2xl mx-auto">
          <MyGroups />
        </div>
      </main>
    </>
  );
}
