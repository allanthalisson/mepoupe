import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import { TransactionsPage, TransactionsImportPage } from '@/pages/TransactionsPage';
import { CardsPage, CardInvoicePage } from '@/pages/CardsPage';
import { AccountsPage, AccountStatementPage } from '@/pages/AccountsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SettingsPage from '@/pages/SettingsPage';
import { SettingsChangelogPage } from '@/pages/SettingsChangelogPage';
import { AttachmentsPage, BudgetsPage, CalendarPage, CategoryHistoryPage, InboxPage, InsightsPage, NotesPage, PayerDetailsPage, PayersPage, ReportsPage } from '@/pages/FeaturePages';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { protectedPage } from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={protectedPage(DashboardPage)} />
        
        <Route path="/transactions" component={protectedPage(TransactionsPage)} />
        <Route path="/transactions/import" component={protectedPage(TransactionsImportPage)} />
        
        <Route path="/cards" component={protectedPage(CardsPage)} />
        <Route path="/cards/:cardId/invoice" component={protectedPage(CardInvoicePage)} />
        
        <Route path="/accounts" component={protectedPage(AccountsPage)} />
        <Route path="/accounts/:accountId/statement" component={protectedPage(AccountStatementPage)} />
        
        <Route path="/categories" component={protectedPage(CategoriesPage)} />
        <Route path="/categories/history" component={protectedPage(CategoryHistoryPage)} />
        <Route path="/categories/:categoryId" component={protectedPage(CategoriesPage)} />
        <Route path="/budgets" component={protectedPage(BudgetsPage)} />
        
        <Route path="/payers" component={protectedPage(PayersPage)} />
        <Route path="/payers/:payerId" component={protectedPage(PayerDetailsPage)} />
        
        <Route path="/notes" component={protectedPage(NotesPage)} />
        <Route path="/insights" component={protectedPage(InsightsPage)} />
        <Route path="/calendar" component={protectedPage(CalendarPage)} />
        <Route path="/inbox" component={protectedPage(InboxPage)} />
        <Route path="/attachments" component={protectedPage(AttachmentsPage)} />
        
        <Route path="/reports" component={protectedPage(ReportsPage)} />
        <Route path="/reports/:reportId" component={protectedPage(ReportsPage)} />
        
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/settings" component={protectedPage(SettingsPage)} />
        <Route path="/settings/changelog" component={protectedPage(SettingsChangelogPage)} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
