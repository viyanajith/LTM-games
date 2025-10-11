
document.addEventListener('DOMContentLoaded', function() {
  (function() {
    if(!window.GameConfig) {
      console.error("GameConfig not found! Make sure config.js is loaded before game.js.");
      return;
    }
    
    const LOD_NORMAL=window.GameConfig.LOD_NORMAL;
    const LOD_SIMPLE=window.GameConfig.LOD_SIMPLE;
    try {
      if(!scene || !camera || !renderer) {
        console.warn("[game] Missing scene/camera/renderer globals.");
        return;
      }
    } catch(e) {
      console.warn("[game] Scene globals not available yet.");
      return;
    }

    const RADIUS=window.GameConfig.GRID_RADIUS;
    const CELL_R=window.GameConfig.CELL_RADIUS;
    const HOLE_R=CELL_R*window.GameConfig.HOLE_RATIO;
    const PLATE_H=window.GameConfig.PLATE_THICKNESS;

    const validHexPositions=[{q:0, r:0}]; // Center only

    function isValidHexPosition(q, r) {
      return validHexPositions.some(pos=>pos.q===q && pos.r===r);
    }

  function isPlacementTool(tool) {
    return tool==="stacker" || tool==="thin_stacker" || tool==="curved_piece";
  }

  function worldToAxial(x,z,r){
    const qf=(x/(Math.sqrt(3)*r))-(z/(3*r));
    const rf=z/(1.5*r);
    return axialRound(qf,rf);
  }
  function axialRound(qf,rf){
    let x=qf, z=rf, y=-x-z;
    let rx=Math.round(x), ry=Math.round(y), rz=Math.round(z);
    const dx=Math.abs(rx-x), dy=Math.abs(ry-y), dz=Math.abs(rz-z);
    if(dx>dy && dx>dz) rx=-ry-rz;
    else if(dy>dz) ry=-rx-rz;
    else rz=-rx-ry;
    return {q:rx, r:rz};
  }
  function axialToWorld(q,r,cellR){
    const hx=Math.sqrt(3)*cellR;
    const hz=1.5*cellR;
    return {x:hx*(q+r/2), z:hz*r};
  }
  function axialInDisk(q,r,R){
    return Math.abs(q)<=R && Math.abs(r)<=R && Math.abs(q+r)<=R;
  }

  function makeHexShape(radius){
    const s=new THREE.Shape();
    for(let i=0; i<6; i++){
      const a=(i/6)*Math.PI*2;
      const px=radius*Math.cos(a);
      const py=radius*Math.sin(a);
      if(i===0) s.moveTo(px,py); else s.lineTo(px,py);
    }
    s.closePath();
    return s;
  }

  let cachedOuterGeom=null, cachedInnerGeom=null;
  let cachedThinOuterGeom=null, cachedThinInnerGeom=null;
  let cachedSimplifiedGeom=null;
  let cachedSimplifiedThinGeom=null;
  
  function ensureGeomCache() {
    if(cachedOuterGeom && cachedInnerGeom && cachedThinOuterGeom && cachedThinInnerGeom && 
        cachedSimplifiedGeom && cachedSimplifiedThinGeom) return;

    const stackerRadius=CELL_R*window.GameConfig.STACKER_RADIUS_RATIO;
    const stackerHoleR=HOLE_R*window.GameConfig.STACKER_HOLE_RATIO;

    const outerShape=makeHexShape(stackerRadius);
    const holePath=new THREE.Path();
    for(let i=5; i>=0; i--) {
      const a=(i/6)*Math.PI*2;
      const px=stackerHoleR*Math.cos(a);
      const py=stackerHoleR*Math.sin(a);
      if(i===5) holePath.moveTo(px,py); else holePath.lineTo(px,py);
    }
    holePath.closePath();
    outerShape.holes.push(holePath);

    cachedOuterGeom=new THREE.ExtrudeGeometry(outerShape, {depth:PLATE_H, bevelEnabled:false});
    cachedInnerGeom=new THREE.ExtrudeGeometry(makeHexShape(stackerHoleR*window.GameConfig.INNER_HOLE_RATIO), {depth:PLATE_H*window.GameConfig.INNER_HEIGHT_RATIO, bevelEnabled:false});

    const thinH=PLATE_H*window.GameConfig.THIN_STACKER_HEIGHT_RATIO;
    const thinInnerH=thinH*window.GameConfig.INNER_HEIGHT_RATIO;
    cachedThinOuterGeom=new THREE.ExtrudeGeometry(outerShape, {depth:thinH, bevelEnabled:false});
    cachedThinInnerGeom=new THREE.ExtrudeGeometry(makeHexShape(stackerHoleR*0.95), {depth:thinInnerH, bevelEnabled:false});
    
    cachedSimplifiedGeom=new THREE.ExtrudeGeometry(makeHexShape(stackerRadius), {depth:PLATE_H, bevelEnabled:false});
    cachedSimplifiedThinGeom=new THREE.ExtrudeGeometry(makeHexShape(stackerRadius), {depth:thinH, bevelEnabled:false});
  }

  function getRGBColor(colorObj) {
    return new THREE.Color(
      colorObj.r/255,
      colorObj.g/255,
      colorObj.b/255
    );
  }
  
  const MAT_GREY_OUTER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.STACKER_OUTER) 
  });
  const MAT_GREY_INNER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.STACKER_INNER) 
  });

  const MAT_BLUE_OUTER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.CURVED_PIECE) 
  });
  const MAT_BLUE_INNER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.CURVED_PIECE) 
  });

  const MAT_THIN_OUTER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.THIN_STACKER_OUTER) 
  });
  const MAT_THIN_INNER=new THREE.MeshLambertMaterial({ 
    color:getRGBColor(window.GameConfig.COLORS.THIN_STACKER_INNER) 
  });

  function buildPiece(kind) {
    ensureGeomCache();
    
    const lod=new THREE.LOD();
    
    if(kind==="curved_piece") {
      const curvedPieceRadius=CELL_R*window.GameConfig.BLUE_STACKER_RADIUS_RATIO;
      const shape=makeHexShape(curvedPieceRadius);
      const geom=new THREE.ExtrudeGeometry(shape, {depth:PLATE_H, bevelEnabled:false});
      const mat=new THREE.MeshPhongMaterial({ 
        color:getRGBColor(window.GameConfig.COLORS.CURVED_PIECE), 
        specular:getRGBColor(window.GameConfig.MATERIAL_PROPERTIES.PHONG_SPECULAR), 
        shininess:window.GameConfig.MATERIAL_PROPERTIES.PHONG_SHININESS 
      });
      const detailedMesh=new THREE.Mesh(geom, mat);
      detailedMesh.rotation.x=-Math.PI/2;
      detailedMesh.position.y=PLATE_H/2; // Center it vertically
      
      const detailedGroup=new THREE.Group();
      detailedGroup.add(detailedMesh);
      
      const simpleMat=new THREE.MeshLambertMaterial({color:getRGBColor(window.GameConfig.COLORS.CURVED_PIECE)});
      const simpleShape=makeHexShape(curvedPieceRadius);
      const simpleGeom=new THREE.ExtrudeGeometry(simpleShape, {depth:PLATE_H, bevelEnabled:false});
      const simpleMesh=new THREE.Mesh(simpleGeom, simpleMat);
      simpleMesh.rotation.x=-Math.PI/2;
      simpleMesh.position.y=PLATE_H/2;
      
      const simpleGroup=new THREE.Group();
      simpleGroup.add(simpleMesh);
      
      lod.addLevel(detailedGroup, LOD_NORMAL);  // Detailed model for close-up
      lod.addLevel(simpleGroup, LOD_SIMPLE);    // Simplified model when far away
      
      lod.userData.pieceType=kind;
      return lod;
    }

    if(kind==='thin_stacker') { // This is the thin stacker
      const outerGeom=cachedThinOuterGeom;
      const innerGeom=cachedThinInnerGeom;
      const outerMat=MAT_THIN_OUTER;
      const innerMat=MAT_THIN_INNER;
      
      const outer=new THREE.Mesh(outerGeom, outerMat);
      const inner=new THREE.Mesh(innerGeom, innerMat);
      outer.rotation.x=-Math.PI/2;
      inner.rotation.x=-Math.PI/2;

      const detailedGroup=new THREE.Group();
      const thinH=PLATE_H*window.GameConfig.THIN_STACKER_HEIGHT_RATIO;
      const thinInnerH=thinH*window.GameConfig.INNER_HEIGHT_RATIO;

      const heightOffset=(PLATE_H-thinH)/2;
      outer.position.y=(thinH/2)+heightOffset;
      inner.position.y=(thinH/2)+heightOffset;
      detailedGroup.add(outer);
      detailedGroup.add(inner);
      
      const simpleMat=new THREE.MeshLambertMaterial({color:getRGBColor(window.GameConfig.COLORS.THIN_STACKER_OUTER)});
      const simpleMesh=new THREE.Mesh(cachedSimplifiedThinGeom, simpleMat);
      simpleMesh.rotation.x=-Math.PI/2;
      simpleMesh.position.y=(thinH/2)+heightOffset;
      
      const simpleGroup=new THREE.Group();
      simpleGroup.add(simpleMesh);
      
      lod.addLevel(detailedGroup, LOD_NORMAL);  // Detailed model for close-up
      lod.addLevel(simpleGroup, LOD_SIMPLE);    // Simplified model when far away
      
      lod.userData.pieceType=kind;
      return lod;
    }

    const outerGeom=cachedOuterGeom;
    const innerGeom=cachedInnerGeom;
    const outerMat=MAT_GREY_OUTER;
    const innerMat=MAT_GREY_INNER;

    const outer=new THREE.Mesh(outerGeom, outerMat);
    const inner=new THREE.Mesh(innerGeom, innerMat);
    outer.rotation.x=-Math.PI/2;
    inner.rotation.x=-Math.PI/2;

    const detailedGroup=new THREE.Group();
    const outerH=PLATE_H;
    const innerH=outerH*0.8;

    outer.position.y=outerH/2;
    inner.position.y=outerH/2;
    detailedGroup.add(outer);
    detailedGroup.add(inner);
    
    const simpleMat=new THREE.MeshLambertMaterial({color:getRGBColor(window.GameConfig.COLORS.STACKER_OUTER)});
    const simpleMesh=new THREE.Mesh(cachedSimplifiedGeom, simpleMat);
    simpleMesh.rotation.x=-Math.PI/2;
    simpleMesh.position.y=outerH/2;
    
    const simpleGroup=new THREE.Group();
    simpleGroup.add(simpleMesh);
    
    // Add both levels to LOD
    lod.addLevel(detailedGroup, LOD_NORMAL);  // Detailed model for close-up
    lod.addLevel(simpleGroup, LOD_SIMPLE);    // Simplified model when far away
    
    lod.userData.pieceType=kind;
    return lod;
  }

  function makeHexHighlight(radius, thickness=0.04) {
    const shape=new THREE.Shape();
    for(let i=0; i<6; i++) {
      const a=(i/6)*Math.PI*2;
      const px=radius*Math.cos(a);
      const py=radius*Math.sin(a);
      if(i===0) shape.moveTo(px,py);
      else shape.lineTo(px,py);
    }
    shape.closePath();
    const geom=new THREE.ExtrudeGeometry(shape, {depth:thickness, bevelEnabled:false});
    const mat=new THREE.MeshBasicMaterial({
      color:getRGBColor(window.GameConfig.COLORS.HIGHLIGHT),
      transparent:true,
      opacity:window.GameConfig.HIGHLIGHT_OPACITY,
      depthWrite:false,
      polygonOffset:true,
      polygonOffsetFactor:window.GameConfig.MATERIAL_PROPERTIES.POLYGON_OFFSET_FACTOR,
      polygonOffsetUnits:window.GameConfig.MATERIAL_PROPERTIES.POLYGON_OFFSET_UNITS
    });
    const mesh=new THREE.Mesh(geom, mat);
    mesh.rotation.x=-Math.PI/2; // Lay flat on XZ plane
    return mesh;
  }

  const highlight=makeHexHighlight(CELL_R*0.92, 0.04);
  highlight.position.y=PLATE_H+0.001;
  scene.add(highlight);

  const pickExtent=Math.sqrt(3)*CELL_R*(2*RADIUS+3);
  const pickPlaneGeom=new THREE.PlaneGeometry(pickExtent, pickExtent);
  const pickPlaneMat=new THREE.MeshBasicMaterial({transparent:true, opacity:0.0, depthWrite:false});
  const pickPlane=new THREE.Mesh(pickPlaneGeom, pickPlaneMat);
  pickPlane.rotation.x=-Math.PI/2;
  pickPlane.position.y=PLATE_H+0.001;
  scene.add(pickPlane);

  const raycaster=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  const pickTargets=[pickPlane];

  const pieceTargets=[];

  function updateRayFromEvent(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    let cx, cy;
    if(event.touches && event.touches.length) {
      cx=event.touches[0].clientX; cy=event.touches[0].clientY;
    } else {
      cx=event.clientX; cy=event.clientY;
    }
    mouse.x=((cx-rect.left)/rect.width)*2-1;
    mouse.y=-((cy-rect.top)/rect.height)*2+1;
  }

  function computeHoverFromEvent(event) {
    updateRayFromEvent(event);
    raycaster.setFromCamera(mouse, camera);
    
    raycaster.far=window.GameConfig.RAYCAST_MAX_DISTANCE;

    const pieceHits=raycaster.intersectObjects(pieceTargets, true);
    if(pieceHits.length>0) {
      let top=pieceHits[0];
      for(const h of pieceHits) if(h.point.y>top.point.y) top=h;
      
      let piece=top.object;
      
      while(piece.parent && !placedPieces.has(piece) && !piece.isLOD) {
        piece=piece.parent;
      }
      
      if(placedPieces.has(piece)) {
        const pos=piece.position;
        const qr=worldToAxial(pos.x, pos.z, CELL_R);
        return {q:qr.q, r:qr.r};
      }
    }

    const hits=raycaster.intersectObjects(pickTargets, false);
    if(!hits.length) return null;
    const p=hits[0].point;
    const qr=worldToAxial(p.x, p.z, CELL_R);
    
    if(!axialInDisk(qr.q, qr.r, RADIUS)) return null;
    
    if(!isValidHexPosition(qr.q, qr.r)) return null;
    
    return {q:qr.q, r:qr.r};
  }

  let hoverQR=null;
  let lastMoveTime=0;
  const moveThrottle=16; // ~60 fps

  function handlePointerMove(event) {
    if(!isPlacementTool(selectedItem)) {
      highlight.visible=false;
      hoverQR=null;
      return;
    }
    const now=Date.now();
    if(now-lastMoveTime<moveThrottle) return;
    lastMoveTime=now;

    const qr=computeHoverFromEvent(event);
    hoverQR=qr;

    if(qr) {
      const pos=axialToWorld(qr.q, qr.r, CELL_R);
      highlight.position.set(pos.x, PLATE_H+0.001, pos.z);
      highlight.visible=true;
    } else {
      highlight.visible=false;
    }
  }

  renderer.domElement.addEventListener("mousemove", handlePointerMove, {passive:true});
  renderer.domElement.addEventListener("touchstart", handlePointerMove, {passive:true});
  renderer.domElement.addEventListener("touchmove", handlePointerMove, {passive:true});

  const placedPieces=new Set();

  function getPieceHeight(group) {
    if(!group || !group.userData) return PLATE_H;
    
    switch(group.userData.pieceType) {
      case 'thin_stacker':
        return PLATE_H*window.GameConfig.THIN_STACKER_HEIGHT_RATIO;
      case 'stacker':
      case 'curved_piece':
      default:
        return PLATE_H;
    }
  }

  function findStackHeight(x, z) {
    let maxTop=0;
    for(const piece of placedPieces) {
      const p=piece.position;
      const dist=Math.hypot(p.x-x, p.z-z);
      if(dist<CELL_R*window.GameConfig.STACK_DETECTION_RATIO) {
        const top=p.y+getPieceHeight(piece);
        if(top>maxTop) maxTop=top;
      }
    }
    const gap=PLATE_H*window.GameConfig.STACK_GAP_RATIO;
    if(maxTop>0) {
      return maxTop+gap;
    }
    return PLATE_H/2;
  }

  function placeAt(kind, q, r) {
    const pos=axialToWorld(q, r, CELL_R);
    const baseY=findStackHeight(pos.x, pos.z);
    const piece=buildPiece(kind);
    piece.position.set(pos.x, baseY, pos.z);
    piece.userData.pieceType=kind;
    scene.add(piece);
    placedPieces.add(piece);

    pieceTargets.push(piece);
    
    piece.traverse((child)=>{ 
      if(child.isMesh) {
        pieceTargets.push(child);
      }
    });
  }

  function tryPlaceAtEvent(event) {
    if(!isPlacementTool(selectedItem)) return;
    const qr=computeHoverFromEvent(event) || hoverQR;
    if(!qr) return;
    placeAt(selectedItem, qr.q, qr.r);
  }

  renderer.domElement.addEventListener("click", tryPlaceAtEvent);
  renderer.domElement.addEventListener("touchend", function(e) {
    e.preventDefault();
    tryPlaceAtEvent(e);
  }, {passive:false});

  })();
});
