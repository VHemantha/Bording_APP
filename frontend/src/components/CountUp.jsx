import { animate, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function CountUp({ to, suffix = '', prefix = '', decimals = 0, duration = 1.6 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) =>
    `${prefix}${v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`
  )

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration, ease: 'easeOut' })
      return controls.stop
    }
  }, [inView, to, duration, count])

  return <motion.span ref={ref}>{rounded}</motion.span>
}
