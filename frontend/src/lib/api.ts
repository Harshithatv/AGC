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
  if (message.includes('email') && (message.includes('valid') || message.includes('must be an email'))) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('name must be a string')) {
    return 'Name is required.';
  }
  if (message.includes('password must be a string')) {
    return 'Password is required.';
  }
  if (message.includes('cannot be deleted')) {
    return 'This package cannot be deleted because it is already in use.';
  }
  if (message.includes('package not found')) {
    return 'Package not found.';
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
  packageType: string;
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

export function startModuleFile(token: string, moduleId: string, fileId: string) {
  return request(`/modules/${moduleId}/files/${fileId}/start`, {
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

export function completeModuleFile(token: string, moduleId: string, fileId: string) {
  return request(`/modules/${moduleId}/files/${fileId}/complete`, {
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
  const sanitized = {
    name: String(payload.name ?? '').trim(),
    email: String(payload.email ?? '').trim(),
    password: String(payload.password ?? '').trim()
  };
  return request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(sanitized)
  });
}

export function bulkCreateUsers(
  token: string,
  payload: { users: Array<{ name: string; email: string; password: string }> }
) {
  const sanitized = {
    users: payload.users.map((user) => ({
      name: String(user.name ?? '').trim(),
      email: String(user.email ?? '').trim(),
      password: String(user.password ?? '').trim()
    }))
  };
  return request('/users/bulk', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(sanitized)
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

export function getAdminOrganization(token: string, id: string) {
  return request(`/admin/organizations/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listAdminOrganizationUsers(token: string, id: string) {
  return request(`/admin/organizations/${id}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listAdminPurchases(token: string) {
  return request('/admin/purchases', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getCertificationStats(token: string) {
  return request('/admin/certification-stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getCertifiedLearners(token: string) {
  return request('/admin/certified-learners', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getOrgCertifiedLearners(token: string) {
  return request('/organizations/me/certified-learners', {
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
    deadlineDays?: number;
    mediaType?: 'VIDEO' | 'PDF';
    mediaUrl?: string;
    filesToAdd?: Array<{
      title?: string;
      mediaType: 'VIDEO' | 'PDF';
      mediaUrl: string;
    }>;
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

export function deleteModuleFile(token: string, moduleId: string, fileId: string) {
  return request(`/modules/${moduleId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function uploadModuleFile(
  token: string,
  file: File,
  payload?: { moduleId?: string; mediaType?: 'VIDEO' | 'PDF'; order?: number; title?: string }
) {
  const formData = new FormData();
  formData.append('file', file);
  if (payload?.moduleId) {
    formData.append('moduleId', payload.moduleId);
  }
  if (payload?.mediaType) {
    formData.append('mediaType', payload.mediaType);
  }
  if (payload?.order) {
    formData.append('order', String(payload.order));
  }
  if (payload?.title) {
    formData.append('title', payload.title);
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
  payload: {
    packageType: string;
    amount: number;
    currency?: string;
    maxUsers?: number;
    label?: string;
    summary?: string;
    features?: string[];
    highlight?: boolean;
  }
) {
  return request('/admin/pricing', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function deletePricing(token: string, packageType: string) {
  return request(`/admin/pricing/${encodeURIComponent(packageType)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getAdminUserProgress(token: string, id: string) {
  return request(`/admin/users/${id}/progress`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getOrgUserProgress(token: string, id: string) {
  return request(`/users/${id}/progress`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createModule(
  token: string,
  payload: {
    title: string;
    description: string;
    order: number;
    deadlineDays: number;
    mediaType: 'VIDEO' | 'PDF';
    mediaUrl: string;
    files?: Array<{
      order: number;
      title?: string;
      mediaType: 'VIDEO' | 'PDF';
      mediaUrl: string;
    }>;
  }
) {
  return request('/modules', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
) {
  return request<{ success: boolean; message: string }>('/users/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

export function forgotPassword(email: string) {
  return request<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  });
}

export function verifyResetToken(token: string) {
  return request<{ valid: boolean; email?: string }>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
    method: 'GET'
  });
}

// Contact messages
export function submitContactMessage(payload: { name: string; email: string; message: string }) {
  return request<{ success: boolean; message: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function listContactMessages(token: string) {
  return request('/contact', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getUnreadContactCount(token: string) {
  return request<{ count: number }>('/contact/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function markContactAsRead(token: string, id: string) {
  return request(`/contact/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function deleteContactMessage(token: string, id: string) {
  return request(`/contact/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Notifications
export function listNotifications(token: string) {
  return request('/notifications', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getUnreadNotificationCount(token: string) {
  return request<{ count: number }>('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function markNotificationAsRead(token: string, id: string) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function markAllNotificationsAsRead(token: string) {
  return request('/notifications/mark-all-read', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
}
