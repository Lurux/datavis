export default function(p5)
{
	let rawData;

	p5.preload = function()
	{
		rawData = p5.loadTable("data/ewaste.csv", "csv", "header");
		window.rawData = rawData;
	}

	p5.setup = function()
	{
		window.data = extractdata();
		p5.noLoop();
	}

	let extractdata = function()
	{
		let data = [];

		// Count occurrences of each problem
		let totalProblems = rawData.getRowCount();
		let counts = {};
		let ages = {};
		let agesum = {};

		for (let i = 0; i < totalProblems; i++)
		{
			let problem = rawData.getString(i, "Problem");
			let age = rawData.getString(i, "Age");
			
			if (!counts[problem]) {
				counts[problem] = 0;
				ages[problem] = [];
			}

			counts[problem]++;
			if(!isNaN(age)) ages[problem].push(1 * age);
		}

		// Convert counts to an array of objects
		for (let problem in counts)
		{
			ages[problem].sort((a, b) => a - b);

			let count = counts[problem];
			let percentage = (count / totalProblems) * 100;
			let average_age = ages[problem].reduce((acc, curr) => acc + curr, 0) / ages[problem].length;
		//	let average_age = ages[problem][Math.floor(ages[problem].length / 2)];

			data.push({
				problem: problem,
				percentage: percentage,
				ages: ages[problem],
				age: average_age
			});
		}

		// Sort the data by percentage in descending order
		data.sort((a, b) => b.percentage - a.percentage);

		return data;
	}
}

