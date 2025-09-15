/**
 * 安全工具函数 - 防止XSS攻击和其他安全风险
 */

// HTML实体编码映射
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * 转义HTML特殊字符，防止XSS攻击
 * @param text 需要转义的文本
 * @returns 转义后的安全文本
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * 清理用户输入，移除潜在的恶意内容
 * @param input 用户输入
 * @returns 清理后的安全文本
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';

  // 移除HTML标签
  let cleaned = input.replace(/<[^>]*>/g, '');

  // 移除JavaScript伪协议
  cleaned = cleaned.replace(/javascript:/gi, '');

  // 移除潜在的事件处理器
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');

  // 移除data URLs（可能包含恶意代码）
  cleaned = cleaned.replace(/data:[^;]*;base64,/gi, '');

  // 转义HTML特殊字符
  return escapeHtml(cleaned);
}

/**
 * 保留换行的安全文本处理
 * @param input 用户输入文本
 * @returns 安全的、保留换行的文本
 */
export function sanitizeTextWithLineBreaks(input: string): string {
  if (!input) return '';

  // 先进行基本清理
  const cleaned = sanitizeUserInput(input);

  // 将换行符转换为<br>标签（已经被转义的文本中）
  // 注意：这里我们手动添加<br>，因为输入已经被转义了
  return cleaned.replace(/\n/g, '<br>');
}

/**
 * 智能的文本安全处理 - 保持URL可读性
 * @param input 用户输入文本
 * @param preserveLineBreaks 是否保留换行符
 * @returns 安全且美观的文本
 */
export function smartSanitizeText(input: string, preserveLineBreaks: boolean = false): string {
  if (!input) return '';

  // URL正则表达式
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // 检查是否包含URL
  const urls = input.match(urlRegex) || [];

  if (urls.length === 0) {
    // 没有URL，使用常规转义
    const escaped = escapeHtml(input);
    return preserveLineBreaks ? escaped.replace(/\n/g, '<br>') : escaped;
  }

  // 有URL的情况，需要智能处理
  let result = input;

  // 首先移除潜在的恶意内容（但保留URL结构）
  result = result.replace(/<script[^>]*>.*?<\/script>/gi, '');
  result = result.replace(/<[^>]*on\w+\s*=\s*[^>]*>/gi, '');
  result = result.replace(/javascript:/gi, '');

  // 分割文本，分别处理URL和非URL部分
  const parts = result.split(urlRegex);
  const processedParts = parts.map((part, index) => {
    if (index % 2 === 0) {
      // 非URL部分，进行HTML转义（但不转义斜杠）
      return escapeHtmlExceptSlashes(part);
    } else {
      // URL部分，检查安全性但保持可读性
      const url = part;
      if (isUrlSafe(url)) {
        // 安全的URL，保持原样
        return url;
      } else {
        // 不安全的URL，进行转义
        return escapeHtml(url);
      }
    }
  });

  result = processedParts.join('');

  // 处理换行
  if (preserveLineBreaks) {
    result = result.replace(/\n/g, '<br>');
  }

  return result;
}

/**
 * HTML转义（但不转义斜杠）- 保持URL可读性
 * @param text 需要转义的文本
 * @returns 转义后的文本
 */
function escapeHtmlExceptSlashes(text: string): string {
  if (!text) return '';

  const htmlEntitiesExceptSlash: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    // 注意：这里不转义 '/' 斜杠
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntitiesExceptSlash[char] || char);
}

/**
 * 检查文本是否包含换行符
 * @param text 文本内容
 * @returns 是否包含换行符
 */
export function hasLineBreaks(text: string): boolean {
  return /\n/.test(text);
}

/**
 * 验证URL是否安全 - 使用黑名单机制
 * 原则：默认允许所有正常网站在外部浏览器打开，只拦截真正危险的链接
 * @param url 需要验证的URL
 * @returns 是否为安全URL（可以在外部浏览器打开）
 */
export function isUrlSafe(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);

    // 1. 协议安全检查 - 只允许安全的协议
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
      return false;
    }

    const hostname = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // 2. 危险协议和特殊情况检查
    if (fullUrl.includes('javascript:') ||
        fullUrl.includes('data:') ||
        fullUrl.includes('vbscript:') ||
        fullUrl.includes('file:')) {
      return false;
    }

    // 3. 已知恶意域名黑名单（只包含确实危险的域名）
    const maliciousDomains = [
      // 已知钓鱼网站（示例，实际部署时应该维护真实的威胁情报）
      'phishing-site.com',
      'fake-bank.com',
      'malware-host.net',
      // 注意：不再将短链接服务列为恶意，因为很多正常网站使用它们
    ];

    if (maliciousDomains.some((domain) => hostname === domain || hostname.endsWith('.' + domain))) {
      return false;
    }

    // 4. 明显的恶意关键词检查（只检查非常明显的）
    const obviousMalwareKeywords = [
      'phishing',
      'malware',
      'trojan',
      'keylogger',
      'ransomware',
      'exploit-kit'
    ];

    if (obviousMalwareKeywords.some((keyword) => hostname.includes(keyword))) {
      return false;
    }

    // 5. 检查可疑的unicode字符（域名欺骗防护）
    if (/[\u0000-\u001f\u007f-\u009f]/.test(hostname)) {
      return false;
    }

    // 6. 基本域名格式检查
    if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return false;
    }

    // 7. 检查是否为明显的IP地址伪装（简单检查）
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      // IP地址不一定是恶意的，但可能需要额外注意
      // 这里我们允许，但实际部署时可以考虑更严格的策略
    }

    // 8. 默认允许 - 所有通过基本安全检查的URL都允许在外部浏览器打开
    // 这是关键改变：不再需要白名单，默认信任所有正常格式的URL
    return true;

  } catch {
    // URL格式无效
    return false;
  }
}

/**
 * 从文本中提取并验证URL
 * @param text 包含URL的文本
 * @returns 安全的URL数组
 */
export function extractSafeUrls(text: string): string[] {
  if (!text) return [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];

  return urls.filter(isUrlSafe);
}

/**
 * 安全的验证规则验证器
 * @param rule 验证规则文本
 * @returns 验证结果
 */
export function validateVerificationRule(rule: string): {
  isValid: boolean;
  errors: string[];
  sanitizedRule: string;
} {
  const errors: string[] = [];
  let sanitizedRule = rule;

  if (!rule || rule.trim() === '') {
    return {
      isValid: false,
      errors: ['验证规则不能为空'],
      sanitizedRule: '',
    };
  }

  // 检查长度
  if (rule.length > 10000) {
    errors.push('验证规则不能超过10000字');
  }

  // 检查是否包含危险的HTML标签（但允许纯文本和链接）
  const dangerousHtmlPattern = /<(?:script|iframe|object|embed|form|input|meta|link|style)[^>]*>/gi;
  if (dangerousHtmlPattern.test(rule)) {
    errors.push('验证规则不能包含危险的HTML标签');
    sanitizedRule = sanitizeUserInput(rule);
  }

  // 检查是否包含明显的JavaScript代码（但排除URL中正常出现的这些词）
  const javascriptPattern = /(?<!https?:\/\/[^\s]*)(javascript:|onclick\s*=|onerror\s*=|onload\s*=|<script)/gi;
  if (javascriptPattern.test(rule)) {
    errors.push('验证规则不能包含可执行脚本代码');
    sanitizedRule = sanitizeUserInput(rule);
  }

  // 检查URL安全性 - 使用新的黑名单机制
  const allUrls = rule.match(/(https?:\/\/[^\s]+)/g) || [];
  if (allUrls.length > 0) {
    const unsafeUrls = allUrls.filter((url) => !isUrlSafe(url));
    if (unsafeUrls.length > 0) {
      errors.push(`包含危险的链接，已被安全过滤器拦截: ${unsafeUrls.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRule,
  };
}

/**
 * 安全的密钥验证器
 * @param key 验证密钥
 * @returns 验证结果
 */
export function validateVerificationKey(key: string): {
  isValid: boolean;
  errors: string[];
  sanitizedKey: string;
} {
  const errors: string[] = [];

  if (!key || key.trim() === '') {
    return {
      isValid: false,
      errors: ['验证名称不能为空'],
      sanitizedKey: '',
    };
  }

  const sanitizedKey = sanitizeUserInput(key);

  // 检查是否包含恶意内容
  if (sanitizedKey !== key) {
    errors.push('验证名称包含不安全的内容');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedKey,
  };
}
