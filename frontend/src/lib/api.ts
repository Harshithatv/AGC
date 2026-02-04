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

function mapToFriendlyMessage(status: number, rawMessage: string) {
  const message = rawMessage.toLowerCase();

  if (status === 401) {
    return 'Invalid email or password. Please try again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'Requested information was not found.';
  }
  if (status === 409) {
    return 'This record already exists. Please use different details.';
  }
  if (status === 413) {
    return 'The uploaded file is too large. Please upload a smaller file.';
  }
  if (status >= 500) {
    return 'We are having trouble right now. Please try again later.';
  }

  if (message.includes('email already')) {
    return 'Email already in use. Please use a different email.';
  }
  if (message.includes('invalid credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('password') && message.includes('longer')) {
    return 'Password must be at least 6 characters.';
  }
  if (message.includes('email') && message.includes('valid')) {
    return 'Please enter a valid email address.';
  }

  return status >= 400 && status < 500
    ? 'Please check your details and try again.'
    : 'Something went wrong. Please try again.';
}

async function getErrorMessage(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  let rawText = '';
  let rawMessage = '';

  try {
    rawText = await res.text();
    if (rawText && contentType.includes('application/json')) {
      const payload = JSON.parse(rawText);
      if (Array.isArray(payload?.message)) {
        rawMessage = payload.message.join(' ');
      } else if (typeof payload?.message === 'string') {
        rawMessage = payload.message;
      } else if (typeof payload?.error === 'string') {
        rawMessage = payload.error;
      }
    }
  } catch {
    rawText = '';
  }

  if (!rawMessage && rawText) {
    rawMessage = rawText;
  }

  return mapToFriendlyMessage(res.status, rawMessage || '');
}

async function request<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const message = await getErrorMessage(res);
    throw new Error(message);
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
    const message = await getErrorMessage(res);
    throw new Error(message);
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
