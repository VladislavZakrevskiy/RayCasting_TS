import { ImagePack } from './ImagePack';
import { Map } from './Map';
import { Player } from './Player';

export class Camera {
	ctx: CanvasRenderingContext2D;
	width = 0;
	height = 0;
	resolution = 0;
	spacing = 0;
	focalLength = 0;
	range = 0;
	lightRange = 0;
	scale = 0;

	constructor(
		canvas: HTMLCanvasElement,
		resolution: number,
		focalLength: number
	) {
		this.ctx = canvas.getContext('2d')!;
		this.width = canvas.width = window.innerWidth * 0.5;
		this.height = canvas.height = window.innerHeight * 0.5;
		this.resolution = resolution;
		this.spacing = this.width / resolution;
		this.focalLength = focalLength || 0.8;
		this.range = 14;
		this.lightRange = 5;
		this.scale = (this.width + this.height) / 1200;
	}

	render(player: Player, map: Map) {
        this.drawSky(player.direction, map.skybox, map.light);
        this.drawColumns(player, map);
        this.drawWeapon(player.weapon, player.paces);
    }

	drawSky(direction: number, sky: ImagePack, ambient: number) {
		const width = sky.width * (this.height / sky.height) * 2;
		const left = (direction / 2) * Math.PI * -width;

		this.ctx.save();
		this.ctx.drawImage(sky.image, left, 0, width, this.height);
		if (left < width - this.width) {
			this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
		}
		if (ambient > 0) {
			this.ctx.fillStyle = '#ffffff';
			this.ctx.globalAlpha = ambient * 0.1;
			this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
		}
		this.ctx.restore();
	}

	drawColumns(player: Player, map: Map) {
		this.ctx.save();
		for (let column = 0; column < this.resolution; column++) {
			const x = column / this.resolution - 0.5;
			const angle = Math.atan2(x, this.focalLength);
			const ray = map.cast(player, player.direction + angle, this.range);
			this.drawColumn(column, ray, angle, map);
		}
		this.ctx.restore();
	}

	drawColumn(column: number, ray: any[], angle: number, map: Map) {
		const ctx = this.ctx;
		const texture = map.wallTexture;
		const left = Math.floor(column * this.spacing);
		const width = Math.ceil(this.spacing);
		let hit = -1;

		while (++hit < ray.length && ray[hit].height <= 0);

		for (let s = ray.length - 1; s >= 0; s--) {
			const step = ray[s];
			let rainDrops = Math.pow(Math.random(), 3) * s;
			const rain = rainDrops > 0 && this.project(0.1, angle, step.distance);

			if (s === hit) {
				const textureX = Math.floor(texture.width * step.offset);
				const wall = this.project(step.height, angle, step.distance);

				ctx.globalAlpha = 1;
				ctx.drawImage(
					texture.image,
					textureX,
					0,
					1,
					texture.height,
					left,
					wall.top,
					width,
					wall.height
				);

				ctx.fillStyle = '#000000';
				ctx.globalAlpha = Math.max(
					(step.distance + step.shading) / this.lightRange - map.light,
					0
				);
				ctx.fillRect(left, wall.top, width, wall.height);
			}

			ctx.fillStyle = '#ffffff';
			ctx.globalAlpha = 0.15;
			while (--rainDrops > 0)
				ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
		}
	}

	drawWeapon(weapon: ImagePack, paces: number) {
        const bobX = Math.cos(paces * 2) * this.scale * 6;
        const bobY = Math.sin(paces * 4) * this.scale * 6;
        const left = this.width * 0.66 + bobX;
        const top = this.height * 0.6 + bobY;
        this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
    }

	project(distance: number, angle: number, height: number) {
		const z = distance * Math.cos(angle);
		const wallHeight = (this.height * height) / z;
		const bottom = (this.height / 2) * (1 + 1 / z);
		return {
			top: bottom - wallHeight,
			height: wallHeight,
		};
	}
}
