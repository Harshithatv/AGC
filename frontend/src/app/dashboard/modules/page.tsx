'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { createModule, deleteModule, listAllModules, updateModule, getMyModules, uploadModuleFile } from '@/lib/api';

type MediaType = 'VIDEO' | 'PRESENTATION';

type ModuleForm = {
  title: string;
  description: string;
  order: number;
  durationMinutes: number;
  deadlineDays: number;
  mediaType: MediaType;
  mediaData: string;
};

const emptyForm: ModuleForm = {
  title: '',
  description: '',
  order: 1,
  durationMinutes: 60,
  deadlineDays: 7,
  mediaType: 'VIDEO',
  mediaData: ''
};

export default function DashboardModulesPage() {
  const { user, token } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModule, setNewModule] = useState<ModuleForm>(emptyForm);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ModuleForm>(emptyForm);
  const [preview, setPreview] = useState<{
    open: boolean;
    title: string;
    description: string;
    url: string;
    type: MediaType;
  }>({
    open: false,
    title: '',
    description: '',
    url: '',
    type: 'VIDEO'
  });
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);
  const getPresentationViewerUrl = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return url;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'SYSTEM_ADMIN') {
      listAllModules(token).then((data) => setModules(data as any[]));
    }
    if (user.role === 'ORG_ADMIN') {
      getMyModules(token).then((data) => setModules(data as any[]));
    }
  }, [token, user]);

  const handleFileChange = async (file: File | null, target: 'new' | 'edit') => {
    if (!file || !token) return;
    const result = await uploadModuleFile(
      token,
      file,
      target === 'edit' && editingId ? { moduleId: editingId, mediaType: editForm.mediaType } : undefined
    );
    if (target === 'new') {
      setNewModule((prev) => ({ ...prev, mediaData: result.url }));
    } else {
      const next = { ...editForm, mediaData: result.url };
      setEditForm(next);
      const moduleList = await listAllModules(token);
      setModules(moduleList as any[]);
    }
  };

  const handleAddModule = async () => {
    if (!token) return;
    setAddError('');
    const payload = {
      title: newModule.title.trim(),
      description: newModule.description.trim(),
      order: Number(newModule.order),
      durationMinutes: Number(newModule.durationMinutes),
      deadlineDays: Number(newModule.deadlineDays),
      mediaType: newModule.mediaType,
      mediaUrl: newModule.mediaData.trim()
    };
    console.log('Add module payload', payload);
    if (!payload.title || !payload.description) {
      setAddError('Title and description are required.');
      return;
    }
    if (!Number.isInteger(payload.order) || payload.order < 1) {
      setAddError('Order must be a whole number greater than 0.');
      return;
    }
    if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 1) {
      setAddError('Duration must be a whole number greater than 0.');
      return;
    }
    if (!Number.isInteger(payload.deadlineDays) || payload.deadlineDays < 1) {
      setAddError('Deadline must be a whole number greater than 0.');
      return;
    }
    if (payload.mediaType !== 'VIDEO' && payload.mediaType !== 'PRESENTATION') {
      setAddError('Please select a valid content type.');
      return;
    }
    if (!payload.mediaUrl) {
      setAddError('Please upload a file before saving the module.');
      return;
    }
    try {
      setAddLoading(true);
      await createModule(token, payload);
      const moduleList = await listAllModules(token);
      setModules(moduleList as any[]);
      setNewModule(emptyForm);
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Unable to add module');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!token) return;
    await deleteModule(token, id);
    const moduleList = await listAllModules(token);
    setModules(moduleList as any[]);
  };

  const handleEdit = (moduleItem: any) => {
    setEditingId(moduleItem.id);
    setEditForm({
      title: moduleItem.title,
      description: moduleItem.description,
      order: moduleItem.order,
      durationMinutes: moduleItem.durationMinutes,
      deadlineDays: moduleItem.deadlineDays,
      mediaType: moduleItem.mediaType || 'VIDEO',
      mediaData: moduleItem.mediaUrl || ''
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!token) return;
    await updateModule(token, id, {
      title: editForm.title,
      description: editForm.description,
      order: editForm.order,
      durationMinutes: editForm.durationMinutes,
      deadlineDays: editForm.deadlineDays,
      mediaType: editForm.mediaType,
      mediaUrl: editForm.mediaData
    });
    const moduleList = await listAllModules(token);
    setModules(moduleList as any[]);
    setEditingId(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Modules</h2>
        <p className="mt-2 text-sm text-slate-600">View and manage course modules.</p>
      </div>

      {user.role === 'SYSTEM_ADMIN' ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Modules</h3>
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {showAddForm ? 'Hide form' : 'Add new module'}
            </button>
          </div>
          {showAddForm ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Module title</label>
                <input
                  value={newModule.title}
                  onChange={(event) => setNewModule({ ...newModule, title: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Order</label>
                <input
                  type="number"
                  value={newModule.order}
                  onChange={(event) => setNewModule({ ...newModule, order: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Duration minutes</label>
                <input
                  type="number"
                  value={newModule.durationMinutes}
                  onChange={(event) => setNewModule({ ...newModule, durationMinutes: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Deadline days</label>
                <input
                  type="number"
                  value={newModule.deadlineDays}
                  onChange={(event) => setNewModule({ ...newModule, deadlineDays: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Module description</label>
                <textarea
                  value={newModule.description}
                  onChange={(event) => setNewModule({ ...newModule, description: event.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Content type</label>
                <select
                  value={newModule.mediaType}
                  onChange={(event) => setNewModule({ ...newModule, mediaType: event.target.value as MediaType })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                >
                  <option value="VIDEO">Video</option>
                  <option value="PRESENTATION">Presentation</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-400">Upload file</label>
                <input
                  type="file"
                  onChange={(event) => handleFileChange(event.target.files?.[0] || null, 'new')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={handleAddModule}
                  disabled={addLoading}
                  className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {addLoading ? 'Saving...' : 'Save module'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewModule(emptyForm);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                {addError ? <p className="text-sm text-red-500">{addError}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Module list</h3>
        <div className="mt-4 grid gap-4">
          {modules.map((moduleItem) => (
            <div key={moduleItem.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-ocean-600">Module {moduleItem.order}</p>
                  <p className="text-lg font-semibold text-slate-800">{moduleItem.title}</p>
                  <p className="text-sm text-slate-600">{moduleItem.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const url = moduleItem.mediaUrl;
                      setPreview({
                        open: true,
                        title: moduleItem.title,
                        description: moduleItem.description,
                        url: url ? resolveMediaUrl(url) : '',
                        type: moduleItem.mediaType === 'PRESENTATION' ? 'PRESENTATION' : 'VIDEO'
                      });
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    View
                  </button>
                  {user.role === 'SYSTEM_ADMIN' ? (
                    <button
                      onClick={() => handleEdit(moduleItem)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                  ) : null}
                  {user.role === 'SYSTEM_ADMIN' ? (
                    <button
                      onClick={() => handleDeleteModule(moduleItem.id)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              {user.role === 'SYSTEM_ADMIN' && editingId === moduleItem.id ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    value={editForm.title}
                    onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(event) => setEditForm({ ...editForm, order: Number(event.target.value) })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(event) =>
                      setEditForm({ ...editForm, durationMinutes: Number(event.target.value) })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={editForm.deadlineDays}
                    onChange={(event) => setEditForm({ ...editForm, deadlineDays: Number(event.target.value) })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                    rows={2}
                    className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={editForm.mediaType}
                    onChange={(event) => setEditForm({ ...editForm, mediaType: event.target.value as MediaType })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="PRESENTATION">Presentation</option>
                  </select>
                  <input
                    type="file"
                    onChange={(event) => handleFileChange(event.target.files?.[0] || null, 'edit')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="md:col-span-2 text-xs text-slate-500">
                    Uploading a new file will replace the existing {editForm.mediaType} file.
                  </p>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(moduleItem.id)}
                      className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {preview.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {preview.type === 'VIDEO' ? 'Video' : 'Presentation'}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">{preview.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview({ ...preview, open: false })}
                className="rounded-xl border border-slate-200 px-3 py-1 text-sm text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              {preview.url ? (
                preview.type === 'VIDEO' ? (
                  <video controls className="w-full rounded-xl border border-slate-200">
                    <source src={preview.url} />
                  </video>
                ) : (
                  <iframe
                    src={getPresentationViewerUrl(preview.url)}
                    title="Presentation preview"
                    className="h-[60vh] w-full rounded-xl border border-slate-200"
                  />
                )
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No file uploaded for this module.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
