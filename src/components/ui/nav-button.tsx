import { cn } from '@src/utils/cn'
import { IconLoader } from '@tabler/icons-react'
import { cva, type VariantProps } from 'class-variance-authority'
import React, { forwardRef } from 'react'
import { Link } from 'react-router-dom'

type ItemMenu = {
  label: string
  onClick: () => void
  leftSection: React.ReactNode
}

const navButtonVariants = cva(
  [
    'flex items-center gap-1.5 px-3 py-2 cursor-pointer',
    'text-[9px] font-medium transition-colors duration-200 ease-in-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'hover:bg-gray-300/30 dark:hover:bg-slate-500/30',
          'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100',
          'active:bg-gray-400/50 dark:active:bg-slate-400/50',
        ],
        primary: [
          'bg-emerald-400/10 hover:bg-emerald-400/20',
          'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300',
          'active:bg-emerald-400/30 dark:active:bg-emerald-400/30',
        ],
        secondary: [
          'bg-slate-400/10 hover:bg-slate-400/20',
          'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300',
          'active:bg-slate-400/30 dark:active:bg-slate-400/30',
        ],
        success: [
          'bg-green-400/10 hover:bg-green-400/20',
          'text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300',
          'active:bg-green-400/30 dark:active:bg-green-400/30',
        ],
        danger: [
          'bg-rose-400/10 hover:bg-rose-400/20',
          'text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300',
          'active:bg-rose-400/30 dark:active:bg-rose-400/30',
        ],
        warning: [
          'bg-yellow-400/10 hover:bg-yellow-400/20',
          'text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300',
          'active:bg-yellow-400/30 dark:active:bg-yellow-400/30',
        ],
        info: [
          'bg-blue-400/10 hover:bg-blue-400/20',
          'text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300',
          'active:bg-blue-400/30 dark:active:bg-blue-400/30',
        ],
      },
      size: {
        default: 'text-xs',
        sm: 'text-xs py-1.5',
        md: 'text-sm py-2',
        lg: 'text-base py-2.5',
      },
      square: {
        true: null,
        false: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type NavButtonProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof navButtonVariants> & {
    icon?: React.ElementType
    collapsible?: boolean
    iconRight?: boolean
    to?: string
    loading?: boolean
    menu?: ItemMenu[]
    disabled?: boolean
    active?: boolean
    square?: boolean
  }

export const NavButton = forwardRef<any, NavButtonProps>(
  (
    {
      children,
      className,
      icon: Icon,
      collapsible = false,
      iconRight = false,
      to,
      loading,
      disabled = false,
      active,
      variant,
      size,
      square,
      ...props
    },
    ref
  ) => {
    const genericProps = {
      className: cn(
        navButtonVariants({ variant, size, square }),
        {
          'cursor-default': disabled,
          // active
          'bg-gray-400/50 dark:bg-slate-400/50 text-gray-900 dark:text-slate-100':
            active && variant === 'default',
          'bg-emerald-400/30 dark:bg-emerald-400/30':
            active && variant === 'primary',
          'bg-slate-400/30 dark:bg-slate-400/30':
            active && variant === 'secondary',
          'bg-green-400/30 dark:bg-green-400/30':
            active && variant === 'success',
          'bg-rose-400/30 dark:bg-rose-400/30': active && variant === 'danger',
          'bg-yellow-400/30 dark:bg-yellow-400/30':
            active && variant === 'warning',
        },
        className
      ),
      disabled,
      ...props,
    }

    const icon =
      Icon && !iconRight ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null

    const contents = (
      <>
        {loading ? (
          <IconLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}

        {collapsible ? (
          <span className="hidden md:inline">{children}</span>
        ) : (
          children
        )}

        {Icon && iconRight ? (
          <Icon className="h-4 w-4" aria-hidden="true" />
        ) : null}
      </>
    )

    if (to) {
      return (
        <Link to={to} ref={ref} {...genericProps}>
          {contents}
        </Link>
      )
    }

    return (
      <button type="button" ref={ref} {...genericProps}>
        {contents}
      </button>
    )
  }
)

NavButton.displayName = 'NavButton'
