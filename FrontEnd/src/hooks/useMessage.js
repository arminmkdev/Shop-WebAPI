import { useState } from "react";

export function useMessage() {
  const [alert, setAlert] = useState(null);
  const show = (message, type = 'info') => setAlert({ message, type });
  return [alert, show, () => setAlert(null)];
}