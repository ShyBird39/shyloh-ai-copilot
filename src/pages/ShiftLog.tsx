import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, FileText, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ShiftLogEntry } from "@/components/ShiftLogEntry";
import { ShiftSummaryView } from "@/components/ShiftSummaryView";
import { ShiftLogSearch } from "@/components/ShiftLogSearch";

const ShiftLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState<"lunch" | "dinner">("dinner");

  if (!id) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1200px] mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/restaurant/${id}`)}
          className="mb-6 text-foreground hover:bg-accent/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <Card className="bg-card border-border p-8 rounded-2xl shadow-card">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[42px] font-bold text-primary mb-3">
              Manager Shift Log
            </h1>
            <p className="text-card-foreground text-lg mb-6">
              Document your shift, generate AI summaries, and search historical records
            </p>

            {/* Date and Shift Type Selector */}
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-sm text-card-foreground/70 mb-1 block">
                  Shift Date
                </label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-input bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-card-foreground/70 mb-1 block">
                  Shift Type
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as "lunch" | "dinner")}
                  className="px-3 py-2 rounded-md border border-input bg-background text-foreground"
                >
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="entry" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="entry">
                <ClipboardList className="w-4 h-4 mr-2" />
                Log Entry
              </TabsTrigger>
              <TabsTrigger value="summary">
                <FileText className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entry" className="space-y-4">
              <ShiftLogEntry
                restaurantId={id}
                shiftDate={shiftDate}
                shiftType={shiftType}
              />
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <ShiftSummaryView
                restaurantId={id}
                shiftDate={shiftDate}
                shiftType={shiftType}
              />
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <ShiftLogSearch restaurantId={id} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ShiftLog;
