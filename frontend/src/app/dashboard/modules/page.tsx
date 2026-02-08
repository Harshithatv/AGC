'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { createModule, deleteModule, deleteModuleFile, listAllModules, updateModule, getMyModules, uploadModuleFile } from '@/lib/api';
import { showToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

type MediaType = 'VIDEO' | 'PDF';

type ModuleFileForm = {
  id?: string;
  title: string;
  mediaType: MediaType;
  mediaData: string;
  order: number;
};

type ModuleForm = {
  title: string;
  description: string;
  order: number;
  deadlineDays: number;
  mediaType: MediaType;
  mediaData: string;
  files: ModuleFileForm[];
};

const emptyForm: ModuleForm = {
  title: '',
  description: '',
  order: 1,
  deadlineDays: 7,
  mediaType: 'VIDEO',
  mediaData: '',
  files: [
    {
      title: '',
      mediaType: 'VIDEO',
      mediaData: '',
      order: 1
    }
  ]
};

type FieldErrors = Record<string, string>;

export default function DashboardModulesPage() {
  const { user, token } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModule, setNewModule] = useState<ModuleForm>(emptyForm);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ModuleForm>(emptyForm);
  const [editFileDraft, setEditFileDraft] = useState<ModuleFileForm>({
    title: '',
    mediaType: 'VIDEO',
    mediaData: '',
    order: 1
  });
  const [editPendingFiles, setEditPendingFiles] = useState<ModuleFileForm[]>([]);
  const [preview, setPreview] = useState<{
    open: boolean;
    title: string;
    description: string;
    url: string;
    type: MediaType;
    files: any[];
  }>({
    open: false,
    title: '',
    description: '',
    url: '',
    type: 'VIDEO',
    files: []
  });
  const [filePreview, setFilePreview] = useState<{
    open: boolean;
    title: string;
    url: string;
    type: MediaType;
  }>({
    open: false,
    title: '',
    url: '',
    type: 'VIDEO'
  });

  // Field-level validation errors
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({});
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});
  const [editSaveLoading, setEditSaveLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fileDeleteConfirm, setFileDeleteConfirm] = useState<{ open: boolean; moduleId: string; fileId: string }>({ open: false, moduleId: '', fileId: '' });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url: string) => (url.startsWith('http') ? url : `${apiBaseUrl}${url}`);
  const getPdfViewerUrl = (url: string) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === 'SYSTEM_ADMIN') {
      listAllModules(token).then((data) => setModules(data as any[]));
    }
    if (user.role === 'ORG_ADMIN') {
      getMyModules(token).then((data) => setModules(data as any[]));
    }
  }, [token, user]);

  const handleFileChange = async (
    file: File | null,
    target: 'new' | 'edit',
    fileIndex = 0
  ) => {
    if (!file || !token) return;

    // Validate file type against selected media type
    const selectedType = target === 'edit' ? editFileDraft.mediaType : newModule.files[fileIndex]?.mediaType;
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileMime = file.type.toLowerCase();

    if (selectedType === 'VIDEO') {
      const isVideo = fileMime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(fileExt);
      if (!isVideo) {
        showToast('Please upload a video file when "Video" is selected', 'error');
        return;
      }
    }

    if (selectedType === 'PDF') {
      const isPdf = fileMime === 'application/pdf' || fileExt === 'pdf';
      if (!isPdf) {
        showToast('Please upload a PDF file when "PDF" is selected', 'error');
        return;
      }
    }

    const result = await uploadModuleFile(
      token,
      file,
      target === 'edit'
        ? {
            mediaType: editFileDraft.mediaType,
            order: editFileDraft.order,
            title: editFileDraft.title
          }
        : { mediaType: newModule.files[fileIndex]?.mediaType }
    );
    if (target === 'new') {
      setNewModule((prev) => {
        const files = [...prev.files];
        files[fileIndex] = { ...files[fileIndex], mediaData: result.url };
        return { ...prev, files };
      });
      setAddFieldErrors((e) => ({ ...e, files: '' }));
    } else {
      setEditFileDraft((prev) => ({ ...prev, mediaData: result.url }));
    }
  };

  const handleAddFileRow = () => {
    setNewModule((prev) => ({
      ...prev,
      files: [
        ...prev.files,
        {
          title: '',
          mediaType: 'VIDEO',
          mediaData: '',
          order: prev.files.length + 1
        }
      ]
    }));
  };

  const handleRemoveFileRow = (index: number) => {
    setNewModule((prev) => {
      const files = prev.files.filter((_, idx) => idx !== index);
      const normalized = files.map((file, idx) => ({ ...file, order: idx + 1 }));
      return { ...prev, files: normalized };
    });
  };

  const handleFileFieldChange = (
    index: number,
    updates: Partial<{ title: string; mediaType: MediaType; mediaData: string }>
  ) => {
    setNewModule((prev) => {
      const files = [...prev.files];
      files[index] = { ...files[index], ...updates };
      return { ...prev, files };
    });
  };

  const handleEditDraftChange = (updates: Partial<{ title: string; mediaType: MediaType; mediaData: string }>) => {
    setEditFileDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleAddPendingFile = () => {
    if (!editFileDraft.mediaData) {
      setAddError('Upload a file before adding it.');
      return;
    }
    setEditPendingFiles((prev) => [
      ...prev,
      { ...editFileDraft, order: prev.length + 1 }
    ]);
    setEditFileDraft({ title: '', mediaType: 'VIDEO', mediaData: '', order: editFileDraft.order + 1 });
  };

  const handleRemovePendingFile = (index: number) => {
    setEditPendingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDeleteExistingFile = async (moduleId: string, fileId: string) => {
    if (!token) return;
    try {
      await deleteModuleFile(token, moduleId, fileId);
      const moduleList = (await listAllModules(token)) as any[];
      setModules(moduleList);
      const updated = moduleList.find((item: any) => item.id === moduleId);
      if (updated) {
        setEditForm((prev) => ({
          ...prev,
          files: Array.isArray(updated.files)
            ? updated.files.map((file: any) => ({
                id: file.id,
                title: file.title || '',
                mediaType: file.mediaType || 'VIDEO',
                mediaData: file.mediaUrl || '',
                order: file.order
              }))
            : []
        }));
      }
      showToast('File deleted successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete file', 'error');
    }
  };

  const validateAddForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!newModule.title.trim()) errors.title = 'Module title is required';
    if (!newModule.description.trim()) errors.description = 'Description is required';
    if (!Number.isInteger(Number(newModule.order)) || Number(newModule.order) < 1) errors.order = 'Order must be a whole number greater than 0';
    if (!Number.isInteger(Number(newModule.deadlineDays)) || Number(newModule.deadlineDays) < 1) errors.deadlineDays = 'Deadline must be a whole number greater than 0';
    const hasFile = newModule.files.some((f) => f.mediaData.trim());
    if (!hasFile) errors.files = 'Please upload at least one file';
    setAddFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!editForm.title.trim()) errors.title = 'Module title is required';
    if (!editForm.description.trim()) errors.description = 'Description is required';
    if (!Number.isInteger(Number(editForm.order)) || Number(editForm.order) < 1) errors.order = 'Order must be a whole number greater than 0';
    if (!Number.isInteger(Number(editForm.deadlineDays)) || Number(editForm.deadlineDays) < 1) errors.deadlineDays = 'Deadline must be a whole number greater than 0';
    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddModule = async () => {
    if (!token) return;
    setAddError('');
    if (!validateAddForm()) return;

    const files = newModule.files
      .map((file) => ({
        order: Number(file.order),
        title: file.title.trim(),
        mediaType: file.mediaType,
        mediaUrl: file.mediaData.trim()
      }))
      .filter((file) => file.mediaUrl);
    const primaryFile = files[0];
    const payload = {
      title: newModule.title.trim(),
      description: newModule.description.trim(),
      order: Number(newModule.order),
      deadlineDays: Number(newModule.deadlineDays),
      mediaType: primaryFile?.mediaType || newModule.mediaType,
      mediaUrl: primaryFile?.mediaUrl || newModule.mediaData.trim(),
      files
    };

    try {
      setAddLoading(true);
      await createModule(token, payload);
      const moduleList = (await listAllModules(token)) as any[];
      setModules(moduleList);
      setNewModule(emptyForm);
      setShowAddForm(false);
      setAddFieldErrors({});
      showToast('Module created successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to add module';
      setAddError(msg);
      showToast(msg, 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!token) return;
    try {
      setDeleteLoading(true);
      await deleteModule(token, id);
      const moduleList = (await listAllModules(token)) as any[];
      setModules(moduleList);
      setDeleteConfirm({ open: false, id: '' });
      showToast('Module deleted successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete module', 'error');
      setDeleteConfirm({ open: false, id: '' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (moduleItem: any) => {
    setEditingId(moduleItem.id);
    setEditFieldErrors({});
    setEditForm({
      title: moduleItem.title,
      description: moduleItem.description,
      order: moduleItem.order,
      deadlineDays: moduleItem.deadlineDays,
      mediaType: moduleItem.mediaType || 'VIDEO',
      mediaData: moduleItem.mediaUrl || '',
      files: Array.isArray(moduleItem.files) && moduleItem.files.length
        ? moduleItem.files.map((file: any) => ({
            id: file.id,
            title: file.title || '',
            mediaType: file.mediaType || 'VIDEO',
            mediaData: file.mediaUrl || '',
            order: file.order
          }))
        : []
    });
    setEditFileDraft({
      title: '',
      mediaType: 'VIDEO',
      mediaData: '',
      order: (moduleItem.files?.length ?? 0) + 1
    });
    setEditPendingFiles([]);
  };

  const handleSaveEdit = async (id: string) => {
    if (!token) return;
    if (!validateEditForm()) return;
    try {
      setEditSaveLoading(true);
      await updateModule(token, id, {
        title: editForm.title,
        description: editForm.description,
        order: editForm.order,
        deadlineDays: editForm.deadlineDays,
        mediaType: editForm.mediaType,
        mediaUrl: editForm.mediaData,
        filesToAdd: editPendingFiles
          .map((file) => ({
            title: file.title.trim(),
            mediaType: file.mediaType,
            mediaUrl: file.mediaData.trim()
          }))
          .filter((file) => file.mediaUrl)
      });
      const moduleList = (await listAllModules(token)) as any[];
      setModules(moduleList);
      setEditingId(null);
      setEditPendingFiles([]);
      setEditFieldErrors({});
      showToast('Module updated successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update module', 'error');
    } finally {
      setEditSaveLoading(false);
    }
  };

  const errBorder = (field: string, errors: FieldErrors) =>
    errors[field] ? 'border-red-400' : 'border-slate-200';

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
              onClick={() => { setShowAddForm(true); setAddFieldErrors({}); setAddError(''); }}
              className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add new module
            </button>
          </div>
        </div>
      ) : null}

      {showAddForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add module</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Create module content</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewModule(emptyForm);
                  setAddError('');
                  setAddFieldErrors({});
                }}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Module title <span className="text-red-500">*</span>
                </label>
                <input
                  value={newModule.title}
                  onChange={(event) => { setNewModule({ ...newModule, title: event.target.value }); setAddFieldErrors((e) => ({ ...e, title: '' })); }}
                  className={`w-full rounded-xl border px-4 py-2 ${errBorder('title', addFieldErrors)}`}
                  placeholder="Enter module title"
                />
                {addFieldErrors.title ? <p className="text-xs text-red-500">{addFieldErrors.title}</p> : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Order <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newModule.order}
                  onChange={(event) => { setNewModule({ ...newModule, order: Number(event.target.value) }); setAddFieldErrors((e) => ({ ...e, order: '' })); }}
                  className={`w-full rounded-xl border px-4 py-2 ${errBorder('order', addFieldErrors)}`}
                />
                {addFieldErrors.order ? <p className="text-xs text-red-500">{addFieldErrors.order}</p> : null}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Deadline days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newModule.deadlineDays}
                  onChange={(event) => { setNewModule({ ...newModule, deadlineDays: Number(event.target.value) }); setAddFieldErrors((e) => ({ ...e, deadlineDays: '' })); }}
                  className={`w-full rounded-xl border px-4 py-2 ${errBorder('deadlineDays', addFieldErrors)}`}
                />
                {addFieldErrors.deadlineDays ? <p className="text-xs text-red-500">{addFieldErrors.deadlineDays}</p> : null}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Module description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newModule.description}
                  onChange={(event) => { setNewModule({ ...newModule, description: event.target.value }); setAddFieldErrors((e) => ({ ...e, description: '' })); }}
                  rows={3}
                  className={`w-full rounded-xl border px-4 py-3 ${errBorder('description', addFieldErrors)}`}
                  placeholder="Enter module description"
                />
                {addFieldErrors.description ? <p className="text-xs text-red-500">{addFieldErrors.description}</p> : null}
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Module files <span className="text-red-500">*</span>
                </label>
                {addFieldErrors.files ? <p className="text-xs text-red-500">{addFieldErrors.files}</p> : null}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {newModule.files.map((file, index) => (
                    <div key={`new-file-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <input
                        value={file.title}
                        onChange={(event) => handleFileFieldChange(index, { title: event.target.value })}
                        placeholder="Title"
                        className="w-32 flex-shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      />
                      <select
                        value={file.mediaType}
                        onChange={(event) => handleFileFieldChange(index, { mediaType: event.target.value as MediaType })}
                        className="w-28 flex-shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      >
                        <option value="VIDEO">Video</option>
                        <option value="PDF">PDF</option>
                      </select>
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-500 hover:border-ocean-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="truncate">{file.mediaData ? 'Uploaded' : 'Choose file'}</span>
                        <input
                          type="file"
                          accept={file.mediaType === 'VIDEO' ? 'video/*' : '.pdf,application/pdf'}
                          onChange={(event) => handleFileChange(event.target.files?.[0] || null, 'new', index)}
                          className="hidden"
                        />
                      </label>
                      {file.mediaData ? (
                        <button
                          type="button"
                          onClick={() =>
                            setFilePreview({
                              open: true,
                              title: file.title || 'File preview',
                              url: resolveMediaUrl(file.mediaData),
                              type: file.mediaType
                            })
                          }
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-ocean-600 hover:bg-ocean-50"
                          title="Preview"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      ) : null}
                      {newModule.files.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFileRow(index)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : null}
                      {index === newModule.files.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleAddFileRow}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-ocean-200 bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
                          title="Add another file"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
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
                    setAddError('');
                    setAddFieldErrors({});
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                {addError ? <p className="text-sm text-red-500">{addError}</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Module list</h3>
          <div className="relative sm:max-w-xs flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              placeholder="Search modules..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm transition focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4">
          {modules.filter((m) => !moduleSearch || m.title?.toLowerCase().includes(moduleSearch.toLowerCase()) || m.description?.toLowerCase().includes(moduleSearch.toLowerCase())).map((moduleItem) => (
            <div key={moduleItem.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
              <div>
                <p className="text-sm font-semibold text-ocean-600">Module {moduleItem.order}</p>
                <p className="text-lg font-semibold text-slate-800">{moduleItem.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {moduleItem.files?.length
                    ? `${moduleItem.files.length} file${moduleItem.files.length === 1 ? '' : 's'}`
                    : moduleItem.mediaUrl
                      ? '1 file'
                      : 'No files'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPreview({
                      open: true,
                      title: moduleItem.title,
                      description: moduleItem.description,
                      url: moduleItem.mediaUrl ? resolveMediaUrl(moduleItem.mediaUrl) : '',
                      type: moduleItem.mediaType === 'VIDEO' ? 'VIDEO' : 'PDF',
                      files: moduleItem.files || []
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-ocean-600 hover:bg-ocean-50"
                  title="View details"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {user.role === 'SYSTEM_ADMIN' ? (
                  <button
                    onClick={() => handleEdit(moduleItem)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                ) : null}
                {user.role === 'SYSTEM_ADMIN' ? (
                  <button
                    onClick={() => setDeleteConfirm({ open: true, id: moduleItem.id })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : null}
              </div>

              {user.role === 'SYSTEM_ADMIN' && editingId === moduleItem.id ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
                  <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Edit module</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">{editForm.title}</h3>
                      </div>
                      <button
                        onClick={() => { setEditingId(null); setEditFieldErrors({}); }}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-400">
                      Module title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={editForm.title}
                      onChange={(event) => { setEditForm({ ...editForm, title: event.target.value }); setEditFieldErrors((e) => ({ ...e, title: '' })); }}
                      className={`w-full rounded-xl border px-4 py-2 ${errBorder('title', editFieldErrors)}`}
                    />
                    {editFieldErrors.title ? <p className="text-xs text-red-500">{editFieldErrors.title}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-400">
                      Order <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editForm.order}
                      onChange={(event) => { setEditForm({ ...editForm, order: Number(event.target.value) }); setEditFieldErrors((e) => ({ ...e, order: '' })); }}
                      className={`w-full rounded-xl border px-4 py-2 ${errBorder('order', editFieldErrors)}`}
                    />
                    {editFieldErrors.order ? <p className="text-xs text-red-500">{editFieldErrors.order}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-400">
                      Deadline days <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editForm.deadlineDays}
                      onChange={(event) => { setEditForm({ ...editForm, deadlineDays: Number(event.target.value) }); setEditFieldErrors((e) => ({ ...e, deadlineDays: '' })); }}
                      className={`w-full rounded-xl border px-4 py-2 ${errBorder('deadlineDays', editFieldErrors)}`}
                    />
                    {editFieldErrors.deadlineDays ? <p className="text-xs text-red-500">{editFieldErrors.deadlineDays}</p> : null}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold uppercase text-slate-400">
                      Module description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(event) => { setEditForm({ ...editForm, description: event.target.value }); setEditFieldErrors((e) => ({ ...e, description: '' })); }}
                      rows={3}
                      className={`w-full rounded-xl border px-4 py-3 ${errBorder('description', editFieldErrors)}`}
                    />
                    {editFieldErrors.description ? <p className="text-xs text-red-500">{editFieldErrors.description}</p> : null}
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-xs font-semibold uppercase text-slate-400">Module files</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {(editForm.files || []).map((file, index) => (
                        <div key={`edit-file-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <span className="w-6 flex-shrink-0 text-xs font-semibold text-slate-400">#{file.order}</span>
                          <span className="flex-1 truncate text-sm font-medium text-slate-700">{file.title || file.mediaType}</span>
                          <span className="flex-shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{file.mediaType}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFilePreview({
                                open: true,
                                title: file.title || file.mediaType,
                                url: resolveMediaUrl(file.mediaData || ''),
                                type: file.mediaType
                              })
                            }
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-ocean-600 hover:bg-ocean-50"
                            title="Preview"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => file.id && setFileDeleteConfirm({ open: true, moduleId: editingId as string, fileId: file.id })}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50"
                            title="Remove"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {editPendingFiles.map((file, index) => (
                        <div key={`pending-file-${index}`} className="flex items-center gap-2 rounded-lg border border-ocean-200 bg-ocean-50 px-3 py-2">
                          <span className="w-6 flex-shrink-0 text-xs font-semibold text-ocean-500">new</span>
                          <span className="flex-1 truncate text-sm font-medium text-slate-700">{file.title || file.mediaType}</span>
                          <span className="flex-shrink-0 rounded bg-ocean-100 px-2 py-0.5 text-xs text-ocean-700">{file.mediaType}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFilePreview({
                                open: true,
                                title: file.title || file.mediaType,
                                url: resolveMediaUrl(file.mediaData),
                                type: file.mediaType
                              })
                            }
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-ocean-600 hover:bg-ocean-50"
                            title="Preview"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingFile(index)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50"
                            title="Remove"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2">
                        <input
                          value={editFileDraft.title}
                          onChange={(event) => handleEditDraftChange({ title: event.target.value })}
                          placeholder="Title"
                          className="w-32 flex-shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        />
                        <select
                          value={editFileDraft.mediaType}
                          onChange={(event) => handleEditDraftChange({ mediaType: event.target.value as MediaType })}
                          className="w-28 flex-shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="VIDEO">Video</option>
                          <option value="PDF">PDF</option>
                        </select>
                        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 hover:border-ocean-400">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="truncate">{editFileDraft.mediaData ? 'Uploaded' : 'Choose file'}</span>
                          <input
                            type="file"
                            accept={editFileDraft.mediaType === 'VIDEO' ? 'video/*' : '.pdf,application/pdf'}
                            onChange={(event) => handleFileChange(event.target.files?.[0] || null, 'edit')}
                            className="hidden"
                          />
                        </label>
                        {editFileDraft.mediaData ? (
                          <button
                            type="button"
                            onClick={() =>
                              setFilePreview({
                                open: true,
                                title: editFileDraft.title || 'New file',
                                url: resolveMediaUrl(editFileDraft.mediaData),
                                type: editFileDraft.mediaType
                              })
                            }
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-ocean-600 hover:bg-ocean-50"
                            title="Preview"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleAddPendingFile}
                          disabled={!editFileDraft.mediaData}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-ocean-200 bg-ocean-50 text-ocean-600 hover:bg-ocean-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Add file"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {editPendingFiles.length ? (
                      <p className="text-xs text-slate-500">New files will be saved when you click &quot;Save changes&quot;.</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(moduleItem.id)}
                      disabled={editSaveLoading}
                      className="rounded-xl bg-ocean-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {editSaveLoading ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditFieldErrors({}); }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {preview.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Module details</p>
                <h3 className="text-lg font-semibold text-slate-900">{preview.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview({ ...preview, open: false, files: [] })}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                Files ({preview.files?.length || (preview.url ? 1 : 0)})
              </p>
              {preview.files?.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {preview.files.map((file: any, idx: number) => (
                    <div
                      key={file.id || idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-100 text-sm font-semibold text-ocean-600">
                          {file.order}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{file.title || `File ${file.order}`}</p>
                          <p className="text-xs text-slate-500">{file.mediaType}</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setFilePreview({
                            open: true,
                            title: file.title || `File ${file.order}`,
                            url: resolveMediaUrl(file.mediaUrl),
                            type: file.mediaType
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ocean-200 bg-white text-ocean-600 hover:bg-ocean-50"
                        title="Preview file"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : preview.url ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-100 text-sm font-semibold text-ocean-600">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{preview.title}</p>
                      <p className="text-xs text-slate-500">{preview.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setFilePreview({
                        open: true,
                        title: preview.title,
                        url: preview.url,
                        type: preview.type
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-ocean-200 bg-white text-ocean-600 hover:bg-ocean-50"
                    title="Preview file"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No files uploaded for this module.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {filePreview.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{filePreview.title}</h3>
              </div>
              <button
                onClick={() => setFilePreview({ open: false, title: '', url: '', type: 'VIDEO' })}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {filePreview.type === 'VIDEO' ? (
                <video controls className="h-[70vh] w-full object-contain">
                  <source src={filePreview.url} />
                </video>
              ) : (
                <iframe 
                  src={getPdfViewerUrl(filePreview.url)} 
                  className="h-[70vh] w-full" 
                  title="PDF preview" 
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete module confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete module"
        message="Are you sure you want to delete this module? All files within this module will also be deleted. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => handleDeleteModule(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ open: false, id: '' })}
      />

      {/* Delete file confirmation dialog */}
      <ConfirmDialog
        open={fileDeleteConfirm.open}
        title="Delete file"
        message="Are you sure you want to remove this file from the module?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          await handleDeleteExistingFile(fileDeleteConfirm.moduleId, fileDeleteConfirm.fileId);
          setFileDeleteConfirm({ open: false, moduleId: '', fileId: '' });
        }}
        onCancel={() => setFileDeleteConfirm({ open: false, moduleId: '', fileId: '' })}
      />
    </div>
  );
}
