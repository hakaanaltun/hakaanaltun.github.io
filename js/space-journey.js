/* space-journey.js — the journey through the Solar System, /pictures/space/
   (see _agents/pictures.md).

   One stage holds every world at a fixed place in a shared plan, and one
   camera moves over it. The file runs in this order:

   - scenes: the 74 views. Each names the world it looks at (object), the
     point of its image the camera centres (focus), how close it comes
     (zoom), the caption's kicker, title and line, and the view its main
     button leads to (next).
   - notes: the short note the information panel shows for a view that has
     no full field note; the full ones are in js/space-field-notes.js.
   - The large detail images are fetched only when a view needs them, and
     shown once the camera has arrived.
   - localBodies, systems and regionOrigins: where each world's image lies,
     which worlds share a neighbourhood and its wide view, and where each
     neighbourhood stands in the plan. Distances are illustrative.
   - The camera. localTarget gives a view's resting pose; flightProfile,
     flightPose and flyLocal carry the camera there along the curve
     travelRoutes gives each neighbouring pair, turning and approaching in
     perspective (?flight=outside keeps the earlier flat camera).
   - go() is the one way to change view, from a button, a place to look,
     the keyboard, the address or Back and Forward. It waits for the
     images, writes the history, sets the caption (renderScene) and
     travels (position); a newer request cancels an older one.
   - hotspots: the places to look on each view. openInfo opens a note.
   - The controls, the keyboard, full screen, resizing and the address come
     last. The journey starts from the address (sceneFromHash), and the old
     scene-* addresses still lead to their views (legacyScenes).

   The tables stand one entry to a line, as data. The code between them was
   set out to be read on 23 October 2026; until then it was written in
   dense single lines. It is the same program as before, and
   scripts/test-space.cjs checks the journey. */
const $ = (id) => document.getElementById(id);

// The views, by id.
const scenes={
 venuswide:{"title": "Toward the inner planets.", "kicker": "VENUS \u00b7 THE WIDE VIEW", "description": "Approach a world wrapped in clouds.", "primary": "Approach Venus", "next": "venus", "focus": [0.5, 0.5], "zoom": 0.3, "object": "venus", "info": "venus"},
 venus:{"title": "A world beneath a veil.", "kicker": "VENUS \u00b7 MARINER 10", "description": "The bright cloud cover hides the rocky ground below.", "primary": "Explore the clouds", "next": "venusclouds", "focus": [0.5, 0.5], "zoom": 0.84, "object": "venus", "info": "venus"},
 venusclouds:{"title": "Clouds that race around a planet.", "kicker": "VENUS \u00b7 THE ATMOSPHERE", "description": "Follow the streaks revealed by this false-color observation.", "primary": "Follow the shaded edge", "next": "venusphases", "focus": [0.44, 0.42], "zoom": 1.45, "object": "venus", "info": "venus-clouds"},
 venusphases:{"title": "A changing share of sunlight.", "kicker": "VENUS \u00b7 PHASES", "description": "The illuminated fraction changes with our viewing position.", "primary": "Return to Venus", "next": "venus", "focus": [0.68, 0.48], "zoom": 1.75, "object": "venus", "info": "venus-phases"},
 mercurywide:{"title": "Close to the Sun.", "kicker": "MERCURY \u00b7 THE WIDE VIEW", "description": "Approach the innermost planet.", "primary": "Approach Mercury", "next": "mercury", "focus": [0.535, 0.515], "zoom": 0.3, "object": "mercury", "info": "mercury"},
 mercury:{"title": "A surface marked by impacts.", "kicker": "MERCURY \u00b7 MESSENGER", "description": "Bright rays cross older, cratered terrain.", "primary": "Approach Caloris Basin", "next": "caloris", "focus": [0.535, 0.515], "zoom": 0.84, "object": "mercury", "info": "mercury"},
 caloris:{"title": "An impact, followed by lava.", "kicker": "MERCURY \u00b7 CALORIS BASIN", "description": "Look across the broad, pale basin in the northern terrain.", "primary": "Return to Mercury", "next": "mercury", "focus": [0.625, 0.3], "zoom": 2.0, "object": "mercury", "info": "caloris"},
 mercurypoles:{"title": "Cold places near the Sun.", "kicker": "MERCURY \u00b7 POLAR SHADOWS", "description": "Ice can survive in permanently shaded craters; individual deposits are not resolved here.", "primary": "Return to Mercury", "next": "mercury", "focus": [0.53, 0.12], "zoom": 1.35, "object": "mercury", "info": "mercury-ice"},
 solar:{"title": "The star at the center.", "kicker": "THE SUN \u00b7 THE WIDE VIEW", "description": "Approach the visible surface of our nearest star.", "primary": "Approach the Sun", "next": "sun", "focus": [0.5, 0.5], "zoom": 0.3, "object": "sun", "info": "sun"},
 sun:{"title": "The light reaches every world here.", "kicker": "THE SUN \u00b7 THE PHOTOSPHERE", "description": "Explore the visible surface, then follow what its light revealed.", "primary": "Approach the sunspots", "next": "sunspots", "focus": [0.5, 0.5], "zoom": 0.82, "object": "sun", "info": "sun-story"},
 sunspots:{"title": "Cooler places on a brilliant surface.", "kicker": "THE SUN \u00b7 SUNSPOTS", "description": "Magnetic fields concentrate in these dark-looking regions.", "primary": "Explore the visible surface", "next": "photosphere", "focus": [0.533, 0.316], "zoom": 2.1, "object": "sun", "info": "sun-sunspots"},
 photosphere:{"title": "Where sunlight escapes.", "kicker": "THE SUN \u00b7 THE VISIBLE SURFACE", "description": "The bright face is a layer of gas with no solid ground.", "primary": "Return to the Sun", "next": "sun", "focus": [0.4, 0.5], "zoom": 1.45, "object": "sun", "info": "sun-photosphere"},

 voyager2wide:{"title": "Beyond the solar wind.", "kicker": "VOYAGER 2 \u00b7 THE WIDE VIEW", "description": "Approach the spacecraft on its outward journey.", "primary": "Approach Voyager 2", "next": "voyager2", "focus": [0.5, 0.5], "zoom": 0.3, "object": "voyager2", "info": "voyager2wide"},
 voyager2:{"title": "After the four giant planets.", "kicker": "VOYAGER 2 \u00b7 INTERSTELLAR SPACE", "description": "Explore the spacecraft that visited Uranus and Neptune.", "primary": "Approach the antenna", "next": "voyager2antenna", "focus": [0.5, 0.5], "zoom": 0.8, "object": "voyager2", "info": "voyager2"},
 voyager2antenna:{"title": "Keeping a connection.", "kicker": "VOYAGER 2 \u00b7 HIGH-GAIN ANTENNA", "description": "The broad dish sends observations home and receives commands.", "primary": "Find the Golden Record", "next": "voyager2record", "focus": [0.485, 0.4], "zoom": 1.35, "object": "voyager2", "info": "voyager2antenna"},
 voyager2record:{"title": "A message carried outward.", "kicker": "VOYAGER 2 \u00b7 THE GOLDEN RECORD", "description": "The gold circle marks the record beneath its protective cover.", "primary": "Explore the power source", "next": "voyager2power", "focus": [0.4205, 0.64], "zoom": 2.5, "object": "voyager2", "info": "voyager2record"},
 voyager2power:{"title": "Heat becomes electricity.", "kicker": "VOYAGER 2 \u00b7 POWER SOURCE", "description": "Radioisotope generators supply electricity far from the Sun.", "primary": "Return to Voyager 2", "next": "voyager2", "focus": [0.335, 0.74], "zoom": 1.8, "object": "voyager2", "info": "voyager2power"},
 voyager1wide:{"title": "Another path through the dark.", "kicker": "VOYAGER 1 \u00b7 THE WIDE VIEW", "description": "Voyager 1 travels far from its twin, in another direction.", "primary": "Approach Voyager 1", "next": "voyager1", "focus": [0.5, 0.5], "zoom": 0.3, "object": "voyager1", "info": "voyager1wide"},
 voyager1:{"title": "A long way from home.", "kicker": "VOYAGER 1 \u00b7 INTERSTELLAR SPACE", "description": "Follow the antenna that points back toward Earth.", "primary": "Approach the antenna", "next": "voyager1antenna", "focus": [0.5, 0.5], "zoom": 0.8, "object": "voyager1", "info": "voyager1"},
 voyager1antenna:{"title": "Keeping a connection.", "kicker": "VOYAGER 1 \u00b7 HIGH-GAIN ANTENNA", "description": "The broad dish sends observations home and receives commands.", "primary": "Find the Golden Record", "next": "voyager1record", "focus": [0.485, 0.4], "zoom": 1.35, "object": "voyager1", "info": "voyager1antenna"},
 voyager1record:{"title": "A message carried outward.", "kicker": "VOYAGER 1 \u00b7 THE GOLDEN RECORD", "description": "The gold circle marks the record beneath its protective cover.", "primary": "Explore the power source", "next": "voyager1power", "focus": [0.4205, 0.64], "zoom": 2.5, "object": "voyager1", "info": "voyager1record"},
 voyager1power:{"title": "Heat becomes electricity.", "kicker": "VOYAGER 1 \u00b7 POWER SOURCE", "description": "Radioisotope generators supply electricity far from the Sun.", "primary": "Return to Voyager 1", "next": "voyager1", "focus": [0.335, 0.74], "zoom": 1.8, "object": "voyager1", "info": "voyager1power"},

 kuiper:{"title": "A small world in a vast region.", "kicker": "KUIPER BELT \u00b7 THE WIDE VIEW", "description": "Approach Arrokoth, beyond the planets.", "primary": "Approach Arrokoth", "next": "arrokoth", "focus": [0.5, 0.5], "zoom": 0.3, "object": "arrokoth", "info": "kuiper"},
 arrokoth:{"title": "Two lobes, one ancient world.", "kicker": "KUIPER BELT \u00b7 ARROKOTH", "description": "Follow the pale connection between the two lobes.", "primary": "Approach the neck", "next": "arrokothneck", "focus": [0.5, 0.5], "zoom": 0.84, "object": "arrokoth", "info": "arrokoth"},
 arrokothneck:{"title": "Where two worlds joined.", "kicker": "ARROKOTH \u00b7 THE NECK", "description": "A narrow, brighter strip preserves clues to a gentle merger.", "primary": "Return to Arrokoth", "next": "arrokoth", "focus": [0.513, 0.443], "zoom": 1.9, "object": "arrokoth", "info": "arrokothneck"},
 arrokothcolor:{"title": "Clues in reddish light.", "kicker": "ARROKOTH \u00b7 SURFACE CHEMISTRY", "description": "Explore what reflected light reveals about the surface.", "primary": "Return to Arrokoth", "next": "arrokoth", "focus": [0.49, 0.7], "zoom": 1.45, "object": "arrokoth", "info": "arrokothcolor"},

 plutonian:{"title":"Pluto and Charon.","kicker":"PLUTO · THE NEIGHBORHOOD","description":"Choose a world to approach.","primary":"Approach Pluto","next":"pluto","focus":[0.5,0.5],"zoom":0.4,"object":"pluto","info":"plutonian"},
 pluto:{"title":"A bright heart in the cold.","kicker":"PLUTO · NEW HORIZONS","description":"Follow the pale basin beside the darker terrain.","primary":"Approach Sputnik Planitia","next":"sputnik","focus":[0.5,0.5],"zoom":0.84,"object":"pluto","info":"pluto"},
 sputnik:{"title":"Ice that slowly moves.","kicker":"PLUTO · SPUTNIK PLANITIA","description":"Look across the nitrogen-ice plain and its uneven edge.","primary":"Return to Pluto","next":"pluto","focus":[0.533,0.512],"zoom":2.35,"object":"pluto","info":"sputnik"},
 charon:{"title":"A companion with its own history.","kicker":"PLUTO · CHARON","description":"A reddish pole above gray, fractured terrain.","primary":"Approach the northern pole","next":"charonpole","focus":[0.5,0.5],"zoom":0.84,"object":"charon","stop":"pluto","info":"charon"},
 charonpole:{"title":"A color shared across space.","kicker":"CHARON · THE NORTHERN POLE","description":"Explore the reddish material near the northern limb.","primary":"Return to Charon","next":"charon","focus":[0.5,0.2],"zoom":1.65,"object":"charon","stop":"pluto","info":"charonpole"},
 neptunian:{"title":"Around Neptune.","kicker":"NEPTUNE · THE NEIGHBORHOOD","description":"Approach the planet or its moon Triton.","primary":"Approach Neptune","next":"neptune","focus":[0.5,0.5],"zoom":0.4,"object":"neptune","stop":"neptune","info":"neptunian"},
 neptune:{"title":"A world found by its pull.","kicker":"NEPTUNE · THE ICE GIANT","description":"Explore the atmosphere Voyager 2 saw in 1989.","primary":"Explore the blue light","next":"neptunecolor","focus":[0.5,0.5],"zoom":0.8,"object":"neptune","info":"neptune"},
 neptunecolor:{"title":"The choices behind a color.","kicker":"NEPTUNE · LIGHT AND COLOR","description":"This Voyager composite strengthens the blue and cloud contrast.","primary":"Approach the dark storm","next":"darkspot","focus":[0.46,0.38],"zoom":1.2,"object":"neptune","info":"neptunecolor"},
 darkspot:{"title":"Weather from another time.","kicker":"NEPTUNE · GREAT DARK SPOT","description":"The dark oval belongs to the 1989 encounter.","primary":"Return to Neptune","next":"neptune","focus":[0.526,0.445],"zoom":2.1,"object":"neptune","info":"darkspot"},
 triton:{"title":"A moon moving against the tide.","kicker":"NEPTUNE · TRITON","description":"Explore the pale southern ice and darker terrain.","primary":"Approach the polar ice","next":"tritonice","focus":[0.5,0.5],"zoom":0.83,"object":"triton","stop":"neptune","info":"triton"},
 tritonice:{"title":"Marks across the polar ice.","kicker":"TRITON · SOUTHERN TERRAIN","description":"Dark deposits trace activity across a frozen surface.","primary":"Return to Triton","next":"triton","focus":[0.474,0.66],"zoom":1.8,"object":"triton","stop":"neptune","info":"tritonice"},
 uranian:{"title":"Around Uranus.","kicker":"URANUS · THE NEIGHBORHOOD","description":"Choose the ice giant or its moon Miranda.","primary":"Approach Uranus","next":"uranus","focus":[0.5,0.5],"zoom":0.4,"object":"uranus","stop":"uranus","info":"uranian"},
 uranus:{"title":"A pale blue world.","kicker":"URANUS · THE ICE GIANT","description":"Follow the soft light across its atmosphere.","primary":"Approach the atmosphere","next":"uranusatmosphere","focus":[0.5,0.5],"zoom":0.84,"object":"uranus","info":"uranus"},
 uranusatmosphere:{"title":"Color in the atmosphere.","kicker":"URANUS · METHANE AND HAZE","description":"A quiet-looking face, recorded by Voyager 2.","primary":"Return to Uranus","next":"uranus","focus":[0.38,0.43],"zoom":1.3,"object":"uranus","info":"uranusatmosphere"},
 miranda:{"title":"A patchwork of terrain.","kicker":"URANUS · MIRANDA","description":"Cratered ground meets intricate bands and ridges.","primary":"Explore the ridged terrain","next":"mirandaterrain","focus":[0.5,0.5],"zoom":0.88,"object":"miranda","stop":"uranus","info":"miranda"},
 mirandaterrain:{"title":"Where landscapes meet.","kicker":"MIRANDA · RIDGES AND SCARPS","description":"Follow the angular bands across older ground.","primary":"Return to Miranda","next":"miranda","focus":[0.56,0.38],"zoom":1.8,"object":"miranda","stop":"uranus","info":"mirandaterrain"},
 martian:{title:'Distant Mars.',kicker:'MARS · THE WIDE VIEW',description:'Choose Mars to approach.',primary:'Approach Mars',next:'mars',focus:[.5,.5],zoom:.3,object:'mars',info:'martian'},
 belt:{title:'Ceres and Vesta.',kicker:'CERES & VESTA · THE WIDE VIEW',description:'Choose a world to approach.',primary:'Approach Ceres',next:'ceres',focus:[.5,.5],zoom:.3,object:'ceres',info:'belt'},
 saturnian:{title:'Around Saturn.',kicker:'SATURN · THE NEIGHBORHOOD',description:'Choose Saturn or one of its moons.',primary:'Approach Saturn',next:'saturn',focus:[.5,.5],zoom:.4,object:'saturn',stop:'saturn',info:'saturnian'},
 saturn:{title:'A world within rings.',kicker:'SATURN · IN SUNLIGHT',description:'Trace the bright bands around the planet.',primary:'Approach the rings',next:'rings',focus:[.5,.5],zoom:.62,object:'saturn',info:'saturn'},
 rings:{title:'Countless pieces of ice.',kicker:'SATURN · THE MAIN RINGS',description:'Look along the bright arcs and darker divisions.',primary:'Return to Saturn',next:'saturn',focus:[.25,.66],zoom:1.6,object:'saturn',info:'rings'},
 titan:{title:'A world behind a veil.',kicker:'SATURN · TITAN',description:'An orange haze hides the surface below.',primary:'Follow the hazy edge',next:'titanhaze',focus:[.5,.5],zoom:.86,object:'titan',stop:'saturn',info:'titan'},
 titanhaze:{title:'At the edge of the haze.',kicker:'TITAN · ATMOSPHERE',description:'Sunlight passes through the upper atmosphere.',primary:'Return to Titan',next:'titan',focus:[.4,.3],zoom:1.2,object:'titan',stop:'saturn',info:'titanhaze'},
 enceladus:{title:'A small world of ice.',kicker:'SATURN · ENCELADUS',description:'Cratered ground gives way to fractured terrain.',primary:'Explore the fractures',next:'enceladusice',focus:[.5,.5],zoom:.85,object:'enceladus',stop:'saturn',info:'enceladus'},
 enceladusice:{title:'An intricate frozen surface.',kicker:'ENCELADUS · FRACTURED TERRAIN',description:'Follow the ridges and grooves across the ice.',primary:'Return to Enceladus',next:'enceladus',focus:[.54,.56],zoom:1.45,object:'enceladus',stop:'saturn',info:'enceladusice'},
 jovian:{title:'Around Jupiter.',kicker:'JUPITER · THE NEIGHBORHOOD',description:'A giant planet. Two worlds to explore.',primary:'Approach Jupiter',next:'jupiter',focus:[.5,.5],zoom:.4,object:'jupiter',stop:'jupiter',info:'jovian'},
 io:{title:'A world shaped by heat.',kicker:'JUPITER · IO',description:'Dark volcanic centers mark a colorful surface.',primary:'Look across the surface',next:'iosurface',focus:[.5,.5],zoom:.77,object:'io',stop:'jupiter',info:'io'},
 iosurface:{title:'Traces of a restless interior.',kicker:'IO · VOLCANIC TERRAIN',description:'Follow the patches of dark ground and pale deposits.',primary:'Return to Io',next:'io',focus:[.49,.44],zoom:1.9,object:'io',stop:'jupiter',info:'iosurface'},
 europa:{title:'Ice, crossed by fractures.',kicker:'JUPITER · EUROPA',description:'Follow the long lines across the bright surface.',primary:'Approach the icy terrain',next:'europaice',focus:[.5,.5],zoom:.85,object:'europa',stop:'jupiter',info:'europa'},
 europaice:{title:'Reading the ice.',kicker:'EUROPA · FRACTURED TERRAIN',description:'Ridges and dark lines record a changing crust.',primary:'Return to Europa',next:'europa',focus:[.53,.42],zoom:2.15,object:'europa',stop:'jupiter',info:'europaice'},
 system:{title:'Earth and Moon.',kicker:'EARTH & MOON · THE NEIGHBORHOOD',description:'Choose a world to approach.',primary:'Approach Earth',next:'earth',focus:[.5,.5],zoom:.4,object:'earth',stop:'earth',info:'system'},
 jupiter:{title:'A giant wrapped in clouds.',kicker:'JUPITER · FROM A DISTANCE',description:'Follow the bands into a restless atmosphere.',primary:'Explore the cloud bands',next:'bands',focus:[.5,.5],zoom:.83,object:'jupiter',info:'jupiter'},
 bands:{title:'Winds along the bands.',kicker:'JUPITER · BELTS AND ZONES',description:'Pale zones and darker belts stretch around the planet.',primary:'Approach the Great Red Spot',next:'redspot',focus:[.459,.408],zoom:1.65,object:'jupiter',info:'bands'},
 redspot:{title:'A storm within the clouds.',kicker:'JUPITER · GREAT RED SPOT',description:'Look along the oval and the turbulent clouds beside it.',primary:'Return to Jupiter',next:'jupiter',focus:[.552,.569],zoom:2.8,object:'jupiter',info:'redspot'},
 ceres:{title:'A small world in the belt.',kicker:'ASTEROID BELT · CERES',description:'A cratered surface. A bright trace of salt.',primary:'Approach Occator',next:'occator',focus:[.5,.5],zoom:.76,object:'ceres',info:'ceres'},
 occator:{title:'Salt on a dark surface.',kicker:'CERES · OCCATOR CRATER',description:'The pale deposits catch sunlight against the crater floor.',primary:'Return to the whole Ceres',next:'ceres',focus:[.5,.5],zoom:3.8,object:'ceres',info:'occator'},
 vesta:{title:'Another survivor.',kicker:'ASTEROID BELT · VESTA',description:'An uneven world carrying the marks of enormous impacts.',primary:'View the south pole',next:'southpole',focus:[.5,.5],zoom:.85,object:'vesta',stop:'ceres',info:'vesta'},
 southpole:{title:'The shape of an impact.',kicker:'VESTA · SOUTH POLE',description:'Look across the basin toward its central mountain.',primary:'Return to Vesta',next:'vesta',focus:[.53,.51],zoom:1.03,object:'vestasouth',stop:'ceres',info:'southpole'},
 earth:{title:'A place to begin.',kicker:'EARTH · FROM A DISTANCE',description:'Follow the blue edge. Then look beyond it.',primary:'Approach Earth',next:'near',focus:[.5,.5],zoom:.73,object:'earth',info:'earth'},
 oceans:{title:'A connected ocean.',kicker:'EARTH · OCEANS',description:'Follow the Atlantic between Africa and the Americas.',primary:'Continue to the atmosphere',next:'atmosphere',focus:[.365,.55],zoom:1.5,object:'earth',info:'oceans'},
 near:{title:'Look a little closer.',kicker:'EARTH · NEARER',description:'At the edge of the world, a thin blue line.',primary:'Follow the atmosphere',next:'atmosphere',focus:[.46,.43],zoom:1.13,object:'earth',info:'earth'},
 atmosphere:{title:'A thin blue edge.',kicker:'EARTH · THE ATMOSPHERE',description:'Stay with the curve. Most weather happens far below its outer reaches.',primary:'Return to Earth',next:'earth',focus:[.26,.43],zoom:2.7,object:'earth',info:'atmosphere'},
 moon:{title:'Another kind of surface.',kicker:'THE MOON · NEAR SIDE',description:'Dark plains and pale highlands carry a long history.',primary:'Explore the dark plains',next:'maria',focus:[.5,.5],zoom:.74,object:'moon',info:'moon'},
 farside:{title:'Beyond our view.',kicker:'THE MOON · FAR SIDE',description:'A heavily cratered landscape, with far fewer dark plains.',primary:'Return to the near side',next:'moon',focus:[.5,.5],zoom:.74,object:'farside',stop:'moon',info:'farside'},
 maria:{title:'Where lava once flowed.',kicker:'THE MOON · DARK PLAINS',description:'Look at the boundary between the smooth plains and cratered ground.',primary:'Return to the whole Moon',next:'moon',focus:[.45,.35],zoom:1.65,object:'moon',info:'maria'},
 mars:{title:'A world shaped by fire.',kicker:'MARS · THARSIS',description:'Across rust-colored plains, volcanoes rise and a vast canyon opens.',primary:'Explore Olympus Mons',next:'olympus',focus:[.5,.5],zoom:.75,object:'mars',info:'mars'},
 olympus:{title:'The long slopes of a volcano.',kicker:'MARS · OLYMPUS MONS',description:'Follow the broad shield toward its summit.',primary:'Explore the great canyon',next:'valles',focus:[.34,.29],zoom:1.7,object:'mars',info:'olympus'},
 valles:{title:'A world pulled apart.',kicker:'MARS · VALLES MARINERIS',description:'Trace the canyon system across the surface.',primary:'Return to the whole Mars',next:'mars',focus:[.56,.62],zoom:1.7,object:'mars',info:'valles'}
};

// The short notes, by view id.
const notes={
 venuswide:{"kicker": "VENUS \u00b7 THE WIDE VIEW", "title": "Toward the inner planets.", "text": "Approach a world wrapped in clouds.", "source": "https://science.nasa.gov/venus/facts/"},
 venus:{"kicker": "VENUS \u00b7 MARINER 10", "title": "A world beneath a veil.", "text": "The bright cloud cover hides the rocky ground below.", "source": "https://science.nasa.gov/venus/facts/"},
 venusclouds:{"kicker": "VENUS \u00b7 THE ATMOSPHERE", "title": "Clouds that race around a planet.", "text": "Follow the streaks revealed by this false-color observation.", "source": "https://science.nasa.gov/venus/facts/"},
 venusphases:{"kicker": "VENUS \u00b7 PHASES", "title": "A changing share of sunlight.", "text": "The illuminated fraction changes with our viewing position.", "source": "https://science.nasa.gov/venus/facts/"},
 mercurywide:{"kicker": "MERCURY \u00b7 THE WIDE VIEW", "title": "Close to the Sun.", "text": "Approach the innermost planet.", "source": "https://science.nasa.gov/mercury/facts/"},
 mercury:{"kicker": "MERCURY \u00b7 MESSENGER", "title": "A surface marked by impacts.", "text": "Bright rays cross older, cratered terrain.", "source": "https://science.nasa.gov/mercury/facts/"},
 caloris:{"kicker": "MERCURY \u00b7 CALORIS BASIN", "title": "An impact, followed by lava.", "text": "Look across the broad, pale basin in the northern terrain.", "source": "https://science.nasa.gov/mercury/facts/"},
 mercurypoles:{"kicker": "MERCURY \u00b7 POLAR SHADOWS", "title": "Cold places near the Sun.", "text": "Ice can survive in permanently shaded craters; individual deposits are not resolved here.", "source": "https://science.nasa.gov/mercury/facts/"},
 solar:{"kicker": "THE SUN \u00b7 THE WIDE VIEW", "title": "The star at the center.", "text": "Approach the visible surface of our nearest star.", "source": "https://science.nasa.gov/sun/facts/"},
 sun:{"kicker": "THE SUN \u00b7 THE PHOTOSPHERE", "title": "The light reaches every world here.", "text": "Explore the visible surface, then follow what its light revealed.", "source": "https://science.nasa.gov/sun/facts/"},
 sunspots:{"kicker": "THE SUN \u00b7 SUNSPOTS", "title": "Cooler places on a brilliant surface.", "text": "Magnetic fields concentrate in these dark-looking regions.", "source": "https://science.nasa.gov/sun/facts/"},
 photosphere:{"kicker": "THE SUN \u00b7 THE VISIBLE SURFACE", "title": "Where sunlight escapes.", "text": "The bright face is a layer of gas with no solid ground.", "source": "https://science.nasa.gov/sun/facts/"},

 voyager2wide:{"kicker": "VOYAGER 2 \u00b7 THE WIDE VIEW", "title": "Beyond the solar wind.", "text": "Approach the spacecraft on its outward journey.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager2:{"kicker": "VOYAGER 2 \u00b7 INTERSTELLAR SPACE", "title": "After the four giant planets.", "text": "Explore the spacecraft that visited Uranus and Neptune.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager2antenna:{"kicker": "VOYAGER 2 \u00b7 HIGH-GAIN ANTENNA", "title": "Keeping a connection.", "text": "The broad dish sends observations home and receives commands.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager2record:{"kicker": "VOYAGER 2 \u00b7 THE GOLDEN RECORD", "title": "A message carried outward.", "text": "The gold circle marks the record beneath its protective cover.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager2power:{"kicker": "VOYAGER 2 \u00b7 POWER SOURCE", "title": "Heat becomes electricity.", "text": "Radioisotope generators supply electricity far from the Sun.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager1wide:{"kicker": "VOYAGER 1 \u00b7 THE WIDE VIEW", "title": "Another path through the dark.", "text": "Voyager 1 travels far from its twin, in another direction.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager1:{"kicker": "VOYAGER 1 \u00b7 INTERSTELLAR SPACE", "title": "A long way from home.", "text": "Follow the antenna that points back toward Earth.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager1antenna:{"kicker": "VOYAGER 1 \u00b7 HIGH-GAIN ANTENNA", "title": "Keeping a connection.", "text": "The broad dish sends observations home and receives commands.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager1record:{"kicker": "VOYAGER 1 \u00b7 THE GOLDEN RECORD", "title": "A message carried outward.", "text": "The gold circle marks the record beneath its protective cover.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},
 voyager1power:{"kicker": "VOYAGER 1 \u00b7 POWER SOURCE", "title": "Heat becomes electricity.", "text": "Radioisotope generators supply electricity far from the Sun.", "source": "https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/"},

 kuiper:{"kicker": "KUIPER BELT \u00b7 THE WIDE VIEW", "title": "A small world in a vast region.", "text": "Approach Arrokoth, beyond the planets.", "source": "https://science.nasa.gov/resource/enhanced-color-composite-image-of-kuiper-belt-object-arrokoth-2014-mu69/"},
 arrokoth:{"kicker": "KUIPER BELT \u00b7 ARROKOTH", "title": "Two lobes, one ancient world.", "text": "Follow the pale connection between the two lobes.", "source": "https://science.nasa.gov/resource/enhanced-color-composite-image-of-kuiper-belt-object-arrokoth-2014-mu69/"},
 arrokothneck:{"kicker": "ARROKOTH \u00b7 THE NECK", "title": "Where two worlds joined.", "text": "A narrow, brighter strip preserves clues to a gentle merger.", "source": "https://science.nasa.gov/resource/enhanced-color-composite-image-of-kuiper-belt-object-arrokoth-2014-mu69/"},
 arrokothcolor:{"kicker": "ARROKOTH \u00b7 SURFACE CHEMISTRY", "title": "Clues in reddish light.", "text": "Explore what reflected light reveals about the surface.", "source": "https://science.nasa.gov/resource/enhanced-color-composite-image-of-kuiper-belt-object-arrokoth-2014-mu69/"},

 plutonian:{"kicker":"PLUTO · THE NEIGHBORHOOD","title":"Pluto and Charon.","text":"Choose a world to approach.","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/"},
 pluto:{"kicker":"PLUTO · NEW HORIZONS","title":"A bright heart in the cold.","text":"Follow the pale basin beside the darker terrain.","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/"},
 sputnik:{"kicker":"PLUTO · SPUTNIK PLANITIA","title":"Ice that slowly moves.","text":"Look across the nitrogen-ice plain and its uneven edge.","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/"},
 charon:{"kicker":"PLUTO · CHARON","title":"A companion with its own history.","text":"A reddish pole above gray, fractured terrain.","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/"},
 charonpole:{"kicker":"CHARON · THE NORTHERN POLE","title":"A color shared across space.","text":"Explore the reddish material near the northern limb.","source":"https://science.nasa.gov/dwarf-planets/pluto/facts/"},
 neptunian:{"kicker":"NEPTUNE · THE NEIGHBORHOOD","title":"Around Neptune.","text":"Approach the planet or its moon Triton.","source":"https://science.nasa.gov/neptune/facts/"},
 neptune:{"kicker":"NEPTUNE · THE ICE GIANT","title":"A world found by its pull.","text":"Explore the atmosphere Voyager 2 saw in 1989.","source":"https://science.nasa.gov/neptune/facts/"},
 neptunecolor:{"kicker":"NEPTUNE · LIGHT AND COLOR","title":"The choices behind a color.","text":"This Voyager composite strengthens the blue and cloud contrast.","source":"https://science.nasa.gov/neptune/facts/"},
 darkspot:{"kicker":"NEPTUNE · GREAT DARK SPOT","title":"Weather from another time.","text":"The dark oval belongs to the 1989 encounter.","source":"https://science.nasa.gov/neptune/facts/"},
 triton:{"kicker":"NEPTUNE · TRITON","title":"A moon moving against the tide.","text":"Explore the pale southern ice and darker terrain.","source":"https://science.nasa.gov/neptune/moons/triton/"},
 tritonice:{"kicker":"TRITON · SOUTHERN TERRAIN","title":"Marks across the polar ice.","text":"Dark deposits trace activity across a frozen surface.","source":"https://science.nasa.gov/neptune/moons/triton/"},
 uranian:{"kicker":"URANUS · MIRANDA","title":"A distant planet and a small moon.","text":"Begin with Uranus and Miranda together, then choose a world to approach. These separate Voyager 2 observations share an illustrative scene. Miranda is enlarged for visibility, distances compressed, and positions arranged for exploration. Other moons and Uranus’s faint rings are outside this view.","source":"https://science.nasa.gov/uranus/facts/"},
 uranus:{"kicker":"URANUS","title":"An ice giant tipped on its side.","text":"Uranus rotates with its axis tilted by about 98 degrees relative to its orbital upright. Its atmosphere is mainly hydrogen and helium, with methane contributing to its blue-green appearance. Voyager 2 recorded this view in 1986. The pale disk shows the atmosphere above the planet’s deep interior.","source":"https://science.nasa.gov/uranus/facts/","relatedSource":"https://science.nasa.gov/photojournal/uranus-as-seen-by-nasas-voyager-2/","relatedLabel":"About this Voyager observation ↗"},
 uranusatmosphere:{"kicker":"URANUS · ATMOSPHERE","title":"A subtle appearance in visible light.","text":"Methane absorbs red light, helping give Uranus its blue-green color. Voyager 2 saw a relatively smooth-looking atmosphere in 1986. Later Hubble observations revealed changing clouds and haze. This close view stays within the same Voyager image; its low contrast limits the atmospheric structure we can distinguish.","source":"https://science.nasa.gov/missions/hubble/20-year-hubble-study-of-uranus-yields-new-atmospheric-insights/","relatedSource":"https://science.nasa.gov/photojournal/uranus-as-seen-by-nasas-voyager-2/","relatedLabel":"See the original image ↗"},
 miranda:{"kicker":"URANUS · MIRANDA","title":"A small moon with a complex surface.","text":"Voyager 2 photographed Miranda’s southern hemisphere on January 24, 1986. This mosaic combines nine images. Cratered terrain lies beside younger-looking bands, ridges and scarps. The unusual regions called coronae preserve a history of surface deformation, whose causes are still debated.","source":"https://science.nasa.gov/uranus/moons/miranda/","relatedSource":"https://science.nasa.gov/photojournal/south-polar-view-of-miranda/","relatedLabel":"About this south-polar mosaic ↗"},
 mirandaterrain:{"kicker":"MIRANDA · SURFACE","title":"An angular pattern across the ice.","text":"The bright, angular feature above and right of center lies among complex bands and ridges. These structures contrast with the surrounding cratered ground. The camera approaches the same Voyager mosaic without changing the landscape. Its source frames have different resolutions, so some areas remain softer than others.","source":"https://science.nasa.gov/photojournal/south-polar-view-of-miranda/","relatedSource":"https://science.nasa.gov/uranus/moons/miranda/","relatedLabel":"Read about Miranda’s surface ↗"},
 martian:{kicker:'MARS · THE WIDE VIEW',title:'Begin with the whole world.',text:'Approach Mars to explore the Tharsis region. The surface points open closer views of Olympus Mons and Valles Marineris. Use the travel arrows to continue to another world, or return to the wide view to find your bearings.',source:'https://science.nasa.gov/mars/facts/'},
 belt:{kicker:'CERES & VESTA',title:'Two destinations across a vast region.',text:'Choose Ceres or Vesta to explore its surface. They occupy separate orbits across the asteroid belt. This arrangement combines separate Dawn observations; distances are heavily compressed and positions illustrative.',source:'https://science.nasa.gov/mission/dawn/faq/'},
 saturnian:{kicker:'SATURN · TITAN · ENCELADUS',title:'A neighborhood around the rings.',text:'Begin with Saturn and its rings, then approach Titan or Enceladus. These separate Cassini observations share one illustrative scene. Moon sizes are enlarged for visibility, distances compressed, and positions arranged for exploration. The images were taken on different dates.',source:'https://science.nasa.gov/saturn/facts/'},
 saturn:{kicker:'SATURN',title:'A gas giant under changing light.',text:'Saturn is made mostly of hydrogen and helium. Cassini recorded this natural-color mosaic on April 25, 2016, looking toward the sunlit side of the rings. The planet casts a broad shadow across them. The viewing angle and the seasons change how much of the rings is illuminated.',source:'https://science.nasa.gov/saturn/facts/',relatedSource:'https://science.nasa.gov/resource/saturn-approaching-northern-summer/',relatedLabel:'About this Cassini mosaic ↗'},
 rings:{kicker:'SATURN · RINGS',title:'An enormous system of orbiting particles.',text:'Saturn’s rings contain countless particles, made mainly of water ice with other materials mixed in. Their sizes range from tiny grains to much larger chunks. The Cassini Division separates the A and B rings. This close view reveals structure in the same mosaic; individual particles are too small to resolve here.',source:'https://science.nasa.gov/resource/saturns-rings-2/',relatedSource:'https://science.nasa.gov/resource/saturn-approaching-northern-summer/',relatedLabel:'See the whole mosaic ↗'},
 titan:{kicker:'SATURN · TITAN',title:'An atmosphere that conceals a landscape.',text:'Titan is Saturn’s largest moon. Its dense atmosphere is mainly nitrogen, with methane and other compounds. Hydrocarbon haze hides the surface in this visible-light view. Other observations have revealed lakes and seas of liquid methane and ethane beneath that veil.',source:'https://science.nasa.gov/saturn/moons/titan/facts/',relatedSource:'https://science.nasa.gov/photojournal/cassinis-view-of-titan-natural-color-composite/',relatedLabel:'About this natural-color view ↗'},
 titanhaze:{kicker:'TITAN · ATMOSPHERE',title:'Color carried by a haze.',text:'Hydrocarbon particles give Titan its orange appearance. A faint bluish haze lies around the globe in this Cassini composite from April 16, 2005. Zooming into visible light keeps the surface hidden; infrared observations and radar reveal terrain through the atmosphere.',source:'https://science.nasa.gov/photojournal/cassinis-view-of-titan-natural-color-composite/',relatedSource:'https://science.nasa.gov/saturn/moons/titan/facts/',relatedLabel:'Read about Titan’s atmosphere ↗'},
 enceladus:{kicker:'SATURN · ENCELADUS',title:'An ocean beneath a frozen shell.',text:'Enceladus holds a global ocean beneath its ice. Cassini detected jets of water vapor and icy particles escaping through fractures near the south pole. This visible-light image from October 28, 2015, shows cratered northern terrain and fractured ground farther south. The jets are not visible in this view.',source:'https://science.nasa.gov/mission/cassini/science/enceladus/',relatedSource:'https://science.nasa.gov/photojournal/approaching-enceladus-2/',relatedLabel:'About this Cassini observation ↗'},
 enceladusice:{kicker:'ENCELADUS · FRACTURED TERRAIN',title:'A record of deformation.',text:'Ridges and fractures interrupt the older, cratered terrain. Changes in the icy crust have reshaped parts of Enceladus. The active south-polar region approaches darkness near the bottom of this image. The camera stays on this same observation as it moves closer.',source:'https://science.nasa.gov/photojournal/approaching-enceladus-2/',relatedSource:'https://science.nasa.gov/saturn/moons/enceladus/',relatedLabel:'Read about the icy surface ↗'},
 jovian:{kicker:'JUPITER · IO · EUROPA',title:'Find your bearings.',text:'Choose Jupiter to explore its clouds, Io to visit volcanic terrain, or Europa to follow fractures across the ice. Each stays in the same place as the camera travels. This scene combines separate spacecraft observations; moon sizes are enlarged, distances compressed, and positions illustrative.',source:'https://science.nasa.gov/jupiter/jupiter-facts/'},
 io:{kicker:'JUPITER · IO',title:'Heated by tides.',text:'Io is the most volcanically active world in the Solar System. Jupiter’s gravity, together with the orbital influence of Europa and Ganymede, repeatedly flexes its interior and supplies heat. Galileo recorded this approximately natural-color mosaic on July 3, 1999.',source:'https://science.nasa.gov/jupiter/jupiter-moons/io/facts/',relatedSource:'https://science.nasa.gov/photojournal/global-image-of-io-true-color/',relatedLabel:'About this Galileo mosaic ↗'},
 iosurface:{kicker:'IO · VOLCANIC TERRAIN',title:'A surface continually renewed.',text:'Volcanic activity spreads fresh material across Io. Dark volcanic centers interrupt lighter, colorful deposits. This closer view uses the same Galileo mosaic as the whole-world view, revealing finer detail without changing the terrain.',source:'https://science.nasa.gov/jupiter/jupiter-moons/io/facts/',relatedSource:'https://science.nasa.gov/photojournal/global-image-of-io-true-color/',relatedLabel:'See the original mosaic ↗'},
 europa:{kicker:'JUPITER · EUROPA',title:'An ocean beneath the ice?',text:'Evidence strongly suggests a global saltwater ocean beneath Europa’s icy shell. Galileo’s images show fractures, ridges, and disrupted terrain on the surface. This approximately natural-color view was taken on September 7, 1996; north is at the top.',source:'https://science.nasa.gov/mission/europa-clipper/mission-faq/',relatedSource:'https://science.nasa.gov/photojournal/pj-natural-and-false-color-views-of-europa/',relatedLabel:'About this Galileo mosaic ↗'},
 europaice:{kicker:'EUROPA · FRACTURED TERRAIN',title:'Lines through a frozen crust.',text:'Long cracks and ridges cross Europa’s water-ice surface. Tidal flexing likely helps fracture the shell. Brown and reddish regions contain more non-ice material than the pale areas. The ocean inferred below the ice cannot be seen in this surface mosaic.',source:'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/',relatedSource:'https://science.nasa.gov/photojournal/pj-natural-and-false-color-views-of-europa/',relatedLabel:'Read about the surface colors ↗'},
 system:{kicker:'EARTH & MOON',title:'A place to set out from.',text:'Begin with both worlds in view. Choose Earth to follow its ocean and atmospheric edge, or travel toward the Moon to explore its surface. Pull back at any time to find your bearings. The distance is compressed and the positions are illustrative.',source:'https://science.nasa.gov/moon/facts/'},
 jupiter:{kicker:'JUPITER',title:'The largest planet.',text:'Jupiter is a gas giant with an atmosphere dominated by hydrogen and helium. The visible bands and swirls belong to its clouds. This Hubble image records the planet on June 27, 2019. Its cloud patterns continue to change.',source:'https://science.nasa.gov/jupiter/jupiter-facts/',relatedSource:'https://science.nasa.gov/asset/hubble/jupiter-2019/',relatedLabel:'About this Hubble observation ↗'},
 bands:{kicker:'JUPITER · BELTS AND ZONES',title:'An atmosphere in motion.',text:'The darker bands are called belts; the lighter ones are zones. Powerful east-west winds separate the bands, with neighboring streams often flowing in opposite directions. Look at the wisps and curls where the cloud patterns meet.',source:'https://science.nasa.gov/jupiter/jupiter-facts/'},
 redspot:{kicker:'JUPITER · GREAT RED SPOT',title:'A long-lived anticyclone.',text:'The Great Red Spot is a vast storm in Jupiter’s southern hemisphere. Its winds circulate around a high-pressure region. The oval changes in size and appearance over time. Here, Hubble caught it beside bright, turbulent clouds in 2019.',source:'https://science.nasa.gov/missions/hubble/hubbles-new-portrait-of-jupiter/',relatedSource:'https://science.nasa.gov/asset/hubble/jupiter-2019/',relatedLabel:'See the original mosaic ↗'},
 ceres:{kicker:'ASTEROID BELT · CERES',title:'A dwarf planet between Mars and Jupiter.',text:'Ceres is the largest object in the main asteroid belt. The belt stretches across a vast region, with enormous distances between its members. This Dawn mosaic centers on Occator, where bright deposits stand out against the darker ground.',source:'https://science.nasa.gov/dwarf-planets/ceres/facts/',relatedSource:'https://science.nasa.gov/mission/dawn/faq/',relatedLabel:'About the asteroid belt ↗'},
 occator:{kicker:'CERES · OCCATOR',title:'What the bright patches tell us.',text:'The reflective deposits in Occator contain carbonate salts. Dawn’s measurements identified sodium carbonate as a major component. The patches reflect sunlight and reveal a history involving salty water beneath the surface.',source:'https://science.nasa.gov/photojournal/occator-crater-and-carbonates/'},
 vesta:{kicker:'ASTEROID BELT · VESTA',title:'A world left from the beginning.',text:'Vesta preserves evidence from the early Solar System. Dawn’s mosaic shows an irregular outline and heavily cratered ground. Near the lower edge, the southern terrain records an immense impact. Vesta and Ceres are separate destinations across the asteroid belt; their travel distance is compressed here.',source:'https://science.nasa.gov/solar-system/asteroids/4-vesta/'},
 southpole:{kicker:'VESTA · SOUTH POLE',title:'A mountain within a basin.',text:'A giant impact reshaped Vesta’s south pole, leaving a vast basin and a tall central mountain. This separate Dawn observation looks across the southern terrain from a different direction. Follow the ridges and depressions around the mountain.',source:'https://science.nasa.gov/resource/viewing-the-south-pole-of-vesta/',relatedSource:'https://science.nasa.gov/photojournal/full-view-of-vesta/',relatedLabel:'Compare the whole-world view ↗'},
 oceans:{kicker:'EARTH · OCEANS',title:'Water that carries warmth.',text:'The ocean covers about 71 percent of Earth’s surface. Here, the Atlantic lies between Africa and the Americas. Ocean water absorbs heat from sunlight and currents carry it around the planet, shaping weather and climate far beyond the coast.',source:'https://www.noaa.gov/jetstream/ocean'},
 farside:{kicker:'THE MOON · FAR SIDE',title:'The other face of the Moon.',text:'The Moon turns once on its axis in the time it takes to orbit Earth, keeping roughly the same face toward us. Its far side also has days and nights and receives sunlight. This LRO mosaic shows a heavily cratered surface with far fewer dark volcanic plains. Image credit: NASA/Goddard Space Flight Center/Arizona State University.',source:'https://science.nasa.gov/moon/tidal-locking/',relatedSource:'https://science.nasa.gov/moon/top-moon-questions/'},
 earth:{kicker:'EARTH',title:'A world beneath the clouds.',text:'This view begins above Africa and the Atlantic. The clouds sit close to the surface compared with the size of the planet. Follow the blue limb to see how slender the atmosphere appears from a distance.',source:'https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/'},
 atmosphere:{kicker:'EARTH · ATMOSPHERE',title:'Most weather stays close to home.',text:'The troposphere is the lowest layer of the atmosphere. It contains most clouds and almost all weather. Above it, the air gradually becomes thinner. The blue rim helps us notice the atmosphere, but it does not mark its outer boundary.',source:'https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/'},
 moon:{kicker:'THE MOON',title:'A surface that keeps its history.',text:'The darker areas are broad volcanic plains. The brighter highlands are heavily cratered. With only an extremely thin exosphere and no flowing surface water, the Moon preserves impact scars far longer than Earth usually does.',source:'https://science.nasa.gov/moon/facts/'},
 maria:{kicker:'THE MOON · MARIA',title:'Seas in name.',text:'Early observers called these dark regions maria, the Latin word for seas. They are plains of solidified lava. Their contrast with the brighter highlands helps us read the Moon’s surface even from Earth.',source:'https://science.nasa.gov/moon/facts/'},
 mars:{kicker:'MARS',title:'A landscape of extremes.',text:'Mars is a rocky world with a thin atmosphere. Its Tharsis region contains enormous volcanoes; nearby, Valles Marineris cuts across the landscape. This illustrated view follows a NASA surface reference.',source:'https://science.nasa.gov/mars/facts/'},
 olympus:{kicker:'MARS · OLYMPUS MONS',title:'Built by repeated flows.',text:'Olympus Mons is a shield volcano. Repeated lava flows built its broad, gently sloping form. Collapses at the summit left overlapping calderas. The visible relief here is an illustrated interpretation.',source:'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Lava_flows_on_Olympus_Mons'},
 valles:{kicker:'MARS · VALLES MARINERIS',title:'A fracture on a planetary scale.',text:'Stretching and fracturing of the crust helped form this vast canyon system near the Tharsis region. Landslides later reshaped its walls and floors.',source:'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/The_geology_of_Valles_Marineris'}
};

// Where the journey is, and the detail images fetched on the way.
let current = 'system',
  places = false,
  lastFocus = null,
  detailTimer,
  hasView = false;
const stage = $('stage'),
  info = $('information');
// Registered bounds of the dedicated detail tile in the 1672 x 941 master.
// This covers about 719 master pixels with a 1672-pixel detail image.
const detailBounds = {
  x: 194.75315487512978 / 1672,
  y: 186.5878325292282 / 941,
  w: 0.42979445658405274,
  h: 0.42746676782724674,
};
let detailReady = false,
  detailRequest = null,
  detailView = 0;
function loadDetail() {
  if (detailReady) return Promise.resolve(true);
  if (detailRequest) return detailRequest;
  const image = $('earthDetail');
  detailRequest = new Promise((resolve) => {
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        detailReady = true;
        resolve(true);
      } catch {
        detailRequest = null;
        resolve(false);
      }
    };
    image.onerror = () => {
      detailRequest = null;
      resolve(false);
    };
    image.src = '/pictures/space/images/earth-atmosphere-detail.webp';
  });
  return detailRequest;
}
function positionDetail(c, settled = Promise.resolve(true)) {
  const image = $('earthDetail'),
    r = detailBounds;
  image.style.width = c.iw * r.w + 'px';
  image.style.height = c.ih * r.h + 'px';
  image.style.transform = `translate(${c.tx + c.iw * r.x * c.scale}px,${c.ty + c.ih * r.y * c.scale}px) scale(${c.scale})`;
  const token = ++detailView;
  clearTimeout(detailTimer);
  image.style.opacity = '0';
  if (current === 'near') loadDetail();
  if (current !== 'atmosphere') return;
  Promise.all([loadDetail(), settled]).then(([loaded, arrived]) => {
    if (loaded && arrived && token === detailView && current === 'atmosphere')
      image.style.opacity = '1';
  });
}
function camera(scene) {
  const w = stage.clientWidth,
    h = stage.clientHeight,
    mobile = w < 701;
  const iw = Math.min(w * 1.25, h * 1.75),
    ih = (iw * 9) / 16;
  const scale = scene.zoom * (mobile ? 1.4 : 1);
  const tx = w * (mobile ? 0.5 : 0.57) - iw * scene.focus[0] * scale;
  const ty = h * (mobile ? 0.36 : 0.43) - ih * scene.focus[1] * scale;
  return { iw, ih, scale, tx, ty };
}
let marsReady = false,
  marsRequest = null,
  viewRevision = 0;
function loadMars() {
  if (marsReady) return Promise.resolve(true);
  if (marsRequest) return marsRequest;
  const image = $('marsHigh');
  marsRequest = new Promise((resolve) => {
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        marsReady = true;
        resolve(true);
      } catch {
        marsRequest = null;
        resolve(false);
      }
    };
    image.onerror = () => {
      marsRequest = null;
      resolve(false);
    };
    image.src = '/pictures/space/images/mars-master.webp';
  });
  return marsRequest;
}
let ceresReady = false,
  ceresRequest = null;
function loadCeres() {
  if (ceresReady) return Promise.resolve(true);
  if (ceresRequest) return ceresRequest;
  const image = $('ceresHigh');
  ceresRequest = new Promise((resolve) => {
    image.onload = async () => {
      try {
        await image.decode();
        ceresReady = true;
        resolve(true);
      } catch {
        ceresRequest = null;
        resolve(false);
      }
    };
    image.onerror = () => {
      ceresRequest = null;
      resolve(false);
    };
    image.src = '/pictures/space/images/ceres-detail.webp';
  });
  return ceresRequest;
}
let jupiterReady = false,
  jupiterRequest = null;
function loadJupiter() {
  if (jupiterReady) return Promise.resolve(true);
  if (jupiterRequest) return jupiterRequest;
  const image = $('jupiterHigh');
  jupiterRequest = new Promise((resolve) => {
    image.onload = async () => {
      try {
        await image.decode();
        jupiterReady = true;
        resolve(true);
      } catch {
        jupiterRequest = null;
        resolve(false);
      }
    };
    image.onerror = () => {
      jupiterRequest = null;
      resolve(false);
    };
    image.src = '/pictures/space/images/jupiter-detail-v12.webp';
  });
  return jupiterRequest;
}
// One camera and one navigation contract for every destination.
const localBodies={
 sun:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:430,image:'sunOverview'},
 mercury:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:400,image:'mercuryOverview'},
 venus:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:385,image:'venusOverview'},

 voyager2:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:470,rx:627,ry:470,image:'voyager2Overview'},
 voyager1:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:470,rx:627,ry:470,image:'voyager1Overview'},

 arrokoth:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:433,image:'arrokothOverview'},
 pluto:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:380,image:'plutoOverview'},
 charon:{x:1082,y:-565.25,w:836,h:470.5,cx:1500,cy:-330,radius:180,image:'charonOverview'},
 neptune:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:390,image:'neptuneOverview'},
 triton:{x:1225,y:-554.6875,w:550,h:309.375,cx:1500,cy:-400,radius:140,image:'tritonOverview'},
 uranus:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:360,image:'uranusOverview'},
 miranda:{x:1225,y:-554.6875,w:550,h:309.375,cx:1500,cy:-400,radius:115,image:'mirandaOverview'},
 earth:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:450,image:'earth'},
 moon:{x:1700-836*.273,y:-500-470.5*.273,w:1672*.273,h:941*.273,cx:1700,cy:-500,radius:450*.273,image:'moon'},
 mars:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:450,image:'marsOverview'},
 ceres:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:433,image:'ceresOverview'},
 vesta:{x:1600-459.8,y:-350-258.775,w:919.6,h:517.55,cx:1600,cy:-350,radius:235,image:'vestaImage'},
 jupiter:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:320,image:'jupiterOverview'},
 io:{x:740,y:-478.125,w:420,h:236.25,cx:950,cy:-360,radius:109,image:'ioOverview'},
 europa:{x:1290,y:61.875,w:420,h:236.25,cx:1500,cy:180,radius:109,image:'europaOverview'},
 saturn:{x:-836,y:-470.5,w:1672,h:941,cx:0,cy:0,radius:300,rx:650,ry:315,image:'saturnOverview'},
 titan:{x:980,y:-555,w:480,h:270,cx:1220,cy:-420,radius:90,image:'titanOverview'},
 enceladus:{x:1590,y:104.375,w:340,h:191.25,cx:1760,cy:200,radius:75,image:'enceladusOverview'}
};
const systems={
 solar:{space:'sunSpace',targets:'sunTargets',bodies:['sun'],bounds:[-850,850,-850,850],label:'The Sun'},
 mercurywide:{space:'mercurySpace',targets:'mercuryTargets',bodies:['mercury'],bounds:[-850,850,-850,850],label:'Mercury'},
 venuswide:{space:'venusSpace',targets:'venusTargets',bodies:['venus'],bounds:[-850,850,-850,850],label:'Venus'},

 voyager2wide:{space:'voyager2Space',targets:'voyager2Targets',bodies:['voyager2'],bounds:[-1100,1100,-900,900],label:'Voyager 2'},
 voyager1wide:{space:'voyager1Space',targets:'voyager1Targets',bodies:['voyager1'],bounds:[-1100,1100,-900,900],label:'Voyager 1'},

 kuiper:{space:'kuiperSpace',targets:'kuiperTargets',bodies:['arrokoth'],bounds:[-850,850,-850,850],label:'Kuiper Belt'},
 plutonian:{space:'plutoSpace',targets:'plutoTargets',bodies:['pluto','charon'],bounds:[-500,1900,-650,500],label:'Pluto & Charon'},
 neptunian:{space:'neptuneSpace',targets:'neptuneTargets',bodies:['neptune','triton'],bounds:[-500,1770,-650,500],label:'Neptune'},
 uranian:{space:'uranusSpace',targets:'uranusTargets',bodies:['uranus','miranda'],bounds:[-500,1770,-650,500],label:'Uranus'},
 system:{space:'earthMoonSpace',targets:'systemTargets',bodies:['earth','moon'],bounds:[-500,1870,-680,500],label:'Earth & Moon'},
 martian:{space:'marsSpace',targets:'marsTargets',bodies:['mars'],bounds:[-850,850,-850,850],label:'Mars'},
 belt:{space:'beltSpace',targets:'beltTargets',bodies:['ceres','vesta'],bounds:[-500,1950,-650,500],label:'Asteroid belt'},
 jovian:{space:'jovianSpace',targets:'jovianTargets',bodies:['jupiter','io','europa'],bounds:[-470,1660,-560,480],label:'Jupiter'},
 saturnian:{space:'saturnSpace',targets:'saturnTargets',bodies:['saturn','titan','enceladus'],bounds:[-720,1910,-650,500],label:'Saturn'}
};
// Stable route coordinates shared by every region; this is an illustrative travel layout.
const regionOrigins={solar:[-12000,-400],mercurywide:[-7600,600],venuswide:[-3800,-200],system:[0,0],martian:[3600,250],belt:[7000,-350],jovian:[11100,400],saturnian:[15500,-250],uranian:[20300,250],neptunian:[24500,-450],plutonian:[28900,250],kuiper:[33500,-350],voyager2wide:[39500,3400],voyager1wide:[47500,-5200]};
function regionOrigin(id = current) {
  return regionOrigins[systems[id] ? id : localSystemFor(id)] || [0, 0];
}
const journey=['sun','mercury','venus','earth','moon','mars','ceres','vesta','jupiter','io','europa','saturn','titan','enceladus','uranus','miranda','neptune','triton','pluto','charon','arrokoth','voyager2','voyager1'];
const bodyNames={sun:'The Sun',mercury:'Mercury',venus:'Venus',voyager2:'Voyager 2',voyager1:'Voyager 1',arrokoth:'Arrokoth',pluto:'Pluto',charon:'Charon',neptune:'Neptune',triton:'Triton',uranus:'Uranus',miranda:'Miranda',earth:'Earth',moon:'The Moon',mars:'Mars',ceres:'Ceres',vesta:'Vesta',jupiter:'Jupiter',io:'Io',europa:'Europa',saturn:'Saturn',titan:'Titan',enceladus:'Enceladus'};
const variants = { farside: 'moon', vestasouth: 'vesta' };
function localBodyFor(id) {
  const name = scenes[id]?.object;
  return variants[name] || name;
}
function localSystemFor(id = current) {
  return Object.keys(systems).find((key) => systems[key].bodies.includes(localBodyFor(id))) || null;
}
const localSceneIds = new Set(Object.keys(scenes));
const bodyDetails = Object.fromEntries(
  [
    'io',
    'europa',
    'saturn',
    'titan',
    'enceladus',
    'uranus',
    'miranda',
    'neptune',
    'triton',
    'pluto',
    'charon',
    'arrokoth',
    'voyager2',
    'voyager1',
    'sun',
    'mercury',
    'venus',
  ].map((name) => [name, { ready: false, request: null }]),
);
function loadBodyDetail(name) {
  const state = bodyDetails[name];
  if (state.ready) return Promise.resolve(true);
  if (state.request) return state.request;
  const image = $(name + 'High');
  state.request = new Promise((resolve) => {
    image.onload = async () => {
      try {
        await image.decode();
        state.ready = true;
        resolve(true);
      } catch {
        state.request = null;
        resolve(false);
      }
    };
    image.onerror = () => {
      state.request = null;
      resolve(false);
    };
    image.src =
      (name.startsWith('voyager') ? 'assets/' : '/pictures/space/images/') +
      (name.startsWith('voyager') ? 'voyager' : name) +
      (name.startsWith('voyager')
        ? '-detail-v20.webp'
        : ['europa', 'neptune', 'triton'].includes(name)
          ? '-detail-v12.webp'
          : '-detail.webp');
  });
  return state.request;
}

// The camera: its pose now, the pending request and the history it writes.
let localPose = null,
  localFrame = null,
  localResolve = null,
  localFinish = null;
let navigationRequest = 0,
  pendingDestination = null,
  skipRequest = -1;
let historyCursor = 0;
const historySession = String(Date.now()),
  historyTrail = [];
function portraitTablet(w, h) {
  return w >= 600 && h > w * 1.2;
}
function localAnchor(w = stage.clientWidth, h = stage.clientHeight) {
  const portrait = portraitTablet(w, h);
  return {
    x: w * (portrait || w < 701 ? 0.5 : 0.57),
    y: h * (portrait ? 0.4 : w < 701 ? 0.31 : 0.36),
  };
}
function cameraViewport() {
  const width = stage.clientWidth,
    height = stage.clientHeight;
  return { width, height, anchor: localAnchor(width, height) };
}
function sceneViewport() {
  const w = stage.clientWidth,
    h = stage.clientHeight,
    origin = stage.getBoundingClientRect?.().top || 0;
  const caption = $('caption').getBoundingClientRect?.(),
    tools = $('topTools').getBoundingClientRect?.();
  const top = Math.max(
    110,
    (tools?.bottom || 115) - origin + 20,
    portraitTablet(w, h) ? h * 0.18 : 0,
  );
  const side = w >= 701 && h < 600;
  const left = side ? Math.max(w * 0.46, (caption?.right || w * 0.42) + 28) : w * 0.07;
  const right = Math.min(w * 0.93, w - w * (w < 701 ? 0.06 : 0.032) - 70);
  const bottom = side ? h - 180 : Math.min(h * 0.65, (caption?.top || h - 390) - origin - 50);
  return { left, right, top, bottom: Math.max(top + 60, bottom) };
}
function overviewPose(id = current) {
  const [left, right, top, bottom] = systems[localSystemFor(id)].bounds,
    area = sceneViewport();
  const scale = Math.min(
    (area.right - area.left) / (right - left),
    (area.bottom - area.top) / (bottom - top),
  );
  const anchor = localAnchor(),
    [ox, oy] = regionOrigin(id);
  return {
    x: ox + (left + right) / 2 + (anchor.x - (area.left + area.right) / 2) / scale,
    y: oy + (top + bottom) / 2 + (anchor.y - (area.top + area.bottom) / 2) / scale,
    scale,
  };
}
function localTarget(id) {
  if (systems[id]) return overviewPose(id);
  const s = scenes[id],
    b = localBodies[localBodyFor(id)],
    old = camera(s),
    [ox, oy] = regionOrigin(id);
  return {
    x: ox + b.x + b.w * s.focus[0],
    y: oy + b.y + b.h * s.focus[1],
    scale: (old.iw * old.scale) / b.w,
  };
}
function localImageCamera(id) {
  const b = localBodies[localBodyFor(id)],
    a = localAnchor(),
    p = localPose || localTarget(id),
    [ox, oy] = regionOrigin(id);
  return {
    iw: b.w,
    ih: b.h,
    scale: p.scale,
    tx: a.x + (ox + b.x - p.x) * p.scale,
    ty: a.y + (oy + b.y - p.y) * p.scale,
  };
}
// Turn toward the destination and project every
// region in the same camera, preserving the registered resting views.
function insideFlightEnabled() {
  return new URLSearchParams(location.search).get('flight') !== 'outside';
}
function flightProjection(p, b, origin = [0, 0], view = cameraViewport()) {
  const a = view.anchor,
    angle = Math.hypot(p.look?.x || 0, p.look?.y || 0);
  const dx = origin[0] + b.cx - p.x,
    dy = origin[1] + b.cy - p.y;
  if (angle < 1e-8)
    return { x: a.x + dx * p.scale, y: a.y + dy * p.scale, scale: p.scale, visible: true };
  const ux = p.look.x / angle,
    uy = p.look.y / angle;
  const focal = Math.max(view.width, view.height) * 0.85,
    z = focal / p.scale;
  const along = dx * ux + dy * uy,
    across = -dx * uy + dy * ux;
  const depth = z * Math.cos(angle) + along * Math.sin(angle);
  if (depth <= focal * 0.04) return { x: 0, y: 0, scale: 0, visible: false };
  const scale = focal / depth,
    forward = along * Math.cos(angle) - z * Math.sin(angle);
  const x = a.x + (forward * ux - across * uy) * scale,
    y = a.y + (forward * uy + across * ux) * scale;
  const rx = (b.rx || b.radius) * scale,
    ry = (b.ry || b.radius) * scale;
  return {
    x,
    y,
    scale,
    visible: x + rx > 0 && x - rx < view.width && y + ry > 0 && y - ry < view.height,
  };
}
function paintFlightWorld(name, p, projection, origin, a) {
  const b = localBodies[name];
  const x = (projection.x - a.x) / p.scale - (origin[0] + b.cx - p.x),
    y = (projection.y - a.y) / p.scale - (origin[1] + b.cy - p.y);
  for (const id of [name, ...Object.keys(variants).filter((id) => variants[id] === name)]) {
    const el = $(id);
    el.style.visibility = projection.visible ? '' : 'hidden';
    el.style.transformOrigin = '50% 50%';
    el.style.transform = projection.visible
      ? `translate(${x}px,${y}px) scale(${projection.scale / p.scale})`
      : 'none';
  }
}
function paintLocalCamera(p, controls = true, view = cameraViewport()) {
  // Read the viewport once before any styles change. Re-reading it between
  // worlds forces layout after each target's width/height/position writes.
  localPose = p;
  const a = view.anchor,
    w = view.width,
    h = view.height,
    key = localSystemFor(),
    wide = !!systems[current];
  document.body.classList.toggle('inside-flight', !!p.inside);
  for (const [name, sys] of Object.entries(systems)) {
    const [ox, oy] = regionOrigin(name);
    $(sys.space).style.transform =
      `translate(${a.x + (ox - p.x) * p.scale}px,${a.y + (oy - p.y) * p.scale}px) scale(${p.scale})`;
    // Controls stay still and hidden during travel, then follow the arrival.
    if (controls) {
      $(sys.space).style.opacity = '1';
      $(sys.space).setAttribute('aria-hidden', String(name !== key));
      $(sys.targets).hidden = !wide && name !== key;
    }
    for (const body of sys.bodies) {
      const b = localBodies[body],
        button = $(body + 'Target');
      paintFlightWorld(body, p, flightProjection(p, b, [ox, oy], view), [ox, oy], a);
      if (!controls) continue;
      const bw = Math.max(44, (b.rx || b.radius) * 2 * p.scale),
        bh = Math.max(44, (b.ry || b.radius) * 2 * p.scale);
      const x = a.x + (ox + b.cx - p.x) * p.scale,
        y = a.y + (oy + b.cy - p.y) * p.scale;
      button.style.width = bw + 'px';
      button.style.height = bh + 'px';
      button.style.left = x + 'px';
      button.style.top = y + 'px';
      button.hidden =
        (!wide && name !== key) ||
        x + bw / 2 < 0 ||
        x - bw / 2 > w ||
        y + bh / 2 < 0 ||
        y - bh / 2 > h;
      button.disabled =
        current !== key && body === localBodyFor(current) && !zoomDestinations(current).in;
      button.setAttribute(
        'aria-label',
        current !== key && body === localBodyFor(current)
          ? 'Look closer at ' + bodyNames[body]
          : 'Approach ' + bodyNames[body],
      );
    }
  }
}
function cancelLocalFlight() {
  if (localFrame !== null) cancelAnimationFrame(localFrame);
  localFrame = null;
  localFinish = null;
  if (localResolve) {
    const resolve = localResolve;
    localResolve = null;
    resolve(false);
  }
}
// Each neighboring pair has a stable route, followed in reverse on the return trip.
// Signed curvature bends the camera above/below the chord; pace varies with the journey.
const travelRoutes={
 'sun:mercury':{bend:-.21,pace:1.07},'mercury:venus':{bend:.26,pace:1.02},'venus:earth':{bend:-.25,pace:1.04},
 'earth:moon':{bend:-.18,pace:.92},'moon:mars':{bend:.24,pace:1.08},
 'mars:ceres':{bend:.12,pace:.98},'ceres:vesta':{bend:-.14,pace:.88},
 'vesta:jupiter':{bend:-.28,pace:1.10},'jupiter:io':{bend:.20,pace:.90},
 'io:europa':{bend:-.22,pace:.96},'europa:saturn':{bend:.20,pace:1.12},
 'saturn:titan':{bend:-.23,pace:.96},'titan:enceladus':{bend:.17,pace:.90},
 'enceladus:uranus':{bend:-.16,pace:1.06},'uranus:miranda':{bend:.15,pace:.90},
 'miranda:neptune':{bend:.23,pace:1.09},'neptune:triton':{bend:-.19,pace:.94},
 'triton:pluto':{bend:-.24,pace:1.08},'pluto:charon':{bend:.14,pace:.88},'charon:arrokoth':{bend:.27,pace:1.13},'arrokoth:voyager2':{bend:.31,pace:1.16},'voyager2:voyager1':{bend:-.33,pace:1.2}
};
function travelRoute(fromId, toId) {
  const a = localBodyFor(fromId),
    b = localBodyFor(toId),
    i = journey.indexOf(a),
    j = journey.indexOf(b);
  if (i < 0 || j < 0 || a === b) return { bend: 0, pace: 1 };
  const forward = i < j,
    key = forward ? a + ':' + b : b + ':' + a;
  // Direct selections use a consistent arc derived from the two known endpoints.
  const route = travelRoutes[key] || {
    bend: ((Math.min(i, j) + Math.max(i, j)) % 2 ? 1 : -1) * 0.12,
    pace: 1,
  };
  const establishing = systems[fromId] || systems[toId];
  return { bend: route.bend * (forward ? 1 : -1) * (establishing ? 0.35 : 1), pace: route.pace };
}
// Keep the accepted Earth–Moon rhythm. Other neighborhoods turn more
// gradually; long outward transfers settle on their destination sooner.
function flightRhythm(fromId, toId, route, duration) {
  const a = localBodyFor(fromId),
    b = localBodyFor(toId),
    group = localSystemFor(fromId);
  if ([a, b].some((name) => name?.startsWith('voyager')))
    return { turn: 0.22, drift: route.bend * 0.12, duration: 6800 };
  if (group === localSystemFor(toId)) {
    if (group === 'system') return { turn: 0.3, drift: 0, duration: 5200 };
    if (group === 'saturnian') return { turn: 0.44, drift: route.bend * 0.32, duration: 5900 };
    if (group === 'jovian') return { turn: 0.38, drift: route.bend * 0.28, duration: 5600 };
    return { turn: 0.35, drift: route.bend * 0.26, duration: 5400 };
  }
  return {
    turn: 0.26,
    drift: route.bend * 0.14,
    duration: Math.min(6500, Math.max(5600, duration * 1.35)),
  };
}
function flightProfile(from, to, short = false, fromId = null, toId = null) {
  const route = travelRoute(fromId, toId),
    dx = to.x - from.x,
    dy = to.y - from.y;
  const distance = Math.hypot(dx, dy),
    screenDistance = distance * Math.sqrt(from.scale * to.scale);
  const scaleChange = Math.abs(Math.log(to.scale / from.scale));
  const depth = Math.max(
    0,
    Math.log(
      Math.max(1, (screenDistance * (1 + Math.abs(route.bend))) / (stage.clientWidth * 0.72)),
    ),
  );
  const bend = short ? 0 : route.bend;
  const duration = Math.min(
    short ? 3200 : 5600,
    Math.max(
      short ? 1000 : 1100,
      2.2 *
        (480 + 240 * scaleChange + 270 * Math.log1p(screenDistance / stage.clientWidth)) *
        route.pace,
    ),
  );
  const source = localBodyFor(fromId),
    destination = localBodyFor(toId);
  const alternate = (id) => ['farside', 'southpole'].includes(id);
  const inside = !!(
    insideFlightEnabled() &&
    localBodies[source] &&
    localBodies[destination] &&
    source !== destination &&
    !alternate(fromId) &&
    !alternate(toId)
  );
  const rhythm = flightRhythm(fromId, toId, route, duration);
  return {
    depth: inside || short ? 0 : depth,
    duration: inside ? (short ? 3200 : rhythm.duration) : duration,
    inside,
    turn: rhythm.turn,
    drift: rhythm.drift,
    scaleArrival: inside && source === 'moon' && destination === 'mars' ? rhythm.turn : 1,
    c1: { x: from.x + dx * 0.26 - dy * bend, y: from.y + dy * 0.26 + dx * bend },
    c2: { x: from.x + dx * 0.74 - dy * bend, y: from.y + dy * 0.74 + dx * bend },
  };
}
function flightPose(from, to, profile, t, view = cameraViewport()) {
  const q = t * t * t * (t * (t * 6 - 15) + 10),
    u = 1 - q,
    envelope = Math.sin(Math.PI * q) ** 2;
  // Settle the Moon-to-Mars lens during the turn so the approach cannot
  // grow past the arrival size and then pull back.
  const s = Math.min(1, t / (profile.scaleArrival || 1)),
    scaleQ = s * s * s * (s * (s * 6 - 15) + 10);
  const c1 = profile.c1 || from,
    c2 = profile.c2 || to;
  const pose = {
    x: u * u * u * from.x + 3 * u * u * q * c1.x + 3 * u * q * q * c2.x + q * q * q * to.x,
    y: u * u * u * from.y + 3 * u * u * q * c1.y + 3 * u * q * q * c2.y + q * q * q * to.y,
    scale: Math.exp(
      Math.log(from.scale) +
        (Math.log(to.scale) - Math.log(from.scale)) * scaleQ -
        profile.depth * envelope,
    ),
  };
  const turn = Math.min(1, t / (profile.turn || 0.3)),
    blend = turn * turn * (3 - 2 * turn);
  let look = { x: 0, y: 0 };
  if (profile.inside && t < 1) {
    let dx = to.x - pose.x,
      dy = to.y - pose.y;
    const distance = Math.hypot(dx, dy),
      focal = Math.max(view.width, view.height) * 0.85;
    if (distance > 0) {
      // A small sideways look lets the target enter along an arc and settle
      // at arrival. The offset vanishes at both ends, including short returns.
      const offset = ((profile.drift || 0) * envelope * focal) / pose.scale;
      const ux = dx / distance,
        uy = dy / distance;
      dx -= uy * offset;
      dy += ux * offset;
      const aimDistance = Math.hypot(dx, dy),
        angle = Math.atan2(aimDistance, focal / pose.scale) * blend;
      look = { x: (angle * dx) / aimDistance, y: (angle * dy) / aimDistance };
    }
  }
  // An interrupted flight carries its actual view direction into the next.
  look.x += (from.look?.x || 0) * (1 - blend);
  look.y += (from.look?.y || 0) * (1 - blend);
  if (profile.inside || from.look) {
    pose.look = look;
    pose.inside = t < 1 && (profile.inside || blend < 1);
  }
  return pose;
}
function flyLocal(poses, duration, profile) {
  cancelLocalFlight();
  const target = poses.at(-1);
  if (
    !duration ||
    skipRequest === navigationRequest ||
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !localPose ||
    (Math.abs(target.x - localPose.x) < 0.01 &&
      Math.abs(target.y - localPose.y) < 0.01 &&
      Math.abs(target.scale - localPose.scale) < 0.00001)
  ) {
    paintLocalCamera(target);
    return Promise.resolve(true);
  }
  const from = { ...localPose },
    started = performance.now(),
    curve = profile || flightProfile(from, target);
  return new Promise((resolve) => {
    localResolve = resolve;
    localFinish = () => {
      if (localFrame !== null) cancelAnimationFrame(localFrame);
      localFrame = null;
      localResolve = null;
      localFinish = null;
      paintLocalCamera(target);
      resolve(true);
    };
    function frame(now) {
      const progress = Math.min(1, (now - started) / duration);
      const view = cameraViewport();
      paintLocalCamera(flightPose(from, target, curve, progress, view), false, view);
      if (progress < 1) localFrame = requestAnimationFrame(frame);
      else localFinish();
    }
    localFrame = requestAnimationFrame(frame);
  });
}
function finishTravel() {
  skipRequest = navigationRequest;
  if (localFinish) localFinish();
}
function position(previousId, animate = true, short = false) {
  const key = localSystemFor(),
    group = systems[key],
    sameGroup = localSystemFor(previousId) === key,
    revision = ++viewRevision;
  $('hotspots').replaceChildren();
  for (const [name, b] of Object.entries(localBodies)) {
    const el = $(name);
    el.style.left = b.x + 'px';
    el.style.top = b.y + 'px';
    el.style.width = b.w + 'px';
    el.style.height = b.h + 'px';
    el.style.transform = 'none';
    el.style.opacity = '1';
  }
  for (const [name, body] of Object.entries(variants)) {
    const b = localBodies[body],
      el = $(name),
      active = current === (name === 'farside' ? 'farside' : 'southpole');
    el.style.left = b.x + 'px';
    el.style.top = b.y + 'px';
    el.style.width = b.w + 'px';
    el.style.height = b.h + 'px';
    el.style.transform = 'none';
    el.style.opacity = active ? '1' : '0';
    $(body).style.opacity = active ? '0' : '1';
  }
  paintLocalCamera(localPose || overviewPose());
  const target = localTarget(current),
    profile = flightProfile(localPose, target, short, previousId, current);
  // Inspection within one body never adds an artificial retreat.
  if (sameGroup && localBodyFor(previousId) === localBodyFor(current)) profile.depth = 0;
  const settled = flyLocal([target], animate ? profile.duration : 0, profile);
  positionDetail({ iw: 1672, ih: 941, tx: -836, ty: -470.5, scale: 1 }, settled);
  const loaders = {
    mars: loadMars,
    ceres: loadCeres,
    jupiter: loadJupiter,
    ...Object.fromEntries(
      Object.keys(bodyDetails).map((name) => [name, () => loadBodyDetail(name)]),
    ),
  };
  for (const name of group.bodies) {
    if (!loaders[name]) continue;
    Promise.all([loaders[name](), settled]).then(([loaded, arrived]) => {
      if (loaded && arrived && revision === viewRevision && localBodyFor(current) === name)
        $(name + 'High').style.opacity = '1';
    });
  }
  settled.then((arrived) => {
    if (arrived && revision === viewRevision) drawHotspots();
  });
  return settled;
}

// The controls: the way on and back along the journey, and closer and further.
function routeNeighbors(id) {
  const body = localBodyFor(id),
    index = journey.indexOf(body);
  return {
    previous: journey[index - 1] || null,
    next: systems[id] ? body : journey[index + 1] || null,
  };
}
function updateLocalControls() {
  const id = pendingDestination || current,
    key = localSystemFor(id),
    { previous, next } = routeNeighbors(id);
  $('viewNavigation').hidden = false;
  document.body.classList.add('local-space');
  $('viewNavigation').setAttribute('aria-label', 'Travel between worlds');
  $('viewPrevious').disabled = !previous;
  $('viewNext').disabled = !next;
  $('previousLabel').textContent = previous ? bodyNames[previous] : 'Start';
  $('nextLabel').textContent = next ? bodyNames[next] : 'End of route';
  $('viewPrevious').setAttribute(
    'aria-label',
    previous ? 'Travel to ' + bodyNames[previous] : 'Start of route',
  );
  $('viewNext').setAttribute('aria-label', next ? 'Travel to ' + bodyNames[next] : 'End of route');
  $('pullBack').disabled = id === key;
  $('pullBack').textContent = '↙ Wide view';
  $('pullBack').setAttribute('aria-label', 'Show ' + systems[key].label + ' from a distance');
  $('viewContext').textContent = systems[id]
    ? systems[key].label + ' · Wide view'
    : bodyNames[localBodyFor(id)] + (id === localBodyFor(id) ? ' · Exploring' : ' · Close view');
  $('disclosure').textContent =
    key === 'solar'
      ? 'SDO/HMI visible-light observation, Feb 2011. Display color added by NASA.'
      : key === 'venuswide'
        ? 'Mariner 10 orange/ultraviolet composite, Feb 1974. False color; surface hidden.'
        : key === 'mercurywide'
          ? 'MESSENGER, 14 Jan 2008. False-color mosaic; distances illustrative.'
          : key.startsWith('voyager')
            ? 'Adapted NASA model. Separate directions; distances and positions illustrative.'
            : key === 'kuiper'
              ? 'New Horizons composite. Color enhanced; route and distances illustrative.'
              : key === 'plutonian'
                ? 'New Horizons images. Colors enhanced; distance compressed; positions illustrative.'
                : ['jovian', 'saturnian', 'uranian', 'neptunian'].includes(key)
                  ? 'Separate observations. Moons enlarged; distances and positions illustrative.'
                  : key === 'belt'
                    ? 'Separate spacecraft observations. Distances compressed; positions illustrative.'
                    : key === 'martian'
                      ? 'Illustrated view based on a NASA surface reference.'
                      : 'Illustrated views. Distance compressed; positions are illustrative.';
  $('backButton').disabled = historyCursor < 1;
  const zoom = zoomDestinations(id);
  $('zoomIn').disabled = !zoom.in;
  $('zoomOut').disabled = !zoom.out;
  $('zoomIn').setAttribute(
    'aria-label',
    zoom.in ? 'Look closer: ' + scenes[zoom.in].title : 'Closest view',
  );
  $('zoomOut').setAttribute(
    'aria-label',
    zoom.out ? 'Pull back: ' + scenes[zoom.out].title : 'Widest view',
  );
}
function zoomDestinations(id = current) {
  const body = localBodyFor(id),
    wide = localSystemFor(id),
    next = scenes[id].next;
  return {
    in: systems[id]
      ? body
      : localBodyFor(next) === body && scenes[next].zoom > scenes[id].zoom
        ? next
        : null,
    out: systems[id] ? null : id === body ? wide : body,
  };
}
function zoomStep(direction) {
  const id = pendingDestination || current,
    target = zoomDestinations(id)[direction > 0 ? 'in' : 'out'];
  return target ? go(target) : Promise.resolve(false);
}
function travelStep(direction) {
  const target = routeNeighbors(pendingDestination || current)[direction < 0 ? 'previous' : 'next'];
  return target ? go(target) : Promise.resolve(false);
}
function setTravelState(busy, loading = false) {
  document.body.classList.toggle('camera-moving', busy);
  $('primary').disabled = busy;
  $('travelStatus').hidden = !busy;
  if (busy)
    $('travelMessage').textContent =
      (loading ? 'Loading ' : 'Travelling to ') +
      (systems[pendingDestination]?.label || bodyNames[localBodyFor(pendingDestination)]) +
      '…';
  $('skipTravel').hidden = loading;
}
function writeHistory(id, options) {
  if (options.mode === 'pop') {
    historyCursor = options.index;
    return;
  }
  const state = () => ({ spaceJourney: historySession, index: historyCursor, scene: id });
  if (options.mode === 'replace' || !historyTrail.length) {
    historyTrail[historyCursor] = id;
    window.history.replaceState(state(), '', '#' + id);
  } else if (historyTrail[historyCursor] !== id) {
    historyTrail.splice(historyCursor + 1);
    historyTrail.push(id);
    historyCursor++;
    window.history.pushState(state(), '', '#' + id);
  }
}

// The places to look on each view, placed as shares of its image. Each
// leads to another view (go) or opens a note (note).
const hotspots={
 solar:[],
 mercurywide:[],
 venuswide:[],
 sun:[{"p": [0.533, 0.316], "label": "Sunspots", "go": "sunspots"}, {"p": [0.4, 0.5], "label": "The visible surface", "go": "photosphere"}],
 sunspots:[{"p": [0.533, 0.316], "label": "Magnetic fields", "note": "sunspots"}],
 photosphere:[{"p": [0.4, 0.5], "label": "Light and dark lines", "note": "photosphere"}],
 mercury:[{"p": [0.625, 0.3], "label": "Caloris Basin", "go": "caloris"}, {"p": [0.53, 0.12], "label": "Polar shadows", "go": "mercurypoles"}],
 caloris:[{"p": [0.625, 0.3], "label": "An impact and later lava", "note": "caloris"}],
 mercurypoles:[{"p": [0.53, 0.12], "label": "Evidence for ice", "note": "mercurypoles"}],
 venus:[{"p": [0.44, 0.42], "label": "Cloud cover", "go": "venusclouds"}, {"p": [0.68, 0.48], "label": "Light and phase", "go": "venusphases"}],
 venusclouds:[{"p": [0.44, 0.42], "label": "Atmospheric circulation", "note": "venusclouds"}],
 venusphases:[{"p": [0.68, 0.48], "label": "Galileo\u2019s observations", "note": "venusphases"}],

 voyager2wide:[],
 voyager2:[{"p": [0.485, 0.4], "label": "High-gain antenna", "go": "voyager2antenna"}, {"p": [0.4205, 0.64], "label": "Golden Record", "go": "voyager2record"}, {"p": [0.335, 0.74], "label": "Power source", "go": "voyager2power"}],
 voyager2antenna:[{"p": [0.485, 0.4], "label": "A link with Earth", "note": "voyager2antenna"}],
 voyager2record:[{"p": [0.4205, 0.64], "label": "Sounds and pictures from Earth", "note": "voyager2record"}],
 voyager2power:[{"p": [0.335, 0.74], "label": "Radioisotope generators", "note": "voyager2power"}],
 voyager1wide:[],
 voyager1:[{"p": [0.485, 0.4], "label": "High-gain antenna", "go": "voyager1antenna"}, {"p": [0.4205, 0.64], "label": "Golden Record", "go": "voyager1record"}, {"p": [0.335, 0.74], "label": "Power source", "go": "voyager1power"}],
 voyager1antenna:[{"p": [0.485, 0.4], "label": "A link with Earth", "note": "voyager1antenna"}],
 voyager1record:[{"p": [0.4205, 0.64], "label": "Sounds and pictures from Earth", "note": "voyager1record"}],
 voyager1power:[{"p": [0.335, 0.74], "label": "Radioisotope generators", "note": "voyager1power"}],

 kuiper:[],
 arrokoth:[{p:[.513,.443],label:'The neck',go:'arrokothneck'},{p:[.49,.70],label:'Reddish surface',go:'arrokothcolor'}],
 arrokothneck:[{p:[.513,.443],label:'A gentle merger',note:'arrokothneck'}],
 arrokothcolor:[{p:[.49,.70],label:'Surface chemistry',note:'arrokothcolor'}],
 plutonian:[],
 pluto:[{p:[.533,.512],label:'Sputnik Planitia',go:'sputnik'}],
 sputnik:[{p:[.533,.512],label:'Nitrogen ice',note:'sputnik'}],
 charon:[{p:[.5,.20],label:'Reddish pole',go:'charonpole'}],
 charonpole:[{p:[.5,.20],label:'Material from Pluto?',note:'charonpole'}],
 neptunian:[],
 neptune:[{p:[.526,.445],label:'Great Dark Spot',go:'darkspot'},{p:[.46,.38],label:'Blue-green light',go:'neptunecolor'}],
 neptunecolor:[{p:[.46,.38],label:'Light and color',note:'neptunecolor'}],
 darkspot:[{p:[.526,.445],label:'The 1989 storm',note:'darkspot'}],
 triton:[{p:[.474,.66],label:'Southern ice',go:'tritonice'}],
 tritonice:[{p:[.474,.66],label:'Dark deposits',note:'tritonice'}],
 uranian:[],
 uranus:[{p:[.38,.43],label:'Atmosphere',go:'uranusatmosphere'}],
 uranusatmosphere:[{p:[.38,.43],label:'Methane and haze',note:'uranusatmosphere'}],
 miranda:[{p:[.56,.38],label:'Ridged terrain',go:'mirandaterrain'}],
 mirandaterrain:[{p:[.56,.38],label:'Ridges and scarps',note:'mirandaterrain'}],
 martian:[],
 belt:[],
 saturnian:[],
 saturn:[{p:[.25,.66],label:'The main rings',go:'rings'}],
 rings:[{p:[.25,.66],label:'Orbiting ice',note:'rings'}],
 titan:[{p:[.4,.3],label:'Atmospheric haze',go:'titanhaze'}],
 titanhaze:[{p:[.4,.3],label:'Titan’s haze',note:'titanhaze'}],
 enceladus:[{p:[.54,.56],label:'Fractured terrain',go:'enceladusice'}],
 enceladusice:[{p:[.54,.56],label:'Ridges and fractures',note:'enceladusice'}],
 jovian:[],
 io:[{p:[.49,.44],label:'Volcanic terrain',go:'iosurface'}],
 iosurface:[{p:[.49,.44],label:'A changing surface',note:'iosurface'}],
 europa:[{p:[.53,.42],label:'Fractured ice',go:'europaice'}],
 europaice:[{p:[.53,.42],label:'Reading the ice',note:'europaice'}],
 system:[],
 jupiter:[{p:[.459,.408],label:'Cloud bands',go:'bands'},{p:[.552,.569],label:'Great Red Spot',go:'redspot'}],
 bands:[{p:[.459,.408],label:'Belts and zones',note:'bands'}],
 redspot:[{p:[.552,.569],label:'Great Red Spot',note:'redspot'}],
 ceres:[{p:[.5,.5],label:'Occator Crater',go:'occator'}],
 occator:[{p:[.5,.5],label:'Reflective salts',note:'occator'}],
 vesta:[{p:[.5,.72],label:'Southern terrain',go:'southpole'}],
 southpole:[{p:[.52,.54],label:'The south pole',note:'southpole'}],
 oceans:[{p:[.365,.55],label:'The Atlantic Ocean',note:'oceans'}],
 farside:[{p:[.5,.5],label:'The far side',note:'farside'}],
 earth:[{p:[.5,.5],label:'Approach Earth',go:'near'},{p:[.365,.55],label:'Oceans',go:'oceans'}],
 near:[{p:[.26,.43],label:'Atmosphere',go:'atmosphere'},{p:[.365,.55],label:'Oceans',go:'oceans'}],
 atmosphere:[{p:[.248,.43],label:'The atmosphere',note:'atmosphere'}],
 moon:[{p:[.45,.35],label:'Dark plains',go:'maria'}],
 maria:[{p:[.45,.35],label:'Lava plains',note:'maria'}],
 mars:[{p:[.34,.29],label:'Olympus Mons',go:'olympus'},{p:[.56,.62],label:'Valles Marineris',go:'valles'}],
 olympus:[{p:[.34,.29],label:'Olympus Mons',note:'olympus'}],
 valles:[{p:[.56,.62],label:'Valles Marineris',note:'valles'}]
};
function drawHotspots() {
  $('hotspots').replaceChildren();
  const c = localImageCamera(current);
  for (const spot of hotspots[current]) {
    const b = document.createElement('button');
    b.className = 'hotspot';
    b.setAttribute('aria-label', spot.label);
    b.innerHTML = '<b aria-hidden="true"></b><span>' + spot.label + '</span>';
    b.style.left = c.tx + c.iw * spot.p[0] * c.scale + 'px';
    b.style.top = c.ty + c.ih * spot.p[1] * c.scale + 'px';
    b.onclick = () => (spot.go ? go(spot.go) : openInfo(spot.note));
    $('hotspots').append(b);
  }
}
function closeInfo() {
  info.hidden = true;
  document.body.classList.remove('panel-open');
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
}
function renderScene() {
  const id = current,
    s = scenes[id],
    stop = s.stop || s.object;
  document.body.dataset.scene = id;
  document.body.classList.toggle('wide-view', !!systems[id]);
  $('title').textContent = s.title;
  $('kicker').textContent = s.kicker;
  $('description').textContent = s.description;
  $('primary').innerHTML = s.primary + ' <span aria-hidden="true">↗</span>';
  const credit = {
    sun: 'https://svs.gsfc.nasa.gov/3897/',
    venus: 'https://science.nasa.gov/resource/newly-processed-views-of-venus-from-mariner-10/',
    mercury: 'https://science.nasa.gov/resource/mercurys-subtle-colors/',
    voyager1: 'https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/',
    voyager2: 'https://www.jpl.nasa.gov/images/pia14111-model-of-voyager-artist-concept/',
    arrokoth:
      'https://science.nasa.gov/resource/enhanced-color-composite-image-of-kuiper-belt-object-arrokoth-2014-mu69/',
    pluto: 'https://science.nasa.gov/photojournal/the-rich-color-variations-of-pluto/',
    charon: 'https://science.nasa.gov/photojournal/charon-in-enhanced-color/',
    neptune: 'https://science.nasa.gov/photojournal/neptune-full-disk-view/',
    triton: 'https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/',
    uranus: 'https://science.nasa.gov/photojournal/uranus-as-seen-by-nasas-voyager-2/',
    miranda: 'https://science.nasa.gov/photojournal/south-polar-view-of-miranda/',
    saturn: 'https://science.nasa.gov/resource/saturn-approaching-northern-summer/',
    titan: 'https://science.nasa.gov/photojournal/cassinis-view-of-titan-natural-color-composite/',
    enceladus: 'https://science.nasa.gov/photojournal/approaching-enceladus-2/',
    io: 'https://science.nasa.gov/photojournal/global-image-of-io-true-color/',
    europa: 'https://science.nasa.gov/photojournal/pj-natural-and-false-color-views-of-europa/',
    jupiter: 'https://science.nasa.gov/asset/hubble/jupiter-2019/',
    ceres: 'https://science.nasa.gov/resource/high-resolution-ceres-view/',
    vesta: 'https://science.nasa.gov/photojournal/full-view-of-vesta/',
    vestasouth: 'https://science.nasa.gov/resource/viewing-the-south-pole-of-vesta/',
    farside: 'https://science.nasa.gov/resource/lunar-far-side/',
  }[s.object];
  $('imageCredit').hidden = !credit;
  if (credit) {
    $('imageCredit').href = credit;
    $('imageCredit').textContent =
      s.object === 'sun'
        ? 'SDO/HMI · Feb 2011 · NASA/Goddard SVS · Colorized ↗'
        : s.object === 'venus'
          ? 'Mariner 10 · Feb 1974 · NASA/JPL-Caltech · False color ↗'
          : s.object === 'mercury'
            ? 'MESSENGER · 14 Jan 2008 · NASA/JHUAPL/Carnegie · False color ↗'
            : s.object.startsWith('voyager')
              ? 'Illustration adapted from NASA / JPL-Caltech’s model ↗'
              : s.object === 'arrokoth'
                ? 'New Horizons · 1 Jan 2019 · NASA / JHUAPL / SwRI / R. Tkachenko ↗'
                : ['pluto', 'charon'].includes(s.object)
                  ? 'New Horizons · 14 Jul 2015 · Enhanced color · NASA / JHUAPL / SwRI ↗'
                  : s.object === 'neptune'
                    ? 'Voyager 2 · 1989 · Enhanced color · NASA / JPL ↗'
                    : s.object === 'triton'
                      ? 'Voyager 2 · 1989 · NASA / JPL / USGS ↗'
                      : s.object === 'uranus'
                        ? 'Voyager 2 · 1986 · NASA / JPL-Caltech ↗'
                        : s.object === 'miranda'
                          ? 'Voyager 2 · 24 Jan 1986 · NASA / JPL / USGS ↗'
                          : id === 'saturnian'
                            ? 'Cassini · Separate observations · NASA / JPL / SSI ↗'
                            : s.object === 'saturn'
                              ? 'Cassini · 25 Apr 2016 · NASA / JPL-Caltech / SSI ↗'
                              : s.object === 'titan'
                                ? 'Cassini · 16 Apr 2005 · NASA / JPL / SSI ↗'
                                : s.object === 'enceladus'
                                  ? 'Cassini · 28 Oct 2015 · NASA / JPL-Caltech / SSI ↗'
                                  : s.object === 'io'
                                    ? 'Galileo · 3 Jul 1999 · NASA / JPL / University of Arizona ↗'
                                    : s.object === 'europa'
                                      ? 'Galileo · 7 Sep 1996 · NASA / JPL / DLR ↗'
                                      : id === 'jovian'
                                        ? 'Hubble + Galileo · Separate observations ↗'
                                        : s.object === 'jupiter'
                                          ? 'Hubble · 27 Jun 2019 · NASA / ESA / Simon / Wong ↗'
                                          : s.object === 'farside'
                                            ? 'LRO · NASA / Goddard / ASU ↗'
                                            : 'Dawn · NASA / JPL-Caltech / UCLA / MPS / DLR / IDA ↗';
  }
  const sideTrip =
    s.object === 'sun'
      ? ['Explore the solar atmosphere', 'sun-corona', true]
      : s.object === 'mercury'
        ? ['A long day', 'mercury-day', true]
        : s.object === 'venus'
          ? ['The slow backward spin', 'venus-spin', true]
          : s.object === 'voyager1'
            ? ['Look back at Earth', 'pale-blue-dot', true]
            : s.object === 'voyager2'
              ? ['Beyond the solar wind', 'heliopause', true]
              : id === 'arrokoth' || id === 'arrokothneck'
                ? ['Explore the surface color', 'arrokothcolor']
                : id === 'earth' || id === 'near'
                  ? ['Oceans', 'oceans']
                  : id === 'moon' || id === 'maria'
                    ? ['Explore the far side', 'farside']
                    : null;
  $('excursion').hidden = !sideTrip;
  if (sideTrip) {
    $('excursion').textContent = sideTrip[0] + ' ↗';
    $('excursion').onclick = () => (sideTrip[2] ? openInfo(sideTrip[1]) : go(sideTrip[1]));
  }
  document.querySelectorAll('[data-stop]').forEach((b) => {
    if (b.dataset.stop === stop) {
      b.setAttribute('aria-current', 'step');
      const nav = $('journeyStops');
      nav.scrollTo({
        left: Math.max(0, b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    } else b.removeAttribute('aria-current');
  });
  $('count').textContent =
    String(Object.keys(stopViews).indexOf(stop) + 1).padStart(2, '0') +
    ' / ' +
    Object.keys(stopViews).length;
  updateLocalControls();
}

// Every change of view comes through here.
async function go(id, options = {}) {
  if (!scenes[id]) return false;
  if (typeof options === 'boolean') options = { mode: options ? 'push' : 'replace' };
  if (hasView && id === current && !pendingDestination && !options.force) return true;
  const request = ++navigationRequest;
  cancelLocalFlight();
  viewRevision++;
  detailView++;
  $('hotspots').replaceChildren();
  pendingDestination = id;
  closeInfo();
  updateLocalControls();
  setTravelState(true, true);
  if (options.instant) skipRequest = request;
  try {
    const images = systems[localSystemFor(id)].bodies.map((name) => localBodies[name].image);
    if (id === 'farside') images.push('farSideImage');
    if (id === 'southpole') images.push('vestaSouthImage');
    await Promise.all(images.map((name) => $(name).decode()));
  } catch {
    if (request === navigationRequest) {
      pendingDestination = null;
      setTravelState(false);
      updateLocalControls();
      if (hasView) position(current, false);
      $('description').textContent = 'This view could not load. Please try again.';
      if (options.mode === 'pop')
        window.history.replaceState(
          { spaceJourney: historySession, index: historyCursor, scene: current },
          '',
          '#' + current,
        );
    }
    return false;
  }
  if (request !== navigationRequest) return false;
  setTravelState(true);
  const previousId = hasView ? current : null;
  current = id;
  hasView = true;
  writeHistory(id, options);
  renderScene();
  const arrived = await position(previousId, !options.instant, options.mode === 'pop');
  if (!arrived || request !== navigationRequest) return false;
  pendingDestination = null;
  setTravelState(false);
  updateLocalControls();
  return true;
}

// The information panel: which full field note each view opens, and the Sun's
// observations shown beside its notes.
const fieldNoteFor={voyager2wide:"heliopause",voyager1wide:"voyager-distance",voyager2:"voyager-2",voyager2antenna:"voyager-antenna",voyager2record:"golden-record",voyager2power:"voyager-power",voyager1:"voyager-1",voyager1antenna:"voyager-antenna",voyager1record:"golden-record",voyager1power:"voyager-power",kuiper:'kuiper-belt',arrokothneck:'arrokoth-neck',arrokothcolor:'arrokoth-color',plutonian:'pluto',sputnik:'sputnik-planitia',charonpole:'charon-pole',neptunian:'neptune',neptunecolor:'neptune-color',darkspot:'dark-spot',tritonice:'triton-streaks',system:'earth',martian:'mars',belt:'asteroid-belt',jovian:'jupiter',saturnian:'saturn',uranian:'uranus',near:'earth',bands:'cloud-bands',redspot:'red-spot',rings:'saturn-rings',titanhaze:'titan',enceladusice:'enceladus',iosurface:'io',europaice:'europa',uranusatmosphere:'uranus',mirandaterrain:'miranda'};
const solarObservations={"sun-prominence": {"src": "/pictures/space/images/sun-prominence.webp", "alt": "SDO extreme-ultraviolet observation showing a prominence erupting from the solar limb.", "caption": "A separate observation: 23 September 2012 \u00b7 SDO/AIA 304 \u00c5 \u00b7 Display color added. NASA/Goddard SVS, SDO Science Team and Virtual Solar Observatory."}, "sun-corona": {"src": "/pictures/space/images/sun-corona.webp", "alt": "SDO extreme-ultraviolet image of the corona, with bright active regions and loops around the solar disk.", "caption": "A separate SDO/AIA observation at 171 \u00c5 \u00b7 Display color added. This wavelength reveals coronal plasma. NASA/SDO."}};
function openInfo(key) {
  if (info.hidden) lastFocus = document.activeElement;
  const original = fieldNotes[fieldNoteFor[key] || key],
    n = original || notes[key];
  $('paleBlueFigure').hidden = key !== 'pale-blue-dot';
  setPaleBlueZoom(false);
  const noteKey = fieldNoteFor[key] || key;
  const solarNote = noteKey === 'sun' || noteKey.startsWith('sun-');
  $('sunTopics').hidden = !solarNote;
  const observation = solarObservations[noteKey];
  $('solarFigure').hidden = !observation;
  if (observation) {
    $('solarObservation').src = observation.src;
    $('solarObservation').alt = observation.alt;
    $('solarObservationCaption').textContent = observation.caption;
  }
  $('infoKicker').textContent = n.kicker;
  $('infoTitle').textContent = n.title;
  $('infoText').replaceChildren();
  $('infoSources').replaceChildren();
  for (const paragraph of n.body || [n.text]) {
    const p = document.createElement('p');
    p.textContent = paragraph.replace(/([^\s\u2060])—/g, '$1\u2060—');
    $('infoText').append(p);
  }
  const links = original
    ? n.sources
    : [
        { url: n.source, label: 'Read the source' },
        ...(n.relatedSource
          ? [{ url: n.relatedSource, label: n.relatedLabel || 'About this view' }]
          : []),
      ];
  for (const link of links) {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.label + ' ↗';
    a.target = '_blank';
    a.rel = 'noopener';
    $('infoSources').append(a);
  }
  $('source').hidden = true;
  $('relatedSource').hidden = true;
  $('notePicker').value = original ? fieldNoteFor[key] || key : '';
  info.hidden = false;
  info.scrollTop = 0;
  document.body.classList.add('panel-open');
  $('closeInfo').focus({ preventScroll: true });
}
for (const [id, key] of Object.entries({
  sunStory: 'sun-story',
  sunSurface: 'sun-photosphere',
  sunSpotNote: 'sun-sunspots',
  sunProminence: 'sun-prominence',
  sunCorona: 'sun-corona',
}))
  $(id).onclick = () => openInfo(key);
function setPaleBlueZoom(enlarged) {
  $('paleBlueZoom').setAttribute('aria-pressed', String(enlarged));
  $('paleBlueImage').style.transform = enlarged ? 'scale(2.5)' : 'scale(1)';
  $('paleBlueZoom').setAttribute(
    'aria-label',
    enlarged ? 'Show the whole Pale Blue Dot photograph' : 'Enlarge the area around Earth',
  );
  $('paleBlueHint').textContent = enlarged
    ? 'Tap to see the whole photograph.'
    : 'Tap the photograph to look closer at Earth.';
}
$('paleBlueZoom').onclick = () =>
  setPaleBlueZoom($('paleBlueImage').style.transform !== 'scale(2.5)');
const emptyNote = document.createElement('option');
emptyNote.value = '';
emptyNote.textContent = 'Explore another subject';
$('notePicker').append(emptyNote);
for (const [key, n] of Object.entries(fieldNotes)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = n.label + ' · ' + n.kicker;
  $('notePicker').append(option);
}
$('notePicker').onchange = () => {
  if ($('notePicker').value) openInfo($('notePicker').value);
};
$('primary').onclick = () => go(scenes[current].next);
$('readButton').onclick = () => openInfo(scenes[current].info);
$('closeInfo').onclick = closeInfo;
$('backButton').onclick = () => {
  if (historyCursor > 0) {
    ++navigationRequest;
    pendingDestination = null;
    cancelLocalFlight();
    setTravelState(false);
    window.history.back();
  }
};
$('viewPrevious').onclick = () => travelStep(-1);
$('viewNext').onclick = () => travelStep(1);
$('pullBack').onclick = () => go(localSystemFor(pendingDestination || current));
$('skipTravel').onclick = finishTravel;
$('zoomIn').onclick = () => zoomStep(1);
$('zoomOut').onclick = () => zoomStep(-1);

// The journey's stops (#journeyStops), and the view each one opens.
const stopViews={sun:'solar',mercury:'mercurywide',venus:'venuswide',earth:'system',moon:'moon',mars:'martian',ceres:'belt',jupiter:'jovian',saturn:'saturnian',uranus:'uranian',neptune:'neptunian',pluto:'plutonian',arrokoth:'kuiper',voyager2:'voyager2wide',voyager1:'voyager1wide'};
document
  .querySelectorAll('[data-stop]')
  .forEach((b) => (b.onclick = () => go(stopViews[b.dataset.stop])));
function showPlaces(show) {
  places = show;
  document.body.classList.toggle('show-places', places);
  $('placesButton').setAttribute('aria-pressed', String(places));
  $('placesButton').textContent = places ? 'Hide places' : 'Show places';
  try {
    if (show) localStorage.setItem('olae-places', 'shown');
    else localStorage.removeItem('olae-places');
  } catch {}
}
$('placesButton').onclick = () => showPlaces(!places);
try {
  showPlaces(
    new URLSearchParams(location.search).get('places') === 'shown' ||
      localStorage.getItem('olae-places') === 'shown',
  );
} catch {}
const route = $('routeDialog');
$('routeButton').onclick = () => {
  route.showModal();
  $('routeButton').setAttribute('aria-expanded', 'true');
};
$('closeRoute').onclick = () => route.close();
route.addEventListener('close', () => {
  $('routeButton').setAttribute('aria-expanded', 'false');
  $('routeButton').focus();
});
document.querySelectorAll('[data-route]').forEach(
  (b) =>
    (b.onclick = () => {
      route.close();
      go(b.dataset.route);
    }),
);

// Full screen, the keyboard, resizing, Back and Forward, and the start.
function reframe() {
  finishTravel();
  if (hasView) position(current, false);
}
$('fullscreenButton').hidden = !document.fullscreenEnabled;
$('fullscreenButton').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('experience').requestFullscreen();
  } catch {}
};
document.addEventListener('fullscreenchange', () => {
  $('fullscreenButton').setAttribute(
    'aria-label',
    document.fullscreenElement ? 'Exit full screen' : 'Enter full screen',
  );
  reframe();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !info.hidden) {
    closeInfo();
    return;
  }
  if (
    !info.hidden ||
    route.open ||
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) ||
    e.target?.isContentEditable
  )
    return;
  if (e.key === '+' || e.key === '=' || e.key === '-') {
    e.preventDefault();
    zoomStep(e.key === '-' ? -1 : 1);
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    travelStep(e.key === 'ArrowLeft' ? -1 : 1);
  }
});
window.addEventListener('resize', reframe);
if (typeof ResizeObserver !== 'undefined')
  new ResizeObserver(() => {
    if (hasView && systems[current] && !pendingDestination) position(current, false);
  }).observe($('caption'));
document.fonts?.ready.then(() => {
  if (hasView && !pendingDestination) reframe();
});
window.addEventListener('popstate', (event) => {
  const state = event.state,
    id = sceneFromHash();
  const index = state?.spaceJourney === historySession ? state.index : 0;
  go(id, { mode: 'pop', index, force: true });
});
for (const name of Object.keys(localBodies))
  $(name + 'Target').onclick = () =>
    !systems[current] && localBodyFor(current) === name ? zoomStep(1) : go(name);
const legacyScenes={'vicinity':'system','asteroid-belt':'belt','kuiper-belt':'kuiper','voyager-2':'voyager2','deep-space':'voyager1wide','voyager-1':'voyager1'};
function sceneFromHash() {
  const raw = location.hash.slice(1),
    id = raw.replace(/^scene-/, '');
  return scenes[raw] ? raw : legacyScenes[id] || (scenes[id] ? id : 'system');
}
const initialNavigation = go(sceneFromHash(), { mode: 'replace' });

initialNavigation.then(() => {
  const key = new URLSearchParams(location.search).get('note');
  if (key && fieldNotes[key]) openInfo(key);
});
