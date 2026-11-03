import { useSyncExternalStore } from 'react'

let activeRequests = 0
const subscribers = new Set<() => void>()

function notifySubscribers() {
  for (const subscriber of subscribers) subscriber()
}

export function trackApiRequest<T>(request: () => Promise<T>): Promise<T> {
  activeRequests += 1
  notifySubscribers()

  let result: Promise<T>
  try {
    result = request()
  } catch (error) {
    activeRequests -= 1
    notifySubscribers()
    return Promise.reject(error)
  }

  return result.finally(() => {
    activeRequests = Math.max(0, activeRequests - 1)
    notifySubscribers()
  })
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

function getActiveRequestCount() {
  return activeRequests
}

export function useApiRequestCount() {
  return useSyncExternalStore(subscribe, getActiveRequestCount, () => 0)
}
