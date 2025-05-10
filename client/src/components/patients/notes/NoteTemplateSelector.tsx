import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { noteTemplates } from "./noteTemplates";
import { useToast } from "@/hooks/use-toast";

interface NoteTemplateSelectorProps {
  onTemplateSelect: (templateContent: string) => void;
  onAIGenerateNote?: () => void;
  disabled?: boolean;
}

export default function NoteTemplateSelector({
  onTemplateSelect,
  onAIGenerateNote,
  disabled = false,
}: NoteTemplateSelectorProps) {
  const { toast } = useToast();
  
  const handleTemplateChange = (templateId: string) => {
    const template = noteTemplates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template.content);
      toast({
        title: "Template loaded",
        description: `${template.name} template has been loaded.`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-4">
      <div className="flex-1 min-w-[200px]">
        <Select onValueChange={handleTemplateChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {noteTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {onAIGenerateNote && (
        <Button 
          variant="outline" 
          onClick={onAIGenerateNote}
          disabled={disabled}
          className="whitespace-nowrap"
        >
          Generate with AI
        </Button>
      )}
    </div>
  );
}