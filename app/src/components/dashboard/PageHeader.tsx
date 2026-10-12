"use client"

import { useState } from "react"
import Link from "next/link"

const RANGES = ["7d", "30d", "90d"] as const
type Range = (typeof RANGES)[number]

export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const [range, setRange] = useState<Range>("30d")

  return (
    <div className="mb-[26px] flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 className="font-display m-0 text-[29px] font-normal tracking-[-0.01em] text-[#22363A]">{title}</h1>
        <p className="mt-1.5 text-[13.5px] text-[#918B76]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center overflow-hidden rounded-[9px] border border-[rgba(34,54,58,0.14)]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-[7px] text-[12.5px] ${
                range === r ? "bg-[#22363A] text-white" : "bg-white text-[#918B76] hover:bg-[#FAFAF7]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <Link
          href="/dashboard/live"
          className="flex items-center gap-[7px] rounded-[9px] bg-[#22363A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#33505A]"
        >
          <span className="size-[7px] rounded-full bg-[#F2F79E]" />
          Start live call
        </Link>
      </div>
    </div>
  )
}
