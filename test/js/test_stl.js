test = function() {

  // create a new test_renderer
  test_renderer = new DVT.renderer3D();
  test_renderer.init();
  
  // load a .vtk file
  var surface = new DVT.mesh();
  surface.file = 'data/cube.stl';
  surface.color = [1, 0, 0];
  
  // add the object
  test_renderer.add(surface);
  
  // .. and render it
  test_renderer.render();
  
};