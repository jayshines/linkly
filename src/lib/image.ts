import { MAX_AVATAR_CHARS } from "@/lib/validators";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/**
 * Centre-crops an image file to a square, shrinks it to `size` px and returns a
 * JPEG data URL small enough to store in the database. Browser only.
 */
export async function fileToAvatar(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 10 MB");

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read that image"));
      i.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process images");
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    // Lower the quality until it fits the size limit
    for (let q = 0.88; q >= 0.4; q -= 0.12) {
      const data = canvas.toDataURL("image/jpeg", q);
      if (data.length <= MAX_AVATAR_CHARS) return data;
    }
    throw new Error("That image is too detailed to store. Try another.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
