"use client";

import { useContext } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import {
  Coins,
  Droplets,
  LucideIcon,
  ListChecks,
  MessageCircle,
  Repeat2,
  SendHorizontal,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "@/src/components/Header";
import { TokenContext } from "@/src/contexts/TokenContext";
import { useGroupChatUnreadSummary } from "@/src/contexts/GroupChatSyncContext";
import { isBatchTransferEnabled } from "@/src/hooks/contracts/useBatchTransfer";

interface AppItem {
  name: string;
  href: string | ((symbol?: string) => string);
  icon: LucideIcon;
  hasUnread?: boolean;
}

interface AppSection {
  title: string;
  items: AppItem[];
}

const appSections: AppSection[] = [
  {
    title: "代币",
    items: [
      {
        name: "代币信息",
        href: (symbol?: string) => (symbol ? `/token/?symbol=${symbol}` : "/token/"),
        icon: Coins,
      },
      {
        name: "代币兑换",
        href: (symbol?: string) => (symbol ? `/dex/?symbol=${symbol}&tab=swap` : "/dex/?tab=swap"),
        icon: Repeat2,
      },
      {
        name: "流动性池",
        href: (symbol?: string) => (symbol ? `/dex/?symbol=${symbol}&tab=liquidity` : "/dex/?tab=liquidity"),
        icon: Droplets,
      },
      {
        name: "代币转账",
        href: (symbol?: string) => (symbol ? `/token/transfer/?symbol=${symbol}` : "/token/transfer/"),
        icon: SendHorizontal,
      },
      {
        name: "代币授权",
        href: (symbol?: string) => (symbol ? `/token/approvals/?symbol=${symbol}` : "/token/approvals/"),
        icon: Shield,
      },
      ...(isBatchTransferEnabled
        ? [
            {
              name: "批量转账",
              href: "/apps/batch-transfer",
              icon: ListChecks,
            },
          ]
        : []),
    ],
  },
  {
    title: "NFT",
    items: [
      {
        name: "LOVE20 NFT",
        href: "/group/groupids/",
        icon: Users,
      },
      {
        name: "链群管理",
        href: (symbol?: string) => (symbol ? `/extension/my_groups?symbol=${symbol}` : "/extension/my_groups"),
        icon: ShieldCheck,
      },
      {
        name: "聊天",
        href: "/chat/",
        icon: MessageCircle,
      },
    ],
  },
];

function resolveHref(href: AppItem["href"], symbol?: string) {
  return typeof href === "function" ? href(symbol) : href;
}

function SectionHeader({ title, symbol }: { title: string; symbol?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="shrink-0 text-base font-bold text-greyscale-900">{title}</h2>
      {symbol && (
        <span className="rounded-full bg-greyscale-100 px-3 py-1 text-xs font-semibold text-secondary">{symbol}</span>
      )}
      <div className="h-px flex-1 bg-greyscale-200" />
    </div>
  );
}

function AppIcon({ item, symbol }: { item: AppItem; symbol?: string }) {
  const Icon = item.icon;

  return (
    <Link
      href={resolveHref(item.href, symbol)}
      className="group relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg bg-white px-2 py-3 text-center transition-all hover:bg-secondary/5"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-greyscale-100 text-secondary">
        <Icon className="h-5 w-5" />
        {item.hasUnread && (
          <span
            className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
            aria-label="有新消息"
          />
        )}
      </span>
      <div className="line-clamp-2 w-full text-sm font-semibold leading-tight text-greyscale-900">{item.name}</div>
    </Link>
  );
}

export default function AppsPage() {
  const { isConnected } = useAccount();
  const { token } = useContext(TokenContext) || {};
  const { totalUnread } = useGroupChatUnreadSummary();
  const symbol = token?.symbol;
  const hasUnreadChat = totalUnread > BigInt(0);

  return (
    <>
      <Header title="应用中心" showBackButton={true} />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-3 sm:pt-6">
          {!isConnected && (
            <div className="mb-4 rounded-md border border-greyscale-200 bg-greyscale-50 px-3 py-2 text-sm text-greyscale-500">
              未连接钱包：可浏览入口，涉及个人资产和身份的操作需先连接钱包。
            </div>
          )}

          <div className="space-y-6">
            {appSections.map((section) => (
              <section key={section.title}>
                <SectionHeader title={section.title} symbol={section.title === "代币" ? symbol : undefined} />
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(92px,1fr))]">
                  {section.items.map((app) => (
                    <AppIcon
                      key={app.name}
                      item={{ ...app, hasUnread: app.name === "聊天" && hasUnreadChat }}
                      symbol={symbol}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
