/* Original, procedural miniature architecture. All meshes and textures are made
   locally; there are no borrowed game assets. Three.js r160 is vendored separately. */
(() => {
  const T = window.THREE;
  if (!T) return;

  // Building materials stay consistent across seasons.
  const BASE_PALETTE = {
    grass: '#9aa96b', grassBlade: '#708647', soil: '#d8bf8e', stone: '#c3b89c',
    wood: '#b18b60', woodLight: '#d6b88d', woodDark: '#735642', plaster: '#f0e9db',
    coral: '#bb6548', coralLight: '#d1835a', moss: '#63774a', roofHoney: '#b79b57',
    leaf: '#607f43', leafLight: '#8ca35b', leafDark: '#45653c', pine: '#416749', pineLight: '#668052',
    cream: '#fff4de', window: '#bdcdc4', iron: '#59604a', flower: '#d47e58',
    flowerYellow: '#e7bb5b', sky: '#d4dfbb', water: '#87b6aa', ink: '#4c4933',
    berry: '#985669', blush: '#e5b09a', teal: '#527b70', tea: '#d9b985',
  };
  // SEASONS — choose a preset here and reload. Fall is the finished art direction;
  // the other palettes are starting points for future seasonal scenery/assets.
  const ACTIVE_SEASON = 'fall';
  const SEASONS = {
    spring: {
      palette: {grass:'#a8b780', leaf:'#71985b', leafLight:'#acc586', flower:'#d49a9b', sky:'#e1e7cf'},
      foliage: ['leaf','leafLight','leaf'], scarf:'#8a7090', fallenLeaves:0,
    },
    summer: {
      palette: {}, foliage:['leaf','leafLight','leaf'], scarf:'#69875a', fallenLeaves:0,
    },
    fall: {
      // Autumn belongs to individual crowns and fallen leaves, not a global tint.
      palette: {grass:'#a1ad86', grassBlade:'#7f8e62', soil:'#dcc9ab', leaf:'#788e5d',
        leafLight:'#9ead79', leafDark:'#526e51', leafOlive:'#8d9b69', leafGold:'#d0a44e',
        leafAmber:'#c38b4c', leafCopper:'#b47853', leafRusset:'#a26049', pine:'#56735b', pineLight:'#7b916a',
        flower:'#bc8769', flowerYellow:'#d8b877', sky:'#e3e8dc'},
      foliage:['leafGold','leafAmber','leaf','leafCopper','leafOlive','leafRusset','leafGold','leaf'],
      fallenColours:['leafGold','leafAmber','leafCopper','leafRusset'], scarf:'#d4a34e', fallenLeaves:24,
      pathLeaves:70, pumpkins:true, accentTrees:true,
    },
    winter: {
      palette: {grass:'#dedfd6', grassBlade:'#abb7a0', soil:'#d4c8b5', leaf:'#8eaa95',
        leafLight:'#d9e1d8', leafDark:'#607b6a', pine:'#516b60', pineLight:'#9cafa3', sky:'#e4e6df'},
      foliage:['leaf','leafLight'], scarf:'#985669', fallenLeaves:0,
    },
  };
  const SEASON = SEASONS[ACTIVE_SEASON];
  const PALETTE = {...BASE_PALETTE, ...SEASON.palette};
  const WORLD_STYLE = {
    light: {sun:'#fff1d8', intensity:2.25, sky:'#edf3fa', bounce:'#c7baa0', ambient:1.8, exposure:1.02},
    trees: {canopySegments:24, canopyRings:16, edgeLeaves:14},
  };
  // Project architecture only: these colours never tint the grass or foliage.
  // Roofs lead; quieter painted trim, joinery and fabric support each identity.
  // The mini map reads this same palette.
  const BUILDING_PALETTE = {
    photo:     {roof:'#526d8a', wall:'#e9e9e1', trim:'#dce0db', joinery:'#647b92', fabric:'#526d8a'},
    theatre:   {roof:'#353840', wall:'#eeebe4', trim:'#d7d5cd', joinery:'#41434a', fabric:'#41434a'},
    bookstore: {roof:'#383354', wall:'#ece6db', trim:'#d6c3a4', joinery:'#514862', fabric:'#5b526e'},
    church:    {roof:'#337bb4', wall:'#eeebe4', trim:'#dce0db', joinery:'#637a87', fabric:'#637a87'},
    tea:       {roof:'#b24b32', wall:'#ece6db', trim:'#d6c3a4', joinery:'#7d8978', fabric:'#b24b32'},
  };
  // Architectural proportions are in world units; footprints/placement stay in
  // PLACES. Keep roofs, signs and trim relative to the eave, not a stretched model.
  const BUILDING_STYLE = {
    photo: {wallHeight:4.2, roofRise:.7, cameraScale:.62},
    theatre: {wallHeight:4.05, roofRise:1.8, facadeHeight:6.55},
    bookstore: {wallHeight:4.15, roofRise:1.55},
    church: {wallHeight:3.7, roofRise:1.95, towerHeight:5.9},
    tea: {wallHeight:3.8, roofRise:1.55, cupScale:.43},
    details: {roofCourses:6, trimWidth:.14, signHeight:.72,
      glass:'#667f78', glassLight:'#a8bdb3', metalRoughness:.78, slateRoughness:.94,
      roofGrain:.012, signInk:'#44434a'},
  };
  // CAMERA — fixed isometric angle/zoom, with an eased pan following the duck.
  // Offset is in screen coordinates (-1…1); negative Y leaves more space ahead.
  const CAMERA = {
    desktop: { azimuth:24, elevation:34, scale:1.48, padding:1.16, maxSpan:72 },
    mobile: { azimuth:12, elevation:38, scale:1.44, padding:1.16, maxSpan:70 },
    follow: {strength:4.5, offset:{x:0,y:-.10}, lookAhead:1.3, settleDistance:.005},
    pixelRatio:1.5, shadows:2048,
  };
  // CHARACTER — rounded duckling with a honey scarf and a little acorn beret.
  // All accessories are original geometry and are batched with the body.
  const CHARACTER = {
    scale:1.5, footprintRadius:.62,
    feathers:'#fff6dd', wing:'#e9ddbb', bill:'#de8c36', feet:'#b97539',
    eyes:'#352d25', cheek:'#e9b39c', scarf:SEASON.scarf,
    accessory:ACTIVE_SEASON==='fall'?'acorn-beret':null, cap:'#a9633e', capBand:'#8b5036', leafPin:'#edbd5d',
    stepLength:.06, stepLift:.024, cadence:.014, waddle:.042, turnResponse:16,
  };
  // Project ground positions are [x, z]. Rotation is in radians around the Y axis.
  // A location's door and collision boundary move with the building.
  const PLACES = [
    { id: 'photocrumb', model: 'photo', desktop: [-17, -7], mobile: [-6, -24], rotation: .08, width: 8, depth: 6, sign: 'Photocrumb' },
    { id: 'labatie', model: 'theatre', desktop: [0, -19], mobile: [7, -10], rotation: -.08, width: 8, depth: 6.5, sign: 'La Bâtie' },
    { id: 'kosta', model: 'church', desktop: [18, -7], mobile: [-7, 5], rotation: -.12, width: 8, depth: 7, sign: 'Youth KOSTA' },
    { id: 'alice', model: 'bookstore', desktop: [-14, 15], mobile: [7, 20], rotation: .12, width: 7, depth: 6, sign: 'Wonderland Books' },
    { id: 'fever', model: 'tea', desktop: [13, 16], mobile: [-6, 34], rotation: -.08, width: 7, depth: 5, sign: 'Pearl Fever' },
  ];
  // ENVIRONMENT — remove entries to simplify, or add trees, benches, lamps, fences.
  const DETAILS = {
    desktop: {
      path: [[-100, 12], [-27, 9], [-14, 4], [0, 2], [13, 6], [30, 2], [100, -12]],
      fork: [[0, 2], [-1, 13], [3, 26], [45, 100]],
      trees: [[-28,-15,1.15],[-22,-22,1],[-12,-25,.95],[10,-26,1.2],[23,-20,1.05],[30,-12,1.1],[-32,0,1.15],[33,8,1.2],[-28,21,1.1],[-23,29,1.2],[29,29,1.2],[32,20,.9],[-5,31,1.15],[-37,21,1.2],[37,-24,1.3],[-5,-33,1.2],[16,-33,1.3],[-39,-15,1.25],[40,31,1.3],[10,38,1]],
      pines: [[-30,-24,1.3],[20,-28,1.25],[31,-21,1.4],[-36,5,1.15],[31,32,1.4],[-20,35,1.4]],
      autumnTrees: [[9,-3,.82,'leafGold'],[-7,9,.82,'leafCopper']],
      benches: [[-5,-5,.3],[6,14,-.4]], lamps: [[-23,3],[7,-7],[24,9],[-6,22]],
      fences: [[-28,-18,-21,-18],[-11,-25,-4,-25],[22,-15,29,-15],[-25,23,-19,23],[18,27,25,27]],
      flowers: [[-22,-1],[-12,-10],[-5,-14],[6,-16],[14,-2],[23,-4],[-19,21],[-9,21],[10,24],[20,19],[-7,6],[8,5]],
      start: [0, 8], bounds: [-34,34,-28,35],
    },
    mobile: {
      path: [[0,-110],[1,-24],[-1,-10],[1,4],[0,20],[1,34],[0,110]], fork: [],
      trees: [[-14,-30,1.1],[12,-28,1.15],[-15,-12,.9],[15,-5,1.05],[-14,10,1.1],[15,17,1.1],[-15,29,1],[13,37,1.1],[-10,46,1.1],[13,47,1]],
      pines: [[-12,-39,1.2],[14,-18,1.25],[-15,20,1.3],[15,29,1.1]],
      autumnTrees: [[8,7,.68,'leafGold'],[-7,28,.65,'leafCopper']],
      benches: [[7,1,0],[-7,23,.15]], lamps: [[1,-19],[-1,15],[1,42]],
      fences: [[-13,-29,-8,-29],[9,-15,15,-15],[-14,0,-9,0],[9,16,14,16],[-13,40,-8,40]],
      flowers: [[-10,-18],[9,-5],[-10,10],[9,26],[-10,39],[3,3],[-3,30]],
      start: [0,-2], bounds: [-16,16,-36,45],
    },
  };

  function create(canvas, entries, mode) {
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, CAMERA.pixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = WORLD_STYLE.light.exposure;
    const scene = new T.Scene();
    scene.background = new T.Color(PALETTE.sky);
    const camera = new T.OrthographicCamera(-50,50,35,-35,.1,400);
    const sun = new T.DirectionalLight(WORLD_STYLE.light.sun, WORLD_STYLE.light.intensity);
    sun.position.set(-35,60,30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CAMERA.shadows,CAMERA.shadows);
    Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:160});
    sun.shadow.normalBias = .035;
    sun.shadow.radius = 4;
    sun.shadow.bias = -.00008;
    scene.add(sun,new T.HemisphereLight(WORLD_STYLE.light.sky,WORLD_STYLE.light.bounce,WORLD_STYLE.light.ambient));
    const content = new T.Group(); scene.add(content);
    const geometries = new Map(), materials = new Map(), textures = new Map();
    // Ground obstacles are registered with the props that create them, before batching.
    let colliders = [];
    const picking = new T.Group();
    function collider(parent, kind, x, z, a, b=0, rotation=0) {
      parent.updateWorldMatrix(true,false);
      const point=new T.Vector3(x,0,z).applyMatrix4(parent.matrixWorld);
      const scale=new T.Vector3();parent.getWorldScale(scale);
      const angle=Math.atan2(parent.matrixWorld.elements[8],parent.matrixWorld.elements[10])+rotation;
      const obstacle={kind,x:point.x,z:point.z,angle,cos:Math.cos(angle),sin:Math.sin(angle)};
      if(kind==='circle')obstacle.radius=a*Math.max(scale.x,scale.z);
      else {obstacle.halfX=a*scale.x/2;obstacle.halfZ=b*scale.z/2;}
      obstacle.reach=kind==='circle'?obstacle.radius:Math.hypot(obstacle.halfX,obstacle.halfZ);
      colliders.push(obstacle);return obstacle;
    }
    function hitBox(parent,w,h,d,x,y,z,rotation=0) {
      const m=new T.Mesh(geometry(`pick:${w}:${h}:${d}`,()=>new T.BoxGeometry(w,h,d)));
      m.position.set(x,y,z);m.rotation.z=rotation;parent.add(m);
    }
    let randomState = 48;
    const random = () => ((randomState = (1664525 * randomState + 1013904223) >>> 0) / 4294967296);
    const color = (key) => PALETTE[key] || key;
    const geometry = (key, build) => { if (!geometries.has(key)) geometries.set(key,build()); return geometries.get(key); };

    function texture(kind) {
      if (textures.has(kind)) return textures.get(kind);
      const c=document.createElement('canvas'); c.width=c.height=256;
      // Neutral grain preserves each material's palette instead of tinting it beige.
      const ctx=c.getContext('2d'); ctx.fillStyle='#ffffff';ctx.fillRect(0,0,256,256);
      for(let i=0;i<10000;i++) {
        const shade=140+Math.floor(random()*90);
        ctx.fillStyle=`rgba(${shade},${shade},${shade},${kind==='wood' ? .15 : .18})`;
        const x=random()*256,y=random()*256;
        ctx.fillRect(x,y,kind==='wood' ? random()*2+.2 : 1,kind==='wood' ? random()*34+6 : 1);
      }
      if(kind==='foliage'){
        // Soft, overlapping leaf marks give the continuous crowns a leafy surface.
        for(let i=0;i<480;i++){
          const x=random()*256,y=random()*256,angle=random()*Math.PI;
          ctx.save();ctx.translate(x,y);ctx.rotate(angle);
          ctx.fillStyle=`rgba(79,91,73,${.035+random()*.08})`;
          ctx.beginPath();ctx.ellipse(0,0,3+random()*3,6+random()*5,0,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
      }
      const result=new T.CanvasTexture(c);result.colorSpace=T.SRGBColorSpace;
      result.wrapS=result.wrapT=T.RepeatWrapping;
      textures.set(kind,result);return result;
    }
    function material(key, grain='', extra={}) {
      const id=key+grain+JSON.stringify(extra);
      if (!materials.has(id)) materials.set(id,new T.MeshStandardMaterial({color:color(key),roughness:1,metalness:0,map:grain ? texture(grain) : null,...extra}));
      return materials.get(id);
    }
    function mesh(parent,geo,mat,x=0,y=0,z=0) {
      const object=new T.Mesh(geo,typeof mat==='string' ? material(mat) : mat);
      object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
    }
    function box(parent,w,h,d,x,y,z,mat='wood',radius=.06) {
      // Bevels catch light on timber and masonry instead of sharp UI-like edges.
      const key=`box:${w}:${h}:${d}:${radius}`;
      const g=geometry(key,()=>{
        if(radius<=.025)return new T.BoxGeometry(w,h,d);
        const r=Math.min(radius,w/5,h/5,d/5), shape=new T.Shape();
        shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
        shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);
        shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
        const geo=new T.ExtrudeGeometry(shape,{depth:Math.max(.01,d-r*2),bevelEnabled:true,bevelThickness:r,bevelSize:r/2,bevelSegments:1,steps:1,curveSegments:3});
        geo.translate(0,0,-d/2+r);return geo;
      });
      return mesh(parent,g,mat,x,y,z);
    }
    const sphereGeo=geometry('sphere',()=>new T.SphereGeometry(1,16,10));
    const smallSphereGeo=geometry('smallSphere',()=>new T.SphereGeometry(1,8,5));
    function ball(parent,x,y,z,sx,sy,sz,mat) {const m=mesh(parent,Math.max(sx,sy,sz)>1?sphereGeo:smallSphereGeo,mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
    function cylinder(parent,rt,rb,h,x,y,z,mat='wood',sides=10) {
      return mesh(parent,geometry(`cyl:${rt}:${rb}:${h}:${sides}`,()=>new T.CylinderGeometry(rt,rb,h,sides)),mat,x,y,z);
    }
    function group(parent,x=0,y=0,z=0,rotation=0) {const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);return g;}
    function finishes(parent) {
      // Nested windows, signs and roof groups inherit their building's finishes.
      for(let node=parent;node;node=node.parent)if(node.userData.finishes)return node.userData.finishes;
      return {wall:'plaster',trim:'woodLight',joinery:'woodDark',fabric:'moss'};
    }
    function beam(parent,a,b,width,mat='wood') {
      const from=new T.Vector3(...a),to=new T.Vector3(...b),mid=from.clone().add(to).multiplyScalar(.5);
      // Tiny twigs/rails need only six faces; bevels are reserved for larger timber.
      const m=box(parent,width,from.distanceTo(to),width,mid.x,mid.y,mid.z,mat,width>.18?.04:0);
      m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return m;
    }
    function arch(parent,x,y,z,w,h,mat) {
      const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h-w/2);shape.absarc(0,h-w/2,w/2,0,Math.PI,false);shape.lineTo(-w/2,0);
      return mesh(parent,geometry(`arch:${w}:${h}`,()=>new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelThickness:.04,bevelSize:.03,bevelSegments:1,curveSegments:12})),mat,x,y,z);
    }
    function doorway(parent,x,z,paint='moss') {
      const trim=finishes(parent).trim;
      arch(parent,x,.4,z,2.02,3.26,'woodDark');
      arch(parent,x,.48,z+.08,1.83,3.12,material(trim,'wood'));
      arch(parent,x,.5,z+.25,1.51,2.88,material(paint,'wood'));
      box(parent,1.09,1.17,.075,x,2.42,z+.45,'woodDark',.02);
      box(parent,.88,.96,.06,x,2.42,z+.5,material(BUILDING_STYLE.details.glass,'',{roughness:.38}),.02);
      box(parent,1,.07,.1,x,2.42,z+.56,'cream',.02);box(parent,.07,1.09,.1,x,2.42,z+.56,'cream',.02);
      box(parent,1.13,.69,.065,x,1.16,z+.46,trim,.025);
      box(parent,.98,.55,.07,x,1.16,z+.5,paint,.025);
      box(parent,.1,.23,.035,x+.52,1.74,z+.48,'roofHoney',.02);
      ball(parent,x+.52,1.74,z+.54,.055,.055,.055,'woodDark');
      box(parent,2.25,.16,.68,x,.36,z+.38,'stone',.025);
    }
    function windowFrame(parent,x,y,z,w=2,h=2,shutters=false) {
      const trim=finishes(parent).trim;
      box(parent,w+.34,h+.34,.14,x,y,z,'woodDark',.025);
      box(parent,w+.2,h+.2,.17,x,y,z+.08,material(trim,'wood'),.025);
      box(parent,w,h,.07,x,y,z+.2,material(BUILDING_STYLE.details.glass,'',{roughness:.38}),.015);
      // Opaque glazing with a quiet upper reflection: no costly glass sorting.
      box(parent,w-.06,h*.22,.025,x,y+h*.35,z+.245,BUILDING_STYLE.details.glassLight,0);
      box(parent,w,.075,.12,x,y,z+.29,'cream',.02);box(parent,.075,h,.12,x,y,z+.29,'cream',.02);
      box(parent,w+.45,.14,.43,x,y-h/2-.17,z+.12,material(trim,'wood'),.025);
      if(shutters) for(const side of [-1,1]) {
        box(parent,.55,h+.25,.14,x+side*(w/2+.47),y,z,'moss');
        for(let k=0;k<5;k++)box(parent,.52,.06,.08,x+side*(w/2+.47),y-h/2+.25+k*h/5,z+.12,'leafDark',0);
      }
    }
    function sign(parent,title,x,y,z,w=4,h=BUILDING_STYLE.details.signHeight,paint=finishes(parent).wall) {
      const trim=finishes(parent).trim;
      const cacheKey=`sign:${title}:${w}:${h}:${paint}:${trim}`;
      if(!materials.has(cacheKey)) {
        // Match the physical sign's aspect ratio: lettering keeps its natural shape.
        const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const ctx=c.getContext('2d');
        ctx.fillStyle=color(paint);ctx.fillRect(0,0,c.width,c.height);
        ctx.strokeStyle=color(trim);ctx.lineWidth=1.5;ctx.strokeRect(8,8,c.width-16,c.height-16);
        ctx.fillStyle=BUILDING_STYLE.details.signInk;ctx.textAlign='center';ctx.textBaseline='middle';
        let size=c.height*.76;ctx.font=`500 ${size}px Georgia, serif`;
        size*=Math.min(1,(c.width-54)/ctx.measureText(title).width);ctx.font=`500 ${size}px Georgia, serif`;
        ctx.fillText(title,c.width/2,c.height*.53);
        const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace; textures.set(cacheKey,tex);
        materials.set(cacheKey,new T.MeshStandardMaterial({map:tex,roughness:.86}));
      }
      box(parent,w+.16,h+.16,.15,x,y,z,material('woodDark','wood'),.025);
      box(parent,w+.07,h+.07,.06,x,y,z+.105,trim,.02);
      mesh(parent,geometry(`signPlane:${w}:${h}`,()=>new T.PlaneGeometry(w,h)),materials.get(cacheKey),x,y,z+.142);
    }
    function deck(parent,w,d,z) {
      box(parent,w,.3,d,0,.15,z,material('woodDark','wood'));
      const count=Math.ceil(w/.65);
      for(let i=0;i<count;i++)box(parent,w/count-.035,.12,d-.08,-w/2+(i+.5)*w/count,.34,z,material(i%3?'woodLight':'wood','wood'),.015);
      // Front nosing and recessed joins make this read as a built timber porch.
      box(parent,w+.06,.17,.16,0,.28,z+d/2-.035,material('wood','wood'),.02);
      for(let i=0;i<count;i++)for(const edge of [-1,1]){
        const nail=cylinder(parent,.018,.018,.012,-w/2+(i+.5)*w/count,.407,z+edge*(d/2-.2),'woodDark',6);nail.castShadow=false;
      }
    }
    function flowerPot(parent,x,z,size=.5) {
      collider(parent,'circle',x,z,size*.82).label='planter';
      cylinder(parent,size*.8,size*.56,size*.8,x,size*.4,z,'coral',10);
      ball(parent,x,size*1.05,z,size*.7,size*.5,size*.65,'leaf');
      for(let k=0;k<4;k++)ball(parent,x+(random()-.5)*size,size*1.3+random()*.3,z+(random()-.5)*size,.11,.11,.1,k%2?'cream':'flowerYellow');
    }
    function poster(parent,x,y,z,variant=0) {
      const key='poster:'+variant;
      if(!materials.has(key)) {
        const c=document.createElement('canvas');c.width=192;c.height=256;const ctx=c.getContext('2d');
        ctx.fillStyle=['#dca15e','#627947','#b55d43'][variant%3];ctx.fillRect(0,0,192,256);
        ctx.fillStyle='#f7e9c9';ctx.beginPath();ctx.arc(96,98,60,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=['#8d502f','#d2b467','#b2bf7b'][variant%3];ctx.fillRect(65,55,40,160);
        ctx.fillStyle='#f7e9c9';for(let i=0;i<3;i++)ctx.fillRect(28,219+i*9,130-i*30,3);
        const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.set(key,tex);materials.set(key,new T.MeshStandardMaterial({map:tex,roughness:1}));
      }
      box(parent,1.6,2.12,.15,x,y,z,'woodDark');mesh(parent,geometry('posterplane',()=>new T.PlaneGeometry(1.4,1.9)),materials.get(key),x,y,z+.085);
    }
    function shell(parent,p,h) {
      const paint=finishes(parent);
      box(parent,p.width+.2,.4,p.depth+.2,0,.2,0,'stone');
      box(parent,p.width,h,p.depth,0,.4+h/2,0,material(paint.wall,'plaster'),.025);
      for(const x of [-p.width/2+.03,p.width/2-.03])for(const z of [-p.depth/2+.03,p.depth/2-.03])box(parent,.16,h,.16,x,.4+h/2,z,material(paint.trim,'wood'),.02);
      box(parent,p.width+.12,.15,p.depth+.12,0,.67,0,material(paint.trim,'wood'),.025);
      box(parent,p.width+.22,.17,p.depth+.22,0,h+.32,0,material(paint.trim,'wood'),.025);
    }
    // Small original printed details. Textures are local canvases, including file://.
    function illustration(parent,kind,x,y,z,w,h) {
      const key='illustration:'+kind;
      if(!materials.has(key)) {
        const c=document.createElement('canvas');c.width=256;c.height=384;
        const ctx=c.getContext('2d');ctx.fillStyle=PALETTE.cream;ctx.fillRect(0,0,256,384);
        if(kind==='photos') {
          for(let i=0;i<3;i++) {
            const y=17+i*116;ctx.fillStyle=[PALETTE.blush,PALETTE.tea,'#a8b99a'][i];ctx.fillRect(20,y,216,102);
            ctx.fillStyle=PALETTE.woodDark;ctx.beginPath();ctx.arc(128,y+38,24,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=PALETTE.coral;ctx.beginPath();ctx.ellipse(128,y+96,50,35,0,Math.PI,0);ctx.fill();
          }
        } else if(kind==='festival') {
          ctx.fillStyle=BUILDING_PALETTE.theatre.roof;ctx.fillRect(0,0,256,384);
          ctx.strokeStyle=BUILDING_PALETTE.theatre.trim;ctx.lineWidth=2;
          ctx.strokeRect(14,14,228,356);ctx.beginPath();ctx.arc(128,164,99,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=BUILDING_PALETTE.theatre.wall;ctx.font='bold 200px Georgia';ctx.textAlign='center';ctx.fillText('B',128,235);
          ctx.font='22px sans-serif';ctx.fillText('LA BÂTIE',128,316);ctx.font='12px sans-serif';ctx.fillText('ART · MUSIQUE · RENCONTRES',128,344);
        } else if(kind==='card') {
          ctx.fillStyle=PALETTE.coral;ctx.font='64px Georgia';ctx.fillText('A',20,68);
          ctx.font='160px Georgia';ctx.textAlign='center';ctx.fillText('♥',128,254);
        } else if(kind==='clock') {
          ctx.fillStyle=PALETTE.woodDark;ctx.beginPath();ctx.arc(128,190,108,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=PALETTE.cream;ctx.beginPath();ctx.arc(128,190,97,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle=PALETTE.woodDark;ctx.lineWidth=5;
          for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(128+Math.sin(a)*83,190-Math.cos(a)*83);ctx.lineTo(128+Math.sin(a)*92,190-Math.cos(a)*92);ctx.stroke();}
          ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(128,126);ctx.lineTo(128,190);ctx.lineTo(177,215);ctx.stroke();
        } else {
          ctx.fillStyle=PALETTE.moss;ctx.fillRect(0,0,256,384);ctx.fillStyle=PALETTE.cream;ctx.textAlign='center';
          ctx.font='28px Georgia';ctx.fillText('a little tea?',128,66);
          for(let i=0;i<3;i++){ctx.fillStyle=[PALETTE.tea,PALETTE.blush,PALETTE.leafLight][i];ctx.fillRect(38,106+i*78,43,53);ctx.fillStyle=PALETTE.cream;ctx.fillRect(98,120+i*78,113,5);ctx.fillRect(98,138+i*78,70,3);}
        }
        const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.set(key,tex);
        materials.set(key,new T.MeshBasicMaterial({map:tex,toneMapped:false}));
      }
      box(parent,w+.16,h+.16,.12,x,y,z,finishes(parent).trim,.025);
      mesh(parent,geometry(`art:${w}:${h}`,()=>new T.PlaneGeometry(w,h)),materials.get(key),x,y,z+.085);
    }
    function mushroom(parent,x,z,size=1) {
      collider(parent,'circle',x,z,.43*size);
      cylinder(parent,.15*size,.24*size,.9*size,x,.45*size,z,'cream',7);
      const cap=ball(parent,x,.94*size,z,.66*size,.3*size,.62*size,'coral');
      for(let i=0;i<5;i++){const a=i*2.4;ball(parent,x+Math.cos(a)*.38*size,1.14*size,z+Math.sin(a)*.32*size,.1*size,.035*size,.09*size,'cream');}
    }
    // Architectural details stay small: roof seams, timber joinery and recessed
    // glazing give the shops material depth without adding free-standing clutter.
    function roofMaterial(tint,lighten=0,slate=false) {
      const shade=new T.Color(color(tint)).lerp(new T.Color(lighten<0?'#161b24':'#f5ead8'),Math.abs(lighten));
      const mat=material('#'+shade.getHexString(),'plaster',{roughness:slate?BUILDING_STYLE.details.slateRoughness:BUILDING_STYLE.details.metalRoughness});
      // Reuse the tiny grain texture for a restrained surface relief. No new
      // images, random scenery changes or per-frame material work are needed.
      mat.bumpMap=mat.map;mat.bumpScale=BUILDING_STYLE.details.roofGrain;
      return mat;
    }
    function barrelRoof(parent,key,w,d,y,rise,tint) {
      const shape=new T.Shape();shape.moveTo(-w/2,y);shape.bezierCurveTo(-w/2,y+rise,w/2,y+rise,w/2,y);shape.closePath();
      // Cream gable ends beneath a thin standing-seam roof, rather than a solid loaf.
      mesh(parent,geometry(`${key}:${w}:${d}:${y}:${rise}`,()=>new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:20})),material(finishes(parent).wall,'plaster'),0,0,-d/2);
      const curve=new T.CubicBezierCurve3(new T.Vector3(-w/2,y+.06,0),new T.Vector3(-w/2,y+rise+.06,0),new T.Vector3(w/2,y+rise+.06,0),new T.Vector3(w/2,y+.06,0));
      const points=curve.getPoints(28),count=7;
      for(let i=0;i<count;i++){
        const za=-d/2+i*d/count,zb=-d/2+(i+1)*d/count,verts=[],normals=[],uvs=[];
        for(let j=0;j<points.length-1;j++){
          const a=points[j],b=points[j+1];verts.push(a.x,a.y,za,a.x,a.y,zb,b.x,b.y,za,b.x,b.y,za,a.x,a.y,zb,b.x,b.y,zb);
          // Analytic normals keep the curved metal smooth between segments.
          const ta=curve.getTangent(j/28),tb=curve.getTangent((j+1)/28);
          const na=[-ta.y,ta.x,0],nb=[-tb.y,tb.x,0];normals.push(...na,...na,...nb,...nb,...na,...nb);
          const u=j/28,v=(j+1)/28;uvs.push(u,0,u,1,v,0,v,0,u,1,v,1);
        }
        const geo=geometry(`${key}:skin:${i}:${y}:${rise}`,()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));return g;});
        mesh(parent,geo,roofMaterial(tint,i%2?.008:0));
        const seam=curve.clone();seam.v0.z=seam.v1.z=seam.v2.z=seam.v3.z=za;
        mesh(parent,geometry(`${key}:seam:${i}:${y}:${rise}`,()=>new T.TubeGeometry(seam,28,.025,5,false)),roofMaterial(tint,.025));
      }
      for(const z of [-d/2-.03,d/2+.03]){
        const trim=curve.clone();trim.v0.z=trim.v1.z=trim.v2.z=trim.v3.z=z;
        mesh(parent,geometry(`${key}:edge:${z}:${y}:${rise}`,()=>new T.TubeGeometry(trim,28,.065,6,false)),finishes(parent).trim);
      }
    }
    function windowBox(parent,x,y,z,w=2) {
      box(parent,w,.34,.52,x,y,z,material('wood','wood'));
      box(parent,w+.1,.07,.6,x,y+.17,z,'woodLight');
      for(let i=0;i<5;i++){
        const xx=x-w*.42+i*w*.21;
        ball(parent,xx,y+.33,z,.22,.22,.22,i%2?'leaf':'leafLight');
        if(i%2===0)ball(parent,xx+.07,y+.48,z+.04,.09,.06,.09,'cream');
      }
    }
    function finishBuilding(parent,p) {
      // Fine masonry courses and corner trim unify the village foundations.
      const front=p.depth/2+.13;
      for(let i=0;i<Math.floor(p.width/.8);i++)box(parent,.025,.24,.025,-p.width/2+.35+i*.8,.23,front,'woodLight',0);
      if(p.model==='bookstore'||p.model==='church'||p.model==='tea'){
        const x=p.width/2-.2;
        cylinder(parent,.055,.055,3.25,x,2.12,-p.depth/2-.12,'iron',8);
        box(parent,.25,.13,.27,x,.62,-p.depth/2-.12,'stone');
      }
    }
    // Roof and canopy geometry is shared and included in the static material batches.
    function gableRoof(parent,hit,w,d,y,rise,tint,shingles=false) {
      const paint=finishes(parent);
      const shape=new T.Shape();shape.moveTo(-w/2,y);shape.lineTo(0,y+rise);shape.lineTo(w/2,y);shape.closePath();
      mesh(parent,geometry(`gable:${w}:${d}:${y}:${rise}`,()=>new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false})),material(paint.wall,'plaster'),0,0,-d/2);
      const half=w/2+.35,angle=Math.atan2(rise,half),span=Math.hypot(half,rise);
      for(const side of [-1,1]){
        const slope=group(parent,side*half/2,y+rise/2+.08,0);slope.rotation.z=-side*angle;
        box(slope,span,.12,d+.7,0,0,0,roofMaterial(tint,0,shingles),.02);
        hitBox(hit,span,.2,d+.7,side*half/2,y+rise/2+.08,0,-side*angle);
        if(shingles){
          const rows=BUILDING_STYLE.details.roofCourses,depth=d+.7,tile=.74;
          for(let row=0;row<rows;row++)for(let col=-1;col<Math.ceil(depth/tile);col++){
            const a=Math.max(-depth/2,-depth/2+(col+(row%2)*.5)*tile),b=Math.min(depth/2,-depth/2+(col+1+(row%2)*.5)*tile);
            if(b-a<.03)continue;
            box(slope,span/rows+.018,.045,b-a-.016,-span/2+(row+.5)*span/rows,.08,(a+b)/2,roofMaterial(tint,((row+col+3)%3)*.008,true),.008);
          }
        }else{
          for(let k=0;k<=8;k++)box(slope,span,.045,.03,0,.08,-d/2+k*d/8,roofMaterial(tint,.025),.008);
        }
        for(const z of [-d/2-.38,d/2+.38])beam(parent,[0,y+rise+.1,z],[side*half,y+.02,z],BUILDING_STYLE.details.trimWidth,paint.trim);
        box(parent,.16,.2,d+.75,side*half,y-.03,0,paint.trim,.025);
        // Two small eave brackets each side make the roof feel supported.
        for(const z of [-d/2+.22,d/2-.22])beam(parent,[side*(half-.4),y-.34,z],[side*(half-.05),y-.13,z],.09,paint.trim);
      }
      const ridge=cylinder(parent,.1,.1,d+.8,0,y+rise+.16,0,roofMaterial(tint,.025,shingles),12);ridge.rotation.x=Math.PI/2;
    }
    function hipRoof(parent,w,d,y,rise,tint) {
      const top=w*.22;
      const faces=[[[ -w/2,y,d/2],[w/2,y,d/2],[top,y+rise,0],[-top,y+rise,0]],
        [[w/2,y,-d/2],[-w/2,y,-d/2],[-top,y+rise,0],[top,y+rise,0]],
        [[w/2,y,d/2],[w/2,y,-d/2],[top,y+rise,0],[top,y+rise,0]],
        [[-w/2,y,-d/2],[-w/2,y,d/2],[-top,y+rise,0],[-top,y+rise,0]]];
      faces.forEach((face,i)=>{
        const points=face.map(p=>new T.Vector3(...p));
        for(let row=0;row<BUILDING_STYLE.details.roofCourses;row++){
          const a=row/BUILDING_STYLE.details.roofCourses,b=(row+1)/BUILDING_STYLE.details.roofCourses;
          const q=[points[0].clone().lerp(points[3],a),points[1].clone().lerp(points[2],a),points[1].clone().lerp(points[2],b),points[0].clone().lerp(points[3],b)];
          q.forEach(p=>p.y+=.055);
          const geo=geometry(`hip:${w}:${d}:${y}:${rise}:${i}:${row}`,()=>{
            const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([q[0],q[1],q[3],q[1],q[2],q[3]].flatMap(p=>p.toArray()),3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,1,0,1,1,0,1],2));g.computeVertexNormals();return g;
          });
          mesh(parent,geo,roofMaterial(tint,row%2?.008:0,true));
          const course=q.slice(0,2).map(p=>p.clone().add(new T.Vector3(0,.022,0)));
          beam(parent,course[0].toArray(),course[1].toArray(),.028,roofMaterial(tint,.025,true));
          // Staggered tile joints break up broad clay-like planes, with just a
          // handful of flat seams rather than hundreds of individual tile meshes.
          const tiles=Math.max(1,Math.round(q[0].distanceTo(q[1])/.83));
          for(let k=1;k<tiles;k++){
            const t=(k+(row%2)*.38)/tiles;
            const from=q[0].clone().lerp(q[1],t),to=q[3].clone().lerp(q[2],t);
            from.y+=.012;to.y+=.012;
            beam(parent,from.toArray(),to.toArray(),.018,roofMaterial(tint,-.12,true));
          }
        }
        const hip=[points[0],points[3]].map(p=>p.clone().add(new T.Vector3(0,.075,0)));
        beam(parent,hip[0].toArray(),hip[1].toArray(),.09,roofMaterial(tint,.025,true));
      });
      beam(parent,[-top,y+rise+.06,0],[top,y+rise+.06,0],.16,tint);
      for(const z of [-d/2,d/2])box(parent,w,.18,.15,0,y-.06,z,finishes(parent).trim,.025);
      for(const x of [-w/2,w/2])box(parent,.15,.18,d,x,y-.06,0,finishes(parent).trim,.025);
    }
    function wallPanelling(parent,w,h,x,y,z,paint='woodLight',columns=6) {
      box(parent,w,h,.1,x,y,z,material(paint,'wood'),.02);
      for(let i=1;i<columns;i++)box(parent,.028,h-.08,.016,x-w/2+i*w/columns,y,z+.06,'woodDark',0);
      for(const yy of [y-h/2,y+h/2])box(parent,w+.08,.085,.17,x,yy,z+.04,finishes(parent).trim,.02);
    }
    function porchLight(parent,x,y,z) {
      box(parent,.16,.52,.16,x,y,z,'woodDark',.02);
      beam(parent,[x,y+.17,z],[x,y+.17,z+.32],.075,'iron');
      box(parent,.27,.36,.23,x,y-.02,z+.3,material('cream','',{emissive:'#f5d090',emissiveIntensity:.22}),.025);
      box(parent,.35,.09,.31,x,y+.2,z+.3,'iron',.02);box(parent,.31,.07,.28,x,y-.22,z+.3,'iron',.02);
    }
    function bookRow(parent,x,y,z,count=7,width=2.2,heightScale=1) {
      for(let i=0;i<count;i++){
        const h=(.42+((i*3)%5)*.075)*heightScale,xx=x-width/2+(i+.5)*width/count;
        box(parent,width/count-.025,h,.27,xx,y+h/2,z,['berry','cream','teal','roofHoney'][i%4],.01);
        box(parent,width/count-.06,.025,.015,xx,y+h*.75,z+.145,'cream',0);
      }
    }
    function stripedCanopy(parent,x,y,z,w,d,accent) {
      const n=Math.round(w/.48),strip=w/n;
      for(let i=0;i<n;i++){
        const xx=x-w/2+(i+.5)*strip,paint=i%2?'cream':accent;
        const cloth=geometry(`cloth:${strip}:${d}`,()=>{
          const geo=new T.PlaneGeometry(strip+.008,d,1,6),pos=geo.getAttribute('position');
          for(let j=0;j<pos.count;j++){
            const depth=-pos.getY(j),t=(depth+d/2)/d;
            pos.setXYZ(j,pos.getX(j),-depth*.16-.09*Math.sin(t*Math.PI),depth);
          }
          geo.computeVertexNormals();return geo;
        });
        mesh(parent,cloth,material(paint,'',{side:T.DoubleSide}),xx,y,z);
        const edge=geometry(`clothEdge:${strip}`,()=>{
          const shape=new T.Shape();shape.moveTo(-strip/2,0);shape.lineTo(strip/2,0);shape.lineTo(strip/2,-.14);shape.quadraticCurveTo(0,-.32,-strip/2,-.14);shape.closePath();
          return new T.ShapeGeometry(shape,8);
        });
        mesh(parent,edge,material(paint,'',{side:T.DoubleSide}),xx,y-d*.08,z+d/2+.012);
      }
    }
    // LOCATION IDENTITIES — architecture, physical signs and props belong together.
    const BUILDINGS = {
      photo(parent,p,hit) {
        const style=BUILDING_STYLE.photo,paint=finishes(parent),eave=.4+style.wallHeight;
        // Compact painted booth with a thin pitched cap and a sheltered print counter.
        deck(parent,8.8,7.7,.8);
        box(parent,5.35,style.wallHeight,5.7,1.22,.4+style.wallHeight/2,.05,material(paint.wall,'plaster'),.025);
        const roof=group(parent,1.22,0,.05),roofHit=group(hit,1.22,0,.05);
        gableRoof(roof,roofHit,5.45,5.85,eave,style.roofRise,p.accent);
        for(const x of [-1.43,3.87])box(parent,.15,style.wallHeight,.16,x,.4+style.wallHeight/2,2.91,paint.trim,.025);
        arch(parent,1.22,.43,2.95,3.63,3.83,material(paint.trim,'wood'));
        arch(parent,1.22,.48,3.13,3.24,3.52,'woodDark');
        // Fluted curtain tucked behind the arch, with a tieback and a visible bench.
        for(let i=0;i<5;i++)cylinder(parent,.115,.13,2.94,2.15+i*.19,2.02,3.37,paint.fabric,12);
        box(parent,.89,.12,.19,2.53,1.95,3.54,'roofHoney',.03);
        beam(parent,[-.4,3.74,3.35],[2.94,3.74,3.35],.09,paint.trim);
        box(parent,.78,.94,.1,.39,2.58,3.35,paint.joinery,.04);
        const boothLens=cylinder(parent,.18,.18,.12,.39,2.7,3.45,'iron',16);boothLens.rotation.x=Math.PI/2;
        box(parent,.36,.09,.03,.39,2.32,3.42,'cream',.01);
        box(parent,1.3,.18,.62,.62,1.02,3.29,paint.trim,.04);
        for(const x of [.12,1.12])box(parent,.08,.55,.1,x,.69,3.29,'woodDark',.015);
        const cameraSign=group(parent,1.22,eave+style.roofRise+.12,.12);cameraSign.scale.setScalar(style.cameraScale);
        box(cameraSign,2.55,1.35,.72,0,.72,0,paint.joinery,.045);
        box(cameraSign,.57,.19,.48,-.6,1.48,0,'woodDark',.035);
        const lens=cylinder(cameraSign,.51,.51,.3,.23,.75,.46,'woodDark',24);lens.rotation.x=Math.PI/2;
        const glass=cylinder(cameraSign,.36,.36,.34,.23,.75,.47,'teal',24);glass.rotation.x=Math.PI/2;
        ball(cameraSign,.13,.9,.66,.06,.06,.018,'cream');box(cameraSign,.33,.23,.04,-.78,1.01,.4,'cream',.02);
        sign(parent,p.sign,1.22,eave-.04,3.26,4.43,.72);
        for(const z of [-.9,3.25])box(parent,.14,3.5,.14,-3.87,2.13,z,material('wood','wood'),.025);
        stripedCanopy(parent,-2.77,3.94,1.13,2.66,4.22,paint.fabric);
        beam(parent,[-3.87,3.6,3.2],[-3.27,3.94,3.2],.1,'woodDark');
        box(parent,2.6,1.42,1.5,-2.73,1.11,2.3,paint.trim);
        wallPanelling(parent,2.55,1.14,-2.73,1.05,3.08,paint.joinery,5);
        box(parent,2.8,.16,1.65,-2.73,1.89,2.3,'woodDark');
        box(parent,1.25,.81,1.05,-2.8,2.36,2.22,'cream',.14);
        box(parent,.91,.13,.13,-2.8,2.23,2.79,'iron');
        const print=box(parent,.76,.025,.65,-2.8,2.18,3.12,'cream',0);print.rotation.x=.18;
        box(parent,.54,.025,.4,-2.8,2.22,3.14,'blush',0);
        illustration(parent,'photos',-2.73,1.11,3.1,.64,1.05);
        const side=group(parent,3.92,0,-.5,Math.PI/2);illustration(side,'photos',0,2.65,0,1.25,2.55);
        flowerPot(parent,3.76,4.2,.65);
        for(let i=0;i<7;i++)box(parent,.025,.025,5.63,3.91,.8+i*.49,.05,paint.trim,0);
        porchLight(parent,-.96,3.1,3.09);
        hitBox(hit,5.75,eave,6.1,1.22,eave/2,.05);hitBox(hit,1.9,1.1,1,1.22,eave+style.roofRise+.6,.12);
        hitBox(hit,2.9,.6,4.4,-2.75,3.94,1.13);hitBox(hit,2.8,2.8,1.75,-2.73,1.8,2.4);
      },
      theatre(parent,p,hit) {
        const style=BUILDING_STYLE.theatre,paint=finishes(parent),eave=.4+style.wallHeight;
        shell(parent,p,style.wallHeight);deck(parent,9,2.7,3.9);
        barrelRoof(parent,'auditoriumRoof',8.5,6.9,eave,style.roofRise,p.accent);
        arch(parent,0,.35,3.34,8.65,style.facadeHeight,paint.trim);
        arch(parent,0,.46,3.54,8.23,style.facadeHeight-.32,paint.wall);
        arch(parent,0,.48,3.76,4.62,3.8,paint.joinery);
        // Real paired foyer doors behind velvet side curtains, not a blank stage hole.
        for(const side of [-1,1]){
          box(parent,1.27,2.9,.12,side*.66,1.99,3.98,material(paint.joinery,'wood'),.025);
          box(parent,1.05,1.88,.06,side*.66,2.38,4.07,BUILDING_STYLE.details.glass,.015);
          box(parent,.98,.39,.055,side*.66,.89,4.09,p.accent,.02);
          box(parent,1.11,.07,.075,side*.66,2.58,4.13,'roofHoney',.01);
          box(parent,.055,.4,.085,side*.19,1.75,4.16,'roofHoney',.01);
          for(let i=0;i<3;i++)cylinder(parent,.105,.12,3.02,side*(1.58+i*.19),2.04,4.04,paint.fabric,12);
          box(parent,.56,.09,.18,side*1.78,1.68,4.17,'roofHoney',.02);
        }
        box(parent,4.76,.14,.7,0,.47,4,'woodDark');
        // A shallow marquee has a visible soffit, cornice and a modest bulb rhythm.
        box(parent,7.65,.16,1.32,0,4.08,4.04,'woodDark',.025);
        box(parent,7.5,.65,1.23,0,4.43,4.04,p.accent,.035);
        box(parent,7.75,.13,1.42,0,4.82,4.06,paint.trim,.025);
        sign(parent,p.sign,0,4.46,4.69,5.8,.7);
        sign(parent,'THÉÂTRE',0,5.78,3.91,3.37,.7);
        for(let i=0;i<13;i++)ball(parent,-3.3+i*.55,4.07,4.7,.059,.059,.04,material(paint.wall,'',{emissive:'#ffe0a1',emissiveIntensity:.3}));
        for(const x of [-3.91,3.91]){
          box(parent,.23,3.55,.2,x,2.25,3.94,paint.trim,.025);
          box(parent,.42,.19,.37,x,.57,4,paint.trim,.025);box(parent,.39,.16,.33,x,3.98,4,paint.trim,.025);
        }
        for(const y of [.85,3.65])box(parent,8.2,.1,.16,0,y,3.87,paint.trim,.015);
        const theatreSide=group(parent,4.06,0,-.6,Math.PI/2);
        illustration(theatreSide,'festival',0,2.35,0,1.36,2.3);
        const ticket=group(parent,-3.12,0,3.96);windowFrame(ticket,0,2.24,0,.89,1.12);box(ticket,1.18,.14,.51,0,1.55,.2,'woodDark');
        sign(ticket,'BILLETS',0,3.13,.07,1.12,.25);
        illustration(parent,'festival',3.12,2.43,3.94,1.02,1.72);
        porchLight(parent,-2.7,3.66,3.91);porchLight(parent,2.7,3.66,3.91);
        const board=group(parent,5.1,0,3.35,-.16);illustration(board,'festival',0,1.55,0,1.4,2.12);
        for(const x of [-.68,.68])beam(board,[x,0,.45],[x,2.72,0],.11);collider(board,'box',0,.15,1.65,1);
        flowerPot(parent,-4.5,4.35,.6);flowerPot(parent,4.4,4.35,.6);
        hitBox(hit,8.3,eave+1.4,6.8,0,(eave+1.4)/2,0);hitBox(hit,8.7,style.facadeHeight,.8,0,.35+style.facadeHeight/2,3.8);
      },
      bookstore(parent,p,hit) {
        const style=BUILDING_STYLE.bookstore,paint=finishes(parent),eave=.4+style.wallHeight;
        shell(parent,p,style.wallHeight);deck(parent,8,2.1,3.6);
        gableRoof(parent,hit,7.25,6.2,eave,style.roofRise,p.accent,true);
        doorway(parent,-2.43,3.08,paint.joinery);
        box(parent,.88,1.43,.98,-2.2,eave+.8,-1.78,material('plaster','plaster'),.035);
        box(parent,1.08,.16,1.16,-2.2,eave+1.51,-1.78,'stone',.025);
        for(let i=0;i<3;i++)box(parent,.9,.035,.99,-2.2,eave+.4+i*.32,-1.78,paint.trim,.01);
        // A projecting timber display bay, with small books behind a deep reveal.
        wallPanelling(parent,3.86,.73,1.02,.92,3.19,paint.joinery,4);
        windowFrame(parent,1.02,2.42,3.28,3.65,2.19);
        for(const y of [1.48,2.32]){
          box(parent,3.62,.08,.46,1.02,y-.07,3.5,paint.trim,.025);bookRow(parent,1.02,y,3.6,10,3.34,1.02);
        }
        for(const x of [-.85,2.89])box(parent,.14,2.95,.18,x,2.04,3.61,paint.trim,.025);
        stripedCanopy(parent,1.04,3.82,3.76,4.12,1.12,paint.fabric);
        sign(parent,p.sign,0,eave-.18,3.52,6.1,.66);
        // A small attic light and restrained exposed gable joinery.
        const attic=group(parent,0,5.28,3.18);
        const rim=cylinder(attic,.32,.32,.1,0,0,0,paint.trim,24);rim.rotation.x=Math.PI/2;
        const pane=cylinder(attic,.235,.235,.12,0,0,.025,BUILDING_STYLE.details.glass,24);pane.rotation.x=Math.PI/2;
        box(attic,.04,.48,.06,0,0,.1,'cream',.01);box(attic,.48,.04,.06,0,0,.1,'cream',.01);
        const side=group(parent,3.58,0,-.38,Math.PI/2);
        windowFrame(side,0,2.5,0,2.85,2.17);
        for(const y of [1.6,2.4]){box(side,2.85,.08,.4,0,y-.06,.22,paint.trim);bookRow(side,0,y,.36,8,2.6,1.02);}
        windowBox(side,0,1.02,.38,2.94);
        // Book spines form a street display, supported by a timber stand.
        const cart=group(parent,4.65,0,3.4,.06);
        box(cart,1.5,.24,1.05,0,.6,0,'wood');bookRow(cart,0,.73,.18,3,1.28,2.25);
        for(const x of [-.58,.58])for(const z of [-.35,.35])cylinder(cart,.095,.095,.52,x,.26,z,'woodDark',6);
        collider(cart,'box',0,0,1.6,1.1);
        bench(parent,-4.9,4.6,-.18);mushroom(parent,4.7,5.1,.65);
        const post=group(parent,-4.22,0,1.95);
        box(post,.15,3.5,.15,0,1.75,0,'woodDark');box(post,1.4,.12,.15,.61,3.38,0,'woodDark');
        // A hanging open-book sign, instead of a tiny ambiguous playing card.
        for(const side of [-1,1]){
          const cover=box(post,.7,1.14,.15,.64+side*.34,2.54,.08,p.accent,.035);cover.rotation.y=-side*.2;
          const pages=box(post,.58,1.02,.12,.64+side*.31,2.54,.19,'cream',.025);pages.rotation.y=-side*.2;
          for(let i=0;i<4;i++)box(post,.4,.025,.02,.64+side*.31,2.8-i*.15,.28,paint.trim,0);
        }
        collider(post,'circle',0,0,.16);flowerPot(parent,3.6,4.28,.55);
        porchLight(parent,-1.23,3.33,3.13);
        hitBox(hit,7,eave,6,0,eave/2,0);hitBox(hit,4.15,3.25,1.1,1.04,2.4,3.4);
      },
      church(parent,p,hit) {
        const style=BUILDING_STYLE.church,paint=finishes(parent),eave=.4+style.wallHeight;
        shell(parent,p,style.wallHeight);
        // A low stone stoop gives the chapel a different footing from the shops.
        box(parent,8.8,.34,2.4,0,.17,4.08,'stone',.025);
        for(let i=0;i<9;i++)box(parent,.93,.07,2.3,-3.9+i*.975,.375,4.08,'plaster',.015);
        gableRoof(parent,hit,8.25,7.2,eave,style.roofRise,p.accent);
        const tx=-2.48,tz=2.78,towerTop=.4+style.towerHeight;
        box(parent,2.55,style.towerHeight,2.65,tx,.4+style.towerHeight/2,tz,material(paint.wall,'plaster'),.035);
        for(const x of [tx-1.16,tx+1.16])box(parent,.14,style.towerHeight,.13,x,.4+style.towerHeight/2,4.14,paint.trim,.02);
        box(parent,2.85,.19,2.94,tx,towerTop+.04,tz,paint.trim,.025);
        box(parent,2.43,1.28,2.53,tx,towerTop+.78,tz,paint.wall,.025);
        arch(parent,tx,towerTop+.2,4.1,1.35,1.12,paint.trim);
        arch(parent,tx,towerTop+.26,4.26,1.05,.94,'woodDark');
        cylinder(parent,.16,.3,.47,tx,towerTop+.64,4.45,'roofHoney',16);
        ball(parent,tx,towerTop+.38,4.45,.06,.08,.06,'woodDark');
        const sideBell=group(parent,tx+1.23,0,tz,Math.PI/2);
        arch(sideBell,0,towerTop+.2,0,1.3,1.12,paint.trim);arch(sideBell,0,towerTop+.26,.17,1.02,.94,'woodDark');
        const spire=cylinder(parent,0,1.94,1.25,tx,towerTop+2.04,tz,roofMaterial(p.accent),4);spire.rotation.y=Math.PI/4;
        for(const [x,z] of [[-1.36,-1.36],[1.36,-1.36],[1.36,1.36],[-1.36,1.36]])
          beam(parent,[tx+x,towerTop+1.43,tz+z],[tx,towerTop+2.68,tz],.045,roofMaterial(p.accent,.025));
        box(parent,2.86,.14,2.86,tx,towerTop+1.43,tz,paint.trim,.025);
        box(parent,.105,.89,.105,tx,towerTop+3.05,tz,'woodDark',.02);box(parent,.72,.105,.105,tx,towerTop+3.19,tz,'woodDark',.02);
        for(let i=0;i<3;i++)box(parent,2.57,.025,.035,tx,1.05+i*.48,4.12,paint.trim,0);
        arch(parent,tx,towerTop-1.95,4.12,.88,1.29,paint.trim);
        arch(parent,tx,towerTop-1.86,4.29,.63,1.06,'woodDark');
        for(let i=0;i<5;i++)box(parent,.58,.06,.055,tx,towerTop-1.7+i*.155,4.5,paint.trim,.01);
        doorway(parent,.92,3.56,'woodDark');
        // Rose window above the entrance; tall stained-glass windows along the nave.
        const rim=cylinder(parent,.69,.69,.13,.92,4.65,3.68,paint.trim,24);rim.rotation.x=Math.PI/2;
        const glass=cylinder(parent,.58,.58,.15,.92,4.65,3.76,'roofHoney',24);glass.rotation.x=Math.PI/2;
        for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(parent,[.92,4.65,3.86],[.92+Math.cos(a)*.54,4.65+Math.sin(a)*.54,3.86],.05,'cream');}
        sign(parent,p.sign,.92,3.84,3.83,3.48,.62);
        const side=group(parent,4.08,0,0,Math.PI/2);
        for(const x of [-1.8,1.6]){arch(side,x,1.06,0,1.35,2.64,paint.trim);arch(side,x,1.22,.18,1.03,2.29,paint.joinery);box(side,.08,1.9,.05,x,2.25,.4,'cream');box(side,.95,.08,.05,x,2.12,.4,'cream');box(side,.35,.67,.04,x-.22,1.7,.42,'roofHoney');}
        box(parent,.22,3.05,.28,4.07,1.88,-2.95,paint.trim);
        box(parent,.22,3.05,.28,4.07,1.88,.06,paint.trim);
        for(const z of [-2.95,.06])box(parent,.38,.39,.48,4.08,.53,z,'stone',.025);
        porchLight(parent,2.51,2.97,3.57);
        bench(parent,-5.2,1.8,-Math.PI/2);flowerPot(parent,-4.35,4.72,.65);flowerPot(parent,4.35,4.72,.65);
        const board=group(parent,5.08,0,3.35,-.14);sign(board,'WELCOME',0,1.55,0,1.5);
        for(const x of [-.6,.6])beam(board,[x,0,.35],[x,2.1,0],.1);collider(board,'box',0,.1,1.7,.75);
        hitBox(hit,8,eave,7,0,eave/2,0);hitBox(hit,2.9,towerTop+1.5,2.96,tx,(towerTop+1.5)/2,tz);
        hitBox(hit,2.6,1.55,2.6,tx,towerTop+2,tz);hitBox(hit,.8,1,.25,tx,towerTop+3.05,tz);
      },
      tea(parent,p,hit) {
        const style=BUILDING_STYLE.tea,paint=finishes(parent),eave=.4+style.wallHeight;
        shell(parent,p,style.wallHeight);deck(parent,8.5,3,3.3);
        // Broad, low hipped roof; painted joinery and a shallow serving bay below.
        hipRoof(parent,8,5.95,eave+.12,style.roofRise,p.accent);
        wallPanelling(parent,3.92,.85,.83,.97,2.57,paint.joinery,5);
        arch(parent,-2.46,.42,2.59,1.65,3.14,paint.trim);
        arch(parent,-2.46,.48,2.76,1.34,2.91,paint.joinery);
        windowFrame(parent,-2.46,2.49,2.95,.79,.98);
        box(parent,.85,.64,.07,-2.46,1.14,2.97,paint.trim,.025);box(parent,.71,.5,.08,-2.46,1.14,3.02,paint.joinery,.02);
        ball(parent,-1.94,1.7,3.05,.065,.065,.06,'roofHoney');
        windowFrame(parent,.83,2.45,2.64,3.82,1.85);
        box(parent,3.97,.15,.85,.88,1.47,3.01,material(paint.trim,'wood'),.035);
        for(const x of [-.59,2.38])beam(parent,[x,1.13,2.77],[x,1.42,3.37],.1,'woodDark');
        for(let i=0;i<3;i++){
          const x=-.32+i*1.1;cylinder(parent,.22,.17,.51,x,1.79,3.1,i%2?'blush':'tea',16);
          cylinder(parent,.24,.24,.045,x,2.06,3.1,'cream',16);cylinder(parent,.026,.026,.37,x+.025,2.2,3.1,'moss',6);
          for(let j=0;j<3;j++)ball(parent,x-.095+j*.095,1.65,3.3,.034,.034,.013,'woodDark');
        }
        stripedCanopy(parent,.83,3.62,3.14,4.35,1.36,paint.fabric);
        sign(parent,p.sign,0,eave-.17,3.17,5.9,.66);
        const side=group(parent,3.56,0,-.6,Math.PI/2);windowFrame(side,0,2.36,0,2.2,1.75);windowBox(side,0,1.2,.25,2.45);
        // A small hanging cup on a joined wall bracket, instead of a giant roof prop.
        const cup=group(parent,-3.51,2.3,3.38);cup.scale.setScalar(style.cupScale);
        cylinder(cup,.81,.59,1.5,0,.85,0,'tea',20);cylinder(cup,.88,.88,.1,0,1.65,0,'cream',20);
        const straw=cylinder(cup,.066,.066,.8,.17,2.08,0,p.accent,8);straw.rotation.z=-.12;
        for(let i=0;i<7;i++){const a=i*2.4;ball(cup,Math.sin(a)*.68,.4+(i%2)*.24,Math.cos(a)*.68,.09,.09,.09,'woodDark');}
        beam(parent,[-3.3,3.66,2.66],[-3.55,3.66,3.46],.09,'woodDark');
        beam(parent,[-3.51,3.66,3.38],[-3.51,3.04,3.38],.045,'iron');
        beam(parent,[-3.3,3.29,2.66],[-3.5,3.66,3.31],.07,'woodDark');
        porchLight(parent,-1.48,3.06,2.65);
        const menu=group(parent,-4.65,0,3.35,-.12);illustration(menu,'menu',0,1.3,0,1.08,1.65);
        for(const x of [-.5,.5])beam(menu,[x,0,.5],[x,2.2,0],.1);collider(menu,'box',0,.2,1.3,.9);
        const table=group(parent,5.2,0,3.5);cylinder(table,1.15,1.15,.18,0,1.4,0,'woodLight',16);cylinder(table,.15,.2,1.3,0,.66,0,'wood');
        collider(table,'circle',0,0,1.15).label='cafe-table';
        for(const x of [-1.7,1.7]){cylinder(table,.5,.5,.17,x,.78,0,'woodLight',12);cylinder(table,.16,.22,.72,x,.36,0,'wood');collider(table,'circle',x,0,.5).label='stool';}
        cylinder(table,.14,.1,.32,.2,1.65,0,'tea');cylinder(table,.02,.02,.32,.2,1.94,0,'moss',6);flowerPot(parent,3.8,4.2,.5);
        hitBox(hit,7,eave,5,0,eave/2,0);hitBox(hit,8,style.roofRise,5.95,0,eave+style.roofRise/2,0);
      },
    };

    // Folded, pointed leaf geometry replaces sphere canopies. Shared across plants.
    const leafGeometry=geometry('foldedLeaf',()=>{
      const geo=new T.BufferGeometry();
      const v=[0,0,-1, -.46,0,-.28, -.34,0,.5, 0,.02,1, .34,0,.5, .46,0,-.28, 0,.18,-.1];
      geo.setAttribute('position',new T.Float32BufferAttribute(v,3));
      geo.setIndex([6,1,0,6,2,1,6,3,2,6,4,3,6,5,4,6,0,5]);geo.computeVertexNormals();return geo;
    });
    function leaf(parent,x,y,z,size,angle,tint='leaf',tilt=0) {
      const m=mesh(parent,leafGeometry,material(tint,'',{side:T.DoubleSide}),x,y,z);
      m.scale.set(size,size,size);m.rotation.set(tilt,angle,(random()-.5)*.42);return m;
    }
    // One softly sculpted crown per tree, with varied proportions and a few
    // small edge leaves. Shared smooth geometry replaces stacks of pointed leaves.
    function crownGeometry(form) {
      return geometry(`crown:${form}`,()=>{
        const geo=new T.SphereGeometry(1,WORLD_STYLE.trees.canopySegments,WORLD_STYLE.trees.canopyRings);
        const position=geo.getAttribute('position'),colours=[];
        for(let i=0;i<position.count;i++){
          const x=position.getX(i),y=position.getY(i),z=position.getZ(i),a=Math.atan2(z,x);
          const ripple=1+.065*Math.sin(a*5+y*4+form)+.026*Math.cos(a*9-y*7);
          const taper=form===1?1-.17*y:1+.14*y;
          position.setXYZ(i,x*ripple*taper+.08*y*y,y+.04*Math.sin(a*4)*(1-y*y),z*ripple*taper);
          const shade=.91+.07*(y+1)/2+.02*Math.sin(a*3+y*8);
          colours.push(shade,shade,shade);
        }
        geo.setAttribute('color',new T.Float32BufferAttribute(colours,3));geo.computeVertexNormals();return geo;
      });
    }
    function treeTint(x,z) {
      const index=Math.abs(Math.round(Math.sin(x*12.9898+z*78.233)*43758.5453))%SEASON.foliage.length;
      return SEASON.foliage[index];
    }
    function branch(parent,points,radius,bark) {
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      // A curved, tapered trunk reads more naturally than a straight polygon post.
      const geo=new T.TubeGeometry(curve,8,radius,8,false),pos=geo.getAttribute('position');
      for(let ring=0;ring<=8;ring++){
        const centre=curve.getPointAt(ring/8),taper=1-ring/8*.65;
        for(let side=0;side<=8;side++){
          const i=ring*9+side;
          pos.setXYZ(i,centre.x+(pos.getX(i)-centre.x)*taper,centre.y+(pos.getY(i)-centre.y)*taper,centre.z+(pos.getZ(i)-centre.z)*taper);
        }
      }
      geo.computeVertexNormals();const twig=mesh(parent,geo,material(bark,'wood'));twig.userData.uniqueGeometry=true;
    }
    function tree(parent,x,z,s=1,pine=false,tint=null) {
      const g=group(parent,x,0,z);g.scale.setScalar(s);
      collider(g,'circle',0,0,.48).label=pine?'pine':'tree';
      const variation=Math.abs(Math.round(x*3+z*7)),form=variation%3,bark=form===1?'woodLight':'wood';
      branch(g,[[0,0,0],[.12,1.6,-.06],[-.12,3.1,.04],[.18,4.6,0]],.32,bark);
      for(let i=0;i<3;i++){const a=i*2.1+.3;beam(g,[Math.cos(a)*.48,.055,Math.sin(a)*.48],[.05,.6,0],.12,bark);}
      if(pine) {
        // Continuous, gently scalloped evergreen outline with layered branch tips.
        const profile=[new T.Vector2(.35,1.65),new T.Vector2(1.95,1.9),new T.Vector2(1.7,2.3),new T.Vector2(1.28,3),new T.Vector2(1.72,2.95),new T.Vector2(1.43,3.5),new T.Vector2(.96,4.15),new T.Vector2(1.28,4.05),new T.Vector2(.92,4.8),new T.Vector2(.59,5.3),new T.Vector2(.85,5.18),new T.Vector2(.51,6.05),new T.Vector2(0,7.05)];
        const geo=geometry('softEvergreen',()=>{
          const shape=new T.LatheGeometry(profile,20),pos=shape.getAttribute('position');
          for(let i=0;i<pos.count;i++){
            const a=Math.atan2(pos.getZ(i),pos.getX(i)),r=1+.06*Math.sin(a*7+pos.getY(i)*1.2);
            pos.setX(i,pos.getX(i)*r);pos.setZ(i,pos.getZ(i)*r);
          }
          shape.computeVertexNormals();return shape;
        });
        mesh(g,geo,'pine');return;
      }
      const foliage=tint||treeTint(x,z),wide=form===1?1.77:2.5,tall=form===1?2.6:2.05,cy=form===1?4.75:4.65;
      for(let k=0;k<4;k++){
        const a=k*2.4+variation*.13,tx=Math.cos(a)*wide*.64,tz=Math.sin(a)*wide*.6;
        branch(g,[[0,1.9+k*.23,0],[tx*.5,2.8+k*.13,tz*.4],[tx,cy-.3,tz]],.12,bark);
      }
      const crown=mesh(g,crownGeometry(form),material(foliage,'foliage',{vertexColors:true}),.05,cy,0);
      crown.scale.set(wide,tall,wide*.86);crown.rotation.y=variation*.7;crown.rotation.z=(form-1)*.07;
      for(let i=0;i<WORLD_STYLE.trees.edgeLeaves;i++){
        const a=i*2.4,y=Math.sin(i*1.7)*.6;
        leaf(g,Math.cos(a)*wide*.96,cy+y,Math.sin(a)*wide*.83,.23,a,foliage,.25);
      }
    }
    function pumpkin(parent,x,z,size=.5,tint='leafAmber') {
      if(!canPlant(x,z,size+.12))return;
      const g=group(parent,x,0,z);g.scale.setScalar(size);
      collider(g,'circle',0,0,.79).label='pumpkin';
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7;
        ball(g,Math.cos(a)*.34,.66,Math.sin(a)*.34,.5,.62,.5,tint);
      }
      const stalk=cylinder(g,.08,.12,.28,0,1.29,0,'woodDark',8);stalk.rotation.z=-.2;
      leaf(g,.14,1.25,0,.29,.6,'leafOlive',.2);
    }
    function decorateSeason(parent, layout) {
      if(!SEASON.fallenLeaves&&!SEASON.pathLeaves&&!SEASON.pumpkins&&!SEASON.accentTrees)return;
      const colours=SEASON.fallenColours||SEASON.foliage;
      function scatter(x,z,size,angle,index) {
        if(places.some(p=>Math.abs(x-p.x)<p.width/2+.8&&Math.abs(z-p.z)<p.depth/2+2))return;
        const fallen=leaf(parent,x,.078,z,size,angle,colours[index%colours.length]);
        fallen.rotation.z=0;fallen.scale.y=.14;fallen.castShadow=false;
      }
      const accentTrees=SEASON.accentTrees?(layout.autumnTrees||[]).filter(([x,z,size])=>canPlant(x,z,size*.6)):[];
      accentTrees.forEach(([x,z,size,tint])=>tree(parent,x,z,size,false,tint));
      [...layout.trees,...accentTrees].forEach(([x,z,size])=>{
        for(let i=0;i<SEASON.fallenLeaves;i++){
          const angle=random()*Math.PI*2,radius=(1.1+random()*2.35)*size;
          scatter(x+Math.cos(angle)*radius,z+Math.sin(angle)*radius,.19+random()*.15,angle,i);
        }
      });
      // Small drifts beside the walkable paths bring autumn into the closer view.
      const [minX,maxX,minZ,maxZ]=layout.bounds;
      const samples=roadZones.flatMap(road=>road.samples.map(p=>({p,width:road.width})))
        .filter(({p})=>p.x>minX&&p.x<maxX&&p.z>minZ&&p.z<maxZ);
      for(let i=0;i<(SEASON.pathLeaves||0)&&samples.length;i++){
        const {p,width}=samples[Math.floor(random()*samples.length)],a=random()*Math.PI*2,r=width/2+(random()-.5)*1.1;
        scatter(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,.16+random()*.15,a,i);
      }
      if(SEASON.pumpkins)places.filter(p=>['bookstore','tea','photo'].includes(p.model)).forEach(p=>{
        const x=p.x-p.width/2-1.15,z=p.z+p.depth/2+2.9;
        pumpkin(parent,x,z,.54,'leafAmber');pumpkin(parent,x-.95,z+.27,.37,'leafGold');
      });
    }
    function canPlant(x,z,r=.45) {
      if(roadZones.some(road=>road.samples.some(p=>Math.hypot(p.x-x,p.z-z)<road.width/2+r)))return false;
      return !colliders.some(o=>{
        const dx=x-o.x,dz=z-o.z;
        if(o.kind==='circle')return Math.hypot(dx,dz)<o.radius+r;
        const qx=Math.max(Math.abs(dx*o.cos-dz*o.sin)-o.halfX,0),qz=Math.max(Math.abs(dx*o.sin+dz*o.cos)-o.halfZ,0);
        return qx*qx+qz*qz<r*r;
      });
    }
    function shrub(parent,x,z,s=1) {
      if(!canPlant(x,z,.85*s))return;
      const g=group(parent,x,0,z);g.scale.setScalar(s);collider(g,'circle',0,0,.7).label='shrub';
      for(let k=0;k<5;k++) {
        const a=k*2.4;beam(g,[0,.05,0],[Math.cos(a)*.5,.65,Math.sin(a)*.5],.035,'wood');
        for(let i=0;i<7;i++){
          const angle=i*2.4+k;
          leaf(g,Math.cos(a)*.4+Math.cos(angle)*.4,.48+random()*.55,Math.sin(a)*.4+Math.sin(angle)*.4,.34+random()*.24,angle,k%2?'leaf':'leafLight');
        }
      }
    }
    function flowers(parent,x,z) {
      for(let i=0;i<9;i++) {
        const fx=x+(random()-.5)*2.9,fz=z+(random()-.5)*2.2,h=.38+random()*.35;
        if(!canPlant(fx,fz,.2))continue;
        cylinder(parent,.025,.025,h,fx,h/2,fz,'leafDark',4);
        for(let p=0;p<4;p++)ball(parent,fx+Math.cos(p*Math.PI/2)*.1,h,fz+Math.sin(p*Math.PI/2)*.1,.13,.07,.13,i%3?'cream':'flower');
        ball(parent,fx,h+.035,fz,.065,.05,.065,'flowerYellow');
      }
    }
    function bench(parent,x,z,rotation=0) {
      const g=group(parent,x,0,z,rotation);
      collider(g,'box',0,-.04,3.2,1.25).label='bench';
      for(let i=0;i<3;i++)box(g,3,.13,.3,0,.78,-.3+i*.34,'woodLight');
      for(let i=0;i<2;i++)box(g,3,.25,.13,0,1.22+i*.32,-.55,'woodLight');
      for(const xx of [-1.2,1.2]){box(g,.16,1.6,.17,xx,.8,-.55,'woodDark');box(g,.16,.7,.17,xx,.35,.45,'woodDark');}
    }
    function lamp(parent,x,z) {
      collider(parent,'circle',x,z,.18).label='lamp';
      cylinder(parent,.08,.13,3.2,x,1.6,z,'iron');
      for(const dx of [-.28,.28])for(const dz of [-.28,.28])box(parent,.055,.78,.055,x+dx,3.45,z+dz,'iron',0);
      box(parent,.65,.08,.65,x,3.04,z,'iron');
      box(parent,.48,.58,.48,x,3.45,z,material('cream','',{emissive:'#ffe2a1',emissiveIntensity:.22}));
      cylinder(parent,.08,.51,.33,x,4,z,'iron',4);
    }
    function fence(parent,x1,z1,x2,z2) {
      collider(parent,'box',(x1+x2)/2,(z1+z2)/2,Math.hypot(x2-x1,z2-z1)+.3,.32,-Math.atan2(z2-z1,x2-x1)).label='fence';
      const count=Math.ceil(Math.hypot(x2-x1,z2-z1)/1.3);
      for(let i=0;i<=count;i++){const t=i/count,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;cylinder(parent,.14,.16,1.1,x,.55,z,material('woodLight','wood'),7);}
      for(const y of [.35,.8])beam(parent,[x1,y,z1],[x2,y,z2],.12,material('wood','wood'));
    }
    let roadLayer=0,roadZones=[];
    function road(parent,points,width=3.2) {
      // Millimetre offsets prevent coplanar intersections from flickering.
      const height=.025+(roadLayer++)*.004;
      const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,height,z)));
      const positions=[],uvs=[],normals=[],samples=curve.getPoints(150);
      // Shared cross-sections eliminate overlaps between adjacent road segments.
      const edges=samples.map((point,i)=>{
        const tangent=curve.getTangent(i/(samples.length-1));
        const n=new T.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(width/2+Math.sin(i*.43)*.065+Math.sin(i*1.31)*.035);
        return [point.clone().add(n),point.clone().sub(n)];
      });
      for(let i=0;i<samples.length-1;i++){
        const [a,b]=edges[i],[c,d]=edges[i+1];
        [a,c,b,c,d,b].forEach(v=>{positions.push(v.x,v.y,v.z);normals.push(0,1,0);uvs.push(v.x/4,v.z/4);});
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
      const m=mesh(parent,geo,material('soil','sand',{side:T.DoubleSide}));m.castShadow=false;
      roadZones.push({samples,width});return samples;
    }

    // Batch the static village by material. Picking uses its own simple shapes,
    // so rendering does not need a separate material draw for every building.
    function batch(root) {
      root.updateMatrixWorld(true);const buckets=new Map();
      root.traverse(object=>{
        if(!object.isMesh)return;
        const id=object.material.uuid+object.castShadow+object.receiveShadow;
        if(!buckets.has(id))buckets.set(id,{material:object.material,cast:object.castShadow,receive:object.receiveShadow,geos:[]});
        const geo=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geo.applyMatrix4(object.matrixWorld);buckets.get(id).geos.push(geo);
        if(object.userData.uniqueGeometry)object.geometry.dispose();
      });
      root.clear();root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);
      buckets.forEach(({material:mat,cast,receive,geos})=>{
        const count=geos.reduce((sum,g)=>sum+g.attributes.position.count,0),out=new T.BufferGeometry();
        const attributes=[['position',3],['normal',3],['uv',2]];if(mat.vertexColors)attributes.push(['color',3]);
        for(const [name,size]of attributes){
          const arr=new Float32Array(count*size);let offset=0;
          geos.forEach(g=>{const attr=g.getAttribute(name);if(attr)arr.set(attr.array,offset);offset+=g.attributes.position.count*size;});out.setAttribute(name,new T.BufferAttribute(arr,size));
        }
        geos.forEach(g=>g.dispose());out.computeBoundingSphere();const m=new T.Mesh(out,mat);m.castShadow=cast;m.receiveShadow=receive;root.add(m);
      });
    }

    let places=[],details,layoutMode=mode,environment;
    function build(nextMode) {
      layoutMode=nextMode;details=DETAILS[layoutMode];randomState=48;roadLayer=0;roadZones=[];
      content.traverse(o=>{if(o.isMesh)o.geometry.dispose();});content.clear();
      picking.clear();colliders=[];
      environment=group(content);places=[];
      const lawn=mesh(environment,geometry('ground',()=>new T.PlaneGeometry(250,250)),material('grass','grass'));lawn.rotation.x=-Math.PI/2;lawn.castShadow=false;
      const roadSamples=road(environment,details.path,3.8);
      if(details.fork.length)roadSamples.push(...road(environment,details.fork,3.5));
      PLACES.forEach(spec=>{
        const entry=entries.find(e=>e.id===spec.id);if(!entry)return;
        const [x,z]=spec[layoutMode],place={...spec,x,z,title:entry.title,status:entry.status,accent:BUILDING_PALETTE[spec.model].roof};
        const g=group(content,x,0,z,place.rotation);g.userData.project=place.id;
        g.userData.finishes=BUILDING_PALETTE[place.model];
        const hit=group(picking,x,0,z,place.rotation);hit.userData.project=place.id;
        BUILDINGS[place.model](g,place,hit);finishBuilding(g,place);
        // Buildings and raised porches are solid; door approaches remain at ground level.
        collider(g,'box',0,.65,place.width+.85,place.depth+2.15).label='building:'+place.id;
        // Leave room for the configured mascot radius in front of the solid porch.
        const entranceZ=.65+(place.depth+2.15)/2+CHARACTER.footprintRadius*CHARACTER.scale+.25;
        const door=new T.Vector3(0,0,entranceZ).applyAxisAngle(new T.Vector3(0,1,0),place.rotation).add(new T.Vector3(x,0,z));
        place.door={x:door.x,z:door.z};
        const nearest=roadSamples.reduce((best,p)=>p.distanceToSquared(door)<best.distanceToSquared(door)?p:best,roadSamples[0]);
        road(environment,[[door.x,door.z],[(door.x+nearest.x)/2,door.z+.6],[nearest.x,nearest.z]],2.2);
        // Separate threshold stones touch the porch and the sandy path.
        for(let i=0;i<3;i++)box(environment,.8,.09,.53,door.x+(i-1)*.91,.07,door.z-.5,'stone');
        place.box=new T.Box3().setFromObject(g);places.push(place);
      });
      details.trees.forEach(args=>tree(environment,...args));details.pines.forEach(args=>tree(environment,...args,true));
      details.benches.forEach(args=>bench(environment,...args));details.lamps.forEach(args=>lamp(environment,...args));details.fences.forEach(args=>fence(environment,...args));
      details.flowers.forEach(([x,z])=>{flowers(environment,x,z);shrub(environment,x+1.7,z-1,1);});
      const extent=layoutMode==='desktop'?[[-45,45],[-37,40]]:[[-20,20],[-42,49]];
      for(let i=0;i<95;i++){
        const x=extent[0][0]+random()*(extent[0][1]-extent[0][0]),z=extent[1][0]+random()*(extent[1][1]-extent[1][0]);
        if(places.some(p=>Math.abs(x-p.x)<p.width/2+2 && Math.abs(z-p.z)<p.depth/2+4))continue;
        if(roadSamples.some(p=>Math.hypot(p.x-x,p.z-z)<3.5))continue;
        if(i%3===0)shrub(environment,x,z,.6+random()*.5);
        else for(let k=0;k<4;k++){
          const blade=mesh(environment,geometry('blade',()=>new T.ConeGeometry(.06,.35,3)),material('grassBlade'),x+(random()-.5)*.8,.14,z+(random()-.5)*.8);blade.castShadow=false;blade.rotation.z=(random()-.5)*.35;
        }
      }
      decorateSeason(environment,details);
      batch(content);picking.updateMatrixWorld(true);renderer.shadowMap.needsUpdate=true;
      resize();
    }
    const avatar=group(scene);avatar.userData.avatar=true;
    const body=group(avatar),portrait=group(body);
    const mascotSphere=geometry('mascotSphere',()=>new T.SphereGeometry(1,16,12));
    function mascotBall(parent,x,y,z,sx,sy,sz,tint) {
      const m=mesh(parent,mascotSphere,material(tint),x,y,z);m.scale.set(sx,sy,sz);return m;
    }
    // Original duckling proportions: a rounded head, compact body, short bill
    // and small tucked wings. The accessory belongs to the same batched model.
    mascotBall(portrait,0,.51,-.035,.39,.345,.355,CHARACTER.feathers);
    const tail=mascotBall(portrait,0,.51,-.365,.145,.115,.135,CHARACTER.feathers);tail.rotation.x=-.4;
    mascotBall(portrait,0,1.015,.055,.37,.355,.335,CHARACTER.feathers);
    for(const x of [-.36,.36]) {
      const wing=mascotBall(portrait,x,.53,-.06,.1,.175,.205,CHARACTER.wing);
      wing.rotation.x=-.35;wing.rotation.z=x>0?-.15:.15;
    }
    mascotBall(portrait,0,.987,.427,.159,.055,.105,CHARACTER.bill);
    for(const x of [-.145,.145]){
      mascotBall(portrait,x,1.10,.354,.031,.039,.019,CHARACTER.eyes);
      mascotBall(portrait,x-.007,1.114,.368,.008,.01,.006,CHARACTER.feathers);
      mascotBall(portrait,Math.sign(x)*.249,.998,.313,.052,.03,.013,CHARACTER.cheek);
    }
    cylinder(portrait,.27,.29,.135,0,.785,.035,CHARACTER.scarf,20);
    mascotBall(portrait,.205,.76,.245,.07,.065,.065,CHARACTER.scarf);
    const scarfEnd=mascotBall(portrait,.21,.615,.28,.078,.18,.038,CHARACTER.scarf);scarfEnd.rotation.z=-.24;
    const shortEnd=mascotBall(portrait,.3,.672,.2,.062,.13,.034,CHARACTER.scarf);shortEnd.rotation.z=.22;
    for(let i=0;i<3;i++){
      box(portrait,.072,.018,.012,.205,.53+i*.07,.32,CHARACTER.leafPin,0);
    }
    if(CHARACTER.accessory==='acorn-beret'){
      const hat=group(portrait,-.035,1.34,-.015);hat.rotation.z=.14;
      mascotBall(hat,0,.045,0,.405,.15,.35,CHARACTER.cap);
      const band=mesh(hat,geometry('beretBand',()=>new T.TorusGeometry(.30,.028,6,28)),CHARACTER.capBand,0,-.055,0);
      band.rotation.x=Math.PI/2;band.scale.y=.92;
      const stem=mascotBall(hat,-.015,.218,-.005,.034,.072,.034,CHARACTER.capBand);stem.rotation.z=-.25;
      // A little gold leaf pin is pressed into the front of the cap.
      const pin=mascotBall(hat,.22,.04,.293,.049,.091,.013,CHARACTER.leafPin);pin.rotation.z=-.5;
      beam(hat,[.192,-.045,.309],[.247,.12,.309],.011,CHARACTER.capBand);
    }else{
      const tuft=mascotBall(portrait,-.035,1.374,.015,.055,.11,.055,CHARACTER.feathers);tuft.rotation.z=-.35;
    }
    batch(portrait);
    const feet=[-.155,.155].map(x=>{
      const foot=group(body,x,0,.065);
      mascotBall(foot,0,.12,-.025,.047,.075,.047,CHARACTER.feet);
      mascotBall(foot,0,.052,.035,.113,.052,.14,CHARACTER.feet);
      batch(foot);return foot;
    });
    // A soft contact shadow follows the feet on both grass and sand.
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
    const shadowContext=shadowCanvas.getContext('2d'),shade=shadowContext.createRadialGradient(32,32,4,32,32,32);
    shade.addColorStop(0,'rgba(54,59,32,.22)');shade.addColorStop(.55,'rgba(54,59,32,.10)');shade.addColorStop(1,'rgba(54,59,32,0)');
    shadowContext.fillStyle=shade;shadowContext.fillRect(0,0,64,64);
    const shadowTexture=new T.CanvasTexture(shadowCanvas);shadowTexture.colorSpace=T.SRGBColorSpace;
    const shadow=mesh(avatar,geometry('mascotShadow',()=>new T.PlaneGeometry(1.12,1.15)),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),0,.004,0);
    shadow.rotation.x=-Math.PI/2;
    avatar.traverse(object=>{if(object.isMesh)object.castShadow=false;});avatar.scale.setScalar(CHARACTER.scale);
    let lastAngle=.3,lastPoseTime=0;
    function moveAvatar(x,z,dx=0,dz=0,time=0,moving=false) {
      avatar.position.set(x,.055,z);
      if(dx||dz){
        const target=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(target-lastAngle),Math.cos(target-lastAngle));
        const dt=lastPoseTime&&time?Math.min(.06,(time-lastPoseTime)/1000):1/60;
        lastAngle+=delta*(1-Math.exp(-CHARACTER.turnResponse*dt));
      }
      lastPoseTime=time;body.rotation.y=lastAngle;
      const stride=moving?Math.sin(time*CHARACTER.cadence):0;
      feet.forEach((foot,i)=>{const step=stride*(i?1:-1);foot.position.z=.065+step*CHARACTER.stepLength;foot.position.y=Math.max(0,step)*CHARACTER.stepLift;});
      portrait.rotation.z=stride*CHARACTER.waddle;
      portrait.position.y=Math.abs(stride)*.01;
    }
    function resize() {
      const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height,false);
      const config=CAMERA[layoutMode],az=T.MathUtils.degToRad(config.azimuth),el=T.MathUtils.degToRad(config.elevation);
      const target=new T.Vector3(0,1.7,layoutMode==='mobile'?5:1);
      camera.position.copy(target).add(new T.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(110));
      camera.lookAt(target);camera.updateMatrixWorld(true);
      const bounds=new T.Box3();places.forEach(p=>bounds.union(p.box));
      const projected=new T.Box3();for(const x of [bounds.min.x,bounds.max.x])for(const y of [0,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
      const aspect=width/height,span=Math.min(config.maxSpan,Math.max((projected.max.y-projected.min.y)*config.padding,(projected.max.x-projected.min.x)*config.padding/aspect)/config.scale);
      const mid=projected.getCenter(new T.Vector3());
      camera.left=mid.x-span*aspect/2;camera.right=mid.x+span*aspect/2;camera.top=mid.y+span/2;camera.bottom=mid.y-span/2;camera.updateProjectionMatrix();
      sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
    }
    const followPoint=new T.Vector3();
    function followAvatar(dt=1/60,moveX=0,moveZ=0,instant=false) {
      const config=CAMERA.follow,length=Math.hypot(moveX,moveZ);
      followPoint.copy(avatar.position);followPoint.y+=.8*CHARACTER.scale;
      if(length){followPoint.x+=moveX/length*config.lookAhead;followPoint.z+=moveZ/length*config.lookAhead;}
      followPoint.project(camera);
      const dx=(followPoint.x-config.offset.x)*(camera.right-camera.left)/2;
      const dy=(followPoint.y-config.offset.y)*(camera.top-camera.bottom)/2;
      if(Math.abs(dx)+Math.abs(dy)<config.settleDistance)return false;
      const alpha=instant?1:1-Math.exp(-config.strength*dt);
      camera.left+=dx*alpha;camera.right+=dx*alpha;camera.top+=dy*alpha;camera.bottom+=dy*alpha;
      camera.updateProjectionMatrix();return true;
    }
    function screenPoint(point) {
      const p=point.clone().project(camera),rect=canvas.getBoundingClientRect();return {x:(p.x+1)/2*rect.width,y:(1-p.y)/2*rect.height};
    }
    function projectBounds(place) {
      const b=place.box,points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(screenPoint(new T.Vector3(x,y,z)));
      return {left:Math.min(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))};
    }
    const raycaster=new T.Raycaster();
    function pick(clientX,clientY) {
      const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
      // Only a few low-polygon architectural silhouettes are interactive. Leaves,
      // roofs' individual tiles and other decoration never enter the picking pass.
      const hit=raycaster.intersectObjects(picking.children,true)[0];let object=hit?.object,project=null;
      while(object){if(object.userData.project){project=object.userData.project;break;}object=object.parent;}
      return {project};
    }
    function render(){renderer.render(scene,camera);}
    build(mode);
    return {renderer,scene,camera,avatar,render,resize,build,moveAvatar,followAvatar,pick,projectBounds,screenPoint,
      get places(){return places;},get details(){return details;},get mode(){return layoutMode;},
      get colliders(){return colliders;},
      get azimuth(){return T.MathUtils.degToRad(CAMERA[layoutMode].azimuth);},
    };
  }
  window.CraftScene={create,PALETTE,WORLD_STYLE,BUILDING_PALETTE,BUILDING_STYLE,CAMERA,CHARACTER,PLACES,DETAILS,ACTIVE_SEASON,SEASONS,SEASON};
})();
