/**
 * Pedro Carrazco | Game of Life 1.0
 * 
 * No Copyright so far
 * Sin Copyright hasta ahora
 * 
 * This project is a test for Crowd Int created by Pedro Carrazco,
 * reproduction is totally allowed as this code is just for fun.
 * 
 * Este proyecto es una prueba para Crowd Int creada por Pedro Carrazco,
 * cualquier reproducción es permitida debido a que este codigo tiene 
 * fines únicamente de entretenimiento.
 * 
 * @version 1.0
 * @author Pedro Jose Carrazco Rivera
 */
$.GoL = function(el,values){
	/* Defaults */
	var defaults = {
		grid: [10,10], // Grid size / Tamaño de cuadricula
		start: true,   // Start after load / Iniciar despues de cargar
		demo: true,    // Display a demo / Activar modo "demostracion"
		demoData: [    // Data for demo
			[1,2],
			[2,3],
			[3,1],
			[3,2],
			[3,3]
		],
		speed: 300,    // Speed in miliseconds / Velocidad en milisegundos
		$el: el        // The jQuery container / El contenedor como objeto jQuery
	};
	this.vals = {};
	$.extend(this.vals,defaults,values);
	// Initialize / Comenzar
	this.init(values);
};

$.GoL.prototype = {
	vGrid:[],
	blankGrid:[],
	$grid:null,
	editing: false,
	noChange: false,
	init:function(){
		this.genCSS();
		this.renderGrid();
		if($.isEmptyObject(this.vals.cells)){
			this.print(this.vals.demo);
		}else{
			this.print(this.vals.cells);
		}
		this.begin();
	},
	update: function(params){
		var validateParams, nParam = {},tmp;
		switch(typeof params){
			case "undefined":
				return;
			break;
			case "string":
				switch(params){
					case "start":
						validateParams = true;
						nParam.start = true;
					break;
					case "stop":
						validateParams = true;
						nParam.start = false;
					break;
					case "toggle":
						validateParams = true;
						nParam.start = (this.vals.start) ? false : true;
					break;
					case "demo":
						validateParams = true;
						nParam.demo = true;
					break;
					case "reset":
						this.reset();
						this.vals.start = false;
						if(this.editing){
							this.editing = false;
							this.edit();
						}
					break;
					case "edit":
						this.edit();
					break;
					case "editEnd":
						this.editEnd();
					break;
					default:
						validateParams = false;
				}
				if(validateParams){
					params = nParam
				}
			break;
			case "number":
				params = {speed:params};
			break;
			case "object":
				if(this.validateCell(params)){
					params = {grid:params};
				}
			break;
		}
		if(typeof params == "object"){
			$.extend(this.vals,params);
			
			// Update grid size
			if(!$.isEmptyObject(params.grid)){
				tmp = this.read();
				this.renderGrid();
				this.print(tmp)
				if(this.editing){
					this.editing = false;
					this.edit();
				}
			}
			
			// Start Demo or new Cells / Iniciar modo demostracion o nueva poblacion de celulas
			if(!$.isEmptyObject(params.cells)){
				this.print(this.vals.cells);
				if(this.editing){
					return;
				}
				if(this.noChange){
					this.noChange = false;
					this.begin();
				}
			}else if(typeof params.demo != "undefined" && params.demo && ($.isEmptyObject(this.vals.cells) || this.noChange || !this.vals.start)){
				this.print(true);
				if(this.editing){
					return;
				}
				this.vals.start = true;
				this.noChange = false;
				this.begin();
			}
			if(this.editing){
				return;
			}
			// Update start
			if(typeof params.start != "undefined" && params.start){
				if(!$.isEmptyObject(this.vals.cells) || this.vals.demo){
					this.begin();
				}
			}
		}
	},
	renderGrid:function(){
		var c = 0,
			r = 0,
			self = this,
			i,j,$c,$r,vC,vR,width,height;
		
		// Min / Max grid sizes (private)
		// Tamaños Maximo y Minimo de la cuadricula (variable privada)
		gridLimits = [5,150];
		// Apply Min / Max size limits
		// Ajustar el tamaño dentro de los limites
		this.vals.grid[0] = (this.vals.grid[0] < gridLimits[0]) ? gridLimits[0] : (this.vals.grid[0] > gridLimits[1]) ? gridLimits[1] : this.vals.grid[0];
		this.vals.grid[1] = (this.vals.grid[1] < gridLimits[0]) ? gridLimits[0] : (this.vals.grid[1] > gridLimits[1]) ? gridLimits[1] : this.vals.grid[1];
		
		c = this.vals.grid[0];
		r = this.vals.grid[1];
		this.vGrid = [];
		this.$grid = $("<div>");
		this.$grid.attr("id","GRID");
		for(i=0;i<r;i++){
			vR = [];
			$r = $("<div>");
			$r.addClass("row").attr("id","row"+i);
			for(j=0;j<c;j++){
				vC = false;
				$c = $("<div>");
				$c.addClass("cell").addClass("n"+j);
				$r.append($c);
				vR.push(vC);
			}
			this.$grid.append($r)
			this.vGrid.push(vR);
		}
		this.vals.$el.html(this.$grid);
		
		setTimeout(function(){
			// Fix grid size / Fijar el tamaño de la cuadricula
			width = (parseInt(self.$grid.find(".cell").css("width"))*self.vals.grid[0])+self.vals.grid[0];
			height = (parseInt(self.$grid.find(".cell").css("height"))*self.vals.grid[1])+self.vals.grid[1];
			self.$grid.css({width:width+"px",height:height+"px"});
		},100)
	},
	next:function(){
		var c = this.vals.grid[0],
			r = this.vals.grid[1],
			cGrid = [],
			self = this,
			neighbors,i,j,item;
			
		if(!this.vals.start){
			return;
		}
		for(i=0;i<r;i++){
			cGrid[i]=[];
			for(j=0;j<c;j++){
				item = this.vGrid[i][j];
				neighbors = this.getNeighbors(i,j);
				cGrid[i][j] = this.applyRules(neighbors,item);
			}
		}
		if(this.vGrid.join(",") == cGrid.join(",")){
			this.noChange = true;
		}
		this.vGrid = cGrid;
		this.print();
		this.begin();
	},
	getNeighbors:function(r,c){
		var i,j,tR,tC,res=[];
		// Scan for neighbors' status / Busca los estados de los vecinos
		
		for(i=(r-1);i<=(r+1);i++){
			for(j=(c-1);j<=(c+1);j++){
				tC = (j < 0) ? this.vals.grid[0]-1 : (j >= this.vals.grid[0]) ? 0 : j;
				tR = (i < 0) ? this.vals.grid[1]-1 : (i >= this.vals.grid[1]) ? 0 : i;
				// Exclude self status / Excluye el status de si mismo
				if(tR != r || tC != c){
					res.push(this.vGrid[tR][tC]);
				}
			}
		}
		return res;
	},
	applyRules:function(n,item){
		var aCount = 0,
			len=n.length,
			i,
			nextState = false;
		// Count alive neighbors / Cuenta los vecinos vivos
		for(i=0;i<len;i++){
			if(n[i]){
				aCount++;
			}
		}
		// Rules / Reglas
		if(item){
			// Source Wikipedia
			// Any live cell with fewer than two live neighbours dies, as if caused by under-population.
			// Any live cell with two or three live neighbours lives on to the next generation.
			// Any live cell with more than three live neighbours dies, as if by overcrowding.
			
			// Fuente Wikipedia (editado)
			// Una celula viva con 2 e 3 celulas vecinas vivas sigue viva, en otro caso muere.
			nextState = (aCount == 3 || aCount == 2) ? true : false ;
		}else{
			// Source Wikipedia
			// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
			
			// Fuente Wikipedia (editado)
			// Una celula muerta con exactamente 3 celulas vecinas vivas "nace".
			nextState = (aCount == 3) ? true : false ;
		}
		return nextState;
	},
	print:function(data){
		var c = this.vals.grid[0],
			r = this.vals.grid[1],
			data = data || false,
			i,j,$c,$r,$grid,vC,vR;
		if(data){
			this.reset();
			if(data instanceof Array){
				this.load(data);
			}else{
				this.load(this.vals.demoData);
			}
		}
		$(".cell").removeClass("live");
		for(i=0;i<r;i++){
			for(j=0;j<c;j++){
				if(this.vGrid[i][j]){
					this.$grid.find("#row"+i+" .cell.n"+j).addClass("live");
				}
			}
		}
	},
	reset: function(){
		this.renderGrid();
	},
	load: function(data){
		var i,len,cell;
		// Validate data / Validar informacion
		if(data instanceof Array && data.length > 0){
			this.reset();
			for(i=0,len=data.length;i<len;i++){
				cell = data[i];
				if(this.validateCell(cell)){
					this.vGrid[cell[0]][cell[1]] = true;
				}
			}
		}
	},
	validateCell: function(cell){
		// Check format / Revisar el formato
		var res = (!cell instanceof Array || cell.length != 2 || typeof cell[0] != "number" || typeof cell[1] != "number") ? false : true;
		// Validate position / Revisar que la posicion sea valida
		res = (cell[0] < 0 || cell[0] >= this.vals.grid[0]) ? false : res;
		res = (cell[1] < 0 || cell[1] >= this.vals.grid[1]) ? false : res;
		return res;
	},
	begin: function(){
		var self = this;
		// Calculate next gen / Calcular la siguiente generacion
		if(!this.noChange){
			setTimeout(function(){self.next();},this.vals.speed);
		}
		if(this.editing){
			this.editEnd();
		}
	},
	read: function(){
		var lecture = [];
		this.$grid.find(".cell").each(function(){
			var $el = $(this),
				row = parseInt($el.parent().attr("id").replace("row","")),
				col = parseInt($el.attr("class").replace("cell n",""));
			if($el.hasClass("live")){
				lecture.push([row,col])
			}
		});
		return lecture;
	},
	edit: function(){
		if(this.editing){
			return;
		}
		this.vals.start = false;
		this.editing = true;
		this.$grid.find(".cell").on("click",function(){
			var $el = $(this);
			if($el.hasClass("live")){
				$el.removeClass("live");
			}else{
				$el.addClass("live");
			}
		});
	},
	editEnd: function(){
		if(!this.editing){
			return;
		}
		var newCells = this.read();
		this.$grid.find(".cell").off("click");
		this.editing = false;
		this.noChange = false;
		this.update({cells:newCells,start:true});
	},
	genCSS: function(){
		var css = "",$el=null;
		if($("GRIDCSS").length<=0){
			css += "#GRID{background-color:white;border-bottom:1px solid #CCC;border-right:1px solid #CCC;}";
			css += "#GRID .cell{border-left: 1px solid #CCC;border-top: 1px solid #CCC;height:10px;float:left;width:10px;}";
			css += "#GRID .row{clear:both;}";
			css += "#GRID .cell.live{background-color:black;}";
			$el = $("<style>");
			$el.attr("id","GRIDCSS").append(css);
			$("body").append($el);
		}
	}
}
// jQuery Plugin
$.fn.extend({
	GoL: function(params) {
		return this.each(function() {
			var $this = $(this), GoL = $this.data("GoL");
			if (!GoL){
				params = params || {};
				GoL = new $.GoL($this,params);
				$this.data("GoL", GoL);
			}else{
				$this.data("GoL").update(params);
			}
		});
	}
});
