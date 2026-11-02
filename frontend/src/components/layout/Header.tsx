import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  ListItemIcon, ListItemText, Box, Divider, useMediaQuery, useTheme,
  Stack, Badge, Popover, List, ListItemButton, Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleIcon from '@mui/icons-material/Circle';
import { useAuth } from '@/store/authStore';
import {
  getUnreadCount, listNotifications, markNotificationRead, markAllNotificationsRead,
  type Notification,
} from '@/api/notifications';

interface Props {
  title: string;
  onMenuToggle: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Header({ title, onMenuToggle }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

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
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.95rem' }, lineHeight: 1.3 }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0] ?? 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
            {user?.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} &middot; Bhagwati Credit Co-operative Society
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5}>
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
                width: 34, height: 34,
                bgcolor: 'secondary.main',
                color: 'primary.main',
                fontSize: '0.75rem',
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
                mt: 1.5, width: 380, maxHeight: 480, borderRadius: 2,
                boxShadow: '0 10px 40px -10px rgba(10,22,40,0.18)',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                onClick={() => markAll.mutate()}
                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 380, overflow: 'auto' }}>
              {notifications.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  sx={{
                    px: 2, py: 1.5,
                    bgcolor: n.isRead ? 'transparent' : 'action.hover',
                    borderBottom: '1px solid', borderColor: 'divider',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                      {!n.isRead && <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />}
                      <Typography variant="body2" fontWeight={n.isRead ? 400 : 600} noWrap>
                        {n.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', lineHeight: 1.4,
                    }}>
                      {n.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </Box>
                </ListItemButton>
              ))}
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
              {user?.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => navigate('/change-password')}>
            <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Change Password</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
