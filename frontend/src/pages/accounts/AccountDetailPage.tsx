import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Breadcrumbs, Link, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BlockIcon from '@mui/icons-material/Block';
import { getAccount, approveAccount, changeAccountProduct, closeAccount, listAccountProducts } from '@/api/accounts';
import { getPassbook } from '@/api/statements';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSnackbar } from 'notistack';

export default function AccountDetailPage() {
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
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" href="/accounts" onClick={(e) => { e.preventDefault(); navigate('/accounts'); }} sx={{ fontSize: '0.8125rem' }}>
          Accounts
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {account.accountNumber ?? 'Pending'}
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
          <Typography variant="h4" fontWeight={700}>
            {account.accountNumber ? `Account ${account.accountNumber}` : 'Pending Account'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {account.memberName} &middot; {account.productName} &middot; {account.branchName}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {account.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => approve.mutate()}
                disabled={approve.isPending}
              >
                {approve.isPending ? 'Approving...' : 'Approve Account'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<SwapHorizIcon />}
                onClick={() => { setSelectedProductId(account.productId); setChangeProductOpen(true); }}
              >
                Change Product
              </Button>
            </>
          )}
          {account.status === 'active' && (
            <>
              <Button variant="contained" onClick={() => navigate('/transactions/new', { state: { accountId: account.id } })}>
                New Transaction
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => setCloseDialogOpen(true)}
              >
                Close Account
              </Button>
            </>
          )}
          <Button variant="outlined" onClick={() => navigate(`/passbook/${account.id}`)}>
            View Passbook
          </Button>
          <Button variant="outlined" onClick={() => navigate('/accounts')}>Back</Button>
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Account Summary</Typography>
              <Grid container spacing={1.5}>
                {[
                  ['Status', <StatusChip status={account.status} key="s" />],
                  ['Balance', formatINR(account.balancePaise)],
                  ['Product', account.productName],
                  ['Type', account.productType],
                  ['Opened', account.openedAt ? formatDate(account.openedAt) : '—'],
                  ['Branch', account.branchName],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={String(label)}>
                    <Typography variant="caption" color="text.secondary">{String(label)}</Typography>
                    <Typography variant="body2" fontWeight={String(label) === 'Balance' ? 700 : 400}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recent Transactions</Typography>
              {!passbook || passbook.entries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: isMobile ? 550 : 'auto' }}>
                    <TableHead>
                      <TableRow>
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
                          <TableCell>{formatDate(e.date)}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{e.reference}</TableCell>
                          <TableCell>{e.description}</TableCell>
                          <TableCell align="right" sx={{ color: e.debitPaise ? 'error.main' : undefined }}>
                            {e.debitPaise ? formatINR(e.debitPaise) : ''}
                          </TableCell>
                          <TableCell align="right" sx={{ color: e.creditPaise ? 'success.main' : undefined }}>
                            {e.creditPaise ? formatINR(e.creditPaise) : ''}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(e.balancePaise)}</TableCell>
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

      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Close Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This action will permanently close account <strong>{account.accountNumber}</strong>.
            Closed accounts cannot accept new transactions.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current balance: <strong>{formatINR(account.balancePaise)}</strong>
          </Typography>
          <TextField
            fullWidth label="Reason for Closure" value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            multiline rows={2}
            placeholder="e.g. Member request, Account dormant, etc."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setCloseDialogOpen(false); setClosureReason(''); }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
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
