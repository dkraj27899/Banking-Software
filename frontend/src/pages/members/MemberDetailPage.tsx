import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Breadcrumbs, Link, useMediaQuery, useTheme, alpha, Divider,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { useSnackbar } from 'notistack';
import { getMember, approveMember, rejectMember } from '@/api/members';
import { getAccountsByMember } from '@/api/accounts';
import { formatDate, formatINR } from '@/utils/format';
import StatusChip from '@/components/common/StatusChip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CopyableId from '@/components/common/CopyableId';

export default function MemberDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => getMember(id!),
    enabled: !!id,
  });

  const { data: accounts } = useQuery({
    queryKey: ['member-accounts', id],
    queryFn: () => getAccountsByMember(id!),
    enabled: !!id,
  });

  const approve = useMutation({
    mutationFn: () => approveMember(id!),
    onSuccess: (data) => {
      enqueueSnackbar(`Approved — ${data?.membershipNumber}`, { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['member', id] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const reject = useMutation({
    mutationFn: () => rejectMember(id!, 'Rejected by admin'),
    onSuccess: () => {
      enqueueSnackbar('Member rejected', { variant: 'info' });
      qc.invalidateQueries({ queryKey: ['member', id] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!member) return <Typography>Member not found</Typography>;

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/members" onClick={(e) => { e.preventDefault(); navigate('/members'); }} sx={{ fontSize: '0.8125rem' }}>
          {t('members.title')}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {member.fullName}
        </Typography>
      </Breadcrumbs>

      {/* Hero card with name + membership number */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #0A1628, #C5A572)',
        }} />
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, pt: { xs: 3, sm: 4 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 2.5,
                bgcolor: alpha('#0A1628', 0.06),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <PersonOutlinedIcon sx={{ fontSize: 26, color: '#0A1628' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                  {member.fullName}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                  {member.membershipNumber ? (
                    <CopyableId value={member.membershipNumber} label="ID" size="medium" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Pending approval</Typography>
                  )}
                  <StatusChip status={member.status} />
                  <Typography variant="caption" color="text.secondary">{member.branchName}</Typography>
                </Stack>
              </Box>
            </Box>
            <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} flexWrap="wrap">
              {member.status === 'pending' && (
                <>
                  <Button variant="contained" color="success" size="small" onClick={() => approve.mutate()} disabled={approve.isPending}>
                    Approve
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => reject.mutate()} disabled={reject.isPending}>
                    Reject
                  </Button>
                </>
              )}
              <Button variant="outlined" size="small" onClick={() => navigate('/members')}>Back</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Personal info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2.5, height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                {t('members.personalInfo') || 'Personal'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                {[
                  [t('members.memberType') || 'Type', member.membershipType],
                  [t('members.fatherGuardian') || 'Father / Guardian', member.fatherGuardianName ?? '—'],
                  [t('members.dob') || 'Date of Birth', formatDate(member.dateOfBirth)],
                  [t('members.gender') || 'Gender', member.gender ?? '—'],
                  [t('members.appliedOn') || 'Applied', formatDate(member.applicationDate)],
                  [t('members.approvedOn') || 'Approved', formatDate(member.approvalDate)],
                ].map(([label, value], i, arr) => (
                  <Box key={String(label)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{String(label)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>{String(value)}</Typography>
                    </Box>
                    {i < arr.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2.5, height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                {t('members.contact') || 'Contact'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                {[
                  [t('members.mobile') || 'Mobile', member.mobile],
                  [t('members.email') || 'Email', member.email ?? '—'],
                  [t('members.address') || 'Address', [member.addressLine1, member.addressLine2].filter(Boolean).join(', ')],
                  [t('members.city') || 'City', member.city],
                  [t('members.state') || 'State', member.state],
                  [t('members.pincode') || 'Pincode', member.pincode],
                  ['Aadhaar', member.aadhaarLast4 ? `**** **** ${member.aadhaarLast4}` : '—'],
                ].map(([label, value], i, arr) => (
                  <Box key={String(label)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{String(label)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', textAlign: 'right', maxWidth: '60%' }}>{String(value)}</Typography>
                    </Box>
                    {i < arr.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Accounts */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                  {t('accounts.title') || 'Accounts'}
                </Typography>
                {member.status === 'active' && (
                  <Button size="small" onClick={() => navigate('/accounts/new', { state: { memberId: member.id } })}>
                    + {t('accounts.openAccount') || 'Open Account'}
                  </Button>
                )}
              </Stack>
              {!accounts || accounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No accounts</Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: isMobile ? 450 : 'auto' }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' } }}>
                        <TableCell>Account #</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Opened</TableCell>
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
                          <TableCell>{a.productName}</TableCell>
                          <TableCell><StatusChip status={a.status} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatINR(a.balancePaise)}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(a.openedAt)}</TableCell>
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
    </Box>
  );
}
