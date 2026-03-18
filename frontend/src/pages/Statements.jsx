import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import StatementSummary from '../components/StatementSummary';
import { getAccounts } from '../services/accountService';
import { getStatement, getStatements } from '../services/statementService';
import { getErrorMessage } from '../utils/getErrorMessage';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' },   { value: 4, label: 'April' },
  { value: 5, label: 'May' },     { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },
  { value: 9, label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' },{ value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear];

export default function Statements() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statements, setStatements] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [statementsError, setStatementsError] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    async function loadAccounts() {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        const data = await getAccounts();
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].id);
      } catch (err) {
        setAccountsError(getErrorMessage(err));
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    async function loadStatements() {
      setLoadingStatements(true);
      setStatementsError(null);
      try {
        const data = await getStatements(selectedAccountId);
        setStatements(data);
      } catch (err) {
        setStatementsError(getErrorMessage(err));
      } finally {
        setLoadingStatements(false);
      }
    }
    loadStatements();
  }, [selectedAccountId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await getStatement(selectedAccountId, year, month);
      // Reload the full list so the new statement appears
      const data = await getStatements(selectedAccountId);
      setStatements(data);
    } catch (err) {
      setGenerateError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  if (loadingAccounts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Statements
      </Typography>

      {accountsError && <Alert severity="error" sx={{ mb: 2 }}>{accountsError}</Alert>}

      {/* Account selector */}
      <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
        <InputLabel>Account</InputLabel>
        <Select
          value={selectedAccountId}
          label="Account"
          onChange={(e) => setSelectedAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.account_number} ({a.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Generate statement */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generating || !selectedAccountId}
        >
          {generating ? <CircularProgress size={20} color="inherit" /> : 'Generate Statement'}
        </Button>
      </Box>

      {generateError && <Alert severity="error" sx={{ mb: 2 }}>{generateError}</Alert>}
      {statementsError && <Alert severity="error" sx={{ mb: 2 }}>{statementsError}</Alert>}

      {loadingStatements ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : statements.length === 0 ? (
        <Typography color="text.secondary">
          No statements yet. Select a month and click Generate Statement.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {statements.map((s) => (
            <StatementSummary key={s.id} statement={s} />
          ))}
        </Box>
      )}
    </Box>
  );
}
