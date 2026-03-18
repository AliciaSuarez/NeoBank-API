import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import TransactionList from '../components/TransactionList';
import { getAccounts } from '../services/accountService';
import { getCards } from '../services/cardService';
import { getTransactions } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';

function MetricCard({ label, value, color }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} color={color ?? 'text.primary'} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [activeCards, setActiveCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accs = await getAccounts();
        setAccounts(accs);

        // Load cards and transactions for all accounts in parallel
        const [allCards, allTransactions] = await Promise.all([
          Promise.all(accs.map((a) => getCards(a.id).catch(() => []))),
          Promise.all(accs.map((a) => getTransactions(a.id).catch(() => []))),
        ]);

        const flatCards = allCards.flat();
        setActiveCards(flatCards.filter((c) => c.status === 'active').length);

        const flatTx = allTransactions
          .flat()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setRecentTransactions(flatTx);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === 'active').length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total Balance" value={formatCurrency(totalBalance)} color="warning.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Active Accounts" value={activeAccounts} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Active Cards" value={activeCards} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total Accounts" value={accounts.length} />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>
        Recent Transactions
      </Typography>
      <TransactionList transactions={recentTransactions} />
    </Box>
  );
}
