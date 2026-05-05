import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableOption = {
  value: number | string | null;
  label: string;
  avatar?: string;
};

type Props = {
  value: SearchableOption | null;
  options: SearchableOption[];
  onChange: (option: SearchableOption) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
};

const optionKey = (option: SearchableOption) =>
  option.value === null ? "__null__" : String(option.value);

const renderAvatar = (option: SearchableOption) => {
  if (option.avatar) {
    return (
      <img
        src={option.avatar}
        alt=""
        className="searchable-select-avatar"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
    );
  }

  const initial = option.label?.charAt(0)?.toUpperCase() || "?";
  return (
    <span className="searchable-select-avatar searchable-select-avatar-fallback">
      {initial}
    </span>
  );
};

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = "",
  emptyLabel = "",
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(trimmed)
    );
  }, [options, query]);

  const selectedKey = value ? optionKey(value) : "";

  const toggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setQuery("");
  };

  const handleSelect = (option: SearchableOption) => {
    onChange(option);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={rootRef}
      className={`searchable-select ${
        disabled ? "searchable-select-disabled" : ""
      } ${isOpen ? "searchable-select-open" : ""}`}
    >
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={toggle}
        disabled={disabled}
      >
        {value ? (
          <span className="searchable-select-value">
            {renderAvatar(value)}
            <span className="searchable-select-label">{value.label}</span>
          </span>
        ) : (
          <span className="searchable-select-placeholder">{placeholder}</span>
        )}
        <span className="searchable-select-arrow" aria-hidden="true">
          ⌄
        </span>
      </button>

      {isOpen && !disabled ? (
        <div className="searchable-select-menu" role="listbox">
          <div className="searchable-select-search">
            <input
              ref={inputRef}
              type="text"
              className="searchable-select-input"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="searchable-select-list">
            {filtered.length === 0 ? (
              <div className="searchable-select-empty">{emptyLabel}</div>
            ) : (
              filtered.map((option) => {
                const key = optionKey(option);
                const isActive = key === selectedKey;
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`searchable-select-option ${
                      isActive ? "searchable-select-option-active" : ""
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {renderAvatar(option)}
                    <span className="searchable-select-label">
                      {option.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
