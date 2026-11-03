import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TextField, MenuItem,
  InputAdornment, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { listAccounts } from '@/api/accounts';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import CopyableId from '@/components/common/CopyableId';

const statuses = ['', 'pending', 'active', 'suspended', 'closed'];

export default function AccountListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', page, pageSize, search, status],
    queryFn: () => listAccounts({
      page: page + 1, pageSize,
      search: search || undefined,
      status: status || undefined,
    }),
  });

  const accounts = data?.data ?? [];
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
          <Typography variant="h4" fontWeight={700}>{t('accounts.title') || 'Accounts'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {total > 0 ? `${total} accounts` : ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/accounts/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          {t('accounts.openAccount') || 'Open Account'}
        </Button>
      </Stack>

      <Card sx={{ mb: 2, borderRadius: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            size="small" placeholder={t('common.search') + '...'}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: { sm: 280 } }}
          />
          <TextField
            select size="small" value={status} label={t('common.status') || 'Status'}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
          >
            {statuses.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || t('common.allStatuses') || 'All'}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        {isLoading ? <LoadingSpinner /> : accounts.length === 0 ? (
          <EmptyState message={t('common.noData') || 'No accounts found'} />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 600 : 'auto' }}>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' } }}>
                    <TableCell>Account #</TableCell>
                    <TableCell>{t('common.name') || 'Member'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                    <TableCell>{t('common.status') || 'Status'}</TableCell>
                    <TableCell align="right">{t('common.amount') || 'Balance'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('common.date') || 'Opened'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/accounts/${a.id}`)}>
                      <TableCell>
                        {a.accountNumber
                          ? <CopyableId value={a.accountNumber} size="small" variant="inline" />
                          : <Typography variant="caption" color="text.disabled">Pending</Typography>
                        }
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{a.memberName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{a.productName}</TableCell>
                      <TableCell><StatusChip status={a.status} /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(a.balancePaise)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(a.openedAt)}</TableCell>
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
