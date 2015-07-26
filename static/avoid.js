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

function scalarMultiply(c, v) {
	return {x: c*v.x, y: c*v.y};
}

function dotProduct(v1, v2) {
	return {x: v1.x * v2.x, y: v1.y * v2.y};
}

function vectorAdd(v1, v2) {
	return {x: v1.x + v2.x, y: v1.y + v2.y};
}

function vectorMinus(v1, v2) {
	return vectorAdd(v1, scalarMultiply(-1, v2));
}

function unitize(v) {
	var k = Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2));
	var u = scalarMultiply(1/k, v);
	return {u: u, k: k};
}

function Monster(size, mass, speed, point, dir) {
	this.size = (typeof size === 'undefined' || size == null)? Math.random()*20 : size;
	this.speed = (typeof speed === 'undefined' || size == null)? Math.random()*2 : speed;
	this.point = (typeof point === 'undefined' || size == null)? {x: Math.random()*canvas.width,
												  				  y: Math.random()*canvas.height}:
												  				 point;
	this.mass = (typeof point === 'undefined' || size == null)? Math.pow(this.size,2) : mass;
	
	if (typeof dir === 'undefined') {
		var x = Math.random() - 0.5;
		var y = Math.random() - 0.5;
		n = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
		this.dir = {x: x/n, y: y/n};
	} else {
		this.dir = dir;
	}
	
	this.draw = function() {
		ctx.beginPath();
		ctx.arc(this.point.x, this.point.y, this.size, 0, 2*Math.PI);
		ctx.stroke();
	};
	
	this.moveTowards = function(point, speed) {
		if (typeof speed === 'undefined') speed = this.speed;
		var dx = point.x - this.point.x;
		var dy = point.y - this.point.y;
		var n = this.distFrom(point);
		this.dir = {x: dx/n, y: dy/n};
		this.move(speed);
	};
	
	this.isTouching = function(point) {
		return this.distFrom(point) <= this.size;
	};
	
	this.wallTouched = function() {
		if (this.point.x - this.size <= 0) return 'left';
		if (this.point.y - this.size <= 0) return 'top';
		if (this.point.x + this.size >= canvas.width) return 'right';
		if (this.point.y + this.size >= canvas.height) return 'bottom';
		return 'none';
	};
	
	this.distFrom = function(point) {
		var dx = point.x - this.point.x;
		var dy = point.y - this.point.y;
		return Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
	};
	
	this.isOverlapping = function(monster) {
		return this.distFrom(monster.point) <= this.size + monster.size;
	};
	
	this.unOverlap = function() {
		for (var c = 0; c < monsters.indexOf(this); c++) {
			var monster = monsters[c];
			var speed = -1 * (this.speed + monster.speed)
			//var speed = -1*this.speed; //need at least this to be stablely not overlapping, but will cause temporary overlap
			if (this.isOverlapping(monster)) this.moveTowards(monster.point, speed);
		}
	};
	
	this.repel = function(k) {
		for (var c = 0; c < monsters.length; c++) {
			var monster = monsters[c];
			if (monster === this) continue;
			var speed = -1 * k * (1/Math.sqrt(this.distFrom(monster.point))) * this.speed;
			this.moveTowards(monster.point, speed);
		}
	};
	
	this.calcMomentum = function() {
		return {x: this.mass * this.speed * this.dir.x,
				y: this.mass * this.speed * this.dir.y};
	};
	
	this.bounceMonster = function(monster) {
		var m1 = this.mass;
		var m2 = monster.mass;
		var u1 = scalarMultiply(this.speed, this.dir);
		var u2 = scalarMultiply(monster.speed, monster.dir);
		var v1 = scalarMultiply(
					1/(m1+m2),
					vectorAdd(
						scalarMultiply(m1 - m2, u1),
						scalarMultiply(2*m2, u2)));
		var v2 = vectorAdd(scalarMultiply(m1/m2, vectorMinus(u1, v1)), u2);
		v1 = unitize(v1);
		v2 = unitize(v2);
		this.speed = v1.k;
		this.dir = v1.u;
		monster.speed = v2.k;
		monster.dir = v2.u;
	};
	
	this.bounceWall = function(wall) {
		if (wall === 'left') this.dir.x = Math.abs(this.dir.x);
		if (wall === 'top') this.dir.y = Math.abs(this.dir.y);
		if (wall === 'right') this.dir.x = -1 * Math.abs(this.dir.x);
		if (wall === 'bottom') this.dir.y = -1 * Math.abs(this.dir.y);
	};
	
	this.moveBounce = function() {
		for (var c = 0; c < monsters.indexOf(this); c++) {
			var monster = monsters[c];
			var wall = this.wallTouched();
			if (wall !== 'none') {
				console.log(wall);
				this.bounceWall(wall);
				break;
			}
			if (this.isOverlapping(monster)) {
				this.bounceMonster(monster);
				break;
			}
		}
		this.move();
	};
	
	this.move = function(speed) {
		if (typeof speed === 'undefined') speed = this.speed;
		this.point.x += speed * this.dir.x;
		this.point.y += speed * this.dir.y;
	};
}

function moveSolids(){
	monsters.sort(function(a, b){
		return a.distFrom(me) - b.distFrom(me);
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

function moveBounce(){
	monsters.map(function(monster){
		if (monster.isTouching(me)) console.log('nooo!');
		monster.draw();
		monster.moveBounce();
	});
}

function main(){
	for (var c = 0; c < 50; c++) monsters.push(new Monster());
	setInterval(function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		moveBounce(); 
	}, 30);
}
