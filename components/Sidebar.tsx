import React from 'react';
import { ShieldCheck, Phone, Clock, Wallet, ArrowRightLeft, HeartHandshake, Users } from 'lucide-react';
import { QuickAction } from '../types';

interface SidebarProps {
  actions: QuickAction[];
  onActionClick: (prompt: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ actions, onActionClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet': return <Wallet size={18} />;
      case 'ArrowRightLeft': return <ArrowRightLeft size={18} />;
      case 'HeartHandshake': return <HeartHandshake size={18} />;
      case 'Users': return <Users size={18} />;
      default: return <ShieldCheck size={18} />;
    }
  };

  return (
    <div className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-brand-700 mb-1">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">SecureBank</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium ml-10">Trusted Banking Since 1985</p>
      </div>

      {/* Quick Actions */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick(action.prompt)}
              className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-lg transition-colors duration-200 group"
            >
              <span className="text-slate-400 group-hover:text-brand-500 transition-colors">
                {getIcon(action.icon)}
              </span>
              {action.label}
            </button>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Support Info</h2>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-brand-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">24/7 Support</p>
                <p className="text-xs text-slate-500">1-800-SECURE-BK</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-brand-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Branch Hours</p>
                <p className="text-xs text-slate-500">Mon-Fri: 9AM - 5PM</p>
                <p className="text-xs text-slate-500">Sat: 9AM - 1PM</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-400 text-center leading-tight">
          SecureBank uses AI to assist you. Do not share full SSN or passwords.
          <br/>Member FDIC. Equal Housing Lender.
        </p>
      </div>
    </div>
  );
};
