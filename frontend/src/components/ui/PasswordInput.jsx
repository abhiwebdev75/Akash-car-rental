import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

/**
 * Password field with a show/hide toggle. Behaves exactly like <Input> (label,
 * hint, error, register-friendly ref forwarding) but manages a local
 * visibility state and swaps the input type between "password" and "text".
 *
 * The toggle is a real button with an aria-label and aria-pressed state, and is
 * marked tabIndex={-1} so keyboard users tab straight from the field to the
 * next control rather than onto the reveal button.
 */
export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-fg-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
});
