"use client";

import { X } from "lucide-react";

type AdminDetailDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AdminDetailDrawer({ open, title, onClose, children, footer }: AdminDetailDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <button type="button" className="flex-1" onClick={onClose} aria-label="Close details drawer" />
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 p-5">{footer}</div> : null}
      </aside>
    </div>
  );
}
