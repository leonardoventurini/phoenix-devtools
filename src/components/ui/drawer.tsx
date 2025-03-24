import { IconPin, IconPinned, IconX } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { cn } from '@src/utils/cn'
import { NavButton } from './nav-button'
import { BodyPortal } from './body-portal'
import { HorizontalLoader } from './horizontal-loader'
import { useClickOutside } from '@src/hooks/use-click-outside'

export enum DrawerSize {
  Small = 'sm',
  Big = 'lg',
}

type DrawerProps = {
  children: React.ReactNode
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
  onFinishedClosing?: () => void
  className?: string
  dialogClassName?: string
  position?: 'left' | 'right'
  drawerClassName?: string
  size?: DrawerSize
  pin?: boolean
  closeOnClickOutside?: boolean
}

export function Drawer({
  children,
  open,
  onClose,
  onConfirm,
  title,
  footer,
  loading,
  onFinishedClosing,
  className,
  position = 'right',
  drawerClassName,
  size = DrawerSize.Big,
  pin = false,
  closeOnClickOutside = true,
}: DrawerProps) {
  const [isPinned, setPinned] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const ref = useClickOutside<HTMLDivElement>(() => {
    if (!isPinned && closeOnClickOutside) {
      onClose?.()
    }
  })

  return (
    <BodyPortal>
      <AnimatePresence onExitComplete={onFinishedClosing}>
        {open && (
          <motion.div
            className={cn(
              'fixed inset-y-0 z-[100000] m-0 flex w-full',
              drawerClassName,
              position === 'right' ? 'right-0' : 'left-0',
              size === DrawerSize.Small ? 'max-w-sm' : 'max-w-[960px]',
            )}
            ref={ref}
            initial={{
              x: position === 'right' ? '100%' : '-100%',
              width: '100%',
            }}
            animate={{
              x: 0,
              width: '100%',
            }}
            exit={{
              x: position === 'right' ? '100%' : '-100%',
              width: '100%',
            }}
            transition={{
              type: 'tween',
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            <div
              className={cn(
                'flex h-screen w-full flex-col divide-y divide-gray-200 border-gray-100 bg-white shadow-xl dark:divide-slate-500/50 dark:border-slate-600 dark:bg-slate-700',
                position === 'right' ? 'border-l' : 'border-r',
              )}
            >
              <div className='flex max-h-full min-h-0 flex-1 flex-col'>
                <div className='border-b border-gray-100 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700'>
                  <div className='flex items-center justify-between'>
                    <div className='mb-0 text-base font-semibold leading-6 text-gray-900 dark:text-gray-300'>
                      {title}
                    </div>
                    <div className='ml-3 flex h-7 items-center gap-4'>
                      <button
                        type='button'
                        className='rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none'
                        onClick={() => setPinned(!isPinned)}
                      >
                        <span className='sr-only'>
                          Pin Drawer
                        </span>
                        {pin ? (
                          isPinned ? (
                            <IconPinned className='h-6 w-6' />
                          ) : (
                            <IconPin className='h-6 w-6' />
                          )
                        ) : null}
                      </button>

                      <button
                        type='button'
                        className='rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none'
                        onClickCapture={e => {
                          e.stopPropagation()
                          onClose?.()
                        }}
                      >
                        <span className='sr-only'>
                          Close Drawer
                        </span>

                        <IconX className='size-6' aria-hidden='true' />
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  className={cn('relative flex-1 overflow-auto p-4', className)}
                >
                  {loading ? <HorizontalLoader /> : children}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BodyPortal>
  )
}
