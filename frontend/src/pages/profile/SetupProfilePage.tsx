import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Stack, CircularProgress,
} from '@mui/material';
import { useAuth } from '@/store/authStore';
import { setupProfileApi } from '@/api/auth';

export default function SetupProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await setupProfileApi(fullName.trim(), password);
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #0A1628 0%, #142240 50%, #0A1628 100%)', px: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 460, boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 1.5, bgcolor: '#C5A572',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2,
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0A1628' }}>BC</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Welcome! Complete Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Signed in as {user?.email}. Set your name and password to continue.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="Set Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                required
                helperText="Minimum 8 characters. Use this to log in without Google."
              />
              <TextField
                label="Confirm Password"
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
                sx={{ py: 1.4, bgcolor: '#0A1628', '&:hover': { bgcolor: '#1A2940' } }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#FFF' }} /> : 'Complete Setup & Login'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
