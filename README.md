# Image Dataset Selector

A lightweight desktop app to select and organize images for your machine learning datasets.

## Features

- 📁 **Select any folder** - Choose a directory with images  
- 🖼️ **Efficient image grid** - Preview multiple images with adjustable size (80-300px)
- ✓ **Easy selection** - Click to select/deselect images  
- 🗑️ **Delete to Recycle Bin** - Safely remove unwanted images
- ⚡ **Quick workflow** - Keep selected or delete selected in one click
- 📦 **Supports all common formats** - JPG, PNG, GIF, BMP, WebP, SVG

## Installation

1. Clone this repository or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development version:
   ```bash
   npm run dev
   ```

Or build for production:
```bash
npm run build
```

## How to Use

1. Click **"📁 Select Folder"** to choose a folder containing images
2. All images in that folder will load into the grid
3. **Adjust preview size** using the slider (80-300px)
4. **Click images** to select them (shows green checkmark)
5. Use bulk actions:
   - **Select All** - Select every image
   - **Delete Selected** - Remove checked images to Recycle Bin
   - **Keep Selected & Delete Rest** - Remove all unchecked images

## Tips

- Smaller preview sizes (80-120px) let you see more images quickly
- Larger previews (200-300px) help you inspect image quality better
- Hover over images to see filename at the bottom
- All deletions go to Recycle Bin (recoverable)

## System Requirements

- Windows 7+, macOS 10.10+, or Linux
- ~100MB disk space

## Built With

- Electron - Desktop app framework
- React - UI framework
- Node.js - Backend

## License

MIT
