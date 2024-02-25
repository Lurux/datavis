import w from "/util/pre-work.js";

export default function(p5)
{
	const width = 1200;
	const height = 2000;

	//	Parameters
	const min_count = 6;
	const num_problems = 10;

	const bar_min_count = 10;
	const pie_min_count = 6;
	const histogram_min_count = 5;
	const age_min_count = 5;

	const bar_problems = 10;
	const histogram_length = 6;

	const force_show_all = false;

	//	Geometry
	const row_height = 50;
	const top_height = 250;

	const bar_width = 350;
	const pie_width = row_height;
	const brand_width = 100;
	const histogram_width = 250;
	const age_width = 150;

	const row_margin = 10;
	const column_margin = 40;
	const small_margin = 5;
	const snippet_padding = 5;

	//	Pre-conputed crap
	const x_center = width / 2;

	const bar_left = x_center - brand_width / 2 - 2 * column_margin - pie_width - bar_width;
	const bar_center = bar_left + bar_width / 2;

	const pie_left = x_center - brand_width / 2 - column_margin - pie_width;
	const pie_center = pie_left + pie_width / 2;

	const histogram_left = x_center + brand_width / 2 + column_margin;
	const histogram_center = histogram_left + histogram_width / 2;

	const age_left = x_center + brand_width / 2 + 2 * column_margin + histogram_width;
	const age_center = age_left + age_width / 2;

	let selected_brands;
	let selected_problems;

	//	Interactive data
	let sort = "brand";
	let reverse = false;
	let hovering = null;

	//	Imported data
	let base_data;
	let aggregate_brand;
	let aggregate_problem;

	/***************************/
	/*  Loading & preparation  */
	/***************************/

	//	Load tables
	p5.preload = function()
	{
		base_data = p5.loadTable("data/ewaste.csv", "csv", "header");
	}

	//	Initial setup
	p5.setup = function()
	{
		extract_data();
		p5.createCanvas(width, height);
	}

	//	Parse data
	let extract_data = function()
	{
		let num_entries = base_data.getRowCount();
		let data_structured = [];

		for (let i = 0; i < num_entries; i++)
		{
			let raw_entry = base_data.getRow(i);

			data_structured.push({
				country:		raw_entry.get("Country"),
				brand:		raw_entry.get("Brand"),
				age:			raw_entry.get("Age"),
				age_eol:		raw_entry.get("Age EOL"),
				repaired:	raw_entry.get("Repair status"),
				problem:		raw_entry.get("Problem")
			});
		}

		aggregate_brand = w.aggregate(data_structured, "brand");
		aggregate_problem = w.aggregate(data_structured, "problem");

		selected_brands = w.sorted_keys(aggregate_brand.rows, row => row.count).filter(key => aggregate_brand.rows[key].count >= min_count);
		selected_problems = w.sorted_keys(aggregate_problem.rows, row => row.count).toSpliced(num_problems);
	}

	/*******************/
	/*  Sorting modes  */
	/*******************/

	p5.mouseClicked = function()
	{
		if(hovering == null) return;

		if(hovering == sort)
		{
			selected_brands.reverse();
			reverse = !reverse;
			return;
		}

		sort = hovering;
		reverse = false;

		let msort = sort.split('@')[0];
		let lsort = sort.split('@')[1];

		switch(sort)
		{
			case "pie":
				selected_brands.sort((a, b) => {
					let prop_a = aggregate_brand.rows[a].fields.repaired.counts["Repairable"] / aggregate_brand.rows[a].count;
					let prop_b = aggregate_brand.rows[b].fields.repaired.counts["Repairable"] / aggregate_brand.rows[b].count;
					return prop_b - prop_a;
				});
				break;
			case "brand":
				selected_brands.sort((a, b) => aggregate_brand.rows[b].count - aggregate_brand.rows[a].count);
				break;
			case "age:repair":
				selected_brands.sort((a, b) => aggregate_brand.rows[b].fields.age.average - aggregate_brand.rows[a].fields.age.average);
				break;
			case "age:dead":
				selected_brands.sort((a, b) => {
					let prop_a = aggregate_brand.rows[a].fields.repaired.counts["Repairable"] / aggregate_brand.rows[a].count;
					let prop_b = aggregate_brand.rows[b].fields.repaired.counts["Repairable"] / aggregate_brand.rows[b].count;
					return prop_b * aggregate_brand.rows[b].fields.age.average - prop_a * aggregate_brand.rows[a].fields.age.average;
				});
				break;
		}
	}

	/*****************/
	/*  Draw basics  */
	/*****************/

	p5.draw = function()
	{
		hovering = null;

		p5.background(gray_color(0.05));
		p5.textSize(14);
		p5.noStroke();

		draw_decor();

		for(let i in selected_brands)
		{
			let y_base = top_height + i * (row_height + row_margin);
			draw_row(selected_brands[i], y_base);
		}
	}

	let draw_row = function(brand, y_base, color)
	{
		p5.noStroke();

		draw_bar(brand, y_base);
		draw_pie(brand, y_base);
		draw_brand(brand, y_base);
		draw_histogram(brand, y_base);
		draw_age(brand, y_base);
	}

	/*********************/
	/*  Color & helpers  */
	/*********************/

	//	Generate grayscale color
	let gray_color = function(strength) {
		p5.colorMode(p5.RGB, 1, 1, 1, 1);
		return p5.color(strength);
	};

	//	Generate rainbow color
	let id_color = function(id, max, darkness, opacity = 1) {
		if(darkness < 0)
		{
			var saturation = 1 + darkness;
			darkness = 1
		}
	
		p5.colorMode(p5.HSB, max, 1, 1, 1);
		return p5.color(id, saturation ?? 1, darkness, opacity);
	};
	
	//	Display error text and return false if num < min
	//	Do nothing and return true if num >= min
	let check_num = function(min, num, x_center, y_center)
	{
		if(!force_show_all && num < min)
		{
			p5.fill(gray_color(0.5));
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.text("Not enough data", x_center, y_center);
			return false;
		}
		else return true;
	}

	//	Clickable sort snippet
	let snippet = function(text, x, y, mark, align = p5.CENTER, color = gray_color(0.5), mouseX = p5.mouseX, mouseY = p5.mouseY)
	{
		let w = p5.textWidth(text);

		let x_bound	= align == p5.CENTER
					? x - w / 2
					: x;
		let y_bound = y - 8;

		if(
			mouseX > x_bound
		&&	mouseX < x_bound + w + 2 * snippet_padding
		&&	mouseY > y_bound
		&&	mouseY < y_bound + 14 + 2 * snippet_padding
		)
		{
			p5.fill(gray_color(0.2));
			p5.rect(x_bound - snippet_padding, y_bound - snippet_padding, w + 2 * snippet_padding, 14 + 2 * snippet_padding);
			hovering = mark;
		}

		p5.fill(color);
		p5.textAlign(align, p5.CENTER);
		p5.text(text, x, y)

		if(mark == sort)
		{
			let arrow = reverse ? '▲' : '▼';
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.text(arrow, x_bound + w + 2 * snippet_padding, y);
		}
	}

	/****************/
	/*  Draw decor  */
	/****************/

	let draw_decor = function()
	{
		p5.fill(gray_color(0.5));
		p5.textAlign(p5.CENTER, p5.CENTER);

		//	Section titles
		p5.text("Percent of reasons for breakage", bar_center, row_height / 2);

		p5.text("Percent of", pie_center, top_height - row_height - 9);
		snippet("successful repairs", pie_center, top_height - row_height + 8, "pie");

		snippet("Brand", x_center, top_height - row_height, "brand");

		p5.text("Breakages over time", histogram_center, top_height - 1.5 * row_height - 9);
		p5.text("Relative to sales, Arbitrary unit", histogram_center, top_height - 1.5 * row_height + 8);

		snippet("Top: Average age before repair", age_center, top_height - 1 * row_height - 9, "age:repair");
		snippet("Bottom: Average age before dead", age_center, top_height - 1 * row_height + 8, "age:dead");

		//	Bar reasons for breakage
		let step = bar_width / (selected_problems.length + 1);

		p5.translate(bar_left + step / 2, top_height - row_height / 2);
		p5.rotate(-p5.HALF_PI);
		p5.textAlign(p5.LEFT, p5.CENTER);

		for(let i = 0; i < selected_problems.length; i++)
		{
			let color = id_color(i, selected_problems.length, -0.2);
			snippet(selected_problems[i], 0, i * step, "bar@" + selected_problems[i], p5.LEFT, color, -p5.mouseY + top_height - row_height / 2, p5.mouseX - (bar_left + step / 2));
		}
		
		p5.fill(gray_color(0.6));
		p5.text("Others", 0, selected_problems.length * step);

		p5.rotate(p5.HALF_PI);
		p5.translate(-(bar_left + step / 2), -(top_height - row_height / 2));

		//	Histogram ages
		p5.fill(gray_color(0.5));
		step = histogram_width / (histogram_length - 1);
		p5.textAlign(p5.CENTER, p5.CENTER);

		for(let i = 0; i < histogram_length; i += 1)
		{
			p5.text(i + 'y', histogram_left + i * step, top_height - row_height / 2);
		}

		//	Histogram bars
		p5.noFill();
		p5.stroke(gray_color(0.2));
		p5.strokeWeight(1);

		step = histogram_width / (histogram_length - 1);
		for(let i = 0; i < histogram_length; i += 1)
		{
			p5.line(histogram_left + i * step, top_height + selected_brands.length * (row_height + row_margin), histogram_left + i * step, top_height);
		}
	}

	/*********************/
	/*  Draw components  */
	/*********************/
	
	//	Problem bar chart
	let draw_bar = function(brand, y_base, color)
	{
		let y_center = y_base + row_height / 2;
		if(!check_num(bar_min_count, aggregate_brand.rows[brand].count, bar_center, y_center)) return;
	
		p5.fill(gray_color(0.2));
		p5.rect(bar_left, y_base, bar_width, row_height);
		
		let x = bar_left + small_margin;

		for(let i in selected_problems)
		{
			let problem = selected_problems[i];
			let width = p5.map((aggregate_brand.rows[brand].fields.problem.counts[problem] ?? 0), 0, aggregate_brand.rows[brand].count, 0, bar_width - 2 * small_margin);
			p5.fill(id_color(i, selected_problems.length, 0.8));
			p5.rect(x, y_base + small_margin, width, row_height - 2 * small_margin);
			x += width;
		}
		
		let sum_others = w.sum_others(aggregate_brand.rows[brand].fields.problem.counts, selected_problems);
		let width = p5.map(sum_others, 0, aggregate_brand.rows[brand].count, 0, bar_width - 2 * small_margin);
		p5.fill(gray_color(0.6));
		p5.rect(x, y_base + small_margin, width, row_height - 2 * small_margin);
	}
	
	//	Draw successful repair pie chart
	let draw_pie = function(brand, y_base, color)
	{	
		let y_center = y_base + row_height / 2;
		if(!check_num(pie_min_count, aggregate_brand.rows[brand].count, pie_center, y_center)) return;
		
		let angle = p5.map(aggregate_brand.rows[brand].fields.repaired.counts["Repairable"] / aggregate_brand.rows[brand].count, 0, 1, 0, p5.TWO_PI);

		p5.fill(gray_color(0.2));
		p5.circle(pie_center, y_center, row_height);
		p5.fill("green");
		p5.arc(pie_center, y_center, pie_width, row_height, 0, angle);

		p5.fill("white");
		p5.text((100 * aggregate_brand.rows[brand].fields.repaired.counts["Repairable"] / aggregate_brand.rows[brand].count).toFixed(0), pie_center, y_center);
	}

	//	Draw brand name
	let draw_brand = function(brand, y_base, color)
	{
		let y_center = y_base + row_height / 2;

		p5.fill("white");
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(20);
		p5.text(brand, x_center, y_center);
		p5.textSize(14);
	}

	//	Draw breakage histogram
	let draw_histogram = function(brand, y_base, color)
	{		
		let y_center = y_base + row_height / 2;
		if(!check_num(histogram_min_count,aggregate_brand.rows[brand].fields.age.numeric_count, histogram_center, y_center)) return;

		p5.fill("cyan");
		p5.beginShape();

		for(let i = 0; i < histogram_length; i++)
		{
			let x = p5.map(i, 0, histogram_length - 1, 0, histogram_width);
			let y = p5.map((aggregate_brand.rows[brand].fields.age.counts[i] ?? 0) / aggregate_brand.rows[brand].fields.age.sum, 0, 0.2, 0, row_height / -2);
			
			p5.vertex(x + histogram_left, y + y_center);
		}

		for(let i = histogram_length - 1; i >= 0; i--)
		{
			let x = p5.map(i, 0, histogram_length - 1, 0, histogram_width);
			let y = p5.map((aggregate_brand.rows[brand].fields.age.counts[i] ?? 0) / aggregate_brand.rows[brand].fields.age.sum, 0, 0.2, 0, row_height / 2);
			
			p5.vertex(x + histogram_left, y + y_center);
		}

		p5.endShape(p5.CLOSE);
	}

	//	Draw average age before broken or dead
	let draw_age = function(brand, y_base, color)
	{
		let y_center = y_base + row_height / 2;
		if(!check_num(age_min_count, aggregate_brand.rows[brand].fields.age.numeric_count, age_center, y_center)) return;

		let max_age = aggregate_brand.max.fields.age.average;

		//	Average age repair
		let brand_age_width = p5.map(aggregate_brand.rows[brand].fields.age.average, 0, max_age, 0, age_width);
		p5.fill(id_color(0.1, 1, 0.8));
		p5.rect(age_left, y_base, brand_age_width, row_height / 2);

		p5.fill("white");
		p5.textAlign(p5.RIGHT, p5.CENTER);
		p5.text(aggregate_brand.rows[brand].fields.age.average.toFixed(1) + 'y', age_left + brand_age_width - small_margin, y_center - row_height / 4);

		//	Average age dead
		let proportion = aggregate_brand.rows[brand].fields.repaired.counts["Repairable"] / aggregate_brand.rows[brand].count;
		let brand_age_dead = 2 * proportion * aggregate_brand.rows[brand].fields.age.average;
		let brand_age_dead_width = p5.map(brand_age_dead, 0, max_age, 0, age_width);
		p5.fill(id_color(0, 1, 0.8));
		p5.rect(age_left, y_base + row_height / 2, brand_age_dead_width, row_height / 2);

		p5.fill("white");
		p5.textAlign(p5.RIGHT, p5.CENTER);
		p5.text(brand_age_dead.toFixed(1) + 'y', age_left + brand_age_dead_width - small_margin, y_center + row_height / 4);
	}
}
