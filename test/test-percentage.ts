import { formatPercentage } from '../src/lib/format';

// 测试用例结构
interface TestCase {
  input: number | string;
  expected: string;
  description: string;
}

// 测试用例集合
const testCases: TestCase[] = [
  // 基础测试
  { input: 0, expected: '0%', description: '零值' },
  { input: '0', expected: '0%', description: '字符串零值' },

  // 异常值测试
  { input: NaN, expected: '-%', description: 'NaN' },
  { input: 'invalid', expected: '-%', description: '无效字符串' },

  // 负数测试
  { input: -5.5, expected: '-5.5%', description: '负数' },
  { input: -10.5, expected: '-10.5%', description: '负数十位' },
  { input: -100, expected: '-100%', description: '负数百位' },

  // >= 100 的情况（0位小数）
  { input: 100, expected: '100%', description: '100整数' },
  { input: 100.5, expected: '100%', description: '100.5 向下取整' },
  { input: 100.9, expected: '100%', description: '100.9 向下取整' },
  { input: 150, expected: '150%', description: '150整数' },
  { input: 150.7, expected: '150%', description: '150.7 向下取整' },
  { input: 999, expected: '999%', description: '999整数' },
  { input: 999.99, expected: '999%', description: '999.99 向下取整' },

  // >= 10 且 < 100 的情况（1位小数）
  { input: 10, expected: '10%', description: '10整数' },
  { input: 10.0, expected: '10%', description: '10.0 整数' },
  { input: 10.01, expected: '10%', description: '10 保留1位' },
  { input: 10.1, expected: '10.1%', description: '10.1 保留1位' },
  { input: 10.15, expected: '10.1%', description: '10.15 向下取整到1位' },
  { input: 10.19, expected: '10.1%', description: '10.19 向下取整到1位' },
  { input: 10.9, expected: '10.9%', description: '10.9 保留1位' },
  { input: 10.99, expected: '10.9%', description: '10.99 向下取整到1位' },
  { input: 50.5, expected: '50.5%', description: '50.5 保留1位' },
  { input: 50.55, expected: '50.5%', description: '50.55 向下取整到1位' },
  { input: 99, expected: '99%', description: '99整数' },
  { input: 99.9, expected: '99.9%', description: '99.9 保留1位' },
  { input: 99.99, expected: '99.9%', description: '99.99 向下取整到1位' },

  // >= 1 且 < 10 的情况（2位小数）
  { input: 1, expected: '1%', description: '1整数' },
  { input: 1.0, expected: '1%', description: '1.0 整数' },
  { input: 1.1, expected: '1.1%', description: '1.1 保留2位' },
  { input: 1.12, expected: '1.12%', description: '1.12 保留2位' },
  { input: 1.125, expected: '1.12%', description: '1.125 向下取整到2位' },
  { input: 1.129, expected: '1.12%', description: '1.129 向下取整到2位' },
  { input: 5.55, expected: '5.55%', description: '5.55 保留2位' },
  { input: 5.555, expected: '5.55%', description: '5.555 向下取整到2位' },
  { input: 9.99, expected: '9.99%', description: '9.99 保留2位' },
  { input: 9.999, expected: '9.99%', description: '9.999 向下取整到2位' },

  // >= 0.1 且 < 1 的情况（3位小数）
  { input: 0.1, expected: '0.1%', description: '0.1 保留3位' },
  { input: 0.12, expected: '0.12%', description: '0.12 保留3位' },
  { input: 0.123, expected: '0.123%', description: '0.123 保留3位' },
  { input: 0.1234, expected: '0.123%', description: '0.1234 向下取整到3位' },
  { input: 0.1239, expected: '0.123%', description: '0.1239 向下取整到3位' },
  { input: 0.555, expected: '0.555%', description: '0.555 保留3位' },
  { input: 0.5555, expected: '0.555%', description: '0.5555 向下取整到3位' },
  { input: 0.999, expected: '0.999%', description: '0.999 保留3位' },
  { input: 0.9999, expected: '0.999%', description: '0.9999 向下取整到3位' },

  // >= 0.01 且 < 0.1 的情况（4位小数）
  { input: 0.01, expected: '0.01%', description: '0.01 保留4位' },
  { input: 0.012, expected: '0.012%', description: '0.012 保留4位' },
  { input: 0.0123, expected: '0.0123%', description: '0.0123 保留4位' },
  { input: 0.01234, expected: '0.0123%', description: '0.01234 向下取整到4位' },
  { input: 0.01239, expected: '0.0123%', description: '0.01239 向下取整到4位' },
  { input: 0.0555, expected: '0.0555%', description: '0.0555 保留4位' },
  { input: 0.05555, expected: '0.0555%', description: '0.05555 向下取整到4位' },
  { input: 0.0999, expected: '0.0999%', description: '0.0999 保留4位' },
  { input: 0.09999, expected: '0.0999%', description: '0.09999 向下取整到4位' },

  // < 0.01 的情况（4位小数）
  { input: 0.001, expected: '0.001%', description: '0.001 保留4位' },
  { input: 0.0012, expected: '0.0012%', description: '0.0012 保留4位' },
  { input: 0.00123, expected: '0.0012%', description: '0.00123 向下取整到4位' },
  { input: 0.001234, expected: '0.0012%', description: '0.001234 向下取整到4位' },
  { input: 0.00001, expected: '0%', description: '0.00001 非常小的值' },

  // 边界值测试
  { input: 0.0999999, expected: '0.0999%', description: '接近0.1的边界' },
  { input: 0.999999, expected: '0.999%', description: '接近1的边界' },
  { input: 9.999999, expected: '9.99%', description: '接近10的边界' },
  { input: 99.999999, expected: '99.9%', description: '接近100的边界' },

  // 字符串输入测试
  { input: '10', expected: '10%', description: '字符串10' },
  { input: '10.5', expected: '10.5%', description: '字符串10.5' },
  { input: '100.5', expected: '100%', description: '字符串100.5' },

  // 特殊场景
  { input: 0.0, expected: '0%', description: '0.00' },
  { input: 10.0, expected: '10%', description: '10.00' },
  { input: 100.0, expected: '100%', description: '100.00' },
];

// 运行测试
function runTests() {
  console.log('开始测试 formatPercentage 函数...\n');

  let passCount = 0;
  let failCount = 0;
  const failures: { case: TestCase; actual: string }[] = [];

  testCases.forEach((testCase, index) => {
    const actual = formatPercentage(testCase.input);
    const passed = actual === testCase.expected;

    if (passed) {
      passCount++;
      console.log(`✓ 测试 ${index + 1}: ${testCase.description}`);
      console.log(`  输入: ${testCase.input}, 期望: ${testCase.expected}, 实际: ${actual}`);
    } else {
      failCount++;
      failures.push({ case: testCase, actual });
      console.log(`✗ 测试 ${index + 1}: ${testCase.description}`);
      console.log(`  输入: ${testCase.input}, 期望: ${testCase.expected}, 实际: ${actual}`);
    }
  });

  console.log(`\n========== 测试结果 ==========`);
  console.log(`总计: ${testCases.length} 个测试`);
  console.log(`通过: ${passCount} 个`);
  console.log(`失败: ${failCount} 个`);

  if (failures.length > 0) {
    console.log(`\n========== 失败的测试 ==========`);
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.case.description}`);
      console.log(`   输入: ${failure.case.input}`);
      console.log(`   期望: ${failure.case.expected}`);
      console.log(`   实际: ${failure.actual}`);
    });
  }

  return failCount === 0;
}

// 执行测试
const success = runTests();
process.exit(success ? 0 : 1);
