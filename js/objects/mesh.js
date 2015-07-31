// provides
goog.provide('DVT.mesh');

// requires
goog.require('DVT.loaded');


/**
 * Create a mesh. Meshes are displayable objects and can be loaded from a file.
 * 
 * @constructor
 * @extends DVT.object
 */
DVT.mesh = function() {

  //
  // call the standard constructor of X.object
  goog.base(this);
  
  //
  // class attributes
  
  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'mesh';

}

// inherit from DVT.object
goog.inherits(DVT.mesh, DVT.object);

// export symbols (required for advanced compilation)
goog.exportSymbol('DVT.mesh', DVT.mesh);