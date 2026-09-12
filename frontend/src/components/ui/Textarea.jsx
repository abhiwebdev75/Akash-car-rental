import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';
import { CONTROL_BASE, Field } from './Field';

/** Multi-line text control, matched to Input styling. */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className, id, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const textareaId = id || autoId;

  const control = (
    <textarea
      id={textareaId}
      ref={ref}
      rows={rows}
      aria-invalid={error ? 'true' : undefined}
      className={cn(
        CONTROL_BASE,
        'resize-y py-2.5 leading-relaxed',
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40' : 'border-hair',
        className
      )}
      {...props}
    />
  );

  if (label || hint || error) {
    return (
      <Field label={label} hint={hint} error={error} required={required} htmlFor={textareaId}>
        {control}
      </Field>
    );
  }
  return control;
});
