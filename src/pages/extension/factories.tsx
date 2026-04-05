'use client';

import Header from '@/src/components/Header';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const activeConfigs = configs.filter((config) => !config.isDeprecated);
  const deprecatedConfigs = configs.filter((config) => config.isDeprecated);

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
        {activeConfigs.length > 0 && (
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">发起扩展行动：</h2>
            </div>
            <div className="space-y-3">
              {activeConfigs.map((config) => {
                const actionButton = (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-secondary text-secondary hover:text-secondary-foreground"
                  >
                    发起行动 &gt;&gt;
                  </Button>
                );

                return (
                  <div
                    key={config.factoryAddress}
                    className="flex flex-col py-2 px-3 border border-greyscale-200 rounded-lg gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base text-greyscale-900 font-bold">{config.name}</span>
                        {config.versionLabel && <Badge variant="outline">{config.versionLabel}</Badge>}
                      </div>
                      <Link href={`/extension/deploy?factory=${config.factoryAddress}`}>{actionButton}</Link>
                    </div>
                    {config.description && <div className="text-sm text-greyscale-500">{config.description}</div>}
                    <div className="flex items-center">
                      <span className="text-sm text-greyscale-500">扩展工厂合约：</span>
                      <AddressWithCopyButton address={config.factoryAddress} showAddress={true} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">发起普通行动：</h2>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col py-2 px-3 border border-greyscale-200 rounded-lg gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base text-greyscale-900 font-bold">普通行动</span>
                </div>
                <Link href={`/action/new/`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-secondary text-secondary hover:text-secondary-foreground"
                  >
                    发起行动 &gt;&gt;
                  </Button>
                </Link>
              </div>
              <div className="text-sm text-greyscale-500">
                基于参与行动的代币数，随机抽取地址，治理者基于行动规则验证来分配激励
              </div>
            </div>
          </div>
        </div>
        {deprecatedConfigs.length > 0 && (
          <div className="space-y-4 mt-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">不推荐使用的扩展行动：</h2>
            </div>
            <div className="space-y-3">
              {deprecatedConfigs.map((config) => (
                <div
                  key={config.factoryAddress}
                  className="flex flex-col py-2 px-3 border border-greyscale-200 rounded-lg gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base text-greyscale-900 font-bold">{config.name}</span>
                      {config.versionLabel && <Badge variant="outline">{config.versionLabel}</Badge>}
                      <Badge variant="outline">不推荐</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={true}
                      className="border-greyscale-300 text-greyscale-400"
                    >
                      发起行动 &gt;&gt;
                    </Button>
                  </div>
                  {config.description && <div className="text-sm text-greyscale-500">{config.description}</div>}
                  <div className="flex items-center">
                    <span className="text-sm text-greyscale-500">扩展工厂合约：</span>
                    <AddressWithCopyButton address={config.factoryAddress} showAddress={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
