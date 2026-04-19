import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import { toast } from "react-toastify";

export function ToastNotification({ title, message, type }) {
  return (
    <div
      className={`pointer-events-auto max-w-sm overflow-hidden rounded-lg bg-white dark:bg-zinc-800 w-full shadow-lg border border-gray-200 dark:border-zinc-700`}
    >
      <div
        className={`flex items-start gap-3 p-4 ${type === "success" ? "bg-emerald-50 dark:bg-emerald-950/30" : type === "error" ? "bg-red-50 dark:bg-red-950/30" : type === "warning" ? "bg-amber-50 dark:bg-amber-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}
      >
        <div className="shrink-0 flex-none pt-0.5">
          {type === "success" ? (
            <CheckCircleIcon
              aria-hidden="true"
              className="h-6 w-6 text-emerald-500"
            />
          ) : (
            <XCircleIcon aria-hidden="true" className="h-6 w-6 text-red-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export const notification = (title, message, type) => {
  toast(<ToastNotification title={title} message={message} type={type} />, {
    hideProgressBar: true,
    autoClose: 3000,
    closeOnClick: true,
    closeButton: false,
    style: {
      backgroundColor: "transparent",
      boxShadow: "none",
    },
  });
};
