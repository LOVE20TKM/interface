'use client';

import { useRouter } from 'next/router';
import Header from '@/src/components/Header';
import ExtensionDeploy from '@/src/components/Extension/Base/Center/ExtensionDeploy';

/**
 * 扩展部署页面
 *
 * 功能：
 * - 从 URL 参数获取工厂地址（factory）
 * - 调用 ExtensionDeploy 组件处理具体的部署逻辑
 */
export default function DeployExtension() {
  const router = useRouter();
  const { factory } = router.query;

  return (
    <>
      <Header title="部署扩展行动" showBackButton={true} />
      <main className="flex-grow container mx-auto px-2 py-6 max-w-2xl">
        <ExtensionDeploy factoryAddress={(factory as string) || ''} />
      </main>
    </>
  );
}
