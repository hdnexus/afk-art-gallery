import React, { useEffect, useState } from "react";

const galleryStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "32px",
  maxWidth: 1400,
  margin: "0 auto",
  padding: "60px 32px 80px",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#e8e8e8",
  backgroundColor: "#0a0a0a",
  minHeight: "100vh",
};

const itemStyles = {
  cursor: "pointer",
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  backgroundColor: "#151515",
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  position: "relative",
};

const itemHoverStyles = {
  transform: "translateY(-8px)",
  boxShadow:
    "0 20px 40px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.5)",
  borderColor: "rgba(99, 102, 241, 0.5)",
};

const imageStyles = {
  width: "100%",
  height: 240,
  objectFit: "cover",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  flexShrink: 0,
  filter: "brightness(0.85) contrast(1.05)",
  transition: "all 0.4s ease",
  backgroundColor: "#1a1a1a",
};

const nameStyles = {
  padding: "20px 20px",
  fontSize: 16,
  fontWeight: "500",
  textAlign: "center",
  color: "#ffffff",
  letterSpacing: "0.01em",
  backgroundColor: "#151515",
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  userSelect: "none",
  lineHeight: 1.5,
};

const overlayStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.96)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1100,
  cursor: "pointer",
  padding: "40px",
  backdropFilter: "blur(12px)",
};

const overlayImageStyles = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: 16,
  boxShadow: "0 0 80px rgba(99, 102, 241, 0.4), 0 0 120px rgba(0, 0, 0, 0.8)",
  transition: "transform 0.3s ease",
};

const spinnerStyles = {
  marginTop: 140,
  fontSize: 20,
  color: "#666",
  textAlign: "center",
  fontWeight: "400",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const loadMoreButtonStyles = {
  display: "block",
  margin: "60px auto 80px",
  padding: "16px 48px",
  fontSize: 15,
  fontWeight: "600",
  backgroundColor: "#6366f1",
  color: "#ffffff",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  userSelect: "none",
  boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
  transition: "all 0.3s ease",
  letterSpacing: "0.02em",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const loadMoreButtonHoverStyles = {
  backgroundColor: "#4f46e5",
  boxShadow: "0 12px 32px rgba(99, 102, 241, 0.5)",
  transform: "translateY(-2px)",
};

export default function App() {
  const [data, setData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadMoreHover, setLoadMoreHover] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.fontFamily =
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.backgroundColor = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const ITEMS_PER_PAGE = 30;
  const pagedData = data.slice(0, ITEMS_PER_PAGE * page);

  if (loading) return <div style={spinnerStyles}>Loading gallery...</div>;

  return (
    <>
      <h1
        style={{
          textAlign: "center",
          marginTop: 0,
          paddingTop: 60,
          marginBottom: 0,
          fontWeight: "700",
          fontSize: 56,
          color: "#ffffff",
          letterSpacing: "0.02em",
          userSelect: "none",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow:
            "0 0 40px rgba(99, 102, 241, 0.5), 0 0 80px rgba(167, 139, 250, 0.3)",
          animation: "glow 3s ease-in-out infinite alternate",
        }}
      >
        AFK Art Contest
      </h1>

      <style>
        {`
          @keyframes glow {
            0% {
              filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
            }
            100% {
              filter: drop-shadow(0 0 40px rgba(167, 139, 250, 0.6));
            }
          }
        `}
      </style>

      <div style={galleryStyles}>
        {pagedData.map(({ img, name }, idx) => (
          <div
            key={img + idx}
            style={{
              ...itemStyles,
              ...(hoveredIndex === idx ? itemHoverStyles : {}),
            }}
            onClick={() => setExpandedImage({ img, name })}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setExpandedImage({ img, name });
            }}
            aria-label={`View image: ${name}`}
          >
            <img
              src={img}
              alt={name}
              style={{
                ...imageStyles,
                filter:
                  hoveredIndex === idx
                    ? "brightness(1) contrast(1.1)"
                    : "brightness(0.85) contrast(1.05)",
              }}
              loading="lazy"
            />
            <div style={nameStyles}>{name}</div>
          </div>
        ))}
      </div>

      {pagedData.length < data.length && (
        <button
          onClick={() => setPage(page + 1)}
          onMouseEnter={() => setLoadMoreHover(true)}
          onMouseLeave={() => setLoadMoreHover(false)}
          style={{
            ...loadMoreButtonStyles,
            ...(loadMoreHover ? loadMoreButtonHoverStyles : {}),
          }}
          aria-label="Load more images"
        >
          Load More
        </button>
      )}

      {expandedImage && (
        <div
          style={overlayStyles}
          onClick={() => setExpandedImage(null)}
          role="button"
          aria-label="Close expanded image"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") setExpandedImage(null);
          }}
        >
          <img
            src={expandedImage.img}
            alt={expandedImage.name}
            style={overlayImageStyles}
          />
        </div>
      )}
    </>
  );
}
