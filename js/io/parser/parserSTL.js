// provides
goog.provide('DVT.parserSTL');

// requires
goog.require('DVT.parser');
goog.require('DVT.object');
goog.require('THREE');
goog.require('DVT.loader');

/**
 * Create a parser for the .STL format. ASCII or binary format is supported.
 * 
 * @constructor
 * @extends DVT.parser
 */
DVT.parserSTL = function() {

  //
  // call the standard constructor of DVT.base
  goog.base(this);
  
  //
  // class attributes
  
  /**
   * @inheritDoc
   * @const
   */
  this._classname = 'parserSTL';
  
};
// inherit from DVT.parser
goog.inherits(DVT.parserSTL, DVT.parser);


/**
 * @inheritDoc
 */

DVT.parserSTL.prototype.parse = function(object, data, loader) {
  
  this._data = data;
  this.loader = loader; 
  surface = new THREE.Object3D();
  
  var p = object._points;
  var n = object._normals;
  
  // parse 5 bytes
  var _ascii_tag = this.parseChars(this.scan('uchar', 5));
  // check if this is an ascii STL file or a binary one
  
  if (_ascii_tag == 'solid') {
    
    // allocate memory using a good guess
    object._points = p = new THREE.Geometry();
    object._normals = n = new THREE.Geometry();
       
    p.vertices.push(
    	new THREE.Vector3(data.byteLength, 0, 0)
    	
    );
        
    n.vertices.push(  
    	new THREE.Vector3(data.byteLength, 0, 0)   	
    );
       
    var i;
    var updateCheck = 0;
    if(data.byteLength === Infinity) {
        updateCheck = 100000;
    }
    else {
        updateCheck = Math.ceil(data.byteLength / 100);
    }

    for (i = 0; i < data.byteLength; i++) {
        if(i%updateCheck === 0)
        {
            loader.updateParse(i/data.byteLength);
        }
    }
    // this is an ascii STL file
    this.parseASCII(p, n, this.scan('uchar', data.byteLength - 5), loader);
    
  } else {	  
	  
    // this is a binary STL file
    // (http://en.wikipedia.org/wiki/STL_(file_format))
    
    // A binary STL file has an 80 character header (which is generally
    // ignored, but which should never begin with 'solid' because that will
    // lead most software to assume that this is an ASCII STL file).
    //
    // but we ignore it
    this.jumpTo(80);
    
    var _triangleCount = this.scan('uint');
    
    // allocate the exact amount of memory
    object._points = p = new THREE.Geometry();
    object._normals = n = new THREE.Geometry();
    
    p.vertices.push(
        	new THREE.Vector3(_triangleCount * 9, 0, 0)
        	
        );
            
        n.vertices.push(
        	new THREE.Vector3(_triangleCount * 9, 0, 0)	
        );  

    // parse the bytes
    this.parseBIN(p, n, _triangleCount, loader);
    
    var i;
    var updateCheck = 0;
    if(_triangleCount === Infinity) {
        updateCheck = 100000;
    }
    else {
        updateCheck = Math.ceil(_triangleCount / 100);
    }

    for (i = 0; i < _triangleCount; i++) {
        if(i%updateCheck === 0)
        {
            loader.updateParse(i/_triangleCount);
        }
    }
  }
  
  // the object should be set up here, so let's fire a modified event
  object.THREEContainer = surface;
  object._loaded = true;
  object._locked = false;  
  object.dispatchEvent({type: 'PROCESSED', target: object});

};


/**
 * Parses ASCII .STL data and modifies the given containers.
 * 
 * @param {THREEGeometry} p The object's points as a container.
 * @param {THREEGeometry} n The object's normals as a container.
 * @param {!Uint8Array} data The data to parse.
 * @protected
 */
DVT.parserSTL.prototype.parseASCII = function(p, n, data, loader) {
  
  var _length = data.length;
 
  //
  // the mode flags
  
  // TRUE if the next couple of bytes are normals
  var _normalsMode = false;
  
  // TRUE if the next couple of bytes are vertices
  var _vertexMode = false;
  
  // store the beginning of a byte range
  var _rangeStart = 0;
  
  var i;
  for (i = 0; i < _length; i++) {
    
    if (data[i] == 10) {    	
      
      // the current byte is a line break
      
      if (_normalsMode || _vertexMode) {

        
        // grab the bytes which contain the numbers
        var _substring = this.parseChars(data, _rangeStart, i);
        
        // split the substring
        var _numbers = _substring.split(' ');
        
        // grab the x, y, z coordinates
        var x = parseFloat(_numbers[0]);
        var y = parseFloat(_numbers[1]);
        var z = parseFloat(_numbers[2]);
        
        if (_normalsMode) {
          // add the normals 3x (for each vertex)
          n.vertices.push(
        		  new THREE.Vector3(x, y, z),
        		  new THREE.Vector3(x, y, z),
        		  new THREE.Vector3(x, y, z)
        		  );
        } else {
          // add the vertices
          p.vertices.push(new THREE.Vector3(x, y, z));
        }
              
        
        // reset the modes
        _normalsMode = false;
        _vertexMode = false;
        
      }
      
    } else if (data[i - 1] == 32) {
      
      // the one byte before was a space
      
      if (data[i] == 102) {
        
        // this is a facet since the current char f
        
        // move pointer to the normals
        i += 13;
        _rangeStart = i;
        _normalsMode = true;
        
      } else if (data[i] == 118) {
        
        // this is a vertex since the current char v
        
        // move pointer to the coordinates
        i += 7;
        _rangeStart = i;
        _vertexMode = true;
        
      }
      
    }
    
  }
  
};


/**
 * Parses BINARY .STL data and modifies the given containers
 * 
 * 
 */
DVT.parserSTL.prototype.parseBIN = function(p, n, triangleCount, loader) {
	
  this._loader = loader;	
  
  var i = 0;
  for (i = 0; i < triangleCount; i++) {
    
    // grab 12 float values
    var _bytes = this.scan('float', 12);
    
    // the first 3 are the normals
    var _normalX = _bytes[0];
    var _normalY = _bytes[1];
    var _normalZ = _bytes[2];
    
    // add them
    n.vertices.push(
    		new THREE.Vector3(_normalX, _normalY, _normalZ),
    		new THREE.Vector3(_normalX, _normalY, _normalZ),
    		new THREE.Vector3(_normalX, _normalY, _normalZ)
    		)		
    
    // now the vertices
    p.vertices.push(
    		new THREE.Vector3(_bytes[3], _bytes[4], _bytes[5]),
    		new THREE.Vector3(_bytes[6], _bytes[7], _bytes[8]),
    		new THREE.Vector3(_bytes[9], _bytes[10], _bytes[11])
    		)
    
    // jump 2 bytes
    this._dataPointer += 2;
    
  }

};

// export symbols (required for advanced compilation)
goog.exportSymbol('DVT.parserSTL', DVT.parserSTL);
goog.exportSymbol('DVT.parserSTL.prototype.parse', DVT.parserSTL.prototype.parse);