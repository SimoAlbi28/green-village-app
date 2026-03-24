import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

const THRESHOLD = 80
const MAX_PULL = 130

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshDone, setRefreshDone] = useState(false)
  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAtTop = () => window.scrollY <= 0

  // === TOUCH ===
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isAtTop() && !refreshing) {
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
    }
  }, [refreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || refreshing) return
    const diff = e.touches[0].clientY - startYRef.current
    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.5, MAX_PULL)
      setPullDistance(distance)
      if (distance > 10) e.preventDefault()
    } else {
      pullingRef.current = false
      setPullDistance(0)
    }
  }, [refreshing])

  // === MOUSE (desktop) ===
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (isAtTop() && !refreshing) {
      startYRef.current = e.clientY
      pullingRef.current = true
    }
  }, [refreshing])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!pullingRef.current || refreshing) return
    const diff = e.clientY - startYRef.current
    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.5, MAX_PULL)
      setPullDistance(distance)
      if (distance > 10) e.preventDefault()
    } else {
      pullingRef.current = false
      setPullDistance(0)
    }
  }, [refreshing])

  // === RELEASE (shared) ===
  const handleRelease = useCallback(async () => {
    if (!pullingRef.current) return
    pullingRef.current = false

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true)
      setRefreshDone(false)
      setPullDistance(THRESHOLD * 0.5)
      try {
        await onRefresh()
      } finally {
        setRefreshDone(true)
        // Mostra il check per un momento prima di chiudere
        setTimeout(() => {
          setRefreshing(false)
          setRefreshDone(false)
          setPullDistance(0)
        }, 600)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleRelease, { passive: true })

    // Mouse events (desktop)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleRelease)
    container.addEventListener('mouseleave', handleRelease)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleRelease)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleRelease)
      container.removeEventListener('mouseleave', handleRelease)
    }
  }, [handleTouchStart, handleTouchMove, handleMouseDown, handleMouseMove, handleRelease])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const spinnerOpacity = refreshing ? 1 : progress
  const spinnerScale = refreshing ? 1 : 0.5 + progress * 0.5

  return (
    <div ref={containerRef} className="pull-to-refresh-container">
      <div
        className="ptr-indicator"
        style={{
          transform: `translateX(-50%) translateY(${pullDistance - 55}px) scale(${spinnerScale})`,
          opacity: spinnerOpacity,
        }}
      >
        <div className={`ptr-circle ${refreshing ? (refreshDone ? 'done' : 'loading') : ''}`}>
          {refreshDone ? (
            <svg className="ptr-check" viewBox="0 0 24 24" width="20" height="20">
              <path d="M5 13l4 4L19 7" fill="none" stroke="#2d6a2d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="ptr-arrow" viewBox="0 0 24 24" width="18" height="18"
              style={!refreshing ? { transform: `rotate(${progress * 360}deg)` } : undefined}>
              <path d="M12 4v12M5 13l7 7 7-7" fill="none" stroke="#2d6a2d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div
        className="pull-to-refresh-content"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
