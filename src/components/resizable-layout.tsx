"use client"

import { GripVertical } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

interface ResizableLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  defaultSidebarWidth?: number
  minSidebarWidth?: number
  maxSidebarWidthPercent?: number
  className?: string
}

const LOCAL_STORAGE_KEY = "resizableLayout.sidebarWidth"

export function ResizableLayout({
  children,
  sidebar,
  defaultSidebarWidth = 384,
  minSidebarWidth = 280,
  maxSidebarWidthPercent = 0.6,
  className = "",
}: ResizableLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved width after hydration
  useEffect(() => {
    const savedWidth = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedWidth !== null) {
      const parsed = parseInt(savedWidth, 10)
      if (!isNaN(parsed)) {
        setSidebarWidth(parsed)
      }
    }
    setIsHydrated(true)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX

      const maxWidth = containerRect.width * maxSidebarWidthPercent
      const clampedWidth = Math.max(minSidebarWidth, Math.min(maxWidth, newWidth))

      setSidebarWidth(clampedWidth)
      if (isHydrated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, clampedWidth.toString())
      }
    },
    [isResizing, minSidebarWidth, maxSidebarWidthPercent, isHydrated],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className={`flex h-screen ${className}`}>
      <div className="flex-1 flex flex-col" style={{ width: `calc(100% - ${sidebarWidth}px)` }}>
        {children}
      </div>

      <div
        className={`w-1 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center transition-colors ${
          isResizing ? "bg-primary" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-3 h-3 text-slate-400" />
      </div>

      <div
        className="bg-white border-l border-slate-200 flex flex-col"
        style={{ width: `${sidebarWidth}px`, minWidth: `${minSidebarWidth}px` }}
      >
        {sidebar}
      </div>
    </div>
  )
}