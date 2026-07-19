'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-zinc-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white border-0"
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
