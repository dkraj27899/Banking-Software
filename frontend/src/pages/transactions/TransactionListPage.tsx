import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import CopyableId from '@/components/common/CopyableId';
import { useSnackbar } from 'notistack';
import { TRANSACTION_TYPE } from '@bccs/shared';

const statuses = ['', 'pending', 'authorized', 'posted', 'reversed', 'failed'];
const txnTypes = ['', ...Object.values(TRANSACTION_TYPE)];

export default function TransactionListPage() {
  const { t } = useTranslation();
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
        <Box>
          <Typography variant="h4" fontWeight={700}>{t('transactions.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {total > 0 ? `${total} transactions` : ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/transactions/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          {t('transactions.new')}
        </Button>
      </Stack>

      <Card sx={{ mb: 2, borderRadius: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            size="small" placeholder={t('common.search') + '...'}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { sm: 220 } }}
          />
          <TextField select size="small" value={status} label={t('common.status')}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            {statuses.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || t('common.all')}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={txnType} label={t('common.type')}
            onChange={(e) => { setTxnType(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            {txnTypes.map((ty) => <MenuItem key={ty} value={ty}>{ty ? ty.replace(/_/g, ' ') : t('common.all')}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        {isLoading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <EmptyState message={t('common.noData')} />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 700 : 'auto' }}>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' } }}>
                    <TableCell>{t('transactions.transactionNumber')}</TableCell>
                    <TableCell>{t('accounts.title')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('common.name')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('common.type')}</TableCell>
                    <TableCell align="right">{t('common.amount')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('common.date')}</TableCell>
                    <TableCell align="center" width={50} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id} hover>
                      <TableCell>
                        <CopyableId value={txn.transactionNumber} size="small" variant="inline" />
                      </TableCell>
                      <TableCell>
                        <CopyableId value={txn.accountNumber} size="small" variant="inline" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{txn.memberName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, textTransform: 'capitalize' }}>{txn.transactionType.replace(/_/g, ' ')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(txn.amountPaise)}</TableCell>
                      <TableCell><StatusChip status={txn.status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(txn.createdAt)}</TableCell>
                      <TableCell align="center">
                        {txn.status === 'pending' && (
                          <Tooltip title="Authorize">
                            <IconButton size="small" color="success" onClick={() => authorizeMut.mutate(txn.id)}>
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
