import React, { useState } from 'react';
import { Group } from '../types';
import { ChevronDown, Plus, Users, Share2, WifiOff } from 'lucide-react';
import { getCurrencyDetails } from '../data/currencies';

interface GroupSelectorProps {
  groups: Group[];
  activeGroup: Group;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenMembersModal: () => void;
  onOpenShareModal: () => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenMembersModal,
  onOpenShareModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const baseCurrencyObj = getCurrencyDetails(activeGroup.baseCurrency);

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 z-30 shadow-md">
      {/* Active Group Selector Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl px-3 py-1.5 transition-all text-left group"
        >
          <span className="text-xl leading-none">{activeGroup.icon || '✈️'}</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100 max-w-[150px] truncate">
                {activeGroup.name}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>{activeGroup.members.length} members</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">
                {baseCurrencyObj.flag} {activeGroup.baseCurrency}
              </span>
            </span>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Your Groups
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto my-1 pr-1">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    onSelectGroup(g.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    g.id === activeGroup.id
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-medium'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-lg">{g.icon || '👥'}</span>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-200 truncate">{g.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {g.members.length} users • Base {g.baseCurrency}
                      </div>
                    </div>
                  </div>
                  {g.id === activeGroup.id && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateGroup();
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenMembersModal}
          className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-all relative"
          title="Manage Members (Up to 20)"
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {activeGroup.members.length}
          </span>
        </button>

        <button
          onClick={onOpenShareModal}
          className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-all"
          title="Share / Export Group Summary"
        >
          <Share2 className="w-4 h-4 text-slate-300" />
        </button>

        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-medium">
          <WifiOff className="w-3 h-3" />
          <span>Offline Math</span>
        </div>
      </div>
    </div>
  );
};
