import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, MessageSquare, Edit2, X, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  conversation_id: string | null;
  message_id: string | null;
  sort_order: number;
  created_at: string;
}

interface TasksListProps {
  restaurantId: string;
  onNavigateToConversation?: (conversationId: string) => void;
}

function SortableTask({
  task,
  onToggleComplete,
  onUpdate,
  onDelete,
  onNavigateToConversation,
}: {
  task: Task;
  onToggleComplete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onNavigateToConversation?: (conversationId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const [showNotes, setShowNotes] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, notes: editNotes });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditNotes(task.notes || "");
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes..."
                className="text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="h-7">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                {task.conversation_id && (
                  <button
                    onClick={() => onNavigateToConversation?.(task.conversation_id!)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="View conversation"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                )}
              </div>
              {task.notes && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1 text-left"
                >
                  {showNotes ? task.notes : `${task.notes.slice(0, 50)}${task.notes.length > 50 ? "..." : ""}`}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(task.id)}
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TasksList({ restaurantId, onNavigateToConversation }: TasksListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      loadTasks();
      archiveOldTasks();
      setupRealtimeSubscription();
    }
  }, [user, restaurantId]);

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("restaurant_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load tasks");
      console.error(error);
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  };

  const archiveOldTasks = async () => {
    const { error } = await supabase.rpc("archive_completed_tasks");
    if (error) {
      console.error("Failed to archive old tasks:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tasks",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateTask = async () => {
    if (!user || !newTaskTitle.trim()) return;

    const maxSortOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sort_order)) : -1;

    const { error } = await supabase.from("restaurant_tasks").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      title: newTaskTitle.trim(),
      sort_order: maxSortOrder + 1,
    });

    if (error) {
      toast.error("Failed to create task");
      console.error(error);
    } else {
      setNewTaskTitle("");
      toast.success("Task created");
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const { error } = await supabase
      .from("restaurant_tasks")
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from("restaurant_tasks").update(updates).eq("id", id);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
    } else {
      toast.success("Task updated");
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("restaurant_tasks").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      toast.success("Task deleted");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update sort_order for all affected tasks
      const updates = newTasks.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase.from("restaurant_tasks").update({ sort_order: update.sort_order }).eq("id", update.id);
      }
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <>
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2">
          <Input
            placeholder="Add a task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {activeTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Tasks
              </h3>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onNavigateToConversation={onNavigateToConversation}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                Completed ({completedTasks.length}) {showCompleted ? "▼" : "▶"}
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onNavigateToConversation={onNavigateToConversation}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks yet. Add one above to get started!
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
