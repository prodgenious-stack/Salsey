import type { Metadata } from "next"
import { LEGAL_CONTACT, LegalPage, Section } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Privacy Policy · Salsey",
  description: "How Salsey collects, uses and protects your information.",
}

const mail = <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what information Salsey (&ldquo;Salsey,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects
          through our website, waitlist, web app and Chrome extension (together, the &ldquo;Service&rdquo;), how we use it,
          and the choices you have. Salsey is in pre-launch: right now the only thing you can do is join the waitlist, so
          most of what&apos;s below describes how the product will handle data once you&apos;re given access.
        </p>
      }
    >
      <Section title="1. Information we collect">
        <p>
          <strong>Waitlist.</strong> When you join the waitlist we collect your email address, which form you used, and
          when you signed up.
        </p>
        <p>
          <strong>Account information.</strong> When you create an account we collect your email address and a password.
          Passwords are handled by our authentication provider and stored only in hashed form.
        </p>
        <p>
          <strong>Content you provide.</strong> Your offer, pricing, scripts, playbook, common objections and any questions
          you type into Salsey.
        </p>
        <p>
          <strong>Call data.</strong> Salsey only listens when you turn listening on in the extension. While it&apos;s on,
          speech picked up by your microphone during the call is transcribed so Salsey can suggest what to say. When you
          stop listening, the transcript is saved to your account, along with what we derive from it: objections that came
          up, how they were handled, recaps and insights. Transcripts can include what other people on the call said.
        </p>
        <p>
          <strong>Data stored in your browser.</strong> The extension keeps your settings, overlay position and microphone
          calibration in Chrome&apos;s local storage on your device. The web app uses your browser&apos;s storage to keep you
          signed in.
        </p>
        <p>
          <strong>Technical information.</strong> Our hosting provider automatically processes standard request data such
          as IP address, browser type and the pages requested, which we use to run and secure the Service. We don&apos;t use
          analytics trackers, advertising cookies or third-party ad networks.
        </p>
      </Section>

      <Section title="2. How we use information">
        <ul>
          <li>To provide the Service: generating live suggestions, recaps, objection tracking and dashboard insights.</li>
          <li>To manage the waitlist and email you about access, launch and important changes to the Service.</li>
          <li>To keep the Service secure, prevent abuse and fix problems.</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
        <p>
          We don&apos;t sell your personal information, share it for targeted advertising, or use your transcripts or
          content to train our own AI models.
        </p>
      </Section>

      <Section title="3. Service providers we rely on">
        <p>We share information only with providers that help us run the Service, and only as needed to do so:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: database and account authentication. Stores your account, content, transcripts and
            the waitlist.
          </li>
          <li>
            <strong>Vercel</strong>: hosting for our website and web app.
          </li>
          <li>
            <strong>Google Cloud (Vertex AI)</strong>: generates Salsey&apos;s suggestions and recaps from your transcript
            and playbook. Google processes this data under its business terms, which don&apos;t allow it to use the data to
            train its models.
          </li>
          <li>
            <strong>Google Chrome speech recognition</strong>: live transcription uses Chrome&apos;s built-in speech
            recognition, which sends audio to Google to convert it to text. This is governed by Google&apos;s own privacy
            policy.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect the rights and safety of our users or others, or
          as part of a merger, acquisition or sale of assets, in which case this policy will continue to apply.
        </p>
      </Section>

      <Section title="4. Other people on your calls">
        <p>
          Transcripts can capture what other participants say. You&apos;re responsible for giving any notice and getting any
          consent the law requires before using Salsey on a call. Some places, including Washington and California, require
          everyone&apos;s consent. If you were on a call with a Salsey user and want to ask about your information, email us
          at {mail}.
        </p>
      </Section>

      <Section title="5. How long we keep information">
        <ul>
          <li>Waitlist emails: until you&apos;re invited and decide whether to sign up, or until you ask us to remove you.</li>
          <li>Account data, content and transcripts: for as long as your account is active, or until you delete them.</li>
          <li>
            After you ask us to delete your account, we delete your data within 30 days, except where we need to keep
            something to meet a legal obligation, resolve a dispute or prevent abuse.
          </li>
        </ul>
      </Section>

      <Section title="6. Your choices and rights">
        <p>
          You can ask us to access, correct, export or delete your personal information, or to remove you from the
          waitlist, by emailing {mail}. You can opt out of non-essential emails at any time. Depending on where you live,
          including the EU, UK, California and Washington, you may have additional rights under local law. We&apos;ll verify
          your request and respond within the time the law requires, and we won&apos;t treat you differently for exercising
          these rights.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          Data is encrypted in transit. Account data is protected by row-level security, so one account can&apos;t read
          another&apos;s calls or content, and access to our systems is limited to people who need it. No service can
          guarantee perfect security, but we work to protect your information and will notify you of a breach where the
          law requires.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          Salsey is a business tool for people 18 and older. We don&apos;t knowingly collect information from children. If
          you think a child has given us personal information, contact us and we&apos;ll delete it.
        </p>
      </Section>

      <Section title="9. Where data is processed">
        <p>
          We and our providers process data in the United States. If you use Salsey from outside the US, your information
          will be transferred to and processed there.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We&apos;ll update this policy as the Service changes. If we make material changes, we&apos;ll notify you by email
          or in the Service before they take effect. The date at the top shows when it was last updated.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>Questions or requests about privacy: {mail}.</p>
      </Section>
    </LegalPage>
  )
}
