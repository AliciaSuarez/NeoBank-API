import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import TransactionRow from './TransactionRow';

/**
 * Renders a list of transactions in a table.
 * Hides the date column on mobile screens.
 * @param {{ transactions: Transaction[] }} props
 */
export default function TransactionList({ transactions }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!transactions || transactions.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No transactions yet.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Type</TableCell>
            {!isMobile && <TableCell>Date</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} hideDate={isMobile} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
