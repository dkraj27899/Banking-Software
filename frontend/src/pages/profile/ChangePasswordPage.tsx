import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Paper, InputAdornment, IconButton, alpha, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '@/store/authStore';
import { changePasswordApi } from '@/api/auth';
import { useSnackbar } from 'notistack';

const NAVY = '#0A1628';
const GOLD = '#C5A572';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 20, label: 'Weak', color: '#DC2626' };
  if (score === 2) return { score: 40, label: 'Fair', color: '#D97706' };
  if (score === 3) return { score: 60, label: 'Good', color: '#2563EB' };
  if (score === 4) return { score: 80, label: 'Strong', color: '#059669' };
  return { score: 100, label: 'Excellent', color: '#059669' };
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {met
        ? <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#059669' }} />
        : <CancelOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      }
      <Typography sx={{ fontSize: '0.75rem', color: met ? '#059669' : 'text.secondary' }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

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
      enqueueSnackbar('Password changed successfully. Please log in again.', { variant: 'success' });
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: NAVY,
        borderWidth: 2,
      },
    },
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
        onClick={() => navigate('/profile')}
        sx={{
          mb: 2, color: 'text.secondary', fontWeight: 500,
          fontSize: '0.8125rem', textTransform: 'none',
          '&:hover': { bgcolor: alpha(NAVY, 0.04) },
        }}
      >
        Back to Profile
      </Button>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header banner */}
        <Box
          sx={{
            px: 3, py: 2.5,
            background: `linear-gradient(135deg, ${NAVY} 0%, #1A2940 100%)`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              bgcolor: alpha(GOLD, 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <SecurityIcon sx={{ color: GOLD, fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Change Password
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: alpha('#fff', 0.5) }}>
              Keep your account secure with a strong password
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
                Current Password
              </Typography>
              <TextField
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                fullWidth
                placeholder="Enter your current password"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small" tabIndex={-1}>
                        {showCurrent ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ width: '100%', height: '1px', bgcolor: 'divider', mb: 3 }} />

            {/* New Password */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
                New Password
              </Typography>
              <TextField
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                fullWidth
                placeholder="Enter a strong new password"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small" tabIndex={-1}>
                        {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Strength */}
              {newPassword.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Password Strength</Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: strength.color }}>{strength.label}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={strength.score}
                    sx={{
                      height: 4, borderRadius: 2,
                      bgcolor: alpha(strength.color, 0.12),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: strength.color,
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.25, columnGap: 2 }}>
                    <Requirement met={newPassword.length >= 8} text="8+ characters" />
                    <Requirement met={/[A-Z]/.test(newPassword)} text="Uppercase letter" />
                    <Requirement met={/[0-9]/.test(newPassword)} text="Number" />
                    <Requirement met={/[^A-Za-z0-9]/.test(newPassword)} text="Special character" />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Confirm Password */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
                Confirm New Password
              </Typography>
              <TextField
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                fullWidth
                placeholder="Re-enter your new password"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {confirmPassword.length > 0 && (
                        passwordsMatch
                          ? <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#059669' }} />
                          : <CancelOutlinedIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                      )}
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small" tabIndex={-1} sx={{ ml: 0.25 }}>
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Typography sx={{ fontSize: '0.72rem', color: '#DC2626', mt: 0.5 }}>
                  Passwords do not match
                </Typography>
              )}
            </Box>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !currentPassword || !newPassword || !passwordsMatch}
              sx={{
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: NAVY,
                '&:hover': { bgcolor: '#1A2940' },
                '&:disabled': { bgcolor: alpha(NAVY, 0.3) },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: '#FFF' }} />
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}
