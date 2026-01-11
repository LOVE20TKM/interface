'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ArrowRight, HandCoins, Droplets, Users, Blocks } from 'lucide-react';

// My Components
import Header from '@/src/components/Header';

interface AppItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APP_LIST: AppItem[] = [
  { name: '代币兑换', href: '/dex/?tab=swap', icon: HandCoins },
  { name: '流动性池', href: '/dex/?tab=liquidity', icon: Droplets },
  { name: '链群NFT', href: '/extension/groupids/', icon: Users },
  // { name: '扩展行动', href: '/extension/factories/', icon: Blocks },
];

export default function AppsPage() {
  const { isConnected } = useAccount();

  return (
    <>
      <Header title="应用中心" showBackButton={true} />
      <main className="flex-grow">
        {!isConnected ? (
          <div className="flex flex-col items-center p-4 mt-4">
            <div className="text-center mb-4 text-greyscale-500">没有链接钱包，请先连接钱包</div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="space-y-3">
              {APP_LIST.map((app) => {
                const Icon = app.icon;
                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    className="flex items-center justify-between py-3 px-4 border border-greyscale-200 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-secondary" />
                      <span className="text-base font-medium">{app.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-greyscale-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
