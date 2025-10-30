import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftLogEntry } from "@/components/ShiftLogEntry";
import { ShiftSummaryView } from "@/components/ShiftSummaryView";
import { ShiftLogSearch } from "@/components/ShiftLogSearch";
import { Calendar, BookOpen, Search } from "lucide-react";

interface ShiftLogPanelProps {
  restaurantId: string;
}

export function ShiftLogPanel({ restaurantId }: ShiftLogPanelProps) {
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState<'lunch' | 'dinner'>('dinner');

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background p-4 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Manager Shift Log</h2>
          <p className="text-sm text-muted-foreground">
            Document shift events, generate summaries, and search historical data
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Shift Date</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Shift Type</label>
            <Select value={shiftType} onValueChange={(val) => setShiftType(val as 'lunch' | 'dinner')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="entry" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
          <TabsTrigger value="entry" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Log Entry
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <Calendar className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="entry" className="mt-0">
            <ShiftLogEntry
              restaurantId={restaurantId}
              shiftDate={shiftDate}
              shiftType={shiftType}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <ShiftSummaryView
              restaurantId={restaurantId}
              shiftDate={shiftDate}
              shiftType={shiftType}
            />
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <ShiftLogSearch restaurantId={restaurantId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
