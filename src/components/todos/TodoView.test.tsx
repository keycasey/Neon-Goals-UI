import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TodoView } from './TodoView';
import { useTodoStore } from '@/store/useTodoStore';
import { useAuthStore } from '@/store/useAuthStore';

describe('TodoView', () => {
  beforeEach(() => {
    useTodoStore.getState().resetStore();
    useAuthStore.setState({ isDemoMode: true });
  });

  it('captures and completes a lightweight action', async () => {
    render(<TodoView />);
    fireEvent.change(screen.getByLabelText('New todo'), { target: { value: 'Dusting' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Dusting')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Mark Dusting complete'));
    expect(useTodoStore.getState().items[0]).toMatchObject({ title: 'Dusting', status: 'completed' });
  });
});
