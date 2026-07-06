import { useState, useEffect } from "react";
import idleImg from "./idle.png";
import hablandoImg from "./hablando.png";

interface AvatarProps {
  talking: boolean;
}

export default function Avatar({ talking }: AvatarProps) {
  const [frame, setFrame] = useState<"idle" | "hablando">("idle");

  useEffect(() => {
    if (!talking) {
      setFrame("idle");
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev === "idle" ? "hablando" : "idle"));
    }, 300);

    return () => clearInterval(interval);
  }, [talking]);

  return (
    <div className="avatar-container">
      <img
        src={frame === "idle" ? idleImg : hablandoImg}
        alt="Smartina"
        className="avatar-image"
      />
    </div>
  );
}
