export default function(p5)
{
	const FIX_CANVAS = false;

	let data_raw;

	let aggregate_age;
	let aggregate_count;

	let parse_data = function()
	{
		let data_filtered = data_raw.rows.filter(item => !isNaN(item.obj.Age));

		aggregate_count	=	tab_util.aggregate(data_raw.rows, item => item.obj.Problem);
		aggregate_age	=	tab_util.aggregate(data_filtered, item => item.obj.Problem, item => item.obj.Age, 0, true);
		
		for(let problem in aggregate_age.data)
			aggregate_age.data[problem] = aggregate_age.data[problem] / aggregate_age.count[problem];

		aggregate_age.refresh_sort();
		
		window.aggregate_age = aggregate_age;
	}

	p5.preload = function()
	{
		data_raw = p5.loadTable("data/ewaste.csv", "csv", "header");
	}

	p5.setup = function()
	{
		parse_data();

		p5.createCanvas(1200, 800);
		p5.noLoop();
	}

	p5.draw = function()
	{
		p5.background(10, 10, 10);
		p5.textSize(14);

		drawRadialChart();
	}

	let drawRadialChart = function()
	{
		let maxCount = aggregate_count.maximum;
		let maxAge = aggregate_age.maximum;
		let radius = 500;
		let centerRadius = 60;

		p5.translate(p5.width / 2, p5.height / 2);
		p5.strokeJoin(p5.ROUND);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.colorMode(p5.HSB, aggregate_count.size, 1, 1);
		
	//	let gardient = p5.drawingContext.createConicGradient(0, 0, 0);
	//	TODO tmp / test
		let bg = p5.createGraphics(120 * (1 + FIX_CANVAS), 120 * (1 + FIX_CANVAS));

		// Draw rays based on percentage
		for (let i = 0; i < aggregate_count.size; i++)
		{
			let problem = aggregate_count.sorted[i];

			let angle = p5.map(i, 0, aggregate_count.size, 0, p5.TWO_PI);
			let rayLength = p5.map(aggregate_age.data[problem], 0, maxAge, centerRadius, radius);

			let x1 = centerRadius * p5.cos(angle);
			let y1 = centerRadius * p5.sin(angle);

			let x2 = (centerRadius + rayLength) * p5.cos(angle);
			let y2 = (centerRadius + rayLength) * p5.sin(angle);

			let circleRadius = p5.map(aggregate_count.data[problem], 0, maxCount, 10, 100);
			let rayColor = p5.color(i, 1, 0.8);

			// Draw circles
			p5.noStroke();
			p5.fill(rayColor);
			p5.ellipse(x2, y2, circleRadius * 2);

			// Draw rays
			p5.fill("white");
			p5.stroke(rayColor);
			p5.strokeWeight(5);
			p5.line(x1, y1, x2, y2);

			// Draw labels
			let percentageLabel = `${problem}\n${(100 * aggregate_count.data[problem] / aggregate_count.total).toFixed(1)}%`;
			p5.stroke("black");
			p5.strokeWeight(3);
			p5.text(percentageLabel, x2, y2);

			bg.stroke(rayColor);
			bg.strokeWeight(15);
			bg.line(2 * x1 / 3 + 60, 2 * y1 / 3 + 60, x2 + 60, y2 + 60);
		}

		// Draw central point
		p5.noStroke();
		p5.fill("white");
	//	p5.drawingContext.fillStyle = gardient;
		p5.ellipse(0, 0, centerRadius * 2);
		
		bg.filter(p5.BLUR, 25);
		let i = bg.get();
		let im = p5.createGraphics(120, 120);
		im.noStroke();
		im.fill("red");
		im.ellipse(60, 60, centerRadius * 2);
		i.mask(im);
		p5.image(i, -60, -60);
	}
}

