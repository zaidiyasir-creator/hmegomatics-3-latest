export default function HMLogo({ size = 34, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HM Geomatics"
      data-testid="hm-logo"
    >
      <circle
        cx="30"
        cy="30"
        r="27"
        fill="#0A0A0A"
        stroke="#909090"
        strokeWidth="1.5"
      />
      <path
        d="M30 7 C50 7 53 30 30 30 C7 30 10 53 30 53"
        fill="none"
        stroke="#C9932A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="19"
        y="36"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fontSize="18"
        fontWeight="700"
        fill="#C9932A"
      >
        H
      </text>
      <text
        x="32"
        y="36"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fontSize="18"
        fontWeight="700"
        fill="#A8A8A8"
      >
        M
      </text>
    </svg>
  );
}
