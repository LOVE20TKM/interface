import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { useMediaQuery } from '@mui/material';
import React, { useContext, useState } from 'react';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';
import { TOKEN_CONFIG } from '@/src/config/tokenConfig';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useTotalSupply } from '@/src/hooks/contracts/useLOVE20Token';
// my components
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import TokenLabel from '@/src/components/Token/TokenLabel';

export default function TokenTab() {
  const { token } = useContext(TokenContext) || {};

  // 获取已铸币量
  const {
    totalSupply,
    isPending: isTotalSupplyPending,
    error: totalSupplyError,
  } = useTotalSupply((token?.address as `0x${string}`) || '');

  // 控制 Drawer 的显隐
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  if (!token?.address) {
    return <LoadingIcon />;
  }

  return (
    <div className="px-4 pt-0 pb-3">
      <div className="bg-gray-100 rounded-lg p-4 text-sm mt-4">
        <TokenLabel />
        <div className="mt-1 flex items-center" onClick={() => setIsOpen(true)}>
          <Info className="w-4 h-4 mr-1 text-greyscale-500 cursor-pointer" />
          <span className="text-sm text-greyscale-500 mr-1">已铸币量:</span>
          <span className="text-sm text-secondary font-mono">
            {isTotalSupplyPending ? <LoadingIcon /> : formatTokenAmount(totalSupply || BigInt(0))}
          </span>
        </div>
      </div>

      {isDesktop && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger> </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>经济模型</DialogTitle>
            <div className="px-12 pt-2 pb-4 text-gray-800">
              <p className="font-bold text-large mb-2">
                代币总量：
                <span>{formatTokenAmount(BigInt(TOKEN_CONFIG.totalSupply))}</span>
              </p>
              <p>
                - 公平发射：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.fairLaunch))}</span> (10%)
              </p>
              <p>
                - 治理激励：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.govRewards))}</span> (45%)
              </p>
              <p>
                - 行动激励：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.actionRewards))}</span> (45%)
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {!isDesktop && (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>经济模型</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <div className="px-12 pt-2 pb-4 text-gray-800 text-lg">
              <p className="font-bold text-xl mb-2">
                代币总量：
                <span>{formatTokenAmount(BigInt(TOKEN_CONFIG.totalSupply))}</span>
              </p>
              <p>
                - 公平发射：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.fairLaunch))}</span> (10%)
              </p>
              <p>
                - 治理激励：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.govRewards))}</span> (45%)
              </p>
              <p>
                - 行动激励：
                <span className="text-secondary">{formatTokenAmount(BigInt(TOKEN_CONFIG.actionRewards))}</span> (45%)
              </p>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-1/2 mx-auto text-secondary border-secondary">
                  关闭
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
