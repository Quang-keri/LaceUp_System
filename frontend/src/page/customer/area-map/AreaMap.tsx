import { useRef, useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input, Button } from "antd";
import {
  SearchOutlined,
  UnorderedListOutlined,
  AimOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { MdSportsTennis, MdSportsVolleyball } from "react-icons/md";
import { IoFootball } from "react-icons/io5";
import { GiShuttlecock } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

import rentalService from "../../../service/rental/rentalService";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface RentalAreaMap {
  rentalAreaId: string;
  rentalAreaName: string;
  latitude: number;
  longitude: number;
  address: { street: string; ward: string; cityName?: string };
  courtResponses?: {
    category?: {
      categoryId: number;
      categoryName: string;
    };
  }[];
}

const AreaMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate(); // Khởi tạo hook navigate

  const [lng, setLng] = useState(106.65421);
  const [lat, setLat] = useState(10.80155);
  const [zoom, setZoom] = useState(13);

  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [allAreas, setAllAreas] = useState<RentalAreaMap[]>([]);

  const categories = [
    "Tất cả",
    "Pickleball",
    "Cầu lông",
    "Bóng đá",
    "Quần vợt",
    "Bóng chuyền",
  ];

  const fetchAreasInBounds = useCallback(
    async (bounds: mapboxgl.LngLatBounds) => {
      try {
        const minLng = bounds.getWest();
        const minLat = bounds.getSouth();
        const maxLng = bounds.getEast();
        const maxLat = bounds.getNorth();

        const resData = await rentalService.getAllRentalAreas(
          1,
          50,
          undefined,
          undefined,
          undefined,
          undefined,
          minLat,
          maxLat,
          minLng,
          maxLng,
        );

        if (resData.code === 200 && resData.result?.data) {
          setAllAreas(resData.result.data);
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu sân:", error);
      }
    },
    [],
  );

  const getCategoryTheme = (area: RentalAreaMap) => {
    const categoryName =
      area.courtResponses?.[0]?.category?.categoryName?.toLowerCase() || "";

    if (categoryName.includes("cầu lông"))
      return { color: "#f97316", icon: <GiShuttlecock /> }; // Cam
    if (categoryName.includes("pickleball"))
      return { color: "#9333ea", icon: <MdSportsTennis /> }; // Tím
    if (categoryName.includes("bóng đá"))
      return { color: "#22c55e", icon: <IoFootball /> };
    if (categoryName.includes("quần vợt"))
      return { color: "#eab308", icon: <MdSportsTennis /> };
    if (categoryName.includes("bóng chuyền"))
      return { color: "#3b82f6", icon: <MdSportsVolleyball /> };

    return { color: "#6b7280", icon: <EnvironmentOutlined /> };
  };

  const renderMarkers = useCallback(
    (areas: RentalAreaMap[]) => {
      const currentMap = map.current;
      if (!currentMap) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      areas.forEach((area) => {
        if (!area.latitude || !area.longitude) return;

        const theme = getCategoryTheme(area);

        const markerNode = document.createElement("div");
        const markerRoot = createRoot(markerNode);

        markerRoot.render(
          <div
            className="custom-marker"
            style={{
              backgroundColor: theme.color,
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "18px",
              color: "white",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.15)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {theme.icon}
          </div>,
        );

        const popupNode = document.createElement("div");
        const popupRoot = createRoot(popupNode);

        popupRoot.render(
          <div style={{ padding: "5px", minWidth: "160px" }}>
            <h4
              style={{
                margin: "0 0 5px 0",
                color: theme.color,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {theme.icon} <span>{area.rentalAreaName}</span>
            </h4>
            <p
              style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#666" }}
            >
              {area.address?.street || ""} {area.address?.ward || ""}
            </p>
            <Button
              type="primary"
              block
              style={{
                backgroundColor: theme.color,
                borderColor: theme.color,
                fontWeight: "bold",
              }}
              onClick={() => navigate(`/rental-area/${area.rentalAreaId}`)} // Thêm chuyển hướng tại đây
            >
              Xem chi tiết
            </Button>
          </div>,
        );

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(
          popupNode,
        );

        const marker = new mapboxgl.Marker(markerNode)
          .setLngLat([area.longitude, area.latitude])
          .setPopup(popup)
          .addTo(currentMap);

        markersRef.current.push(marker);
      });
    },
    [navigate],
  );

  useEffect(() => {
    let filteredAreas = allAreas;

    if (activeFilter !== "Tất cả") {
      filteredAreas = allAreas.filter((area) => {
        if (!area.courtResponses || area.courtResponses.length === 0)
          return false;
        return area.courtResponses.some((court) =>
          court.category?.categoryName
            .toLowerCase()
            .includes(activeFilter.toLowerCase()),
        );
      });
    }

    renderMarkers(filteredAreas);
  }, [allAreas, activeFilter, renderMarkers]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/sondxse24/cmpk0fp8l001a01s8hztxckr9",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("load", () => {
      if (map.current) {
        const bounds = map.current.getBounds();
        if (bounds) fetchAreasInBounds(bounds);
      }
    });

    map.current.on("moveend", () => {
      if (map.current) {
        setLng(Number(map.current.getCenter().lng.toFixed(4)));
        setLat(Number(map.current.getCenter().lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));

        const bounds = map.current.getBounds();
        if (bounds) fetchAreasInBounds(bounds);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [fetchAreasInBounds, lat, lng, zoom]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 80px)",
        overflow: "hidden",
      }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          display: "flex",
          gap: "15px",
          zIndex: 10,
          alignItems: "center",
        }}
      >
        <Input
          prefix={
            <SearchOutlined style={{ color: "#f97316", fontSize: "16px" }} />
          }
          placeholder="Tìm kiếm sân quanh đây..."
          style={{
            width: "350px",
            borderRadius: "30px",
            padding: "10px 20px",
            border: "none",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            fontSize: "15px",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "5px",
            scrollbarWidth: "none",
          }}
        >
          {categories.map((cat) => (
            <Button
              key={cat}
              type={activeFilter === cat ? "primary" : "default"}
              onClick={() => setActiveFilter(cat)}
              style={{
                borderRadius: "30px",
                height: "auto",
                padding: "8px 16px",
                backgroundColor: activeFilter === cat ? "white" : "white",
                borderColor: activeFilter === cat ? "#f97316" : "#e5e7eb",
                color: activeFilter === cat ? "#f97316" : "#4b5563",
                fontWeight: activeFilter === cat ? "bold" : "normal",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "30px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          zIndex: 10,
        }}
      >
        <Button
          type="primary"
          shape="circle"
          icon={<UnorderedListOutlined />}
          size="large"
          style={{
            width: "50px",
            height: "50px",
            backgroundColor: "#9333ea",
            borderColor: "#9333ea",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            fontSize: "20px",
          }}
        />
        <Button
          shape="circle"
          icon={<AimOutlined />}
          size="large"
          style={{
            width: "50px",
            height: "50px",
            color: "#9333ea",
            border: "none",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            fontSize: "20px",
          }}
        />
      </div>
    </div>
  );
};

export default AreaMap;
