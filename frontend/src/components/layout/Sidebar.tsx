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

const SIDEBAR_WIDTH = 220;

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  permission?: PermissionCode;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/', icon: <DashboardIcon /> },
  { labelKey: 'nav.members', path: '/members', icon: <PeopleIcon />, permission: PERMISSIONS.MEMBER_READ },
  { labelKey: 'nav.accounts', path: '/accounts', icon: <AccountBalanceIcon />, permission: PERMISSIONS.ACCOUNT_READ },
  { labelKey: 'nav.transactions', path: '/transactions', icon: <ReceiptLongIcon />, permission: PERMISSIONS.TRANSACTION_READ },
  { labelKey: 'nav.loans', path: '/loans', icon: <CreditScoreIcon />, permission: PERMISSIONS.LOAN_READ },
  { labelKey: 'nav.passbook', path: '/passbook', icon: <MenuBookIcon />, permission: PERMISSIONS.TRANSACTION_READ },
  { labelKey: 'nav.expenses', path: '/expenses', icon: <PaymentsIcon />, permission: PERMISSIONS.EXPENSE_READ },
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
    navItems.filter((item) => !item.permission || user?.permissions.includes(item.permission)),
    [user],
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0A1628', color: '#FFFFFF' }}>
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 1, bgcolor: '#C5A572',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.8rem', color: '#0A1628', flexShrink: 0,
        }}>
          BC
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ color: '#FFFFFF', fontWeight: 600, lineHeight: 1.2, fontSize: '0.8125rem' }}>
            {t('common.appName')}
          </Typography>
          <Typography noWrap sx={{ color: alpha('#FFF', 0.45), fontSize: '0.65rem' }}>
            {t('common.appSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha('#FFF', 0.08), mx: 1.5 }} />

      <List sx={{ flex: 1, px: 1, py: 1, overflowY: 'auto' }}>
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
                mb: 0.25,
                borderRadius: 1,
                py: 0.85,
                px: 1.5,
                color: isActive ? '#FFFFFF' : alpha('#FFF', 0.6),
                bgcolor: isActive ? alpha('#FFFFFF', 0.08) : 'transparent',
                '&:hover': { bgcolor: alpha('#FFF', 0.06), color: '#FFFFFF' },
                transition: 'all 0.1s ease',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 32, '& .MuiSvgIcon-root': { fontSize: 18 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${alpha('#FFF', 0.06)}` }}>
        <Typography sx={{ color: alpha('#FFF', 0.25), fontSize: '0.6rem' }}>
          {t('common.systemVersion')}
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary" open={open} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none' } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };
