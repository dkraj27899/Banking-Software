import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/members': 'Members',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
  '/loans': 'Loans',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/staff': 'Staff Management',
  '/audit': 'Audit Logs',
  '/settings': 'Settings',
  '/unauthorized': 'Access Denied',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? 'Bhagwati Credit';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        <Header title={title} onMenuToggle={() => setSidebarOpen(true)} />

        <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 2.5 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
