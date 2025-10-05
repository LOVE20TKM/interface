'use client';
import { useContext, useMemo, useCallback } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';
import {
  SmilePlus,
  Home,
  SatelliteDish,
  Landmark,
  Rocket,
  List,
  TicketCheck,
  User,
  Bitcoin,
  UserCog,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavigationUtils } from '@/src/lib/navigationUtils';

// 修改后的 AppSidebar 组件
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { token } = useContext(TokenContext) || {};
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // 优化的URL匹配逻辑，使用 useCallback 缓存
  const isActiveUrl = useCallback(
    (url: string) => {
      if (!token) return false; // 如果没有 token，返回 false

      const urlPath = url.split('?')[0];
      const normalizedUrlPath = urlPath.endsWith('/') ? urlPath : `${urlPath}/`;

      const currentPath = pathname.split('?')[0];
      const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;

      if (normalizedCurrentPath === normalizedUrlPath) return true;

      // 如果basePath存在且不为空，处理子路径情况
      if (basePath && basePath.length > 0) {
        const pathWithoutBase = normalizedCurrentPath.startsWith(basePath)
          ? normalizedCurrentPath.substring(basePath.length)
          : normalizedCurrentPath;

        const urlWithoutBase = normalizedUrlPath.startsWith(basePath)
          ? normalizedUrlPath.substring(basePath.length)
          : normalizedUrlPath;

        return pathWithoutBase === urlWithoutBase;
      }

      return false;
    },
    [pathname, basePath, token],
  );

  // 优化的点击处理逻辑，使用 useCallback 缓存，避免不必要的页面刷新
  const handleLinkClick = useCallback(
    (url: string) => {
      if (isMobile) {
        setOpenMobile(false);
      }
      router.push(url);
    },
    [isMobile, setOpenMobile, router],
  );

  // 使用 useMemo 缓存导航数据，避免每次渲染都重新计算
  const navigationData = useMemo(() => {
    if (!token) {
      return { navMain: [] }; // 如果没有 token，返回空的导航数据
    }

    return {
      navMain: [
        {
          title: '代币',
          url: '#',
          items: [
            {
              title: '代币信息',
              url: `/token/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/token/`),
              icon: Bitcoin,
            },
            {
              title: '代币简介',
              url: `/token/intro?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/token/intro`),
              icon: SatelliteDish,
            },
          ],
        },
        {
          title: '社区',
          url: '#',
          items: [
            {
              title: '社区行动',
              url: `/acting/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/acting/`),
              icon: SmilePlus,
            },
            {
              title: '社区治理',
              url: `/gov/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/gov/`),
              icon: Landmark,
            },
            // {
            //   title: '推举行动',
            //   url: `/vote/actions4submit?symbol=${token.symbol}`,
            //   isActive: false,
            //   icon: SatelliteDish,
            // },
          ],
        },
        {
          title: '发射',
          url: '#',
          items: [
            {
              title: '公平发射',
              url: `/launch/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/launch/`),
              icon: Rocket,
            },
            // 当存在父币时显示切换父币链接
            ...(token.parentTokenAddress &&
            token.parentTokenAddress !== '0x0000000000000000000000000000000000000000' &&
            token.parentTokenSymbol &&
            token.parentTokenSymbol !== process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL
              ? [
                  {
                    title: '返回父币',
                    url: `/acting/?symbol=${token.parentTokenSymbol}`,
                    isActive: false,
                    icon: UserCog,
                    forceReload: true, // 仅此项使用强制刷新
                  },
                ]
              : []),
            {
              title: '子币列表',
              url: `/tokens/children/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/tokens/children/`),
              icon: List,
            },
          ],
        },
        {
          title: '交易',
          url: '#',
          items: [
            {
              title: `兑换代币`,
              url: `/dex/?symbol=${token.symbol}&from=${process.env.NEXT_PUBLIC_USDT_SYMBOL}`,
              isActive: isActiveUrl(`${basePath}/dex/swap`),
              icon: TicketCheck,
            },
          ],
        },
        // {
        //   title: 'LOVE20',
        //   url: '#',
        //   items: [
        //     {
        //       title: '协议首页',
        //       url: `/?symbol=${token.symbol}`,
        //       isActive: pathname === basePath || pathname === `${basePath}/`,
        //       icon: Home,
        //     },
        //   ],
        // },
        {
          title: '我的',
          url: '#',
          items: [
            {
              title: '个人中心',
              url: `/my/?symbol=${token.symbol}`,
              isActive: isActiveUrl(`${basePath}/my/`),
              icon: User,
            },
            // {
            //   title: '关于协议',
            //   url: `/about?symbol=${token.symbol}`,
            //   isActive: isActiveUrl(`${basePath}/about`),
            //   icon: Info,
            // },
          ],
        },
      ],
    };
  }, [token, basePath, isActiveUrl]);

  // 添加加载状态提示
  if (!token) {
    return (
      <Sidebar {...props}>
        <SidebarHeader></SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-gray-500">加载中...</div>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        {navigationData.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem
                    key={subItem.title}
                    className={cn('flex items-center', subItem.isActive && '!bg-blue-800 rounded-md')}
                  >
                    {subItem.icon && <subItem.icon className={cn('w-4 h-4 ml-2', subItem.isActive && 'text-white')} />}
                    <SidebarMenuButton
                      isActive={subItem.isActive || false}
                      className={cn(subItem.isActive && '!bg-transparent !text-white font-bold')}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                        if (subItem.forceReload) {
                          const target = basePath ? `${basePath}${subItem.url}` : subItem.url;
                          NavigationUtils.redirectWithOverlay(target, '正在跳转...');
                        } else {
                          handleLinkClick(subItem.url);
                        }
                      }}
                    >
                      <span className="text-base">{subItem.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
