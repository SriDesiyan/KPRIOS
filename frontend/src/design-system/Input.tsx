import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, isPassword, className = '', type = 'text', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                display: 'inline-flex',
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={`form-input ${className}`}
            style={{
              paddingLeft: leftIcon ? '2.5rem' : '0.875rem',
              paddingRight: isPassword ? '2.5rem' : '0.875rem',
              borderColor: error ? '#ef4444' : undefined,
            }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                padding: '0.2rem',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <span className="form-error">{error}</span>}
        {!error && helperText && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
