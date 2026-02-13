/** Logo Snapchat (fantôme Ghostface Chillah) pour le bouton Snap */
export function SnapIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {/* Fantôme style Snapchat : corps + yeux */}
      <path d="M12 2C6.48 2 2 6.48 2 12c0 3.2 1.6 6 4 7.8-.3.9-.5 1.9-.5 2.9 0 2.2 1.8 4 4 4 .9 0 1.7-.3 2.4-.8.7.5 1.5.8 2.4.8s1.7-.3 2.4-.8c.7.5 1.5.8 2.4.8 2.2 0 4-1.8 4-4 0-1-.2-2-.5-2.9 2.4-1.8 4-4.6 4-7.8 0-5.52-4.48-10-10-10zm-3.5 8.5c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
    </svg>
  )
}
