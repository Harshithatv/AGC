import Image from 'next/image';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

const coreAreas = [
  'UTL methodology and ethical observation',
  'Personalised learning design and scaffolding',
  'Emotional regulation and wellbeing support',
  'Safeguarding and data ethics',
  'Human-led, AI-supported decision-making'
];

const steps = [
  {
    title: 'Select a package',
    description: 'Choose Single, Group, or Institution with a one-time purchase.'
  },
  {
    title: 'Set up your team',
    description: 'Group/Institution admins add users individually or through bulk upload.'
  },
  {
    title: 'Complete modules',
    description: 'Modules unlock sequentially to keep learning consistent.'
  },
  {
    title: 'Get certified',
    description: 'Finish all modules to receive Academic Guide certification.'
  }
];

const deliverables = [
  'Certified Academic Guides across ALS',
  'Consistent learner experience',
  'Quality assurance and fidelity',
  'Continuous professional growth'
];

export default function HomePage() {
  return (
    <div className="bg-white">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-24 md:min-h-[70vh] md:grid-cols-2">
        <div className="space-y-4 sm:space-y-6">
          <span className="inline-block rounded-full bg-ocean-50 px-3 py-1 text-xs font-medium text-ocean-700 sm:px-4 sm:text-sm">
            Academic Guide Training &amp; Certification
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            A professional development pathway for Academic Guides
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            A structured, module-based programme that shifts educators from traditional instruction to
            guidance, observation, facilitation, and adaptive learning design.
          </p>
          <div className="flex">
            <Link
              href="/packages"
              className="rounded-xl bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-200 transition hover:bg-ocean-700 sm:px-6 sm:py-3"
            >
              Get Started
            </Link>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/images/hero.jpg"
            alt="Academic Guide Training & Certification overview"
            width={960}
            height={640}
            className="rounded-2xl shadow-xl sm:rounded-3xl"
          />
        </div>
      </section>

      {/* Programme purpose */}
      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-ocean-50 via-white to-blue-50 p-5 shadow-sm sm:rounded-3xl sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Programme purpose</p>
                <h2 className="text-3xl font-semibold text-slate-900">Why this programme exists</h2>
                <p className="max-w-2xl text-slate-600">
                  The Academic Guide Training &amp; Certification is a professional development and certification programme for educators
                  operating within the ALS ecosystem.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {coreAreas.map((area) => (
                <div key={area} className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-semibold text-ocean-700">
                      ✓
                    </span>
                    <span className="text-slate-700">{area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600 sm:text-sm">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">A simple, guided pathway</h2>
            </div>
            <p className="max-w-md text-xs text-slate-600 sm:text-sm">
              Clear steps from purchase to certification with built-in module sequencing.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-100 text-sm font-semibold text-ocean-700">
                    {index + 1}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Step</p>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:grid-cols-2">
          <div>
            <Image
              src="/images/team.jpg"
              alt="Team collaboration"
              width={720}
              height={540}
              className="rounded-3xl shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">What you deliver</h2>
            <p className="text-slate-600">
              A consistent, learner-first experience supported by ethical observation, wellbeing strategies, and
              AI-supported decisioning.
            </p>
            <div className="space-y-3 text-slate-700">
              {deliverables.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-ocean-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/packages"
              className="inline-flex items-center rounded-xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Compare Packages
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">Certification you can trust</h2>
          <p className="text-slate-600">
            Completion is verified module by module so every certificate reflects real progress, professional
            practice, and consistent learning outcomes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ocean-200"
          >
            Access Learning Portal
          </Link>
        </div>
        <div>
          <Image
            src="/images/dashboard.jpg"
            alt="Dashboard preview"
            width={720}
            height={540}
            className="rounded-3xl shadow-lg"
          />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Support built-in</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  A learning experience that stays with your team
                </h2>
              </div>
              <p className="max-w-md text-sm text-slate-600">
                Every package includes guided resources, progress visibility, and structured follow-through so
                training turns into practice.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Resources</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">Coaching-ready materials</h3>
                <p className="mt-3 text-sm text-slate-600">
                  Printable guides, observation tools, and practical checklists for real classroom scenarios.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Visibility</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">Progress you can action</h3>
                <p className="mt-3 text-sm text-slate-600">
                  See who is on track, what is completed, and where support is needed.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Momentum</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">Structured follow-through</h3>
                <p className="mt-3 text-sm text-slate-600">
                  Sequential modules and deadlines keep teams aligned and certification-ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-4" id="contact">
        <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-ocean-50 via-white to-blue-50 p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Contact support</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Need help or have a question?</h3>
              <p className="mt-3 text-sm text-slate-600">
                Send us a message and our support team will get back to you with guidance on modules, access,
                or certification.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-lg">✉️</span>
                  support@agc-portal.com
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-lg">📞</span>
                  +91 90000 00000
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-lg">🕘</span>
                  Mon–Fri, 9:00 AM – 6:00 PM
                </div>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
