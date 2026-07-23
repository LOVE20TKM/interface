import { Html, Head, Main, NextScript } from 'next/document';
import { THEME_BOOTSTRAP_SCRIPT } from '@/src/lib/theme';

export default function Document() {
  return (
    <Html lang="zh-CN" suppressHydrationWarning>
      <Head>
        {/* 基本的meta标签 */}
        <meta charSet="utf-8" />

        {/* 安全相关的meta标签 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* Web3 DApp相关 */}
        <meta name="format-detection" content="telephone=no" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
