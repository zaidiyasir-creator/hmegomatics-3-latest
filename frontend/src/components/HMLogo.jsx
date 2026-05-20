export default function HMLogo({ size = 34, className = "" }) {
  return (
    <img
      src="/hm-logo.png"
      alt="HM Geomatics"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", objectFit: "contain" }}
      data-testid="hm-logo"
    />
  );
}
