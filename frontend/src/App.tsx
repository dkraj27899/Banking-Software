import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import theme from '@/theme/theme';
import { AuthProvider } from '@/store/authStore';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import UnauthorizedPage from '@/pages/dashboard/UnauthorizedPage';
import MemberListPage from '@/pages/members/MemberListPage';
import CreateMemberPage from '@/pages/members/CreateMemberPage';
import MemberDetailPage from '@/pages/members/MemberDetailPage';
import AccountListPage from '@/pages/accounts/AccountListPage';
import CreateAccountPage from '@/pages/accounts/CreateAccountPage';
import AccountDetailPage from '@/pages/accounts/AccountDetailPage';
import TransactionListPage from '@/pages/transactions/TransactionListPage';
import NewTransactionPage from '@/pages/transactions/NewTransactionPage';
import LoanListPage from '@/pages/loans/LoanListPage';
import LoanApplicationPage from '@/pages/loans/LoanApplicationPage';
import LoanDetailPage from '@/pages/loans/LoanDetailPage';
import ExpenseListPage from '@/pages/expenses/ExpenseListPage';
import CreateExpensePage from '@/pages/expenses/CreateExpensePage';
import PassbookPage from '@/pages/passbook/PassbookPage';
import StaffListPage from '@/pages/staff/StaffListPage';
import CreateStaffPage from '@/pages/staff/CreateStaffPage';
import AuditLogPage from '@/pages/audit/AuditLogPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import { PERMISSIONS } from '@bccs/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />

                  {/* Members */}
                  <Route path="members" element={<MemberListPage />} />
                  <Route path="members/new" element={<CreateMemberPage />} />
                  <Route path="members/:id" element={<MemberDetailPage />} />

                  {/* Accounts */}
                  <Route path="accounts" element={<AccountListPage />} />
                  <Route path="accounts/new" element={<CreateAccountPage />} />
                  <Route path="accounts/:id" element={<AccountDetailPage />} />

                  {/* Transactions */}
                  <Route path="transactions" element={<TransactionListPage />} />
                  <Route path="transactions/new" element={<NewTransactionPage />} />

                  {/* Passbook */}
                  <Route path="passbook" element={<PassbookPage />} />
                  <Route path="passbook/:accountId" element={<PassbookPage />} />

                  {/* Loans */}
                  <Route path="loans" element={<LoanListPage />} />
                  <Route path="loans/apply" element={<LoanApplicationPage />} />
                  <Route path="loans/:id" element={<LoanDetailPage />} />

                  {/* Expenses */}
                  <Route path="expenses" element={<ExpenseListPage />} />
                  <Route path="expenses/new" element={<CreateExpensePage />} />

                  {/* Staff Management */}
                  <Route
                    path="staff"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.STAFF_MANAGE}>
                        <StaffListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="staff/new"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.STAFF_MANAGE}>
                        <CreateStaffPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Reports */}
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.REPORT_READ}>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Audit Logs */}
                  <Route
                    path="audit"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.AUDIT_READ}>
                        <AuditLogPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings */}
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute requiredPermission={PERMISSIONS.CONFIG_MANAGE}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="unauthorized" element={<UnauthorizedPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
