import { Badge } from './Badge';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META } from '../../lib/constants';

/**
 * Renders a booking or payment status as a coloured Badge, using the shared
 * meta maps so the label + tone stay consistent everywhere they appear.
 * `kind` selects which map; unknown values fall back to the raw code.
 */
export function StatusBadge({ status, kind = 'booking', size = 'md', className }) {
  const map = kind === 'payment' ? PAYMENT_STATUS_META : BOOKING_STATUS_META;
  const meta = map[status];
  return (
    <Badge tone={meta?.tone || 'neutral'} size={size} dot className={className}>
      {meta?.label || status}
    </Badge>
  );
}
