import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Stack,
  alpha,
} from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { getReportDailyCash } from '@/api/statements';
import { formatINR, formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function DailyCashReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['report-daily-cash', date],
    queryFn: () => getReportDailyCash(date),
    enabled: !!date,
  });

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Daily Cash Report</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            size="small" type="date" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: { sm: 200 } }}
          />
        </Stack>
        {isLoading ? <LoadingSpinner /> : data ? (
          <Grid container spacing={2}>
            {[
              ['Date', formatDate(data.date)],
              ['Total Deposits', formatINR(data.totalDepositsPaise)],
              ['Total Withdrawals', formatINR(data.totalWithdrawalsPaise)],
              ['Net Cash', formatINR(data.netCashPaise)],
              ['Transaction Count', String(data.transactionCount)],
            ].map(([label, value]) => (
              <Grid item xs={6} sm={4} key={String(label)}>
                <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                <Typography variant="h6" fontWeight={600}>{String(value)}</Typography>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">Select a date to view the report</Typography>
        )}
      </CardContent>
    </Card>
  );
}

const availableReports = [
  { label: 'Daily Cash Summary', icon: <TrendingUpOutlinedIcon />, color: '#2563EB' },
  { label: 'Monthly Transaction Summary', icon: <AssessmentOutlinedIcon />, color: '#059669' },
  { label: 'Member Growth Report', icon: <PeopleAltOutlinedIcon />, color: '#7C3AED' },
  { label: 'Loan Portfolio Report', icon: <CreditScoreOutlinedIcon />, color: '#D97706' },
  { label: 'Expense Summary', icon: <ReceiptLongOutlinedIcon />, color: '#DC2626' },
  { label: 'Trial Balance', icon: <AccountBalanceOutlinedIcon />, color: '#0891B2' },
  { label: 'General Ledger', icon: <MenuBookOutlinedIcon />, color: '#6D28D9' },
];

export default function ReportsPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Reports</Typography>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={8}>
          <DailyCashReport />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Available Reports</Typography>
              <Stack spacing={1.5}>
                {availableReports.map((report) => (
                  <Card key={report.label} variant="outlined" sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(report.color, 0.3),
                      boxShadow: `0 2px 8px ${alpha(report.color, 0.1)}`,
                    },
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1.5,
                        bgcolor: alpha(report.color, 0.08),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: report.color,
                        '& .MuiSvgIcon-root': { fontSize: 16 },
                        flexShrink: 0,
                      }}>
                        {report.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{report.label}</Typography>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
