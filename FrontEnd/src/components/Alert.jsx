import React from "react";

const styles = {
  info: "bg-sky-100 text-brand-900 border border-sky-300 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-700",
  success:
    "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700",
  warning:
    "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-700",
  danger:
    "bg-blush-100 text-blush-700 border border-blush-300 dark:bg-blush-900/30 dark:text-blush-100 dark:border-blush-700",
};

export default function Alert({ message, type = "info", onClose }) {
  if (!message) return null;
  return (
    <div
      className={`flex justify-between items-start gap-3 rounded-xl px-4 py-3 text-sm mb-4 ${styles[type] || styles.info}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
