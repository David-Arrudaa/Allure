import { forwardRef } from "react";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "../../config/theme";

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold cursor-pointer transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap box-border shrink-0";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
