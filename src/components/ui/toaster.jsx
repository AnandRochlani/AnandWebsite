import { useToast } from "./use-toast"
import { Toast } from "./toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[420px]"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          className={toast.className}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </div>
  )
}
