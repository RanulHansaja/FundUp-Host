import React, { useState } from 'react';
import Sidebar from './component/sideBar';
import ProfileSettingsCard from './component/donor_setting_page_components/ProfileSettingsCard';

const ProfileSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="settings"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-8 mx-auto p-6 md:p-10 md:pt-4 max-w-7xl">
          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="space-y-1 text-left">
              <h1 className="font-extrabold text-slate-900 text-3xl md:text-4xl tracking-tight">
                Profile Settings
              </h1>
              <p className="font-semibold text-slate-500 text-sm">
                Manage your university presence, security preferences, and fundraising notifications.
              </p>
            </div>
          </div>

          <div className="w-full">
            <ProfileSettingsCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
