export const fmt0 = v =>
  isFinite(v) ? Math.round(v).toLocaleString() : "-";

export const fmt2 = v =>
  isFinite(v)
    ? Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    : "-";
