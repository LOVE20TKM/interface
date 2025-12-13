// components/Extension/Base/Center/ExtensionDeploy.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';

// my config
import { ExtensionType, getExtensionConfigByFactory } from '@/src/config/extensionConfig';

// my components
import LpDeploy from '@/src/components/Extension/Plugins/Lp/LpDeploy';
import GroupActionDeploy from '@/src/components/Extension/Plugins/Group/GroupActionDeploy';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface ExtensionDeployProps {
  factoryAddress: `0x${string}` | string;
}

/**
 * 扩展部署路由组件
 *
 * 功能：
 * 1. 根据工厂地址（factory）识别扩展类型
 * 2. 路由到对应扩展类型的部署组件
 * 3. 处理未知扩展类型的情况
 *
 * 扩展方式：
 * - 添加新的扩展类型时，在 extensionConfig 中注册
 * - 在此组件中添加对应的类型判断和组件渲染逻辑
 */
const ExtensionDeploy: React.FC<ExtensionDeployProps> = ({ factoryAddress }) => {
  const router = useRouter();

  // 如果没有提供工厂地址，显示加载状态
  if (!factoryAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingIcon />
        <p className="text-greyscale-500 mt-4">加载中...</p>
      </div>
    );
  }

  // 获取扩展配置
  const extensionConfig = getExtensionConfigByFactory(factoryAddress as `0x${string}`);

  // 如果是未知的扩展类型，显示提示信息
  if (!extensionConfig) {
    return (
      <div className="text-center py-12">
        <p className="text-greyscale-500 mb-4">该扩展类型暂不支持</p>
        <p className="text-sm text-greyscale-400 mb-6">工厂地址: {factoryAddress}</p>
        <Button variant="outline" onClick={() => router.back()}>
          返回
        </Button>
      </div>
    );
  }

  // 根据扩展类型渲染对应的部署组件
  switch (extensionConfig.type) {
    case ExtensionType.LP:
      return <LpDeploy factoryAddress={factoryAddress as `0x${string}`} />;

    case ExtensionType.GROUP_ACTION:
      return <GroupActionDeploy factoryAddress={factoryAddress as `0x${string}`} />;

    // 未来添加新的扩展类型时，在这里添加对应的 case
    // case ExtensionType.XXXX:
    //   return <XxxxDeploy factoryAddress={factoryAddress} />;

    default:
      return (
        <div className="text-center py-12">
          <p className="text-greyscale-500 mb-4">该扩展类型暂不支持</p>
          <p className="text-sm text-greyscale-400 mb-6">工厂地址: {factoryAddress}</p>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      );
  }
};

export default ExtensionDeploy;
