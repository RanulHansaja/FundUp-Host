import React, { useState } from 'react';
import Sidebar from './component/sidebar';
import AdminProfileSettingsCard from './component/admin_setting_page_components/AdminProfileSettingsCard';

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = { name: 'Admin User', role: 'admin', email: 'admin@fundup.com' };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="settings"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
          {/* ── HEADER ── */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
              Admin Settings
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Manage administrator profile and system preferences.
            </p>
          </div>

          <div className="w-full">
            <AdminProfileSettingsCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
