export default function RentalGallery({ rental }: any) {
  const images =
    rental.images?.length > 0
      ? rental.images
      : rental.rooms?.flatMap((r: any) => r.images);

  if (!images?.length) return null;

  return (
    <div className="bg-white  grid grid-cols-10 gap-3 aspect-[16/6]">
      <img
        src={images[0].imageUrl}
        className="col-span-7 w-230 h-80 object-contain rounded-xl"
      />
      <div className="col-span-3 grid grid-rows-3 gap-3">
        {images.slice(1, 4).map((img: any) => (
          <img
            key={img.imageUrl}
            src={img.imageUrl}
            className="w-full h-full object-cover rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
