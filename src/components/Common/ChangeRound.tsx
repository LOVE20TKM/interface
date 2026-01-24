'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// 最多显示的轮次数量
const MAX_DISPLAY_ROUNDS = 30;

const ChangeRound: React.FC<{
  currentRound: bigint;
  maxRound?: bigint;
  handleChangedRound: (round: number) => void;
}> = ({ currentRound, maxRound, handleChangedRound }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jumpToRound, setJumpToRound] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSelectRound = (round: number) => {
    handleChangedRound(round);
    setIsOpen(false);
    setJumpToRound('');
    setInputError('');
  };

  const displayMaxRound = maxRound ?? currentRound;
  const maxRoundNum = Number(displayMaxRound);

  // 计算要显示的轮次范围：从 displayMaxRound 往下最多 MAX_DISPLAY_ROUNDS 条
  const displayCount = Math.min(maxRoundNum, MAX_DISPLAY_ROUNDS);

  // 处理跳转输入
  const handleJumpInputChange = (value: string) => {
    setJumpToRound(value);
    setInputError('');
  };

  // 处理跳转确认
  const handleJumpConfirm = () => {
    const roundNum = parseInt(jumpToRound, 10);
    if (isNaN(roundNum)) {
      setInputError('请输入有效的数字');
      return;
    }
    if (roundNum < 1) {
      setInputError('轮次不能小于 1');
      return;
    }
    if (roundNum > maxRoundNum) {
      setInputError(`轮次不能超过 ${maxRoundNum}`);
      return;
    }
    handleSelectRound(roundNum);
  };

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
      <DrawerContent 
        className="z-[9999] min-h-[25vh]"
        overlayClassName="z-[9998]"
      >
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="px-4 flex-grow">
          {/* 跳转到指定轮次的输入框 */}
          <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b">
            <span className="text-sm text-gray-600 whitespace-nowrap">跳到</span>
            <Input
              type="number"
              min={1}
              max={maxRoundNum}
              value={jumpToRound}
              onChange={(e) => handleJumpInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJumpConfirm();
                }
              }}
              placeholder={`1 - ${maxRoundNum}`}
              className="w-28 h-8 text-center"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">轮</span>
            <Button size="sm" variant="secondary" onClick={handleJumpConfirm} className="h-8">
              确认
            </Button>
          </div>
          {inputError && <p className="text-red-500 text-sm mb-2 -mt-2 text-center w-full">{inputError}</p>}

          {/* 轮次列表：最多显示 MAX_DISPLAY_ROUNDS 条 */}
          <div className="max-h-64 overflow-y-auto">
            {Array.from({ length: displayCount }, (_, i) => {
              const round = maxRoundNum - i;
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
            {/* 如果总轮次超过显示数量，显示提示 */}
            {maxRoundNum > MAX_DISPLAY_ROUNDS && (
              <p className="text-center text-gray-400 text-sm py-2">
                仅显示最近 {MAX_DISPLAY_ROUNDS} 轮，更早轮次请使用上方输入框跳转
              </p>
            )}
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
