/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true, // GitHub Pages 需要这个设置
  reactStrictMode: false,
  ...(process.env.NODE_ENV !== 'development' && { output: 'export' }),
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.ASSET_PREFIX || '',
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000', '127.0.0.1', 'localhost'],
  productionBrowserSourceMaps: false, // 禁用生产环境源码映射以避免404错误

  // Android 10 兼容性配置
  compiler: {
    removeConsole: false, // 保留所有日志，方便 VConsole 调试
  },

  // 实验性功能，提高兼容性
  experimental: {
    // 确保使用较旧的 SWC 转换
    forceSwcTransforms: true,
    // 开发环境性能优化
    ...(process.env.NODE_ENV === 'development' && {
      // 启用 SWC 编译器的缓存
      swcTraceProfiling: false,
      // 禁用某些开发时的检查
      disableOptimizedLoading: true,
    }),
  },

  // 针对旧版本浏览器的 Webpack 配置
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // 忽略 MetaMask SDK 的 React Native 依赖
        '@react-native-async-storage/async-storage': false,
      };
    }
    return config;
  },

  // 转译特定的 node_modules 包以提高兼容性 - 移除 viem 避免 BigInt 转换问题
  transpilePackages: ['@tanstack/react-query', '@tanstack/query-core', 'wagmi', '@tanstack/react-query-devtools'],
  // 确保静态导出时跳过API路由
  async exportPathMap() {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
      '/acting': { page: '/acting' },
      '/acting/join': { page: '/acting/join' },
      '/action/new': { page: '/action/new' },
      '/action/info': { page: '/action/info' },
      '/apps': { page: '/apps' },
      '/dex': { page: '/dex' },
      '/dex/deposit': { page: '/dex/deposit' },
      '/dex/swap': { page: '/dex/swap' },
      '/dex/withdraw': { page: '/dex/withdraw' },
      '/extension/deploy': { page: '/extension/deploy' },
      '/extension/factories': { page: '/extension/factories' },
      '/extension/group_op': { page: '/extension/group_op' },
      '/extension/group_trial_add': { page: '/extension/group_trial_add' },
      '/extension/group_trial': { page: '/extension/group_trial' },
      '/extension/group': { page: '/extension/group' },
      '/group/groupids': { page: '/group/groupids' },
      '/extension/my_verifying_groups': { page: '/extension/my_verifying_groups' },
      '/group/transfer': { page: '/group/transfer' },
      '/gov': { page: '/gov' },
      '/launch': { page: '/launch' },
      '/launch/burn': { page: '/launch/burn' },
      '/launch/contribute': { page: '/launch/contribute' },
      '/launch/deploy': { page: '/launch/deploy' },
      '/my': { page: '/my' },
      '/my/myaction': { page: '/my/myaction' },
      '/my/liquid': { page: '/my/liquid' },
      '/my/actionrewards': { page: '/my/actionrewards' },
      '/my/govrewards': { page: '/my/govrewards' },
      '/my/rewardsofaction': { page: '/my/rewardsofaction' },
      '/stake/liquid': { page: '/stake/liquid' },
      '/stake/stakelp': { page: '/stake/stakelp' },
      '/stake/staketoken': { page: '/stake/staketoken' },
      '/stake/unstake': { page: '/stake/unstake' },
      '/submit/submit': { page: '/submit/submit' },
      '/submit/actions': { page: '/submit/actions' },
      '/token': { page: '/token' },
      '/token/intro': { page: '/token/intro' },
      '/token/transfer': { page: '/token/transfer' },
      '/tokens': { page: '/tokens' },
      '/tokens/children': { page: '/tokens/children' },
      '/verify': { page: '/verify' },
      '/verify/action': { page: '/verify/action' },
      '/verify/actions': { page: '/verify/actions' },
      '/verify/detail': { page: '/verify/detail' },
      '/vote': { page: '/vote' },
      '/vote/actions': { page: '/vote/actions' },
      '/vote/batch': { page: '/vote/batch' },
      '/vote/records': { page: '/vote/records' },
      '/vote/single': { page: '/vote/single' },
    };
  },
  images: {
    unoptimized: true, // 静态导出需要这个设置
  },

  // 安全头部配置 - 仅在开发模式下启用（静态导出不支持自定义headers）
  ...(process.env.NODE_ENV === 'development'
    ? {
        async headers() {
          // 直接在这里定义安全配置，避免模块导入问题
          const developmentCSP = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live http://localhost:* ws://localhost:*",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss: ws: http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ');

          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'Content-Security-Policy-Report-Only',
                  value: developmentCSP,
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
              ],
            },
          ];
        },
      }
    : {}),
  // devIndicators: false,
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs');

// 允许通过环境变量控制 Sentry tunnel（静态导出下默认禁用）
const enableSentryTunnel = process.env.SENTRY_TUNNEL === 'true' && nextConfig.output !== 'export';
const sentryTunnelRoute = process.env.SENTRY_TUNNEL_ROUTE || '/monitoring';

// 开发环境下简化 Sentry 配置以提高编译速度
const sentryConfig =
  process.env.NODE_ENV === 'development'
    ? {
        org: 'ws1040',
        project: 'love20-dapp',
        authToken: process.env.SENTRY_AUTH_TOKEN || '',
        sourcemaps: {
          disable: true, // 开发环境禁用源码映射以加快编译
        },
        silent: true, // 开发环境静默 Sentry 日志
        widenClientFileUpload: false, // 开发环境关闭以提高速度
        disableLogger: true,
        automaticVercelMonitors: false, // 开发环境关闭
      }
    : {
        // 生产环境完整配置
        org: 'ws1040',
        project: 'love20-dapp',
        authToken: process.env.SENTRY_AUTH_TOKEN || '',
        sourcemaps: {
          disable: false,
          assets: ['**/*.js', '**/*.js.map'],
          ignore: ['**/node_modules/**'],
          deleteSourcemapsAfterUpload: true,
        },
        silent: !process.env.CI,
        widenClientFileUpload: true,
        tunnelRoute: enableSentryTunnel ? sentryTunnelRoute : undefined,
        disableLogger: true,
        automaticVercelMonitors: true,
      };

module.exports = withSentryConfig(module.exports, sentryConfig);
