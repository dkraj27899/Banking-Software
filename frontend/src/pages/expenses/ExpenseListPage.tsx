import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, Typography, Stack, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { listExpenses, approveExpense } from '@/api/expenses';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useSnackbar } from 'notistack';

const statuses = ['', 'pending', 'approved', 'rejected', 'paid'];
const categories = [
  '', 'rent', 'salary', 'stationery', 'utilities', 'travel',
  'maintenance', 'legal', 'audit_fees', 'miscellaneous',
];

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, pageSize, status, category],
    queryFn: () => listExpenses({
      page: page + 1, pageSize,
      status: status || undefined,
      category: category || undefined,
    }),
  });

  const approveMut = useMutation({
    mutationFn: approveExpense,
    onSuccess: () => {
      enqueueSnackbar('Expense approved', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const expenses = data?.data ?? [];
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
        <Typography variant="h4" fontWeight={700}>Expenses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/expenses/new')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          Record Expense
        </Button>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField select size="small" value={status} label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            {statuses.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s || 'All'}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={category} label="Category"
            onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            {categories.map((c) => <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c ? c.replace(/_/g, ' ') : 'All'}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <EmptyState message="No expenses found" />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 600 : 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ref #</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Payee</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.referenceNumber}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{e.category.replace(/_/g, ' ')}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{e.description}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{e.payee ?? '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(e.amountPaise)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(e.expenseDate)}</TableCell>
                      <TableCell><StatusChip status={e.status} /></TableCell>
                      <TableCell align="center">
                        {e.status === 'pending' && (
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => approveMut.mutate(e.id)}>
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
