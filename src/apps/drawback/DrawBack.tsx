import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './DrawBack.module.css';

interface Props {
  windowId: string;
}

const BRUSH_SIZES = [2, 5, 10, 20];

export default function DrawBack({ windowId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#FFD700');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  const getCanvasPos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    drawLine(pos, pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const pos = getCanvasPos(e);
    drawLine(lastPos.current, pos);
    lastPos.current = pos;
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveAsPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'drawback_artwork.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className={styles.container} onClick={() => setOpenMenu(null)}>
      <div className={styles.menuBar}>
        <div
          className={styles.menuItem}
          onClick={(e) => { e.stopPropagation(); handleMenuClick('file'); }}
        >
          File
          {openMenu === 'file' && (
            <div className={styles.menuDropdown}>
              <div className={styles.menuDropdownItem} onClick={clearCanvas}>New</div>
              <div className={styles.menuDropdownItem} onClick={saveAsPng}>Save as PNG</div>
            </div>
          )}
        </div>
        <div
          className={styles.menuItem}
          onClick={(e) => { e.stopPropagation(); handleMenuClick('edit'); }}
        >
          Edit
          {openMenu === 'edit' && (
            <div className={styles.menuDropdown}>
              <div className={styles.menuDropdownItem} onClick={clearCanvas}>Clear</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.toolbar}>
        <span className={styles.toolLabel}>Color:</span>
        <input
          type="color"
          className={styles.colorPicker}
          value={color}
          onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
        />

        <span className={styles.toolLabel}>Size:</span>
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            className={`${styles.brushBtn} ${brushSize === size && !isEraser ? styles.brushBtnActive : ''}`}
            onClick={() => { setBrushSize(size); setIsEraser(false); }}
          >
            {size}px
          </button>
        ))}

        <button
          className={`${styles.eraserBtn} ${isEraser ? styles.eraserBtnActive : ''}`}
          onClick={() => setIsEraser(!isEraser)}
        >
          Eraser
        </button>

        <button className={styles.clearBtn} onClick={clearCanvas}>
          Clear All
        </button>
      </div>

      <div ref={containerRef} className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className={styles.statusBar}>
        <span>Tool: {isEraser ? 'Eraser' : 'Brush'} | Size: {brushSize}px</span>
        <span>Draw.back&trade;</span>
      </div>
    </div>
  );
}
