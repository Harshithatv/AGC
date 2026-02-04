import Image from 'next/image';
import Link from 'next/link';

const packages = [
  {
    name: 'Single User',
    value: 'SINGLE',
    users: '1 user',
    description: 'Ideal for individual Academic Guides who want certification and personal tracking.',
    features: ['Personal dashboard', 'All 5 modules', 'Certification included', 'No annual subscription'],
    highlight: false
  },
  {
    name: 'Group',
    value: 'GROUP',
    users: 'Up to 5 users',
    description: 'Best for small teams that need a shared learning plan and consistent standards.',
    features: ['Group admin access', 'Bulk user upload', 'Team progress view', 'Certification included'],
    highlight: true
  },
  {
    name: 'Institution',
    value: 'INSTITUTION',
    users: 'Up to 10 users',
    description: 'Built for institutions that need scalable onboarding and quality assurance.',
    features: ['Institution admin access', 'Bulk user upload', 'QA reporting', 'Certification included'],
    highlight: false
  }
];

export default function PackagesPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Academic Guide Course Packages</h1>
          <p className="mt-4 text-slate-600">
            All packages are one-time purchases with mandatory modules and certification.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {packages.map((item) => (
            <div
              key={item.name}
              className={`flex h-full flex-col rounded-2xl border ${
                item.highlight ? 'border-ocean-200 bg-ocean-50' : 'border-slate-200 bg-white'
              } p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">{item.name}</h3>
                {item.highlight ? (
                  <span className="rounded-full bg-ocean-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium text-ocean-600">{item.users}</p>
              <p className="mt-4 text-sm text-slate-600">{item.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-ocean-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/purchase/details?package=${item.value}`}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  item.highlight
                    ? 'bg-ocean-600 text-white hover:bg-ocean-700'
                    : 'border border-slate-200 text-slate-700 hover:border-ocean-300'
                }`}
              >
                Purchase package
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">What’s included in every package</h2>
            <p className="text-slate-600">
              Five mandatory modules, progress tracking, and certification delivered through a standard portal.
            </p>
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Video lessons and presentations</div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Sequential module unlocks</div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">Completion-based certification</div>
            </div>
          </div>
          <div>
            <Image
              src="/images/certification.jpg"
              alt="Certification"
              width={720}
              height={540}
              className="rounded-3xl shadow-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
