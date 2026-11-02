import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TextField, MenuItem,
  InputAdornment, Stack, Typography, IconButton, Tooltip,
  useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { listTransactions, authorizeTransaction } from '@/api/transactions';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useSnackbar } from 'notistack';
import { TRANSACTION_TYPE } from '@bccs/shared';

const statuses = ['', 'pending', 'authorized', 'posted', 'reversed', 'failed'];
const txnTypes = ['', ...Object.values(TRANSACTION_TYPE)];

export default function TransactionListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [txnType, setTxnType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, pageSize, search, status, txnType],
    queryFn: () => listTransactions({
      page: page + 1, pageSize,
      search: search || undefined,
      status: status || undefined,
      transactionType: txnType || undefined,
    }),
  });

  const authorizeMut = useMutation({
    mutationFn: (id: string) => authorizeTransaction(id, 'authorize'),
    onSuccess: () => {
      enqueueSnackbar('Transaction authorized', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.error?.message ?? 'Authorization failed', { variant: 'error' });
    },
  });

  const transactions = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700}>Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/transactions/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          New Transaction
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            size="small" placeholder="Search by txn # or account..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { sm: 220 } }}
          />
          <TextField select size="small" value={status} label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            {statuses.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || 'All'}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={txnType} label="Type"
            onChange={(e) => { setTxnType(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            {txnTypes.map((t) => <MenuItem key={t} value={t}>{t ? t.replace(/_/g, ' ') : 'All'}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <EmptyState message="No transactions found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 700 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Txn #</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Member</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.transactionNumber}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.accountNumber}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t.memberName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, textTransform: 'capitalize' }}>{t.transactionType.replace(/_/g, ' ')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(t.amountPaise)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textTransform: 'uppercase' }}>{t.paymentMethod ?? '—'}</TableCell>
                      <TableCell><StatusChip status={t.status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(t.createdAt)}</TableCell>
                      <TableCell align="center">
                        {t.status === 'pending' && (
                          <Tooltip title="Authorize">
                            <IconButton size="small" color="success" onClick={() => authorizeMut.mutate(t.id)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={total}
              page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(+e.target.value); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
