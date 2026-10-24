# AAIR brand assets

Imported from the supplied artwork. Original PDF/JPG files are retained in the parent directory. SVG icons retain the PDF paths with tight viewports; navy colors are sampled from the rendered originals.

| Source | Web asset |
| --- | --- |
| 1.pdf | `knowledge-graph.svg` |
| 2.pdf | `analytics.svg` |
| 3.pdf | `responsibility.svg` |
| 4.pdf | `innovation.svg` |
| 5.pdf | `impact.svg` |
| 6.pdf | `quality-trust.svg` |
| 7.pdf | `data-integration.svg` |
| 8.pdf | `knowledge-engineering.svg` |
| 9.pdf | `ai-agents.svg` |
| 10.pdf | `collaboration.svg` |
| 11.pdf | `research.svg` |
| 12.pdf | `ai-reasoning.svg` |

`aair-logo.svg` embeds the existing transparent rendition matching the supplied logo, with a tighter viewport. It preserves the original gradient raster pixels; it is not a vector reconstruction. Use at navigation sizes or up to 120 CSS pixels.

## Website usage

All 13 supplied PDFs and 5 supplied JPGs are preserved unchanged in `resource/icon/`. Use the SVG assets in this directory in the UI instead of the large original artboards, which contain generous white margins.

- Home features: `knowledge-engineering.svg`, `ai-agents.svg`, `quality-trust.svg`, and `data-integration.svg`.
- Navigation, sign-in, public-page headers/footers, and page favicons: `aair-logo.svg`.
- Keep each image's aspect ratio with `object-fit: contain`. Icons use a transparent background and their original navy artwork.
- Decorative images next to visible labels use an empty `alt`; standalone images need a descriptive accessible label.

```html
<img src="/resource/icon/brand/ai-agents.svg" alt="" width="64" height="64">
```

Home uses the supplied identity colors: navy `#0A3D91`, teal `#00A3B5`, ink `#1F2937`, and muted text `#4B5563`.
