import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  user_id: string;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  restaurantId: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  restaurantId,
  placeholder,
  disabled,
  className,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [restaurantId]);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_members")
        .select(`
          user_id,
          profiles!restaurant_members_user_id_fkey(email, display_name)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (error) throw error;
      setTeamMembers((data as any) || []);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if we should show mentions dropdown
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // Show mentions if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : " ";
      if (/\s/.test(charBeforeAt) || lastAtSymbol === 0) {
        setMentionQuery(textAfterAt.toLowerCase());
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (member: TeamMember) => {
    const displayName = member.profiles.display_name || member.profiles.email.split("@")[0];
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");
    
    const newValue = 
      textBeforeCursor.slice(0, lastAtSymbol) + 
      `@${displayName} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setShowMentions(false);
    
    // Focus input after mention insertion
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = lastAtSymbol + displayName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const displayName = member.profiles.display_name || member.profiles.email;
    return displayName.toLowerCase().includes(mentionQuery);
  });

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(className)}
      />
      
      {showMentions && filteredMembers.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 border rounded-lg bg-popover shadow-lg z-50"
        >
          <ScrollArea className="max-h-48">
            <div className="p-1">
              {filteredMembers.map((member, index) => (
                <button
                  key={member.user_id}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-center gap-2 ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => insertMention(member)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <AtSign className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {member.profiles.display_name || member.profiles.email}
                    </p>
                    {member.profiles.display_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.profiles.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
