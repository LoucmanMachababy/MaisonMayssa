import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, Loader2, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastProps {
    toast: Toast
    onRemove: (id: string) => void
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
    useEffect(() => {
        if (toast.type !== 'loading' && toast.duration !== 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id)
            }, toast.duration || 3000)
            return () => clearTimeout(timer)
        }
    }, [toast, onRemove])

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />,
        loading: <Loader2 size={20} className="text-mayssa-caramel animate-spin" />,
    }

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        loading: 'bg-mayssa-soft border-mayssa-caramel/30',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 rounded-xl border p-4 shadow-lg ${bgColors[toast.type]}`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-mayssa-brown">{toast.message}</p>
            {toast.type !== 'loading' && (
                <button
                    onClick={() => onRemove(toast.id)}
                    className="text-mayssa-brown/40 hover:text-mayssa-brown transition-colors"
                    aria-label="Fermer la notification"
                >
                    <X size={16} />
                </button>
            )}
        </motion.div>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div
            className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            role="status"
            aria-live="polite"
            aria-label="Notifications"
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastComponent toast={toast} onRemove={onRemove} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    )
}
