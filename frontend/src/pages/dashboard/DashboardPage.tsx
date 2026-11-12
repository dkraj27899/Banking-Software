import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box, Grid, Typography, Skeleton, ButtonBase, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getDashboardStats } from '@/api/dashboard';
import { formatINR, formatDate } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';

const MEMBERSHIP_FEE_PAISE = 10000;

function paise2Lakh(p: number) {
  return +(p / 10000000).toFixed(2);
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000,
  });

  const depositBalance = data
    ? data.depositBreakdown
        .filter((d) => d.productType !== 'share_capital')
        .reduce((sum, d) => sum + d.balancePaise, 0)
    : 0;

  const membershipFeesCollected = data
    ? data.members.active * MEMBERSHIP_FEE_PAISE
    : 0;

  const cashFlowData = (data?.dailyCashFlow ?? []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    Deposits: paise2Lakh(d.depositsPaise),
    Withdrawals: paise2Lakh(d.withdrawalsPaise),
  }));

  const memberGrowthData = (data?.memberGrowth ?? []).map((d) => ({
    month: new Date(d.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    'New Members': d.newMembers,
  }));

  const actions = [
    { label: t('dashboard.newMember'), path: '/members/new' },
    { label: t('dashboard.newAccount'), path: '/accounts/new' },
    { label: t('dashboard.newTransaction'), path: '/transactions/new' },
    { label: t('dashboard.viewReports'), path: '/reports' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2.5 }}>{t('dashboard.title')}</Typography>

      {/* Top stats row */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label={t('dashboard.activeMembers')} value={data ? String(data.members.active) : '—'} loading={isLoading} onClick={() => navigate('/members')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label={t('dashboard.activeAccounts')} value={data ? String(data.accounts.active) : '—'} loading={isLoading} onClick={() => navigate('/accounts')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label={t('dashboard.todaysVolume')} value={data ? formatINR(data.today.depositsPaise + data.today.withdrawalsPaise) : '—'} loading={isLoading} onClick={() => navigate('/transactions')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label={t('dashboard.pendingApprovals')} value={data ? String(data.pendingAuthorizations.count) : '—'} loading={isLoading} warn={data ? data.pendingAuthorizations.count > 0 : false} onClick={() => navigate('/transactions')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label={t('dashboard.pendingMembers')} value={data ? String(data.members.pending) : '—'} loading={isLoading} warn={data ? data.members.pending > 0 : false} onClick={() => navigate('/members')} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatTile label="Today Txns" value={data ? String(data.today.transactionCount) : '—'} loading={isLoading} onClick={() => navigate('/transactions')} />
        </Grid>
      </Grid>

      {/* Balance cards row */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Deposit Balance
              </Typography>
              {isLoading ? <Skeleton width={120} height={28} /> : (
                <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', fontVariantNumeric: 'tabular-nums', color: '#059669', lineHeight: 1.3, mt: 0.25 }}>
                  {formatINR(depositBalance)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Membership Fees Collected
              </Typography>
              {isLoading ? <Skeleton width={80} height={28} /> : (
                <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', fontVariantNumeric: 'tabular-nums', color: '#C5A572', lineHeight: 1.3, mt: 0.25 }}>
                  {formatINR(membershipFeesCollected)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
                Daily Cash Flow (₹ Lakh)
              </Typography>
              {isLoading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlowData} barGap={2} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(v) => [`₹${v}L`]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar dataKey="Deposits" fill="#059669" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Withdrawals" fill="#DC2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
                Member Growth
              </Typography>
              {isLoading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={memberGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="New Members" stroke="#0A1628" strokeWidth={2} dot={{ r: 4, fill: '#0A1628' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent transactions + Quick actions */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                Recent Transactions
              </Typography>
              {isLoading ? <Skeleton variant="rectangular" height={200} /> : !data?.recentTransactions.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No transactions yet</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentTransactions.slice(0, 8).map((txn) => (
                        <TableRow key={txn.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/transactions')}>
                          <TableCell sx={{ fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.memberName}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>{txn.transactionType.replace(/_/g, ' ')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatINR(txn.amountPaise)}</TableCell>
                          <TableCell><StatusChip status={txn.status} /></TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: '0.75rem' }}>{formatDate(txn.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {actions.map((a) => (
                  <ButtonBase
                    key={a.label}
                    onClick={() => navigate(a.path)}
                    sx={{
                      px: 2, py: 1.25, borderRadius: 1,
                      border: '1px solid', borderColor: 'divider',
                      bgcolor: 'background.paper',
                      fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%',
                      '&:hover': { bgcolor: '#F9FAFB', borderColor: '#C5A572' },
                    }}
                  >
                    {a.label}
                    <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  </ButtonBase>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function StatTile({ label, value, loading, warn, onClick }: { label: string; value: string; loading: boolean; warn?: boolean; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'block', width: '100%', textAlign: 'left',
        p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        '&:hover': { bgcolor: '#F9FAFB' },
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={60} height={24} />
      ) : (
        <Typography sx={{
          fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          color: warn ? 'warning.main' : 'text.primary',
        }}>
          {value}
        </Typography>
      )}
    </ButtonBase>
  );
}
