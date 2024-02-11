export default function(p5)
{
	const age_step = 1;
	const max_age = 10;
	const max_items = 8;

	const margins = 40;
	const label_margins = 10;

	const top_height = 20;
	const left = margins + label_margins + 20;
	const right = margins + label_margins + 125;
	const bottom = margins + label_margins;

	let histograms;

	p5.setup = function()
	{
		p5.createCanvas(1200, 700);
		histograms = makeHistograms();
		p5.noLoop();
	}

	let makeHistograms = function()
	{
		let histograms = [];
		let current = 0;

		for (let i = 0; i < data.length; i++)
		{
			let ageTotal = data[i].ages.reduce((acc, curr) => acc + (curr < max_age), 0);
			histograms.push({ problem: data[i].problem, previous: 0, solo: [], cumulative: [], adjust: data[i].percentage / ageTotal, percentage: data[i].percentage });
		}

		while(current <= max_age)
		{
			current += 1;
			let subtotal = 0;

			for (let i = 0; i < data.length; i++)
			{
				let thisCumul = data[i].ages.reduce((acc, curr) => acc + (curr < current), 0);
				subtotal += thisCumul * histograms[i].adjust;

				histograms[i].solo.push(thisCumul - histograms[i].previous);
				histograms[i].cumulative.push(subtotal);
				histograms[i].previous = thisCumul;
			}
		}

		histograms[max_items - 1].cumulative = histograms[histograms.length - 1].cumulative;
		histograms[max_items - 1].problem = "Others";

		for (let i = max_items; i < data.length; i++)
		{
			histograms[max_items - 1].percentage += histograms[i].percentage;

			for(let j = 0; j < max_age; j++)
				histograms[max_items - 1].solo[j] += histograms[i].solo[j];
		}

		return histograms;
	}

	p5.draw = function()
	{
		p5.background(10, 10, 10); //"#1b1b1b");
		p5.textSize(14);

		draw_background_decor();
		draw_graph();
	}

	function draw_background_decor()
	{
		p5.textAlign(p5.RIGHT, p5.CENTER);

		for(let i = 0; i <= 100; i = i + 10)
		{
			let y = p5.map(i, 0, 100, p5.height - bottom, 2 * margins + top_height);

			p5.stroke("grey");
			p5.strokeWeight(1);
			p5.line(left, y, p5.width - right, y);

			p5.noStroke();
			p5.fill("grey");
			p5.text(`${i}%`, left - label_margins, y);
		}

		p5.textAlign(p5.CENTER, p5.CENTER);

		for(let i = 0; i <= max_age; i = i + 2)
		{
			let x = p5.map(i, 0, max_age, left, p5.width - right);

			p5.stroke("grey");
			p5.strokeWeight(1);
			p5.line(x, p5.height - bottom, x, top_height + 2 * margins);

			p5.noStroke();
			p5.fill("grey");
			p5.text(`${i}y`, x, p5.height - bottom + 2 * label_margins);
			p5.text(`${i}y`, x, top_height + 2 * margins - 2 * label_margins);
		}

		p5.textAlign(p5.CENTER, p5.BOTTOM);

		p5.translate(margins, (p5.height + top_height + margins) / 2);
		p5.rotate(-p5.HALF_PI);
		p5.text("Cumulative percentage of devices needing repair", 0, -label_margins);
		p5.rotate(p5.HALF_PI);
		p5.translate(-margins, -(p5.height + top_height + margins) / 2);

		p5.text("Age of the device", (left + p5.width - right) / 2, p5.height - label_margins);

		p5.text("Average age before broken", 535, top_height + margins - 2 * label_margins);
	}

	function draw_graph()
	{
		let step = 40;

		p5.colorMode(p5.HSB, max_items, 1, 1);
		p5.textAlign(p5.LEFT, p5.CENTER);

		for (let i = max_items - 1; i >= 0; i--)
		{
			let average_x = p5.map(data[i].age, 0, max_age, left, p5.width - right);
			let text_y_raw = histograms[i].cumulative[max_age - 1] + (histograms[i - 1]?.cumulative[max_age - 1] ?? 0);
			let text_y = p5.map(text_y_raw, 0, 200, p5.height - bottom, 2 * margins + top_height);

			p5.noFill();
			p5.stroke(i, 1, 1);
			p5.strokeWeight(1);
			p5.line(average_x, p5.height - bottom, average_x, top_height + margins - label_margins);

			p5.noStroke();
			p5.fill(i, 1, 1);
			p5.circle(average_x, top_height + margins - label_margins, 6);

			p5.fill(i, 0.5, 1);
			p5.text(`${histograms[i].problem} - ${histograms[i].percentage.toFixed(1)}%`, p5.width - right + label_margins, text_y);

			let x = left;
			let y = 0;

			p5.noStroke();
			p5.fill(i, 1, 0.8);

			p5.beginShape();
			p5.vertex(left, p5.height - bottom);
			for(let j = 0; j < max_age; j++)
			{
				x = p5.map(j + 1, 0, max_age, left, p5.width - right);
				y = p5.map(histograms[i].cumulative[j], 0, 100, p5.height - bottom, 2 * margins + top_height);

				p5.vertex(x, y);
			}
			p5.vertex(p5.width - right, p5.height - bottom);
			p5.endShape(p5.CLOSE);

			p5.noFill();
			p5.stroke(i, 1, 1);
			p5.strokeWeight(1);

			p5.beginShape();
			p5.vertex(left, p5.height - bottom);
			for(let j = 0; j < max_age; j++)
			{
				let x = p5.map(j + 1, 0, max_age, left, p5.width - right);
				let y = p5.map(histograms[i].cumulative[j], 0, 100, p5.height - bottom, 2 * margins + top_height);

				p5.vertex(x, y);
			}
			p5.endShape();
		}
	}
}

