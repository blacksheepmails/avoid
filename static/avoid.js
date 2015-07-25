var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var rect = canvas.getBoundingClientRect();
var me = {x: 0, y: 0}
var monsters = [];

//var socket = io.connect('http://localhost:5000/avoid_data');

canvas.onmousemove = function(e){
	me = mouseToPoint(e);
}

function mouseToPoint(e) {
	return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}

function Monster(size, speed, point) {
	this.size = (typeof size === 'undefined')? Math.random()*20: size;
	this.speed = (typeof speed === 'undefined')? Math.random()*2: speed;
	this.point = (typeof point === 'undefined')? {x: Math.random()*canvas.width,
												  y: Math.random()*canvas.height}:
												  point;
	this.draw = function() {
		ctx.beginPath();
		ctx.arc(this.point.x, this.point.y, this.size, 0, 2*Math.PI);
		ctx.stroke();
	}
	this.moveTowards = function(point, speed) {
		if (typeof speed === 'undefined') speed = this.speed;
		var dx = point.x - this.point.x;
		var dy = point.y - this.point.y;
		var n = Math.pow(dx, 2) + Math.pow(dy, 2);
		this.point.x += speed * (dx / Math.sqrt(n));
		this.point.y += speed * (dy / Math.sqrt(n));
	}
	this.isTouching = function(point) {
		return this.distFrom(point) <= this.size;
	}
	this.distFrom = function(point) {
		var dx = point.x - this.point.x;
		var dy = point.y - this.point.y;
		return Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
	}
	this.isOverlapping = function(monster) {
		return this.distFrom(monster.point) <= this.size + monster.size;
	}
	this.unOverlap = function() {
		for (var c = 0; c < monsters.indexOf(this); c++) {
			var monster = monsters[c];
			var speed = -1 * (this.speed + monster.speed)
			//var speed = -1*this.speed; //need at least this to be stablely not overlapping, but will cause temporary overlap
			if (this.isOverlapping(monster)) this.moveTowards(monster.point, speed);
		}
	}
	this.repel = function(k) {
		for (var c = 0; c < monsters.length; c++) {
			var monster = monsters[c];
			if (monster === this) continue;
			var speed = -1 * k * (1/Math.sqrt(this.distFrom(monster.point))) * this.speed;
			this.moveTowards(monster.point, speed);
		}
	}
}

function moveSolids(){
	monsters.sort(function(a, b){
		return a.distFrom(me) - b.distFrom(me)
	});
	monsters.map(function(monster){
		if (monster.isTouching(me)) console.log('nooo!');
		monster.draw();
		monster.unOverlap();
		monster.moveTowards(me);
	});
}

function moveRepel(k){
	if (typeof k === 'undefined') k = 0.6;
	monsters.map(function(monster){
		if (monster.isTouching(me)) console.log('nooo!');
		monster.draw();
		monster.repel(k);
		monster.moveTowards(me);
	});
}

function main(){
	for (var c = 0; c < 30; c++) monsters.push(new Monster());
	setInterval(function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		moveRepel(-1); 
	}, 20);
}