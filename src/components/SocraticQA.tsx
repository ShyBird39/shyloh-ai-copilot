import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface Category {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

interface SocraticQAProps {
  restaurantName: string;
  onBack: () => void;
}

const SocraticQA = ({ restaurantName, onBack }: SocraticQAProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Welcome! I'm here to have a thoughtful conversation about your restaurant. Think of this as a collaborative exploration—there are no wrong answers, just opportunities to uncover what makes your establishment unique. Let's start with something fundamental: What inspired you to open this restaurant?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<'sonnet' | 'opus'>('sonnet');
  const [categories] = useState<Category[]>([
    { id: '1', name: 'Culinary Philosophy', status: 'in-progress' },
    { id: '2', name: 'Ingredient Sourcing', status: 'upcoming' },
    { id: '3', name: 'Guest Experience', status: 'upcoming' },
    { id: '4', name: 'Brand Positioning', status: 'upcoming' },
    { id: '5', name: 'Future Vision', status: 'upcoming' },
  ]);
  const [insights] = useState<string[]>([
    'Exploring foundational motivations...',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "That's a fascinating perspective. Let me explore this further with you...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentQuestion = messages.filter((m) => m.role === 'ai').length;
  const totalQuestions = 8;
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="backdrop-blur-sm bg-background/10 rounded-lg p-6 mb-6 border border-primary-foreground/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-primary-foreground hover:bg-background/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
              <div className="h-8 w-px bg-primary-foreground/20" />
              <h1 className="font-oswald text-2xl text-primary-foreground">
                {restaurantName}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-primary-foreground/80 font-poppins">
                Question {currentQuestion} of {totalQuestions}
              </span>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentModel === 'sonnet'
                    ? 'bg-accent/20 text-accent-foreground border border-accent/40'
                    : 'bg-primary/20 text-primary-foreground border border-primary/40'
                }`}
              >
                {currentModel === 'sonnet' ? 'Sonnet 4.5' : 'Opus 4.1'}
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-background/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
          {/* Conversation Panel */}
          <div className="lg:col-span-3 flex flex-col backdrop-blur-sm bg-background/10 rounded-lg border border-primary-foreground/20 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`animate-fade-in ${
                    message.role === 'ai' ? 'flex justify-start' : 'flex justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'ai'
                        ? 'bg-background/10 border border-primary-foreground/20'
                        : 'bg-accent/20 border border-accent/40'
                    }`}
                  >
                    {message.role === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-xs text-primary-foreground/60 font-poppins">
                          Shyloh AI
                        </span>
                      </div>
                    )}
                    <p className="text-primary-foreground font-poppins leading-relaxed">
                      {message.content}
                    </p>
                    <span className="text-xs text-primary-foreground/40 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[80%] rounded-lg p-4 bg-background/10 border border-primary-foreground/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-primary-foreground/20">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts..."
                  className="min-h-[60px] max-h-[120px] bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-accent hover:bg-accent/80 text-accent-foreground h-[60px] px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Sidebar */}
          <div className="lg:col-span-2 space-y-6 overflow-y-auto">
            {/* Categories Progress */}
            <div className="backdrop-blur-sm bg-background/10 rounded-lg p-6 border border-primary-foreground/20">
              <h3 className="font-oswald text-lg text-primary-foreground mb-4">
                Conversation Topics
              </h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-3">
                    {category.status === 'completed' && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-foreground text-sm">✓</span>
                      </div>
                    )}
                    {category.status === 'in-progress' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground text-sm">→</span>
                      </div>
                    )}
                    {category.status === 'upcoming' && (
                      <div className="w-6 h-6 rounded-full border-2 border-primary-foreground/40 flex-shrink-0" />
                    )}
                    <span
                      className={`font-poppins ${
                        category.status === 'upcoming'
                          ? 'text-primary-foreground/40'
                          : 'text-primary-foreground'
                      }`}
                    >
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Indicator */}
            <div className="backdrop-blur-sm bg-background/10 rounded-lg p-6 border border-primary-foreground/20">
              <h3 className="font-oswald text-lg text-primary-foreground mb-2">
                AI Model
              </h3>
              <p className="text-primary-foreground/80 font-poppins text-sm">
                {currentModel === 'sonnet'
                  ? 'Using Sonnet 4.5 for efficient conversation flow'
                  : 'Using Opus 4.1 for deep strategic analysis'}
              </p>
            </div>

            {/* Key Insights */}
            <div className="backdrop-blur-sm bg-background/10 rounded-lg p-6 border border-primary-foreground/20">
              <h3 className="font-oswald text-lg text-primary-foreground mb-4">
                Emerging Insights
              </h3>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li
                    key={index}
                    className="text-primary-foreground/80 font-poppins text-sm flex items-start gap-2"
                  >
                    <span className="text-accent mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocraticQA;
