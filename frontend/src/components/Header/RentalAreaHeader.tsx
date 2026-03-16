export default function RentalAreaHeader({ data }: any) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <img
        src={data.images?.[0]?.imageUrl}
        style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
      />

      <h1>{data.rentalAreaName}</h1>

      <p>{data.address}</p>

      <p>{data.city.cityName}</p>

      <p>
        Liên hệ: {data.contactName} - {data.contactPhone}
      </p>
    </div>
  );
}
