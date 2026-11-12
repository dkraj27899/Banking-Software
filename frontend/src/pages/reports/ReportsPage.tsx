import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, alpha, Divider, Chip,
} from '@mui/material';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  getReportDailyCash, getMonthlyTransactions, getMemberGrowth,
  getLoanPortfolio, getExpenseSummary, getTrialBalance, getGeneralLedger,
} from '@/api/statements';
import { formatINR, formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', fontVariantNumeric: 'tabular-nums', color: color ?? 'text.primary', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

function DailyCashReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['report-daily-cash', date], queryFn: () => getReportDailyCash(date), enabled: !!date });

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField size="small" type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 200 }} />
      </Stack>
      {isLoading ? <LoadingSpinner /> : data ? (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}><StatCard label="Date" value={formatDate(data.date)} /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Deposits" value={formatINR(data.totalDepositsPaise)} color="#059669" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Withdrawals" value={formatINR(data.totalWithdrawalsPaise)} color="#DC2626" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Net Cash" value={formatINR(data.netCashPaise)} color="#2563EB" /></Grid>
          <Grid item xs={6} sm={3}><StatCard label="Transactions" value={String(data.transactionCount)} /></Grid>
        </Grid>
      ) : <Typography variant="body2" color="text.secondary">Select a date</Typography>}
    </Box>
  );
}

function MonthlyTransactionReport() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data, isLoading } = useQuery({ queryKey: ['report-monthly-txn', month], queryFn: () => getMonthlyTransactions(month), enabled: !!month });

  return (
    <Box>
      <TextField size="small" type="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 200, mb: 3 }} />
      {isLoading ? <LoadingSpinner /> : data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard label="Total Deposits" value={formatINR(data.totalDepositsPaise)} color="#059669" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Total Withdrawals" value={formatINR(data.totalWithdrawalsPaise)} color="#DC2626" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Net Cash" value={formatINR(data.netCashPaise)} color="#2563EB" /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Transactions" value={String(data.totalTransactions)} /></Grid>
          </Grid>
          {data.byType.length > 0 && (
            <>
              <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>By Type</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell>Type</TableCell><TableCell align="right">Count</TableCell><TableCell align="right">Amount</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {data.byType.map((r) => (
                      <TableRow key={r.type}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{r.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell align="right">{r.count}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatINR(r.totalPaise)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      ) : null}
    </Box>
  );
}

function MemberGrowthReport() {
  const { data, isLoading } = useQuery({ queryKey: ['report-member-growth'], queryFn: () => getMemberGrowth(6) });

  return isLoading ? <LoadingSpinner /> : data ? (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard label="Active" value={String(data.totalActive)} color="#059669" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Pending" value={String(data.totalPending)} color="#D97706" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Inactive" value={String(data.totalInactive)} color="#6B7280" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Rejected" value={String(data.totalRejected)} color="#DC2626" /></Grid>
      </Grid>
      {data.byType.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>By Membership Type</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {data.byType.map((r) => <Chip key={r.type} label={`${r.type}: ${r.count}`} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />)}
          </Stack>
        </Box>
      )}
      {data.monthly.length > 0 && (
        <>
          <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>Monthly New Members</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">New Members</TableCell></TableRow></TableHead>
              <TableBody>
                {data.monthly.map((r) => (
                  <TableRow key={r.month}><TableCell>{r.month}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{r.newMembers}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  ) : null;
}

function LoanPortfolioReport() {
  const { data, isLoading } = useQuery({ queryKey: ['report-loan-portfolio'], queryFn: getLoanPortfolio });

  return isLoading ? <LoadingSpinner /> : data ? (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}><StatCard label="Active Loans" value={String(data.activeLoans)} color="#2563EB" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Outstanding" value={formatINR(data.totalOutstandingPaise)} color="#D97706" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Disbursed" value={formatINR(data.totalDisbursedPaise)} color="#059669" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Closed" value={String(data.closedLoans)} color="#6B7280" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Overdue" value={String(data.overdueLoans)} color="#DC2626" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Overdue Amount" value={formatINR(data.totalOverduePaise)} color="#DC2626" /></Grid>
      </Grid>
      {data.byProduct.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Product</TableCell><TableCell align="right">Count</TableCell><TableCell align="right">Principal</TableCell><TableCell align="right">Outstanding</TableCell><TableCell align="right">Avg Rate</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {data.byProduct.map((r) => (
                <TableRow key={r.product}>
                  <TableCell sx={{ fontWeight: 600 }}>{r.product}</TableCell>
                  <TableCell align="right">{r.count}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatINR(r.principalPaise)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatINR(r.outstandingPaise)}</TableCell>
                  <TableCell align="right">{(r.avgRateBps / 100).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  ) : null;
}

function ExpenseSummaryReport() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data, isLoading } = useQuery({ queryKey: ['report-expense', month], queryFn: () => getExpenseSummary(month), enabled: !!month });

  const changePercent = data && data.previousMonthPaise > 0
    ? Math.round(((data.totalPaise - data.previousMonthPaise) / data.previousMonthPaise) * 100) : null;

  return (
    <Box>
      <TextField size="small" type="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 200, mb: 3 }} />
      {isLoading ? <LoadingSpinner /> : data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4}><StatCard label="Total Expenses" value={formatINR(data.totalPaise)} color="#DC2626" /></Grid>
            <Grid item xs={6} sm={4}><StatCard label="Expense Count" value={String(data.totalCount)} /></Grid>
            <Grid item xs={6} sm={4}>
              <StatCard
                label="vs Previous Month"
                value={changePercent != null ? `${changePercent > 0 ? '+' : ''}${changePercent}%` : 'N/A'}
                color={changePercent != null ? (changePercent > 0 ? '#DC2626' : '#059669') : undefined}
              />
            </Grid>
          </Grid>
          {data.byCategory.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Count</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.byCategory.map((r) => (
                    <TableRow key={r.category}>
                      <TableCell sx={{ fontWeight: 600 }}>{r.category}</TableCell>
                      <TableCell align="right">{r.count}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatINR(r.totalPaise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : null}
    </Box>
  );
}

function TrialBalanceReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(today);
  const { data, isLoading } = useQuery({ queryKey: ['report-trial-balance', asOf], queryFn: () => getTrialBalance(asOf), enabled: !!asOf });

  return (
    <Box>
      <TextField size="small" type="date" label="As of Date" value={asOf} onChange={(e) => setAsOf(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 200, mb: 3 }} />
      {isLoading ? <LoadingSpinner /> : data ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={data.isBalanced ? 'Balanced' : 'Unbalanced'}
              size="small"
              sx={{ bgcolor: data.isBalanced ? alpha('#059669', 0.1) : alpha('#DC2626', 0.1), color: data.isBalanced ? '#059669' : '#DC2626', fontWeight: 700 }}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Code</TableCell><TableCell>Account</TableCell><TableCell>Type</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {data.accounts.map((a) => (
                  <TableRow key={a.code}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.code}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{a.name}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{a.type}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{a.debitPaise > 0 ? formatINR(a.debitPaise) : ''}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{a.creditPaise > 0 ? formatINR(a.creditPaise) : ''}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: alpha('#0A1628', 0.03) }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 800 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{formatINR(data.totalDebitPaise)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{formatINR(data.totalCreditPaise)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}
    </Box>
  );
}

function GeneralLedgerReport() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [account, setAccount] = useState('1000');
  const { data, isLoading } = useQuery({ queryKey: ['report-gl', account, month], queryFn: () => getGeneralLedger(account, month), enabled: !!account && !!month });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField size="small" type="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ maxWidth: 200 }} />
        <TextField select size="small" label="Account" value={account} onChange={(e) => setAccount(e.target.value)} sx={{ minWidth: 250 }}>
          {(data?.availableAccounts ?? [{ code: '1000', name: 'Cash' }]).map((a) => (
            <MenuItem key={a.code} value={a.code}>{a.code} — {a.name}</MenuItem>
          ))}
        </TextField>
      </Stack>
      {isLoading ? <LoadingSpinner /> : data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}><StatCard label="Opening Balance" value={formatINR(data.openingBalancePaise)} /></Grid>
            <Grid item xs={6}><StatCard label="Closing Balance" value={formatINR(data.closingBalancePaise)} color="#2563EB" /></Grid>
          </Grid>
          {data.entries.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Date</TableCell><TableCell>Entry #</TableCell><TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell><TableCell align="right">Balance</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {data.entries.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(e.date)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{e.entryNumber}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{e.description}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: e.debitPaise > 0 ? 'error.main' : undefined }}>{e.debitPaise > 0 ? formatINR(e.debitPaise) : ''}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: e.creditPaise > 0 ? 'success.main' : undefined }}>{e.creditPaise > 0 ? formatINR(e.creditPaise) : ''}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(e.balancePaise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Typography variant="body2" color="text.secondary">No journal entries for this period</Typography>}
        </>
      ) : null}
    </Box>
  );
}

const reports = [
  { key: 'daily-cash', label: 'Daily Cash Summary', icon: <TrendingUpOutlinedIcon />, color: '#2563EB', component: DailyCashReport },
  { key: 'monthly-txn', label: 'Monthly Transaction Summary', icon: <AssessmentOutlinedIcon />, color: '#059669', component: MonthlyTransactionReport },
  { key: 'member-growth', label: 'Member Growth Report', icon: <PeopleAltOutlinedIcon />, color: '#7C3AED', component: MemberGrowthReport },
  { key: 'loan-portfolio', label: 'Loan Portfolio Report', icon: <CreditScoreOutlinedIcon />, color: '#D97706', component: LoanPortfolioReport },
  { key: 'expense-summary', label: 'Expense Summary', icon: <ReceiptLongOutlinedIcon />, color: '#DC2626', component: ExpenseSummaryReport },
  { key: 'trial-balance', label: 'Trial Balance', icon: <AccountBalanceOutlinedIcon />, color: '#0891B2', component: TrialBalanceReport },
  { key: 'general-ledger', label: 'General Ledger', icon: <MenuBookOutlinedIcon />, color: '#6D28D9', component: GeneralLedgerReport },
];

export default function ReportsPage() {
  const [active, setActive] = useState<string | null>(null);
  const activeReport = reports.find((r) => r.key === active);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Reports</Typography>

      {activeReport ? (
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box
                onClick={() => setActive(null)}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>{activeReport.label}</Typography>
            </Stack>
            <activeReport.component />
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.key}>
              <Card
                variant="outlined"
                onClick={() => setActive(report.key)}
                sx={{
                  cursor: 'pointer', transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: report.color },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ color: report.color, '& .MuiSvgIcon-root': { fontSize: 20 }, flexShrink: 0 }}>
                      {report.icon}
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{report.label}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
