import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TagInputPresentation = ({
  tags,

  onTagRemove,
  inputValue,
  onInputChange,
  onKeyDown,
  placeholder,
  disabled,
}: TagInputProps & {
  inputValue: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (index: number) => void;
}) => (
  <div className="flex min-h-[80px] w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
    {tags.map((tag, index) => (
      <span
        key={index}
        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1"
      >
        {tag}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          onClick={() => onTagRemove(index)}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      </span>
    ))}
    <input
      type="text"
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
    />
  </div>
);

const TagInputContainer = ({
  tags,
  onTagsChange,
  placeholder,
  disabled,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleTagAdd = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && validateEmail(trimmedTag) && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue("");
  };

  const handleTagRemove = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleTagAdd(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  return (
    <TagInputPresentation
      tags={tags}
      onTagsChange={onTagsChange}
      onTagAdd={handleTagAdd}
      onTagRemove={handleTagRemove}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default TagInputContainer;
