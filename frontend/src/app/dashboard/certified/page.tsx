'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getCertifiedLearners, getOrgCertifiedLearners } from '@/lib/api';

type CertifiedLearner = {
  id: string;
  name: string;
  email: string;
  organization?: string;
  certifiedAt: string;
  completedModules: number;
  totalModules: number;
};

export default function CertifiedLearnersPage() {
  const { user, token } = useAuth();
  const [learners, setLearners] = useState<CertifiedLearner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;

    const load = async () => {
      try {
        if (user.role === 'SYSTEM_ADMIN') {
          const data = await getCertifiedLearners(token);
          setLearners(data as CertifiedLearner[]);
        } else if (user.role === 'ORG_ADMIN') {
          const data = await getOrgCertifiedLearners(token);
          setLearners(data as CertifiedLearner[]);
        }
      } catch (err) {
        console.error('Failed to load certified learners:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Certified Learners</h2>
            <p className="mt-1 text-sm text-slate-600">
              Learners who have completed all modules and earned their certification
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-50">
            <svg className="h-6 w-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean-200 border-t-ocean-600" />
          </div>
        ) : learners.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No certified learners yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Learners will appear here once they complete all modules
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {learners.length} {learners.length === 1 ? 'learner' : 'learners'} certified
              </p>
            </div>
            
            {learners.map((learner) => (
              <div
                key={learner.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-100 text-sm font-semibold text-ocean-600">
                    {learner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{learner.name}</p>
                    <p className="text-sm text-slate-500">{learner.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {user?.role === 'SYSTEM_ADMIN' && learner.organization && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{learner.organization}</p>
                    </div>
                  )}
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">Certified</p>
                    <p className="text-xs text-slate-500">{formatDate(learner.certifiedAt)}</p>
                  </div>
                  
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
