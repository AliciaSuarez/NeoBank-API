import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AccountCard from '../../components/AccountCard';

const mockAccount = {
  id: 'acc-123',
  account_number: 'ACC-000001',
  type: 'checking',
  balance: 2500.75,
  currency: 'USD',
  status: 'active',
};

function renderCard(account = mockAccount) {
  return render(
    <MemoryRouter>
      <AccountCard account={account} />
    </MemoryRouter>
  );
}

describe('AccountCard', () => {
  it('renders the account number', () => {
    renderCard();
    expect(screen.getByText('ACC-000001')).toBeInTheDocument();
  });

  it('renders the account type', () => {
    renderCard();
    expect(screen.getByText('checking')).toBeInTheDocument();
  });

  it('renders the formatted balance', () => {
    renderCard();
    expect(screen.getByText('$2,500.75')).toBeInTheDocument();
  });

  it('renders the currency', () => {
    renderCard();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('shows "active" status chip', () => {
    renderCard();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows "closed" status chip for a closed account', () => {
    renderCard({ ...mockAccount, status: 'closed' });
    expect(screen.getByText('closed')).toBeInTheDocument();
  });
});
