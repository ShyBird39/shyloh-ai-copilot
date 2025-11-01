import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { VoiceCapture } from '@/components/manager-log/VoiceCapture';
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
  const [shiftDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shiftType, setShiftType] = useState('dinner');

  if (!restaurantId) {
    return <div>Restaurant ID required</div>;
  }

  return (
    <div className="min-h-screen bg-shyloh-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/restaurant/${restaurantId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-shyloh-text">Manager Log</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(shiftDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Shift Type Selector */}
            <div className="flex gap-2">
              {SHIFT_TYPES.map((shift) => (
                <Button
                  key={shift.value}
                  variant={shiftType === shift.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShiftType(shift.value)}
                  className={
                    shiftType === shift.value
                      ? 'bg-shyloh-primary hover:bg-shyloh-primary/90'
                      : ''
                  }
                >
                  {shift.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto">
        <VoiceCapture
          restaurantId={restaurantId}
          shiftDate={shiftDate}
          shiftType={shiftType}
        />
      </div>
    </div>
  );
};

export default ManagerLog;
