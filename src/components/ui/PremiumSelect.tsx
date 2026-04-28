import { useState } from "react";

export type PremiumSelectValue = number | string;

export type PremiumSelectOption = {
  value: PremiumSelectValue;
  label: string;
};

type Props = {
  value: PremiumSelectValue;
  options: PremiumSelectOption[];
  placeholder: string;
  onChange: (value: PremiumSelectValue) => void;
  disabled?: boolean;
  includePlaceholderOption?: boolean;
};

export default function PremiumSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  includePlaceholderOption = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div
      className={`admin-premium-select ${
        disabled ? "admin-premium-select-disabled" : ""
      }`}
    >
      <button
        type="button"
        className={`admin-premium-select-trigger ${
          isOpen ? "admin-premium-select-trigger-open" : ""
        } ${disabled ? "admin-premium-select-trigger-disabled" : ""}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="admin-premium-select-arrow">⌄</span>
      </button>

      {isOpen && !disabled ? (
        <div className="admin-premium-select-menu">
          {includePlaceholderOption ? (
            <button
              type="button"
              className={`admin-premium-select-option ${
                !selectedOption ? "admin-premium-select-option-active" : ""
              }`}
              onClick={() => {
                onChange(0);
                setIsOpen(false);
              }}
            >
              {placeholder}
            </button>
          ) : null}

          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`admin-premium-select-option ${
                String(value) === String(option.value)
                  ? "admin-premium-select-option-active"
                  : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
