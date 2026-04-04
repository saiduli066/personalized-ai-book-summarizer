import { ImageResponse } from "next/og";

export const size = {
    width: 180,
    height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
                    fontSize: 92,
                    fontWeight: 800,
                    borderRadius: 40,
                    letterSpacing: -3,
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
