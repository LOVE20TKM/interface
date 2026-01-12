'use client';

import Header from '@/src/components/Header';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getExtensionConfigs } from '@/src/config/extensionConfig';

/**
 * 扩展工厂列表页面
 *
 * 显示当前代币支持的所有扩展工厂类型
 */
export default function ExtensionFactoriesPage() {
  // 从配置文件获取工厂列表
  const configs = getExtensionConfigs();

  if (configs.length === 0) {
    return (
      <>
        <Header title="扩展类别" />
        <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">扩展工厂列表</h2>
            </div>
            <p className="text-center text-greyscale-500 py-8">暂无类别</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="扩展类别" />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">创建普通行动：</h2>
          </div>
          <div className="space-y-3 text-center">
            <Link href={`/action/new/`}>
              <Button variant="outline" size="default" className="w-1/2 text-secondary border-secondary">
                <span className="text-secondary">创建行动 &gt;&gt;</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">创建扩展行动：</h2>
          </div>
          <div className="space-y-3">
            {configs.map((config) => {
              return (
                <div
                  key={config.factoryAddress}
                  className="flex flex-col py-2 px-3 border border-greyscale-200 rounded-lg gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base text-greyscale-900 font-bold">{config.name}</span>
                    <Link href={`/extension/deploy?factory=${config.factoryAddress}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-secondary text-secondary hover:text-secondary-foreground"
                      >
                        创建行动 &gt;&gt;
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-greyscale-500">扩展工厂合约：</span>
                    <AddressWithCopyButton address={config.factoryAddress} showAddress={true} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
