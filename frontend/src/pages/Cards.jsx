import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CardItem from '../components/CardItem';
import { getAccounts } from '../services/accountService';
import { blockCard, getCards, payCard, requestCard, unblockCard } from '../services/cardService';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function Cards() {
  const [accounts, setAccounts] = useState([]);
  const [cardsByAccount, setCardsByAccount] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [requesting, setRequesting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const accs = await getAccounts();
      setAccounts(accs);

      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }

      const results = await Promise.all(
        accs.map((a) => getCards(a.id).then((cards) => ({ accountId: a.id, cards })))
      );
      const map = {};
      results.forEach(({ accountId, cards }) => {
        map[accountId] = cards;
      });
      setCardsByAccount(map);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRequestCard = async () => {
    if (!selectedAccountId) return;
    setRequesting(true);
    setActionError(null);
    try {
      await requestCard(selectedAccountId);
      loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  const handleBlock = async (cardId) => {
    setActionError(null);
    try {
      await blockCard(cardId);
      loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleUnblock = async (cardId) => {
    setActionError(null);
    try {
      await unblockCard(cardId);
      loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handlePay = async (cardId, amount) => {
    setActionError(null);
    // Find which account is linked to this card
    const linkedAccountId = Object.entries(cardsByAccount).find(([, cards]) =>
      cards.some((c) => c.id === cardId)
    )?.[0];
    if (!linkedAccountId) return;
    try {
      await payCard(cardId, linkedAccountId, amount);
      loadAll();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const allCards = Object.values(cardsByAccount).flat();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Cards
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {/* Request new card */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Account</InputLabel>
          <Select
            value={selectedAccountId}
            label="Account"
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            {accounts
              .filter((a) => a.status === 'active')
              .map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.account_number}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleRequestCard} disabled={requesting || !selectedAccountId}>
          {requesting ? <CircularProgress size={20} color="inherit" /> : 'Request Credit Card'}
        </Button>
      </Box>

      {allCards.length === 0 ? (
        <Typography color="text.secondary">No cards yet. Request your first credit card above.</Typography>
      ) : (
        <Grid container spacing={2}>
          {allCards.map((card) => (
            <Grid item key={card.id} xs={12} sm={6} md={4}>
              <CardItem
                card={card}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
                onPay={handlePay}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
