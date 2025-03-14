import GlobalHeader from "@/components/GlobalHeader"

export default async function Last7Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6 relative">
      <GlobalHeader />
      {children}
    </div>
  )
}