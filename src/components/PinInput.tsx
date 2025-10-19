import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PinInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinSubmit: (pin: string) => void;
  mode: "set" | "verify";
  isLoading?: boolean;
}

export const PinInput = ({ open, onOpenChange, onPinSubmit, mode, isLoading }: PinInputProps) => {
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when opening
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [open]);

  // Clear PIN when dialog closes
  useEffect(() => {
    if (!open) {
      setPin(["", "", "", "", "", ""]);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullPin = [...newPin.slice(0, 5), value].join("");
      if (fullPin.length === 6) {
        onPinSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newPin = [...pin];
    
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    
    setPin(newPin);
    
    if (pastedData.length === 6) {
      onPinSubmit(pastedData);
    } else if (pastedData.length < 6) {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullPin = pin.join("");
    if (fullPin.length === 6) {
      onPinSubmit(fullPin);
    }
  };

  const handleReset = () => {
    setPin(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {mode === "set" ? "Set Your PIN" : "Enter PIN"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "set" 
              ? "Create a 6-digit PIN to secure your tuning settings"
              : "Enter your 6-digit PIN to access tuning settings"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="flex gap-2" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold"
                disabled={isLoading}
              />
            ))}
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pin.join("").length !== 6 || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : mode === "set" ? "Set PIN" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
