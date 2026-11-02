import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, TextField, Stack, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import { getPassbook } from '@/api/statements';
import { getAccountByNumber } from '@/api/accounts';
import { formatINR, formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const NAVY = '#0A1628';
const GOLD = '#C5A572';

export default function PassbookPage() {
  const { accountId } = useParams();
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccountId, setResolvedAccountId] = useState(accountId ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lookupError, setLookupError] = useState('');

  const lookupAccount = async () => {
    if (!accountNumber.trim()) return;
    setLookupError('');
    try {
      const acc = await getAccountByNumber(accountNumber.trim());
      if (acc) setResolvedAccountId(acc.id);
    } catch {
      setLookupError('Account not found');
    }
  };

  const { data: passbook, isLoading } = useQuery({
    queryKey: ['passbook', resolvedAccountId, dateFrom, dateTo],
    queryFn: () => getPassbook(resolvedAccountId, {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    enabled: !!resolvedAccountId,
  });

  const handlePrint = () => window.print();

  return (
    <Box>
      {/* Controls — hidden on print */}
      <Box className="no-print">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>Passbook</Typography>
          {passbook && (
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print Passbook
            </Button>
          )}
        </Stack>

        {!accountId && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  size="small" label="Account Number" value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupAccount()}
                  error={!!lookupError} helperText={lookupError}
                  sx={{ flex: 1, maxWidth: { sm: 280 } }}
                />
                <Button variant="outlined" startIcon={<SearchIcon />} onClick={lookupAccount}>
                  Lookup
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {resolvedAccountId && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  size="small" type="date" label="From" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: { sm: 200 } }}
                />
                <TextField
                  size="small" type="date" label="To" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: { sm: 200 } }}
                />
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {isLoading && <LoadingSpinner />}

      {/* Passbook — this is what prints */}
      {passbook && (
        <Box
          className="passbook-print-area"
          sx={{
            maxWidth: 900,
            mx: 'auto',
            bgcolor: '#fff',
            border: '1px solid #ddd',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {/* Header band */}
          <div className="passbook-header" style={{
            backgroundColor: NAVY,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: 0.5, color: '#ffffff' }}>
                Bhagwati Credit Co-operative Society Ltd.
              </div>
              <div className="passbook-header-sub" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                Regd. Under Multi-State Co-operative Societies Act
              </div>
            </div>
            <div className="passbook-logo" style={{
              width: 48, height: 48, borderRadius: '50%',
              backgroundColor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.1rem', color: NAVY, flexShrink: 0,
            }}>
              BC
            </div>
          </div>

          {/* Title bar */}
          <div className="passbook-title-bar" style={{
            backgroundColor: GOLD,
            color: NAVY,
            textAlign: 'center',
            padding: '6px 0',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            Account Passbook / Statement
          </div>

          {/* Account details */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              paddingBottom: 16,
              borderBottom: '1px solid #e0e0e0',
            }}>
              {[
                { label: 'Account Number', value: passbook.accountNumber, mono: true },
                { label: 'Account Holder', value: passbook.memberName },
                { label: 'Product', value: passbook.productName },
                { label: 'Branch', value: passbook.branchName || 'Main Branch' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="passbook-label" style={{
                    fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {item.label}
                  </div>
                  <div className="passbook-value" style={{
                    fontSize: '0.9rem', fontWeight: 700, color: '#111',
                    fontFamily: item.mono ? 'monospace' : 'inherit',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance summary */}
            <div className="passbook-balance-box" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              borderRadius: 4,
              border: '1px solid #e8e8e8',
            }}>
              <div>
                <div className="passbook-label" style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>
                  Opening Balance
                </div>
                <div className="passbook-value" style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#111' }}>
                  {formatINR(passbook.openingBalancePaise)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="passbook-label" style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>
                  Closing Balance
                </div>
                <div className="passbook-value" style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#111' }}>
                  {formatINR(passbook.closingBalancePaise)}
                </div>
              </div>
            </div>

            {/* Transaction table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
              }}>
                <thead>
                  <tr>
                    {['Date', 'Particulars', 'Ref / Txn No.', 'Withdrawal (Dr.)', 'Deposit (Cr.)', 'Balance'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 12px',
                        backgroundColor: NAVY,
                        color: '#ffffff',
                        fontWeight: 700,
                        textAlign: h.includes('Withdrawal') || h.includes('Deposit') || h === 'Balance' ? 'right' : 'left',
                        borderBottom: `2px solid ${GOLD}`,
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passbook.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 12px', textAlign: 'center', color: '#999' }}>
                        No transactions in this period
                      </td>
                    </tr>
                  ) : (
                    passbook.entries.map((e, i) => (
                      <tr key={i} style={{
                        backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                        borderBottom: '1px solid #eee',
                      }}>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: '#111' }}>
                          {formatDate(e.date)}
                        </td>
                        <td style={{ padding: '8px 12px', maxWidth: 200, color: '#111' }}>
                          {e.description}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: '#444',
                        }}>
                          {e.reference}
                        </td>
                        <td className="passbook-amt-dr" style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: e.debitPaise ? 600 : 400,
                          color: e.debitPaise ? '#c62828' : '#ccc',
                        }}>
                          {e.debitPaise ? formatINR(e.debitPaise) : '—'}
                        </td>
                        <td className="passbook-amt-cr" style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: e.creditPaise ? 600 : 400,
                          color: e.creditPaise ? '#2e7d32' : '#ccc',
                        }}>
                          {e.creditPaise ? formatINR(e.creditPaise) : '—'}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#111',
                        }}>
                          {formatINR(e.balancePaise)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            {passbook.entries.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 32,
                marginTop: 16,
                paddingTop: 16,
                borderTop: `2px solid ${NAVY}`,
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="passbook-label" style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>
                    Total Withdrawals
                  </div>
                  <div className="passbook-amt-dr" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c62828', fontSize: '0.9rem' }}>
                    {formatINR(passbook.entries.reduce((s, e) => s + e.debitPaise, 0))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="passbook-label" style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>
                    Total Deposits
                  </div>
                  <div className="passbook-amt-cr" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2e7d32', fontSize: '0.9rem' }}>
                    {formatINR(passbook.entries.reduce((s, e) => s + e.creditPaise, 0))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="passbook-footer" style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#888' }}>
                This is a computer-generated statement and does not require a signature.
              </span>
              <span style={{ fontSize: '0.7rem', color: '#888' }}>
                Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </Box>
      )}
    </Box>
  );
}
