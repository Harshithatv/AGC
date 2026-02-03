export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 text-sm text-slate-600 md:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <p className="text-base font-semibold text-slate-800">Academic Guide Course</p>
          <p>Professional development & certification for ALS educators.</p>
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-800">Quick links</p>
          <ul className="space-y-2">
            <li>Packages</li>
            <li>Purchase</li>
            <li>Login</li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-800">Contact</p>
          <p>support@agc-portal.com</p>
          <p>Mon–Fri · 9:00–18:00</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 Academic Guide Course. All rights reserved.
      </div>
    </footer>
  );
}
