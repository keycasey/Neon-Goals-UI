import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WishlistView } from './WishlistView';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';

describe('WishlistView', () => {
  beforeEach(() => {
    useWishlistStore.getState().resetStore();
    useAuthStore.setState({ isDemoMode: true });
  });

  it('captures a tentative purchase without requiring product research fields', async () => {
    render(<WishlistView />);

    fireEvent.change(screen.getByLabelText('Wishlist item'), { target: { value: 'Bidet' } });
    fireEvent.change(screen.getByLabelText('Wishlist notes'), { target: { value: 'Warm water preferred' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Bidet')).toBeInTheDocument();
    expect(screen.getByText('Warm water preferred')).toBeInTheDocument();
    expect(useWishlistStore.getState().items[0]).toMatchObject({
      title: 'Bidet',
      stage: 'idea',
      priority: 'interested',
    });
  });
});
