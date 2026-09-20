import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';
import { CONTROL_BASE, Field } from './Field';

/**
 * Text input. If given a label/hint/error it renders inside a Field; otherwise
 * it's a bare control (useful inside custom layouts). Forwards its ref so
 * react-hook-form's register() works directly.
 */
export const Input = forwardRef(function Input(
  { label, hint, error, required, className, id, type = 'text', leftIcon, onWheel, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  // On number inputs, scrolling the page while the field is focused would
  // otherwise increment/decrement the value. Blur on wheel so scrolling just
  // scrolls. Any caller-supplied onWheel still runs.
  const handleWheel = (e) => {
    if (type === 'number') e.currentTarget.blur();
    onWheel?.(e);
  };

  const control = (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {leftIcon}
        </span>
      )}
      <input
        id={inputId}
        ref={ref}
        type={type}
        onWheel={handleWheel}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          CONTROL_BASE,
          'h-11',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-hair',
          leftIcon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
        {control}
      </Field>
    );
  }
  return control;
});
