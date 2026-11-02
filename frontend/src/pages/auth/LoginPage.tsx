import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, alpha,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { loginSchema } from '@bccs/shared';
import { useAuth } from '@/store/authStore';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
      const msg = err?.response?.data?.error?.message ?? 'Invalid credentials. Please try again.';
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
      }}
    >
      {/* Subtle decorative elements */}
      <Box
        sx={{
          position: 'fixed',
          top: -200, right: -200,
          width: 500, height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#C5A572', 0.06)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
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
                width: 64, height: 64, borderRadius: 3,
                background: 'linear-gradient(135deg, #C5A572 0%, #A67D4A 100%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                mb: 2.5,
                boxShadow: '0 8px 24px rgba(197,165,114,0.3)',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0A1628' }}>
                BC
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.3 }}
            >
              Bhagwati Credit
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8rem' }}
            >
              Co-operative Society Ltd.
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
              Banking Management System
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
                  label="Username"
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
                  label="Password"
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
                'Sign In'
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
            Forgot your password? Contact your branch administrator.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
