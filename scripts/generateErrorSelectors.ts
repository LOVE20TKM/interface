/**
 * 从 ABI 文件生成错误选择器映射
 *
 * 用法: yarn generate:errors
 *
 * 功能:
 * 1. 遍历 src/abis/*.ts 中所有 ABI 文件
 * 2. 提取 type === 'error' 的项
 * 3. 计算 4 字节选择器: keccak256(signature).slice(0, 10)
 * 4. 合并现有的中文消息映射
 * 5. 输出到 src/errors/unifiedErrorMap.ts
 * 6. 打印缺失翻译的错误，方便复制添加
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 工具函数
// ============================================================================

/**
 * keccak256 哈希实现
 */
function keccak256Hash(data: string): string {
  try {
    const { ethers } = require('ethers');
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
  } catch (error) {
    console.error('❌ 需要安装 ethers: npm install ethers');
    process.exit(1);
  }
}

/**
 * 生成错误签名
 * 例如: ErrorName() 或 ErrorName(uint256,address)
 */
function generateErrorSignature(item: any): string | null {
  if (item.type !== 'error') return null;
  const params = (item.inputs || []).map((input: any) => input.type).join(',');
  return `${item.name}(${params})`;
}

/**
 * 计算 4 字节选择器
 */
function calculateSelector(signature: string): string {
  const hash = keccak256Hash(signature);
  return hash.slice(0, 10); // 0x + 8 个十六进制字符
}

/**
 * 从 ABI TypeScript 文件中读取 ABI 数组
 */
function readAbiFromFile(filePath: string): any[] | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 提取 ABI 数组
    const match = content.match(/= \[([\s\S]*?)\] as const/);
    if (!match) return null;
    const abiString = '[' + match[1] + ']';
    const abi = eval('(' + abiString + ')');
    return abi;
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`);
    return null;
  }
}

/**
 * 获取所有 ABI 文件
 */
function getAllAbiFiles(): Array<{ name: string; path: string }> {
  const abiDir = path.join(__dirname, '../src/abis');
  const files = fs.readdirSync(abiDir);
  return files
    .filter((file: string) => file.endsWith('.ts'))
    .map((file: string) => ({
      name: file.replace('.ts', ''),
      path: path.join(abiDir, file),
    }));
}

// ============================================================================
// 读取现有错误映射
// ============================================================================

/**
 * 读取现有的 *ErrorsMap.ts 文件，合并所有中文消息
 */
function loadExistingErrorMessages(): Record<string, string> {
  const errorsDir = path.join(__dirname, '../src/errors');
  const messages: Record<string, string> = {};

  // 读取所有 *ErrorsMap.ts 文件
  const files = fs.readdirSync(errorsDir).filter((f: string) => f.endsWith('ErrorsMap.ts'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(errorsDir, file), 'utf8');
      // 匹配 key: 'value' 或 key: "value" 格式
      const regex = /(\w+):\s*['"](.+?)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const [, key, value] = match;
        if (!messages[key]) {
          messages[key] = value;
        }
      }
    } catch (error) {
      console.warn(`⚠️ 读取 ${file} 失败`);
    }
  }

  // 尝试读取 errorMessages.ts（如果存在）
  const errorMessagesPath = path.join(errorsDir, 'errorMessages.ts');
  if (fs.existsSync(errorMessagesPath)) {
    try {
      const content = fs.readFileSync(errorMessagesPath, 'utf8');
      // 匹配 key: 'value'、key: "value" 或 key: `value` 格式
      // 分别处理三种引号类型以确保正确匹配

      // 1. 匹配单引号字符串
      const singleQuoteRegex = /(\w+):\s*'((?:[^'\\]|\\.)*)'/g;
      let match;
      while ((match = singleQuoteRegex.exec(content)) !== null) {
        const [, key, value] = match;
        messages[key] = value.replace(/\\(.)/g, '$1');
      }

      // 2. 匹配双引号字符串
      const doubleQuoteRegex = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
      while ((match = doubleQuoteRegex.exec(content)) !== null) {
        const [, key, value] = match;
        messages[key] = value.replace(/\\(.)/g, '$1');
      }

      // 3. 匹配反引号模板字符串（需要特殊处理 ${...} 表达式）
      // 使用更智能的正则来匹配模板字符串，包括 ${...} 表达式
      // 策略：使用负向前瞻确保正确匹配到结束反引号，同时处理 ${...} 表达式
      const backtickRegex = /(\w+):\s*`((?:(?!`)[^\\]|\\.|\$\{[^}]*\})*)`/g;
      while ((match = backtickRegex.exec(content)) !== null) {
        const [, key, value] = match;
        // 处理转义字符，但保留 ${...} 表达式
        // 注意：模板字符串中的 ${...} 不需要转义，所以直接保留
        const unescapedValue = value.replace(/\\(.)/g, (_, char) => {
          if (char === 'n') return '\n';
          if (char === 't') return '\t';
          if (char === 'r') return '\r';
          if (char === '`') return '`';
          if (char === '\\') return '\\';
          return char;
        });
        messages[key] = unescapedValue; // errorMessages.ts 优先级更高，覆盖之前的
      }
    } catch (error) {
      console.warn('⚠️ 读取 errorMessages.ts 失败');
    }
  }

  return messages;
}

// ============================================================================
// 主程序
// ============================================================================

interface ErrorInfo {
  name: string;
  selector: string;
  signature: string;
  contracts: string[];
}

function generateErrorSelectors() {
  console.log('\n📋 生成错误选择器映射\n');
  console.log('='.repeat(80));

  // 收集所有错误
  const selectorErrorMap = new Map<string, ErrorInfo>();
  const nameErrorMap = new Map<string, ErrorInfo>();
  const abiFiles = getAllAbiFiles();

  for (const { name: contractName, path: filePath } of abiFiles) {
    const abi = readAbiFromFile(filePath);
    if (!abi) continue;

    for (const item of abi) {
      if (item.type === 'error') {
        const signature = generateErrorSignature(item);
        if (!signature) continue;

        const selector = calculateSelector(signature);
        const errorName = item.name;

        if (selectorErrorMap.has(signature)) {
          // 同签名错误，添加合约来源
          const existing = selectorErrorMap.get(signature)!;
          if (!existing.contracts.includes(contractName)) {
            existing.contracts.push(contractName);
          }
        } else {
          selectorErrorMap.set(signature, {
            name: errorName,
            selector,
            signature,
            contracts: [contractName],
          });
        }

        if (nameErrorMap.has(errorName)) {
          const existing = nameErrorMap.get(errorName)!;
          if (!existing.contracts.includes(contractName)) {
            existing.contracts.push(contractName);
          }
        } else {
          nameErrorMap.set(errorName, {
            name: errorName,
            selector,
            signature,
            contracts: [contractName],
          });
        }
      }
    }
  }

  console.log(
    `✅ 从 ${abiFiles.length} 个 ABI 文件中提取了 ${selectorErrorMap.size} 个错误签名、${nameErrorMap.size} 个错误名称\n`,
  );

  // 读取现有中文消息
  const existingMessages = loadExistingErrorMessages();
  console.log(`✅ 从现有文件中读取了 ${Object.keys(existingMessages).length} 条中文翻译\n`);

  // 找出缺失翻译的错误
  const missingTranslations: string[] = [];
  for (const [errorName] of nameErrorMap) {
    if (!existingMessages[errorName]) {
      missingTranslations.push(errorName);
    }
  }

  // 生成 errorMessages.ts（如果不存在）
  const errorMessagesPath = path.join(__dirname, '../src/errors/errorMessages.ts');
  if (!fs.existsSync(errorMessagesPath)) {
    generateErrorMessagesFile(nameErrorMap, existingMessages, errorMessagesPath);
  }

  // 生成 unifiedErrorMap.ts
  generateUnifiedErrorMapFile(selectorErrorMap, nameErrorMap, existingMessages);

  // 打印缺失翻译的错误
  if (missingTranslations.length > 0) {
    console.log('='.repeat(80));
    console.log('\n⚠️ 以下错误缺少中文翻译，请添加到 src/errors/errorMessages.ts：\n');
    console.log('  // 缺失翻译的错误');
    for (const name of missingTranslations.sort()) {
      console.log(`  ${name}: '${name}',`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n✅ 生成完成!\n');
}

/**
 * 生成 errorMessages.ts 文件
 */
function generateErrorMessagesFile(
  errorMap: Map<string, ErrorInfo>,
  existingMessages: Record<string, string>,
  outputPath: string,
) {
  const lines: string[] = [
    '/**',
    ' * 错误名称 -> 中文消息映射',
    ' * ',
    ' * 手动维护此文件，添加新错误的中文翻译',
    ' * 运行 yarn generate:errors 后，查看控制台输出的缺失翻译列表',
    ' */',
    '',
    'export const ErrorMessages: Record<string, string> = {',
  ];

  // 按错误名称排序
  const sortedErrors = Array.from(errorMap.keys()).sort();

  for (const errorName of sortedErrors) {
    const message = existingMessages[errorName] || errorName;
    lines.push(`  ${errorName}: '${message}',`);
  }

  lines.push('};');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`✅ 已生成: ${outputPath}\n`);
}

/**
 * 格式化消息字符串，如果包含 ${...} 表达式则使用反引号，否则使用单引号
 */
function formatMessageString(message: string): string {
  // 检测是否包含 ${...} 表达式
  const hasTemplateExpression = /\$\{[^}]+\}/.test(message);

  if (hasTemplateExpression) {
    // 使用反引号，转义反引号和反斜杠
    const escapedMessage = message.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    return `\`${escapedMessage}\``;
  } else {
    // 使用单引号，转义单引号
    const escapedMessage = message.replace(/'/g, "\\'");
    return `'${escapedMessage}'`;
  }
}

/**
 * 生成 unifiedErrorMap.ts 文件
 */
function generateUnifiedErrorMapFile(
  selectorErrorMap: Map<string, ErrorInfo>,
  nameErrorMap: Map<string, ErrorInfo>,
  messages: Record<string, string>,
) {
  const outputPath = path.join(__dirname, '../src/errors/unifiedErrorMap.ts');

  const lines: string[] = [
    '/**',
    ' * 统一错误映射',
    ' * ',
    ' * 此文件由 scripts/generateErrorSelectors.ts 自动生成',
    ' * 请勿手动修改，如需添加中文翻译请修改 errorMessages.ts',
    ' */',
    '',
    '// 错误定义接口',
    'export interface ErrorDef {',
    '  name: string;',
    '  message: string;',
    '}',
    '',
    '// 选择器 -> 错误定义（用于 0x 格式错误）',
    'export const ErrorsBySelector: Record<string, ErrorDef> = {',
  ];

  // 按选择器排序
  const sortedBySelector = Array.from(selectorErrorMap.values()).sort(
    (a, b) => a.selector.localeCompare(b.selector) || a.signature.localeCompare(b.signature),
  );

  for (const error of sortedBySelector) {
    const message = messages[error.name] || error.name;
    const formattedMessage = formatMessageString(message);
    lines.push(`  '${error.selector}': { name: '${error.name}', message: ${formattedMessage} },`);
  }

  lines.push('};');
  lines.push('');
  lines.push('// 错误名称 -> 错误定义（用于 ErrorName() 格式错误）');
  lines.push('export const ErrorsByName: Record<string, ErrorDef> = {');

  // 按错误名称排序
  const sortedByName = Array.from(nameErrorMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  for (const error of sortedByName) {
    const message = messages[error.name] || error.name;
    const formattedMessage = formatMessageString(message);
    lines.push(`  '${error.name}': { name: '${error.name}', message: ${formattedMessage} },`);
  }

  lines.push('};');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`✅ 已生成: ${outputPath}\n`);
}

// 运行主程序
generateErrorSelectors();
