"use client"

import Reveal, { useInView } from "./Reveal"
import WaitlistForm from "./WaitlistForm"

const TEXT = "Every objection is a buying signal. Salsey makes sure you hear it — and answer it — while it still counts."

export default function Statement() {
  const { ref, inView } = useInView<HTMLParagraphElement>(0.4)
  const words = TEXT.split(" ")

  return (
    <section className="px-5 py-28 sm:px-9 md:py-44">
      {/* Words start dim and light up in sequence, like the sentence is being read aloud. */}
      <p
        ref={ref}
        className="font-serif-display mx-auto max-w-[1080px] text-center text-[38px] leading-[1.06] tracking-[-0.02em] text-[#141F22] sm:text-[54px] lg:text-[66px]"
      >
        {words.map((word, i) => (
          <span key={i}>
            <span
              style={{ transitionDelay: `${i * 60}ms` }}
              className={`inline-block transition-[opacity,filter] duration-700 ease-entrance ${
                inView ? "opacity-100" : "opacity-15 blur-[3px]"
              }`}
            >
              {word}
            </span>{" "}
          </span>
        ))}
      </p>
      <Reveal delay={400} className="mt-12 flex justify-center">
        <WaitlistForm tone="light" source="statement" />
      </Reveal>
    </section>
  )
}
