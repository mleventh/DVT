/**
 * Created by shusa_000 on 6/29/2015.
 */

goog.provide('DVT.parserTRK');

// requires
goog.require('DVT.parser');

goog.require('THREE');



/**
 * Create a parser for the binary .TRK format.
 *
 * @constructor
 * @extends DVT.parser
 */
DVT.parserTRK = function() {

    //
    // call the standard constructor of DVT.base
    goog.base(this);

};
// inherit from DVT.parser
goog.inherits(DVT.parserTRK, DVT.parser);


/**
 * @inheritDoc
 */
DVT.parserTRK.prototype.parse = function(object, data, loader) {//console.count('parserTRK.parse');


    this._data = data;

    // parse the header of the .TRK file
    // Documented here: http://trackvis.org/docs/?subsect=fileformat
    var header = {

        'id_string': this.scan('uchar', 6),
        'dim': this.scan('ushort', 3),
        'voxel_size': this.scan('float', 3),
        'origin': this.scan('float', 3),
        'n_scalars': this.scan('ushort'),
        'scalar_name': this.scan('uchar', 200),
        'n_properties': this.scan('ushort'),
        'property_name': this.scan('uchar', 200),
        'vox_to_ras': this.scan('float', 16),
        'reserved': this.scan('uchar', 444),
        'voxel_order': this.scan('uchar', 4),
        'pad2': this.scan('uchar', 4),
        'image_orientation_patient': this.scan('float', 6),
        'pad1': this.scan('uchar', 2),
        'invert_x': this.scan('uchar'),
        'invert_y': this.scan('uchar'),
        'invert_z': this.scan('uchar'),
        'swap_xy': this.scan('uchar'),
        'swap_yz': this.scan('uchar'),
        'swap_zx': this.scan('uchar'),
        'n_count': this.scan('uint'),
        'version': this.scan('uint'),
        'hdr_size': this.scan('uint')
    };

    //
    // parse the data

    // if n_count not provided, we parse the data until end of points
    var numberOfFibers = (header.n_count === 0) ? Infinity : header.n_count;
    var numberOfScalars = header.n_scalars;

    var m = new THREE.Matrix4()
    var min={x: Infinity, y: Infinity, z:Infinity}
    var max={x: -Infinity, y: -Infinity, z: -Infinity}
    m.set(header.vox_to_ras[0],header.vox_to_ras[1],header.vox_to_ras[2],header.vox_to_ras[3],header.vox_to_ras[4],header.vox_to_ras[5],header.vox_to_ras[6],header.vox_to_ras[7],header.vox_to_ras[8],header.vox_to_ras[9],header.vox_to_ras[10],header.vox_to_ras[11],header.vox_to_ras[12],header.vox_to_ras[13],header.vox_to_ras[14],header.vox_to_ras[15]);

    // loop through all fibers
    var fibers = new THREE.Object3D();
    var lineMaterial = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});

    var _numPoints = this.scan('uint', (this._data.byteLength - 1000) / 4);
    this.jumpTo(header.hdr_size);
    var _points = this.scan('float', (this._data.byteLength - 1000) / 4);

    var offset = 0;

    // keep track of the number of all points along all tracks
    var _totalPoints = 0;

    var i;
    var updateCheck = 0;
    if(numberOfFibers === Infinity) {
        updateCheck = 100000;
    }
    else {
        updateCheck = Math.ceil(numberOfFibers / 100);
    }

    for (i = 0; i < numberOfFibers; i++) {
        if(i%updateCheck === 0)
        {
            loader.updateParse(i/numberOfFibers);
        }
        // if undefined, it means we have parsed all the data
        // (useful if n_count not defined or === 0)
        if(typeof(_numPoints[offset]) === 'undefined'){
            numberOfFibers = i;
            break;
        }

        var numPoints = _numPoints[offset];


        // console.log(numPoints, offset);


        var currentPoints = new THREE.Geometry()

        var length = 0.0;

        // loop through the points of this fiber
        for ( var j = 0; j < numPoints; j++) {

            // read coordinates
            var x = _points[offset + j * 3 + j * numberOfScalars + 1];
            var y = _points[offset + j * 3 + j * numberOfScalars + 2];
            var z = _points[offset + j * 3 + j * numberOfScalars + 3];

            // console.log(x, y, z);

            // read scalars
            // var scalars = this.scan('float', header.n_scalars);

            // Convert coordinates to world space by dividing by spacing
            x = x / header.voxel_size[0];
            y = y / header.voxel_size[1] + 0;
            z = -z / header.voxel_size[2]+00;
            var vector=new THREE.Vector3( x,  y, z )
            vector.applyProjection(m)
            vector.x-=0
            vector.y-=0
            vector.x*=1
            vector.y*=1
            if(vector.x<min.x)
                min.x=vector.x
            if(vector.x>max.x)
                max.x=vector.x
            if(vector.y<min.y)
                min.y=vector.y
            if(vector.y>max.y)
                max.y=vector.y
            if(vector.z<min.z)
                min.z=vector.z
            if(vector.z>max.z)
                max.z=vector.z
            currentPoints.vertices.push(vector );

            // fiber length
            if (j > 0) {

                // if not the first point, calculate length
                var oldPoint = currentPoints.vertices[j - 1];
                var displacement=[Math.abs(vector.x - oldPoint.x), Math.abs(vector.y - oldPoint.y), Math.abs( vector.z- oldPoint.z)]
                curLength=Math.sqrt(displacement[0]*displacement[0] +
                    displacement[1]*displacement[1] + displacement[2]*displacement[2]);
                length += curLength

                //adds in vertex color values
                if(j==1)
                    currentPoints.colors.push( new THREE.Color( displacement[0]/curLength, displacement[1]/curLength, displacement[2]/curLength ))

                currentPoints.colors.push( new THREE.Color( displacement[0]/curLength, displacement[1]/curLength, displacement[2]/curLength ))
            }

            // increase the number of points if this is not the last track
            if (j < numPoints - 1) {
                _totalPoints += 6;
            }             	

        }
        currentPoints.computeBoundingBox();
        currentPoints.computeFaceNormals();
        currentPoints.computeVertexNormals();
        offset += numPoints * 3 + numPoints * numberOfScalars + 1;


        // read additional properties
        // var properties = this.scan('float', header.n_properties);

        // append this track to our fibers list
        var curLine = new THREE.Line(currentPoints, lineMaterial);
        fibers.add(curLine);
        
        function generateSprite() {
        	
        	var canvas = document.createElement('canvas');
        	canvas.width = 1127;
        	canvas.height = 594;
        	
        	var context = canvas.getContext('2d');
        	var gradient = context.createRadialGradient(
        		canvas.width/2, canvas.height/2,
        		0,
        		canvas.width/2, canvas.height/2,
        		canvas.width/2);
        	
        	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        	gradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
        	gradient.addColorStop(0.4, 'rgba(0, 0, 64, 1)');
        	gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        	
        	context.fillStyle = gradient;
        	context.fillRect(0, 0, canvas.width, canvas.height);
        	
        	var texture = new THREE.Texture(canvas);
        	texture.needsUpdate = true;
        	return texture;
        }       	      	
        	
        function createParticleSystem(fibers){
        	
        	var material = new THREE.PointCloudMaterial({
        		color: 0xffffff,
        		size: 3,
        		transparent: true,
        		blending: THREE.AdditiveBlending,
        		map: generateSprite()
        	})
        	
        	var system = new THREE.PointCloud(fibers, material);
        	system.sortParticles = true;
        	return system;
        	
        }        
        
        var particles = createParticleSystem(fibers);
        particles.sortParticles = true;
        particles.dynamic = true;


        //update function for each particle animation
        particles.update = function(){
            
        	var particle = fibers.vertices[i];
            var path = particle.path;
            particle.lerpN += 0.05;
            if(particle.lerpN > 1){
              particle.lerpN = 0;
              particle.moveIndex = particle.nextIndex;
              particle.nextIndex++;
              if( particle.nextIndex >= path.length ){
                particle.moveIndex = 0;
                particle.nextIndex = 1;
              }

            var currentPoint = path[particle.moveIndex];
            var nextPoint = path[particle.nextIndex];


            particle.copy( currentPoint );
            particle.lerp( nextPoint, particle.lerpN );
          }
          fibers.verticesNeedUpdate = true;
        };

    } // end of loop through all tracks

    // move tracks to RAS space (note: we switch from row-major to column-major by transposing)
    //DVT.matriDVT.transpose(header.vox_to_ras, object._transform._matrix);

    // the object should be set up here, so let's fire a modified event
    object.THREEContainer=fibers;
    object._loaded = true;
    object._locked = false;
    object.dispatchEvent({type: 'PROCESSED', target: object});

};


// export symbols (required for advanced compilation)
goog.exportSymbol('DVT.parserTRK', DVT.parserTRK);
goog.exportSymbol('DVT.parserTRK.prototype.parse', DVT.parserTRK.prototype.parse);