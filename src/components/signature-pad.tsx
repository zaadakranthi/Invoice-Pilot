
'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

interface SignaturePadProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  onSignatureEnd?: (dataUrl: string) => void;
  initialDataUrl?: string | null;
}

export const SignaturePad = forwardRef<{ clear: () => void }, SignaturePadProps>(
  ({ className, onSignatureEnd, initialDataUrl, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastX = useRef(0);
    const lastY = useRef(0);

    const clear = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (onSignatureEnd) {
             onSignatureEnd('');
          }
        }
      }
    };
    
    useImperativeHandle(ref, () => ({
        clear,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight < 150 ? 150 : parent.clientHeight;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (initialDataUrl) {
            const image = new Image();
            image.onload = () => {
              ctx.drawImage(image, 0, 0);
            };
            image.src = initialDataUrl;
          }
        }
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);


      const getEventPosition = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
          return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        } else {
          return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
      };

      const startDrawing = (event: MouseEvent | TouchEvent) => {
        isDrawing.current = true;
        const pos = getEventPosition(event);
        [lastX.current, lastY.current] = [pos.x, pos.y];
      };

      const draw = (event: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        event.preventDefault();
        const pos = getEventPosition(event);
        ctx.beginPath();
        ctx.moveTo(lastX.current, lastY.current);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        [lastX.current, lastY.current] = [pos.x, pos.y];
      };

      const stopDrawing = () => {
        if (isDrawing.current && onSignatureEnd) {
          onSignatureEnd(canvas.toDataURL('image/png'));
        }
        isDrawing.current = false;
      };

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);

      // Touch events
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [onSignatureEnd, initialDataUrl]);

    return (
      <div className="relative w-full h-32 rounded-md border bg-white cursor-crosshair">
        <canvas
            ref={canvasRef}
            className={cn('w-full h-full rounded-md', className)}
            {...props}
        />
      </div>
    );
  }
);
SignaturePad.displayName = 'SignaturePad';
