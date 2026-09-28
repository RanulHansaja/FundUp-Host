import React, { useState } from 'react';
import Sidebar from './component/sidebar';
import OrganizerProfileSettingsCard from './component/organizer_setting_page_components/OrganizerProfileSettingsCard';

// ==================== Organizer Settings Page Wrapper ====================
const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-slate-800 antialiased">
      <Sidebar
        activeTab="settings"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 pb-20 overflow-x-hidden">
        <div className="space-y-8 mx-auto p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl">
          {/* Header */}
          <div className="space-y-1 text-left">
            <h1 className="font-extrabold text-slate-900 text-2xl sm:text-3xl md:text-4xl tracking-tight">
              Organizer Settings
            </h1>
            <p className="font-semibold text-slate-400 text-xs md:text-sm">
              Manage organizer information, university affiliation, and account security.
            </p>
          </div>

          <div className="w-full">
            <OrganizerProfileSettingsCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
