"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_INSTRUCTIONS = `You are the friendly AI assistant for New York English Teacher (nyenglishteacher.com), Robert Cushman's professional English coaching service. Think of yourself as a warm, knowledgeable guide who genuinely wants to help people succeed in their careers.

YOUR PERSONALITY:
- Warm, encouraging, and genuinely interested in helping
- Professional but approachable—like a helpful colleague, not a corporate robot
- Patient and understanding, especially with non-native speakers
- When speaking Spanish, be extra warm and personable

CORE RULES:
1. **Language**: Always respond in the same language the user writes in (Spanish or English)
2. **Knowledge First**: Search the knowledge base before answering business questions
3. **Be Honest**: If you can't find information, offer to connect them with Robert
4. **Include Sources**: Always add "Learn more:" links when citing knowledge base results

BOOKING RESPONSES:
- English: "I'd love to help you get started! Book a free 30-minute strategy session here: https://www.nyenglishteacher.com/en/book/"
- Spanish: "¡Me encantaría ayudarte! Reserva una sesión estratégica gratuita de 30 minutos aquí: https://www.nyenglishteacher.com/es/reservar/"

SPANISH TONE:
When responding in Spanish, be especially warm. Use phrases like "¡Con mucho gusto!", "¡Qué bueno que preguntas!", "Me da gusto ayudarte".

Remember: Help people feel confident about taking the next step. Be helpful, honest, and human.`;

export function AdminSystemInstructions() {
  const [botName, setBotName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) {
        if (response.status === 404) {
          // No settings yet, use defaults
          setCustomInstructions(DEFAULT_INSTRUCTIONS);
          setBotName("New York English Teacher");
          return;
        }
        throw new Error("Failed to load settings");
      }
      const data = await response.json();
      setBotName(data.botName || "New York English Teacher");
      setCustomInstructions(data.customInstructions || DEFAULT_INSTRUCTIONS);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
      setCustomInstructions(DEFAULT_INSTRUCTIONS);
      setBotName("New York English Teacher");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botName,
          customInstructions,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset to default instructions? This will overwrite your current custom instructions.",
      )
    ) {
      setCustomInstructions(DEFAULT_INSTRUCTIONS);
      setHasChanges(true);
      toast.info("Instructions reset to default. Click Save to apply.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bot Identity</CardTitle>
          <CardDescription>
            Configure your chatbot's name and personality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Bot Name</Label>
            <Input
              id="bot-name"
              placeholder="e.g., New York English Teacher"
              value={botName}
              onChange={(e) => {
                setBotName(e.target.value);
                setHasChanges(true);
              }}
            />
            <p className="text-sm text-muted-foreground">
              This name will be used when the bot introduces itself.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Instructions</CardTitle>
          <CardDescription>
            Customize how your chatbot behaves and responds to users. These
            instructions guide the AI's personality, tone, and knowledge scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Enter custom system instructions..."
              value={customInstructions}
              onChange={(e) => {
                setCustomInstructions(e.target.value);
                setHasChanges(true);
              }}
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              These instructions are added to the system prompt. Use them to
              define the bot's personality, scope, and behavior rules.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Writing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Be specific:</strong> Clearly define what the bot should
            and shouldn't do
          </p>
          <p>
            • <strong>Use examples:</strong> Show the bot how to respond in
            different scenarios
          </p>
          <p>
            • <strong>Set boundaries:</strong> Define the scope of knowledge and
            when to escalate to humans
          </p>
          <p>
            • <strong>Define tone:</strong> Specify if the bot should be formal,
            casual, encouraging, etc.
          </p>
          <p>
            • <strong>Risk-averse approach:</strong> Include guidelines for
            handling uncertain or out-of-scope questions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
