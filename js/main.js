var width = 1800; // The width of the svg is a global variable
var height = 400; // The height of the svg is a global variable
var margin = 4;
var size = 6;
var count = 0;
var playing = false;
var stepping = false;
var time;
var row_index = 0;
var column_index = 0;
var location_index = 0;
var product_index = 0;
const graph_width = 550;
var method_color = d3.scaleOrdinal(d3.schemeTableau10);

const memory_A = new Array(256);
const memory_B = new Array(256);
const memory_C = new Array(256);

const OTimeData = [{x: 256, t: 0.000005, method: "naive"}, {x: 256, t: 0.000003, method: "transposed"},
	{x: 256, t: 0.000004, method: "tiled"}, {x: 1024, t: 0.000029, method: "naive"},
	{x: 1024, t:  0.000022, method: "transposed"}, {x: 1024, t: 0.000023, method: "tiled"},
	{x: 4096, t: 0.000374, method: "naive"}, {x: 4096, t:  0.000181, method: "transposed"},
	{x: 4096, t: 0.000209, method: "tiled"}, {x: 16384, t: 0.002746, method: "naive"},
	{x: 16384, t:  0.001312, method: "transposed"}, {x: 16384, t: 0.001503, method: "tiled"},
	{x: 65536, t: 0.024991, method: "naive"}, {x: 65536, t:  0.010131, method: "transposed"},
	{x: 65536, t: 0.010062, method: "tiled"}, {x: 262144, t: 0.267358, method: "naive"},
	{x: 262144, t:  0.063351, method: "transposed"}, {x: 262144, t: 0.077781, method: "tiled"},
	{x: 1048576, t: 2.211022, method: "naive"}, {x: 1048576, t:  0.506491, method: "transposed"},
	{x: 1048576, t: 0.636426, method: "tiled"}, {x: 4194304, t: 94.403878, method: "naive"},
	{x: 4194304, t:  5.620813, method: "transposed"}, {x: 4194304, t: 5.708298, method: "tiled"}];

var M, N, P = 4;
var domain = [4,16];

var scaleX = d3.scalePow()
	.exponent(-1.4)
	.domain(domain)
	.range([175, 37]);

var scaleY = d3.scalePow()
	.exponent(-1.4)
	.domain(domain)
	.range([113, 24.7]);

var scale_Size = d3.scaleSqrt()
	.domain(domain)
	.range([50, 21.6]);

let vector_A = d3.cross(d3.range(M), d3.range(N));
let vector_B = d3.cross(d3.range(N), d3.range(P));
let vector_C = d3.cross(d3.range(M), d3.range(P));

var M_scaled_x = scaleX(M)
var M_scaled_y = scaleY(M);
var N_scaled_x = scaleX(N)
var N_scaled_y = scaleY(N);
var P_scaled_x = scaleX(P);
var P_scaled_y = scaleY(P);

var scaled_size_M = scale_Size(M);
var scaled_size_N = scale_Size(N);
var scaled_size_P = scale_Size(P);

var B_scaled_x = N_scaled_x;
var B_scaled_y = P_scaled_y;
var B_scaled_W = scaled_size_N;
var B_scaled_H = scaled_size_P;

var duration = +d3.select("#transition").property("value");

var svg0 = d3.select("#svg_chart").append("svg")
	.attr("width", width)
	.attr("height", height)
	.style("stroke", "black")
	.style("border-radius", "5px");

var svg1 = d3.select("#svg_chart").append("svg")
	.attr("width", width)
	.attr("height", 150)
	.style("background", "lightsteelblue")
	.style("margin-top", "5px")
	.style("border-radius", "5px");

var svg2 = d3.select(".graph").append("svg")
	.attr("width", width/3 - margin*3)
	.attr("height", height)
	.style("background", "lightsteelblue")
	.style("margin-top", "5px")
	.style("border-radius", "5px");


svg0.append('rect')
	.attr("fill", "lightsteelblue")
	.attr("stroke", "black")
	.attr("x", 0)
	.attr("y", 0)
	.attr("rx", 5)
	.attr("ry", 5)
	.attr("width", width/3 - margin*3.8)
	.attr("height", height);

svg0.append('rect')
	.attr("fill", "lightsteelblue")
	.attr("stroke", "black")
	.attr("x", width/3 + margin*2)
	.attr("y", 0)
	.attr("rx", 5)
	.attr("ry", 5)
	.attr("width", width/3 - margin*3.8)
	.attr("height", height);

svg0.append('rect')
	.attr("fill", "lightsteelblue")
	.attr("stroke", "black")
	.attr("x", width - (width/3 - margin*3.8))
	.attr("y", 0)
	.attr("rx", 5)
	.attr("ry", 5)
	.attr("width", width/3 - margin*3.8)
	.attr("height", height);

var tooltip = d3.select(".graph")
	.append("g")
	.style("opacity", 0)
	.attr("class", "tooltip")
	.style("text-align", "left")
	.style("color", "ghostwhite")
	.style("border", "2px solid lightskyblue")
	.style("border-radius", "5px")
	.style("background-color", "steelblue")
	.style("font-family", "sans-serif")
	.style("padding", "10px")
	.style("margin", "10px");

// Three function that change the tooltip when user hover / move / leave a cell
var mouseover = function(d) {
	tooltip.style("opacity", 1);
}
var mousemove = function(d) {
	tooltip.html("Hover over the lines or legend")
		.style("opacity", 0.8);
}
var mouseleave = function(d) {
	tooltip.style("opacity", 0);
}

svg2.on("mouseover", mouseover)
	.on("mousemove", mousemove)
	.on("mouseleave", mouseleave);

var element_scale = d3.scaleLog()
	.base(2)
	.domain([100, 4194304])
	.range([0, 550]);

var time_scale = d3.scaleLinear()
	.domain([100, 0])
	.range([margin*10, height-margin*4]);

var elements_x_axis = d3.axisBottom()
	.tickFormat(d3.format(".2s"))
	.scale(element_scale);

var time_y_axis = d3.axisLeft()
	.scale(time_scale);

var legend_data = d3.map(OTimeData, function(d){ return d.method; }).values();

var naive_data = OTimeData.filter(function (timeData) {
	return timeData = (timeData.method == "naive");
});
var transpose_data = OTimeData.filter(function (timeData) {
	return timeData = (timeData.method == "transposed");
});
var tile_data = OTimeData.filter(function (timeData) {
	return timeData = (timeData.method == "tiled");
});

var naiveLine = points_to_path(naive_data);
var transposeLine = points_to_path(transpose_data);
var tileLine = points_to_path(tile_data);

generateMatrices();

d3.select("#M").on("input", generateMatrices).on("click", sliderStopPlay).on("input", sliderStopPlay);
d3.select("#N").on("input", generateMatrices).on("click", sliderStopPlay).on("input", sliderStopPlay);
d3.select("#P").on("input", generateMatrices).on("click", sliderStopPlay).on("input", sliderStopPlay);
d3.select("#transition").on("input", render).on("click", sliderStopPlay).on("input", sliderStopPlay);

function render() {

	var scale_playback = d3.scaleLinear()
		.domain(domain)
		.range([500, 150]);

	duration = +d3.select("#transition").property("value");
	var algorithm = d3.select('input[name="algorithm"]:checked').node().value;

	if (playing) time = setTimeout(step, scale_playback(N));

	else if (stepping) return;

	else {

		var naive_update = svg2.selectAll(".naive_drawing")
			.data(naive_data)
			.classed("naive_drawing", true);

		naive_update.enter().append("path")
			.classed("naive_drawing", true)
			.attr("d", d3.line()(naiveLine))
			.attr("id", "naive-line")
			.attr("stroke-width", "3px")
			.attr("opacity", 0.6)
			.attr("transform", "translate(0," + (-margin*3.4) + ")")
			.attr("stroke", "#4e79a7")
			.attr("fill", "none")
			.on("mouseover", handleMouseOverLine)
			.on("mouseout", handleMouseOutLine);

		naive_update.exit().remove();

		var transpose_update = svg2.selectAll(".transpose_drawing")
			.data(transpose_data)
			.classed("transpose_drawing", true);

		transpose_update.enter().append("path")
			.classed("transpose_drawing", true)
			.attr("d", d3.line()(transposeLine))
			.attr("id", "transposed-line")
			.attr("stroke-width", "3px")
			.attr("opacity", 0.6)
			.attr("transform", "translate(0," + (-margin*3.4) + ")")
			.attr("stroke", "#f28e2c")
			.attr("fill", "none")
			.on("mouseover", handleMouseOverLine)
			.on("mouseout", handleMouseOutLine);

		transpose_update.exit().remove();

		var tile_update = svg2.selectAll(".tile_drawing")
			.data(tile_data)
			.classed("tile_drawing", true);

		tile_update.enter().append("path")
			.classed("tile_drawing", true)
			.attr("d", d3.line()(tileLine))
			.attr("id", "tiled-line")
			.attr("stroke-width", "3px")
			.attr("opacity", 0.6)
			.style("stroke-dasharray", ("11, 11"))
			.attr("transform", "translate(0," + (-margin*3.4) + ")")
			.attr("stroke", "#e15759")
			.attr("fill", "none")
			.on("mouseover", handleMouseOverLine)
			.on("mouseout", handleMouseOutLine);

		tile_update.exit().remove();

		var vector_A_update = svg0.selectAll(".matrix_A_drawing")
			.data(vector_A)
			.classed("matrix_A_drawing", true);

		vector_A_update.enter().append("rect")
			.merge(vector_A_update)
			.classed("matrix_A_drawing", true)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "rows";
			})
			.attr("id", function (d, i) {
				return "row" + d[0];
			})
			.attr("x", function (d, i) {
				return (d[1] * N_scaled_x) + margin;
			})
			.attr("y", function (d, i) {
				return (d[0] * M_scaled_y) + margin;
			})
			.attr("opacity", 0.8)
			.attr("rx", 4)
			.attr("ry", 4)
			.attr("width", scaled_size_N)
			.attr("height", scaled_size_M)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);


		vector_A_update.exit().remove();

		var vector_B_update = svg0.selectAll(".matrix_B_drawing")
			.data(vector_B)
			.classed("matrix_B_drawing", true);

		vector_B_update.enter().append("rect")
			.merge(vector_B_update)
			.classed("matrix_B_drawing", true)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "columns";
			})
			.attr("id", function (d, i) {
				return "column" + d[whichD];
			})
			.attr("x", function (d, i) {
				return (d[1] * B_scaled_x) + margin + 608;
			})
			.attr("y", function (d, i) {
				return (d[0] * B_scaled_y) + margin;
			})
			.attr("opacity", 0.8)
			.attr("rx", 4)
			.attr("ry", 4)
			.attr("width", B_scaled_W)
			.attr("height", B_scaled_H)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);

		vector_B_update.exit().remove();

		var vector_C_update = svg0.selectAll(".matrix_C_drawing")
			.data(vector_C)
			.classed("matrix_C_drawing", true);

		vector_C_update.enter().append("rect")
			.merge(vector_C_update)
			.classed("matrix_C_drawing", true)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "products";
			})
			.attr("id", function (d, i) {
				return "product" + i;
			})
			.attr("x", function (d, i) {
				return (d[1] * P_scaled_x) + margin + 1215;
			})
			.attr("y", function (d, i) {
				return (d[0] * M_scaled_y) + margin;
			})
			.attr("opacity", 0.8)
			.attr("rx", 4)
			.attr("ry", 4)
			.attr("width", scaled_size_P)
			.attr("height", scaled_size_M)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);

		vector_C_update.exit().remove();

		var memory_A_update = svg1.selectAll(".memory_A_drawing")
			.data(memory_A)
			.classed("memory_A_drawing", true);

		memory_A_update.enter().append("rect")
			.merge(memory_A_update)
			.classed("memory_A_drawing", true)
			.attr("width", 4)
			.attr("height", size * 7)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "rows";
			})
			.attr("id", function (d, i) {
				var scaled = d3.scaleQuantize()
					.domain([0, M * N])
					.range(d3.range(M));
				if (i < M * N) return "row" + scaled(i);
				else return "row" + i;
			})
			.attr("x", function (d, i) {
				return margin / 1.8 + (i * 7.02);
			})
			.attr("y", margin)
			.attr("opacity", 0.8)
			.attr("rx", 2)
			.attr("ry", 2)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);

		memory_A_update.exit().remove();

		var memory_B_update = svg1.selectAll(".memory_B_drawing")
			.data(memory_B)
			.classed("memory_B_drawing", true);

		memory_B_update.enter().append("rect")
			.merge(memory_B_update)
			.classed("memory_B_drawing", true)
			.attr("width", 4)
			.attr("height", size * 7)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "columns";
			})
			.attr("id", function (d, i) {
				if (algorithm == "transpose") {
					var scaled = d3.scaleQuantize()
						.domain([0, P * N])
						.range(d3.range(P));
					if (i < (P * N)) return "column" + scaled(i);
					else return "column" + i;
				} else {
					if (i < (N * P)) {
						var x = count;
						incrementCount(P - 1);
						return "column" + x;
					} else return "column" + i;
				}
			})
			.attr("x", function (d, i) {
				return margin / 1.8 + (i * 7.02);
			})
			.attr("y", margin * 13.5)
			.attr("opacity", 0.8)
			.attr("rx", 2)
			.attr("ry", 2)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);

		memory_B_update.exit()
			.remove();

		var memory_C_update = svg1.selectAll(".memory_C_drawing")
			.data(memory_C)
			.classed("memory_C_drawing", true);

		memory_C_update.enter().append("rect")
			.merge(memory_C_update)
			.classed("memory_C_drawing", true)
			.attr("width", 4)
			.attr("height", size * 7)
			.attr("stroke", "#264291")
			.attr("fill", "#203778")
			.attr("stroke-weight", "3px")
			.attr("shape-rendering", "optimizeSpeed")
			.attr("name", function (d, i) {
				return "products";
			})
			.attr("id", function (d, i) {
				return "product" + i;
			})
			.attr("x", function (d, i) {
				return margin / 1.8 + (i * 7.02);
			})
			.attr("y", margin * 26)
			.attr("opacity", 0.8)
			.attr("rx", 2)
			.attr("ry", 2)
			.on("mouseover", handleMouseOver)
			.on("mouseout", handleMouseOut);

		memory_C_update.exit().remove();
	}
}

function generateMatrices() {
	// get slider values
	M = +d3.select("#M").property("value");
	N = +d3.select("#N").property("value");
	P = +d3.select("#P").property("value");

	var algorithm = d3.select('input[name="algorithm"]:checked').node().value;

	M_scaled_x = scaleX(M)
	M_scaled_y = scaleY(M);
	N_scaled_x = scaleX(N)
	N_scaled_y = scaleY(N);
	P_scaled_x = scaleX(P);
	P_scaled_y = scaleY(P);

	scaled_size_M = scale_Size(M);
	scaled_size_N = scale_Size(N);
	scaled_size_P = scale_Size(P);

	vector_A = d3.cross(d3.range(M), d3.range(N));

	if (algorithm == "transpose") {
		vector_B = d3.cross(d3.range(P), d3.range(N));
		B_scaled_x = N_scaled_x;
		B_scaled_y = P_scaled_y;
		B_scaled_W = scaled_size_N;
		B_scaled_H = scaled_size_P;
		whichD = 0;
	} else {
		vector_B = d3.cross(d3.range(N), d3.range(P));
		B_scaled_x = P_scaled_x;
		B_scaled_y = N_scaled_y;
		B_scaled_W = scaled_size_P;
		B_scaled_H = scaled_size_N;
		whichD = 1;
	}
	vector_C = d3.cross(d3.range(M), d3.range(P));

	render();
}

function play() {
	var elem = document.getElementById("Play");
	if (elem.value=="Play") {
		elem.value = "Pause";
		playing = true;
		step();
	}
	else {
		elem.value = "Play";
		playing = false;
		stepping = false;
		clearTimeout(time);
	}
}

function sliderStopPlay() {
	var elem = document.getElementById("Play");
	if (elem.value=="Pause") {
		elem.value = "Play";
		playing = false;
		stepping = false;
		clearTimeout(time)
		row_index = 0;
		column_index = 0;
		product_index = 0;
		location_index = 0;
		sliderStopPlay();
	}
	else {
		row_index = 0;
		column_index = 0;
		product_index = 0;
		location_index = 0;
		stepping = false;
		generateMatrices();
	}
}

function radioFunction() {
	//console.log(d3.select('input[name="algorithm"]:checked').node().value);
	sliderStopPlay();
}

function handleMouseOver(d, i) {

	if(!playing) {

		var scaledR = d3.scaleQuantize()
			.domain([0, P * M])
			.range(d3.range(M));

		duration = +d3.select("#transition").property("value");
		if (d3.select(this).attr("name") == "products") {
			var id = d3.select(this).attr("id");
			var v = +id.slice(7, id.length);
			if (v < M * P) {
				var r_value = scaledR(v);
				var c_value = v % P;
				d3.select(this).transition().duration(duration)
					.attr("opacity", 1)
					.attr("stroke", "cyan")
					.attr("fill", "deepskyblue")
					.attr("stroke-weight", "15px");
				d3.selectAll("#row" + r_value).transition().duration(duration)
					.attr("opacity", 1)
					.attr("stroke", "cyan")
					.attr("fill", "deepskyblue")
					.attr("stroke-weight", "15px");
				d3.selectAll("#column" + c_value).transition().duration(duration)
					.attr("opacity", 1)
					.attr("stroke", "cyan")
					.attr("fill", "deepskyblue")
					.attr("stroke-weight", "15px");
			}
			d3.selectAll("#" + d3.select(this).attr("id")).transition().duration(duration)
				.attr("opacity", 1)
				.attr("stroke", "cyan")
				.attr("fill", "deepskyblue")
				.attr("stroke-weight", "15px");
		} else {
			d3.selectAll("#" + d3.select(this).attr("id")).transition().duration(duration)
				.attr("opacity", 1)
				.attr("stroke", "cyan")
				.attr("fill", "deepskyblue")
				.attr("stroke-weight", "15px");
		}
	}
}

function handleMouseOut(d, i) {

	if(!playing) {

		var scaledR = d3.scaleQuantize()
			.domain([0, P * M])
			.range(d3.range(M));

		duration = +d3.select("#transition").property("value");
		if (d3.select(this).attr("name") == "products") {
			var id = d3.select(this).attr("id");
			var v = +id.slice(7, id.length);
			if (v < M * P) {
				var r_value = scaledR(v);
				var c_value = v % P;
				d3.select(this).transition().duration(duration)
					.attr("opacity", 0.8)
					.attr("stroke", "#264291")
					.attr("fill", "#203778")
					.attr("stroke-weight", "3px");
				d3.selectAll("#row" + r_value).transition().duration(duration)
					.attr("opacity", 0.8)
					.attr("stroke", "#264291")
					.attr("fill", "#203778")
					.attr("stroke-weight", "3px");
				d3.selectAll("#column" + c_value).transition().duration(duration)
					.attr("opacity", 0.8)
					.attr("stroke", "#264291")
					.attr("fill", "#203778")
					.attr("stroke-weight", "3px");
			}
			d3.selectAll("#" + d3.select(this).attr("id")).transition().duration(duration)
				.attr("opacity", 0.8)
				.attr("stroke", "#264291")
				.attr("fill", "#203778")
				.attr("stroke-weight", "3px");
		} else {
			d3.selectAll("#" + d3.select(this).attr("id")).transition().duration(duration)
				.attr("opacity", 0.8)
				.attr("stroke", "#264291")
				.attr("fill", "#203778")
				.attr("stroke-weight", "3px");
		}
	}
}

function handleMouseOverLine(d, i) {
	duration = +d3.select("#transition").property("value");
	var selection = d3.select(this).attr("id");
	d3.selectAll("#" + selection).transition().duration(duration)
		.attr("opacity", 1);
	if (selection == "naive-line") {
		d3.selectAll("#transposed-line").transition().duration(duration)
			.attr("opacity", 0);
		d3.selectAll("#tiled-line").transition().duration(duration)
			.attr("opacity", 0);
	}
	else if (selection == "transposed-line") {
		d3.selectAll("#naive-line").transition().duration(duration)
			.attr("opacity", 0);
		d3.selectAll("#tiled-line").transition().duration(duration)
			.attr("opacity", 0);
	}
	else {
		d3.selectAll("#naive-line").transition().duration(duration)
			.attr("opacity", 0);
		d3.selectAll("#transposed-line").transition().duration(duration)
			.attr("opacity", 0);
	}
}

function handleMouseOutLine(d, i) {
	duration = +d3.select("#transition").property("value");
	var selection = d3.select(this).attr("id");
	d3.selectAll("#" + selection).transition().duration(duration)
		.attr("opacity", 0.6);
	if (selection == "naive-line") {
		d3.selectAll("#transposed-line").transition().duration(duration)
			.attr("opacity", 0.6);
		d3.selectAll("#tiled-line").transition().duration(duration)
			.attr("opacity", 0.6);
	}
	else if (selection == "transposed-line") {
		d3.selectAll("#naive-line").transition().duration(duration)
			.attr("opacity", 0.6);
		d3.selectAll("#tiled-line").transition().duration(duration)
			.attr("opacity", 0.6);
	}
	else {
		d3.selectAll("#naive-line").transition().duration(duration)
			.attr("opacity", 0.6);
		d3.selectAll("#transposed-line").transition().duration(duration)
			.attr("opacity", 0.6);
	}
}

function incrementCount(limit) {
	//console.log(count);
	count = (count < limit) ? count + 1 : 0;
}

function step() {

	duration = +d3.select("#transition").property("value");

	d3.selectAll("#product" + product_index).transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "cyan")
		.attr("fill", "deepskyblue")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", function() {
			if (location_index == N-1) return "yellow";
			else return "cyan";
		})
		.attr("fill", function() {
			if (location_index == N-1) return "darkorange";
			else return "deepskyblue";
		})
		.attr("stroke-weight", "3px");

	var columnSelection_blue = d3.selectAll("#column" + column_index).filter(function (d, i) { return i !== location_index; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "cyan")
		.attr("fill", "deepskyblue")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	var columnSelection_orange = d3.selectAll("#column" + column_index).filter(function (d, i) { return i === location_index; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "yellow")
		.attr("fill", "darkorange")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	var columnSelection_orange = d3.selectAll("#column" + column_index).filter(function (d, i) { return i === location_index + N; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "yellow")
		.attr("fill", "darkorange")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	var rowSelection_blue = d3.selectAll("#row" + row_index).filter(function (d, i) { return i !== location_index; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "cyan")
		.attr("fill", "deepskyblue")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	var rowSelection_orange = d3.selectAll("#row" + row_index).filter(function (d, i) { return i === location_index; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "yellow")
		.attr("fill", "darkorange")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	var rowSelection_orange = d3.selectAll("#row" + row_index).filter(function (d, i) { return i === location_index + N; })
		.transition().duration(duration)
		.attr("opacity", 1)
		.attr("stroke", "yellow")
		.attr("fill", "darkorange")
		.attr("stroke-weight", "15px")
		.transition().duration(duration*10)
		.attr("opacity", 0.8)
		.attr("stroke", "#264291")
		.attr("fill", "#203778")
		.attr("stroke-weight", "3px");

	//console.log(product_index, row_index, column_index, location_index);
	if (location_index >= N-1) {
		location_index = 0;
		product_index++;
		column_index++;
	}
	else {
		location_index++;
	}

	if (column_index > P-1) {
		column_index = 0;
		row_index++;
	}

	if (row_index > M-1) row_index = 0;

	if (product_index > (M*P) - 1) {
		product_index = 0;
		row_index = 0;
		column_index = 0;
		location_index = 0;
	}

	render();

}

function button_step() {
	stepping = true;
	step();
}

function points_to_path(d) {
	let converted = [];
	for (let i =0; i < d.length; i++) {
		var x = element_scale(d[i].x);
		var y = time_scale(d[i].t);
		converted[i] = [x, y];
	}
	return converted;
}

svg0.append("text")
	.attr("text-anchor", "middle")
	.attr("transform", "translate("+ (width - 1204) +","+(height/1.9)+")")
	.text("X")
	.attr("font-family", "Orbitron", "sans-serif")
	.attr("font-size", "25px")
	.attr("stroke", "none")
	.attr("fill", "deepskyblue");

svg0.append("text")
	.attr("text-anchor", "middle")
	.attr("transform", "translate("+ (width - 596) +","+(height/1.85)+")")
	.text("=")
	.attr("font-family", "Orbitron", "sans-serif")
	.attr("font-size", "36px")
	.attr("stroke", "none")
	.attr("fill", "deepskyblue");

svg2.append("g")
	.attr("class", "axis")
	.call(elements_x_axis)
	.attr("transform", "translate(" + margin*6  + "," + (height-margin*7) + ")")
	.selectAll("text")
	.attr("font-size", "9px");

svg2.append("g")
	.attr("class", "axis")
	.call(time_y_axis)
	.attr("transform", "translate(" + margin*6  + "," + (-margin*3) + ")")
	.selectAll("text")
	.attr("font-size", "9px");

svg2.append("g")
	.attr("class", "grid")
	.attr("opacity", 0.1)
	.attr("transform", "translate(" + margin*6  + "," + (-margin*3) + ")")
	.call(time_y_axis
		.tickSize(-graph_width)
		.tickFormat("")
	);

svg2.append("g")
	.attr("class", "grid")
	.attr("opacity", 0.1)
	.attr("transform", "translate(" + margin*6  + "," + (margin*7) + ")")
	.call(elements_x_axis
		.tickSize(345)
		.tickFormat("")
	);

var pipsize = 10
svg2.selectAll("pips")
	.data(legend_data)
	.enter()
	.append("rect")
	.attr("x", margin*7)
	.attr("y", function(d,i){ return margin*10 + i*(pipsize*2) })
	.attr("width", pipsize)
	.attr("height", pipsize)
	.style("fill", function(d){ return method_color(d.method) });

svg2.selectAll("labels")
	.data(legend_data)
	.enter()
	.append("text")
	.attr("opacity", 0.6)
	.attr("id", function(d, i) {
		return d.method + "-line";
	})
	.attr("x", margin*10)
	.attr("y", function(d,i){ return margin*11.5 + i*(pipsize*2) })
	.style("fill", "ghostwhite")
	.attr("font-family", "sans-serif")
	.attr("font-size", "20px")
	.text(function(d){ return d.method + "-method" + "\u00A0" + "\u00A0" })
	.attr("text-anchor", "left")
	.style("cursor",  "default")
	.style("alignment-baseline", "middle")
	.on("mouseover", handleMouseOverLine)
	.on("mouseout", handleMouseOutLine);;

svg2.append("text")
	.attr("text-anchor", "middle")
	.attr("font-family", "sans-serif")
	.attr("transform", "translate("+ (margin*10) +","+(height/2)+")rotate(-90)")
	.text("Time")
	.attr("stroke", "none");

svg2.append("text")
	.attr("text-anchor", "middle")
	.attr("font-family", "sans-serif")
	.attr("transform", "translate("+ (graph_width/2) + "," + (height - margin*9) + ")")
	.text("Elements")
	.attr("stroke", "none");

svg2.append("text")
	.attr("text-anchor", "middle")
	.attr("font-family", "sans-serif")
	.attr("font-size", "18px")
	.attr("fill", "#203778")
	.attr("transform", "translate("+ (graph_width/2) + "," + (margin*5) + ")")
	.text("Time Complexity of Matrix Multiplication Algorithms")
	.attr("stroke", "none");
