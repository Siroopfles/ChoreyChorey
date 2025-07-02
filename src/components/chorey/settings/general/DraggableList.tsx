'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

// Sub-component for a single draggable item
function SortableItem({ id, children, disabled }: { id: string; children: ReactNode, disabled: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button type="button" {...attributes} {...listeners} className="cursor-grab p-1 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Versleep om te sorteren" disabled={disabled}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Main reusable list component
interface DraggableListProps<T> {
  items: (T & { id: string | number })[];
  onMove: (oldIndex: number, newIndex: number) => void;
  renderItem: (item: T & { id: string | number }, index: number) => ReactNode;
  disabled?: boolean;
}

export function DraggableList<T>({
  items,
  onMove,
  renderItem,
  disabled = false,
}: DraggableListProps<T & { id: string | number }>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => String(item.id) === active.id);
      const newIndex = items.findIndex((item) => String(item.id) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onMove(oldIndex, newIndex);
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => String(i.id))} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem key={item.id} id={String(item.id)} disabled={disabled}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
