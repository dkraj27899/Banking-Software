import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Breadcrumbs, Link, useMediaQuery, useTheme, alpha, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BlockIcon from '@mui/icons-material/Block';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { getAccount, approveAccount, changeAccountProduct, closeAccount, listAccountProducts } from '@/api/accounts';
import { getPassbook } from '@/api/statements';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CopyableId from '@/components/common/CopyableId';
import { useSnackbar } from 'notistack';

export default function AccountDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [changeProductOpen, setChangeProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  const { data: account, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => getAccount(id!),
    enabled: !!id,
  });

  const { data: passbook } = useQuery({
    queryKey: ['passbook', id],
    queryFn: () => getPassbook(id!),
    enabled: !!id,
  });

  const { data: products } = useQuery({
    queryKey: ['account-products'],
    queryFn: listAccountProducts,
    enabled: changeProductOpen,
  });

  const approve = useMutation({
    mutationFn: () => approveAccount(id!),
    onSuccess: (data) => {
      enqueueSnackbar(`Account approved — ${data?.accountNumber}`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Approval failed', { variant: 'error' });
    },
  });

  const changeProduct = useMutation({
    mutationFn: () => changeAccountProduct(id!, selectedProductId),
    onSuccess: () => {
      enqueueSnackbar('Product type updated', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setChangeProductOpen(false);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to change product', { variant: 'error' });
    },
  });

  const close = useMutation({
    mutationFn: () => closeAccount(id!, closureReason),
    onSuccess: () => {
      enqueueSnackbar('Account closed successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCloseDialogOpen(false);
      setClosureReason('');
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Failed to close account', { variant: 'error' });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!account) return <Typography>Account not found</Typography>;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/accounts" onClick={(e) => { e.preventDefault(); navigate('/accounts'); }} sx={{ fontSize: '0.8125rem' }}>
          {t('accounts.title') || 'Accounts'}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {account.accountNumber ?? 'Pending'}
        </Typography>
      </Breadcrumbs>

      {/* Hero card */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #0A1628, #C5A572)',
        }} />
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, pt: { xs: 3, sm: 4 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            spacing={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 2.5,
                bgcolor: alpha('#0A1628', 0.06),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AccountBalanceOutlinedIcon sx={{ fontSize: 26, color: '#0A1628' }} />
              </Box>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                  {account.accountNumber ? (
                    <CopyableId value={account.accountNumber} label="A/C" size="large" />
                  ) : (
                    <Typography variant="h6" fontWeight={600} color="text.secondary">Pending Account</Typography>
                  )}
                  <StatusChip status={account.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {account.memberName} · {account.productName} · {account.branchName}
                </Typography>
              </Box>
            </Box>
            <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} flexWrap="wrap" sx={{ pt: { sm: 0.5 } }}>
              {account.status === 'pending' && (
                <>
                  <Button
                    variant="contained" color="success" size="small"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => approve.mutate()} disabled={approve.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined" size="small"
                    startIcon={<SwapHorizIcon />}
                    onClick={() => { setSelectedProductId(account.productId); setChangeProductOpen(true); }}
                  >
                    Change Product
                  </Button>
                </>
              )}
              {account.status === 'active' && (
                <>
                  <Button variant="contained" size="small" onClick={() => navigate('/transactions/new', { state: { accountId: account.id } })}>
                    New Transaction
                  </Button>
                  <Button
                    variant="outlined" color="error" size="small"
                    startIcon={<BlockIcon />}
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    Close
                  </Button>
                </>
              )}
              <Button variant="outlined" size="small" onClick={() => navigate(`/passbook/${account.id}`)}>
                Passbook
              </Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/accounts')}>Back</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Account Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2.5, height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                Summary
              </Typography>

              {/* Balance highlight */}
              <Box sx={{
                mt: 1.5, mb: 2, p: 2, borderRadius: 2,
                bgcolor: alpha('#059669', 0.06),
                border: '1px solid',
                borderColor: alpha('#059669', 0.12),
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Balance
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'monospace', color: '#059669', lineHeight: 1.2 }}>
                  {formatINR(account.balancePaise)}
                </Typography>
              </Box>

              {[
                ['Product', account.productName],
                ['Type', account.productType],
                ['Opened', account.openedAt ? formatDate(account.openedAt) : '—'],
                ['Branch', account.branchName],
              ].map(([label, value], i, arr) => (
                <Box key={String(label)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{String(label)}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{String(value)}</Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
                Recent Transactions
              </Typography>
              {!passbook || passbook.entries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: isMobile ? 550 : 'auto' }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' } }}>
                        <TableCell>Date</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Reference</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Debit</TableCell>
                        <TableCell align="right">Credit</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {passbook.entries.slice(0, 15).map((e, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(e.date)}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: '0.75rem', fontFamily: 'monospace' }}>{e.reference}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{e.description}</TableCell>
                          <TableCell align="right" sx={{ color: e.debitPaise ? 'error.main' : undefined, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {e.debitPaise ? formatINR(e.debitPaise) : ''}
                          </TableCell>
                          <TableCell align="right" sx={{ color: e.creditPaise ? 'success.main' : undefined, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {e.creditPaise ? formatINR(e.creditPaise) : ''}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatINR(e.balancePaise)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Product Dialog */}
      <Dialog open={changeProductOpen} onClose={() => setChangeProductOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Account Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a new product type for this pending account.
          </Typography>
          <TextField
            select fullWidth label="Product" value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            {(products ?? []).filter((p) => p.isActive).map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.accountType.replace(/_/g, ' ')})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setChangeProductOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => changeProduct.mutate()}
            disabled={changeProduct.isPending || !selectedProductId || selectedProductId === account.productId}
          >
            {changeProduct.isPending ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Account Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Close Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will permanently close account <strong>{account.accountNumber}</strong>.
            Balance: <strong>{formatINR(account.balancePaise)}</strong>
          </Typography>
          <TextField
            fullWidth label="Reason" value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            multiline rows={2}
            placeholder="e.g. Member request, Dormant"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setCloseDialogOpen(false); setClosureReason(''); }}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={() => close.mutate()}
            disabled={close.isPending || !closureReason.trim()}
          >
            {close.isPending ? 'Closing...' : 'Confirm Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
