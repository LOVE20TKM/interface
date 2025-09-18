'use client';
import { useContext, useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { TokenContext } from '@/src/contexts/TokenContext';
import { cn } from '@/lib/utils';
import { CircleDollarSign, Users, Vote, User, Repeat } from 'lucide-react';
import { isTukeWallet } from '@/src/lib/tukeWalletUtils';

export function BottomNavigation() {
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 检测是否为iOS设备且在TUKE钱包中
  const [needsExtraPadding, setNeedsExtraPadding] = useState(false);

  useEffect(() => {
    const checkEnvironment = () => {
      if (typeof window === 'undefined') return;

      // 检测iOS设备
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // 检测TUKE钱包
      const isTuke = isTukeWallet();

      // 如果是iOS设备且在TUKE钱包中，需要额外的底部padding
      setNeedsExtraPadding(isIOS && isTuke);

      if (isIOS && isTuke) {
        console.log('🍎 检测到iOS设备中的TUKE钱包，启用额外底部安全区域');
      }
    };

    checkEnvironment();
  }, []);

  const navItems = useMemo(() => {
    if (!token) return [];

    return [
      {
        title: '代币',
        url: `/token/?symbol=${token.symbol}`,
        icon: CircleDollarSign,
        isActive: router.pathname.startsWith('/token'),
        isMain: false,
      },
      {
        title: '兑换',
        url: `/dex/?symbol=${token.symbol}&from=${process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL}`,
        icon: Repeat,
        isActive: router.pathname.startsWith('/dex'),
        isMain: false,
      },
      {
        title: '社区行动',
        url: `/acting/?symbol=${token.symbol}`,
        icon: Users,
        isActive: router.pathname.startsWith('/acting'),
        isMain: true,
      },
      {
        title: '治理',
        url: `/gov/?symbol=${token.symbol}`,
        icon: Vote,
        isActive: router.pathname.startsWith('/gov'),
        isMain: false,
      },
      {
        title: '我的',
        url: `/my/?symbol=${token.symbol}`,
        icon: User,
        isActive: router.pathname.startsWith('/my'),
        isMain: false,
      },
    ];
  }, [token, router.pathname]);

  if (!token) return null;

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 shadow-lg z-50 md:hidden',
        needsExtraPadding && 'pb-2', // iOS + TUKE钱包额外底部间距，再微调缩短一点
      )}
    >
      <div className={cn('flex justify-around items-center py-2 px-4', needsExtraPadding ? 'pb-1' : 'pb-safe')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => router.push(item.url)}
              className={cn(
                'flex flex-col items-center justify-end transition-all duration-200 ease-in-out relative',
                'min-w-0 flex-1',
                item.isMain && 'transform -translate-y-1',
              )}
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            >
              {/* 主操作按钮的特殊背景 */}
              {item.isMain && (
                <div
                  className={cn(
                    'absolute rounded-full transition-all duration-200',
                    'bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg',
                    'w-12 h-12 -top-2 left-1/2 transform -translate-x-1/2',
                    item.isActive && 'shadow-blue-500/50 shadow-xl scale-105',
                  )}
                />
              )}

              {/* 普通按钮的激活背景 */}
              {!item.isMain && item.isActive && (
                <div className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/30 -top-1 -bottom-1" />
              )}

              {/* 图标容器 */}
              <div
                className={cn(
                  'relative z-10 transition-all duration-200',
                  item.isMain ? 'p-1 rounded-full mb-2' : 'p-1',
                )}
              >
                <Icon
                  className={cn(
                    'transition-all duration-200 w-6 h-6',
                    item.isMain ? 'text-white' : item.isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400',
                    !item.isMain && 'mb-1',
                  )}
                />
              </div>

              {/* 标签文字 */}
              <span
                className={cn(
                  'text-xs font-medium transition-all duration-200 relative z-10',
                  item.isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-400',
                  item.isMain && 'mt-1',
                )}
              >
                {item.title}
              </span>

              {/* 激活指示器 */}
              {!item.isMain && item.isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
