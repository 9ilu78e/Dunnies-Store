import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className,
  ...props
}) => {
  const baseStyles =
    'rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-500 shadow-md hover:shadow-lg',
    secondary:
      'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 focus:ring-gray-500 shadow-md hover:shadow-lg',
    outline:
      'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 active:bg-purple-100 focus:ring-purple-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-md hover:shadow-lg',
    ghost:
      'text-gray-700 hover:bg-gray-100 hover:text-purple-600 active:bg-gray-200 focus:ring-purple-500',
  }

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2.5 text-base',
    large: 'px-6 py-3.5 text-lg',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button