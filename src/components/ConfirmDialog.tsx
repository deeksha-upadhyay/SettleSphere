import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] border-none shadow-2xl bg-white p-8 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-text-dark uppercase tracking-tighter">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-medium pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl py-6 font-bold">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-accent hover:bg-accent-dark text-text-dark font-black rounded-2xl py-6">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
