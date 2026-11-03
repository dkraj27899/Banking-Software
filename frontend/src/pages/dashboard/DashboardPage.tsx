import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box, Grid, Card, CardContent, Typography, alpha, Skeleton, CardActionArea,
} from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { getDashboardStats, type DashboardStats } from '@/api/dashboard';
import { formatINR } from '@/utils/format';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, color, bgColor, loading }: StatCardProps) {
  return (
    <Card sx={{
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: color,
      },
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{
              color: 'text.secondary', mb: 0.75, display: 'block',
              fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.65rem',
            }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={36} />
            ) : (
              <Typography sx={{
                fontWeight: 800, color: 'text.primary',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.2,
              }}>
                {value}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: { xs: 40, sm: 44 }, height: { xs: 40, sm: 44 }, borderRadius: 2.5,
            bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color, flexShrink: 0,
            '& .MuiSvgIcon-root': { fontSize: { xs: 20, sm: 22 } },
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000,
  });

  const stats: StatCardProps[] = [
    {
      icon: <PeopleAltOutlinedIcon />, label: t('dashboard.activeMembers'),
      value: data ? String(data.members.active) : '0',
      color: '#2563EB', bgColor: alpha('#2563EB', 0.08),
    },
    {
      icon: <AccountBalanceOutlinedIcon />, label: t('dashboard.activeAccounts'),
      value: data ? String(data.accounts.active) : '0',
      color: '#059669', bgColor: alpha('#059669', 0.08),
    },
    {
      icon: <TrendingUpOutlinedIcon />, label: t('dashboard.todaysVolume'),
      value: data ? formatINR(data.today.depositsPaise + data.today.withdrawalsPaise) : formatINR(0),
      color: '#7C3AED', bgColor: alpha('#7C3AED', 0.08),
    },
    {
      icon: <PendingActionsOutlinedIcon />, label: t('dashboard.pendingApprovals'),
      value: data ? String(data.pendingAuthorizations.count) : '0',
      color: '#D97706', bgColor: alpha('#D97706', 0.08),
    },
    {
      icon: <CreditScoreOutlinedIcon />, label: t('dashboard.totalDeposits'),
      value: data ? formatINR(data.accounts.totalBalancePaise) : formatINR(0),
      color: '#0891B2', bgColor: alpha('#0891B2', 0.08),
    },
    {
      icon: <WarningAmberOutlinedIcon />, label: t('dashboard.pendingMembers'),
      value: data ? String(data.members.pending) : '0',
      color: '#DC2626', bgColor: alpha('#DC2626', 0.08),
    },
  ];

  const quickActions = [
    { icon: <PersonAddAlt1OutlinedIcon />, label: t('dashboard.newMember'), desc: t('dashboard.registerMember'), path: '/members/new', color: '#2563EB' },
    { icon: <AddCardOutlinedIcon />, label: t('dashboard.newAccount'), desc: t('dashboard.openAccount'), path: '/accounts/new', color: '#059669' },
    { icon: <AddCircleOutlineIcon />, label: t('dashboard.newTransaction'), desc: t('dashboard.depositOrWithdraw'), path: '/transactions/new', color: '#7C3AED' },
    { icon: <AssessmentOutlinedIcon />, label: t('dashboard.viewReports'), desc: t('dashboard.financialReports'), path: '/reports', color: '#D97706' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>{t('dashboard.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={4} key={stat.label}>
            <StatCard {...stat} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>{t('dashboard.quickActions')}</Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {quickActions.map((action) => (
          <Grid item xs={6} sm={3} key={action.label}>
            <Card sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: alpha(action.color, 0.3),
                boxShadow: `0 4px 16px ${alpha(action.color, 0.12)}`,
                transform: 'translateY(-2px)',
              },
            }}>
              <CardActionArea
                onClick={() => navigate(action.path)}
                sx={{ p: { xs: 2, sm: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
              >
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2, mb: 1.5,
                  bgcolor: alpha(action.color, 0.08),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: action.color,
                  '& .MuiSvgIcon-root': { fontSize: 18 },
                }}>
                  {action.icon}
                </Box>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>{action.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {action.desc}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
