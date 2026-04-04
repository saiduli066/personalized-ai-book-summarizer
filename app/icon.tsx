import { ImageResponse } from "next/og";

export const size = {
    width: 512,
    height: 512,
};

export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 60%, #1e293b 100%)",
                    color: "white",
                    fontSize: 240,
                    fontWeight: 800,
                    borderRadius: 96,
                    letterSpacing: -8,
                }}
            >
                I
            </div>
        ),
        {
            ...size,
        },
    );
}
