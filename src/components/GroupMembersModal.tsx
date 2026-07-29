import React, { useState } from 'react';
import { CurrencyCode, Group, Member } from '../types';
import { SUPPORTED_CURRENCIES, getCurrencyDetails } from '../data/currencies';
import { X, Users, Plus, Trash2, Check, UserPlus, Globe, Sparkles } from 'lucide-react';

interface GroupMembersModalProps {
  group: Group;
  onClose: () => void;
  onUpdateGroup: (updatedGroup: Group) => void;
}

const AVATAR_SAMPLES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
];

const COLOR_SAMPLES = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6'];

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  group,
  onClose,
  onUpdateGroup,
}) => {
  const [groupName, setGroupName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(group.baseCurrency);
  const [groupIcon, setGroupIcon] = useState(group.icon || '✈️');

  const [members, setMembers] = useState<Member[]>(group.members);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Add Member (up to 20 users constraint)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    if (members.length >= 20) {
      alert('Maximum group capacity of 20 users reached.');
      return;
    }

    const randomAvatar = AVATAR_SAMPLES[members.length % AVATAR_SAMPLES.length];
    const randomColor = COLOR_SAMPLES[members.length % COLOR_SAMPLES.length];

    const newM: Member = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || undefined,
      avatar: randomAvatar,
      color: randomColor,
    };

    setMembers([...members, newM]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 2) {
      alert('A group must have at least 2 members.');
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSaveAll = () => {
    onUpdateGroup({
      ...group,
      name: groupName,
      description,
      baseCurrency,
      icon: groupIcon,
      members,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-100">Group Members & Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200 text-xs">
          {/* Group General Details */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={groupIcon}
                onChange={(e) => setGroupIcon(e.target.value)}
                className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl focus:outline-none"
              />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-slate-400">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Group Base Currency</label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Capacity</label>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400 font-bold">
                  {members.length} / 20 Users Max
                </div>
              </div>
            </div>
          </div>

          {/* Add New Member Form */}
          <form onSubmit={handleAddMember} className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add Member to Group</span>
              </span>
              <span className="text-[10px] text-slate-400">Up to 20 Users</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Member Name (e.g., Taylor)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!newMemberName.trim() || members.length >= 20}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </form>

          {/* Members List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Group Members ({members.length}):
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 shrink-0"
                      style={{ borderColor: m.color || '#6366F1' }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-100 truncate flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.isCurrentUser && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] px-1.5 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{m.email || 'No email attached'}</div>
                    </div>
                  </div>

                  {!m.isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-xs"
          >
            Save Group Settings
          </button>
        </div>
      </div>
    </div>
  );
};
