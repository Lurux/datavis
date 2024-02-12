export default {
	aggregate: function(array, key_getter, value_getter = (item) => 1, initial_value = 0) {
		let data = array
			.reduce((acc, item) => {
				acc.data[key_getter(item)] = (acc.data[key_getter(item)] ?? initial_value) + parseFloat(value_getter(item));
				acc.count[key_getter(item)] = (acc.count[key_getter(item)] ?? 0) + 1;
				acc.total += parseFloat(value_getter(item));
				return acc;
			}, { data: {}, count: {}, total: 0 });

		for(let util in aggregate_util)
			data[util] = aggregate_util[util];

		return data.refresh_sort();
	}
}

let aggregate_util = {
	refresh_sort: function() {
		this.sorted = Object.keys(this.data)
		.sort((a, b) => {
			return this.data[b] - this.data[a];
		});
		this.maximum = this.data[this.sorted[0]];
		this.size = this.sorted.length;
		return this;
	},

	sort_nth: function(item, position) {
		this.sorted.splice(this.sorted.indexOf(item), 1);
		this.sorted.splice(position, 0, item);
		return this;
	},
	copy_sort_nth: function(item, position) {
		return this.sorted.toSpliced(this.sorted.indexOf(item), 1).toSpliced(position, 0, item);
	},
	sort_first: function(item) {
		return this.sort_nth(item, 0);
	},
	sort_last: function(item) {
		return this.sort_nth(item, this.sorted.length);
	},

	keep_first: function(limit, overflow = "Others") {
		if(this.sorted.length <= limit) return this;

		this.data[overflow] = 0;
		this.count[overflow] = 0;

		for(let i = limit - 1; i < this.sorted.length; i++) {
			this.data[overflow] += this.data[this.sorted[i]];
			this.count[overflow] += this.count[this.sorted[i]];
			delete this.data[this.sorted[i]];
			delete this.count[this.sorted[i]];
		}

		this.sorted.splice(limit - 1, Infinity, overflow);

		return this;
	}
}

