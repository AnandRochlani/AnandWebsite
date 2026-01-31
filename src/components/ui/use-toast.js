import { useState, useEffect } from 'react'

let toastCount = 0
const toasts = new Map()

const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getToasts() {
  return Array.from(toasts.values())
}

function notify() {
  listeners.forEach(listener => listener())
}

export function dismissToast(id) {
  if (toasts.has(id)) {
    toasts.delete(id)
    notify()
  }
}

export function toast({ title, description, variant = 'default', className, duration = 5000 }) {
  const id = ++toastCount
  const newToast = { id, title, description, variant, className }
  toasts.set(id, newToast)
  notify()
  
  if (duration !== Infinity) {
    setTimeout(() => {
      dismissToast(id)
    }, Number(duration) || 5000)
  }
  
  return id
}

export function useToast() {
  const [toastList, setToastList] = useState(getToasts)
  
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setToastList([...getToasts()])
    })
    return unsubscribe
  }, [])
  
  return {
    toast,
    toasts: toastList,
    dismiss: dismissToast,
  }
}
