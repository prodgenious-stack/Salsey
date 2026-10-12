import { Instrument_Serif } from "next/font/google"
import Hero from "@/components/landing/Hero"
import StickyHeader from "@/components/landing/StickyHeader"
import FeatureSection from "@/components/landing/FeatureSection"
import ChatFeed, { type FeedItem } from "@/components/landing/ChatFeed"
import Comparison from "@/components/landing/Comparison"
import Faq from "@/components/landing/Faq"
import Statement from "@/components/landing/Statement"
import Footer from "@/components/landing/Footer"
import { FileChip, InlinePerson, MeetIcon, PlaybookCard, RecapCard, SuggestionCard } from "@/components/landing/feed-bits"

// Landing-page display serif. Scoped to this page; the dashboard keeps Fraunces.
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400" })

const LIVE_OBJECTION: FeedItem[] = [
  {
    kind: "event",
    node: (
      <>
        <MeetIcon /> <InlinePerson person="dana" /> and <InlinePerson person="priya" /> joined
        <span className="font-medium text-[#141F22]">Discovery call</span>
      </>
    ),
  },
  { kind: "message", person: "dana", meta: "Head of Ops · Northwind", text: "This looks good, but we already use a notetaker. Not sure we need another tool." },
  {
    kind: "copilot",
    label: "Objection detected",
    took: "1.2s",
    text: (
      <>
        Heads up — <InlinePerson person="dana" /> is comparing you to her notetaker. Agree, then contrast on timing:
      </>
    ),
  },
  { kind: "custom", node: <SuggestionCard /> },
  { kind: "message", person: "you", text: "Totally fair. Your notetaker tells you what happened — we help you in the moment, while the deal's still live." },
]

const PLAYBOOK_ANSWER: FeedItem[] = [
  { kind: "message", person: "marcus", meta: "VP Sales · Acme Logistics", text: "What does this cost for a team of twelve? And do you do annual?" },
  {
    kind: "copilot",
    label: "Searched your playbook",
    took: "0.9s",
    text: (
      <>
        Found it in <FileChip name="Pricing playbook.pdf" /> — annual saves two months. Ask how many reps are on calls daily
        before you quote.
      </>
    ),
  },
  { kind: "custom", node: <PlaybookCard /> },
  { kind: "message", person: "you", text: "Annual saves you two months. Quick one though — how many of the twelve are on calls daily?" },
  { kind: "message", person: "marcus", meta: "VP Sales · Acme Logistics", text: "Realistically? Eight." },
]

const RECAP: FeedItem[] = [
  {
    kind: "event",
    node: (
      <>
        <InlinePerson person="you" /> ended the call with <InlinePerson person="dana" />
        <InlinePerson person="priya" /> · 32 min
      </>
    ),
  },
  {
    kind: "copilot",
    label: "Recap ready",
    took: "4s",
    text: "Two objections came up — one handled, one needs a follow-up before Friday. Saved to your dashboard.",
  },
  { kind: "custom", node: <RecapCard /> },
]

const PLATFORMS = [
  { name: "Google Meet", live: true },
  { name: "Chrome", live: true },
  { name: "Zoom", live: false },
]

export default function Home() {
  return (
    <main className={`${instrument.variable} bg-white font-sans text-[#141F22]`}>
      <StickyHeader />
      <Hero />

      <FeatureSection
        id="how-it-works"
        title="Hears the pushback before you do."
        body="Salsey listens to the call and flags objections the second they land — then hands you a short, casual line to say back. No tab switching, no freezing."
      >
        <ChatFeed items={LIVE_OBJECTION} />
      </FeatureSection>

      <FeatureSection
        title="Answers that sound like you."
        body="Add your offer, pricing and go-to rebuttals once. Every suggestion pulls from them, so you never quote the wrong number or pitch something you don't sell."
      >
        <ChatFeed items={PLAYBOOK_ANSWER} />
      </FeatureSection>

      <FeatureSection
        title="Every call makes the next one easier."
        body="Recaps, objection trends and what actually worked land in your dashboard automatically — so you walk into the next call knowing what's coming."
        extra={
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
            {PLATFORMS.map((p) => (
              <span key={p.name} className="flex items-center gap-2 text-[#141F22]/70">
                {p.name === "Google Meet" ? (
                  <MeetIcon size={15} />
                ) : (
                  <span className={`size-1.5 rounded-full ${p.live ? "bg-[#C9D24F]" : "bg-[#141F22]/20"}`} />
                )}
                {p.name}
                {!p.live && <span className="text-[#141F22]/40">soon</span>}
              </span>
            ))}
          </div>
        }
      >
        <ChatFeed items={RECAP} />
      </FeatureSection>

      <Comparison />
      <Faq />
      <Statement />
      <Footer />
    </main>
  )
}
