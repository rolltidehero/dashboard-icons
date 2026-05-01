"use client"

import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { useTheme } from "next-themes"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MagicCardProps {
	children?: React.ReactNode
	className?: string
	gradientSize?: number
	gradientColor?: string
	gradientOpacity?: number
	gradientFrom?: string
	gradientTo?: string
}

export function MagicCard({
	children,
	className,
	gradientSize = 200,
	gradientColor = "",
	gradientOpacity = 0.8,
	gradientFrom = "#ff0a54",
	gradientTo = "#f9bec7",
}: MagicCardProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const mouseX = useMotionValue(-gradientSize)
	const mouseY = useMotionValue(-gradientSize)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (cardRef.current) {
				const { left, top } = cardRef.current.getBoundingClientRect()
				mouseX.set(e.clientX - left)
				mouseY.set(e.clientY - top)
			}
		},
		[mouseX, mouseY],
	)

	const handleMouseLeave = useCallback(() => {
		mouseX.set(-gradientSize)
		mouseY.set(-gradientSize)
	}, [mouseX, gradientSize, mouseY])

	useEffect(() => {
		mouseX.set(-gradientSize)
		mouseY.set(-gradientSize)
	}, [gradientSize, mouseX, mouseY])

	const { resolvedTheme } = useTheme()

	const [fromColor, setFromColor] = useState(gradientFrom)
	const [toColor, setToColor] = useState(gradientTo)

	useEffect(() => {
		if (resolvedTheme === "dark") {
			setFromColor("#ffb3c1")
			setToColor("#ff75a0")
		} else if (resolvedTheme === "light") {
			setFromColor("#1e9df1")
			setToColor("#8ed0f9")
		}
	}, [resolvedTheme])

	return (
		<div
			ref={cardRef}
			className={cn("group relative rounded-[inherit]", className)}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<motion.div
				className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border duration-300 group-hover:opacity-100"
				style={{
					background: useMotionTemplate`
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
          ${fromColor}, 
          ${toColor}, 
          var(--border) 100%
          )
          `,
				}}
			/>
			<div className="absolute inset-px rounded-[inherit] bg-background" />
			<motion.div
				className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, var(--magic-gradient-color, ${gradientColor}), transparent 100%)
          `,
					opacity: gradientOpacity,
				}}
			/>
			<div className="relative">{children}</div>
		</div>
	)
}
