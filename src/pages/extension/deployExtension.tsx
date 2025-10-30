'use client';

import { useRouter } from 'next/router';
import Header from '@/src/components/Header';
import StakeLpExtensionForm from '@/src/components/ActionExtension/StakeLpExtensionForm';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';

// ====================================
// 扩展类型组件映射
// ====================================

/**
 * 工厂地址到组件的映射
 * 当添加新的扩展类型时，在这里添加映射关系
 */
const FACTORY_COMPONENTS: Record<string, React.ComponentType<{ factoryAddress: `0x${string}` }>> = {
  [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP?.toLowerCase() || '']: StakeLpExtensionForm,
  // 未来添加新的扩展类型示例：
  // [process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_XXX?.toLowerCase() || '']: XxxExtensionForm,
};

/**
 * 获取工厂对应的表单组件
 */
const getFactoryComponent = (factoryAddress: string): React.ComponentType<{ factoryAddress: `0x${string}` }> | null => {
  return FACTORY_COMPONENTS[factoryAddress.toLowerCase()] || null;
};

// ====================================
// 主组件
// ====================================

export default function DeployExtension() {
  const router = useRouter();
  const { factory } = router.query;

  // 工厂地址
  const factoryAddress = (factory as string) || '';

  // 获取对应的表单组件
  const FormComponent = factoryAddress ? getFactoryComponent(factoryAddress) : null;

  // ====================================
  // 渲染
  // ====================================

  return (
    <>
      <Header title="部署扩展行动" showBackButton={true} />
      <main className="flex-grow container mx-auto px-4 py-6 max-w-2xl">
        {/* 加载中状态 */}
        {!factory && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingIcon />
            <p className="text-greyscale-500 mt-4">加载中...</p>
          </div>
        )}

        {/* 未找到对应的工厂组件 */}
        {factory && !FormComponent && (
          <div className="text-center py-12">
            <p className="text-greyscale-500 mb-4">该扩展类型暂不支持</p>
            <p className="text-sm text-greyscale-400 mb-6">工厂地址: {factoryAddress}</p>
            <Button variant="outline" onClick={() => router.back()}>
              返回
            </Button>
          </div>
        )}

        {/* 渲染对应的表单组件 */}
        {factory && FormComponent && <FormComponent factoryAddress={factoryAddress as `0x${string}`} />}
      </main>
    </>
  );
}
