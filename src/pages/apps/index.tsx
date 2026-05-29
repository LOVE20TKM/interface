"use client";

import { useContext } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import {
  ArrowLeftRight,
  Coins,
  Droplets,
  HandCoins,
  Lock,
  LucideIcon,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "@/src/components/Header";
import { TokenContext } from "@/src/contexts/TokenContext";
import { useGroupChatUnreadSummary } from "@/src/contexts/GroupChatSyncContext";

interface AppItem {
  name: string;
  href: string | ((symbol?: string) => string);
  icon: LucideIcon;
  requiresWallet?: boolean;
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
        icon: HandCoins,
      },
      {
        name: "流动性池",
        href: (symbol?: string) => (symbol ? `/dex/?symbol=${symbol}&tab=liquidity` : "/dex/?tab=liquidity"),
        icon: Droplets,
      },
      {
        name: "代币转账",
        href: (symbol?: string) => (symbol ? `/token/transfer/?symbol=${symbol}` : "/token/transfer/"),
        icon: ArrowLeftRight,
        requiresWallet: true,
      },
    ],
  },
  {
    title: "NFT",
    items: [
      {
        name: "LOVE20 NFT",
        href: "/group/groupids/",
        icon: Users,
        requiresWallet: true,
      },
      {
        name: "链群管理",
        href: (symbol?: string) => (symbol ? `/extension/my_groups?symbol=${symbol}` : "/extension/my_groups"),
        icon: ShieldCheck,
        requiresWallet: true,
      },
      {
        name: "聊天",
        href: (symbol?: string) => (symbol ? `/chat/?symbol=${symbol}` : "/chat/"),
        icon: MessageCircle,
        requiresWallet: true,
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

function AppIcon({
  item,
  symbol,
  showWalletHint = false,
}: {
  item: AppItem;
  symbol?: string;
  showWalletHint?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={resolveHref(item.href, symbol)}
      className="group relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg bg-white px-2 py-3 text-center transition-all hover:bg-secondary/5"
    >
      {showWalletHint && item.requiresWallet && (
        <span className="absolute right-2 top-2 text-greyscale-400" title="需要钱包" aria-label="需要钱包">
          <Lock className="h-3.5 w-3.5" />
        </span>
      )}
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
                      showWalletHint={!isConnected}
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
