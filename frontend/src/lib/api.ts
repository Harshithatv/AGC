const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'SYSTEM_ADMIN' | 'ORG_ADMIN' | 'ORG_USER';
    organizationId?: string | null;
  };
};

async function request<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function purchasePackage(payload: {
  packageType: 'SINGLE' | 'GROUP' | 'INSTITUTION';
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  instituteName?: string;
  roleAtSchool?: string;
}) {
  return request('/purchases', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getPublicModules() {
  return request('/modules/public');
}

export function getMyModules(token: string) {
  return request('/modules/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function startModule(token: string, moduleId: string) {
  return request(`/modules/me/${moduleId}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function completeModule(token: string, moduleId: string) {
  return request(`/modules/me/${moduleId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getOrganization(token: string) {
  return request('/organizations/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listUsers(token: string) {
  return request('/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createUser(token: string, payload: { name: string; email: string; password: string }) {
  return request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function bulkCreateUsers(
  token: string,
  payload: { users: Array<{ name: string; email: string; password: string }> }
) {
  return request('/users/bulk', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function getCertificate(token: string) {
  return request('/progress/certificate', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listAdminOrganizations(token: string) {
  return request('/admin/organizations', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listAdminPurchases(token: string) {
  return request('/admin/purchases', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listAllModules(token: string) {
  return request('/modules', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function updateModule(
  token: string,
  id: string,
  payload: {
    title?: string;
    description?: string;
    order?: number;
    durationMinutes?: number;
    deadlineDays?: number;
    mediaType?: 'VIDEO' | 'PRESENTATION';
    mediaUrl?: string;
  }
) {
  return request(`/modules/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function deleteModule(token: string, id: string) {
  return request(`/modules/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function uploadModuleFile(
  token: string,
  file: File,
  payload?: { moduleId?: string; mediaType?: 'VIDEO' | 'PRESENTATION' }
) {
  const formData = new FormData();
  formData.append('file', file);
  if (payload?.moduleId) {
    formData.append('moduleId', payload.moduleId);
  }
  if (payload?.mediaType) {
    formData.append('mediaType', payload.mediaType);
  }

  const res = await fetch(`${API_URL}/modules/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Upload failed');
  }

  return res.json() as Promise<{ url: string }>;
}
export function getPricing() {
  return request('/purchases/pricing');
}

export function listAdminPricing(token: string) {
  return request('/admin/pricing', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function updatePricing(
  token: string,
  payload: { packageType: 'SINGLE' | 'GROUP' | 'INSTITUTION'; amount: number; currency?: string }
) {
  return request('/admin/pricing', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function createModule(
  token: string,
  payload: {
    title: string;
    description: string;
    order: number;
    durationMinutes: number;
    deadlineDays: number;
    mediaType: 'VIDEO' | 'PRESENTATION';
    mediaUrl: string;
  }
) {
  return request('/modules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}
