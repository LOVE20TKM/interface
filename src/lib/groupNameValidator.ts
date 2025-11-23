/**
 * 群名称验证工具
 * 根据合约逻辑实现前端名称校验
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 验证群名称是否符合规则
 * @param groupName 群名称
 * @param maxGroupNameLength 最大名称长度（字节）
 * @returns 验证结果
 */
export function validateGroupName(groupName: string, maxGroupNameLength: number = 100): ValidationResult {
  if (!groupName) {
    return { isValid: false, error: '群名称不能为空' };
  }

  // 将字符串转换为 UTF-8 字节数组
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(groupName);
  const len = nameBytes.length;

  // 检查长度边界（字节长度，而非字符数）
  if (len === 0 || len > maxGroupNameLength) {
    return { isValid: false, error: `群名称长度必须在 1-${maxGroupNameLength} 字节之间` };
  }

  // 验证 UTF-8 编码和检查非法字符
  let i = 0;
  while (i < len) {
    const byteValue = nameBytes[i];

    // 拒绝 C0 控制字符 (0x00-0x1F) 和空格 (0x20)
    if (byteValue <= 0x20) {
      return { isValid: false, error: '群名称不能包含控制字符或空格' };
    }

    // 拒绝 DEL 字符 (0x7F)
    if (byteValue === 0x7f) {
      return { isValid: false, error: '群名称不能包含 DEL 字符' };
    }

    // ASCII 范围 (0x21-0x7E): 有效的单字节字符
    if (byteValue < 0x80) {
      i++;
      continue;
    }

    // 多字节 UTF-8 序列验证
    let numBytes = 0;

    // 根据第一个字节确定预期序列长度
    if (byteValue >= 0xc2 && byteValue <= 0xdf) {
      // 2字节序列: 110xxxxx 10xxxxxx
      numBytes = 2;
    } else if (byteValue >= 0xe0 && byteValue <= 0xef) {
      // 3字节序列: 1110xxxx 10xxxxxx 10xxxxxx
      numBytes = 3;
    } else if (byteValue >= 0xf0 && byteValue <= 0xf4) {
      // 4字节序列: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      numBytes = 4;
    } else {
      // 无效的 UTF-8 起始字节 (0x80-0xC1, 0xF5-0xFF)
      return { isValid: false, error: '群名称包含无效的 UTF-8 字符' };
    }

    // 检查是否有足够的剩余字节
    if (i + numBytes > len) {
      return { isValid: false, error: '群名称包含不完整的 UTF-8 字符' };
    }

    // 验证延续字节
    for (let j = 1; j < numBytes; j++) {
      const contByte = nameBytes[i + j];
      // 所有延续字节必须在范围 0x80-0xBF
      if (contByte < 0x80 || contByte > 0xbf) {
        return { isValid: false, error: '群名称包含无效的 UTF-8 延续字节' };
      }
    }

    // 检查禁止的 Unicode 字符
    if (numBytes === 2) {
      const byte1 = nameBytes[i];
      const byte2 = nameBytes[i + 1];

      // 检查 U+00A0 (不间断空格)
      // UTF-8: 0xC2 0xA0
      if (byte1 === 0xc2 && byte2 === 0xa0) {
        return { isValid: false, error: '群名称不能包含不间断空格' };
      }

      // 检查 U+00AD (软连字符)
      // UTF-8: 0xC2 0xAD
      if (byte1 === 0xc2 && byte2 === 0xad) {
        return { isValid: false, error: '群名称不能包含软连字符' };
      }

      // 检查 C1 控制字符 (0x80-0x9F)
      // UTF-8: 0xC2 0x80-0x9F
      if (byte1 === 0xc2 && byte2 >= 0x80 && byte2 <= 0x9f) {
        return { isValid: false, error: '群名称不能包含 C1 控制字符' };
      }

      // 检查 U+034F (组合字形连接符)
      // UTF-8: 0xCD 0x8F
      if (byte1 === 0xcd && byte2 === 0x8f) {
        return { isValid: false, error: '群名称不能包含组合字形连接符' };
      }

      // 检查 U+061C (阿拉伯字母标记)
      // UTF-8: 0xD8 0x9C
      if (byte1 === 0xd8 && byte2 === 0x9c) {
        return { isValid: false, error: '群名称不能包含阿拉伯字母标记' };
      }
    }

    if (numBytes === 3) {
      const byte1 = nameBytes[i];
      const byte2 = nameBytes[i + 1];
      const byte3 = nameBytes[i + 2];

      // 检查 U+1680 (欧甘空格标记)
      // UTF-8: 0xE1 0x9A 0x80
      if (byte1 === 0xe1 && byte2 === 0x9a && byte3 === 0x80) {
        return { isValid: false, error: '群名称不能包含特殊空格字符' };
      }

      // 检查 U+2000 到 U+200F (各种空格、零宽字符、LRM、RLM)
      // UTF-8: 0xE2 0x80 0x80-0x8F
      if (byte1 === 0xe2 && byte2 === 0x80 && byte3 >= 0x80 && byte3 <= 0x8f) {
        return { isValid: false, error: '群名称不能包含特殊空格或零宽字符' };
      }

      // 检查 U+2028 (行分隔符)
      // UTF-8: 0xE2 0x80 0xA8
      if (byte1 === 0xe2 && byte2 === 0x80 && byte3 === 0xa8) {
        return { isValid: false, error: '群名称不能包含行分隔符' };
      }

      // 检查 U+2029 (段落分隔符)
      // UTF-8: 0xE2 0x80 0xA9
      if (byte1 === 0xe2 && byte2 === 0x80 && byte3 === 0xa9) {
        return { isValid: false, error: '群名称不能包含段落分隔符' };
      }

      // 检查 U+202A-U+202E (方向格式化字符)
      // UTF-8: 0xE2 0x80 0xAA-0xAE
      if (byte1 === 0xe2 && byte2 === 0x80 && byte3 >= 0xaa && byte3 <= 0xae) {
        return { isValid: false, error: '群名称不能包含方向格式化字符' };
      }

      // 检查 U+202F (窄不间断空格)
      // UTF-8: 0xE2 0x80 0xAF
      if (byte1 === 0xe2 && byte2 === 0x80 && byte3 === 0xaf) {
        return { isValid: false, error: '群名称不能包含窄不间断空格' };
      }

      // 检查 U+205F (中等数学空格)
      // UTF-8: 0xE2 0x81 0x9F
      if (byte1 === 0xe2 && byte2 === 0x81 && byte3 === 0x9f) {
        return { isValid: false, error: '群名称不能包含特殊数学空格' };
      }

      // 检查 U+2060 (单词连接符)
      // UTF-8: 0xE2 0x81 0xA0
      if (byte1 === 0xe2 && byte2 === 0x81 && byte3 === 0xa0) {
        return { isValid: false, error: '群名称不能包含单词连接符' };
      }

      // 检查 U+3000 (表意文字空格 - CJK 全角空格)
      // UTF-8: 0xE3 0x80 0x80
      if (byte1 === 0xe3 && byte2 === 0x80 && byte3 === 0x80) {
        return { isValid: false, error: '群名称不能包含全角空格' };
      }

      // 检查 U+FEFF (零宽不间断空格 / BOM)
      // UTF-8: 0xEF 0xBB 0xBF
      if (byte1 === 0xef && byte2 === 0xbb && byte3 === 0xbf) {
        return { isValid: false, error: '群名称不能包含 BOM 字符' };
      }

      // 3字节序列的额外验证
      // 拒绝过长编码和无效范围
      if (byte1 === 0xe0 && byte2 < 0xa0) {
        // 过长编码
        return { isValid: false, error: '群名称包含过长的 UTF-8 编码' };
      }
      if (byte1 === 0xed && byte2 >= 0xa0) {
        // UTF-16 代理对 (U+D800 到 U+DFFF 在 UTF-8 中无效)
        return { isValid: false, error: '群名称包含无效的 UTF-16 代理对' };
      }
    }

    if (numBytes === 4) {
      const byte1 = nameBytes[i];
      const byte2 = nameBytes[i + 1];

      // 4字节序列的额外验证
      // 拒绝过长编码和码点 > U+10FFFF
      if (byte1 === 0xf0 && byte2 < 0x90) {
        // 过长编码
        return { isValid: false, error: '群名称包含过长的 UTF-8 编码' };
      }
      if (byte1 === 0xf4 && byte2 >= 0x90) {
        // 码点 > U+10FFFF
        return { isValid: false, error: '群名称包含超出范围的 Unicode 字符' };
      }
    }

    // 移动到下一个字符
    i += numBytes;
  }

  return { isValid: true };
}

