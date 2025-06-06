'use client';
import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SmilePlus,
  Home,
  Landmark,
  SatelliteDish,
  BadgeDollarSign,
  Rocket,
  List,
  TicketCheck,
  User,
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

// 修改后的 AppSidebar 组件
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { token } = useContext(TokenContext) || {};
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  if (!token) {
    return null;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // 检查当前URL是否匹配菜单项
  const isActiveUrl = (url: string) => {
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
  };

  // 处理链接点击，在移动端自动关闭侧边栏
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // 动态生成导航数据
  const data = {
    navMain: [
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
            title: '发射平台',
            url: `/launch/?symbol=${token.symbol}`,
            isActive: isActiveUrl(`${basePath}/launch/`),
            icon: Rocket,
          },
          {
            title: '代币列表',
            url: `/tokens/?symbol=${token.symbol}`,
            isActive: isActiveUrl(`${basePath}/tokens/`),
            icon: List,
          },
        ],
      },
      {
        title: '交易',
        url: '#',
        items: [
          // {
          //   title: '交易代币',
          //   url: `/dex/swap?symbol=${token.symbol}`,
          //   isActive: false,
          //   icon: BadgeDollarSign,
          // },
          {
            title: `兑换代币`,
            url: `/dex/swap?symbol=${token.symbol}&from=${process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL}`,
            isActive: isActiveUrl(`${basePath}/dex/swap`),
            icon: TicketCheck,
          },
        ],
      },
      {
        title: 'LOVE20',
        url: '#',
        items: [
          {
            title: '协议首页',
            url: `/?symbol=${token.symbol}`,
            isActive: pathname === basePath || pathname === `${basePath}/`,
            icon: Home,
          },
        ],
      },
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
        ],
      },
    ],
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
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
                      asChild
                      isActive={subItem.isActive || false}
                      className={cn(subItem.isActive && '!bg-transparent !text-white font-bold')}
                    >
                      <Link href={subItem.url} onClick={handleLinkClick}>
                        <span className="text-base">{subItem.title}</span>
                      </Link>
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
