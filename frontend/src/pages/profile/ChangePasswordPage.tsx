import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Stack, CircularProgress,
} from '@mui/material';
import { useAuth } from '@/store/authStore';
import { changePasswordApi } from '@/api/auth';
import { useSnackbar } from 'notistack';

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      enqueueSnackbar('Password changed. Please log in again.', { variant: 'success' });
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Change Password</Typography>

      <Card sx={{ maxWidth: 440 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                fullWidth
                required
                helperText="Minimum 8 characters"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                fullWidth
                required
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.3 }}
              >
                {loading ? <CircularProgress size={22} /> : 'Change Password'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
