import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, Loader2, X, AlertTriangle } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'loading' | 'warning'

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
    groupKey?: string // Pour regrouper les toasts similaires
    persistent?: boolean // Ne se ferme pas automatiquement
}

interface ToastProps {
    toast: Toast
    onRemove: (id: string) => void
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
    const [progress, setProgress] = useState(100)
    const [isPaused, setIsPaused] = useState(false)
    
    const duration = toast.duration || 4000
    const shouldShowProgress = !toast.persistent && toast.type !== 'loading' && duration > 0

    useEffect(() => {
        if (!shouldShowProgress || isPaused) return

        const startTime = Date.now()
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
            setProgress(remaining)
            
            if (remaining <= 0) {
                onRemove(toast.id)
            }
        }, 16) // ~60fps

        return () => clearInterval(timer)
    }, [toast, onRemove, shouldShowProgress, isPaused, duration])

    const icons = {
        success: <CheckCircle size={20} className="text-emerald-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />,
        warning: <AlertTriangle size={20} className="text-amber-500" />,
        loading: <Loader2 size={20} className="text-mayssa-caramel animate-spin" />,
    }

    const styles = {
        success: {
            bg: 'bg-emerald-50/95 border-emerald-200/50',
            accent: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-red-50/95 border-red-200/50',
            accent: 'bg-red-500'
        },
        info: {
            bg: 'bg-blue-50/95 border-blue-200/50',
            accent: 'bg-blue-500'
        },
        warning: {
            bg: 'bg-amber-50/95 border-amber-200/50',
            accent: 'bg-amber-500'
        },
        loading: {
            bg: 'bg-mayssa-soft/95 border-mayssa-caramel/30',
            accent: 'bg-mayssa-caramel'
        },
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
                opacity: 0, 
                x: 300, 
                scale: 0.9,
                transition: { duration: 0.2, ease: "easeIn" }
            }}
            whileHover={{ scale: 1.02 }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm shadow-xl ${styles[toast.type].bg} group`}
        >
            {/* Progress bar */}
            {shouldShowProgress && (
                <div className="absolute top-0 left-0 h-1 bg-black/10 w-full">
                    <motion.div
                        className={`h-full ${styles[toast.type].accent} transition-all duration-75`}
                        style={{ width: `${progress}%` }}
                        initial={{ width: '100%' }}
                    />
                </div>
            )}
            
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">
                    {icons[toast.type]}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mayssa-brown leading-relaxed">
                        {toast.message}
                    </p>
                    
                    {toast.action && (
                        <button
                            type="button"
                            onClick={toast.action.onClick}
                            className="mt-2 text-xs font-bold text-mayssa-caramel hover:text-mayssa-brown transition-colors underline cursor-pointer"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                {!toast.persistent && (
                    <button
                        type="button"
                        onClick={() => onRemove(toast.id)}
                        className="flex-shrink-0 text-mayssa-brown/40 hover:text-mayssa-brown transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                        aria-label="Fermer la notification"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </motion.div>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    // Regrouper les toasts similaires
    const groupedToasts = useMemo(() => {
        const groups = new Map()
        
        toasts.forEach(toast => {
            const key = toast.groupKey || toast.id
            if (groups.has(key)) {
                const existing = groups.get(key)
                if (existing.count) {
                    existing.count++
                } else {
                    groups.set(key, { ...existing, count: 2 })
                }
            } else {
                groups.set(key, toast)
            }
        })
        
        return Array.from(groups.values())
    }, [toasts])

    // Limiter le nombre de toasts affichés
    const displayedToasts = groupedToasts.slice(-5) // Maximum 5 toasts

    return (
        <div
            className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full sm:max-w-md pointer-events-none"
            role="status"
            aria-live="polite"
            aria-label="Notifications"
        >
            <AnimatePresence mode="popLayout">
                {displayedToasts.map((toast) => (
                    <motion.div 
                        key={toast.id}
                        layout
                        className="pointer-events-auto"
                    >
                        <div className="relative">
                            <ToastComponent toast={toast} onRemove={onRemove} />
                            {toast.count && toast.count > 1 && (
                                <div className="absolute -top-2 -right-2 bg-mayssa-caramel text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                                    {toast.count}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {/* Overflow indicator */}
            {toasts.length > 5 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs text-mayssa-brown/60 text-center py-2 pointer-events-auto"
                >
                    +{toasts.length - 5} autres notifications
                </motion.div>
            )}
        </div>
    )
}

// Hook utilitaire pour gérer les toasts améliorés
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7)
        setToasts(prev => [...prev, { ...toast, id }])
        return id
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const removeAll = () => {
        setToasts([])
    }

    // Fonctions de commodité
    const success = (message: string, options?: Partial<Toast>) => 
        addToast({ message, type: 'success', ...options })
    
    const error = (message: string, options?: Partial<Toast>) => 
        addToast({ message, type: 'error', ...options })
    
    const info = (message: string, options?: Partial<Toast>) => 
        addToast({ message, type: 'info', ...options })
    
    const warning = (message: string, options?: Partial<Toast>) => 
        addToast({ message, type: 'warning', ...options })
    
    const loading = (message: string, options?: Partial<Toast>) => 
        addToast({ message, type: 'loading', ...options })

    return {
        toasts,
        addToast,
        removeToast,
        removeAll,
        success,
        error,
        info,
        warning,
        loading
    }
}
