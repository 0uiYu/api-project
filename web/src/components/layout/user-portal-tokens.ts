/**
 * Ordinary-user portal palette.
 *
 * The five user-facing pages share one visual contract: a flat `#F5F7FA`
 * canvas, white cards with a `#E5EAF1` hairline border, `14px` radius, `22px`
 * padding and no shadow. The values live here once and are consumed through
 * CSS variables, so dark mode swaps them without repeating hex colours in
 * every component.
 */
export const USER_PORTAL_ROOT_CLASS = [
  '[--portal-canvas:#F5F7FA] [--portal-surface:#FFFFFF] [--portal-border:#E5EAF1]',
  '[--portal-text:#182235] [--portal-muted:#758197] [--portal-brand:#315CCE]',
  '[--portal-brand-soft:#EDF3FF]',
  // Navigation links carry their own colour: #758197 on white is 3.93:1, below
  // the WCAG AA 4.5:1 floor this project holds itself to for body text.
  '[--portal-nav:#5A6577]',
  'bg-[var(--portal-canvas)] text-[var(--portal-text)]',
  'dark:[--portal-canvas:var(--background)] dark:[--portal-surface:var(--card)]',
  'dark:[--portal-border:var(--border)] dark:[--portal-text:var(--foreground)]',
  'dark:[--portal-muted:var(--muted-foreground)] dark:[--portal-brand:var(--primary)]',
  'dark:[--portal-brand-soft:var(--accent)]',
  'dark:[--portal-nav:var(--muted-foreground)]',
].join(' ')

/** White card used by every user-portal block. */
export const USER_PORTAL_CARD_CLASS =
  'rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-[22px] shadow-none'
