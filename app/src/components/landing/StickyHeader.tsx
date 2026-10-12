"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import RollingText from "./RollingText"
import { NAV_LINKS } from "./nav-links"

export default function StickyHeader() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 border-b border-[#141F22]/[0.06] bg-white/90 backdrop-blur-xl transition-transform duration-500 ease-entrance ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1280px] items-center px-5 sm:px-9">
        <Link href="/" className="flex items-center gap-2 text-[#141F22]">
          <Image src="/salsey-icon.png" alt="" width={20} height={20} />
          <span className="text-[15px] font-semibold tracking-tight">Salsey</span>
        </Link>
        <nav className="ms-auto hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group text-[13px] text-[#141F22]/60 transition-colors hover:text-[#141F22]">
              <RollingText text={link.label} />
            </Link>
          ))}
        </nav>
        <Link
          href="#waitlist"
          className="group ms-auto rounded-full bg-[#141F22] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2A3E43] md:ms-9"
        >
          <RollingText text="Join the waitlist" />
        </Link>
      </div>
    </div>
  )
}
