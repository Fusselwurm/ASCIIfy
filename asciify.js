Array.prototype.sum = function (offset, interval) {
	var j = 0;
	for(var offset = 0; offset < this.length; offset += interval) {
		j += this[offset];
	}
	return j;
};




ASCIIFY = (function () {

	var cellDim, emptyBox, gridSize;

	var step = 0;
	var weight = 1;
	var imgcache = {};

	var starttime;
	var logfile = [];
	var debug = false;
// 	var chars = [' ', '.', '2', 'a', 'M', '€'];
	var chars = [];
	for (var i = 32; i < 127; i++) {
		// exclude chars which extend beyond font size TODO fix so thats not  necessary an more
// 		if ("_/[()]{}|,;@&ygjpq$Q".indexOf(String.fromCharCode(i)) == -1) {
			chars.push(String.fromCharCode(i));
// 		}
	}

	var result = [];

	function serializeMatrix(m) {
		var r = '';
		for (var i = 0; i < m.length; i++) {
			for (var j = 0; j < m[i].length; j++) {
				r += m[i][j];
			}
			r += '\n';
		}
		return r;
	}

	/**
	* images have to have the same dimensions!
	* @param a img
	* @param b img
	* @param walpha consider alpha when calculating difference
	*/
	function imgDiff(a, b, walpha, bfactor) {
		bfactor = bfactor || 1;
		var adata = a.data;
		var bdata = b.data;
		var i, wa, wb, d = 0;
		for (i = 0; i < adata.length; i += 4) {

			wa = wb = 1;
			if (walpha) {
				wa = (adata[i + 3] / 255);
				wb = (bdata[i + 3] / 255);
			}
			d += (adata[i] + adata[i + 1] + adata[i + 2]) * wa / bfactor -
				(bdata[i] + bdata[i + 1] + bdata[i + 2]) * wb;
		}
		return d;
	}

	function log(msg) {
		if ((typeof console !== 'undefined') && console && console.log) {
			console.log(msg)
		} else {
			logfile.push(msg);
		}
	}

	return {
		//dbg
		serializeMatrix: serializeMatrix,
		imgDiff: imgDiff,
		getResult: function () {
			return result;
		},
		setWeight: function (w) {
			if ((typeof w !== 'number' || (w === NaN))) {
				throw 'weight has to be numeric';
			}
			weight = w;
		},
		setDebug: function (dbg) {
			if (typeof dbg !== 'boolean') {
				throw 'debug has to be boolean';
			}
			debug = dbg;
		},
		getLog: function () {
			return logfile;
		},
		setGridSize: function (x, y) {
			gridSize = {
				x: x,
				y: y
			};
			result = [];
			var line;
			for (var i = 0; i < y; i++) {
				line = [];
				for (var j = 0; j < x; j++) {
					line.push(' ');
				}
				result.push(line);
			}
		},
		setCellDimensions: function (width, height) {
			cellDim = {
				width: width,
				height: height
			};
			emptyBox = ctx.createImageData(width, height);
			for (var i = 0; i < emptyBox.data.length; i++) {
				emptyBox.data[i] = 255;
			}

		},
		cell: function (x, y) {

			var posX = cellDim.width * x;
			var posY = cellDim.height * y;
			var m = 999999999, n, charidx;

			// get the image part we want to find a char for
			var sourceImg = ctx.getImageData(posX, posY, cellDim.width, cellDim.height);
			var checksum = sourceImg.data.sum(0, 4);
			if (debug) {
				dbg.putImageData(sourceImg, posX, (posY + 1) + cellDim.height);
			}
			if (typeof imgcache[checksum] == 'undefined') {

				for (var i = 0; i < chars.length; i++) {
					wkx.putImageData(emptyBox, 0, 0);
					wkx.fillText(chars[i], 0, cellDim.height);
					txtImg = wkx.getImageData(0, 0, cellDim.width, cellDim.height);


					n = imgDiff(sourceImg, txtImg, false, weight);
					if (Math.abs(n) < m) {
						if (debug) {
							log(" looks like it's " + chars[i] + " now");
						}
						m = Math.abs(n);
						charidx = i;
					}


				}
				imgcache[checksum] = charidx;
			} else {
				charidx = imgcache[checksum];
			}
			result[y][x] = chars[charidx];
			if (typeof ASCIIFY.onProgress == 'function') {
				ASCIIFY.onProgress(serializeMatrix(result));
			}
			if (debug) {
				ctx.fillText(chars[charidx], posX, posY + cellDim.height);
			}
		},
		go: function () {
			if (step === -1) {
				step = 0;
				setGridSize(gridSize.x, gridSize.y); // TODO
				starttime = null;
			}
			starttime = starttime || (new Date()).getTime();
			ASCIIFY.cell(step % gridSize.x, Math.floor(step / gridSize.x));
			step += 1;
			if (step < (gridSize.x * gridSize.y)) {
				setTimeout(ASCIIFY.go, 1);
			} else {
				console.log('RENDERING FINISHED IN : ' + (new Date().getTime() - starttime));
				if (typeof ASCIIFY.onFinish == 'function') {
					ASCIIFY.onFinish(serializeMatrix(result));
				}
				step = 0;
// 				ASCIIFY.getClean();
			}
		},
		getClean: function () {
			var img = ctx.getImageData(0, 0, 450, 450);
			var data = img.data
			for (var i = 0; i < data.length; i += 4) {
				if (data[i + 1] > 0) { // if green
					data[i] = data[i + 1] = data[i + 2] = 0;
				} else { // if not green, set white
					data[i] = data[i + 1] = data[i + 2] = 255;
				}
			}
			ctx.putImageData(img, 0, 0);
		}
	};
}());
