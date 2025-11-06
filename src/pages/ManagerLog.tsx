import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileManagerLog } from '@/components/manager-log/mobile/MobileManagerLog';
import { DesktopLayout } from '@/components/manager-log/desktop/DesktopLayout';
import { VoiceMemo } from '@/types/voice-memo';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

const SHIFT_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'late_night', label: 'Late Night' },
];

const ManagerLog = () => {
  const navigate = useNavigate();
  const { id: restaurantId } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [shiftDate, setShiftDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shiftType, setShiftType] = useState('dinner');
  const [memos, setMemos] = useState<VoiceMemo[]>([]);

  useEffect(() => {
    fetchMemos();
  }, [restaurantId, shiftDate, shiftType]);

  // Poll for transcription updates
  useEffect(() => {
    const hasPending = memos.some(m => m.transcription_status === 'pending' || m.transcription_status === 'processing');
    
    if (hasPending) {
      const interval = setInterval(fetchMemos, 3000);
      return () => clearInterval(interval);
    }
  }, [memos]);

  const fetchMemos = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('shift_date', shiftDate)
      .eq('shift_type', shiftType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memos:', error);
    } else {
      setMemos(data || []);
    }
  };

  if (!restaurantId) {
    return <div>Restaurant ID required</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/restaurant/${restaurantId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manager Log</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(shiftDate), 'EEEE, MMMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Shift Type Selector */}
        <div className="flex gap-2 flex-wrap">
          {SHIFT_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={shiftType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShiftType(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          <MobileManagerLog
            restaurantId={restaurantId}
            shiftDate={shiftDate}
            shiftType={shiftType}
          />
        ) : (
          <DesktopLayout
            restaurantId={restaurantId}
            shiftDate={shiftDate}
            shiftType={shiftType}
            memos={memos}
            onMemosUpdate={fetchMemos}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerLog;
