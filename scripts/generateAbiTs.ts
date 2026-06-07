// src/scripts/generateAbiTs.ts
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 根据 NODE_ENV 确定加载哪个 .env 文件
const env = process.env.NODE_ENV || 'local';
const envFile = `.env.${env}`;

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const resolveAbiDirPath = (envKey: string) => {
  const configuredPath = process.env[envKey];
  if (!configuredPath) {
    console.error(`Error: ${envKey} is not defined in ${envFile}.`);
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), configuredPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: ${envKey} points to a missing path: ${resolvedPath}`);
    process.exit(1);
  }

  return resolvedPath;
};

// 源目录
const coreAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_CORE_ABI_PATH');
const peripheralAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_PERIPHERAL_ABI_PATH');
const groupAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_GROUP_ABI_PATH');
const extensionsCenterAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_EXTENSIONS_CENTER_ABI_PATH');
const extensionslpAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_EXTENSIONS_LP_ABI_PATH');
const extensionsGroupAbiDirPath = resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_EXTENSIONS_GROUP_ABI_PATH');
const groupChatAbiDirPath = process.env.NEXT_PUBLIC_FOUNDRY_GROUP_CHAT_ABI_PATH
  ? resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_GROUP_CHAT_ABI_PATH')
  : undefined;
const batchTransferAbiDirPath = process.env.NEXT_PUBLIC_FOUNDRY_BATCH_TRANSFER_ABI_PATH
  ? resolveAbiDirPath('NEXT_PUBLIC_FOUNDRY_BATCH_TRANSFER_ABI_PATH')
  : undefined;

// 指定要转换的文件名列表
const coreFilesToConvert = [
  'LOVE20Join',
  'LOVE20Launch',
  'LOVE20Mint',
  'LOVE20Random',
  'LOVE20SLToken',
  'LOVE20STToken',
  'LOVE20Stake',
  'LOVE20Submit',
  'LOVE20Token',
  'LOVE20Verify',
  'LOVE20Vote',
  'WETH9',
  'UniswapV2ERC20',
  'UniswapV2Factory',
  'UniswapV2Pair',
];

const peripheralFilesToConvert = ['LOVE20TokenViewer', 'LOVE20RoundViewer', 'LOVE20MintViewer', 'LOVE20Hub'];

const groupFilesToConvert = ['LOVE20Group', 'GroupDefaults'];

const extensionsCenterFilesToConvert = ['ExtensionCenter', 'IExtension', 'IReward', 'ExtensionFactoryBase'];

const extensionslpFilesToConvert = ['ExtensionLpFactory', 'ExtensionLp'];

const extensionsGroupFilesToConvert = [
  'ExtensionGroupAction',
  'ExtensionGroupService',
  'ExtensionGroupServiceFactory',
  'ExtensionGroupActionFactory',
  'GroupManager',
  'GroupJoin',
  'GroupVerify',
  'GroupRecipients',
];

const groupChatFilesToConvert = [
  'GroupChat',
  'GroupAdmin',
  'GroupBanList',
  'AdminBanSource',
  'GovVotedBanSource',
  'GroupMember',
  'GroupMemberScope',
  'GroupJoinScopeSource',
  'TokenMainManager',
  'TokenGovManager',
  'TokenActionMainManager',
  'TokenActionGovManager',
];

const batchTransferFilesToConvert = ['BatchTransfer'];

// 用于生成 TypeScript 文件的函数
const generateTsFiles = (abiDirPath: string, filesToConvert: string[]) => {
  filesToConvert.forEach((fileName) => {
    const abiJsonPath = path.resolve(abiDirPath, `${fileName}.sol/${fileName}.json`);
    const abiTsPath = path.resolve(__dirname, '../src/abis', `${fileName}.ts`);

    // 检查 ABI JSON 文件是否存在
    if (!fs.existsSync(abiJsonPath)) {
      console.error(`Error: ${abiJsonPath} does not exist.`);
      return;
    }

    // 读取并解析 ABI JSON 文件
    const abiJson = JSON.parse(fs.readFileSync(abiJsonPath, 'utf-8'));

    // 生成 TypeScript 文件的内容
    const content = `
import { Abi } from 'abitype';

export const ${fileName}Abi = ${JSON.stringify(abiJson.abi || abiJson, null, 2)} as const satisfies Abi;
`;

    // 将内容写入到 .ts 文件
    fs.writeFileSync(abiTsPath, content);

    console.log(`${fileName}.ts generated successfully.`);
  });
};

// 处理核心 ABI 文件
generateTsFiles(coreAbiDirPath, coreFilesToConvert);

// 处理外围 ABI 文件
generateTsFiles(peripheralAbiDirPath, peripheralFilesToConvert);

// 处理扩展中心 ABI 文件
generateTsFiles(extensionsCenterAbiDirPath, extensionsCenterFilesToConvert);

// 处理扩展质押 LP ABI 文件
generateTsFiles(extensionslpAbiDirPath, extensionslpFilesToConvert);

// 处理扩展链群 ABI 文件
generateTsFiles(extensionsGroupAbiDirPath, extensionsGroupFilesToConvert);

// 处理链群 NFT ABI 文件
generateTsFiles(groupAbiDirPath, groupFilesToConvert);

// 处理群聊 ABI 文件
if (groupChatAbiDirPath) {
  generateTsFiles(groupChatAbiDirPath, groupChatFilesToConvert);
}

// 处理批量转账 ABI 文件
if (batchTransferAbiDirPath) {
  generateTsFiles(batchTransferAbiDirPath, batchTransferFilesToConvert);
}
