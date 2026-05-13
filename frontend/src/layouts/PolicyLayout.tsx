import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, ConfigProvider } from "antd";
import ScrollToTop from "../components/scoll/ScrollToTop";

const PolicyLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      key: "/info/policies",
      label: "Chính sách",
    },
    {
      key: "/info/terms",
      label: "Điều khoản",
    },
    {
      key: "/info/about-us",
      label: "Về chúng tôi",
    },
  ];

  return (
    <div>
       <ScrollToTop />
      <ConfigProvider
        theme={{
          colorPrimary: "#9156F1",
          components: {
            Menu: {
              activeBarColor: "#9156F1",
              activeBarHeight: 3,
              itemSelectedColor: "#9156F1",
              itemHoverColor: "#9156F1",
              horizontalItemSelectedColor: "#9156F1",
              horizontalItemIndicatorColor: "#9156F1",
            },
          },
        }}
      >
        <div
          style={{
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 24px",
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <Link
              to="/home"
              style={{
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{
                    width: 42,
                    height: 42,
                    objectFit: "contain",
                  }}
                />

                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: "#1f1f1f",
                    lineHeight: 1,
                  }}
                >
                  Lace
                  <span style={{ color: "#9156F1" }}>Up</span>
                </span>
              </div>
            </Link>

            {/* Menu */}
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={navItems}
              onClick={(e) => navigate(e.key)}
              style={{
                borderBottom: "none",
                background: "transparent",
                fontWeight: 600,
                fontSize: 15,
                flex: 1,
                justifyContent: "center",
                marginLeft: 40,
              }}
            />
          </div>
        </div>
      </ConfigProvider>

      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default PolicyLayout;
