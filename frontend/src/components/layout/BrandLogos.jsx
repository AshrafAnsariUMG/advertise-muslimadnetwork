'use client';

/**
 * "Trusted by" brand logo strip — placeholder layout.
 *
 * Drop real logo files into `frontend/public/brands/` (e.g. `brand-1.svg`)
 * and replace the placeholder <div> tiles with <img> tags. Kept as neutral
 * grey tiles for now so the layout reserves space without shipping fake
 * brand marks.
 */
const PLACEHOLDER_COUNT = 5;

export default function BrandLogos() {
  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-60">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 rounded bg-gray-200/70"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
