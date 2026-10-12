import Reveal from "./Reveal"
import ObjectionGame from "./compare/ObjectionGame"

export default function Comparison() {
  return (
    <section id="compare" className="scroll-mt-16 px-5 py-24 sm:px-9 md:py-36">
      <div className="mx-auto w-full max-w-[1040px]">
        <Reveal className="text-center">
          <h2 className="font-serif-display text-[44px] leading-[0.98] tracking-[-0.02em] text-[#141F22] sm:text-[58px] lg:text-[72px]">
            Same objection.
            <br />
            <span className="text-[#141F22]/45">Three outcomes.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-[440px] text-[16px] leading-[1.6] text-[#141F22]/60">
            The moment that decides a deal lasts about two seconds. Pick how you&apos;d handle it.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-14 md:mt-16">
          <ObjectionGame />
        </Reveal>
      </div>
    </section>
  )
}
