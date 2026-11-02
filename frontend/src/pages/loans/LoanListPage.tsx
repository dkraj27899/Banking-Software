import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, Typography, Stack, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { listActiveLoans, listLoanApplications } from '@/api/loans';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function LoanListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['loans', page, pageSize],
    queryFn: () => listActiveLoans({ page: page + 1, pageSize }),
    enabled: tab === 0,
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['loan-applications', page, pageSize],
    queryFn: () => listLoanApplications({ page: page + 1, pageSize }),
    enabled: tab === 1,
  });

  const loans = loansData?.data ?? [];
  const apps = appsData?.data ?? [];
  const total = tab === 0 ? (loansData?.meta?.total ?? 0) : (appsData?.meta?.total ?? 0);
  const loading = tab === 0 ? loansLoading : appsLoading;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={700}>Loans</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/loans/apply')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          New Application
        </Button>
      </Stack>

      <Card>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          variant={isMobile ? 'fullWidth' : 'standard'}>
          <Tab label="Active Loans" />
          <Tab label="Applications" />
        </Tabs>

        {loading ? <LoadingSpinner /> : (
          <>
            {tab === 0 && (loans.length === 0 ? <EmptyState message="No active loans" /> : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: isMobile ? 650 : 'auto' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Loan #</TableCell>
                      <TableCell>Member</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                      <TableCell align="right">Principal</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Outstanding</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>EMI</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Next Due</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow key={l.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/loans/${l.id}`)}>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.loanNumber}</TableCell>
                        <TableCell>{l.memberName}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{l.productName}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatINR(l.principalPaise)}</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(l.outstandingPaise)}</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' }, fontFamily: 'monospace' }}>{formatINR(l.emiPaise)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(l.nextDueDate)}</TableCell>
                        <TableCell><StatusChip status={l.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ))}

            {tab === 1 && (apps.length === 0 ? <EmptyState message="No loan applications" /> : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: isMobile ? 550 : 'auto' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>App #</TableCell>
                      <TableCell>Member</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                      <TableCell align="right">Requested</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tenure</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Applied</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apps.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.applicationNumber}</TableCell>
                        <TableCell>{a.memberName}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{a.productName}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatINR(a.requestedAmountPaise)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{a.tenureMonths} months</TableCell>
                        <TableCell><StatusChip status={a.status} /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(a.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ))}

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
