import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { loginSchema } from '@bccs/shared';
import { useAuth } from '@/store/authStore';
import LanguageToggle from '@/components/common/LanguageToggle';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const {
    control, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const user = await login(data.username, data.password);
      navigate(user.mustSetupPassword ? '/setup-profile' : from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? t('auth.invalidCredentials');
      setError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const user = await googleLogin(idToken);
      navigate(user.mustSetupPassword ? '/setup-profile' : from, { replace: true });
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err?.code === 'auth/popup-closed-by-user') return;
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Google login failed';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.06)',
      borderRadius: 2,
      color: '#fff',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
      '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
    '& .MuiFormHelperText-root': { color: '#f87171' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#0a0a0f',
      }}
    >
      {/* Background gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%', right: '-10%',
          width: '60%', height: '80%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-30%', left: '-10%',
          width: '50%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Language toggle */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageToggle dark />
      </Box>

      {/* Left side — branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: 80, height: 80, borderRadius: 3,
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 4,
            boxShadow: '0 20px 60px rgba(124,58,237,0.3)',
          }}
        >
          <AccountBalanceIcon sx={{ color: '#fff', fontSize: 40 }} />
        </Box>
        <Typography
          sx={{
            fontSize: '2.5rem', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}
        >
          BCCS
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)',
            mt: 1, letterSpacing: '0.15em', textTransform: 'uppercase',
          }}
        >
          Banking Management
        </Typography>
      </Box>

      {/* Right side — login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 5 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            position: 'relative',
          }}
        >
          {/* Card glow effect */}
          <Box
            sx={{
              position: 'absolute',
              top: -1, left: -1, right: -1, bottom: -1,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(79,70,229,0.1), transparent)',
              filter: 'blur(1px)',
              zIndex: 0,
            }}
          />

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              bgcolor: 'rgba(15,15,25,0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
              p: { xs: 3.5, sm: 5 },
            }}
          >
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: 2,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <AccountBalanceIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 700, color: '#fff', mb: 0.5,
              }}
            >
              {t('common.welcome')}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', mb: 3.5 }}>
              {t('common.appSubtitle')}
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5, borderRadius: 2,
                  bgcolor: 'rgba(239,68,68,0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                  '& .MuiAlert-icon': { color: '#f87171' },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('auth.username')}
                    autoComplete="username"
                    autoFocus
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    sx={{ mb: 2.5, ...inputSx }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ mb: 1, ...inputSx }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            tabIndex={-1}
                            sx={{ color: 'rgba(255,255,255,0.4)' }}
                          >
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: '0.8rem', color: '#a78bfa',
                    cursor: 'pointer',
                    '&:hover': { color: '#c4b5fd' },
                  }}
                >
                  {t('auth.forgotPassword')}
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.6,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)',
                    boxShadow: '0 12px 40px rgba(124,58,237,0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(124,58,237,0.3)',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} sx={{ color: '#FFF' }} />
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            <Divider
              sx={{
                my: 3,
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.25)',
                '&::before, &::after': { borderColor: 'rgba(255,255,255,0.08)' },
              }}
            >
              OR
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              startIcon={googleLoading ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.5)' }} /> : <GoogleIcon />}
              sx={{
                py: 1.4,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                borderRadius: 2,
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.25)',
                  bgcolor: 'rgba(255,255,255,0.04)',
                },
              }}
            >
              Sign in with Google
            </Button>

            <Typography
              sx={{
                textAlign: 'center', mt: 3.5,
                fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)',
              }}
            >
              {t('common.bankingSystem')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
