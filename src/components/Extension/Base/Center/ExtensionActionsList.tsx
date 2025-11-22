'use client';

import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ExtensionActionData } from '@/src/hooks/extension/base/composite/useExtensionActions';

interface ExtensionActionsListProps {
  tokenAddress: `0x${string}`;
  extensionActionsData: ExtensionActionData[];
  isPending: boolean;
}

export default function ExtensionActionsList({
  tokenAddress,
  extensionActionsData,
  isPending,
}: ExtensionActionsListProps) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">扩展行动</h2>
          <Link href="/extension/initialize" className="text-sm text-blue-600 hover:underline">
            初始化扩展
          </Link>
        </div>
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      </div>
    );
  }

  if (!extensionActionsData || extensionActionsData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">扩展行动</h2>
          <Link href="/extension/initialize" className="text-sm text-secondary hover:underline">
            初始化扩展
          </Link>
        </div>
        <p className="text-center text-greyscale-500 py-8">暂无扩展行动</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">扩展行动列表</h2>
        <Link href="/extension/initialize" className="text-sm text-secondary hover:underline">
          初始化扩展
        </Link>
      </div>
      <div className="space-y-3">
        {extensionActionsData.map((item) => (
          <Card key={item.extensionAddress} className="shadow-none">
            <Link href={`/action/info?id=${item.actionId}&tab=public`} className="relative block">
              <CardHeader className="px-3 pt-2 pb-1 flex-row justify-between items-baseline">
                <div className="flex items-baseline">
                  <span className="text-greyscale-400 text-sm">No.</span>
                  <span className="text-secondary text-xl font-bold mr-2">{item.actionId.toString()}</span>
                  <span className="font-bold text-greyscale-800">{item.actionInfo?.body.title || '扩展行动'}</span>
                </div>
              </CardHeader>
              <CardContent className="px-3 pt-1 pb-2">
                <div className="flex items-center text-sm">
                  <span className="text-greyscale-400 mr-2">扩展合约:</span>
                  <AddressWithCopyButton address={item.extensionAddress} showAddress={true} showCopyButton={false} />
                </div>
              </CardContent>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-greyscale-400 pointer-events-none" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
