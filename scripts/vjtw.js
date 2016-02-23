/* Queuing process */
var queue = function() {
	this.queueTasks = [];
}
queue.prototype.taskConst = function(fn, args) {
	return { f: fn, fArgs: args }
}

queue.prototype.push = function(task) {
	this.queueTasks.push(task);
}

queue.prototype.pushTasks = function(tasks) {
	for ( var i in tasks ) {
		this.queueTasks.push(tasks[i]);
	}
}

queue.prototype.shift = function() {
	return this.queueTasks.shift()
}
queue.prototype.queuing = function(complete) {

	var self = this,
		task = 
			(self.queueTasks !== []) ?
				self.shift() : null;

	// A p which is returned from a task object with promise 
	var p = (task) ? task.f.apply(this, task.fArgs): null;
		
	if (p) {
		// The p.then won't run util the state truns to be resolved.
		p.then(function() {
			self.queuing(complete);
		});
	} else {
		if (complete) {
			complete();
		}
	}
}

var colorClass = function() {

	this.bar = {
		'本年執行人數': '#BA0F30',
		'本年入監人數': '#C41F3A',
		'新入監人數': '#61B045',
		'上年底留監人數': '#E9C247',
		'本年出獄人數': '#F16B23',
		'本年年底留監人數': '#55B5DF'
	},
	this.line = {
		'本年執行人數': '#BA0F30',
		'本年入監人數': '#C41F3A',
		'新入監人數': '#61B045',
		'上年底留監人數': '#E9C247',
		'本年出獄人數': '#F16B23',
		'本年年底留監人數': '#55B5DF'
	},
	this.rings = [
		{
			name: '新入監前家庭狀況',
			value: {
				'不詳': '#6B96AD',
				'貧困無以為生': '#669FCC',
				'免足維持生活': '#5FA4D4',
				'小康之家': '#58ABD8',
				'中產之上': '#55B5DF'
			}
		},
		{
			name: '新入監犯罪次數與種類',
			value: {
				'累犯': '#F16B23',
				'再犯': '#F27422',
				'初犯': '#ED8222'
			}
		},
		{
			name: '新入監前教育程度',
			value: {
				'大專以上': '#61B045',
				'高中職': '#6EBE44',
				'國中': '#78C14A',
				'國小': '#87C66A',
				'自修': '#8CBC71',
				'不識字': '#8AB276',
				'不詳': '#8AA679'
			}
		},
		{
			name: '歷年新入監年齡歷年統計',
			value: {
				'14 ~ 18': '#A885A4',
				'18 ~ 20': '#AA77A2',
				'20 ~ 24': '#B26DA5',
				'24 ~ 30': '#B765A5',
				'30 ~ 40': '#B9529E',
				'40 ~ 50': '#B5479A',
				'50 ~ 60': '#AD3C96',
				'60 ~ 70': '#A93393',
				'70 ~ 80': '#A42D91',
				'80 ~': '#9F238E'
			}
		}
	]
}

colorClass.prototype.hexToRgb = function(hex) {
	
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);     
	return result ? {         
			r: parseInt(result[1], 16),         
			g: parseInt(result[2], 16),         
			b: parseInt(result[3], 16)     
		   } : null; 
}

var colorObj = new colorClass();


/* Graph is the mother of the charts */
var graphClass = function() {
	
	// A place for drawing
	this.pad = null;

	// Define the basic setting for the pad
	this.padHeight = null;
	this.padWidth = null;
	this.padPadding = null;
}

graphClass.prototype.initializeAPad = function() {

	this.pad = (function() {

		return d3.select('#DISPLAY_PANEL')
			.append('svg')
			.attr('id', 'SKETCHPAD')
			.style({
				'padding-top':    '5%',
				'padding-left':   '5%',
				'padding-right':  '5%',
				'padding-bottom': '5%'
			})
			.style('height', '100%').style('width', '100%')
			})();

	this.padWidth = 
		parseInt(this.pad.style('width').replace('px', '')),

	this.padHeight = 
		parseInt(this.pad.style('height').replace('px', '')),

	this.padPadding = {
		top:     this.pad.style('padding-top').replace('px', ''),
		bottom:  this.pad.style('padding-bottom').replace('px', ''),
		left:    this.pad.style('padding-left').replace('px', ''),
		right:   this.pad.style('padding-right').replace('px', '')
	}
	return this
}

graphClass.prototype.readCSV = function(path) {
	return d3.csv(path)
}

/* A class for Bar chart */
var barGraphClass = function() {

	graphClass.call(this);

	this.chartHeight = null;
		
	this.chartWidth = null;
		
	this.bars = null;
	this.barWidth = null;

	this.outPadding = null;

	this.step = null;

	this.xScale = null;
	this.xAxis = null;

	this.yScale = null;
	this.yAxis = null;

}


/* Inherit the barGraphClass from the graph */
barGraphClass.prototype = Object.create(graphClass.prototype);
barGraphClass.prototype.constructor = barGraphClass;

barGraphClass.prototype.setChartSize = function() {
	this.chartHeight = this.padHeight - this.padPadding.top - this.padPadding.bottom;
	this.chartWidth = this.padWidth - this.padPadding.left - this.padPadding.right	;
	return this
}

barGraphClass.prototype.setOutPadding = function(val) { 
	this.outPadding = val; 
	return this
}

barGraphClass.prototype.setStep = function(val) { 
	this.step = val; 
	return this
}

barGraphClass.prototype._setBarWidth = function(dataset) {
	this.barWidth = 
		parseInt((this.chartWidth-this.outPadding-this.step*dataset.length) / dataset.length);
}

barGraphClass.prototype._setOrdinalXScale = function(dataset, xLabel) {
	this.xScale = d3.scale.ordinal()
		.domain(
			dataset.map(
				function(d){ return xLabel? d[xLabel]: d }))
		.rangeBands([0, this.chartWidth]);
}

barGraphClass.prototype._setXAxis = function(pos) {

	if ( typeof pos === 'string' && 
		pos === 'right' || 'left' || 'bottom' || 'top' ) {

		this.xAxis = d3.svg.axis()
			.scale(this.xScale).orient(pos);		
	} 
}

barGraphClass.prototype._setLinearYScale = function(dataset, dOption) {

	this.yScale = d3.scale.linear()
		.domain(
			[0, d3.max(
					dataset, 
					function(d) { return dOption? parseInt(d[dOption]): d})
			])
		.rangeRound([this.chartHeight, 0]);

}

barGraphClass.prototype._setYAxis = function(pos, tickFormater) {

	if ( typeof pos === 'string' && 
		pos === 'right' || 'left' || 'bottom' || 'top' ) {

		this.yAxis = d3.svg.axis()
			.scale(this.yScale).orient(pos).tickFormat(tickFormater).ticks(10);

	} 
}

barGraphClass.prototype._createXAxis = function(dataset, xLabel) {

	var self = this;
	
	this.pad
		.append('g')
			.attr('class', 'x-axis')
			.attr('transform', 'translate(0,' + this.chartHeight + ')')
			.call(this.xAxis)
			.call(c_pinLbl2XAxisBarMidPt, this.barWidth, this.step, this.outPadding)
		.append('text')
			.attr('class', 'axis-name')
			.attr('x', function() {
				return dataset.length*(self.barWidth+self.step)+self.outPadding-40
			})
			.attr('y', '40')
		.text(xLabel);
}

barGraphClass.prototype._createYAxis = function(dataset, yLabel) {
	this.pad
		.append('g')
			.attr('class', 'y-axis')
			.call(this.yAxis)
		.append('text')
			.attr('class', 'axis-name')
			.attr('transform', 'rotate(90) translate(0, -10)')
			.text(yLabel);
}

barGraphClass.prototype._createBars = function(dataset, dOption, barColor) {

	var self = this;

	this.bars = 
		this.pad.append('g')
			.attr('class', 'bar-group')
			.selectAll('rect')
			.data(dataset)
			.enter()
			.append('rect')
				.attr('class', 'bar')
				.attr('x', function(d, i) {
					return self.outPadding + 
						i * (self.barWidth + self.step)
				})
				.attr('y', function(d) {
					return self.yScale(d[dOption])
				})
				.attr('width', self.barWidth)
				.attr('height', function(d) {
					return self.chartHeight - self.yScale(parseInt(d[dOption]))
				})
				.attr('fill', function(d) {
					return colorObj.bar[dOption]
				});
}


/* 
The bar information is the combined information of other sub elements
Stack bars display the users about what the bars are composed of.
*/
barGraphClass.prototype._makeStackBars = function() {



}

barGraphClass.prototype._markValOnBar = function(dataset, dOption) {

	var self = this;

	this.pad.append('g')
		.attr('id', 'TXTGROUP')
		.selectAll('text')
		.data(dataset)
		.enter()
		.append('text')
			.text(function(d) {
				return dOption ? d[dOption]: d
			})
			.attr('class', 'mark')
			.attr('x', function(d, i) {
				return self.outPadding + i*(self.barWidth+self.step)
			})
			.attr('y', function(d) {
				return dOption? 
					self.yScale(d[dOption]) : self.yScale(d)
			})
			.call(c_placeValOnBarHdV, 10, this.barWidth, this.step, this.outPadding);
}

barGraphClass.prototype.drawingData = function(path, xLabel, yLabel, dOption) {

	var self = this;

	var p = new Promise(function(resolve, reject) {

		self.readCSV(path)
			.row(function(d) { return d })
			.get(function(errors, rows) {

				self._setBarWidth(rows);
	
				// Set the scale
				self._setOrdinalXScale(rows, xLabel);
				self._setLinearYScale(rows, dOption);

				// Set the axes
				self._setYAxis('left', kTick);
				self._setXAxis('bottom');

				// Draw the axes
				self._createXAxis(rows, xLabel);
				self._createYAxis(rows, yLabel);

				self._createBars(rows, dOption);
				self._markValOnBar(rows, dOption);

				resolve({
					data: rows,
					pad: self.pad,
					step: self.step,
					barWidth: self.barWidth,
					outPadding: self.outPadding
				});

			});
	});

	return p
}

barGraphClass.prototype.update = function(path, xLabel, yLabel, dOption) {

	var self = this;

	var p = new Promise(function(resolve, reject) {

		self.readCSV(path)
			.row(function(d) { return d })
			.get(function(error, rows) {

				var _bars = self.pad.selectAll('rect'),
					_txts = self.pad.selectAll('.mark'),

					// Former x value of bars
					f_Pos = (function() {
						var posAry = [];
						for ( var i = 0; i < _bars[0].length; i++ ) {
							posAry.push({
							x: _bars[0][i].getAttribute('x'),
							y: _bars[0][i].getAttribute('y')
						});
					};
					return posAry
				})(),

				// The positions of bars after update
				c_Pos = [];

				self._setLinearYScale(rows, dOption);
				self._setYAxis('left', kTick);

				_bars
					.transition()
						.attr('y', function(d, i) { 

							// get current positions of 
							c_Pos.push(
								{
									x: this.getAttribute('x'),
									y: self.yScale(d[dOption])
								}
							);
						return c_Pos[i].y })
						.attr('height', 
							function(d) { 
								return self.chartHeight - self.yScale(parseInt(d[dOption])) 
						})
						.attr('fill', function() {
							return colorObj.bar[dOption]
						})
					.each(
						'end', 
						function(d, i) {

							// When the last bar is transited, resolve to the next animation.
							if ( i === _bars[0].length - 1) {

								resolve({
									data: rows,
									pad: self.pad,
									step: self.step,
									barWidth: self.barWidth,
									outPadding: self.outPadding
								});

							}
					});

				_txts
					.transition()
					// The text has been rotated about 90 degree
					.attr('x', function(d, i) {
						var deltaX = c_Pos[i]['y'] - f_Pos[i]['y'];
						return parseInt(this.getAttribute('x')) + deltaX })
					.text(function(d) { return d[dOption] });

				// Update Y axis
				self.pad
					.selectAll('.y-axis')
					.call(self.yAxis);
			});

		});
	
	return p
}


barGraphClass.prototype.isInvisible = function() {
	if ( this.bars.style('opacity') ) return true
	else false
}

barGraphClass.prototype.bePhantom = function() {

	this.bars.style('opacity', 0);

	if ( this.isBarHidden() ) 
		this.beDisplayed();
}

barGraphClass.prototype.beVisible = function() {

	this.bars.style('opacity', 1);

	if ( this.isBarHidden() ) 
		this.beDisplayed();
}

barGraphClass.prototype.hide = function() {
	this.bars.style('display', 'none');
}

barGraphClass.prototype.beDisplayed = function() {
	this.bars.style('display', 'inline');
}

barGraphClass.prototype.isBarHidden = function() {

	var displayStatus = 
			this.bars.style('display');

	if ( displayStatus === 'none') return true
	else return false
}

/* Make the x line for the grids */
barGraphClass.prototype._makeXGridLines = function() {

	return d3.svg.axis(this.xScale).orient('bottom')

}
barGraphClass.prototype._makeYGridLines = function() {

	return d3.svg.axis(this.yScale).orient('left')

}

/* Bar chart's grid*/
barGraphClass.prototype.makeGrid = function() {

	this.pad.append('g')
		.attr('class', 'grid')
		.attr('transform', '')
	this.pad.append('g')
		.attr('class', 'grid')
		.attr('transform', '')

}

/* A Line chart class */
var lineGraphClass = function() {

	graphClass.call(this);

	this.pad = null;
	this.padPadding = null;
	this.padHeight = 0;
	this.padWidth = 0;

	this.chartHeight = null;
	this.chartWidth = null;

	this.linePath = null;
	this.lineDots = null;
	this.areaUnderLine = null;

	this.xScale = null;
	this.xAxis = null;

	this.yScale = null;
	this.yAxis = null;

	this.area = null;

}

/* Inherit the lineGraphClass from the graph */
lineGraphClass.prototype = Object.create(graphClass.prototype);
lineGraphClass.prototype.constructor = lineGraphClass;

lineGraphClass.prototype.setChartSize = function(motherPad) {
	/*
		motherPad = { pad: '', padWidth: '', padHeight: '', padPadding: '' }
	*/
	this.chartHeight = motherPad ? 
		motherPad.padHeight - 
			motherPad.padPadding.top - motherPad.padPadding.bottom :
		this.padHeight - 
			this.padPadding.top - this.padPadding.bottom;

	this.chartWidth = motherPad ? 
		motherPad.padWidth - 
			motherPad.padPadding.left - motherPad.padPadding.right :
		this.padWidth - 
			this.padPadding.left - this.padPadding.right;

	return this
}

// Plot the data from bar graph.
lineGraphClass.prototype.plotBars = function(data, motherPad, bars ,offset, isPinned) {

	var self = this,
		isPinned = isPinned ? true: false;

	var p0 = new Promise(function(resolve, reject) {

		var rects = bars ? 
				bars[0]: motherPad.selectAll('rect')[0],
			// Get hex code of rect elements
			hex = 
				d3.select('#SKETCHPAD').select('rect').attr('fill');

		// Get the all elements' x y position besides the parent
		for (var i = 0; i < rects.length; i++) {

			var box = rects[i].getBBox();

			// Added the dot's position in data
			data[i].dotX = box.x + offset;
			data[i].dotY = box.y ;
		}

		var line = d3.svg.line()
				.x(function(d) { return d.dotX })
				.y(function(d) { return d.dotY });

		// Check if line is existed or not
		if ( self.linePath ) {

			self.linePath
				.datum(data)
				.transition()
					.attr('d', line)
					.attr('stroke', colorAdjust(hex, 20));

		// Create a line once it is not existed
		} else {

			self.linePath = 
				self.pad
					.append('g')
					.append('path')
						.attr('class', 'dotted-path')
					.datum(data)
						.attr('d', line)
						.attr('fill', 'none')
						.attr('stroke', colorAdjust(hex, 20))
						.attr('stroke-width', 3);

		}

		// Check the dots on line are existed or not
		if ( self.lineDots ) {

			self.lineDots
				.data(data)
				.transition()
					.attr('fill', colorAdjust(hex, 20))
					.attr('cx', function(d) { return d.dotX })
					.attr('cy', function(d) { return d.dotY });

		// Create the dots once they aren't existed
		} else {

			self.lineDots = self.pad
				.append('g')
					.attr('class', 'dots-cluster')
				.selectAll('circle')
				.data(data)
					.enter()
					.append('circle')
						.attr('cx', function(d) { return d.dotX })
						.attr('cy', function(d) { return d.dotY })
						.attr('class', 'dots')
						.attr('fill', colorAdjust(hex, 20))
						.attr('stroke-width', 2)
						.attr('stroke', '#fff')
						.attr('r', 7);

		}

		// Check if the unde line area is existed 
		if ( self.areaUnderLine ) {
			self.updateUnderArea(data, colorAdjust(hex, 40));

		// If it is not, then create one.
		} else {
			self.drawUnderArea(data, colorAdjust(hex, 40));
		}

		resolve({ 
			data: data, 
			hexCode: hex, 
			line: self.linePath,
			dots: self.lineDots,
			area: self.areaUnderLine
		});

	});

	function colorAdjust(hex, colorDelta) {

		// Make the stroke color slightly different from the bars.
		var rgb = colorObj.hexToRgb(hex);

		// Abjust one of the color.
		if ( 255 - rgb.r > colorDelta ) rgb.r += colorDelta
		else {
			if ( 255 - rgb.g > colorDelta ) rgb.g += colorDelta
			else {
				if ( 255 - rgb.b > colorDelta) rgb.b += colorDelta
				}
			}

		return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')' 
	}

	return p0
}

lineGraphClass.prototype.inheritPad = function(motherPad, padHeight, padWidth, padPadding) {
	
	this.pad = motherPad;
	this.padHeight = padHeight;
	this.padWidth = padWidth;
	this.padPadding = padPadding;	
	return this
}

lineGraphClass.prototype.drawingData = function(path, offsetX, offsetY, xLabel, yLabel, dOption) {

	var self = this;
	
	this.readCSV(path)
		.row(function(d) { return d })
		.get(function(errors, rows) {
			
			self.xScale = !this.xScale ? 
				d3.scale.ordinal()
					.domain(rows.map(function(d){ return d[xLabel] }))
						.rangeBands([0, self.chartWidth])
				: self.xScale;
			
			self.yScale = !this.yScale ?
				d3.scale.linear()
					.domain([0, d3.max(rows, 
									function(d) { return parseInt(d[dOption]) })
							])
					.rangeRound([self.chartHeight, 0])
				: self.yScale;

			self.line = d3.svg.line()
				.x(function(d) { return self.xScale(d[xLabel]) + offsetX })
				.y(function(d) { return self.yScale(d[dOption]) });

			
			d3.select("#SKETCHPAD")
				.append('g')
				.append('path')
				.datum(rows)
				.attr('class', 'line')
				.attr('d', self.line)
				.attr('fill', 'none')
				.attr('stroke', colorObj.line[dOption]);

		});

}

lineGraphClass.prototype.drawUnderArea = function(data, color) {

	this.area = d3.svg.area()
		.x(function(d) { return d.dotX })
		.y0(this.chartHeight)
		.y1(function(d) { return d.dotY });

	this.areaUnderLine = 
		this.pad
			.append('g')
				.attr('class', 'under-line-area-group')
			.append('path')
			.datum(data)
				.attr('class', 'under-line-area')
				.attr('fill', color)
				.attr('d', this.area);

}

lineGraphClass.prototype.updateUnderArea = function(data, color) {

	this.areaUnderLine
		.datum(data)
		.transition()
			.attr('d', this.area)
			.attr('fill', color)
			.style('opacity', 0.8);

}

lineGraphClass.prototype.isInvisible = function() {
	if ( this.linePath.style('opacity') ) return true
	else false
}

// lineGraphClass.prototype.beInvisible = function() {

// 	this.linePath.style('opacity', 0);

// 	if ( this.isLineHidden() ) 
// 		this.displayLine();

// }

// lineGraphClass.prototype.beVisible = function() {

// 	this.linePath.style('opacity', 1);
// 	this.displayLine();

// }

lineGraphClass.prototype.hide = function() {
	this.linePath.style('display', 'none');
	this.lineDots.style('display', 'none');
	return this
}

lineGraphClass.prototype.beDisplayed = function() {
	this.linePath.style('display', 'inline');
	this.lineDots.style('display', 'inline');
	return this
}

lineGraphClass.prototype.isLineHidden = function() {

	var displayStatus = 
			this.linePath.style('display');

	if ( displayStatus === 'none') return true
	else return false
}

lineGraphClass.prototype.displayUnderArea = function() {
	this.areaUnderLine.style('display', 'inline');
	return this
}

lineGraphClass.prototype.hideUnderArea = function() {
	this.areaUnderLine.style('display', 'none');
	return this
}

/* A Class for ring chart */
var ringGraphClass = function() {
	
	var self = this;

	// Import ring graphClass into Graph Class
	graphClass.call(this);

	// Core radius of the ring sequence
	this.coreRadius = 100;

	// Outer Radius of the ring sequence
	this.shellRadius = (function(h, w) { 
		return Math.min(h,w)/ 2 
	})(
		this.panelWidth - this.panelPadding.left, 
		this.panelHeight - this.panelPadding.top
	);

	// The drawing ring inner radius 
	this.ringInnerRadius = this.coreRadius;

	// Delta of the ring radius
	this.ringDelta = 0;

	// The gap between each ring
	this.ringGap = 2;

	// Ring Group for collecting ring Objects
	this.ringGroup = [];

	// A variable for storing Year value in ROC
	this.rocYr = null;

	// Count for the number of the ring
	this.countRing = 0;

	this.ringNumber = null;

	this.dataInfoView = {
		textArea: null,
		percentage: null,
		categoryName: null,
		itemName: null,
		itemNumber: null
	};
}

/* Inherit the ringGraphClass from the graph */
ringGraphClass.prototype = Object.create(graphClass.prototype);
ringGraphClass.prototype.constructor = ringGraphClass;

// A constructor for creating the rings for ring chart
ringGraphClass.prototype.ringConstructor = function(source, innerR, outerR) {

	var ring = function(iR, oR, s) {

		// Set the source of the data
		this.dataSource = s;

		// Define the basic of the ring
		this.outerRadius = oR;
		this.innerRadius = iR;

		// Define the way we dipict the ring
		this.partition = 
			d3.layout.partition()
				.sort(null)
					.size([ 2*Math.PI, this.outerRadius*this.outerRadius ])
					.value(function(d) { return d.value });

				
		this.arc =
			d3.svg.arc()
				.startAngle(function(d) { return d.x })
				.endAngle(function(d) { return d.x + d.dx })
				.innerRadius(this.innerRadius)
				.outerRadius(this.outerRadius);
		};

	var r = new ring(innerR, outerR, source);

	return r
}

ringGraphClass.prototype.calRadiusDelta = function(categoryNum) {

	this.ringDelta = 
		(this.shellRadius - 
		 	this.coreRadius - 
		 		(categoryNum - 1) * this.ringGap) / categoryNum;

}

/* Select the year in ROC */
ringGraphClass.prototype.selectROCYr = function(yr) {

	var date = new Date();

	// The data of current year won't be published until the next year
	this.rocYr = ( yr >= 75 && (date.getFullYear()-1911-1) > yr ) ? yr : null;
}

/* Row Index of data of ROC year */
ringGraphClass.prototype.selectRow = function() {
	if ( this.rocYr ) return this.rocYr-75
	else return null
}

ringGraphClass.prototype.drawRing = function(ringObj) {

	var self = this,
		isYrSelected = this.rocYr ? true: false,
		keywords = ringObj.dataSource.match(/[\u4e00-\u9fa5]+/),
		_color = keywords ? color[keywords]: null;
			
	this.readCSV(ringObj.dataSource)
		.row(function(d, i) {
			if ( isYrSelected ) if ( i === self.selectRow() ) return d
			else return null
		})
		.get(function(err, selectedRows) {

			var selectedRow = 
					selectedRows.length === 1 ? 
						selectedRows[0]: null;
					
			if (selectedRow) {

				selectedRow.pop = jsonPop;
				selectedRow = transtoPartitonFormat(selectedRow, '民國');
				
				self.panel.append('g')
					.attr('class', 'RING')
					.attr('transform', function() {

						// Put the ring at the center of the panel
						return 'translate(' + 
							(
								self.panelWidth / 2 - 
								self.panelPadding.left
							)
							+ ',' + 
							(
								self.panelHeight / 2 -
								self.panelPadding.top							
							) 
							+ ')'
					})
					.datum(selectedRow)
						.selectAll('path')
							.data(ringObj.partition.nodes)
							.enter()
							.append('path')
								.attr('d', ringObj.arc)
								// Working spot
							.style('fill', function(d, i) {
								return color[keywords][d.name] || null
							})
							.style('fill-rule', 'evenodd');
		}
	});
}
ringGraphClass.prototype.drawMultiRings = function(paths) {

	var self = this,
		l = paths.length,
		_rings = [];

	this.calRadiusDelta(l);
	
	for ( var i = 0; i < l; i++ ) {
				
		_rings.push({

			path:
				paths[i],

			innerRadius: 
				this.coreRadius + 
					(i-1) * this.ringGap + 
						(i-1) * this.ringDelta, 

			outerRadius: 
				this.coreRadius + 
					(i-1) * this.ringGap + 
						i * this.ringDelta
		});
	}

	var _rings_l = _rings.length;

	for (var j = 0; j < _rings_l; ++j) {
		
		var r = _rings.shift();
				
		this.ringGroup.push(
			this.ringConstructor(
				r.path, 
				r.innerRadius, 
				r.outerRadius));
	}

	for (var k = 0; k < this.ringGroup.length; ++k) 
		this.drawRing(this.ringGroup[k]);
}

/* A class for tooltip */
var tipClass = function() {

	var panel = d3.select('#PANEL');
	
	this.dotTip = panel ? 
		panel.append('div')
			.attr('id', 'DOT-TIP')
			.attr('class', 'tip') : undefined;

	this.barTip = panel ? 
		panel.append('div')
			.attr('id', 'BAR-TIP')
			.attr('class', 'tip') : undefined;

	/* These varaibles are designed for preventing any kinds of exceptional value of the node */
	// The below two record the size value of tip and are used for checking the elements' resize.
	this._bTipH = null;
	this._bTipW = null;

}

tipClass.prototype.initTips = function() {
	this.dotTip = 
		d3.select('#PANEL')
			.append('div')
				.attr('id', 'DOT-TIP').attr('class', 'tip'); 
	this.barTip = 
		d3.select('#PANEL')
			.append('div')
				.attr('id', 'BAR-TIP').attr('class', 'tip'); 
}

tipClass.prototype.appendDotMouseOver = function(dOption) {

	var self = this,

		// Set up the origin of the dot tip
		offset = this._setOffset('DOT-TIP');

		d3.select('#SKETCHPAD')
			.selectAll('.dots')
			.on(
				'mouseover', 
				function(d) {
					
					var posX = parseInt(this.getAttribute('cx')),
						posY = parseInt(this.getAttribute('cy'));
	
					self.dotTip
						.classed('display', true)

						// Make the tip's origin fixed at center of circles
						.style('top', posY + offset.Y + 'px')
						.style('left', posX +offset.X + 'px')
						.html(function() {

							info = 
								'民國 ' + d['民國'] + '<br>' +
							   		dOption + ': ' + d[dOption];

							return '<span id="DOT-INFO">' + info + '</span>'

						})
						.call(function(d) {
							self._correctPos('DOT-TIP');
						});
			})
			.on(
				'mouseout',
				function(d) {
					self.dotTip
						.classed('display', false);
				}
			);
}

tipClass.prototype.appendBarMouseOver = function(dOption) {

	var self = this;
		// Set up the origin of the bar tip
		offset = this._setOffset('BAR-TIP');

	d3.select('#SKETCHPAD')
		.selectAll('.bar')
		.on(
			'mouseover', 
			function(d) {

				var posX = 
						parseFloat(this.getAttribute('x')) + 
						parseFloat(this.getAttribute('width')/2),
					posY = 
						parseFloat(this.getAttribute('y'));

				self.barTip
					.classed('display', true)

					// Make the tip's origin fixed at center of circles
					.style('top' , posY + offset.Y + 'px')
					.style('left', posX + offset.X + 'px')

					.html(function() {

						info = 
							'民國 ' + d['民國'] + '<br>' +
						   		dOption + ': ' + d[dOption];

						return '<span id="BAR-INFO">' + info + '</span>'

					})
					.call(function(d) {
						self._correctPos('BAR-TIP')
							._nodeSizeCorrect('BAR-TIP');
					});
			})
		.on(
			'mouseout',
			function(d) {
				self.barTip
					.classed('display', false);
			}
		);
}

tipClass.prototype._setOffset = function(nodeId) {

	// The origin of tip has to be the same as the origin of the sketchpad.
	var dotTipNode = document.getElementById(nodeId),
		parentContainers = listAncestorNodes(dotTipNode),

		offset = 
			calOffsetFromOrigins(parentContainers, dotTipNode),

		displayPanelStyle = 
			window.getComputedStyle(document.getElementById('DISPLAY_PANEL')),

		svgPadStyle = 
			window.getComputedStyle(document.getElementById('SKETCHPAD'), null),

		headerStyle = 
			window.getComputedStyle(document.getElementById('DASHBOARD_HDR'), null);

		offset.X += 
				parseInt(displayPanelStyle['padding-left'].replace('px', '')) +
					parseInt(svgPadStyle['padding-left'].replace('px', '')) +
						parseInt(headerStyle['width'].replace('px', ''));
		offset.Y += 
				parseInt(displayPanelStyle['padding-top'].replace('px', '')) +
					parseInt(svgPadStyle['padding-top'].replace('px', ''));
	return offset

}


tipClass.prototype._correctPos = function(tipId) {

	var self = this,

		tip = null,

		arrowHeight = 9,
		arrowHalfWidth = 9/Math.sqrt(3);

		(function() {
			if ( tipId === 'DOT-TIP' ) tip = self.dotTip;
			else if ( tipId === 'BAR-TIP' ) tip = self.barTip;
		})();

	// Stores the node's offsetHeight property in case of tip resizing.
	this._bTipH = tip.node().offsetHeight;
	this._bTipW = tip.node().offsetWidth ;

	var originTop = parseInt(tip.node().style.top.replace('px', '')),
		originLeft = parseInt(tip.node().style.left.replace('px', ''));

	var updatedTop = 
			originTop - tip.node().offsetHeight - arrowHeight,
		updatedLeft = 
			originLeft - tip.node().offsetWidth/2 - arrowHalfWidth;

	if ( updatedTop > 0 && updatedLeft > 0 ) {

		tip
			.classed('tip-before-display', false)
			.classed('tip-after-display', true)
			.style('top', updatedTop + 'px')
			.style('left', updatedLeft + 'px');

	/* When the tip is beyond the view we can see */
	} else if ( updatedTop < 0 ) {

		updatedTop = originTop + arrowHeight;

		tip
			.classed('tip-before-display', true)
			.classed('tip-after-display', false)
			.style('top', updatedTop + 'px')
			.style('left', updatedLeft + 'px');

	} 

	return this

}

tipClass.prototype._nodeSizeCorrect = function(tipType) {
	
	var self = this;

	if (tipType === 'BAR-TIP') {

		var nh = self.barTip.node().offsetHeight,
			nw = self.barTip.node().offsetWidth ;

			this.barTip
				.style('top', function() {

					var t = this.style.top;

					if (self._bTipH !== nh) {
						var ot = 
							parseInt(t.replace('px', ''));
						return ot + self._bTipH - nh + 'px' 
					} else 
						return t
				})
				.style('left', function() {

					var l = this.style.left;

					if (self._bTipW !== nw) {
						var ol = 
							parseInt(l.replace('px', ''));
						return ol + self._bTipW/2 - nw/2 + 'px'
					} else
						return l
				})
				// fix the width to prevent the resizing.
				.style('width', function() {
					return nw + 'px'
				});
	}
	else if (tipType === 'DOT-TIP')
		console.log(this.dotTip.node().offsetHeight);

	return this
}


/* Additional Functions */
function kTick(tick) {
	return Math.round(tick/1e3) + 'K'
}

/* 
	A function for pinnig label at the middle bottom of the bar 
	barW: The width of bar
	inPad: 
		The abbreviation about "innerPadding", 
		The padding between each bar
		outPad:
		The abbreviation about "outPadding"
		meaning the padding space between the first bar and the y axis.
*/
function c_pinLbl2XAxisBarMidPt(xAxis, barW, inPad, outPad) {
	// xAxis is the same as "this" 
	xAxis.selectAll('.tick').attr('transform', function(d, i) {
		return 'translate(' + (outPad+(2*i+1)*barW/2+i*inPad) + ',0)'
	});
}

/*  
	A function for putting label with data value on each bar.
	bars: 
		the bars selected by previous defined seletor function
	d:
		displacement from the head position
*/
function c_placeValOnBarHdV(txt, d, barW, inPad, outPad) {

	var _txt = txt[0];

	for ( var i=0 ; i<_txt.length; i++ ) {

		var bWMidPt = _txt[i].offsetWidth/2,
				bHMidPt = _txt[i].offsetHeight/2,
				// Displacement in X direction
				xd = parseInt(_txt[i].getAttribute('x')),
				// Displacement in Y direction
				yd = parseInt(_txt[i].getAttribute('y')),
				delta = ( barW/2 < 2*bHMidPt ) ? (barW/2-0.5*bHMidPt*2): (barW/2-bHMidPt/2);

		_txt[i].setAttribute(
			'transform', 
			'rotate(90, ' + xd + ', ' + yd+ ')' +
			'translate(' + d + ',' + (-1 * delta) + ')'); 
	}
}


function listAncestorNodes(node) {

	var childNode = node,

		nodes = [];

	while ( childNode && childNode.parentNode ) {

		if ( childNode.tagName !== 'BODY' ) {

			nodes.push(childNode.parentNode);
			childNode = childNode.parentNode;
		} else childNode = null;
	}
	return nodes
}

function calOffsetFromOrigins(containers, contextNode) {

	var offsetX = 0,
		offsetY = 0,
		borderRex = /\d+px/;

	for ( var i in containers ) {

		var containerSpec = 
			window.getComputedStyle(containers[i], null);

		offsetX += 
			(parseInt(containerSpec['border-left'].match(borderRex)[0].replace('px', '')) + 
				parseInt(containerSpec['padding-left'].replace('px', '')) + 
					parseInt(containerSpec['margin-left'].replace('px', '')));

		offsetY += 
			(parseInt(containerSpec['border-top'].match(borderRex)[0].replace('px', '')) + 
				parseInt(containerSpec['padding-top'].replace('px', '')) + 
					parseInt(containerSpec['margin-top'].replace('px', '')));

	} 
	return { X: offsetX, Y: offsetY }
}
/* A function allows json data to pop a value with specific key. */
function jsonPop(key) {

	var type = Object.prototype.toString.call(this).slice(8, -1);
						
	if ( type === 'Object' ) {
	for ( var k in this ) {
		if ( k === key ) { 

			var val = this[k];
				
				delete this[key]
				return val
				}
			}
		}
		else return undefined
	}

/* 
	A function construct the a data format ({parent: '...', children: '...'}) 
	which is easily transformed into partitions 
*/
function transtoPartitonFormat(obj, popKey) {

	return {
		name: obj.pop(popKey),
		children: 
			(function(d) {

				var ary = [];
					
				for ( var key in d ) {  
					var _d = {};
					if ( Object.prototype
								.toString.call(d[key]).slice(8, -1) 
							!== 'Function' 
					) {
						_d['name'] = key;
						_d['value'] = parseInt(d[key]);
						ary.push(_d);
					}
				}
				return ary
			})(obj)
	}
}

