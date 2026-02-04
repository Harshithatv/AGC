export default function SiteFooter() {
  return (
    <footer className="bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100 text-slate-700">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr,1fr,1fr]">
          <div className="space-y-4">
            <p className="text-lg font-semibold text-slate-900">Academic Guide Course</p>
            <p className="text-sm text-slate-700">
              Professional development & certification for ALS educators. Built to support real-world academic
              guidance with structured learning and verified progress.
            </p>
            <div className="flex gap-3">
              <span className="rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
                Certified learning
              </span>
              <span className="rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
                Guided modules
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Quick links</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="hover:text-blue-700">Packages</li>
              <li className="hover:text-blue-700">Purchase</li>
              <li className="hover:text-blue-700">Login</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>help@agc-portal.com</li>
              <li>Mon–Fri · 9:00–18:00</li>
              <li>Response within 24 hours</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Stay updated</p>
            <p className="text-sm text-slate-700">
              Get updates on module releases and certification announcements.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="w-full rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-blue-200 pt-6 text-xs text-slate-600 md:flex-row">
          <span>© 2026 Academic Guide Course. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-blue-700">Privacy</span>
            <span className="hover:text-blue-700">Terms</span>
            <span className="hover:text-blue-700">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}