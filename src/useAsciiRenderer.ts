import React, { useEffect } from "react";

type Options = {
    src: string;
    charset?: string;
    width: number;
    height: number;
    invert?: boolean;
};

const DEFAULT_CHARSET = "@%#*+=-:. ";

export function useAsciiRenderer(
    preRef: React.RefObject<HTMLPreElement>,
    { src, charset = DEFAULT_CHARSET, width, height, invert = false }: Options
) {
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, width, height);
            const { data } = ctx.getImageData(0, 0, width, height);

            const chars = invert ? charset : [...charset].reverse().join("");
            const lines: string[] = [];

            for (let y = 0; y < height; y++) {
                let row = "";
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    const idx = Math.floor((lum / 255) * (chars.length - 1));
                    row += chars[idx];
                }
                lines.push(row);
            }

            if (preRef.current) {
                preRef.current.textContent = lines.join("\n");
            }
        };
    }, [src, charset, width, height, invert, preRef]);
}