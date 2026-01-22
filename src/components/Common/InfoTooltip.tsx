import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerHeader } from '@/components/ui/drawer';
import { useMediaQuery } from '@mui/material';

interface InfoTooltipProps {
  title: string;
  content: string | React.ReactNode;
  className?: string;
}

export default function InfoTooltip({ title, content, className = '' }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // 共享的触发按钮 - 使用 forwardRef
  const TriggerButton = React.forwardRef<HTMLButtonElement>((props, ref) => (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center p-1 rounded hover:bg-gray-100 transition-colors ${className}`}
      aria-label={`查看${title}`}
      {...props}
    >
      <Info className="h-4 w-4 text-gray-500 hover:text-gray-700" />
    </button>
  ));
  TriggerButton.displayName = 'TriggerButton';

  // 共享的内容组件
  const InfoContent = () => (
    <div className="text-gray-700">
      {typeof content === 'string' ? (
        <p className="leading-relaxed text-sm whitespace-pre-line">{content}</p>
      ) : (
        content
      )}
    </div>
  );

  return (
    <>
      {/* 桌面端使用 Dialog */}
      {isDesktop && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <div onClick={() => setIsOpen(true)}>
            <TriggerButton />
          </div>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="pt-2 pb-4">
              <InfoContent />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 移动端使用 Drawer */}
      {!isDesktop && (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <div onClick={() => setIsOpen(true)}>
            <TriggerButton />
          </div>
          <DrawerContent className="pb-safe">
            <DrawerHeader>
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 mb-10">
              <InfoContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
