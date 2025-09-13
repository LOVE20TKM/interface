/**
 * 安全配置管理
 */

export interface SecurityConfig {
  csp: {
    directives: Record<string, string>;
    reportOnly: boolean;
  };
  allowedDomains: string[];
  trustedScripts: string[];
}

/**
 * 开发环境安全配置
 */
const developmentConfig: SecurityConfig = {
  csp: {
    directives: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live http://localhost:* ws://localhost:*",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https: blob:",
      'font-src': "'self' data:",
      'connect-src': "'self' https: wss: ws: http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*",
      'frame-src': "'none'",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
    },
    reportOnly: false, // 开发环境使用报告模式
  },
  allowedDomains: ['localhost', '127.0.0.1', 'vercel.live'],
  trustedScripts: [],
};

/**
 * 生产环境安全配置
 */
const productionConfig: SecurityConfig = {
  csp: {
    directives: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live", // Web3 dApps需要eval
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https: blob:",
      'font-src': "'self' data:",
      'connect-src': "'self' https: wss:",
      'frame-src': "'none'",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
      'upgrade-insecure-requests': '',
    },
    reportOnly: false, // 生产环境强制执行
  },
  allowedDomains: [
    // 在这里添加生产环境允许的域名
    'your-domain.com',
    'vercel.app',
  ],
  trustedScripts: [],
};

/**
 * 获取当前环境的安全配置
 */
export function getSecurityConfig(): SecurityConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? developmentConfig : productionConfig;
}

/**
 * 生成CSP头部字符串
 */
export function generateCSPHeader(config: SecurityConfig): string {
  const directives = Object.entries(config.csp.directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');

  return directives;
}

/**
 * 生成安全头部
 */
export function generateSecurityHeaders(config: SecurityConfig) {
  const cspHeader = generateCSPHeader(config);
  const cspHeaderName = config.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

  return [
    {
      key: cspHeaderName,
      value: cspHeader,
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=()',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    },
  ];
}
