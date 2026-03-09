import { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Trash2, X, Save, ToggleLeft, ToggleRight, Upload, FileText } from 'lucide-react';

export default function SkillManager({ onClose }) {
  const [skills, setSkills] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', instructions: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  const loadSkills = useCallback(async () => {
    if (!window.api?.listSkills) return;
    const list = await window.api.listSkills();
    setSkills(list || []);
  }, []);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const handleCreate = async () => {
    if (!form.name?.trim() || !form.instructions?.trim()) return;
    setSaving(true);
    try {
      await window.api.createSkill(form);
      setCreating(false);
      setForm({ name: '', description: '', instructions: '', category: 'general' });
      await loadSkills();
    } catch (e) { console.error('Create skill error:', e); }
    setSaving(false);
  };

  const handleToggle = async (skill) => {
    await window.api.toggleSkill(skill.id, !skill.is_active);
    await loadSkills();
  };

  const handleDelete = async (id) => {
    await window.api.deleteSkill(id);
    await loadSkills();
  };

  const handleImport = async () => {
    if (!window.api?.importFile) return;
    try {
      const result = await window.api.importFile();
      if (result?.path) {
        const filePath = result.filePath || result.path;
        await window.api.importSkill(filePath);
        await loadSkills();
      }
    } catch (e) { console.error('Import skill error:', e); }
  };

  if (creating) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
          <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> New Skill / Plugin
            </h2>
            <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Skill Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., SA Tax Expert, IFRS Analyst"
                className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Short description of what this skill does"
                className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none">
                <option value="general">General</option>
                <option value="tax">Tax</option>
                <option value="audit">Audit</option>
                <option value="accounting">Accounting</option>
                <option value="finance">Finance</option>
                <option value="hr">HR / Payroll</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Instructions <span className="text-red-500">*</span></label>
              <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                rows={8} placeholder="Write the skill instructions here. These will be injected into the AI system prompt when the skill is active.&#10;&#10;Example:&#10;You are a specialist in South African tax returns...&#10;Always include SARS reference numbers...&#10;Format output as a structured report..."
                className="w-full border rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none font-mono" />
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-xl">
            <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.name?.trim() || !form.instructions?.trim()}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Create Skill'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Skills & Plugins
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> New Skill
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {skills.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No skills yet. Create or import a skill to enhance the AI.</p>
              <p className="text-xs mt-1">Skills are custom instructions that guide the AI for specific tasks.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {skills.map(skill => (
                <div key={skill.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800">{skill.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">{skill.category}</span>
                      {skill.is_active ? (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">Active</span>
                      ) : null}
                    </div>
                    {skill.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{skill.description}</p>}
                    <p className="text-xs text-slate-300 mt-0.5 truncate font-mono">{skill.instructions?.substring(0, 100)}...</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => handleToggle(skill)}
                      className={`p-1.5 rounded-lg transition-colors ${skill.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}`}
                      title={skill.is_active ? 'Deactivate' : 'Activate'}>
                      {skill.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDelete(skill.id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-slate-50 rounded-b-xl text-xs text-slate-400 text-center">
          {skills.filter(s => s.is_active).length} active / {skills.length} total skills
        </div>
      </div>
    </div>
  );
}
