"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const trapRef = useFocusTrap(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="panel"
            ref={trapRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal={true}
            aria-labelledby={title ? "modal-title" : undefined}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 p-6"
          >
            {title && (
              <h2
                id="modal-title"
                className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]"
              >
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
