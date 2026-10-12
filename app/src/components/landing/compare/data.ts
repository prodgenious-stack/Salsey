// Script for the "Same objection. Three outcomes." section: one objection, three ways to answer it.

export type Tone = "bad" | "meh" | "good"

export type Line = { who: "you" | "prospect" | "salsey" | "note"; text: string }

export type Outcome = {
  key: string
  verdict: string
  tone: Tone
  /** Where the deal-momentum meter lands once the call plays out, 0 (dead) – 1 (moving). */
  level: number
  script: Line[]
  pick: { title: string }
}

export const PROSPECT = { name: "Dana", role: "Head of Ops · Northwind" }
export const OBJECTION = "Honestly, this is more than we budgeted for this quarter."

export const OUTCOMES: Outcome[] = [
  {
    key: "winging",
    verdict: "Deal stalls",
    tone: "bad",
    level: 0.12,
    script: [
      { who: "you", text: "Uh… we could probably do 20% off?" },
      { who: "prospect", text: "Hm. Let me take it back to the team." },
    ],
    pick: { title: "Wing it" },
  },
  {
    key: "notetaker",
    verdict: "Great notes, same result",
    tone: "meh",
    level: 0.35,
    script: [
      { who: "you", text: "Totally get it. What budget did you have in mind?" },
      { who: "prospect", text: "Let's circle back next quarter." },
      { who: "note", text: "1 hour later: a tidy summary lands in your inbox." },
    ],
    pick: { title: "Lean on notes" },
  },
  {
    key: "salsey",
    verdict: "Next step booked",
    tone: "good",
    level: 0.9,
    script: [
      { who: "salsey", text: "Pricing objection → reframe on ROI, offer a phased start." },
      { who: "you", text: "Makes sense. If we started with one team this quarter, would the ROI case be easier?" },
      { who: "prospect", text: "A phased start could work. Thursday?" },
    ],
    pick: { title: "Use Salsey" },
  },
]
