"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type React from "react"
import { useEffect, useState } from "react"

interface ResizableLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  defaultSidebarWidthPercent?: number // e.g. 35 means 35% width for sidebar
  minSidebarWidthPercent?: number // e.g. 20 means 20%
  maxSidebarWidthPercent?: number // e.g. 60 means 60%
  className?: string
  storageKey?: string // unique key for localStorage
}

export function ResizableLayout({
  children,
  sidebar,
  defaultSidebarWidthPercent = 35,
  minSidebarWidthPercent = 20,
  maxSidebarWidthPercent = 60,
  className = "",
  storageKey = "resizable-layout-sizes",
}: ResizableLayoutProps) {
  const [sidebarSize, setSidebarSize] = useState(defaultSidebarWidthPercent)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved sizes on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsedSize = JSON.parse(saved)
        if (typeof parsedSize === 'number' &&
            parsedSize >= minSidebarWidthPercent &&
            parsedSize <= maxSidebarWidthPercent) {
          setSidebarSize(parsedSize)
        }
      } catch (error) {
        console.warn('Failed to parse saved layout sizes:', error)
      }
    }
    setIsLoaded(true)
  }, [storageKey, minSidebarWidthPercent, maxSidebarWidthPercent])

  // Save sizes when they change
  const handleLayoutChange = (sizes: number[]) => {
    const [, sidebarPercent] = sizes
    setSidebarSize(sidebarPercent)
    localStorage.setItem(storageKey, JSON.stringify(sidebarPercent))
  }

  // Don't render until we've loaded saved sizes to prevent flash
  if (!isLoaded) {
    return <div className={`w-full h-screen ${className}`} />
  }

  return (
    <div className={`w-full h-screen ${className}`}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
        onLayout={handleLayoutChange}
      >
        {/* Main content */}
        <ResizablePanel
          defaultSize={100 - sidebarSize}
          minSize={100 - maxSidebarWidthPercent}
          maxSize={100 - minSidebarWidthPercent}
          className="flex flex-col"
        >
          {children}
        </ResizablePanel>

        {/* Drag handle with icon */}
        <ResizableHandle className="relative group bg-slate-100 hover:bg-slate-200 transition-colors duration-200 w-2">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-8 bg-slate-300 group-hover:bg-slate-400 rounded-full flex items-center justify-center transition-colors duration-200">
              <svg 
                width="8" 
                height="16" 
                viewBox="0 0 8 16" 
                fill="none" 
                className="text-slate-500 group-hover:text-slate-600 transition-colors duration-200"
              >
                <circle cx="2" cy="4" r="1" fill="currentColor" />
                <circle cx="6" cy="4" r="1" fill="currentColor" />
                <circle cx="2" cy="8" r="1" fill="currentColor" />
                <circle cx="6" cy="8" r="1" fill="currentColor" />
                <circle cx="2" cy="12" r="1" fill="currentColor" />
                <circle cx="6" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
        </ResizableHandle>

        {/* Sidebar */}
        <ResizablePanel
          defaultSize={sidebarSize}
          minSize={minSidebarWidthPercent}
          maxSize={maxSidebarWidthPercent}
          className="bg-white border-l border-slate-200 flex flex-col pb-12"
        >
          {sidebar}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}