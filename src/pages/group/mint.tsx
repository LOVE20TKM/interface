/**
 * 铸造 LOVE20 NFT 页面
 */

'use client';

// my components
import Header from '@/src/components/Header';
import MintGroup from '@/src/components/Extension/Base/Group/MintGroup';

export default function MintPage() {
  return (
    <>
      <Header title="铸造NFT" showBackButton={true} />
      <main className="flex-grow px-3 sm:px-0">
        <div className="w-full max-w-2xl mx-auto">
          <MintGroup />
        </div>
      </main>
    </>
  );
}
