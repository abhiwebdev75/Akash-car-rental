import { Children } from 'react';
import { cn } from '../lib/cn';

/**
 * Accessible, continuously-scrolling marquee. The children are rendered twice
 * back-to-back and the track is translated by -50%, so the loop is seamless.
 * Pauses on hover and is frozen entirely under `prefers-reduced-motion`
 * (handled in CSS via the `motion-reduce` variant).
 *
 * Pass discrete items as children; each is spaced out along the track.
 */
export function Marquee({ children, className, itemClassName }) {
  const items = Children.toArray(children);

  const Track = ({ ariaHidden }) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((child, i) => (
        <li key={i} className={cn('flex items-center whitespace-nowrap px-8', itemClassName)}>
          {child}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {/* First copy is the real content; the second is a visual duplicate. */}
        <Track />
        <Track ariaHidden />
      </div>
    </div>
  );
}
