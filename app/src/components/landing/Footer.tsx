import Link from "next/link"
import Image from "next/image"
import Reveal from "./Reveal"

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#compare", label: "Compare" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Early access",
    links: [{ href: "#waitlist", label: "Join the waitlist" }],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[#141F22] px-5 text-white sm:px-9">
      <div className="mx-auto w-full max-w-[1208px]">
        <Reveal>
          <div className="relative mx-auto max-w-[1080px] translate-y-px">
            <div className="absolute -inset-x-20 -top-10 bottom-0 bg-[radial-gradient(ellipse_at_center,rgba(242,247,158,0.14),transparent_65%)]" />
            <div className="relative overflow-hidden rounded-t-[20px] border border-b-0 border-white/10 bg-white/5 p-2 pb-0">
              <Image
                src="/landing/dashboard-showcase.png"
                alt="The Salsey dashboard: calls, objection trends and AI insights"
                width={2160}
                height={1260}
                className="block h-auto w-full rounded-t-[14px]"
              />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="relative -mx-5 border-t border-white/10 bg-[#141F22] px-5 sm:-mx-9 sm:px-9">
        <div className="mx-auto grid w-full max-w-[1208px] gap-12 py-14 md:grid-cols-[1fr_auto_auto_auto] md:gap-20">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/salsey-icon-white.png" alt="" width={22} height={22} />
              <span className="text-[15px] font-semibold tracking-tight">Salsey</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[14px] leading-6 text-white/55">
              The live AI copilot that tells you what to say when a prospect pushes back.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">{col.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[14px] text-white/70 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-[1208px] flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 py-6 text-[12px] text-white/40">
          <span>© {new Date().getFullYear()} Salsey. All rights reserved.</span>
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
