import type { MetadataRoute } from "next"

// Installable app. On Android, `share_target` puts "Bundel" in the system share
// sheet so a link can be saved from any app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bundel",
    short_name: "Bundel",
    description: "Collect links and share them as one beautiful page.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#fbfbfd",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  }
}
