export default function(p5)
{
	let data_raw;

	let aggregate_brand;
	let aggregate_problem;
	let aggregate_full;
	let aggregate_filtered;

	let highlight = false;
	let highlight_brand;

	let y_brand = {};
	let y_problem = {};

	const margins = 20;
	const separation = 5;
	const border_width = 10;

	const brand_space = 120;
	const problem_space = 180;
	const curvature = 400;

	const max_problems = 5;
	const max_brands = 5;

	const brand_y_multiplicator = 600 - 2 * margins - max_brands * separation + separation;
	const problem_y_multiplicator = 600 - 2 * margins - max_problems * separation + separation;

	const magic_brand	=	item => aggregate_brand.data[item.obj.Brand] ? item.obj.Brand : "Others";
	const magic_problem	=	item => aggregate_problem.data[item.obj.Problem] ? item.obj.Problem : "Others";

	let parse_data = function()
	{
		aggregate_brand		=	tab_util.aggregate(data_raw.rows, item => item.obj.Brand).sort_last("Unknown").keep_first(max_brands);
		aggregate_problem	=	tab_util.aggregate(data_raw.rows, item => item.obj.Problem).keep_first(max_problems);
		aggregate_full 		=	tab_util.aggregate(data_raw.rows, item => [ magic_brand(item), magic_problem(item) ]);

		let yb = margins;

		for(let brand of aggregate_brand.sorted) {
			y_brand[brand] = { top: yb };

			for(let problem of aggregate_problem.sorted) {
				y_brand[brand][problem] = yb;
				yb += (aggregate_full.data[[brand, problem]] / aggregate_full.total) * brand_y_multiplicator;
			}

			yb += separation;
		}

		let yp = margins;

		for(let problem of aggregate_problem.sorted) {
			y_problem[problem] = { top: yp };

			for(let brand of aggregate_brand.sorted) {
				y_problem[problem][brand] = yp;
				yp += (aggregate_full.data[[brand, problem]] / aggregate_full.total) * problem_y_multiplicator;
			}

			yp += separation;
		}
	}

	let filter_data = function()
	{
		let data_filtered = data_raw.rows.filter(item => magic_brand(item) == highlight_brand);
		aggregate_filtered = tab_util.aggregate(data_filtered, magic_problem);
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
		p5.colorMode(p5.HSB, max_brands, 1, 1);
		p5.background(0.04);
		p5.textSize(14);

		draw_chart();
	}

	p5.mouseMoved = function() {
		highlight =	p5.mouseX > 0
				&&	p5.mouseX < brand_space
				&&	p5.mouseY > margins
				&&	p5.mouseY < p5.height - margins;

		if(highlight) {
			for(let brand of aggregate_brand.sorted)
				if(p5.mouseY > y_brand[brand].top)
					highlight_brand = brand;

			filter_data();
		}

		p5.redraw();
	}

	let draw_chart = function()
	{
		p5.textAlign(p5.RIGHT, p5.CENTER);
		p5.noStroke();

		let y = margins;

		for(let i in aggregate_brand.sorted) {
			let brand = aggregate_brand.sorted[i];

			p5.fill(i, 1, 1);
			let h = (aggregate_brand.data[brand] / aggregate_brand.total) * brand_y_multiplicator;

			p5.rect(brand_space + margins - border_width, y, border_width, h);

			p5.fill(i, 0.5, 1);
			p5.text(`${brand} - ${(100 * aggregate_brand.data[brand] / aggregate_brand.total).toFixed(1)}%`, brand_space, y + h / 2);

			y += h + separation;
		}

		let problem_source	= highlight
							? aggregate_filtered
							: aggregate_problem;

		p5.textAlign(p5.LEFT, p5.CENTER);
		y = margins;

		for(let i in aggregate_problem.sorted) {
			let problem = aggregate_problem.sorted[i];

			p5.fill(1 - i % 2 / 2);
			let h = (aggregate_problem.data[problem] / aggregate_problem.total) * problem_y_multiplicator;

			p5.rect(p5.width - problem_space - margins, y, border_width, h);

			p5.fill(1 - i % 2 / 4);
			p5.text(`${problem} - ${(100 * problem_source.data[problem] / problem_source.total).toFixed(1)}%`, p5.width - problem_space, y + h / 2);

			y += h + separation;
		}

		let brands	= highlight
					? aggregate_brand.copy_sort_nth(highlight_brand, 0)
					: aggregate_brand.sorted;

		for(let brand of brands.toReversed()) {
			let id = aggregate_brand.sorted.indexOf(brand);

			let opacity	= highlight && brand != highlight_brand
						? 0.2
						: 0.8; 

			for(let problem of aggregate_problem.sorted) {
				p5.fill(id, 1, 1, opacity);
				let h = (aggregate_full.data[[brand, problem]] / aggregate_full.total) * brand_y_multiplicator;

				let y_left = y_brand[brand][problem];
				let y_right = y_problem[problem][brand];

				p5.beginShape();
				p5.vertex(brand_space + margins, y_left);
				p5.bezierVertex(
					brand_space + margins + curvature, y_left,
					p5.width - problem_space - margins - curvature, y_right,
					p5.width - problem_space - margins, y_right
				);

				p5.vertex(p5.width - problem_space - margins, y_right + h);
				p5.bezierVertex(
					p5.width - problem_space - margins - curvature, y_right + h,
					brand_space + margins + curvature, y_left + h,
					brand_space + margins, y_left + h
				);
				p5.endShape(p5.CLOSE);
			}
		}
	}
}

