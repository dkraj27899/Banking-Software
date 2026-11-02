import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Autocomplete, Breadcrumbs, Link, alpha, InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useSnackbar } from 'notistack';
import { createLoanApplication, listLoanProducts } from '@/api/loans';
import { listMembers, type Member } from '@/api/members';
import { getAccountsByMember } from '@/api/accounts';
import { rupeesToPaise, formatINR } from '@/utils/format';

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

export default function LoanApplicationPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const [memberId, setMemberId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [purpose, setPurpose] = useState('');
  const [guarantor, setGuarantor] = useState('');
  const [collateral, setCollateral] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const { data: products } = useQuery({
    queryKey: ['loan-products'],
    queryFn: listLoanProducts,
  });

  const { data: membersResp } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: () => listMembers({ page: 1, pageSize: 20, search: memberSearch, status: 'active' }),
    enabled: memberSearch.length >= 2,
  });

  const { data: accounts } = useQuery({
    queryKey: ['member-accounts', memberId],
    queryFn: () => getAccountsByMember(memberId),
    enabled: !!memberId,
  });

  const members: Member[] = membersResp?.data ?? [];
  const activeAccounts = (accounts ?? []).filter(a => a.status === 'active');

  const mutation = useMutation({
    mutationFn: () => createLoanApplication({
      memberId,
      accountId,
      productId,
      requestedAmountPaise: rupeesToPaise(parseFloat(amount)),
      tenureMonths: parseInt(tenure),
      purpose: purpose || undefined,
      guarantorName: guarantor || undefined,
      collateralDescription: collateral || undefined,
    }),
    onSuccess: (data) => {
      enqueueSnackbar(`Application ${data?.applicationNumber} submitted`, { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['loan-applications'] });
      navigate('/loans');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Application failed', { variant: 'error' });
    },
  });

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/loans" onClick={(e) => { e.preventDefault(); navigate('/loans'); }} sx={{ fontSize: '0.8125rem' }}>
          Loans
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          New Application
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>New Loan Application</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in the details below to submit a loan application.
      </Typography>

      <Card sx={{ maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
            <SectionHeader icon={<PersonOutlineIcon />} title="Applicant Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(o) => `${o.membershipNumber ?? '?'} — ${o.fullName}`}
                  onInputChange={(_, v) => setMemberSearch(v)}
                  onChange={(_, v) => { setMemberId(v?.id ?? ''); setAccountId(''); }}
                  renderInput={(params) => <TextField {...params} required label="Member" placeholder="Search by name or membership #" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select required label="Disbursement Account" value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={!memberId}>
                  {activeAccounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.accountNumber} — {a.productName} ({formatINR(a.balancePaise)})</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <SectionHeader icon={<CreditScoreOutlinedIcon />} title="Loan Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select required label="Loan Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {(products ?? []).filter(p => p.isActive).map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name} — {(p.interestRateBps / 100).toFixed(2)}%</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth required label="Tenure (months)" type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Guarantor Name" value={guarantor} onChange={(e) => setGuarantor(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Collateral Description" value={collateral} onChange={(e) => setCollateral(e.target.value)} />
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/loans')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
