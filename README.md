# 3D Place - Collaborative 3D Canvas

A 3D version of r/place built with Three.js, allowing users to place colored cubes in a 3D space. This interactive web application provides a modern, immersive experience for collaborative digital art creation.

## Features

### 🎨 Interactive 3D Canvas
- **3D Grid System**: Place cubes on a 50x50 grid in 3D space
- **Real-time Interaction**: Click anywhere on the canvas to place cubes
- **Grid Snapping**: Cubes automatically snap to the grid for precise placement
- **Cube Replacement**: Click on existing cubes to replace them with new colors

### 🎯 Color Palette
- **12 Predefined Colors**: Red, Green, Blue, Yellow, Magenta, Cyan, Orange, Purple, White, Black, Gray, Pink
- **Visual Selection**: Click on color swatches to select your current color
- **Color Feedback**: Selected color is highlighted in the UI

### 🎮 Camera Controls
- **Orbit Controls**: Drag to rotate the view around the canvas
- **Zoom**: Scroll to zoom in and out
- **Reset Camera**: Button to return to the default view
- **Smooth Movement**: Damped controls for fluid camera movement

### 🛠️ Tools & Utilities
- **Clear Canvas**: Remove all placed cubes with confirmation
- **Save Image**: Download the current view as a PNG image
- **Statistics**: Real-time counter showing number of cubes placed
- **Responsive Design**: Works on desktop and mobile devices

### ✨ Visual Effects
- **Shadows**: Realistic lighting with cast and receive shadows
- **Smooth Animations**: Cubes animate in with a bouncy effect when placed
- **Modern UI**: Glassmorphism design with backdrop blur effects
- **Professional Lighting**: Multiple light sources for optimal visibility

## How to Use

### Getting Started
1. Open `index.html` in a modern web browser
2. The 3D canvas will load with a grid and ground plane
3. Select a color from the palette on the left
4. Click anywhere on the canvas to place cubes

### Controls
- **Mouse Click**: Place or replace cubes
- **Mouse Drag**: Rotate the camera view
- **Mouse Scroll**: Zoom in/out
- **Color Palette**: Click to select colors
- **Tool Buttons**: Use for canvas management

### Tips
- Use the grid lines as reference for precise placement
- Try different camera angles to see your creation from various perspectives
- Save your work regularly using the Save Image button
- Experiment with different color combinations

## Technical Details

### Built With
- **Three.js**: 3D graphics library for WebGL rendering
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with gradients and animations
- **HTML5**: Semantic markup structure

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance
- Optimized for smooth 60fps rendering
- Efficient cube management with Map data structure
- Responsive design that adapts to screen size
- Hardware-accelerated 3D rendering

## File Structure
```
3D-Place/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript application logic
└── README.md           # This documentation
```

## Future Enhancements

Potential features for future versions:
- **Multiplayer Support**: Real-time collaboration with other users
- **3D Layers**: Ability to place cubes at different heights
- **Custom Colors**: Color picker for unlimited color options
- **Undo/Redo**: History management for actions
- **Export Options**: 3D model export (OBJ, STL)
- **Presets**: Pre-built patterns and templates
- **Mobile Touch**: Optimized touch controls for mobile devices

## Contributing

Feel free to fork this project and add your own features! Some areas for contribution:
- Additional tools and brushes
- New color palettes
- Performance optimizations
- Mobile responsiveness improvements
- Accessibility enhancements

## License

This project is open source and available under the MIT License.

---

**Enjoy creating in 3D!** 🎨✨
