import {
  Box, Card, CardContent, Typography, Stack, Chip, Avatar, Divider,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/store/authStore';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.5 }}>
      <Box sx={{ color: 'text.disabled', minWidth: 24, display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{value}</Typography>
      </Box>
    </Stack>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isGoogle = user.authProvider === 'google';

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>

      <Card sx={{ maxWidth: 520 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, fontSize: '1.2rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>{user.fullName}</Typography>
              <Chip
                label={user.role.replace(/_/g, ' ')}
                size="small"
                sx={{ textTransform: 'capitalize', mt: 0.5 }}
              />
            </Box>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <InfoRow icon={<PersonOutlineIcon fontSize="small" />} label="Username" value={user.username} />
          <InfoRow icon={<EmailOutlinedIcon fontSize="small" />} label="Email" value={user.email || '—'} />
          <InfoRow icon={<BusinessOutlinedIcon fontSize="small" />} label="Branch" value={user.branchName} />
          <InfoRow icon={<BadgeOutlinedIcon fontSize="small" />} label="Staff ID" value={user.id.slice(0, 8)} />
          <InfoRow
            icon={isGoogle ? <GoogleIcon fontSize="small" /> : <LockOutlinedIcon fontSize="small" />}
            label="Login Method"
            value={isGoogle ? 'Google' : 'Username & Password'}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
