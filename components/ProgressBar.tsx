export default function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`progress-track h-2.5 w-full ${className}`}>
      <div className="progress-fill h-full" style={{ width: `${v}%` }} />
    </div>
  );
}
