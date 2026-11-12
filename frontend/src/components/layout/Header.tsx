import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  ListItemIcon, ListItemText, Box, Divider, useMediaQuery, useTheme,
  Stack, Badge, Popover, List, ListItemButton, Button, Tooltip, alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAuth } from '@/store/authStore';
import LanguageToggle from '@/components/common/LanguageToggle';
import {
  getUnreadCount, listNotifications, markNotificationRead, markAllNotificationsRead,
  type Notification,
} from '@/api/notifications';

interface Props {
  title: string;
  onMenuToggle: () => void;
}

function timeAgo(dateStr: string, justNow: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return justNow;
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const notifConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  approval: { icon: <CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />, color: '#D97706', label: 'Approval' },
  alert:    { icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />,  color: '#DC2626', label: 'Alert' },
  info:     { icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />,          color: '#2563EB', label: 'Info' },
};

export default function Header({ title, onMenuToggle }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('header.goodMorning');
    if (h < 17) return t('header.goodAfternoon');
    return t('header.goodEvening');
  })();

  const roleName = user?.role ? (t(`roles.${user.role}`) || user.role.replace(/_/g, ' ')) : '';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notification-count'],
    queryFn: getUnreadCount,
    refetchInterval: 15000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: Boolean(notifAnchor),
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotifClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    setNotifAnchor(null);
    if (n.link) navigate(n.link);
  };

  const initials = user?.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??';

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="no-print"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, sm: 2, md: 2.5 }, minHeight: { xs: 56, sm: 64 } }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuToggle} sx={{ mr: 1.5, color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.95rem' }, lineHeight: 1.3 }}>
            {greeting}, {user?.fullName?.split(' ')[0] ?? 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem', display: 'block' }}>
            {roleName}
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {' '}&middot; {t('common.appName')}
            </Box>
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Language Toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={(e) => setNotifAnchor(e.currentTarget)}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}
            >
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 0.5 }}>
            <Avatar
              sx={{
                width: 32, height: 32,
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Stack>

        {/* Notification Popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5, width: { xs: 'calc(100vw - 32px)', sm: 380 }, maxWidth: 380, maxHeight: 480, borderRadius: 2,
                boxShadow: '0 10px 40px -10px rgba(10,22,40,0.18)',
              },
            },
          }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1.5,
            bgcolor: '#0A1628',
            borderRadius: '8px 8px 0 0',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFF' }}>
                {t('header.notifications')}
              </Typography>
              {unreadCount > 0 && (
                <Box sx={{
                  bgcolor: '#DC2626', color: '#FFF',
                  fontSize: '0.6rem', fontWeight: 700,
                  px: 0.7, py: 0.15, borderRadius: '6px',
                  lineHeight: 1.3, minWidth: 18, textAlign: 'center',
                }}>
                  {unreadCount}
                </Box>
              )}
            </Box>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
                onClick={() => markAll.mutate()}
                sx={{ fontSize: '0.68rem', textTransform: 'none', color: '#C5A572', '&:hover': { bgcolor: alpha('#C5A572', 0.1) } }}
              >
                {t('header.markAllRead')}
              </Button>
            )}
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">{t('header.noNotifications')}</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 380, overflow: 'auto' }}>
              {notifications.map((n) => {
                const cfg = notifConfig[n.type] ?? notifConfig.info!;
                return (
                  <ListItemButton
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    sx={{
                      px: 2, py: 1.5,
                      bgcolor: n.isRead ? 'transparent' : alpha(cfg.color, 0.04),
                      borderBottom: '1px solid', borderColor: 'divider',
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${cfg.color}`,
                      alignItems: 'flex-start',
                      gap: 1.5,
                      transition: 'background-color 0.15s ease',
                      '&:hover': { bgcolor: alpha(cfg.color, 0.06) },
                    }}
                  >
                    {/* Type icon */}
                    <Box sx={{
                      width: 30, height: 30, borderRadius: 1, flexShrink: 0, mt: 0.25,
                      bgcolor: alpha(cfg.color, 0.08),
                      color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {cfg.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.2 }}>
                        <Typography variant="body2" fontWeight={n.isRead ? 500 : 700} noWrap sx={{ fontSize: '0.8125rem' }}>
                          {n.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem', fontWeight: 700,
                            color: cfg.color, bgcolor: alpha(cfg.color, 0.1),
                            px: 0.8, py: 0.2, borderRadius: '4px',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            flexShrink: 0, lineHeight: 1.3,
                          }}
                        >
                          {cfg.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', lineHeight: 1.45, fontSize: '0.75rem',
                      }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.4, display: 'block' }}>
                        {timeAgo(n.createdAt, t('header.justNow'))}
                      </Typography>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Popover>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          onClick={() => setAnchorEl(null)}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5, minWidth: 200, borderRadius: 2,
                boxShadow: '0 10px 25px -5px rgba(10,22,40,0.12)',
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              {user?.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleName}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('auth.profile')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => navigate('/change-password')}>
            <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('auth.changePassword')}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>{t('auth.logout')}</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
