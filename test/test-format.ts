// Help:
// npx tsx test/test-format.ts

// 完整的测试文件来测试 formatTokenAmount 函数
import { formatTokenAmount, RoundingMode } from '../src/lib/format';

// 测试结果记录
interface TestCase {
  name: string;
  input: bigint;
  maxDigits?: number;
  roundingMode?: RoundingMode;
  expected?: string;
  description: string;
}

let failureCount = 0;

// 简单的测试断言函数
function assertEqual(actual: string, expected: string, testName: string) {
  if (actual === expected) {
    console.log(`✅ ${testName}: ${actual}`);
  } else {
    failureCount++;
    console.log(`❌ ${testName}: 期望 "${expected}", 实际 "${actual}"`);
  }
}

// 运行单个测试用例
function runTest(testCase: TestCase) {
  const { name, input, maxDigits, roundingMode, expected, description } = testCase;
  const result = formatTokenAmount(input, maxDigits, roundingMode);

  console.log(`\n📋 ${name} (${description})`);
  console.log(`   输入: ${input.toString()} wei`);
  console.log(`   参数: maxDigits=${maxDigits ?? 4}, roundingMode=${roundingMode ?? 'floor'}`);
  console.log(`   结果: ${result}`);

  if (expected) {
    assertEqual(result, expected, name);
  }

  return result;
}

console.log('🚀 开始测试 formatTokenAmount 函数\n');
console.log('='.repeat(60));

// 1. 基础数值范围测试
console.log('\n📊 1. 基础数值范围测试');
const basicTests: TestCase[] = [
  {
    name: '大数值(>=1000)',
    input: BigInt('5432100000000000000000'), // 5432.1 ETH
    expected: '5,432',
    description: '大于1000的数值应该显示为整数',
  },
  {
    name: '中数值(>=10)',
    input: BigInt('123450000000000000000'), // 123.45 ETH
    expected: '123.45',
    description: '10-1000之间显示2位小数',
  },
  {
    name: '小数值(>=1)',
    input: BigInt('1234500000000000000'), // 1.2345 ETH
    expected: '1.2345',
    description: '1-10之间显示4位小数',
  },
  {
    name: '较小数值(>=0.001)',
    input: BigInt('1234500000000000'), // 0.0012345 ETH
    expected: '0.0012',
    description: '0.001-1之间显示4位小数',
  },
  {
    name: '极小数值(<0.001)',
    input: BigInt('123450000000000'), // 0.00012345 ETH
    expected: '0.0{3}1234',
    description: '小于0.001使用折叠显示，默认向下取整',
  },
];

basicTests.forEach(runTest);

// 2. 四舍五入 vs 向下取整对比测试
console.log('\n📊 2. 四舍五入 vs 向下取整对比测试');
const roundingTests: TestCase[] = [
  {
    name: '四舍五入-需要进位',
    input: BigInt('1234567800000000000'), // 1.2345678 ETH
    roundingMode: 'round',
    expected: '1.2346',
    description: '1.2345678应该四舍五入为1.2346',
  },
  {
    name: '向下取整-截断',
    input: BigInt('1234567800000000000'), // 1.2345678 ETH
    roundingMode: 'floor',
    expected: '1.2345',
    description: '1.2345678应该向下取整为1.2345',
  },
  {
    name: '四舍五入-边界值(5)',
    input: BigInt('1234550000000000000'), // 1.234555... ETH
    roundingMode: 'round',
    expected: '1.2346',
    description: '1.234555应该四舍五入为1.2346',
  },
  {
    name: '向下取整-边界值(5)',
    input: BigInt('1234550000000000000'), // 1.234555... ETH
    roundingMode: 'floor',
    expected: '1.2345',
    description: '1.234555应该向下取整为1.2345',
  },
  {
    name: '四舍五入-大数值',
    input: BigInt('1999999999999999999999'), // 1999.999... ETH
    roundingMode: 'round',
    expected: '2,000',
    description: '1999.999应该四舍五入为2000',
  },
  {
    name: '向下取整-大数值',
    input: BigInt('1999999999999999999999'), // 1999.999... ETH
    roundingMode: 'floor',
    expected: '1,999',
    description: '1999.999应该向下取整为1999',
  },
];

roundingTests.forEach(runTest);

// 3. 极小数值的四舍五入测试
console.log('\n📊 3. 极小数值的四舍五入测试');
const tinyNumberTests: TestCase[] = [
  {
    name: '极小数-四舍五入(需进位)',
    input: BigInt('123456000000000'), // 0.000123456 ETH
    roundingMode: 'round',
    expected: '0.0{3}1235',
    description: '0.000123456应该四舍五入为0.0{3}1235',
  },
  {
    name: '极小数-向下取整',
    input: BigInt('123456000000000'), // 0.000123456 ETH
    roundingMode: 'floor',
    expected: '0.0{3}1234',
    description: '0.000123456应该向下取整为0.0{3}1234',
  },
  {
    name: '极小数-进位到前一位',
    input: BigInt('999950000000000'), // 0.00099995 ETH
    roundingMode: 'round',
    expected: '0.0{2}1000',
    description: '0.00099995的四舍五入处理',
  },
  {
    name: '极小数-无进位',
    input: BigInt('999940000000000'), // 0.00099994 ETH
    roundingMode: 'round',
    expected: '0.0{3}9999', // 实际是 0.00099994，前导0有3个
    description: '0.00099994应该四舍五入，保持4位有效数字',
  },
];

tinyNumberTests.forEach(runTest);

// 4. 自定义小数位数测试
console.log('\n📊 4. 自定义小数位数测试');
const customDigitsTests: TestCase[] = [
  {
    name: '2位小数-四舍五入',
    input: BigInt('1234567800000000000'), // 1.2345678 ETH
    maxDigits: 2,
    roundingMode: 'round',
    expected: '1.23',
    description: '指定2位小数，四舍五入',
  },
  {
    name: '2位小数-向下取整',
    input: BigInt('1234567800000000000'), // 1.2345678 ETH
    maxDigits: 2,
    roundingMode: 'floor',
    expected: '1.23',
    description: '指定2位小数，向下取整',
  },
  {
    name: '6位小数-四舍五入',
    input: BigInt('1234567890000000000'), // 1.23456789 ETH
    maxDigits: 6,
    roundingMode: 'round',
    expected: '1.234568',
    description: '指定6位小数，四舍五入',
  },
  {
    name: '6位小数-向下取整',
    input: BigInt('1234567890000000000'), // 1.23456789 ETH
    maxDigits: 6,
    roundingMode: 'floor',
    expected: '1.234567',
    description: '指定6位小数，向下取整',
  },
  {
    name: '0位小数-整数',
    input: BigInt('1234567800000000000'), // 1.2345678 ETH
    maxDigits: 0,
    roundingMode: 'round',
    expected: '1',
    description: '指定0位小数，四舍五入到整数',
  },
];

customDigitsTests.forEach(runTest);

// 5. 边界值和特殊情况测试
console.log('\n📊 5. 边界值和特殊情况测试');
const edgeCaseTests: TestCase[] = [
  {
    name: '零值',
    input: BigInt(0),
    expected: '0',
    description: '零值应该显示为0',
  },
  {
    name: '极小值(小于10wei)',
    input: BigInt(9),
    expected: '0',
    description: '小于10wei应该显示为0',
  },
  {
    name: '边界值(10wei)',
    input: BigInt(10),
    description: '边界值10wei的处理',
  },
  {
    name: '1wei',
    input: BigInt(1),
    expected: '0',
    description: '1wei应该显示为0',
  },
  {
    name: '精确1ETH',
    input: BigInt('1000000000000000000'), // 1 ETH
    expected: '1',
    description: '精确1ETH应该显示为1',
  },
  {
    name: '0.001边界值',
    input: BigInt('1000000000000000'), // 0.001 ETH
    expected: '0.001',
    description: '0.001边界值测试',
  },
  {
    name: '略小于0.001',
    input: BigInt('999999999999999'), // 0.000999999999999999 ETH
    expected: '0.0{3}9999',
    description: '略小于0.001默认向下取整，避免显示超过实际余额',
  },
];

edgeCaseTests.forEach(runTest);

// 6. 精度和舍入测试
console.log('\n📊 6. 精度和舍入测试');
const precisionTests: TestCase[] = [
  {
    name: '连续9的四舍五入',
    input: BigInt('9999999999999999999'), // 9.999999999999999999 ETH
    roundingMode: 'round',
    expected: '10',
    description: '9.999...应该四舍五入为10',
  },
  {
    name: '连续9的向下取整',
    input: BigInt('9999999999999999999'), // 9.999999999999999999 ETH
    roundingMode: 'floor',
    expected: '9.99', // 在10-1000范围内，显示2位小数
    description: '9.999...在>=10范围内，向下取整为9.99',
  },
  {
    name: '1000边界-四舍五入',
    input: BigInt('999999999999999999999'), // 999.999... ETH
    roundingMode: 'round',
    expected: '1,000',
    description: '999.999应该四舍五入为1000',
  },
  {
    name: '1000边界-向下取整',
    input: BigInt('999999999999999999999'), // 999.999... ETH
    roundingMode: 'floor',
    expected: '999',
    description: '999.999应该向下取整为999',
  },
];

precisionTests.forEach(runTest);

// 7. 性能和压力测试
console.log('\n📊 7. 性能测试');
console.time('性能测试-1000次调用');
for (let i = 0; i < 1000; i++) {
  formatTokenAmount(BigInt(Math.floor(Math.random() * 1e21)), 4, 'round');
}
console.timeEnd('性能测试-1000次调用');

console.log('\n' + '='.repeat(60));
if (failureCount > 0) {
  console.log(`❌ 测试完成，失败 ${failureCount} 个`);
} else {
  console.log('🎉 测试完成！');
}
console.log('\n💡 使用说明:');
console.log('  - formatTokenAmount(balance) // 默认向下取整，4位小数');
console.log('  - formatTokenAmount(balance, 2, "round") // 四舍五入，2位小数');
console.log('  - formatTokenAmount(balance, 4, "floor") // 向下取整，4位小数');
console.log('\n🔍 注意事项:');
console.log('  - 大于1000的数值显示为整数');
console.log('  - 10-1000之间显示2位小数');
console.log('  - 1-10之间显示4位小数');
console.log('  - 0.001-1之间显示4位小数');
console.log('  - 小于0.001使用折叠显示格式: 0.0{n}xxxx');

process.exit(failureCount === 0 ? 0 : 1);
