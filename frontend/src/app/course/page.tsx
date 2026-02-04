'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getCertificate, getMyModules } from '@/lib/api';

export default function CoursePortalPage() {
  const router = useRouter();
  const { user, token, logout, ready } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ORG_USER') {
      router.push('/dashboard');
      return;
    }
    getMyModules(token).then((data) => setModules(data as any[]));
    getCertificate(token).then((data) => setCertificate(data));
  }, [token, user, router, ready]);

  const handleDownloadCertificate = async () => {
    if (!certificate?.certificate) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setDrawColor(224, 200, 120);
    doc.setLineWidth(5);
    doc.rect(28, 28, pageWidth - 56, pageHeight - 56);
    doc.setDrawColor(230, 232, 240);
    doc.setLineWidth(1.5);
    doc.rect(44, 44, pageWidth - 88, pageHeight - 88);

    doc.setTextColor(176, 132, 40);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('ACADEMIC GUIDE COURSE', pageWidth / 2, 110, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.text('Certificate of Completion', pageWidth / 2, 155, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('This is to certify that', pageWidth / 2, 200, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(30);
    doc.text(certificate.certificate.issuedTo, pageWidth / 2, 245, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('has successfully completed the programme', pageWidth / 2, 285, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text(certificate.certificate.program, pageWidth / 2, 320, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const issuedDate = new Date(certificate.certificate.issuedAt).toLocaleDateString();
    doc.text(`Issued to: ${certificate.certificate.issuedEmail}`, pageWidth / 2, 360, { align: 'center' });
    doc.text(`Issued on: ${issuedDate}`, pageWidth / 2, 382, { align: 'center' });

    doc.setDrawColor(176, 132, 40);
    doc.setLineWidth(1);
    doc.circle(pageWidth / 2, pageHeight - 130, 36, 'S');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('AGC', pageWidth / 2, pageHeight - 126, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Certified', pageWidth / 2, pageHeight - 112, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('Academic Guide Course & Certification', pageWidth / 2, pageHeight - 70, { align: 'center' });
    doc.text('AGC Learning Portal', pageWidth / 2, pageHeight - 52, { align: 'center' });

    doc.save(`AGC-Certificate-${certificate.certificate.issuedTo.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="AGC logo" width={40} height={40} />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Academic Guide Course</p>
              <h1 className="text-lg font-semibold text-slate-900">Learner Portal</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#program" className="hover:text-ocean-600">Programme</a>
            <a href="#modules" className="hover:text-ocean-600">Modules</a>
            <a href="#how-it-works" className="hover:text-ocean-600">How it works</a>
            <a href="#certification" className="hover:text-ocean-600">Certification</a>
            <a href="#contact" className="hover:text-ocean-600">Contact</a>
          </nav>
          <div className="relative">
            <details className="group">
              <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">
                  👤
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                <div className="px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{user?.name || 'Learner'}</p>
                  <p className="text-xs text-slate-500">{user?.email || ''}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-12" id="program">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-ocean-50 via-white to-blue-50 p-8 shadow-sm lg:p-10">
          <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-ocean-100/70 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr,0.95fr] lg:items-center">
            <div>
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-ocean-100 bg-white/80 px-3 py-1 text-xs font-semibold text-ocean-700">
                <span className="h-2 w-2 rounded-full bg-ocean-500" />
                Programme details
              </div> */}
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 lg:text-4xl">
                Academic Guide Course & Certification
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                A structured learning pathway for academic guides with sequential modules, deadlines, and
                certification upon completion. Your progress is tracked automatically.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Programme access', value: 'Full course content' },
                  { label: 'Mode', value: 'Self-paced with deadlines' },
                  { label: 'Assessment', value: 'Module completion checks' },
                  { label: 'Certification', value: 'Issued on completion' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4">
                    <p className="text-xs uppercase text-slate-400">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="text-xs uppercase text-slate-400">Modules</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{modules.length}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="text-xs uppercase text-slate-400">Completed</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{certificate?.completedCount ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="text-xs uppercase text-slate-400">Certificate</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {certificate?.certificate ? 'Issued' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-ocean-100/70" />
              <Image
                src="/images/learning.jpg"
                alt="Course learning"
                width={720}
                height={520}
                className="relative w-full rounded-3xl object-cover shadow-md"
              />
              {/* <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-md">
                <p className="text-sm font-semibold text-slate-900">Live progress tracking</p>
                <p>Stay aligned with your module deadlines.</p>
              </div> */}
            </div>
          </div>
        </div>
      </section>

     

      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="space-y-6" id="modules">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Course overview</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Academic Guide Course</h3>
                <p className="mt-3 text-sm text-slate-600">
                  A structured learning sequence designed for academic guides. Each module builds on the last,
                  with video or presentation content, clear deadlines, and certification at completion.
                </p>
              </div>
              <Link
                href="/course/modules"
                className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-ocean-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(modules.length ? modules : [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]).map(
                (moduleItem: any, index: number) => (
                  <div
                    key={moduleItem.id ?? index}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase text-ocean-600">
                      Module {moduleItem.order ?? index + 1}
                    </p>
                    <h4 className="mt-2 text-sm font-semibold text-slate-900">
                      {moduleItem.title ?? 'Module overview'}
                    </h4>
                    <p className="mt-2 text-xs text-slate-600">
                      {moduleItem.description ??
                        'Key learning outcomes, practical examples, and guided activities.'}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-12" id="certification">
         <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
           <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
             <div>
               <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Certification</p>
               <h3 className="mt-2 text-2xl font-semibold text-slate-900">Certificate of Completion</h3>
               <p className="mt-3 text-sm text-slate-600">
                 Earn a premium certificate once all modules are completed. It includes your name, programme title,
                 and issue date.
               </p>
               {certificate?.certificate ? (
                 <button
                   onClick={handleDownloadCertificate}
                   className="mt-4 inline-flex items-center justify-center rounded-xl bg-ocean-600 px-5 py-3 text-sm font-semibold text-white"
                 >
                   Download certificate
                 </button>
               ) : null}
             </div>
             <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
               <Image
                 src="/images/certification.jpg"
                 alt="Certificate preview"
                 width={520}
                 height={380}
                 className="w-full rounded-2xl object-cover"
               />
             </div>
           </div>
         </div>
       </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12" id="how-it-works">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,1.3fr] lg:items-center">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-ocean-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">How it works</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Your learning journey in four steps</h3>
              <p className="mt-3 text-sm text-slate-600">
                A clear learning flow designed to keep you on track. Each step unlocks the next one to ensure
                structured progress and certification readiness.
              </p>
              <Image
                src="/images/works.jpg"
                alt="Learning workflow"
                width={640}
                height={420}
                className="mt-6 h-56 w-full rounded-2xl object-cover"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { step: '01', icon: '🧭', title: 'Start module', text: 'Begin with module 1 to unlock your timeline.' },
                { step: '02', icon: '🎥', title: 'Watch content', text: 'Study the video or presentation resources.' },
                { step: '03', icon: '✅', title: 'Mark complete', text: 'Confirm completion to unlock the next step.' },
                { step: '04', icon: '🏅', title: 'Get certified', text: 'Finish all modules to receive certification.' }
              ].map((step) => (
                <div key={step.step} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Step {step.step}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg">
                      {step.icon}
                    </span>
                  </div>
                  <h4 className="mt-4 text-sm font-semibold text-slate-900">{step.title}</h4>
                  <p className="mt-2 text-xs text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12" id="benefits">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Course benefits</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Why this course works</h3>
              <p className="mt-3 text-sm text-slate-600">
                Designed to build confidence, consistency, and real classroom impact with a guided, step-by-step path.
              </p>
            </div>
            <Image src="/images/team.jpg" alt="Course benefits" width={180} height={120} className="rounded-2xl" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🎯', title: 'Clear outcomes', text: 'Every module has focused goals and measurable progress.' },
              { icon: '🧩', title: 'Structured flow', text: 'Sequential learning keeps your pathway organized.' },
              { icon: '📈', title: 'Practical impact', text: 'Apply strategies directly to teaching practice.' },
              { icon: '🏅', title: 'Recognition', text: 'Earn a verified certificate for your professional growth.' }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg">
                  {item.icon}
                </div>
                <h4 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-xs text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12" id="resources">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Learning resources</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Everything you need to succeed</h3>
              <p className="mt-3 text-sm text-slate-600">
                Access curated materials, structured templates, and support tools designed for practical application.
              </p>
            </div>
            <Image src="/images/learning.jpg" alt="Learning resources" width={170} height={120} className="rounded-2xl" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: '📘',
                title: 'Module guides',
                text: 'Clear lesson goals, activities, and checkpoints for each module.'
              },
              {
                icon: '🗂️',
                title: 'Templates',
                text: 'Observation notes, planning sheets, and reflection formats.'
              },
              {
                icon: '💬',
                title: 'Support access',
                text: 'Direct contact options for academic and technical help.'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg">
                  {item.icon}
                </div>
                <h4 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-xs text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12" id="faq">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">FAQs</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Common learner questions</h3>
              <p className="mt-3 text-sm text-slate-600">
                Quick answers to help you move forward without delays.
              </p>
            </div>
            {/* <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Updated weekly
            </div> */}
          </div>
          <div className="mt-6 space-y-3">
            {[
              {
                q: 'How do modules unlock?',
                a: 'Modules unlock sequentially once the previous module is marked complete.'
              },
              {
                q: 'When will I receive my certificate?',
                a: 'Your certificate is issued automatically after all modules are completed.'
              },
              {
                q: 'Can I revisit completed modules?',
                a: 'Yes, completed modules remain available for review.'
              }
            ].map((item) => (
              <details key={item.q} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16" id="contact">
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
            <form className="rounded-2xl border border-white/70 bg-white/80 p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Full name</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Email address</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Message</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                    rows={4}
                    placeholder="Tell us how we can help"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Send message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

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
    </div>
  );
}
