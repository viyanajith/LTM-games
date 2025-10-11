// ================== GraviTrax ULTIMATE - config.js ==================
// Configuration file containing all modifiable constants and variables
// Modify these values to change game behavior without touching game.js

// ---- LOD (Level of Detail) Configuration ----
const LOD_NORMAL = 0;       // Distance for detailed models (0 = always show at this level when closest)
const LOD_SIMPLE = 50;      // Distance threshold for simplified models (switch when farther than this)

// ---- Grid and Plate Configuration ----
const GRID_RADIUS = 3;      // Radius of the hexagonal grid
const CELL_RADIUS = 1.0;    // Radius of each hexagonal cell
const HOLE_RATIO = 0.7;     // Hole size as ratio of cell radius (0.7 = 70%)
const PLATE_THICKNESS = 0.4; // Thickness of the base plate

// ---- Piece Dimensions Configuration ----
const STACKER_RADIUS_RATIO = 0.75;    // Stacker radius as ratio of CELL_R (0.75 = 75%)
const STACKER_HOLE_RATIO = 0.85;      // Stacker hole as ratio of HOLE_R (0.85 = 85%)
const THIN_STACKER_HEIGHT_RATIO = 0.475; // Thin stacker height as ratio of PLATE_H (47.5%)
const BLUE_STACKER_RADIUS_RATIO = 0.92;  // Blue stacker radius as ratio of CELL_R (92%)
const INNER_HOLE_RATIO = 0.95;        // Inner hole size ratio (95% of stacker hole)
const INNER_HEIGHT_RATIO = 0.7;      // Inner piece height ratio (59% of outer height, 1.35x thinner than before)
// Piece icon image src's
const PIECE_ICONS_IMG = {
    STACKER: 'https://static.wikia.nocookie.net/gravitrax/images/d/dd/Full_Height_Tile_Schematic.png/revision/latest/scale-to-width/360?cb=20210120224936',
    THIN_STACKER: 'https://static.wikia.nocookie.net/gravitrax/images/e/ed/1-2_Height_Tile_Schematic.png/revision/latest/scale-to-width/360?cb=20210120224809',
    CURVED_PIECE: 'https://static.wikia.nocookie.net/gravitrax/images/9/95/Curve_Schematic.png/revision/latest?cb=20210120221547'
}
// ---- Piece Colors (RGB format) ----
const COLORS = {
  // Light grey for stacker outer (formerly 0xdddddd)
  STACKER_OUTER: { r: 201, g: 201, b: 201 },
  // Same as outer (lighting creates difference)
  STACKER_INNER: { r: 176, g: 176, b: 176 },
  // Medium grey for thin stacker outer (formerly 0x939393)
  THIN_STACKER_OUTER: { r: 107, g: 107, b: 107 },
  // Same as outer (lighting creates difference)
  THIN_STACKER_INNER: { r: 72, g: 72, b: 72 },
  // Blue for curved piece (formerly 0x3296FA)
  CURVED_PIECE: { r: 50, g: 150, b: 250 },
  // Red for hover highlight (formerly 0xff3030)
  HIGHLIGHT: { r: 255, g: 48, b: 48 }
};

// ---- Opacity Settings ----
const HIGHLIGHT_OPACITY = 0.45;        // Opacity of hover highlight

// ---- Stacking Configuration ----
const STACK_GAP_RATIO = 0.025;        // Gap between stacked pieces as ratio of PLATE_H (2.5%)
const STACK_DETECTION_RATIO = 0.5;    // Distance ratio for detecting pieces to stack on

// ---- Hover and Interaction Configuration ----
const MOVE_THROTTLE = 16;              // Hover move throttle in milliseconds (~60 fps)
const HIGHLIGHT_THICKNESS = 0.04;      // Thickness of hover highlight
const HIGHLIGHT_OFFSET = 0.001;        // Y offset for highlight above plate

// ---- Piece Types Configuration ----
const PIECE_TYPES = {
  STACKER: "stacker",
  THIN_STACKER: "thin_stacker", 
  CURVED_PIECE: "curved_piece"
};

// ---- Material Properties ----
const MATERIAL_PROPERTIES = {
  PHONG_SPECULAR: { r: 170, g: 170, b: 170 },   // Specular highlight color for shiny materials (light grey)
  PHONG_SHININESS: 12,        // Shininess value for phong materials
  POLYGON_OFFSET_FACTOR: -2,  // Polygon offset factor for highlight
  POLYGON_OFFSET_UNITS: -2    // Polygon offset units for highlight
};

// ---- Raycast and Picking Configuration ----
const PICK_PLANE_OPACITY = 0.0;       // Opacity of invisible pick plane
const PICK_PLANE_MARGIN = 3;          // Margin around grid for pick plane
const RAYCAST_MAX_DISTANCE = LOD_SIMPLE+3;  // Maximum distance for raycasting

// Export all configuration for use in game.js
if (typeof window !== 'undefined') {
  // Browser environment
  // Use Object.assign to preserve any existing properties
  window.GameConfig = Object.assign(window.GameConfig || {}, {
    LOD_NORMAL,
    LOD_SIMPLE,
    GRID_RADIUS,
    CELL_RADIUS,
    HOLE_RATIO,
    PLATE_THICKNESS,
    STACKER_RADIUS_RATIO,
    STACKER_HOLE_RATIO,
    THIN_STACKER_HEIGHT_RATIO,
    BLUE_STACKER_RADIUS_RATIO,
    INNER_HOLE_RATIO,
    INNER_HEIGHT_RATIO,
    COLORS,
    STACK_GAP_RATIO,
    STACK_DETECTION_RATIO,
    MOVE_THROTTLE,
    HIGHLIGHT_THICKNESS,
    HIGHLIGHT_OPACITY,
    HIGHLIGHT_OFFSET,
    PIECE_TYPES,
    PIECE_ICONS_IMG,
    MATERIAL_PROPERTIES,
    PICK_PLANE_OPACITY,
    PICK_PLANE_MARGIN,
    RAYCAST_MAX_DISTANCE
  });}