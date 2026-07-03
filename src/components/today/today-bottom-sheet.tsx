'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodayBottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailViewLayout({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 -mx-4 px-4">
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 -mx-4 px-4 pt-3 mt-2 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function TodayBottomSheet({ open, title, onClose, children, footer }: TodayBottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 bg-background rounded-t-3xl shadow-xl flex flex-col min-h-0',
          'max-h-[min(88dvh,calc(100dvh-1rem))]',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-base pr-2">{title}</h2>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col min-h-0 flex-1 px-4 py-4">
          {footer ? (
            <DetailViewLayout footer={footer}>{children}</DetailViewLayout>
          ) : (
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
