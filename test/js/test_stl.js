goog.require('DVT.mesh');



test = function() {

  // create a new test_renderer
  test_renderer = new DVT.renderer3D();
  test_renderer.init();
  
  // load a .stl file
  var surface1 = new DVT.mesh();
  surface1.file = 'data/example.stl';
  surface1.color = [1, 0, 0];
  
  var surface2 = new DVT.mesh();
  surface2.file = 'data/cube.stl';
  surface2.color = [1, 0, 0];	  
  
  // add the object
  test_renderer.add(surface1);
  // .. and render it
  test_renderer.render();
  
  console.log('you there mate?')
 
};