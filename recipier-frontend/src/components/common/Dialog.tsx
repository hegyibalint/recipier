import { ReactNode, useState, useEffect, useRef } from "react";
import {XCircleIcon} from "@heroicons/react/24/outline";

export function useDialog<D>() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogData, setDialogData] = useState<D | undefined>(undefined);
  const open = (data: D) => {
    setIsOpen(true);
    setDialogData(data);
  }
  const close = () => {
    setIsOpen(false);
    setDialogData(undefined);
  }

  return { isOpen, data: dialogData, open, close }
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Dialog = ({ isOpen, onClose, title, children }: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Handle opening and closing the modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    // The dialog is associated with its title via aria-labelledby
    <dialog ref={dialogRef} className="m-auto p-4">
      <div className="flex justify-baseline w-full">
        <h1 className="text-xl font-bold flex-1">{title}</h1>
        <XCircleIcon className="size-8" />
      </div>
      {children}
    </dialog>
  );
};

export default Dialog;