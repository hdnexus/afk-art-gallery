import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

const galleryStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "20px",
  maxWidth: 1600,
  margin: "0 auto",
  padding: "0 16px 60px",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const itemStyles = {
  cursor: "pointer",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  backgroundColor: "#1a1a1a",
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  position: "relative",
  willChange: "transform",
};

const imageStyles = {
  width: "100%",
  height: 200,
  objectFit: "cover",
  flexShrink: 0,
  filter: "brightness(0.88) contrast(1.08) saturate(1.1)",
  transition: "all 0.5s ease",
  backgroundColor: "#0f0f0f",
  willChange: "filter, transform",
};

const nameStyles = {
  padding: "14px 16px",
  fontSize: "clamp(14px, 2vw, 15px)",
  fontWeight: "600",
  textAlign: "center",
  color: "#ffffff",
  letterSpacing: "0.02em",
  background: "linear-gradient(180deg, #1a1a1a 0%, #151515 100%)",
  lineHeight: 1.4,
  minHeight: 80,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

const spinnerStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  gap: 20,
};

const loadMoreButtonStyles = (isMobile) => ({
  display: "block",
  margin: isMobile ? "60px auto 80px" : "80px auto 120px",
  padding: isMobile ? "14px 32px" : "18px 56px",
  fontSize: isMobile ? 14 : 16,
  fontWeight: "600",
  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 16,
  cursor: "pointer",
  userSelect: "none",
  boxShadow: "0 12px 40px rgba(99, 102, 241, 0.4)",
  transition: "all 0.4s ease",
  letterSpacing: "0.03em",
  position: "relative",
  overflow: "hidden",
});

export default function App() {
  const [data, setData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadMoreHover, setLoadMoreHover] = useState(false);
  const [navHover, setNavHover] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#0a0a0a";
    document.body.style.fontFamily =
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    document.body.style.overflowX = "hidden";

    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.backgroundColor = "";
      document.body.style.fontFamily = "";
      document.body.style.overflowX = "";
    };
  }, []);

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const rankA = parseInt(a.ranking.replace("Rank:", "").trim());
          const rankB = parseInt(b.ranking.replace("Rank:", "").trim());
          return rankA - rankB;
        });
        setData(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const ITEMS_PER_PAGE = 30;
  const pagedData = useMemo(
    () => data.slice(0, ITEMS_PER_PAGE * page),
    [data, page]
  );

  const handlePrevious = useCallback(
    (e) => {
      e?.stopPropagation();
      setExpandedIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : pagedData.length - 1;
        return newIndex;
      });
    },
    [pagedData.length]
  );

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      if (
        expandedIndex === pagedData.length - 1 &&
        pagedData.length < data.length
      ) {
        setPage((p) => p + 1);
        setExpandedIndex(pagedData.length);
      } else {
        setExpandedIndex((prev) =>
          prev < pagedData.length - 1 ? prev + 1 : 0
        );
      }
    },
    [expandedIndex, pagedData.length, data.length]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (expandedIndex === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = Math.abs(touchStartY.current - touchEndY);

    if (diffY < 50) {
      if (diffX > 50) {
        handleNext();
      } else if (diffX < -50) {
        handlePrevious();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (expandedIndex !== null) {
        if (e.key === "ArrowLeft") handlePrevious(e);
        if (e.key === "ArrowRight") handleNext(e);
        if (e.key === "Escape") setExpandedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedIndex, handlePrevious, handleNext]);

  if (loading) {
    return (
      <div style={spinnerStyles}>
        <div
          style={{
            width: 60,
            height: 60,
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <div
          style={{
            fontSize: 16,
            color: "#9ca3af",
            fontWeight: "500",
          }}
        >
          Loading gallery...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes glow {
            0% { filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.5)); }
            100% { filter: drop-shadow(0 0 60px rgba(167, 139, 250, 0.8)); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @media (max-width: 768px) {
            body {
              overflow-x: hidden;
            }
          }
        `}
      </style>

      <div
        style={{
          position: "relative",
          paddingTop: isMobile ? 40 : 80,
          paddingBottom: 40,
          background:
            "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            width: isMobile ? 300 : 600,
            height: isMobile ? 300 : 600,
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(80px)",
            pointerEvents: "none",
            animation: "float 8s ease-in-out infinite",
          }}
        ></div>

        <h1
          style={{
            textAlign: "center",
            margin: 0,
            fontWeight: "800",
            fontSize: isMobile ? "32px" : "72px",
            color: "#ffffff",
            letterSpacing: "0.02em",
            userSelect: "none",
            background:
              "linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "glow 3s ease-in-out infinite alternate",
            position: "relative",
            zIndex: 1,
          }}
        >
          AFK Art Contest
        </h1>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <div
            style={{
              width: isMobile ? 30 : 50,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #6366f1, transparent)",
            }}
          ></div>
          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: isMobile ? 14 : 18,
              margin: 0,
              fontWeight: "500",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {data.length} Masterpieces
          </p>
          <div
            style={{
              width: isMobile ? 30 : 50,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #6366f1, transparent)",
            }}
          ></div>
        </div>
      </div>

      <div style={galleryStyles}>
        {pagedData.map(({ img, name, ranking, votes }, idx) => (
          <div
            key={img + idx}
            style={{
              ...itemStyles,
              transform:
                hoveredIndex === idx && !isMobile
                  ? "translateY(-12px) scale(1.02)"
                  : "translateY(0) scale(1)",
              boxShadow:
                hoveredIndex === idx
                  ? "0 24px 48px rgba(99, 102, 241, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.6)"
                  : "0 8px 32px rgba(0, 0, 0, 0.6)",
              borderColor:
                hoveredIndex === idx
                  ? "rgba(99, 102, 241, 0.6)"
                  : "rgba(255, 255, 255, 0.08)",
            }}
            onClick={() => setExpandedIndex(idx)}
            onMouseEnter={() => !isMobile && setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setExpandedIndex(idx);
            }}
            aria-label={`View image: ${name}`}
          >
            <img
              src={img}
              alt={name}
              style={{
                ...imageStyles,
                filter:
                  hoveredIndex === idx && !isMobile
                    ? "brightness(1) contrast(1.15) saturate(1.2)"
                    : "brightness(0.88) contrast(1.08) saturate(1.1)",
                transform:
                  hoveredIndex === idx && !isMobile
                    ? "scale(1.08)"
                    : "scale(1)",
              }}
              loading="lazy"
            />
            <div style={nameStyles}>
              <div>
                <div
                  style={{
                    fontSize: "clamp(14px, 2vw, 15px)",
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: "clamp(12px, 1.5vw, 14px)",
                    color: "#a78bfa",
                    marginTop: 4,
                  }}
                >
                  {ranking}
                </div>
                <div
                  style={{
                    fontSize: "clamp(12px, 1.5vw, 14px)",
                    color: "#9ca3af",
                  }}
                >
                  {votes}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagedData.length < data.length && (
        <button
          onClick={() => setPage(page + 1)}
          onMouseEnter={() => !isMobile && setLoadMoreHover(true)}
          onMouseLeave={() => setLoadMoreHover(false)}
          style={{
            ...loadMoreButtonStyles(isMobile),
            transform:
              loadMoreHover && !isMobile
                ? "translateY(-4px) scale(1.05)"
                : "translateY(0) scale(1)",
            boxShadow: loadMoreHover
              ? "0 16px 48px rgba(99, 102, 241, 0.6)"
              : "0 12px 40px rgba(99, 102, 241, 0.4)",
          }}
          aria-label="Load more images"
        >
          Load More
        </button>
      )}

      {expandedIndex !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.97)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: isMobile ? "60px 12px 12px 12px" : "20px",
            backdropFilter: "blur(20px)",
            animation: "fadeIn 0.3s ease",
            overscrollBehavior: "contain",
            boxSizing: "border-box",
            gap: isMobile ? 0 : 20,
            overflow: "auto",
          }}
          onClick={() => setExpandedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close Button */}
          <button
            style={{
              position: "fixed",
              top: isMobile ? "8px" : "20px",
              right: isMobile ? "8px" : "20px",
              background: "rgba(239, 68, 68, 0.9)",
              border: "none",
              borderRadius: "50%",
              width: isMobile ? 44 : 56,
              height: isMobile ? 44 : 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              color: "#fff",
              fontSize: isMobile ? 24 : 28,
              fontWeight: "bold",
              boxShadow: "0 8px 32px rgba(239, 68, 68, 0.4)",
              zIndex: 1102,
              padding: 0,
              minWidth: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedIndex(null);
            }}
            onMouseEnter={(e) =>
              !isMobile &&
              (e.currentTarget.style.transform = "scale(1.1) rotate(90deg)")
            }
            onMouseLeave={(e) =>
              !isMobile &&
              (e.currentTarget.style.transform = "scale(1) rotate(0deg)")
            }
            aria-label="Close"
          >
            ×
          </button>

          {/* Counter */}
          <div
            style={{
              position: "fixed",
              top: isMobile ? "60px" : "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(30, 30, 30, 0.95)",
              padding: isMobile ? "8px 16px" : "10px 24px",
              borderRadius: 30,
              color: "#a78bfa",
              fontSize: isMobile ? 13 : 15,
              fontWeight: "600",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(167, 139, 250, 0.3)",
              whiteSpace: "nowrap",
              zIndex: 1102,
            }}
          >
            {expandedIndex + 1} / {693}
          </div>

          {/* Left Click Area / Button */}
          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: isMobile ? "25%" : "15%",
              height: "100%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1101,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => {
              if (expandedIndex === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const touchEndY = e.changedTouches[0].clientY;
              const diffX = touchStartX.current - touchEndX;
              const diffY = Math.abs(touchStartY.current - touchEndY);
              if (diffY < 50 && diffX < -50) {
                handlePrevious();
              }
            }}
          >
            {!isMobile && (
              <button
                style={{
                  background: "rgba(99, 102, 241, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "bold",
                  boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
                  padding: 0,
                  minWidth: 0,
                  transform: navHover === "prev" ? "scale(1.15)" : "scale(1)",
                  pointerEvents: "none",
                }}
                onMouseEnter={() => setNavHover("prev")}
                onMouseLeave={() => setNavHover(null)}
                aria-label="Previous image"
              >
                ‹
              </button>
            )}
          </div>

          {/* Image */}
          <img
            src={pagedData[expandedIndex]?.img}
            alt={pagedData[expandedIndex]?.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              borderRadius: isMobile ? 0 : 16,
              boxShadow: isMobile
                ? "none"
                : "0 0 100px rgba(99, 102, 241, 0.5), 0 0 200px rgba(0, 0, 0, 0.9)",
              transition: "all 0.4s ease",
              objectFit: "contain",
              touchAction: "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Right Click Area / Button */}
          <div
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              width: isMobile ? "25%" : "15%",
              height: "100%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1101,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => {
              if (expandedIndex === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const touchEndY = e.changedTouches[0].clientY;
              const diffX = touchStartX.current - touchEndX;
              const diffY = Math.abs(touchStartY.current - touchEndY);
              if (diffY < 50 && diffX > 50) {
                handleNext();
              }
            }}
          >
            {!isMobile && (
              <button
                style={{
                  background: "rgba(99, 102, 241, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "bold",
                  boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
                  padding: 0,
                  minWidth: 0,
                  transform: navHover === "next" ? "scale(1.15)" : "scale(1)",
                  pointerEvents: "none",
                }}
                onMouseEnter={() => setNavHover("next")}
                onMouseLeave={() => setNavHover(null)}
                aria-label="Next image"
              >
                ›
              </button>
            )}
          </div>

          {/* Title and Info - Only on Desktop */}
          {!isMobile && (
            <div
              style={{
                fontSize: 22,
                fontWeight: "600",
                color: "#ffffff",
                textAlign: "center",
                maxWidth: "80%",
                letterSpacing: "0.02em",
              }}
            >
              {pagedData[expandedIndex]?.name}
              <div style={{ color: "#a78bfa", fontSize: 16, marginTop: 6 }}>
                {pagedData[expandedIndex]?.ranking}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 15 }}>
                {pagedData[expandedIndex]?.votes}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
