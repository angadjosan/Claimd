import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface DynamicArrayFieldProps<T> {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addButtonLabel?: string;
  emptyMessage?: string;
}

export function DynamicArrayField<T>({
  title,
  items,
  onAdd,
  onRemove,
  renderItem,
  addButtonLabel = 'Add Item',
  emptyMessage = 'No items added yet.'
}: DynamicArrayFieldProps<T>) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          {addButtonLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                title="Remove"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <div className="pr-8">
                {renderItem(item, index)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
