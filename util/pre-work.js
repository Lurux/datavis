export default {
	aggregate: function(data_in, aggregate_key)
	{
		let data_out = { rows: {} };

		//	Parse data_in
		for(let row_in_key in data_in)
		{
			//	Get input row and aggregate value
			let row_in = data_in[row_in_key];
			let row_out_key = row_in[aggregate_key];

			//	Initialize aggregated row
			if(!data_out.rows[row_out_key])
			{
				let row_out = { count: 0, fields: {} };

				for(let column_key in row_in)
				{
					let entry_out = { counts: {}, numeric_count: 0, sum: 0, average: 0 };

					row_out.fields[column_key] = entry_out;
				}

				data_out.rows[row_out_key] = row_out;
			}

			//	Get output row
			let row_out = data_out.rows[row_out_key];
			row_out.count += 1;

			//	Populate aggregated row
			for(let column_key in row_in)
			{
				let value_in = row_in[column_key];
				let entry_out = row_out.fields[column_key];

				entry_out.counts[value_in] = (entry_out.counts[value_in] ?? 0) + 1;

				if(!isNaN(value_in))
				{
					entry_out.numeric_count += 1;
					entry_out.sum += 1 * value_in;
				}
			}
		}

		//	Calculate minimums, maximums, and averages
		let mins = { count: Number.MAX_SAFE_INTEGER, fields: {} };
		let maxs = { count: 0, fields: {} };

		for(let row_out_key in data_out.rows)
		{
			let row_out = data_out.rows[row_out_key];

			mins.count = Math.min(mins.count, row_out.count);
			maxs.count = Math.max(maxs.count, row_out.count);
			
			for(let column_key in row_out.fields)
			{
				let entry_out = row_out.fields[column_key];

				if(entry_out.numeric_count == 0) continue;

				//	Calculate average
				entry_out.average = entry_out.sum / entry_out.numeric_count;

				//	Initialize min and max
				if(!mins.fields[column_key])
				{
					mins.fields[column_key] = { sum: Number.MAX_SAFE_INTEGER, average: Number.MAX_SAFE_INTEGER };
					maxs.fields[column_key] = { sum: 0, average: 0 };
				}

				//	Populate min and max
				mins.fields[column_key] = {
					sum:		Math.min(mins.fields[column_key].sum, entry_out.sum),
					average:	Math.min(mins.fields[column_key].average, entry_out.average)
				};

				maxs.fields[column_key] = {
					sum:		Math.max(maxs.fields[column_key].sum, entry_out.sum),
					average:	Math.max(maxs.fields[column_key].average, entry_out.average)
				};
			}
		}

		data_out.min = mins;
		data_out.max = maxs;
		data_out.row_count = Object.keys(data_out.rows).length;
		data_out.entry_count = data_in.length;

		return data_out;
	},

	sorted_keys: function(object, getter)
	{
		return Object.keys(object).toSorted((a, b) => getter(object[b]) - getter(object[a]));
	},
	
	sum_others: function(object, blocklist)
	{
		let acc = 0;
		
		for(let key in object)
		{
			if(!blocklist.includes(key)) acc += object[key];
		}
		
		return acc;
	}
}
