import * as React from "react"
import { cn } from "../../lib/utils"

const Toast = React.forwardRef(({ className, variant = "default", title, description, onClose, ...props }, ref) => {
  const variants = {
    default: "bg-slate-900/90 text-white border-white/10 backdrop-blur",
    success: "bg-emerald-600/20 text-white border-emerald-500/30 backdrop-blur",
    error: "bg-red-600/20 text-white border-red-500/30 backdrop-blur",
    destructive: "bg-red-600/20 text-white border-red-500/30 backdrop-blur",
    warning: "bg-yellow-600/20 text-white border-yellow-500/30 backdrop-blur",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold leading-snug">{title}</div>}
        {description && <div className="text-sm opacity-90 leading-snug">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
        >
          <span className="sr-only">Close</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
})

Toast.displayName = "Toast"

export { Toast }
