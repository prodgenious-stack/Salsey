"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import RollingText from "./RollingText"
import WaitlistForm from "./WaitlistForm"
import { NAV_LINKS } from "./nav-links"

// Rendered with Remotion from /video at 2560×1440 (footage AI-upscaled 4x), then re-encoded
// without audio. Small screens get a lighter 1080p copy.
const HERO_VIDEO_SRC = "/hero/hero.mp4"
const HERO_VIDEO_SMALL_SRC = "/hero/hero-1080.mp4"
const HERO_POSTER_SRC = "/hero/hero-poster.jpg"
const HEADLINE = "Never freeze on a sales call again"

export default function Hero() {
  const [videoFailed, setVideoFailed] = useState(false)

  return (
    <section className="relative overflow-hidden bg-[#141F22] pb-16 sm:pb-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(242,247,158,0.16) 0%, transparent 70%), radial-gradient(ellipse 55% 40% at 50% 78%, rgba(242,247,158,0.08) 0%, transparent 70%)",
        }}
      />

      <header className="absolute inset-x-0 top-0 z-30 mx-auto flex h-[72px] w-full max-w-[1280px] items-center px-5 sm:px-9">
        <Link href="/" className="anim-fade flex items-center gap-2 text-white">
          <Image src="/salsey-icon-white.png" alt="" width={22} height={22} />
          <span className="text-[15px] font-semibold tracking-tight">Salsey</span>
        </Link>
        <nav className="anim-fade ms-auto hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group text-[13px] text-white/70 transition-colors hover:text-white">
              <RollingText text={link.label} />
            </Link>
          ))}
        </nav>
        <Link
          href="#waitlist"
          className="anim-fade group ms-auto rounded-full bg-white px-4 py-[7px] text-[13px] font-medium text-[#141F22] transition-colors hover:bg-[#F2F79E] md:ms-9"
        >
          <RollingText text="Join waitlist" />
        </Link>
      </header>

      <div className="relative z-20 flex flex-col items-center px-5 pt-[128px] text-center sm:pt-[148px]">
        <h1
          aria-label={HEADLINE}
          className="font-serif-display max-w-[980px] text-[44px] leading-[1.02] text-white sm:text-[64px] lg:text-[80px]"
        >
          {HEADLINE.split(" ").map((word, i) => (
            <span key={i} aria-hidden>
              <span className="anim-rise inline-block" style={{ animationDelay: `${120 + i * 70}ms` }}>
                {word}
              </span>{" "}
            </span>
          ))}
        </h1>
        <p className="anim-rise mt-5 max-w-[480px] text-[15px] leading-6 text-white/70 [animation-delay:600ms]">
          Salsey listens to your calls and tells you exactly what to say — grounded in your own offer and
          playbook, the moment the prospect pushes back.
        </p>

        <div id="waitlist" className="anim-rise mt-10 scroll-mt-40 [animation-delay:720ms]">
          <WaitlistForm tone="dark" source="hero" />
        </div>
      </div>

      <div className="anim-rise relative z-10 mx-auto mt-14 max-w-[1180px] px-4 [animation-delay:860ms] sm:mt-20 sm:px-9">
        <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[#141F22] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_40px_120px_-30px_rgba(0,0,0,0.7)] sm:rounded-[28px]">
          {!videoFailed && (
            <video
              className="size-full object-cover"
              poster={HERO_POSTER_SRC}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
            >
              <source src={HERO_VIDEO_SMALL_SRC} type="video/mp4" media="(max-width: 767px)" />
              {/* A failed load fires on the last <source>, not on the <video>. */}
              <source src={HERO_VIDEO_SRC} type="video/mp4" onError={() => setVideoFailed(true)} />
            </video>
          )}
        </div>
      </div>
    </section>
  )
}
