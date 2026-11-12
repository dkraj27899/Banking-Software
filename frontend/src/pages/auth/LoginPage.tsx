import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { loginSchema } from '@bccs/shared';
import { useAuth } from '@/store/authStore';
import LanguageToggle from '@/components/common/LanguageToggle';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? t('auth.invalidCredentials');
      setError(msg);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0A1628 0%, #142240 50%, #0A1628 100%)',
        px: 2,
        position: 'relative',
      }}
    >
      {/* Language toggle on login page */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageToggle dark />
      </Box>

      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4)',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 }, pt: { xs: 4, sm: 5 } }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: 1.5,
                bgcolor: '#C5A572',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0A1628' }}>
                BC
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.3 }}
            >
              {t('common.appName')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8rem' }}
            >
              {t('common.appSubtitle')}
            </Typography>
            <Typography
              variant="overline"
              sx={{
                display: 'block', mt: 1.5,
                color: 'secondary.main',
                letterSpacing: '0.12em',
                fontSize: '0.65rem',
              }}
            >
              {t('common.bankingSystem')}
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
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
                  sx={{ mb: 2.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
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
                  sx={{ mb: 3.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                        >
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                bgcolor: '#0A1628',
                '&:hover': { bgcolor: '#1A2940' },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} sx={{ color: '#FFF' }} />
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block', textAlign: 'center', mt: 3,
              color: 'text.disabled', fontSize: '0.72rem',
            }}
          >
            {t('auth.forgotPassword')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
