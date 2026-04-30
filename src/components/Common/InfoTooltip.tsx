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

interface TooltipTriggerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  className?: string;
}

const TooltipTriggerButton = React.forwardRef<HTMLButtonElement, TooltipTriggerButtonProps>(
  ({ title, className = '', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center p-1 rounded hover:bg-gray-100 transition-colors ${className}`}
      aria-label={`查看${title}`}
      {...props}
    >
      <Info className="h-4 w-4 text-gray-500 hover:text-gray-700" />
    </button>
  ),
);
TooltipTriggerButton.displayName = 'TooltipTriggerButton';

export default function InfoTooltip({ title, content, className = '' }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const contentNode = (
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
            <TooltipTriggerButton title={title} className={className} />
          </div>
          <DialogContent className="sm:max-w-[425px] data-[state=closed]:animate-none data-[state=open]:animate-none">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="pt-2 pb-4">
              {contentNode}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 移动端使用 Drawer */}
      {!isDesktop && (
        <Drawer open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
          <div onClick={() => setIsOpen(true)}>
            <TooltipTriggerButton title={title} className={className} />
          </div>
          <DrawerContent className="pb-safe">
            <DrawerHeader>
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 mb-10">
              {contentNode}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
