import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Alert, Breadcrumbs, Link, alpha, InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { useSnackbar } from 'notistack';
import { createTransaction } from '@/api/transactions';
import { getAccountByNumber, type Account } from '@/api/accounts';
import { formatINR, rupeesToPaise } from '@/utils/format';
import { TRANSACTION_TYPE, PAYMENT_METHOD } from '@bccs/shared';

const depositTypes = [TRANSACTION_TYPE.CASH_DEPOSIT];
const withdrawalTypes = [TRANSACTION_TYPE.CASH_WITHDRAWAL];
const allowedTypes = [...depositTypes, ...withdrawalTypes];
const paymentMethods = Object.values(PAYMENT_METHOD).filter(
  (m) => m !== 'internal'
);

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, mt: 1,
      pb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1.5,
        bgcolor: (t) => alpha(t.palette.secondary.main, 0.12),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'secondary.dark', '& .MuiSvgIcon-root': { fontSize: 18 },
      }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ color: 'text.primary', letterSpacing: '0.03em' }}>
        {title}
      </Typography>
    </Box>
  );
}

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const preselectedAccountId = (location.state as any)?.accountId;

  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [txnType, setTxnType] = useState(TRANSACTION_TYPE.CASH_DEPOSIT);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.CASH);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  const lookupAccount = async () => {
    if (!accountNumber.trim()) return;
    setLookupError('');
    try {
      const acc = await getAccountByNumber(accountNumber.trim());
      setAccount(acc ?? null);
    } catch {
      setLookupError('Account not found');
      setAccount(null);
    }
  };

  const mutation = useMutation({
    mutationFn: () =>
      createTransaction({
        accountId: preselectedAccountId ?? account!.id,
        transactionType: txnType,
        amountPaise: rupeesToPaise(parseFloat(amount)),
        paymentMethod,
        referenceNumber: reference || undefined,
        description: description || undefined,
        idempotencyKey: crypto.randomUUID(),
      }),
    onSuccess: (data) => {
      enqueueSnackbar(
        `Transaction ${data?.transactionNumber} — Balance: ${formatINR(data?.balanceAfterPaise ?? 0)}`,
        { variant: 'success' }
      );
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/transactions');
    },
    onError: (err: any) => {
      enqueueSnackbar(
        err?.response?.data?.error?.message ?? 'Transaction failed',
        { variant: 'error' }
      );
    },
  });

  const canSubmit = (preselectedAccountId || account) && parseFloat(amount) > 0;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/transactions" onClick={(e) => { e.preventDefault(); navigate('/transactions'); }} sx={{ fontSize: '0.8125rem' }}>
          Transactions
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          New Transaction
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>New Transaction</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a deposit or withdrawal transaction.
      </Typography>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
            {!preselectedAccountId && (
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Account Lookup
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    size="small" label="Account Number" value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" onClick={lookupAccount}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                    Lookup
                  </Button>
                </Stack>
                {lookupError && <Alert severity="error" sx={{ mt: 2 }}>{lookupError}</Alert>}
                {account && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>{account.memberName}</strong> — {account.productName} — Balance: {formatINR(account.balancePaise)}
                  </Alert>
                )}
              </Box>
            )}

            <SectionHeader icon={<SwapHorizOutlinedIcon />} title="Transaction Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth select required label="Transaction Type" value={txnType}
                  onChange={(e) => setTxnType(e.target.value as typeof TRANSACTION_TYPE.CASH_DEPOSIT)}
                >
                  {allowedTypes.map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth required label="Amount" type="number" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth select required label="Payment Method" value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof PAYMENT_METHOD.CASH)}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m} sx={{ textTransform: 'uppercase' }}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {paymentMethod !== PAYMENT_METHOD.CASH && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth required label={
                      paymentMethod === PAYMENT_METHOD.CHEQUE ? 'Cheque Number' :
                      paymentMethod === PAYMENT_METHOD.NEFT || paymentMethod === PAYMENT_METHOD.RTGS ? 'UTR Number' :
                      paymentMethod === PAYMENT_METHOD.UPI ? 'UPI Ref / UTR' :
                      'Reference Number'
                    }
                    value={reference} onChange={(e) => setReference(e.target.value)}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={paymentMethod === PAYMENT_METHOD.CASH ? 12 : 6}>
                <TextField fullWidth label="Description / Narration" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/transactions')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending || !canSubmit} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Processing...' : 'Submit Transaction'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
