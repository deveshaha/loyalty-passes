"use client";

import QRCode from "react-qr-code";

export default function QrClient({ value }: { value: string }) {
  return (
    <div className="rounded-xl border p-4 flex items-center justify-center">
      <QRCode value={value} size={220} />
    </div>
  );
}