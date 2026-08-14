import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.4rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.875rem' },
    lg: { padding: '0.8rem 1.75rem', fontSize: '1rem' },
  };

  return (
    <button
      className={`btn btn-${variant} ${className}`}
      style={sizeStyles[size]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite',
            marginRight: '0.375rem',
          }}
        />
      ) : (
        leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
    </button>
  );
};
