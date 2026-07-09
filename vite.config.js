import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// 単一HTMLファイルに全部バンドルする（社内PCでダウンロード1ファイルで動かすため）
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist",
  },
});
