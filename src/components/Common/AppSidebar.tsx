'use client';
import { useContext, useState } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
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
} from '@/components/ui/sidebar';

// 修改后的 AppSidebar 组件
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { token } = useContext(TokenContext) || {};
  if (!token) {
    return null;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // 动态生成导航数据
  const data = {
    navMain: [
      {
        title: '社区',
        url: '#',
        items: [
          {
            title: '社区行动',
            url: `${basePath}/acting/?symbol=${token.symbol}`,
            isActive: false,
            icon: SmilePlus,
          },
          {
            title: '社区治理',
            url: `${basePath}/gov/?symbol=${token.symbol}`,
            isActive: false,
            icon: Landmark,
          },
          // {
          //   title: '推举行动',
          //   url: `${basePath}/vote/actions4submit?symbol=${token.symbol}`,
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
            url: `${basePath}/launch/?symbol=${token.symbol}`,
            isActive: false,
            icon: Rocket,
          },
          {
            title: '代币列表',
            url: `${basePath}/tokens/?symbol=${token.symbol}`,
            isActive: false,
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
          //   url: `${basePath}/dex/swap?symbol=${token.symbol}`,
          //   isActive: false,
          //   icon: BadgeDollarSign,
          // },
          {
            title: `兑换${process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL}`,
            url: `${basePath}/dex/deposit?symbol=${token.symbol}`,
            isActive: false,
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
            url: `${basePath}/?symbol=${token.symbol}`,
            isActive: false,
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
            url: `${basePath}/my/?symbol=${token.symbol}`,
            isActive: false,
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
                  <SidebarMenuItem key={subItem.title} className="flex items-center">
                    {subItem.icon && <subItem.icon className="w-4 h-4" />}
                    <SidebarMenuButton asChild isActive={subItem.isActive || false}>
                      <a href={subItem.url}>
                        <span className="text-base">{subItem.title}</span>
                      </a>
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
