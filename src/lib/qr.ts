import QRCode from "qrcode";
import { env } from "@/env";

export async function assetQrDataUrl(id: string): Promise<string> {
  const svg = await QRCode.toString(`${env.BETTER_AUTH_URL}/assets/${id}`, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
