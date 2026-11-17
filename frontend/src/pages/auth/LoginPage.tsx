import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Divider,
  keyframes,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShieldIcon from '@mui/icons-material/Shield';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { loginSchema } from '@bccs/shared';
import { useAuth } from '@/store/authStore';
import LanguageToggle from '@/components/common/LanguageToggle';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

const NAVY = '#0A1628';
const NAVY_LIGHT = '#1A2940';
const NAVY_DEEP = '#060E1A';
const GOLD = '#C5A572';
const GOLD_LIGHT = '#DDBF89';
const GOLD_DARK = '#A67D4A';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(-3deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

function FloatingIcon({ icon, top, left, right, size, delay, reverse }: {
  icon: React.ReactNode; top?: string; left?: string; right?: string;
  size: number; delay: number; reverse?: boolean;
}) {
  return (
    <Box
      sx={{
        position: 'absolute', top, left, right,
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: `${reverse ? floatReverse : float} ${4 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.12,
        color: GOLD,
      }}
    >
      {icon}
    </Box>
  );
}

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
      bgcolor: 'rgba(255,255,255,0.05)',
      borderRadius: 2,
      color: '#E8E6E1',
      '& fieldset': { borderColor: 'rgba(197,165,114,0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(197,165,114,0.35)' },
      '&.Mui-focused fieldset': { borderColor: GOLD },
    },
    '& .MuiInputLabel-root': { color: 'rgba(221,191,137,0.5)' },
    '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
    '& .MuiFormHelperText-root': { color: '#f87171' },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: NAVY_DEEP,
      }}
    >
      {/* Language toggle */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageToggle dark />
      </Box>

      {/* Left side — branding with animated graphics */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: `linear-gradient(160deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_LIGHT} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Animated background circles */}
        <Box
          sx={{
            position: 'absolute', top: '10%', left: '10%',
            width: 300, height: 300, borderRadius: '50%',
            border: `1px solid ${GOLD}10`,
            animation: `${pulse} 6s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: '5%', right: '5%',
            width: 400, height: 400, borderRadius: '50%',
            border: `1px solid ${GOLD}08`,
            animation: `${pulse} 8s ease-in-out infinite`,
            animationDelay: '2s',
          }}
        />
        <Box
          sx={{
            position: 'absolute', top: '40%', right: '15%',
            width: 200, height: 200, borderRadius: '50%',
            border: `1px solid ${GOLD}0D`,
            animation: `${pulse} 5s ease-in-out infinite`,
            animationDelay: '1s',
          }}
        />

        {/* Floating banking icons */}
        <FloatingIcon icon={<CreditCardIcon sx={{ fontSize: 48 }} />} top="12%" left="15%" size={60} delay={0} />
        <FloatingIcon icon={<SavingsIcon sx={{ fontSize: 44 }} />} top="20%" right="18%" size={56} delay={1.5} reverse />
        <FloatingIcon icon={<TrendingUpIcon sx={{ fontSize: 40 }} />} top="65%" left="12%" size={52} delay={0.8} />
        <FloatingIcon icon={<ShieldIcon sx={{ fontSize: 42 }} />} top="70%" right="15%" size={54} delay={2} reverse />
        <FloatingIcon icon={<AccountBalanceIcon sx={{ fontSize: 36 }} />} top="45%" left="8%" size={48} delay={1.2} />

        {/* Decorative gold line */}
        <Box
          sx={{
            position: 'absolute',
            right: 0, top: '15%', bottom: '15%',
            width: '1px',
            background: `linear-gradient(180deg, transparent, ${GOLD}40, transparent)`,
          }}
        />

        {/* Main logo */}
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', animation: `${fadeInUp} 0.8s ease-out` }}>
          <Box
            sx={{
              width: 88, height: 88, borderRadius: 3,
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 4,
              boxShadow: `0 20px 60px rgba(197,165,114,0.25)`,
            }}
          >
            <AccountBalanceIcon sx={{ color: NAVY, fontSize: 44 }} />
          </Box>

          <Typography
            sx={{
              fontSize: '2.5rem', fontWeight: 800, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}
          >
            {t('common.appName')}
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem', color: GOLD_LIGHT,
              mt: 0.5, fontWeight: 300,
            }}
          >
            {t('common.appSubtitle')}
          </Typography>

          {/* Shimmer badge */}
          <Box
            sx={{
              mt: 3, px: 3, py: 0.75, display: 'inline-block',
              border: `1px solid ${GOLD}30`,
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: `linear-gradient(90deg, transparent 0%, ${GOLD}10 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
                animation: `${shimmer} 3s ease-in-out infinite`,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem', color: GOLD,
                letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
                position: 'relative', zIndex: 1,
              }}
            >
              Secure Banking Platform
            </Typography>
          </Box>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: <ShieldIcon sx={{ fontSize: 14 }} />, text: 'Secure' },
              { icon: <TrendingUpIcon sx={{ fontSize: 14 }} />, text: 'Reliable' },
              { icon: <SavingsIcon sx={{ fontSize: 14 }} />, text: 'Trusted' },
            ].map((item) => (
              <Box
                key={item.text}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.5,
                  borderRadius: 5,
                  bgcolor: `${GOLD}0A`,
                  border: `1px solid ${GOLD}15`,
                  color: GOLD_LIGHT,
                  fontSize: '0.72rem', fontWeight: 500,
                }}
              >
                {item.icon}
                {item.text}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right side — login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 5 },
          background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
          position: 'relative',
        }}
      >
        {/* Subtle background pattern for right side */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(${GOLD}06 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            position: 'relative',
            animation: `${fadeInUp} 0.8s ease-out`,
            animationDelay: '0.2s',
            animationFillMode: 'both',
          }}
        >
          {/* Card glow */}
          <Box
            sx={{
              position: 'absolute',
              top: -1, left: -1, right: -1, bottom: -1,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${GOLD}25, ${GOLD}08, transparent)`,
              filter: 'blur(1px)',
              zIndex: 0,
            }}
          />

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              bgcolor: `${NAVY}E6`,
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: `1px solid ${GOLD}15`,
              p: { xs: 3.5, sm: 5 },
            }}
          >
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: 2,
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 1,
                }}
              >
                <AccountBalanceIcon sx={{ color: NAVY, fontSize: 24 }} />
              </Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                {t('common.appName')}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 700, color: '#fff', mb: 0.5,
              }}
            >
              {t('common.welcome')}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: GOLD_LIGHT, opacity: 0.6, mb: 3.5 }}>
              Sign in to manage your banking operations
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
                            sx={{ color: 'rgba(197,165,114,0.4)' }}
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
                    fontSize: '0.8rem', color: GOLD,
                    cursor: 'pointer', opacity: 0.7,
                    '&:hover': { opacity: 1 },
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
                  background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                  color: NAVY,
                  boxShadow: `0 8px 32px rgba(197,165,114,0.25)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                    boxShadow: `0 12px 40px rgba(197,165,114,0.35)`,
                  },
                  '&:disabled': {
                    background: `rgba(197,165,114,0.3)`,
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} sx={{ color: NAVY }} />
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

            <Divider
              sx={{
                my: 3,
                fontSize: '0.75rem',
                color: 'rgba(197,165,114,0.3)',
                '&::before, &::after': { borderColor: `${GOLD}15` },
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
              startIcon={googleLoading ? <CircularProgress size={18} sx={{ color: 'rgba(197,165,114,0.5)' }} /> : <GoogleIcon />}
              sx={{
                py: 1.4,
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                borderRadius: 2,
                borderColor: `${GOLD}25`,
                color: 'rgba(255,255,255,0.75)',
                '&:hover': {
                  borderColor: `${GOLD}50`,
                  bgcolor: `${GOLD}08`,
                },
              }}
            >
              Sign in with Google
            </Button>

            <Typography
              sx={{
                textAlign: 'center', mt: 3.5,
                fontSize: '0.72rem', color: `${GOLD}40`,
                letterSpacing: '0.08em',
              }}
            >
              {t('common.systemVersion')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
