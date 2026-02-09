/**
 * 扩展类型枚举
 */
export enum ExtensionType {
  GROUP_ACTION = 'GROUP_ACTION',
  GROUP_SERVICE = 'GROUP_SERVICE',
  LP = 'LP',
}

/**
 * 标签显示条件类型
 * - 'always': 始终显示
 * - 'hasExtension': 当行动是扩展行动时显示
 * - 未来可扩展更多条件类型
 */
export type TabShowCondition = 'always' | 'hasExtension';

/**
 * 行动详情页标签配置接口
 */
export interface ActionTabConfig {
  key: string; // 标签唯一标识
  label: string; // 标签显示名称
  showCondition?: TabShowCondition; // 显示条件，默认为 'hasExtension'
}

/**
 * 扩展配置信息接口
 */
export interface ExtensionConfig {
  type: ExtensionType;
  name: string;
  factoryAddress: `0x${string}`;
  actionDetailTabs?: ActionTabConfig[]; // 行动详情页的标签配置
}

/**
 * 获取所有扩展配置列表
 */
export const getExtensionConfigs = (): ExtensionConfig[] => {
  const configs: ExtensionConfig[] = [];

  // // 链群行动 扩展配置
  // const groupActionFactory = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY;
  // if (groupActionFactory) {
  //   configs.push({
  //     type: ExtensionType.GROUP_ACTION,
  //     name: '链群行动',
  //     factoryAddress: groupActionFactory as `0x${string}`,
  //     actionDetailTabs: [
  //       { key: 'public', label: '链群公示', showCondition: 'hasExtension' },
  //       { key: 'group-manage', label: '我的链群', showCondition: 'hasExtension' },
  //     ],
  //   });
  // }

  // // 链群服务 扩展配置
  // const groupServiceFactory = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_SERVICE_FACTORY;
  // if (groupServiceFactory) {
  //   configs.push({
  //     type: ExtensionType.GROUP_SERVICE,
  //     name: '链群服务行动',
  //     factoryAddress: groupServiceFactory as `0x${string}`,
  //     actionDetailTabs: [
  //       { key: 'public', label: '激励公示', showCondition: 'hasExtension' },
  //       { key: 'addresses', label: '服务者', showCondition: 'hasExtension' },
  //     ],
  //   });
  // }

  // LP 扩展配置
  const stakeLpFactory = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_LP_FACTORY;
  if (stakeLpFactory) {
    configs.push({
      type: ExtensionType.LP,
      name: 'LP行动',
      factoryAddress: stakeLpFactory as `0x${string}`,
      actionDetailTabs: [{ key: 'public', label: 'LP公示', showCondition: 'hasExtension' }],
    });
  }

  return configs;
};

/**
 * Factory地址到扩展配置的映射（小写地址作为key）
 */
const getFactoryConfigMap = (): Map<string, ExtensionConfig> => {
  const map = new Map<string, ExtensionConfig>();
  const configs = getExtensionConfigs();

  configs.forEach((config) => {
    map.set(config.factoryAddress.toLowerCase(), config);
  });

  return map;
};

/**
 * 根据Factory地址获取扩展配置
 * @param factoryAddress - Factory合约地址
 * @returns 扩展配置信息，如果未找到则返回null
 */
export const getExtensionConfigByFactory = (factoryAddress: string): ExtensionConfig | null => {
  const map = getFactoryConfigMap();
  return map.get(factoryAddress.toLowerCase()) || null;
};

/**
 * 根据扩展类型获取配置
 * @param type - 扩展类型
 * @returns 扩展配置信息，如果未找到则返回null
 */
export const getExtensionConfigByType = (type: ExtensionType): ExtensionConfig | null => {
  const configs = getExtensionConfigs();
  return configs.find((config) => config.type === type) || null;
};

/**
 * 检查给定的Factory地址是否是已知的扩展
 * @param factoryAddress - Factory合约地址
 * @returns 如果是已知扩展返回true，否则返回false
 */
export const isKnownFactory = (factoryAddress: string): boolean => {
  return getExtensionConfigByFactory(factoryAddress) !== null;
};

/**
 * 获取Factory地址对应的扩展名称
 * @param factoryAddress - Factory合约地址
 * @returns 扩展名称，如果未找到返回默认值
 */
export const getFactoryName = (factoryAddress: string, defaultName: string = '未知类型'): string => {
  const config = getExtensionConfigByFactory(factoryAddress);
  return config?.name || defaultName;
};

/**
 * 获取Factory地址对应的扩展类型
 * @param factoryAddress - Factory合约地址
 * @returns 扩展类型，如果未找到返回null
 */
export const getFactoryType = (factoryAddress: string): ExtensionType | null => {
  const config = getExtensionConfigByFactory(factoryAddress);
  return config?.type || null;
};
