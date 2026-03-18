import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TransactionRow from '../../components/TransactionRow';

// TransactionRow renders inside a table — wrap it so the DOM is valid
function renderRow(transaction, hideDate = false) {
  return render(
    <table>
      <tbody>
        <TransactionRow transaction={transaction} hideDate={hideDate} />
      </tbody>
    </table>
  );
}

const creditTx = {
  id: 'tx-1',
  type: 'credit',
  amount: 500,
  description: 'Salary deposit',
  created_at: '2024-01-15T10:00:00Z',
};

const debitTx = {
  id: 'tx-2',
  type: 'debit',
  amount: 150.5,
  description: 'Grocery store',
  created_at: '2024-01-16T14:30:00Z',
};

describe('TransactionRow', () => {
  it('renders the description', () => {
    renderRow(creditTx);
    expect(screen.getByText('Salary deposit')).toBeInTheDocument();
  });

  it('renders a credit with a + prefix', () => {
    renderRow(creditTx);
    expect(screen.getByText('+$500.00')).toBeInTheDocument();
  });

  it('renders a debit with a - prefix', () => {
    renderRow(debitTx);
    expect(screen.getByText('-$150.50')).toBeInTheDocument();
  });

  it('renders the transaction type label', () => {
    renderRow(creditTx);
    expect(screen.getByText('credit')).toBeInTheDocument();
  });

  it('renders the date when hideDate is false', () => {
    renderRow(creditTx, false);
    // The date cell should be present (rendered as formatted string)
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('hides the date cell when hideDate is true', () => {
    renderRow(creditTx, true);
    // No cell with a year number from the date
    expect(screen.queryByText(/Jan(uary)?\s+15,?\s*2024/)).not.toBeInTheDocument();
  });
});
