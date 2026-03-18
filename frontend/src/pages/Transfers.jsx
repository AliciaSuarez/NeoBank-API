import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import TransferForm from '../components/TransferForm';
import { getAccounts } from '../services/accountService';
import { transfer } from '../services/transferService';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function Transfers() {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState(null);

  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (err) {
        setAccountsError(getErrorMessage(err));
      } finally {
        setLoadingAccounts(false);
      }
    }
    load();
  }, []);

  const handleTransfer = async (fromId, toId, amount) => {
    setTransferLoading(true);
    setTransferError(null);
    setSuccess(false);
    try {
      await transfer(fromId, toId, amount);
      setSuccess(true);
      // Refresh account balances
      const updated = await getAccounts();
      setAccounts(updated);
    } catch (err) {
      setTransferError(getErrorMessage(err));
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Transfer Money
      </Typography>

      {accountsError && <Alert severity="error" sx={{ mb: 2 }}>{accountsError}</Alert>}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Transfer completed successfully.
        </Alert>
      )}

      {loadingAccounts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <TransferForm
            accounts={accounts}
            onSubmit={handleTransfer}
            loading={transferLoading}
            error={transferError}
          />
        </Paper>
      )}
    </Box>
  );
}
