import React from "react";

export default function Alert({ message, type = 'info', onClose }) {
  if (!message) return null;
  return (
    <div
      className={`alert alert-${type} d-flex justify-content-between align-items-start`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          className="btn-close ms-3"
          onClick={onClose}
          aria-label="Close"
        />
      )}
    </div>
  );
}