import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TagInputPresentation = ({
  tags,
  onTagRemove,
  textareaValue,
  onTextareaChange,
  onKeyDown,
  placeholder,
  disabled,
}: TagInputProps & {
  textareaValue: string;
  onTextareaChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onTagRemove: (index: number) => void;
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1"
        >
          {tag}
          <div className="group inline-flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={() => onTagRemove(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          </div>
        </span>
      ))}
    </div>
    <Textarea
      value={textareaValue}
      onChange={(e) => onTextareaChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="min-h-[100px] resize-none"
    />
  </div>
);

const TagInputContainer = ({
  tags,
  onTagsChange,
  placeholder,
  disabled,
}: TagInputProps) => {
  const [textareaValue, setTextareaValue] = useState("");

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleTagAdd = (value: string) => {
    const emails = value
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter(
        (email) => email && validateEmail(email) && !tags.includes(email),
      );

    if (emails.length > 0) {
      onTagsChange([...tags, ...emails]);
      setTextareaValue("");
    }
  };

  const handleTagRemove = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleTagAdd(textareaValue);
    }
  };

  const handleTextareaChange = (value: string) => {
    setTextareaValue(value);

    // Auto-add tags when user types or pastes emails followed by commas or newlines
    if (value.endsWith(",") || value.endsWith("\n")) {
      handleTagAdd(value);
    }
  };

  return (
    <TagInputPresentation
      tags={tags}
      onTagsChange={onTagsChange}
      onTagRemove={handleTagRemove}
      textareaValue={textareaValue}
      onTextareaChange={handleTextareaChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default TagInputContainer;
