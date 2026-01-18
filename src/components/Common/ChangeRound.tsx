'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const ChangeRound: React.FC<{
  currentRound: bigint;
  maxRound?: bigint;
  handleChangedRound: (round: number) => void;
}> = ({ currentRound, maxRound, handleChangedRound }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleSelectRound = (round: number) => {
    handleChangedRound(round);
    setIsOpen(false);
  };
  const displayMaxRound = maxRound ?? currentRound;

  // 触摸滚动检测，避免滑动松手误触发选择
  const touchStartYRef = useRef<number | null>(null);
  const isTouchScrollingRef = useRef(false);
  const SCROLL_THRESHOLD_PX = 10;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-secondary no-underline pl-2 pr-1">
          切换轮次
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[9999] min-h-[25vh]">
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="px-4 flex-grow">
          <div className="max-h-64 overflow-y-auto">
            {Array.from({ length: Number(displayMaxRound) }, (_, i) => {
              const round = Number(displayMaxRound) - i;
              return (
                <Button
                  key={round}
                  variant="ghost"
                  className="w-full p-2 text-center rounded-none hover:bg-gray-100 touch-manipulation"
                  onPointerDown={(e) => {
                    // 记录触摸起点，仅在触摸时处理滑动检测
                    if (e.pointerType === 'touch') {
                      touchStartYRef.current = e.clientY;
                      isTouchScrollingRef.current = false;
                    } else {
                      touchStartYRef.current = null;
                      isTouchScrollingRef.current = false;
                    }
                  }}
                  onPointerMove={(e) => {
                    if (e.pointerType !== 'touch') return;
                    if (touchStartYRef.current === null) return;
                    const deltaY = Math.abs(e.clientY - touchStartYRef.current);
                    if (deltaY > SCROLL_THRESHOLD_PX) {
                      isTouchScrollingRef.current = true;
                    }
                  }}
                  onPointerUp={(e) => {
                    if (e.pointerType === 'touch') {
                      // 触摸：如果发生过明显滑动，则不触发选择
                      if (!isTouchScrollingRef.current) {
                        handleSelectRound(round);
                      }
                      // 重置
                      touchStartYRef.current = null;
                      isTouchScrollingRef.current = false;
                    } else {
                      // 非触摸（鼠标/触控笔）：直接选择
                      handleSelectRound(round);
                    }
                  }}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-lg">第 {round} 轮</span>
                </Button>
              );
            })}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ChangeRound;
