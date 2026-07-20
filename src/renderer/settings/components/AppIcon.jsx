import React from 'react';
import { Loader2 } from 'lucide-react';

/** App icon — spinner while loading, letter only when load failed or icon missing. */
export default function AppIcon({
  src,
  name,
  size = 40,
  className = '',
  fill = false,
  loading = false,
}) {
  const [failed, setFailed] = React.useState(false);
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?';

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const boxStyle = fill ? undefined : { width: size, height: size };
  const spinnerSize = Math.max(14, Math.round(size * 0.45));

  if (loading && !src) {
    return (
      <span
        className={`app-icon-loading ${className}`.trim()}
        style={boxStyle}
        aria-hidden="true"
      >
        <Loader2
          className="app-icon-spinner spin"
          size={fill ? 16 : spinnerSize}
        />
      </span>
    );
  }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        {...(fill ? {} : { width: size, height: size })}
        className={`app-icon-img ${className}`.trim()}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`app-icon-fallback ${className}`.trim()}
      style={
        fill
          ? undefined
          : { width: size, height: size, fontSize: Math.round(size * 0.42) }
      }
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
