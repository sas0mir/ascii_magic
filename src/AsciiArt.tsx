import React, { useRef } from "react";
import { useAsciiRenderer } from "./useAsciiRenderer";

export default function AsciiArt(props) {
    const preRef = useRef<HTMLPreElement>(null);
    useAsciiRenderer(preRef, props);

    return (
        <pre
            ref={preRef}
            style={{
                fontFamily: 'monospace',
                lineHeight: "1",
                fontSize: "8px",
                margin: 0
            }}
        />
    );
}