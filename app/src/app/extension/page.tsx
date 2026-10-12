import Link from "next/link"

const steps = [
  {
    title: "Download the extension",
    body: "Click the download button above — it saves a .zip file (salsey-extension.zip).",
  },
  {
    title: "Unzip it",
    body: "Find the downloaded file and unzip it. On Mac, just double-click it. You'll get a folder with files like manifest.json, content.js, and background.js inside.",
  },
  {
    title: "Open Chrome's extensions page",
    body: "Go to chrome://extensions in your address bar (or Menu → Extensions → Manage Extensions).",
  },
  {
    title: "Turn on Developer mode",
    body: "Flip the \"Developer mode\" toggle in the top-right corner of that page.",
  },
  {
    title: "Load unpacked",
    body: "Click the \"Load unpacked\" button that appears, then select the unzipped folder (not the zip file itself).",
  },
  {
    title: "Pin it and set up your sales materials",
    body: "Click the puzzle-piece icon in Chrome's toolbar and pin Salsey. Open it, paste in your offer, script, and common objections, then hit Save.",
  },
  {
    title: "Use it on a call",
    body: "On Google Meet (or any page), click the extension icon and hit \"Show / hide copilot on this page.\" Press play to start listening — it'll surface talking points live as the conversation happens.",
  },
]

export default function ExtensionPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold text-neutral-900">Salsey — Chrome Extension</h1>
        <p className="text-neutral-600">
          Listens in on your sales calls and surfaces talking points, objection handling, and answers in real
          time — right on top of Google Meet. This is a testing build, loaded manually (not from the Chrome
          Web Store), so it takes a couple of extra clicks the first time.
        </p>
      </div>

      <a
        href="/downloads/salsey-extension.zip"
        download
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Download extension (.zip)
      </a>

      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-neutral-900">How to install it</h2>
        <ol className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-neutral-900">{step.title}</p>
                <p className="text-sm text-neutral-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Chrome may show a warning that this extension is "not from the Chrome Web Store" — that's expected
        for a manually loaded (unpacked) extension. Since you selected the folder yourself, it's safe to
        keep enabled.
      </div>
    </div>
  )
}
