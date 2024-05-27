
// class World

// const canvas = document.querySelector('#canvas');
// const ctx = canvas.getContext('2d');

// const width = canvas.width = window.innerWidth;
// const height = canvas.height = window.innerHeight;
// let i = 0;
// let v = 0;
// let gradient;
// let percentage = 0;
// let length = 2 * Math.PI / .01;

// const render = function(dt) {
// 	ctx.clearRect(0, 0, width, height);

// 	gradient = ctx.createLinearGradient(width / 2 - 100, height / 2 - 100, width / 2 + 100, height / 2 + 100);
// 	gradient.addColorStop(0, "yellow");
// 	gradient.addColorStop(1, "red");
// 	ctx.strokeStyle = gradient;
// 	ctx.fillStyle = 'red';
// 	ctx.shadowBlur = 20;
// 	ctx.shadowColor = 'yellow';
// 	ctx.beginPath();
// 	ctx.arc(width / 2, height / 2, 100, 0, i);
// 	ctx.stroke();
// 	ctx.lineWidth = 15;
// 	ctx.font = '48px sans-serif';
// 	ctx.fillText(percentage.toFixed(0) + "%", width / 2 - 55, height / 2 + 20);

// 	if(i < 1.5 * Math.PI) {
// 		percentage += 100 / length;
// 		i += .01;
// 	}requestAnimationFrame(this.frame.bind(this));
// 	console.log(i);
// 	requestAnimationFrame(render);
// 	console.log('length' + length);
// };
// requestAnimationFrame(render);

class Vec {
	constructor(x, y) {
		this.x = x ?? 0;
		this.y = y ?? 0;
	}

	copy() {
		return new Vec(this.x, this.y);
	}

	sum(vec) {
		return new Vec(this.x + vec.x, this.y + vec.y);
	}

	sub(vec) {
		return new Vec(vec.x - this.x, vec.y - this.y);
	}

	mul(num) {
		return new Vec(this.x * num, this.y * num);
	}

	div(num) {
		return new Vec(this.x / num, this.y / num);
	}

	static getRandom(min, max) {
		return min + Math.random() * (max - min);
	}
}

class World {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.width = canvas.width = window.innerWidth;
		this.height = canvas.height = window.innerHeight;
		this.mouse = {x: this.width / 2, y: this.height / 2};
		this.snowfalls = [];
		this.influence = false;
		this.mousedown = false;

		this.canvas.addEventListener('mousemove', (e) => {
			this.influence = true;
			[this.mouse.x, this.mouse.y] = [e.clientX, e.clientY];
		});

	}

	addSnowfall(config) {
		this.snowfalls.push(new Snowfall(config));
	}

	removeSnowfall(index) {
		this.snowfalls.splice(index, 1);
	}

	update() {
		for(let snowfall of this.snowfalls)
			snowfall.update();
	}

	draw() {
		for(let snowfall of this.snowfalls)
			snowfall.draw();
	}

	run() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.update();
		this.draw();
		requestAnimationFrame(this.run.bind(this));
	}
}

class Snowfall {
	constructor(config) {
		this.world = config.world;
		this.position = config.position ?? new Vec();
		this.velocity = config.velocity;
		this.scatter = config.scatter ?? 20;
		this.size = config.size ?? 10;
		this.lifetime = config.lifetime ?? 20;
		this.color = config.color ?? "#fff";
		this.maxSnowFlakes = config.maxSnowFlakes ?? 30;
		this.maxDistance = config.maxDistance ?? 100;
		this.portion = config.portion ?? 5;
		this.snowFlakes = [];
		this.dependings = [];
	}

	addSnowFlake() {
		this.snowFlakes.push(new SnowFlake({
			world: this.world,
			snowfall: this,
			position: new Vec(Vec.getRandom(30, this.world.width - 30), 0),
			velocity: new Vec(0, Vec.getRandom(5, 10)),
			size: this.size,
			color: this.color,
		}));
	}

	removeSnowFlake(index) {
		this.snowFlakes.splice(index, 1);
	}

	update() {
		if(this.snowFlakes.length < this.maxSnowFlakes)
			this.addSnowFlake();

		for(let i = 0; i < this.snowFlakes.length; i++) {
			if(this.snowFlakes[i].getDistance(this.world.mouse) < this.maxDistance && this.world.mouse.y > this.snowFlakes[i].position.y && this.world.influence) {
				this.dependings.push(this.snowFlakes[i]);
			}
			else {
				this.snowFlakes[i].depending = false;
				this.snowFlakes[i].magneted = false;
				this.snowFlakes[i].update(i);
				this.dependings.splice(i, 1);
			}
		}

		for(let depend of this.dependings)
			depend.updateDepending();
	}

	draw() {	
		for(let snowFlake of this.snowFlakes)
			snowFlake.draw();
	}
}

class SnowFlake {
	constructor(config) {
		this.world = config.world;
		this.snowfall = config.snowfall;
		this.position = config.position;
		this.velocity = config.velocity;
		this.size = config.size;
		this.color = config.color;
		this.depending = false;
		this.magneted = false;
	}

	getDistance(mouse) {
		return Math.hypot(mouse.x - this.position.x, mouse.y - this.position.y);
	}

	moveTo(mouse) {
		this.position = this.position.sum(this.position.sub(this.world.mouse).div(60));
	}

	updateDepending() {
		console.log(this.world.mouse);
		this.moveTo(this.world.mouse);
	}

	update(i) {
		if(this.magneted) {
			this.moveTo(this.world.mouse);
			this.magneted = false;
		}
		else if(this.depending) {
			this.moveTo(this.world.mouse);
			//this.depending = false;
		}
		else
			this.position.y > 1050 ? this.snowfall.removeSnowFlake(i) : this.position = this.position.sum(this.velocity);
	}

	draw() {
		const gradient = this.world.ctx.createRadialGradient(this.position.x, this.position.y,
			0, this.position.x, this.position.y, this.size
		);
		gradient.addColorStop(0, 'gray');
		gradient.addColorStop(0, this.color);

		this.world.ctx.fillStyle = gradient;
		this.world.ctx.beginPath();
		this.world.ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
		this.world.ctx.fill();
	}
}

const canvas = document.querySelector('canvas');
const world = new World(canvas);

world.addSnowfall({
	world: world,
	mouse: new Vec(),
	color: "#fff",
	position: new Vec(500, 50),
	velocity: new Vec(0, 5),
	scatter: 20,
	size: 10,
	maxSnowFlakes: 200,
	maxDistance: 300,
});

world.run();