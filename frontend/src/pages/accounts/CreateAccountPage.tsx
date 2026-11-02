import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Autocomplete, Breadcrumbs, Link, alpha,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useSnackbar } from 'notistack';
import { createAccount, listAccountProducts } from '@/api/accounts';
import { listMembers, type Member } from '@/api/members';

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

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();

  const preselectedMemberId = (location.state as any)?.memberId;
  const [memberId, setMemberId] = useState(preselectedMemberId ?? '');
  const [productId, setProductId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const { data: products } = useQuery({
    queryKey: ['account-products'],
    queryFn: listAccountProducts,
  });

  const { data: membersResp } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: () => listMembers({ page: 1, pageSize: 20, search: memberSearch, status: 'active' }),
    enabled: memberSearch.length >= 2,
  });

  const members: Member[] = membersResp?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => createAccount({ memberId, productId }),
    onSuccess: (data) => {
      enqueueSnackbar(`Account opened: ${data?.accountNumber}`, { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      navigate('/accounts');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to open account', { variant: 'error' });
    },
  });

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/accounts" onClick={(e) => { e.preventDefault(); navigate('/accounts'); }} sx={{ fontSize: '0.8125rem' }}>
          Accounts
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Open New Account
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>Open New Account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a member and account product to open a new account.
      </Typography>

      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
            <SectionHeader icon={<AccountBalanceOutlinedIcon />} title="Account Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(o) => `${o.membershipNumber ?? '?'} — ${o.fullName}`}
                  onInputChange={(_, v) => setMemberSearch(v)}
                  onChange={(_, v) => setMemberId(v?.id ?? '')}
                  renderInput={(params) => (
                    <TextField {...params} required label="Search Active Member" placeholder="Type name or membership #" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth select required label="Account Product" value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {(products ?? []).filter(p => p.isActive).map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} ({p.accountType}) — {(p.interestRateBps / 100).toFixed(2)}% p.a.
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" onClick={() => navigate('/accounts')} sx={{ minWidth: 120 }}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={mutation.isPending || !memberId || !productId} sx={{ minWidth: 180 }}>
                {mutation.isPending ? 'Opening...' : 'Open Account'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
