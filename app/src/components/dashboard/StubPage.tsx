import PageHeader from "@/components/dashboard/PageHeader"

export default function StubPage({
  title,
  subtitle,
  note,
}: {
  title: string
  subtitle: string
  note: string
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[rgba(34,54,58,0.18)] bg-[#FAFAF7] px-6 py-[88px]">
        <div className="font-display text-xl text-[#22363A]">{title}</div>
        <p className="m-0 max-w-[420px] text-center text-[13px] leading-[1.6] text-[#918B76]">{note}</p>
      </div>
    </div>
  )
}
