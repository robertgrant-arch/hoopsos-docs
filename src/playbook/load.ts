import { Play } from "./types";
import { migrate } from "./migrate";

export function loadPlay(raw: any): Play {
  if (raw && raw.schema === "v2") return raw as Play;
  return migrate(raw);
}

export function assertV2(p: Play) {
  if (!p || p.schema !== "v2") throw new Error("refusing to handle non-v2 play");
}
