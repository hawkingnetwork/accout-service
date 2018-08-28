
const _ = require('lodash');

module.exports= {
	getFields: (input, defaultKeys) => {
		let data = _.pick(input,defaultKeys);
		data = _.omitBy(data, function(value) {return _.isUndefined(value) || _.isNull(value) || value === '';});
		return data;
	},
	filterArrayByKey:(objects, keys) =>{
		return _.map(objects,(item)=>{
			return _.pick(item, keys);
		});
	} 
};