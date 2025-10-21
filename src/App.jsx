import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";

export default function App() {
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset({ x: panOffset.current.x + dx, y: panOffset.current.y + dy });
  };

  const handleMouseUp = () => {
    if (!isPanning.current) return;
    isPanning.current = false;
    panOffset.current = { ...offset };
  };

  const handleTouchPanStart = (e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    isPanning.current = true;
    panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchPanMove = (e) => {
    if (!isPanning.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - panStart.current.x;
    const dy = e.touches[0].clientY - panStart.current.y;
    setOffset({ x: panOffset.current.x + dx, y: panOffset.current.y + dy });
  };

  const handleTouchPanEnd = () => {
    if (!isPanning.current) return;
    isPanning.current = false;
    panOffset.current = { ...offset };
  };

  const [data, setData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadMoreHover, setLoadMoreHover] = useState(false);
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < 640) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const lastTouchDistance = useRef(null);
  const [isEditingCounter, setIsEditingCounter] = useState(false);
  const [counterInput, setCounterInput] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [lightMode, setLightMode] = useState(false);

  const ITEMS_PER_PAGE =
    screenSize === "mobile" ? 20 : screenSize === "tablet" ? 24 : 30;
  const TOTAL_IMAGES = 693;

  const pagedData = useMemo(() => {
    let filtered = data;
    if (showOnlyFavorites) {
      filtered = data.filter((_, idx) => favorites.includes(idx));
    }
    return filtered.slice(0, ITEMS_PER_PAGE * page);
  }, [data, page, ITEMS_PER_PAGE, showOnlyFavorites, favorites]);

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("mobile");
      else if (width < 1024) setScreenSize("tablet");
      else setScreenSize("desktop");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = lightMode ? "#f5f5f5" : "#0a0a0a";
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
  }, [lightMode]);

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

  useLayoutEffect(() => {
    if (expandedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [expandedIndex]);

  const resetImageState = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    panOffset.current = { x: 0, y: 0 };
  }, []);

  const goToImage = useCallback(
    (index) => {
      const pageNeeded = Math.ceil((index + 1) / ITEMS_PER_PAGE);
      setPage(pageNeeded);
      setExpandedIndex(index);
      resetImageState();
      if (data[index - 1]) new Image().src = data[index - 1].img;
      if (data[index + 1]) new Image().src = data[index + 1].img;
    },
    [data, ITEMS_PER_PAGE]
  );

  const handlePrevious = useCallback(() => {
    let newIndex = expandedIndex - 1;
    if (newIndex < 0) {
      newIndex = TOTAL_IMAGES - 1;
    }
    goToImage(newIndex);
  }, [expandedIndex, goToImage]);

  const handleNext = useCallback(() => {
    let newIndex = expandedIndex + 1;
    if (newIndex >= TOTAL_IMAGES) {
      newIndex = 0;
    }
    goToImage(newIndex);
  }, [expandedIndex, goToImage]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const scaleChange = distance / lastTouchDistance.current;
      setZoom((prev) => Math.min(Math.max(prev * scaleChange, 1), 4));
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = (e) => {
    if (expandedIndex === null) return;

    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX.current - touchEndX;
      const diffY = Math.abs(touchStartY.current - touchEndY);

      if (diffY < 50) {
        if (diffX > 50) handleNext();
        else if (diffX < -50) handlePrevious();
      }
    }
    lastTouchDistance.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (expandedIndex === null) return;
    setZoom((prev) => Math.min(Math.max(prev + e.deltaY * -0.0015, 1), 4));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (expandedIndex !== null && !isEditingCounter) {
        if (e.key === "ArrowLeft") handlePrevious();
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "Escape") setExpandedIndex(null);
        if (e.key === "f" || e.key === "F") toggleFavorite(expandedIndex);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedIndex, isEditingCounter, handlePrevious, handleNext]);

  const handleCounterClick = () => {
    setIsEditingCounter(true);
    setCounterInput(String(expandedIndex + 1));
  };

  const handleCounterSubmit = () => {
    const num = parseInt(counterInput, 10);
    if (!isNaN(num) && num >= 1 && num <= TOTAL_IMAGES) {
      goToImage(num - 1);
      setIsEditingCounter(false);
    } else {
      setCounterInput(String(expandedIndex + 1));
      setIsEditingCounter(false);
    }
  };

  const toggleFavorite = (index) => {
    setFavorites((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 20,
        }}
      >
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
        <div style={{ fontSize: 16, color: "#9ca3af", fontWeight: "500" }}>
          Loading gallery...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes glow { 0% { filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.5)); } 100% { filter: drop-shadow(0 0 60px rgba(167, 139, 250, 0.8)); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div
        style={{
          position: "relative",
          paddingTop: isMobile ? 30 : isTablet ? 50 : 80,
          paddingBottom: isMobile ? 25 : isTablet ? 35 : 40,
          background: lightMode
            ? "linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)"
            : "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
          borderBottom: lightMode ? "1px solid #e5e5e5" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: isMobile ? "60vw" : isTablet ? "50vw" : "40vw",
            height: isMobile ? "60vw" : isTablet ? "50vw" : "40vw",
            background: lightMode
              ? "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(80px)",
            pointerEvents: "none",
            animation: "float 8s ease-in-out infinite",
          }}
        ></div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isMobile ? 12 : 20,
            paddingX: isMobile ? 12 : 16,
          }}
        >
          <button
            onClick={() => setLightMode(!lightMode)}
            style={{
              background: lightMode
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(255, 255, 255, 0.1)",
              border: lightMode
                ? "1px solid rgba(0, 0, 0, 0.2)"
                : "1px solid rgba(255, 255, 255, 0.2)",
              color: lightMode ? "#000" : "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 16,
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              marginLeft: isMobile ? 12 : 16,
            }}
          >
            {lightMode ? "🌙" : "☀️"}
          </button>
          <button
            onClick={() => {
              setShowOnlyFavorites(!showOnlyFavorites);
              setPage(1);
            }}
            style={{
              background: showOnlyFavorites
                ? "rgba(236, 72, 153, 0.2)"
                : lightMode
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(255, 255, 255, 0.1)",
              border: showOnlyFavorites
                ? "1px solid rgba(236, 72, 153, 0.5)"
                : lightMode
                ? "1px solid rgba(0, 0, 0, 0.2)"
                : "1px solid rgba(255, 255, 255, 0.2)",
              color: showOnlyFavorites
                ? "#ec4899"
                : lightMode
                ? "#000"
                : "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              marginRight: isMobile ? 12 : 16,
              fontWeight: "600",
            }}
          >
            ❤️ {favorites.length}
          </button>
        </div>

        <h1
          style={{
            textAlign: "center",
            margin: 0,
            fontWeight: "800",
            fontSize: isMobile ? "28px" : isTablet ? "48px" : "72px",
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
            gap: isMobile ? 8 : 12,
            justifyContent: "center",
            alignItems: "center",
            marginTop: isMobile ? 12 : 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: isMobile ? 20 : isTablet ? 35 : 50,
              height: 2,
              background: lightMode
                ? "linear-gradient(90deg, transparent, #6366f1, transparent)"
                : "linear-gradient(90deg, transparent, #6366f1, transparent)",
            }}
          ></div>
          <p
            style={{
              textAlign: "center",
              color: lightMode ? "#666" : "#9ca3af",
              fontSize: isMobile ? 12 : isTablet ? 15 : 18,
              margin: 0,
              fontWeight: "500",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {showOnlyFavorites ? favorites.length : data.length}{" "}
            {showOnlyFavorites ? "Favorites" : "Masterpieces"}
          </p>
          <div
            style={{
              width: isMobile ? 20 : isTablet ? 35 : 50,
              height: 2,
              background: lightMode
                ? "linear-gradient(90deg, transparent, #6366f1, transparent)"
                : "linear-gradient(90deg, transparent, #6366f1, transparent)",
            }}
          ></div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fill, minmax(150px, 1fr))"
            : isTablet
            ? "repeat(auto-fill, minmax(200px, 1fr))"
            : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: isMobile ? 12 : isTablet ? 16 : 20,
          maxWidth: 1600,
          margin: "0 auto",
          padding: isMobile
            ? "0 12px 40px"
            : isTablet
            ? "0 14px 50px"
            : "0 16px 60px",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: lightMode ? "#f5f5f5" : "#0a0a0a",
        }}
      >
        {pagedData.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "60px 20px",
              color: lightMode ? "#999" : "#9ca3af",
              fontSize: 16,
            }}
          >
            No favorites yet! ❤️
          </div>
        ) : (
          pagedData.map(({ img, name, ranking, votes }, idx) => {
            const originalIdx = data.findIndex((item) => item.img === img);
            return (
              <div
                key={img + idx}
                onClick={() => goToImage(originalIdx)}
                onMouseEnter={() => !isMobile && setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  cursor: "pointer",
                  borderRadius: isMobile ? 12 : 16,
                  overflow: "hidden",
                  boxShadow:
                    hoveredIndex === idx
                      ? lightMode
                        ? "0 8px 24px rgba(99, 102, 241, 0.3)"
                        : "0 24px 48px rgba(99, 102, 241, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.6)"
                      : lightMode
                      ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                      : "0 8px 32px rgba(0, 0, 0, 0.6)",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: lightMode ? "#ffffff" : "#1a1a1a",
                  display: "flex",
                  flexDirection: "column",
                  userSelect: "none",
                  border:
                    hoveredIndex === idx
                      ? lightMode
                        ? "1px solid rgba(99, 102, 241, 0.4)"
                        : "1px solid rgba(99, 102, 241, 0.6)"
                      : lightMode
                      ? "1px solid rgba(0, 0, 0, 0.1)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  position: "relative",
                  willChange: "transform",
                  transform:
                    hoveredIndex === idx && !isMobile
                      ? "translateY(-12px) scale(1.02)"
                      : "translateY(0) scale(1)",
                }}
              >
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <img
                    src={img}
                    alt={name}
                    style={{
                      width: "100%",
                      height: isMobile ? 120 : isTablet ? 150 : 200,
                      objectFit: "cover",
                      flexShrink: 0,
                      filter:
                        hoveredIndex === idx && !isMobile
                          ? "brightness(1) contrast(1.15) saturate(1.2)"
                          : "brightness(0.88) contrast(1.08) saturate(1.1)",
                      transform:
                        hoveredIndex === idx && !isMobile
                          ? "scale(1.08)"
                          : "scale(1)",
                      transition: "all 0.5s ease",
                      backgroundColor: "#0f0f0f",
                      willChange: "filter, transform",
                    }}
                    loading="lazy"
                  />
                  {favorites.includes(originalIdx) && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(236, 72, 153, 0.9)",
                        padding: "4px 8px",
                        borderRadius: 20,
                        fontSize: "16px",
                        animation: "heartBeat 0.6s ease",
                      }}
                    >
                      ❤️
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: isMobile
                      ? "10px 12px"
                      : isTablet
                      ? "12px 14px"
                      : "14px 16px",
                    fontSize: isMobile
                      ? "clamp(12px, 2vw, 13px)"
                      : "clamp(14px, 2vw, 15px)",
                    fontWeight: "600",
                    textAlign: "center",
                    color: lightMode ? "#000" : "#ffffff",
                    letterSpacing: "0.02em",
                    background: lightMode
                      ? "#f9f9f9"
                      : "linear-gradient(180deg, #1a1a1a 0%, #151515 100%)",
                    lineHeight: 1.3,
                    minHeight: isMobile ? 60 : isTablet ? 70 : 80,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile
                        ? "clamp(11px, 2vw, 13px)"
                        : "clamp(12px, 2vw, 15px)",
                      fontWeight: "600",
                      color: lightMode ? "#000" : "#fff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile
                        ? "clamp(10px, 1.5vw, 12px)"
                        : "clamp(12px, 1.5vw, 14px)",
                      color: lightMode ? "#7c3aed" : "#a78bfa",
                    }}
                  >
                    {ranking}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile
                        ? "clamp(10px, 1.5vw, 12px)"
                        : "clamp(12px, 1.5vw, 14px)",
                      color: lightMode ? "#666" : "#9ca3af",
                    }}
                  >
                    {votes}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pagedData.length < data.length && (
        <button
          onClick={() => setPage(page + 1)}
          onMouseEnter={() => !isMobile && setLoadMoreHover(true)}
          onMouseLeave={() => setLoadMoreHover(false)}
          style={{
            display: "block",
            margin: isMobile
              ? "40px auto 50px"
              : isTablet
              ? "60px auto 80px"
              : "80px auto 120px",
            padding: isMobile
              ? "12px 24px"
              : isTablet
              ? "14px 40px"
              : "18px 56px",
            fontSize: isMobile ? 13 : isTablet ? 14 : 16,
            fontWeight: "600",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 16,
            cursor: "pointer",
            userSelect: "none",
            boxShadow: loadMoreHover
              ? "0 16px 48px rgba(99, 102, 241, 0.6)"
              : "0 12px 40px rgba(99, 102, 241, 0.4)",
            transition: "all 0.4s ease",
            letterSpacing: "0.03em",
            position: "relative",
            overflow: "hidden",
            transform:
              loadMoreHover && !isMobile
                ? "translateY(-4px) scale(1.05)"
                : "translateY(0) scale(1)",
          }}
        >
          Load More
        </button>
      )}

      {/* Expanded View */}
      {expandedIndex !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: lightMode
              ? "rgba(255, 255, 255, 0.97)"
              : "rgba(0, 0, 0, 0.97)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding:
              screenSize === "mobile"
                ? "6vw 2vw"
                : screenSize === "tablet"
                ? "4vw 3vw"
                : "2vw",
            backdropFilter: "blur(20px)",
            animation: "fadeIn 0.3s ease",
            overscrollBehavior: "contain",
            boxSizing: "border-box",
            gap:
              screenSize === "mobile" ? 0 : screenSize === "tablet" ? 10 : 20,
            overflow: "hidden",
            touchAction: "none",
          }}
          onClick={() => setExpandedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={data[expandedIndex]?.img}
            alt={data[expandedIndex]?.name}
            style={{
              maxWidth: "100%",
              maxHeight:
                screenSize === "mobile"
                  ? "70vh"
                  : screenSize === "tablet"
                  ? "75vh"
                  : "85vh",
              objectFit: "contain",
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${
                offset.y / zoom
              }px)`,
              transition: isPanning.current ? "none" : "transform 0.05s linear",
              touchAction: "none",
              cursor: zoom === 1 ? "pointer" : "grab",
            }}
            onClick={(e) => {
              if (zoom !== 1) return;
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              if (clickX < rect.width / 2) handlePrevious();
              else handleNext();
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              handleTouchStart(e);
              handleTouchPanStart(e);
            }}
            onTouchMove={(e) => {
              handleTouchMove(e);
              handleTouchPanMove(e);
            }}
            onTouchEnd={(e) => {
              handleTouchEnd(e);
              handleTouchPanEnd();
            }}
          />

          {/* Counter */}
          {isEditingCounter ? (
            <input
              autoFocus
              type="text"
              value={counterInput}
              onChange={(e) => setCounterInput(e.target.value)}
              onBlur={handleCounterSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCounterSubmit();
                if (e.key === "Escape") setIsEditingCounter(false);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top:
                  screenSize === "mobile"
                    ? "3vh"
                    : screenSize === "tablet"
                    ? "2.5vh"
                    : "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: lightMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(30, 30, 30, 0.95)",
                padding:
                  screenSize === "mobile"
                    ? "6px 10px"
                    : screenSize === "tablet"
                    ? "8px 14px"
                    : "clamp(6px,1.5vw,12px) clamp(12px,3vw,24px)",
                borderRadius: 12,
                color: "#a78bfa",
                fontSize:
                  screenSize === "mobile"
                    ? 12
                    : screenSize === "tablet"
                    ? 13
                    : "clamp(14px,2vw,18px)",
                fontWeight: "600",
                backdropFilter: "blur(10px)",
                border: lightMode ? "2px solid #6366f1" : "2px solid #6366f1",
                whiteSpace: "nowrap",
                zIndex: 1102,
                textAlign: "center",
                width: screenSize === "mobile" ? "60px" : "80px",
              }}
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleCounterClick();
              }}
              style={{
                position: "fixed",
                top:
                  screenSize === "mobile"
                    ? "3vh"
                    : screenSize === "tablet"
                    ? "2.5vh"
                    : "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: lightMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(30, 30, 30, 0.95)",
                padding:
                  screenSize === "mobile"
                    ? "6px 10px"
                    : screenSize === "tablet"
                    ? "8px 14px"
                    : "clamp(6px,1.5vw,12px) clamp(12px,3vw,24px)",
                borderRadius: 12,
                color: "#a78bfa",
                fontSize:
                  screenSize === "mobile"
                    ? 12
                    : screenSize === "tablet"
                    ? 13
                    : "clamp(14px,2vw,18px)",
                fontWeight: "600",
                backdropFilter: "blur(10px)",
                border: lightMode
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "1px solid rgba(167, 139, 250, 0.3)",
                whiteSpace: "nowrap",
                zIndex: 1102,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {expandedIndex + 1} / {TOTAL_IMAGES}
            </div>
          )}

          {/* Prev Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            style={{
              position: "absolute",
              top: "50%",
              left:
                screenSize === "mobile"
                  ? "2%"
                  : screenSize === "tablet"
                  ? "2.5%"
                  : "3%",
              transform: "translateY(-50%)",
              fontSize:
                screenSize === "mobile"
                  ? "24px"
                  : screenSize === "tablet"
                  ? "32px"
                  : "clamp(24px, 5vw, 48px)",
              background: lightMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0,0,0,0.4)",
              border: "none",
              borderRadius: "50%",
              color: lightMode ? "#000" : "#fff",
              width:
                screenSize === "mobile"
                  ? "40px"
                  : screenSize === "tablet"
                  ? "50px"
                  : "clamp(40px, 8vw, 80px)",
              height:
                screenSize === "mobile"
                  ? "40px"
                  : screenSize === "tablet"
                  ? "50px"
                  : "clamp(40px, 8vw, 80px)",
              cursor: "pointer",
              zIndex: 1200,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: "absolute",
              top: "50%",
              right:
                screenSize === "mobile"
                  ? "2%"
                  : screenSize === "tablet"
                  ? "2.5%"
                  : "3%",
              transform: "translateY(-50%)",
              fontSize:
                screenSize === "mobile"
                  ? "24px"
                  : screenSize === "tablet"
                  ? "32px"
                  : "clamp(24px, 5vw, 48px)",
              background: lightMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0,0,0,0.4)",
              border: "none",
              borderRadius: "50%",
              color: lightMode ? "#000" : "#fff",
              width:
                screenSize === "mobile"
                  ? "40px"
                  : screenSize === "tablet"
                  ? "50px"
                  : "clamp(40px, 8vw, 80px)",
              height:
                screenSize === "mobile"
                  ? "40px"
                  : screenSize === "tablet"
                  ? "50px"
                  : "clamp(40px, 8vw, 80px)",
              cursor: "pointer",
              zIndex: 1200,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(expandedIndex);
            }}
            style={{
              position: "absolute",
              top:
                screenSize === "mobile"
                  ? "3vh"
                  : screenSize === "tablet"
                  ? "2.5vh"
                  : "20px",
              right:
                screenSize === "mobile"
                  ? "8px"
                  : screenSize === "tablet"
                  ? "15px"
                  : "30px",
              background: favorites.includes(expandedIndex)
                ? "rgba(236, 72, 153, 0.2)"
                : lightMode
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(30, 30, 30, 0.95)",
              padding:
                screenSize === "mobile"
                  ? "6px 8px"
                  : screenSize === "tablet"
                  ? "7px 10px"
                  : "8px 12px",
              borderRadius: 12,
              color: favorites.includes(expandedIndex)
                ? "#ec4899"
                : lightMode
                ? "#6366f1"
                : "#9ca3af",
              fontSize:
                screenSize === "mobile"
                  ? 16
                  : screenSize === "tablet"
                  ? 18
                  : 22,
              border: favorites.includes(expandedIndex)
                ? "1px solid rgba(236, 72, 153, 0.5)"
                : lightMode
                ? "1px solid rgba(99, 102, 241, 0.3)"
                : "1px solid rgba(167, 139, 250, 0.3)",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              zIndex: 1102,
              transition: "all 0.2s ease",
              transform: favorites.includes(expandedIndex)
                ? "scale(1.1)"
                : "scale(1)",
            }}
          >
            ❤️
          </button>

          {/* Zoom Info for Desktop */}
          {!isMobile && zoom > 1 && (
            <div
              style={{
                position: "fixed",
                bottom: isTablet ? "9vh" : "140px",
                left: "50%",
                transform: "translateX(-50%)",
                background: lightMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(30, 30, 30, 0.95)",
                padding: "6px 12px",
                borderRadius: 10,
                color: "#a78bfa",
                fontSize: 12,
                border: lightMode
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "1px solid rgba(167, 139, 250, 0.3)",
                backdropFilter: "blur(10px)",
                zIndex: 1102,
                whiteSpace: "nowrap",
              }}
            >
              🔍 {zoom.toFixed(1)}x | Scroll to zoom
            </div>
          )}

          {/* Touch Hint for Mobile */}
          {isMobile && (
            <div
              style={{
                position: "fixed",
                bottom: isMobile ? "5vh" : "auto",
                left: "50%",
                transform: "translateX(-50%)",
                background: lightMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(30, 30, 30, 0.95)",
                padding: "5px 10px",
                borderRadius: 10,
                color: lightMode ? "#666" : "#9ca3af",
                fontSize: 10,
                border: lightMode
                  ? "1px solid rgba(0, 0, 0, 0.1)"
                  : "1px solid rgba(167, 139, 250, 0.3)",
                backdropFilter: "blur(10px)",
                zIndex: 1102,
                whiteSpace: "nowrap",
                animation: "fadeIn 0.5s ease",
              }}
            >
              👆 Swipe to navigate | Pinch to zoom
            </div>
          )}

          {!isMobile && (
            <div
              style={{
                position: "fixed",
                bottom: isTablet ? "2vh" : "40px",
                left: "50%",
                transform: "translateX(-50%)",
                background: lightMode
                  ? "rgba(255, 255, 255, 0.95)"
                  : "rgba(20, 20, 20, 0.95)",
                backdropFilter: "blur(16px)",
                padding: isTablet
                  ? "8px 14px"
                  : "clamp(12px,1.5vw,20px) clamp(16px,3vw,32px)",
                borderRadius: isTablet ? 12 : "clamp(12px,2vw,20px)",
                border: lightMode
                  ? "1px solid rgba(99, 102, 241, 0.2)"
                  : "1px solid rgba(99, 102, 241, 0.3)",
                boxShadow: lightMode
                  ? "0 4px 16px rgba(0, 0, 0, 0.1)"
                  : "0 16px 48px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)",
                zIndex: 1102,
                textAlign: "center",
                maxWidth: isTablet ? "80%" : "70%",
                animation: "fadeIn 0.4s ease",
              }}
            >
              <div
                style={{
                  fontSize: isTablet
                    ? "clamp(14px, 2vw, 16px)"
                    : "clamp(16px,2vw,22px)",
                  fontWeight: "600",
                  color: lightMode ? "#000" : "#ffffff",
                  letterSpacing: "0.02em",
                  marginBottom: 6,
                }}
              >
                {data[expandedIndex]?.name}
              </div>
              <div
                style={{
                  color: "#a78bfa",
                  fontSize: isTablet
                    ? "clamp(12px, 1.5vw, 14px)"
                    : "clamp(14px,1.5vw,16px)",
                }}
              >
                {data[expandedIndex]?.ranking}
              </div>
              <div
                style={{
                  color: lightMode ? "#666" : "#9ca3af",
                  fontSize: isTablet
                    ? "clamp(11px, 1.2vw, 13px)"
                    : "clamp(13px,1.2vw,15px)",
                  marginTop: 4,
                }}
              >
                {data[expandedIndex]?.votes}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
