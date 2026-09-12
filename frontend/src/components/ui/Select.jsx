import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CONTROL_BASE, Field } from './Field';

/**
 * Native <select> styled to match Input. Options passed as `options`
 * ([{value,label}]) or as children. Native keeps it accessible + mobile-friendly.
 */
export const Select = forwardRef(function Select(
  { label, hint, error, required, className, id, options, placeholder, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  const control = (
    <div className="relative">
      <select
        id={selectId}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          CONTROL_BASE,
          'h-11 cursor-pointer appearance-none pr-10',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-hair',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} required={required} htmlFor={selectId}>
        {control}
      </Field>
    );
  }
  return control;
});
