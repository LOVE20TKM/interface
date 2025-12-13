# 一、扩展协议相关界面

## 1.通用部署页面

## 2.通用行动页面(调用 center 合约，以及 ILOVE20Extension 中必须实现的接口)

- 进行中（可参与的）行动
- 我加入的行动
- 我的奖励（含铸造）
- 某个行动的奖励（含铸造）

## 3.扩展功能(调用 extension 的特殊接口)

- 行动公示
- 我的行动
- 加入行动
- 部署扩展协议

# 二、每个扩展行动要实现的组件

src/components/Extension/Plugins/{name}/{name}ActionPublicTabs.tsx : 行动公示内容
src/components/Extension/Plugins/{name}/{name}Deploy.tsx : 行动部署
src/components/Extension/Plugins/{name}/{name}JoinPanel.tsx : 加入行动
src/components/Extension/Plugins/{name}/{name}MyParticipation.tsx : 我的参与详情

# factory

## 1. 配置

- 在 .env 中配置：NEXT*PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY*{NAME}
- 在 src/config/extensionConfig.ts 中配置

## 2. 部署扩展组件

- 实现
- 配置：
  src/components/Extension/Base/Center/ExtensionDeploy.tsx

# 配置

行动公示：
src/components/Extension/Base/Action/ExtensionPublicTabs.tsx

加入行动：
src/components/Extension/Base/Action/ExtensionActionJoinPanel.tsx

我的参与：
src/components/Extension/Base/Action/ExtensionMyParticipation.tsx
