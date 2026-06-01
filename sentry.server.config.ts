// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // 使用环境变量配置 DSN（缺省则不启用上报）
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Optional local escape hatch for Node versions that surface noisy transitive
  // OpenTelemetry warnings. Keep disabled by default so dev and prod tracing
  // behavior stay aligned.
  skipOpenTelemetrySetup: process.env.SENTRY_SKIP_OPENTELEMETRY_SETUP === 'true',


  // Enable logs to be sent to Sentry
  // 仅在非生产环境打印日志，减少生产控制台噪音
  enableLogs: process.env.NODE_ENV !== 'production',

  // 根据部署环境设置 environment，便于在 Sentry 控制台按环境筛选
  environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,

  // 显式设置 release，保证事件与 Source Maps 正确关联
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
