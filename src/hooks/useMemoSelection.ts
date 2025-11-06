import { useState, useCallback } from 'react';

export const useMemoSelection = () => {
  const [selectedMemoIds, setSelectedMemoIds] = useState<Set<string>>(new Set());

  const toggleMemo = useCallback((memoId: string) => {
    setSelectedMemoIds(prev => {
      const next = new Set(prev);
      if (next.has(memoId)) {
        next.delete(memoId);
      } else {
        next.add(memoId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((memoIds: string[]) => {
    setSelectedMemoIds(new Set(memoIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMemoIds(new Set());
  }, []);

  const isSelected = useCallback((memoId: string) => {
    return selectedMemoIds.has(memoId);
  }, [selectedMemoIds]);

  return {
    selectedMemoIds: Array.from(selectedMemoIds),
    selectedCount: selectedMemoIds.size,
    toggleMemo,
    selectAll,
    clearSelection,
    isSelected,
  };
};
