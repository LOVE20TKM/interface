// 从 ABI 文件生成函数选择器列表
const fs = require('fs');
const path = require('path');

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
 * 生成函数签名
 */
function generateFunctionSignature(item: any): string | null {
  if (item.type !== 'function') return null;

  const params = item.inputs.map((input: any) => input.type).join(',');

  return `${item.name}(${params})`;
}

/**
 * 计算函数选择器
 */
function calculateSelector(signature: string): string {
  const hash = keccak256Hash(signature);
  return hash.slice(0, 10); // 0x + 8 个十六进制字符
}

/**
 * 从文件中读取 ABI
 */
function readAbiFromFile(filePath: string): any[] | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 提取 ABI 数组（使用正则表达式）
    const match = content.match(/= \[([\s\S]*?)\] as const/);
    if (!match) {
      return null;
    }

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

/**
 * 生成所有函数选择器列表
 */
function generateAllSelectors() {
  console.log('\n📋 生成函数选择器列表\n');
  console.log('='.repeat(80));

  const allSelectors: Array<{
    contract: string;
    functionName: string;
    signature: string;
    selector: string;
  }> = [];

  const abiFiles = getAllAbiFiles();

  for (const { name, path: filePath } of abiFiles) {
    const abi = readAbiFromFile(filePath);
    if (!abi) continue;

    for (const item of abi) {
      if (item.type === 'function') {
        const signature = generateFunctionSignature(item);
        if (signature) {
          const selector = calculateSelector(signature);
          allSelectors.push({
            contract: name,
            functionName: item.name,
            signature,
            selector,
          });
        }
      }
    }
  }

  // 按选择器排序
  allSelectors.sort((a, b) => a.selector.localeCompare(b.selector));

  console.log(`✅ 共找到 ${allSelectors.length} 个函数\n`);

  // 保存到文件
  const outputPath = path.join(__dirname, '../docs/function-selectors.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSelectors, null, 2));
  console.log(`✅ 已保存到: ${outputPath}\n`);

  console.log('='.repeat(80));
  console.log('\n💡 使用方法:');
  console.log('   在 docs/function-selectors.json 文件中搜索函数名或选择器即可\n');
  console.log('示例:');
  console.log('   cat docs/function-selectors.json | grep "mintActionReward"');
  console.log('   cat docs/function-selectors.json | grep "0x823ed39d"');
  console.log('='.repeat(80));
  console.log('');
}

// 主程序
generateAllSelectors();
