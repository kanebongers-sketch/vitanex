'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

interface LiquidMotionProps {
  children: ReactNode
}

// Laat framer-motion de systeeminstelling volgen: bij prefers-reduced-motion
// vervallen de transform-animaties en blijven alleen zachte fades over.
export default function LiquidMotion({ children }: LiquidMotionProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
