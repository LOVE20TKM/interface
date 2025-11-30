// components/Extension/Base/Center/FactoryList.tsx

import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getFactoryName } from '@/src/config/extensionConfig';

interface FactoryListProps {
  tokenAddress: `0x${string}`;
  factories?: `0x${string}`[];
  isPending: boolean;
}

/**
 * 工厂列表组件
 *
 * 显示当前代币支持的扩展工厂列表
 */
export default function FactoryList({ tokenAddress, factories, isPending }: FactoryListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">扩展工厂列表</h2>
          <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
            添加工厂
          </Link>
        </div>
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      </div>
    );
  }

  if (!factories || factories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">扩展工厂列表</h2>
          <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
            添加工厂
          </Link>
        </div>
        <p className="text-center text-greyscale-500 py-8">暂无类别</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">行动工厂</h2>
        <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
          添加工厂
        </Link>
      </div>
      <div className="space-y-3">
        {factories.map((factory) => {
          const factoryName = getFactoryName(factory);
          return (
            <div key={factory} className="flex flex-col py-2 px-3 border border-greyscale-200 rounded-lg gap-2">
              <div className="flex items-center justify-between">
                <span className="text-base text-greyscale-900 font-bold">{factoryName}</span>
                <Link href={`/extension/deploy?factory=${factory}`}>
                  <Button
                    variant="link"
                    size="sm"
                    className="border-secondary text-secondary hover:text-secondary-foreground px-0"
                  >
                    添加行动&gt;&gt;
                  </Button>
                </Link>
              </div>
              <div className="flex items-center">
                <AddressWithCopyButton address={factory} showAddress={true} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
