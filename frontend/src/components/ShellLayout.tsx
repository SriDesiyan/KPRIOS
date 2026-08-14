import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const ShellLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            backgroundColor: 'var(--bg-base)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
