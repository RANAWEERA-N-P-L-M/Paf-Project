import { useCallback, useRef, useEffect, useState } from 'react'

/**
 * Shared hook for calculating time remaining until a deadline
 * Returns formatted time string and status information
 */
export const useDeadlineTimer = () => {
  const calculateTimeRemaining = useCallback((deadline) => {
    if (!deadline) return null

    const deadlineTime = new Date(deadline).getTime()
    const now = new Date().getTime()
    const remaining = deadlineTime - now

    if (remaining <= 0) {
      return { expired: true, text: 'EXPIRED', className: 'text-red-600 font-bold' }
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    if (days > 0) {
      return { 
        expired: false, 
        text: `${days}d ${hours}h ${minutes}m ${seconds}s`, 
        critical: false,
        className: 'text-gray-600'
      }
    } else if (hours > 0) {
      const isCritical = hours < 3
      return { 
        expired: false, 
        text: `${hours}h ${minutes}m ${seconds}s`, 
        critical: isCritical,
        className: isCritical ? 'text-orange-600 font-semibold' : 'text-gray-600'
      }
    } else {
      return { 
        expired: false, 
        text: `${minutes}m ${seconds}s`, 
        critical: true,
        className: 'text-red-600 font-bold'
      }
    }
  }, [])

  return calculateTimeRemaining
}

export const useCountdownTimer = (items = [], getDeadline = (item) => item.deadline) => {
  const [timeRemaining, setTimeRemaining] = useState({})
  const timerRef = useRef(null)
  const calculateTimeRemaining = useDeadlineTimer()

  const getDeadlineRef = useRef(getDeadline)
  useEffect(() => {
    getDeadlineRef.current = getDeadline
  }, [getDeadline])

  const updateCountdown = useCallback(() => {
    setTimeRemaining((prev) => {
      const updated = {}
      let hasChanges = Object.keys(prev).length !== items.length

      items.forEach((item) => {
        const key = item.id || item.ticketId
        const newValue = calculateTimeRemaining(getDeadlineRef.current(item))
        updated[key] = newValue

        if (!hasChanges) {
          const prevValue = prev[key]
          if (
            !prevValue ||
            prevValue.text !== newValue?.text ||
            prevValue.className !== newValue?.className ||
            prevValue.expired !== newValue?.expired ||
            prevValue.critical !== newValue?.critical
          ) {
            hasChanges = true
          }
        }
      })

      return hasChanges ? updated : prev
    })
  }, [items, calculateTimeRemaining])

  useEffect(() => {
    updateCountdown()
    // Update every 1 second for smoother countdown
    timerRef.current = setInterval(updateCountdown, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [updateCountdown])

  return { timeRemaining, updateCountdown }
}

export default {
  useDeadlineTimer,
  useCountdownTimer,
}
