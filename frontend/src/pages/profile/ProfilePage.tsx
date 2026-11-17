import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Divider, Button, Paper, alpha,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useAuth } from '@/store/authStore';

const NAVY = '#0A1628';
const GOLD = '#C5A572';
const GOLD_DARK = '#A67D4A';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75, px: 2.5 }}>
      <Box
        sx={{
          width: 40, height: 40, borderRadius: 2,
          bgcolor: alpha(GOLD, 0.08),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: GOLD_DARK, flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mt: 0.15 }} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isGoogle = user.authProvider === 'google';
  const roleLabel = user.role.replace(/_/g, ' ');

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Profile Header Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Banner */}
        <Box
          sx={{
            height: 120,
            background: `linear-gradient(135deg, ${NAVY} 0%, #1A2940 60%, ${NAVY} 100%)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute', top: -30, right: -30,
              width: 160, height: 160, borderRadius: '50%',
              border: `1px solid ${alpha(GOLD, 0.1)}`,
            }}
          />
          <Box
            sx={{
              position: 'absolute', bottom: -20, left: 40,
              width: 100, height: 100, borderRadius: '50%',
              border: `1px solid ${alpha(GOLD, 0.06)}`,
            }}
          />
          <AccountBalanceIcon
            sx={{
              position: 'absolute', right: 24, top: 20,
              fontSize: 36, color: alpha(GOLD, 0.1),
            }}
          />
        </Box>

        {/* Avatar + Name */}
        <Box sx={{ px: 3, mt: -5, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 80, height: 80,
                fontSize: '1.5rem', fontWeight: 800,
                bgcolor: GOLD,
                color: NAVY,
                border: '4px solid #fff',
                boxShadow: `0 4px 14px ${alpha(NAVY, 0.2)}`,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, pb: 0.5 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                {user.fullName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                <Chip
                  label={roleLabel}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    bgcolor: alpha(NAVY, 0.08),
                    color: NAVY,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
                {isGoogle && (
                  <Chip
                    icon={<GoogleIcon sx={{ fontSize: '14px !important' }} />}
                    label="Google"
                    size="small"
                    sx={{
                      bgcolor: alpha('#4285F4', 0.08),
                      color: '#4285F4',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 0.5 }} />

          {/* Info rows */}
          <InfoRow icon={<PersonOutlineIcon sx={{ fontSize: 20 }} />} label="Username" value={user.username} />
          <InfoRow icon={<EmailOutlinedIcon sx={{ fontSize: 20 }} />} label="Email Address" value={user.email || 'Not set'} />
          <InfoRow icon={<BusinessOutlinedIcon sx={{ fontSize: 20 }} />} label="Branch" value={user.branchName} />
          <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />} label="Staff ID" value={user.id.slice(0, 8).toUpperCase()} />
          <InfoRow
            icon={isGoogle ? <GoogleIcon sx={{ fontSize: 20 }} /> : <LockOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Authentication"
            value={isGoogle ? 'Google Account' : 'Username & Password'}
          />
        </Box>
      </Paper>

      {/* Action Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
        <Paper
          elevation={0}
          onClick={() => navigate('/change-password')}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: GOLD,
              boxShadow: `0 4px 20px ${alpha(GOLD, 0.1)}`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              background: `linear-gradient(135deg, ${NAVY} 0%, #1A2940 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <SecurityIcon sx={{ color: GOLD, fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
            Change Password
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
            Update your login credentials
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            opacity: 0.6,
          }}
        >
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: alpha(NAVY, 0.06),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <ShieldOutlinedIcon sx={{ color: NAVY, fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
            Permissions
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
            {user.permissions.length} active permissions
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
