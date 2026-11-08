"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  Image as ImageIcon,
  Quote,
  StickyNote,
  Heart,
  Trash2,
  Pencil,
  BringToFront,
  Move,
  RotateCcw,
  Check,
} from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "lifespace-vision-board";
const LAYOUT_KEY = "lifespace-vision-layout";

const starterItems = [
  {
    id: "1",
    type: "image",
    title: "A new chapter",
    text: "A beautiful new beginning somewhere in the world.",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1000",
    size: "large",
    color: "#F7E7E9",
    x: 100,
    y: 100,
    zIndex: 1,
    rotation: "-2deg",
  },
  {
    id: "2",
    type: "note",
    title: "My future self",
    text: "Independent. Confident. Financially secure. Free to make my own choices.",
    size: "small",
    color: "#F8EDC9",
    x: 530,
    y: 140,
    zIndex: 2,
    rotation: "3deg",
  },
  {
    id: "3",
    type: "image",
    title: "My own little home",
    text: "A peaceful space that feels like mine.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000",
    size: "medium",
    color: "#E7DFF7",
    x: 850,
    y: 100,
    zIndex: 3,
    rotation: "2deg",
  },
  {
    id: "4",
    type: "quote",
    title: "A little reminder",
    text: "You do not have to see the whole staircase. Just take the first step.",
    size: "medium",
    color: "#DCEEE1",
    x: 1250,
    y: 180,
    zIndex: 4,
    rotation: "-3deg",
  },
  {
    id: "5",
    type: "image",
    title: "Explore the world",
    text: "New places, new experiences, new memories.",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1000",
    size: "medium",
    color: "#DCEAF5",
    x: 250,
    y: 550,
    zIndex: 5,
    rotation: "2deg",
  },
  {
    id: "6",
    type: "note",
    title: "Things I want to experience",
    text: "Travel more\nLearn new skills\nMeet interesting people\nBuild a peaceful life",
    size: "small",
    color: "#F9E3D5",
    x: 650,
    y: 650,
    zIndex: 6,
    rotation: "-2deg",
  },
  {
    id: "7",
    type: "image",
    title: "A life of my own",
    text: "A life filled with little adventures.",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000",
    size: "large",
    color: "#F7DCE5",
    x: 1000,
    y: 600,
    zIndex: 7,
    rotation: "1deg",
  },
  {
    id: "8",
    type: "quote",
    title: "Remember",
    text: "Small steps still move you forward.",
    size: "small",
    color: "#E7DFF7",
    x: 1550,
    y: 700,
    zIndex: 8,
    rotation: "2deg",
  },
];

const colors = [
  "#F7DCE5",
  "#F8EDC9",
  "#DCEEE1",
  "#E7DFF7",
  "#DCEAF5",
  "#F9E3D5",
];

const sizes = {
  small: 230,
  medium: 290,
  large: 360,
};

function createUniqueId() {
  return crypto.randomUUID();
}

function normalizeItems(items) {
  return items.map((item, index) => ({
    ...item,
    x: typeof item.x === "number" ? item.x : 80 + (index % 4) * 330,
    y: typeof item.y === "number" ? item.y : 100 + Math.floor(index / 4) * 420,
    zIndex: item.zIndex || index + 1,
    rotation: item.rotation || "0deg",
    size: sizes[item.size] ? item.size : "medium",
    color: item.color || colors[index % colors.length],
  }));
}

export default function VisionPage() {
  const [items, setItems] = useState(starterItems);
  const [viewMode, setViewMode] = useState("free");
  const [loaded, setLoaded] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draggedColumnId, setDraggedColumnId] = useState(null);

  const [form, setForm] = useState({
    type: "image",
    title: "",
    text: "",
    image: "",
    color: "#F7DCE5",
    size: "medium",
  });

  const dragRef = useRef(null);
  const canvasRef = useRef(null);
  const saveQueue = useRef(Promise.resolve());

  // Load the board from the database.
  // If the database is empty, import the browser's previous board.
  useEffect(() => {
    let cancelled = false;

    async function loadVisionBoard() {
      try {
        setLoadError("");

        const response = await fetch("/api/vision-board");

        if (!response.ok) {
          throw new Error("Could not load your vision board.");
        }

        const data = await response.json();

        let restored = Array.isArray(data.items) ? data.items : [];

        if (restored.length === 0) {
          const savedItems = localStorage.getItem(STORAGE_KEY);

          if (savedItems !== null) {
            const parsedItems = JSON.parse(savedItems);

            if (!Array.isArray(parsedItems)) {
              throw new Error("Your saved vision board data is invalid.");
            }

            // Give imported cards new IDs because database IDs
            // must be unique across all users.
            restored = parsedItems.map((item) => ({
              ...item,
              id: createUniqueId(),
            }));

            restored = normalizeItems(restored);
          } else {
            // First visit: create the starter board for this user.
            restored = starterItems.map((item) => ({
              ...item,
              id: createUniqueId(),
            }));

            restored = normalizeItems(restored);
          }

          // Import the initial board into Neon.
          const importResponse = await fetch("/api/vision-board", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: restored,
            }),
          });

          if (!importResponse.ok) {
            throw new Error("Could not import your existing vision board.");
          }
        } else {
          restored = normalizeItems(restored);
        }

        const savedLayout = localStorage.getItem(LAYOUT_KEY);

        if (cancelled) return;

        if (savedLayout === "free" || savedLayout === "columns") {
          setViewMode(savedLayout);
        }

        setItems(restored);
        setLoaded(true);
      } catch (error) {
        console.error("Could not load vision board:", error);

        if (!cancelled) {
          setLoadError(error.message || "Could not load your vision board.");
        }
      }
    }

    loadVisionBoard();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save changes automatically to localStorage and Neon.
  useEffect(() => {
    if (!loaded) return;

    // Keep a local backup as well.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const itemsToSave = items;

    // Debounce saves so dragging doesn't create a request
    // for every tiny pointer movement.
    const timeout = setTimeout(() => {
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const response = await fetch("/api/vision-board", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: itemsToSave,
            }),
          });

          if (!response.ok) {
            throw new Error("Your changes could not be saved.");
          }

          setSaveError("");
        })
        .catch((error) => {
          console.error("Vision board save error:", error);

          setSaveError(error.message || "Your changes could not be saved.");
        });
    }, 700);

    return () => clearTimeout(timeout);
  }, [items, loaded]);

  // Remember the selected layout.
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(LAYOUT_KEY, viewMode);
    }
  }, [viewMode, loaded]);

  function getTopZIndex() {
    return Math.max(0, ...items.map((item) => item.zIndex || 0));
  }

  // Add a new inspiration item.
  function openNewItem(type = "image") {
    setEditingItem(null);

    setForm({
      type,
      title: "",
      text: "",
      image: "",
      color: colors[Math.floor(Math.random() * colors.length)],
      size: "medium",
    });

    setShowEditor(true);
  }

  // Edit an existing item.
  function openEditItem(item) {
    setEditingItem(item.id);

    setForm({
      type: item.type,
      title: item.title || "",
      text: item.text || "",
      image: item.image || "",
      color: item.color || "#F7DCE5",
      size: item.size || "medium",
    });

    setShowEditor(true);
  }

  // Save a new item or update an existing one.
  function saveItem() {
    const hasImage = Boolean(form.image.trim());
    const hasText = Boolean(form.title.trim() || form.text.trim());

    // Pictures need an image URL, but their title and description are optional.
    if (form.type === "image" && !hasImage) return;
    if (form.type !== "image" && !hasText) return;

    if (editingItem) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingItem ? { ...item, ...form } : item,
        ),
      );
    } else {
      const lowestY = items.length
        ? Math.max(...items.map((item) => item.y || 0))
        : 80;

      setItems((current) => [
        ...current,
        {
          ...form,
          id: createUniqueId(),
          x: 35,
          y: lowestY + 360,
          zIndex: getTopZIndex() + 1,
          rotation: `${Math.floor(Math.random() * 7) - 3}deg`,
        },
      ]);
    }

    setShowEditor(false);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));

    setSelectedItem((current) => (current?.id === id ? null : current));
  }

  function bringToFront(id) {
    const nextZ = getTopZIndex() + 1;

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, zIndex: nextZ } : item,
      ),
    );
  }

  // FREE STYLE: pointer-based dragging.
  function startFreeDrag(event, item) {
    if (event.target.closest("button")) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      id: item.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      itemX: item.x || 0,
      itemY: item.y || 0,
    };

    bringToFront(item.id);
  }

  function moveFreeItem(event) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    const canvasWidth = canvasRef.current?.clientWidth || window.innerWidth;

    setItems((current) =>
      current.map((item) => {
        if (item.id !== drag.id) return item;

        const cardWidth = sizes[item.size] || sizes.medium;
        const maxX = Math.max(0, canvasWidth - cardWidth - 12);

        return {
          ...item,
          x: Math.min(maxX, Math.max(0, drag.itemX + deltaX)),
          y: Math.max(0, drag.itemY + deltaY),
        };
      }),
    );
  }

  function stopFreeDrag(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  // COLUMNS: drag a card onto another card to reorder.
  function handleColumnDragStart(event, item) {
    setDraggedColumnId(item.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }

  function handleColumnDrop(event, targetId = null) {
    event.preventDefault();
    event.stopPropagation();

    const draggedId =
      draggedColumnId || event.dataTransfer.getData("text/plain");

    if (!draggedId) {
      setDraggedColumnId(null);
      return;
    }

    setItems((current) => {
      const next = [...current];

      const fromIndex = next.findIndex((item) => item.id === draggedId);

      if (fromIndex < 0) return current;

      const [moved] = next.splice(fromIndex, 1);

      if (!targetId) {
        next.push(moved);
      } else {
        const targetIndex = next.findIndex((item) => item.id === targetId);

        if (targetIndex < 0) {
          next.push(moved);
        } else {
          next.splice(targetIndex, 0, moved);
        }
      }

      // Keep the new column order when saving and reloading.
      return next.map((item, index) => ({
        ...item,
        zIndex: index + 1,
      }));
    });

    setDraggedColumnId(null);
  }

  // Reset positions without deleting any items.
  function resetArrangement() {
    const confirmed = window.confirm(
      "Reset the arrangement of your vision board items? Your items will not be deleted.",
    );

    if (!confirmed) return;

    setItems((current) =>
      current.map((item, index) => {
        const original = starterItems.find((starter) => starter.id === item.id);

        return {
          ...item,
          x: original ? original.x : 80 + (index % 4) * 330,
          y: original ? original.y : 120 + Math.floor(index / 4) * 430,
          zIndex: index + 1,
        };
      }),
    );
  }

  function changeType(type) {
    setForm((current) => ({
      ...current,
      type,
    }));
  }

  const canvasHeight = Math.max(
    typeof window !== "undefined" ? window.innerHeight - 20 : 900,
    ...items.map((item) => (item.y || 0) + 560),
  );

  const selectedIsBareImage = Boolean(
    selectedItem?.type === "image" &&
    !selectedItem.title?.trim() &&
    !selectedItem.text?.trim(),
  );

  // Shared visual content for each card.
  function renderCardContent(item) {
    const hasImageCaption = Boolean(item.title?.trim() || item.text?.trim());

    return (
      <>
        {item.type === "image" && (
          <>
            {item.image ? (
              <img
                src={item.image}
                alt={item.title || item.text || "Vision inspiration"}
                draggable="false"
                className={`pointer-events-none block h-auto w-full rounded-lg object-cover ${
                  hasImageCaption ? "max-h-[340px]" : "max-h-none"
                }`}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-[#f1e9ed] text-[#a88da0]">
                <ImageIcon size={35} />
              </div>
            )}

            {hasImageCaption && (
              <div className="px-2 pb-2 pt-4">
                {item.title && (
                  <h3 className="scrapbook-title text-xl text-[#514656]">
                    {item.title}
                  </h3>
                )}

                {item.text && (
                  <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#8d808d]">
                    {item.text}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {item.type === "note" && (
          <div className="flex min-h-48 flex-col justify-center px-4 py-7">
            <div className="mb-4 text-2xl">✿</div>

            {item.title && (
              <h3 className="scrapbook-title text-2xl text-[#594b54]">
                {item.title}
              </h3>
            )}

            {item.text && (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#756776]">
                {item.text}
              </p>
            )}

            <div className="mt-5 text-right text-xl text-[#b48da0]">♡</div>
          </div>
        )}

        {item.type === "quote" && (
          <div className="flex min-h-48 flex-col justify-center px-5 py-7 text-center">
            <Quote size={25} className="mx-auto mb-5 text-[#a58a9c]" />

            <p className="scrapbook-title text-2xl leading-relaxed text-[#594b54]">
              “{item.text}”
            </p>

            {item.title && (
              <p className="mt-5 text-xs uppercase tracking-widest text-[#a58a9c]">
                {item.title}
              </p>
            )}
          </div>
        )}
      </>
    );
  }

  // Render a card in either layout and either mode.
  function renderCard(item, index) {
    const isFree = viewMode === "free";

    const isBareImage =
      item.type === "image" && !item.title?.trim() && !item.text?.trim();

    return (
      <article
        key={item.id}
        data-vision-card={item.id}
        onClick={!isEditing ? () => setSelectedItem(item) : undefined}
        onPointerDown={
          isEditing && isFree
            ? (event) => startFreeDrag(event, item)
            : undefined
        }
        onPointerMove={isEditing && isFree ? moveFreeItem : undefined}
        onPointerUp={isEditing && isFree ? stopFreeDrag : undefined}
        onPointerCancel={isEditing && isFree ? stopFreeDrag : undefined}
        draggable={isEditing && !isFree}
        onDragStart={
          isEditing && !isFree
            ? (event) => handleColumnDragStart(event, item)
            : undefined
        }
        onDragOver={
          isEditing && !isFree ? (event) => event.preventDefault() : undefined
        }
        onDrop={
          isEditing && !isFree
            ? (event) => handleColumnDrop(event, item.id)
            : undefined
        }
        onDragEnd={
          isEditing && !isFree ? () => setDraggedColumnId(null) : undefined
        }
        className={
          isFree
            ? `group absolute ${
                isEditing
                  ? "cursor-grab active:cursor-grabbing select-none"
                  : "cursor-pointer"
              }`
            : `group relative mb-6 inline-block w-full break-inside-avoid align-top ${
                isEditing
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-pointer"
              } ${draggedColumnId === item.id ? "opacity-40" : ""}`
        }
        style={
          isFree
            ? {
                left: `min(${item.x || 0}px, calc(100% - ${
                  sizes[item.size] || sizes.medium
                }px - 12px))`,
                top: item.y || 0,
                width: sizes[item.size] || sizes.medium,
                maxWidth: "calc(100% - 24px)",
                zIndex: item.zIndex || index + 1,
                transform: `rotate(${item.rotation || "0deg"})`,
                touchAction: isEditing ? "none" : "auto",
              }
            : {
                width: "100%",
                maxWidth: "440px",
                transform: `rotate(${item.rotation || "0deg"})`,
              }
        }
      >
        {/* One centered piece of washi tape for every card. */}
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 h-5 w-14 -translate-x-1/2 rotate-2 bg-[#e8c9b8]/75 shadow-[0_2px_5px_rgba(70,50,70,0.12)] backdrop-blur-[1px]" />

        <div
          className="relative overflow-hidden rounded-[5px] border border-[#e8e0dc] bg-white p-3 shadow-[0_5px_15px_rgba(80,60,70,0.12)] rounded-xl transition-shadow group-hover:shadow-[0_12px_28px_rgba(80,60,70,0.20)]"
          style={{
            backgroundColor: isBareImage
              ? "#ffffff"
              : item.type === "image"
                ? "#fff"
                : item.color,
          }}
        >
          {renderCardContent(item)}

          {/* Editing controls */}
          {isEditing && (
            <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {isFree && (
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => bringToFront(item.id)}
                  title="Bring to front"
                  className="rounded-full bg-white/95 p-2 text-[#756477] shadow"
                >
                  <BringToFront size={14} />
                </button>
              )}

              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => openEditItem(item)}
                title="Edit"
                className="rounded-full bg-white/95 p-2 text-[#756477] shadow"
              >
                <Pencil size={14} />
              </button>

              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => deleteItem(item.id)}
                title="Delete"
                className="rounded-full bg-white/95 p-2 text-[#b66d7b] shadow"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  // Display loading and connection errors before showing the board.
  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          {loadError ? (
            <>
              <p className="mb-4 text-sm text-[#8b626b]">{loadError}</p>

              <button
                type="button"
                 onClick={() => window.location.reload()}
                className="rounded-full bg-[#765b70] px-5 py-3 text-sm text-white"
              >
                Try again
              </button>
            </>
          ) : (
            <p className="text-[#8b626b]">Loading your vision board...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#faf8f5] text-[#514656]">
      {/* Save error message */}
      {saveError && (
        <div className="fixed bottom-5 right-5 z-[9999] rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700 shadow-lg">
          {saveError}
        </div>
      )}

      {/* =========================================
          ACTUAL VISION BOARD
      ========================================== */}
      {!isEditing ? (
        <>
          <div
            className="relative min-h-screen w-full overflow-hidden bg-[#faf8f5] px-2 pb-16 pt-5 sm:px-5 sm:pt-7"
            style={{
              backgroundImage:
                "radial-gradient(circle, #eedabfde 1px, transparent 2px)",
              backgroundSize: "30px 30px",
            }}
          >
            <div className="absolute left-6 top-5 z-10 flex gap-2">
              {/* Small board label */}
              <div className="pointer-events-none flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs text-[#a18e9c] shadow-sm backdrop-blur-sm sm:left-8">
                <Heart size={14} className="fill-[#f4cbd9] text-[#e8aebe]" />
                My little world
              </div>
            </div>

            {/* The actual board */}
            <div
              ref={canvasRef}
              className={
                viewMode === "free"
                  ? "relative mx-auto w-full max-w-[1900px]"
                  : "mx-auto w-full max-w-[1900px] columns-1 gap-6 px-3 pt-12 sm:columns-2 sm:px-5 lg:columns-3 2xl:columns-4"
              }
              style={
                viewMode === "free"
                  ? {
                      height: `${canvasHeight}px`,
                      minHeight: "100vh",
                    }
                  : {
                      minHeight: "calc(100vh - 30px)",
                    }
              }
            >
              {items.map((item, index) => renderCard(item, index))}

              {items.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 text-6xl">🌷</div>

                  <h1 className="scrapbook-title text-3xl text-[#766779]">
                    Your dreams will go here.
                  </h1>

                  <p className="mt-2 text-sm text-[#a294a3]">
                    Click the pencil to begin creating your vision board.
                  </p>
                </div>
              )}
            </div>

            {/* Floating pencil button */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Edit vision board"
              title="Edit vision board"
              className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#765b70] text-white shadow-[0_8px_25px_rgba(70,50,70,0.25)] transition hover:-translate-y-1 hover:bg-[#62485d]"
            >
              <Pencil size={21} />
            </button>
          </div>

          {/* Click an item to view it larger */}
          {selectedItem && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#342b38]/45 p-4 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            >
              <div
                className={
                  selectedIsBareImage
                    ? "relative max-h-[88vh] w-full max-w-3xl overflow-visible rounded-lg border-[6px] border-white bg-white p-0 shadow-[0_8px_25px_rgba(30,20,35,0.25)]"
                    : "relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[8px] border border-[#e8e0dc] bg-white p-4 shadow-2xl"
                }
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 text-[#756477] shadow"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                {selectedIsBareImage && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 h-5 w-14 -translate-x-1/2 rotate-2 bg-[#e8c9b8]/75 shadow-[0_2px_5px_rgba(70,50,70,0.12)] backdrop-blur-[1px]" />
                )}

                {renderCardContent(selectedItem)}
              </div>
            </div>
          )}
        </>
      ) : (
        /* =========================================
           VISION BOARD EDITOR
        ========================================== */
        <div className="min-h-screen w-full px-3 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1900px]">
            {/* Editor header */}
            <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e9e0e7] bg-white text-[#847587] transition hover:bg-[#faf7fa]"
                  title="Back to vision board"
                >
                  <ArrowLeft size={17} />
                </button>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b28ca1]">
                    Vision board editor
                  </p>

                  <h1 className="scrapbook-title text-2xl text-[#514656] sm:text-3xl">
                    Arrange your little world
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-full bg-[#765b70] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#62485d]"
              >
                <Check size={16} />
                Save vision board
              </button>
            </header>

            {/* Editor toolbar */}
            <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#eee5e9] bg-white/90 p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-xs text-[#a294a3]">
                  {items.length} {items.length === 1 ? "item" : "items"} on your
                  board
                </p>

                <p className="mt-1 text-sm text-[#806b7b]">
                  Drag cards to arrange them. Your changes are saved as you
                  work.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Layout selector */}
                <div className="flex items-center rounded-full border border-[#e9e0e7] bg-[#faf8f5] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("free")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      viewMode === "free"
                        ? "bg-[#765b70] text-white shadow-sm"
                        : "text-[#847587] hover:bg-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Move size={13} />
                      Free style
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("columns")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      viewMode === "columns"
                        ? "bg-[#765b70] text-white shadow-sm"
                        : "text-[#847587] hover:bg-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <StickyNote size={13} />
                      Columns
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetArrangement}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e9e0e7] bg-white px-3 py-2 text-xs text-[#847587] hover:bg-[#faf7fa]"
                >
                  <RotateCcw size={14} />
                  Reset layout
                </button>

                <button
                  type="button"
                  onClick={() => openNewItem("image")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#765b70] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#62485d]"
                >
                  <Plus size={15} />
                  Add item
                </button>
              </div>
            </section>

            {/* Full-page editor board */}
            <div
              className="w-full overflow-visible rounded-[22px] border border-[#e9e2df] bg-[#faf8f5]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #ded9d2 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
              onDragOver={
                viewMode === "columns"
                  ? (event) => event.preventDefault()
                  : undefined
              }
              onDrop={
                viewMode === "columns"
                  ? (event) => handleColumnDrop(event)
                  : undefined
              }
            >
              <div
                ref={canvasRef}
                className={
                  viewMode === "free"
                    ? "relative w-full"
                    : "w-full columns-1 gap-5 p-4 sm:columns-2 sm:p-6 xl:columns-3 2xl:columns-4"
                }
                style={
                  viewMode === "free"
                    ? {
                        height: `${canvasHeight}px`,
                        minHeight: "1000px",
                      }
                    : {
                        minHeight: "700px",
                      }
                }
              >
                {viewMode === "free" && (
                  <div className="pointer-events-none absolute left-4 top-5 z-0 flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs text-[#a18e9c] sm:left-8">
                    <Move size={14} />
                    Drag cards anywhere you like
                  </div>
                )}

                {items.map((item, index) => renderCard(item, index))}

                {items.length === 0 && (
                  <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                    <div className="mb-4 text-5xl">🌷</div>

                    <h2 className="scrapbook-title text-3xl text-[#766779]">
                      Start your vision board
                    </h2>

                    <p className="mt-2 text-sm text-[#a294a3]">
                      Add pictures, notes, and quotes that represent the life
                      you want.
                    </p>

                    <button
                      type="button"
                      onClick={() => openNewItem("image")}
                      className="mt-5 rounded-full bg-[#765b70] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Add your first item
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 flex items-center gap-2 text-xs text-[#a294a3]">
              {viewMode === "free" ? (
                <>
                  <Move size={13} />
                  Drag any card to position it freely on the board.
                </>
              ) : (
                <>
                  <StickyNote size={13} />
                  Drag a card onto another card to change its order.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* =========================================
          ADD / EDIT ITEM MODAL
      ========================================== */}
      {showEditor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#342b38]/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-[#fffdfb] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#b28ca1]">
                  Your inspiration
                </p>

                <h2 className="scrapbook-title mt-1 text-2xl text-[#514656]">
                  {editingItem ? "Edit this piece" : "Add to your board"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="rounded-full bg-[#f5eff3] p-2 text-[#806d80]"
                aria-label="Close editor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Item type */}
            <div className="mb-5 grid grid-cols-3 gap-2">
              {[
                { value: "image", label: "Picture", icon: ImageIcon },
                { value: "note", label: "Note", icon: StickyNote },
                { value: "quote", label: "Quote", icon: Quote },
              ].map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => changeType(option.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition ${
                      form.type === option.value
                        ? "border-[#b99aaf] bg-[#f6eaf0] text-[#75586e]"
                        : "border-[#eee7eb] bg-white text-[#9a8b99]"
                    }`}
                  >
                    <Icon size={19} />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Title {form.type === "image" ? "(optional)" : ""}
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="Give this dream a name..."
                  className="w-full rounded-xl border border-[#eee5eb] bg-white px-4 py-3 text-sm text-[#514656] outline-none focus:border-[#c5a5b8]"
                />
              </div>

              {/* Image URL */}
              {form.type === "image" && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#766779]">
                    Picture URL
                  </label>

                  <input
                    value={form.image}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        image: event.target.value,
                      })
                    }
                    placeholder="Paste an image URL..."
                    className="w-full rounded-xl border border-[#eee5eb] bg-white px-4 py-3 text-sm text-[#514656] outline-none focus:border-[#c5a5b8]"
                  />

                  <p className="mt-2 text-xs text-[#a99ba8]">
                    Image uploads can be added in a later step.
                  </p>
                </div>
              )}

              {/* Description or quote */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  {form.type === "quote"
                    ? "Your quote"
                    : "A little description (optional)"}
                </label>

                <textarea
                  rows={4}
                  value={form.text}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      text: event.target.value,
                    })
                  }
                  placeholder="Write something you want to remember..."
                  className="w-full resize-none rounded-xl border border-[#eee5eb] bg-white px-4 py-3 text-sm leading-6 text-[#514656] outline-none focus:border-[#c5a5b8]"
                />
              </div>

              {/* Card size */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Card size
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() =>
                        setForm({
                          ...form,
                          size,
                        })
                      }
                      className={`rounded-xl border px-3 py-2 text-xs capitalize ${
                        form.size === size
                          ? "border-[#b99aaf] bg-[#f6eaf0] text-[#75586e]"
                          : "border-[#eee7eb] text-[#9a8b99]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card color */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Background color
                </label>

                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() =>
                        setForm({
                          ...form,
                          color,
                        })
                      }
                      aria-label={`Choose ${color}`}
                      className={`h-8 w-8 rounded-full border-2 ${
                        form.color === color
                          ? "border-[#776278] ring-2 ring-[#e8dce7]"
                          : "border-white"
                      }`}
                      style={{
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="flex-1 rounded-full border border-[#eee5eb] px-4 py-3 text-sm font-medium text-[#847587]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveItem}
                disabled={
                  form.type === "image"
                    ? !form.image.trim()
                    : !form.title.trim() && !form.text.trim()
                }
                className="flex-1 rounded-full bg-[#765b70] px-4 py-3 text-sm font-semibold text-white hover:bg-[#62485d] disabled:opacity-40"
              >
                {editingItem ? "Save changes" : "Add to my board"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
