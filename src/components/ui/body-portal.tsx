import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function BodyPortal({ children }: React.PropsWithChildren) {
  const [mounted, setMounted] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer(document.body)
    setMounted(true)
  }, [])

  return mounted && container ? createPortal(children, container) : null
}
