import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Stack,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Divider, Breadcrumbs, Link, InputAdornment, useMediaQuery, useTheme,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useSnackbar } from 'notistack';
import { getLoan, recordRepayment } from '@/api/loans';
import { formatINR, formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const scheduleStatusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  upcoming: 'default',
  due: 'warning',
  overdue: 'error',
  partial: 'info',
  paid: 'success',
};

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [payDialog, setPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getLoan(id!),
    enabled: !!id,
  });

  const repayMutation = useMutation({
    mutationFn: (amountPaise: number) => recordRepayment(id!, amountPaise),
    onSuccess: () => {
      enqueueSnackbar('Repayment recorded', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      setPayDialog(false);
      setPayAmount('');
    },
    onError: (err: any) => {
      enqueueSnackbar(err.response?.data?.error?.message ?? 'Repayment failed', { variant: 'error' });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!loan) return <Typography>Loan not found</Typography>;

  const loanData = loan as any;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/loans" onClick={(e) => { e.preventDefault(); navigate('/loans'); }} sx={{ fontSize: '0.8125rem' }}>
          Loans
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {loanData.loan_number}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>Loan {loanData.loan_number}</Typography>
          <Chip label={loanData.status} color={loanData.status === 'active' ? 'success' : 'default'} size="small" sx={{ mt: 0.5 }} />
        </Box>
        {loanData.status === 'active' && (
          <Button variant="contained"
            onClick={() => { setPayDialog(true); setPayAmount(String(Number(loanData.emi_paise) / 100)); }}
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            Record Repayment
          </Button>
        )}
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Member</Typography>
              <Typography fontWeight={600}>{loanData.member_name}</Typography>
              <Typography variant="body2" color="text.secondary">{loanData.membership_number}</Typography>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Product</Typography>
              <Typography fontWeight={600}>{loanData.product_name}</Typography>
              <Typography variant="body2" color="text.secondary">{loanData.product_code}</Typography>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Account</Typography>
              <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>{loanData.account_number}</Typography>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Disbursed On</Typography>
              <Typography fontWeight={600}>{formatDate(loanData.disbursed_at)}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Principal</Typography>
              <Typography fontWeight={700} color="primary">{formatINR(Number(loanData.principal_paise))}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Outstanding</Typography>
              <Typography fontWeight={700} color="error.main">{formatINR(Number(loanData.outstanding_principal_paise))}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">EMI</Typography>
              <Typography fontWeight={700}>{formatINR(Number(loanData.emi_paise))}</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Interest Rate</Typography>
              <Typography fontWeight={700}>{(loanData.interest_rate_bps / 100).toFixed(2)}%</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Tenure</Typography>
              <Typography fontWeight={700}>{loanData.tenure_months} months</Typography>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="caption" color="text.secondary">Next Due</Typography>
              <Typography fontWeight={700}>{formatDate(loanData.next_due_date)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Repayment Schedule</Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: isMobile ? 550 : 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Principal</TableCell>
                  <TableCell align="right">Interest</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Paid</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loanData.schedule?.map((item: any) => (
                  <TableRow key={item.installment_number}>
                    <TableCell>{item.installment_number}</TableCell>
                    <TableCell>{formatDate(item.due_date)}</TableCell>
                    <TableCell align="right">{formatINR(Number(item.principal_paise))}</TableCell>
                    <TableCell align="right">{formatINR(Number(item.interest_paise))}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(Number(item.total_paise))}</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatINR(Number(item.paid_paise))}</TableCell>
                    <TableCell><Chip label={item.status} size="small" color={scheduleStatusColors[item.status] ?? 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {loanData.repayments?.length > 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Repayment History</Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 450 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Principal</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Interest</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Received By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanData.repayments.map((rep: any) => (
                    <TableRow key={rep.id}>
                      <TableCell>{formatDate(rep.created_at)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(Number(rep.amount_paise))}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatINR(Number(rep.principal_component_paise))}</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatINR(Number(rep.interest_component_paise))}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{rep.received_by_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Repayment</DialogTitle>
        <DialogContent>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={repayMutation.isPending || !payAmount}
            onClick={() => repayMutation.mutate(Math.round(parseFloat(payAmount) * 100))}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
