import { useParams, useNavigate } from 'react-router-dom';
import { SpecialistChatPanel } from '@/components/chat/SpecialistChatPanel';
import type { CategoryId } from '@/components/chat/SpecialistChatPanel';

const CATEGORY_CONFIG: Record<string, { name: string; icon: string }> = {
  items: { name: 'Items', icon: '🛍️' },
  finances: { name: 'Finances', icon: '💰' },
  actions: { name: 'Actions', icon: '🎯' },
};

export const ChatPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const config = CATEGORY_CONFIG[categoryId || ''];

  if (!categoryId || !config) {
    navigate('/');
    return null;
  }

  return (
    <div className="h-full w-full">
      <SpecialistChatPanel
        categoryId={categoryId as CategoryId}
        categoryName={config.name}
        categoryIcon={config.icon}
      />
    </div>
  );
};
