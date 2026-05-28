import { Images } from "lucide-react";

type ProfileGalleryProps = {
  images: string[];
};

export function ProfileGallery({ images }: ProfileGalleryProps) {
  const visibleImages = images.filter(Boolean).slice(0, 6);

  return (
    <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.06)] sm:p-7">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#201a2f]">
        <Images size={23} className="text-[#a45413]" />
        Gallery
      </h2>

      {visibleImages.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleImages.map((image, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${image}-${idx}`}
              src={image}
              alt={`Gallery ${idx + 1}`}
              className="aspect-[4/3] w-full rounded-xl border border-[#ebe7ef] object-cover shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#ebe7ef] bg-[#fcfaff] px-4 py-6 text-sm font-medium text-[#7d7288]">
          No gallery added yet.
        </div>
      )}
    </section>
  );
}
