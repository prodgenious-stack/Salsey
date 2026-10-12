import Link from "next/link"
import Image from "next/image"
import { Instrument_Serif } from "next/font/google"

const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument" })

export const LEGAL_CONTACT = "amtplified@gmail.com"
export const LEGAL_UPDATED = "October 11, 2026"

export function LegalPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className={`${instrument.variable} min-h-screen bg-white font-sans text-[#141F22]`}>
      <header className="border-b border-[#141F22]/[0.06]">
        <div className="mx-auto flex h-[64px] w-full max-w-[1080px] items-center px-5 sm:px-9">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/salsey-icon.png" alt="" width={20} height={20} />
            <span className="text-[15px] font-semibold tracking-tight">Salsey</span>
          </Link>
          <Link
            href="/#waitlist"
            className="ms-auto rounded-full bg-[#141F22] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2A3E43]"
          >
            Join the waitlist
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-[720px] px-5 pt-16 pb-24 sm:pt-24">
        <p className="text-[13px] text-[#141F22]/45">Last updated {LEGAL_UPDATED}</p>
        <h1 className="font-serif-display mt-3 text-[48px] leading-[1] tracking-[-0.02em] sm:text-[64px]">{title}</h1>
        <div className="mt-8 text-[16px] leading-[1.7] text-[#141F22]/70">{intro}</div>
        <div className="mt-4">{children}</div>
      </article>

      <footer className="border-t border-[#141F22]/[0.06]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-[13px] text-[#141F22]/45 sm:px-9">
          <span>© {new Date().getFullYear()} Salsey</span>
          <Link href="/privacy" className="transition-colors hover:text-[#141F22]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-[#141F22]">
            Terms of Service
          </Link>
          <a href={`mailto:${LEGAL_CONTACT}`} className="transition-colors hover:text-[#141F22]">
            {LEGAL_CONTACT}
          </a>
        </div>
      </footer>
    </main>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#141F22]">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[15.5px] leading-[1.7] text-[#141F22]/70 [&_a]:text-[#141F22] [&_a]:underline [&_a]:decoration-[#141F22]/25 [&_a]:underline-offset-4 [&_li]:ps-1 [&_strong]:font-medium [&_strong]:text-[#141F22] [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </section>
  )
}
