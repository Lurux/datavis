export default function(p5)
{
	let data_raw;

	let aggregate_brand;
	let aggregate_problem;
	let aggregate_full;

	const margins = 20;
	const brand_space = 120;
	const problem_space = 180;
	const border_width = 10;
	const curvature = 400;

	const max_problems = 5;
	const max_brands = 5;

	let parse_data = function()
	{
		let magic_combine = (item) => [
			aggregate_brand.data[item.obj.Brand]		? item.obj.Brand	: "Others",
			aggregate_problem.data[item.obj.Problem]	? item.obj.Problem	: "Others"
		];

		aggregate_brand		=	tab_util.aggregate(data_raw.rows, item => item.obj.Brand).sort_last("Unknown").keep_first(max_brands);
		aggregate_problem	=	tab_util.aggregate(data_raw.rows, item => item.obj.Problem).keep_first(max_problems);
		aggregate_full 		=	tab_util.aggregate(data_raw.rows, magic_combine);
	}

	p5.preload = function()
	{
		data_raw = p5.loadTable("data/ewaste.csv", "csv", "header");
	}

	p5.setup = function()
	{
		parse_data();

		p5.createCanvas(1200, 600);
		p5.noLoop();
	}

	p5.draw = function()
	{
		p5.background(10, 10, 10);
		p5.textSize(14);

		draw_chart();
	}

	let draw_chart = function()
	{
		p5.textAlign(p5.RIGHT, p5.CENTER);
		p5.colorMode(p5.HSB, max_brands, 1, 1);
		p5.noStroke();

		let y = margins;
		let c = 0;

		for(let brand of aggregate_brand.sorted) {
			p5.fill(c, 1, 1);
			let h = (aggregate_brand.data[brand] / aggregate_brand.total) * (p5.height - 2 * margins);

			p5.rect(brand_space + margins - border_width, y, border_width, h);
			
			p5.fill(c++, 0.5, 1);
			p5.text(`${brand} - ${(100 * aggregate_brand.data[brand] / aggregate_brand.total).toFixed(1)}%`, brand_space, y + h / 2);
	
			y += h;
		}

		p5.textAlign(p5.LEFT, p5.CENTER);
		let y_right = {};

		y = margins;
		c = 0;

		for(let problem of aggregate_problem.sorted) {
			p5.fill(1 - c % 2 / 2);
			let h = (aggregate_problem.data[problem] / aggregate_problem.total) * (p5.height - 2 * margins);

			p5.rect(p5.width - problem_space - margins, y, border_width, h);

			p5.fill(1 - c++ % 2 / 4);
			p5.text(`${problem} - ${(100 * aggregate_problem.data[problem] / aggregate_problem.total).toFixed(1)}%`, p5.width - problem_space, y + h / 2);
	
			y += h;
			y_right[problem] = y;
		}

		y = p5.height - margins;
		c = max_brands;

		for(let brand of aggregate_brand.sorted.toReversed()) {
			c--;

			for(let problem of aggregate_problem.sorted.toReversed()) {
				p5.fill(c, 1, 1, 0.8);
				let h = (aggregate_full.data[[brand, problem]] / aggregate_full.total) * (p5.height - 2 * margins);
	
				y -= h;
				y_right[problem] -= h;

				p5.beginShape();
				p5.vertex(brand_space + margins, y);
				p5.bezierVertex(brand_space + margins + curvature, y, p5.width - problem_space - margins - curvature, y_right[problem], p5.width - problem_space - margins, y_right[problem]);
			//	p5.vertex(p5.width - problem_space - margins, y_right[problem]);
				
				p5.vertex(p5.width - problem_space - margins, y_right[problem] + h);
				p5.bezierVertex(p5.width - problem_space - margins - curvature, y_right[problem] + h, brand_space + margins + curvature, y + h, brand_space + margins, y + h);
			//	p5.vertex(brand_space + margins, y + h);
				p5.endShape(p5.CLOSE);
			}
		}
	}
}

