'use client';
import { useContext, useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { TokenContext } from '@/src/contexts/TokenContext';
import { useGroupChatUnreadSummary } from '@/src/contexts/GroupChatSyncContext';
import { cn } from '@/lib/utils';
import { MessageCircle, Users, Vote, User, Layers } from 'lucide-react';
import { normalizeRouteKey, suppressNextRouteLoading } from '@/src/lib/routeLoading';

export function BottomNavigation() {
  const { token } = useContext(TokenContext) || {};
  const { badgeType, badgeLabel } = useGroupChatUnreadSummary();
  const router = useRouter();
  const hasUnreadChat = badgeType !== 'none';

  const navItems = useMemo(() => {
    if (!token) return [];

    return [
      {
        title: '聊天',
        url: '/chat/',
        icon: MessageCircle,
        isActive: router.pathname.startsWith('/chat'),
        isMain: false,
        chatBadgeType: !router.pathname.startsWith('/chat') && hasUnreadChat ? badgeType : 'none',
        chatBadgeLabel: badgeLabel,
      },
      {
        title: '应用',
        url: '/apps',
        icon: Layers,
        isActive: router.pathname.startsWith('/apps'),
        isMain: false,
        chatBadgeType: 'none',
        chatBadgeLabel: '0',
      },
      {
        title: '社区行动',
        url: `/acting/?symbol=${token.symbol}`,
        icon: Users,
        isActive: router.pathname.startsWith('/acting'),
        isMain: true,
        chatBadgeType: 'none',
        chatBadgeLabel: '0',
      },
      {
        title: '治理',
        url: `/gov/?symbol=${token.symbol}`,
        icon: Vote,
        isActive: router.pathname.startsWith('/gov'),
        isMain: false,
        chatBadgeType: 'none',
        chatBadgeLabel: '0',
      },
      {
        title: '我的',
        url: `/my/?symbol=${token.symbol}`,
        icon: User,
        isActive: router.pathname.startsWith('/my'),
        isMain: false,
        chatBadgeType: 'none',
        chatBadgeLabel: '0',
      },
    ];
  }, [badgeLabel, badgeType, hasUnreadChat, token, router.pathname]);

  if (!token) return null;

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>, url: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (normalizeRouteKey(router.asPath) === normalizeRouteKey(url)) {
      return;
    }

    suppressNextRouteLoading(url);
  };

  return (
    <nav className="mobile-bottom-navigation fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-gray-50 shadow-lg dark:border-gray-700 dark:bg-gray-900 md:hidden">
      <div className="flex h-[var(--bottom-navigation-content-height)] items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.url}
              prefetch={false}
              onClick={(event) => handleNavigate(event, item.url)}
              className={cn(
                'flex flex-col items-center justify-end transition-all duration-200 ease-in-out relative active:scale-95',
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
                {item.chatBadgeType && item.chatBadgeType !== 'none' && (
                  item.chatBadgeType === 'intro-dot' ? (
                    <span
                      className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-gray-50 bg-red-500 dark:border-gray-900"
                      aria-label="有新消息"
                    />
                  ) : (
                    <span
                      className="absolute -right-2 -top-1 min-w-5 rounded-full border-2 border-gray-50 bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white dark:border-gray-900"
                      aria-label="有新消息"
                    >
                      {item.chatBadgeLabel}
                    </span>
                  )
                )}
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
