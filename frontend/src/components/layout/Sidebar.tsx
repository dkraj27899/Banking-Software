import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, alpha, useMediaQuery, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import CreditScoreIcon from '@mui/icons-material/CreditScoreOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '@/store/authStore';
import { PERMISSIONS, type PermissionCode } from '@bccs/shared';

const SIDEBAR_WIDTH = 240;

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  permission?: PermissionCode;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/', icon: <DashboardIcon /> },
  { labelKey: 'nav.members', path: '/members', icon: <PeopleIcon /> },
  { labelKey: 'nav.accounts', path: '/accounts', icon: <AccountBalanceIcon /> },
  { labelKey: 'nav.transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
  { labelKey: 'nav.loans', path: '/loans', icon: <CreditScoreIcon /> },
  { labelKey: 'nav.passbook', path: '/passbook', icon: <MenuBookIcon /> },
  { labelKey: 'nav.expenses', path: '/expenses', icon: <PaymentsIcon /> },
  { labelKey: 'nav.reports', path: '/reports', icon: <AssessmentIcon />, permission: PERMISSIONS.REPORT_READ },
  { labelKey: 'nav.staff', path: '/staff', icon: <BadgeIcon />, permission: PERMISSIONS.STAFF_MANAGE },
  { labelKey: 'nav.auditLogs', path: '/audit', icon: <HistoryIcon />, permission: PERMISSIONS.AUDIT_READ },
  { labelKey: 'nav.settings', path: '/settings', icon: <SettingsIcon />, permission: PERMISSIONS.CONFIG_MANAGE },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { user } = useAuth();

  const visibleItems = useMemo(() =>
    navItems.filter((item) =>
      !item.permission || user?.permissions.includes(item.permission)
    ),
    [user],
  );

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#0A1628',
        color: '#FFFFFF',
      }}
    >
      {/* Logo / Society Name */}
      <Box sx={{ px: 2.5, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2,
            background: 'linear-gradient(135deg, #C5A572 0%, #A67D4A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.1rem', color: '#0A1628',
            flexShrink: 0,
          }}
        >
          BC
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ color: '#C5A572', fontWeight: 700, lineHeight: 1.2, fontSize: '0.9rem' }}
            noWrap
          >
            {t('common.appName')}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#FFF', 0.5), fontSize: '0.68rem' }} noWrap>
            {t('common.appSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha('#FFF', 0.08), mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, py: 2, overflowY: 'auto' }}>
        {visibleItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                py: 1.1,
                px: 1.5,
                color: isActive ? '#C5A572' : alpha('#FFF', 0.7),
                bgcolor: isActive ? alpha('#C5A572', 0.1) : 'transparent',
                borderLeft: isActive ? '3px solid #C5A572' : '3px solid transparent',
                '&:hover': {
                  bgcolor: alpha('#FFF', 0.06),
                  color: '#FFFFFF',
                },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 36,
                  '& .MuiSvgIcon-root': { fontSize: 20 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${alpha('#FFF', 0.08)}` }}>
        <Typography variant="caption" sx={{ color: alpha('#FFF', 0.3), fontSize: '0.65rem' }}>
          {t('common.systemVersion')}
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          border: 'none',
          boxShadow: '2px 0 8px rgba(10,22,40,0.08)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };
