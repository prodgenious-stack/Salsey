import Reveal from "./Reveal"

export default function FeatureSection({
  id,
  title,
  body,
  extra,
  children,
}: {
  id?: string
  title: string
  body: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-16 px-5 py-24 sm:px-9 md:flex md:min-h-[92svh] md:items-center md:py-32">
      <div className="mx-auto grid w-full max-w-[1208px] items-center gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        <div>
          <Reveal>
            <h2 className="font-serif-display text-[44px] leading-[0.98] tracking-[-0.02em] text-[#141F22] sm:text-[58px] lg:text-[72px]">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-8 max-w-[420px] text-[16px] leading-[1.6] text-[#141F22]/60">{body}</p>
          </Reveal>
          {extra && <Reveal delay={200}>{extra}</Reveal>}
        </div>
        {children}
      </div>
    </section>
  )
}
