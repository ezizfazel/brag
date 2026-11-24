# PROMAX DAILY PRICE

Excel price list → premium 30-second Instagram Reels for **PROMAX MOBILE** (1080×1920, 30 fps, H.264/AAC).

## Daily workflow (no code editing)

1. `npm run dev` → open http://localhost:3000
2. Drag today's Excel file onto the upload box (or download the template there).
3. Review the product count, brands, missing images, invalid prices and every warning.
4. **پیش‌نمایش سریع**: a low-res preview of every part (`output/preview/preview.mp4`).
5. **ساخت ریلز نهایی**: final Reels, thumbnails and `quality-report.json` in `output/daily/<date>/`.
6. **خروجی نهایی**: copies QC-passed files to `output/export/<date>/`.

The same steps from the terminal:

| Command | What it does |
|---|---|
| `npm run dev` | Dashboard (PORT env to change 3000) |
| `npm run validate [-- --input file.xlsx]` | Validate Excel + assets, show the reel plan and data QC |
| `npm run preview` | Low-resolution preview of all parts |
| `npm run generate` | Final Reels + thumbnails + quality report |
| `npm run export` | Copy the latest QC-passed Reels to `output/export/<date>/` |
| `npm run template` | Re-create `templates/PROMAX-DAILY-PRICES.xlsx` |
| `npm run studio` | Remotion Studio for design work |

By default the commands read `data/uploads/latest.xlsx` (the dashboard writes the uploaded file there).

## Excel (single source of truth)

`templates/PROMAX-DAILY-PRICES.xlsx` has three sheets.

- **Products**: `product_id, brand, series, model, storage, color, part_number, price_toman, front_image, back_image, video_asset, active, display_order`, plus optional `color_hex` (swatch / placeholder tint), `condition` (e.g. نات اکتیو) and `note`.
- **Settings**: `update_date, currency, price_unit, reel_duration, fps, resolution, brand_name, instagram_username, background_music, show_part_number, show_color, show_storage, allow_placeholders`.
- **Assets**: `asset_id, product_id, asset_type (front|back|model3d|video), file_path, verified`. Only rows with `verified = yes` are used.

`price_unit = thousand_toman` shows the number exactly as typed, with the label «هزار تومان». `toman` shows it with «تومان».

Validation reports problems and never fixes them by guessing:
- missing or invalid prices
- duplicate IDs
- invalid storage or part numbers (`CH/A`, `ZA/A`, `LL/A`…)
- missing or low-resolution images
- inactive products
- unsupported series

Rows with errors are **left out of the videos and listed**. A price typed with a dot as a thousands separator (`432.800`) is read as 432,800 and flagged for confirmation.

## Product images

Put files in `assets/products/<iphone18|iphone17|iphone_duo|samsung_s26>/`. Write the path, relative to `assets/`, in `front_image` / `back_image`, or add it as a verified row in the Assets sheet.
- Formats: PNG/JPG/WEBP. A transparent background looks best.
- A product without a verified image is shown as a clean **branded placeholder device** in its colour and reported in the QC report. Set `allow_placeholders = no` to block final export instead.
- An unrelated phone image is never substituted.

## How it works

- `python/promax_excel.py`: template, import and validation (openpyxl). Also does an independent raw read (`dump`) for QC.
- `src/shared/plan.ts`:
  - Groups variants by model + storage + part number.
  - Packs groups into Reels of ≤ 30 s, keeping a series together; splits into Part 1/2/3… when needed.
  - Never drops a variant.
- `src/remotion/`: the video, written in Remotion + React.
  - `Stage3D` is the three.js environment (portal rings, beams, grid, particles).
  - `SmartphoneShowcase` is a **2.5D** device built from the front/back images: extruded edge, rim light, light sweep, reflection, shadow, motion blur. It is not a true 3D model.
  - `PriceCard` holds the GSAP price panel and the ColorShowcase list.
  - Intro and Outro are GSAP-animated.
- `python/promax_audio.py`: an original score and SFX, synthesised in code, so they are royalty-free. Cues: logo impact, device bass hit, mechanical rotation, digital colour sweep, price-reveal UI impact, transition whoosh, PROMAX signature. It handles side-chain ducking and soft-clip; FFmpeg masters to -14 LUFS / -1.5 dBTP. To use your own track, put it in `assets/music/` and set `background_music`.
- `src/pipeline/qc.ts`: quality control before and after rendering.
  - Before rendering: every displayed price, model, colour, storage and part number is compared with an independent read of the Excel; all variants must be accounted for; also checks Persian digits, safe zones, fonts and the timeline.
  - After rendering: duration ≤ 30 s, encoding, audio, loudness.
  - A failed check blocks the export.

Remotion is free for individuals and companies with up to 3 employees; larger companies need a Remotion company licence.
