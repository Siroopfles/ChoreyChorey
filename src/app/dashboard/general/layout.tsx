
export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  // This layout is now a pass-through since the main layout has been moved
  // to /dashboard/layout.tsx to apply to all dashboard routes correctly.
  return <>{children}</>;
}
