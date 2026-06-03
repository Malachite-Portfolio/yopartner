type VerifiedPartnerBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

export function VerifiedPartnerBadge({ size = "sm", className = "" }: VerifiedPartnerBadgeProps) {
  const sizeClass = size === "md" ? "h-7 w-7" : "h-5 w-5";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/badge.png"
      alt="Verified partner"
      title="Verified partner"
      className={`${sizeClass} inline-block shrink-0 align-middle object-contain ${className}`.trim()}
    />
  );
}
