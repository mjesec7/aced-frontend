// Auto-generated Europe map SVG for geography exercises
export const generateEuropeMap = () => {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Ocean background -->
  <rect fill="#b3d9ff" width="800" height="600"/>
  
  <!-- Countries -->
  <!-- Norway -->
  <path d="M 400,50 L 450,60 L 480,100 L 490,150 L 470,180 L 450,170 L 430,150 L 410,120 L 400,80 Z" 
        fill="#ffcccc" stroke="#333" stroke-width="1.5"/>
  <text x="445" y="120" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Norway</text>
  
  <!-- France -->
  <path d="M 280,250 L 350,240 L 380,260 L 390,300 L 370,340 L 320,350 L 280,330 L 260,290 Z" 
        fill="#ffe6cc" stroke="#333" stroke-width="1.5"/>
  <text x="315" y="295" font-family="Arial" font-size="14" fill="#333" font-weight="bold">France</text>
  
  <!-- Russia -->
  <path d="M 550,100 L 700,110 L 750,200 L 740,300 L 700,320 L 600,310 L 560,250 L 550,150 Z" 
        fill="#ccffcc" stroke="#333" stroke-width="1.5"/>
  <text x="640" y="220" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Russia</text>
  
  <!-- Italy -->
  <path d="M 420,350 L 450,340 L 470,380 L 480,430 L 470,480 L 450,500 L 430,490 L 415,450 L 410,400 Z" 
        fill="#ccccff" stroke="#333" stroke-width="1.5"/>
  <text x="435" y="420" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Italy</text>
  
  <!-- Spain -->
  <path d="M 150,340 L 240,350 L 260,380 L 250,420 L 200,430 L 140,410 L 130,370 Z" 
        fill="#ffffcc" stroke="#333" stroke-width="1.5"/>
  <text x="185" y="390" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Spain</text>
  
  <!-- Germany -->
  <path d="M 380,200 L 450,195 L 480,220 L 485,260 L 460,280 L 410,285 L 370,260 L 365,230 Z" 
        fill="#ffccff" stroke="#333" stroke-width="1.5"/>
  <text x="415" y="245" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Germany</text>
  
  <!-- UK -->
  <path d="M 250,150 L 300,145 L 320,170 L 315,200 L 285,215 L 250,210 L 235,180 Z" 
        fill="#ccffff" stroke="#333" stroke-width="1.5"/>
  <text x="270" y="180" font-family="Arial" font-size="14" fill="#333" font-weight="bold">UK</text>
  
  <!-- Grid lines for reference (light) -->
  <line x1="0" y1="150" x2="800" y2="150" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  <line x1="0" y1="300" x2="800" y2="300" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  <line x1="0" y1="450" x2="800" y2="450" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  <line x1="200" y1="0" x2="200" y2="600" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  <line x1="400" y1="0" x2="400" y2="600" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  <line x1="600" y1="0" x2="600" y2="600" stroke="#ddd" stroke-width="0.5" stroke-dasharray="5,5"/>
  
  <!-- Title -->
  <text x="400" y="30" font-family="Arial" font-size="24" fill="#333" text-anchor="middle" font-weight="bold">Europe</text>
</svg>`;
};

// City coordinates (percentage-based for responsive positioning)
export const europeCities = {
    bergen: { x: 58, y: 16, label: 'Bergen', country: 'Norway' },
    paris: { x: 39, y: 48, label: 'Paris', country: 'France' },
    moscow: { x: 85, y: 32, label: 'Moscow', country: 'Russia' },
    rome: { x: 54, y: 70, label: 'Rome', country: 'Italy' },
    madrid: { x: 23, y: 65, label: 'Madrid', country: 'Spain' },
    berlin: { x: 52, y: 40, label: 'Berlin', country: 'Germany' },
    london: { x: 34, y: 32, label: 'London', country: 'UK' }
};

export default { generateEuropeMap, europeCities };
