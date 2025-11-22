'use client';

import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FactoryListProps {
  tokenAddress: `0x${string}`;
  factories?: `0x${string}`[];
  isPending: boolean;
}

// 扩展类型名称配置
const FACTORY_NAMES: Record<string, string> = {
  [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_LP?.toLowerCase() || '']: '质押LP行动',
  // 未来添加新的扩展类型示例：
  // [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_XXX?.toLowerCase() || '']: 'XXX行动',
};

const getFactoryName = (factoryAddress: string): string => {
  return FACTORY_NAMES[factoryAddress.toLowerCase()] || '未知类型';
};

export default function FactoryList({ tokenAddress, factories, isPending }: FactoryListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">扩展行动类别</h2>
          <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
            添加类别
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
          <h2 className="text-xl font-semibold">扩展行动类别</h2>
          <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
            添加类别
          </Link>
        </div>
        <p className="text-center text-greyscale-500 py-8">暂无类别</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">扩展行动类别</h2>
        <Link href="/extension/addfactory" className="text-sm text-secondary hover:underline">
          添加类别
        </Link>
      </div>
      <div className="space-y-3">
        {factories.map((factory) => {
          const factoryName = getFactoryName(factory);
          return (
            <div
              key={factory}
              className="flex items-center justify-between py-2 px-3 border border-greyscale-200 rounded-lg gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AddressWithCopyButton address={factory} showAddress={true} />
                <span className="text-sm text-greyscale-900 font-medium">{factoryName}</span>
              </div>
              <Link href={`/extension/deployExtension?factory=${factory}`}>
                <Button
                  variant="link"
                  size="sm"
                  className="border-secondary text-secondary hover:text-secondary-foreground px-0"
                >
                  部署扩展行动合约&gt;&gt;
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
