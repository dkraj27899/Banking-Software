import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Breadcrumbs, Link, alpha, InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useSnackbar } from 'notistack';
import { createExpense } from '@/api/expenses';
import { rupeesToPaise } from '@/utils/format';
import { PAYMENT_METHOD } from '@bccs/shared';

const categories = [
  'rent', 'salary', 'stationery', 'utilities', 'travel',
  'maintenance', 'legal', 'audit_fees', 'miscellaneous',
];

const paymentMethods = Object.values(PAYMENT_METHOD).filter(m => m !== 'internal');

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

export default function CreateExpensePage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    category: '', description: '', amount: '', expenseDate: '',
    paymentMethod: PAYMENT_METHOD.CASH, payee: '', invoiceReference: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => createExpense({
      category: form.category,
      description: form.description,
      amountPaise: rupeesToPaise(parseFloat(form.amount)),
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      payee: form.payee || undefined,
      invoiceReference: form.invoiceReference || undefined,
    }),
    onSuccess: (data) => {
      enqueueSnackbar(`Expense recorded: ${data?.referenceNumber}`, { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      navigate('/expenses');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to record expense', { variant: 'error' });
    },
  });

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/expenses" onClick={(e) => { e.preventDefault(); navigate('/expenses'); }} sx={{ fontSize: '0.8125rem' }}>
          Expenses
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Record Expense
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>Record Expense</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the expense details below.
      </Typography>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
            <SectionHeader icon={<ReceiptLongOutlinedIcon />} title="Expense Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select required label="Category" value={form.category} onChange={set('category')}>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="Amount" type="number" value={form.amount} onChange={set('amount')}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required type="date" label="Expense Date" value={form.expenseDate} onChange={set('expenseDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Description" value={form.description} onChange={set('description')} multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select required label="Payment Method" value={form.paymentMethod} onChange={set('paymentMethod')}>
                  {paymentMethods.map((m) => <MenuItem key={m} value={m} sx={{ textTransform: 'uppercase' }}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Payee" value={form.payee} onChange={set('payee')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Invoice Reference" value={form.invoiceReference} onChange={set('invoiceReference')} />
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/expenses')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Saving...' : 'Record Expense'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
