import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  InputAdornment, IconButton, alpha, LinearProgress,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useAuth } from '@/store/authStore';
import { setupProfileApi } from '@/api/auth';

const NAVY = '#0A1628';
const NAVY_DEEP = '#060E1A';
const GOLD = '#C5A572';
const GOLD_DARK = '#A67D4A';
const GOLD_LIGHT = '#DDBF89';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 20, label: 'Weak', color: '#f87171' };
  if (score === 2) return { score: 40, label: 'Fair', color: '#D97706' };
  if (score === 3) return { score: 60, label: 'Good', color: '#60a5fa' };
  if (score === 4) return { score: 80, label: 'Strong', color: '#34d399' };
  return { score: 100, label: 'Excellent', color: '#34d399' };
}

export default function SetupProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

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

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.05)',
      borderRadius: 2,
      color: '#E8E6E1',
      '& fieldset': { borderColor: `${GOLD}20` },
      '&:hover fieldset': { borderColor: `${GOLD}40` },
      '&.Mui-focused fieldset': { borderColor: GOLD },
    },
    '& .MuiInputLabel-root': { color: `${GOLD_LIGHT}80` },
    '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
    '& .MuiFormHelperText-root': { color: '#f87171' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(160deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, #1A2940 100%)`,
        px: 2, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background accents */}
      <Box sx={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '50%', height: '70%',
        background: `radial-gradient(ellipse, ${GOLD}08 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <Box
        sx={{
          width: '100%', maxWidth: 460, position: 'relative',
        }}
      >
        {/* Glow */}
        <Box
          sx={{
            position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08, transparent)`,
            filter: 'blur(1px)', zIndex: 0,
          }}
        />

        <Box
          sx={{
            position: 'relative', zIndex: 1,
            bgcolor: `${NAVY}E6`,
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: `1px solid ${GOLD}15`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{ px: 4, pt: 4, pb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: 2.5,
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                mb: 2.5,
                boxShadow: `0 12px 40px ${GOLD}25`,
              }}
            >
              <AccountBalanceIcon sx={{ color: NAVY, fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>
              Complete Your Profile
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: `${GOLD_LIGHT}80` }}>
              Signed in as <Box component="span" sx={{ color: GOLD, fontWeight: 600 }}>{user?.email}</Box>
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ px: 4, pb: 4 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5, borderRadius: 2,
                  bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                  '& .MuiAlert-icon': { color: '#f87171' },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                fullWidth
                required
                autoFocus
                sx={{ mb: 2.5, ...inputSx }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ fontSize: 20, color: `${GOLD}60` }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Set Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                required
                sx={{ mb: 1, ...inputSx }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: `${GOLD}60` }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" tabIndex={-1} sx={{ color: `${GOLD}50` }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {password.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Strength</Typography>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: strength.color }}>{strength.label}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={strength.score}
                    sx={{
                      height: 3, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      '& .MuiLinearProgress-bar': { bgcolor: strength.color, borderRadius: 2 },
                    }}
                  />
                </Box>
              )}

              <TextField
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3, ...inputSx }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: `${GOLD}60` }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {confirmPassword.length > 0 && (
                        passwordsMatch
                          ? <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#34d399' }} />
                          : <CancelOutlinedIcon sx={{ fontSize: 20, color: '#f87171' }} />
                      )}
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small" tabIndex={-1} sx={{ ml: 0.25, color: `${GOLD}50` }}>
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !fullName.trim() || !password || !passwordsMatch}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                  color: NAVY,
                  boxShadow: `0 8px 32px ${GOLD}25`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                  },
                  '&:disabled': {
                    background: `${GOLD}30`,
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: NAVY }} /> : 'Complete Setup & Login'}
              </Button>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
