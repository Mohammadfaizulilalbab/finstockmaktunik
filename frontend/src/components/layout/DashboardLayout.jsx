import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] p-2 md:p-6 lg:p-8 flex items-center justify-center">
      {/* App Container */}
      <div className="w-full max-w-[1440px] bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex h-[calc(100vh-16px)] md:h-[calc(100vh-48px)] lg:h-[calc(100vh-64px)] relative">
        
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white lg:ml-64 relative overflow-y-auto">
          {/* Header/Navbar */}
          <Navbar toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

