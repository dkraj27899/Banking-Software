import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Stack,
  Autocomplete, Breadcrumbs, Link, alpha,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useSnackbar } from 'notistack';
import { createAccount, listAccountProducts } from '@/api/accounts';
import { listMembers, type Member } from '@/api/members';

function SectionHeader({ title }: { title: string }) {
  return (
    <Box sx={{ mb: 2.5, mt: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
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
            <SectionHeader title="Account Details" />
            <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3.5 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={[...members].sort((a, b) => (a.accountCount ?? 0) - (b.accountCount ?? 0))}
                  getOptionLabel={(o) => `${o.membershipNumber ?? '?'} — ${o.fullName}`}
                  onInputChange={(_, v) => setMemberSearch(v)}
                  onChange={(_, v) => setMemberId(v?.id ?? '')}
                  renderOption={(props, o) => {
                    const count = o.accountCount ?? 0;
                    return (
                      <li {...props} key={o.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{o.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{o.membershipNumber ?? 'Pending'} · {o.city}</Typography>
                          </Box>
                          <Box sx={{
                            px: 1, py: 0.25, borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                            ...(count === 0
                              ? { bgcolor: alpha('#059669', 0.1), color: '#059669' }
                              : { bgcolor: alpha('#6B7280', 0.1), color: '#6B7280' }),
                          }}>
                            {count === 0 ? 'NEW' : `${count} A/C`}
                          </Box>
                        </Box>
                      </li>
                    );
                  }}
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
              <Button variant="contained" type="submit" disabled={mutation.isPending || !memberId || !productId}
                sx={{ minWidth: 180, color: '#FFFFFF', '&.Mui-disabled': { bgcolor: '#0A1628', color: 'rgba(255,255,255,0.45)' } }}>
                {mutation.isPending ? 'Opening...' : 'Open Account'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
