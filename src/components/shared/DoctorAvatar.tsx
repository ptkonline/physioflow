"use client";

export function DoctorAvatar({
  name,
  photoUrl,
  size = 64,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (!photoUrl) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-2xl bg-sage font-semibold text-teal-dark"
        style={{ width: size, height: size, fontSize: size / 2.6 }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-2xl object-cover"
      style={{ width: size, height: size }}
    />
  );
}
