import React, { useState, useEffect, useRef } from "react";

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = "",
  style = {},
  placeholder = "Nhập văn bản...",
  tag: Tag = "span",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(value);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCurrentText(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      const text = textRef.current.innerText.trim();
      const finalVal = text || placeholder;
      setCurrentText(finalVal);
      onChange(finalVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textRef.current?.blur();
    }
  };

  return (
    <Tag
      ref={textRef as any}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title="Click để chỉnh sửa nội dung"
      className={`inline-block transition-colors ${
        isEditing
          ? "bg-red-50/50 ring-1 ring-red-400 rounded-sm"
          : "hover:bg-amber-100/30 rounded-xs"
      } ${className}`}
      style={style}
    >
      {currentText || placeholder}
    </Tag>
  );
};
