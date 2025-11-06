import { VoiceCapture } from '../VoiceCapture';

interface MobileManagerLogProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
}

export const MobileManagerLog = ({
  restaurantId,
  shiftDate,
  shiftType,
}: MobileManagerLogProps) => {
  return (
    <VoiceCapture
      restaurantId={restaurantId}
      shiftDate={shiftDate}
      shiftType={shiftType}
      isMobile={true}
    />
  );
};
