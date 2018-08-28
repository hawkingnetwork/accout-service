const express = require('express');
const router = express.Router();
const {logger, utils} = require('../helpers');
const { newAccount, sendCoins } = require('../services');

/* GET home page. */
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Express' });
});


router.get('/account', async (req, res, next) => {
	try{
		const account = await newAccount();
		// console.log(account);
		return res.json(account);
	}catch(err){
		logger.error('get account error ', err);
		console.log(err);
		return res.error('Something went wrong');
	}

});


router.post('/sendCoins', async(req, res, next) => {
	try{
		const defaultKeys = ['public_key', 'amount'];

		// console.log(req.body);

		const data = utils.getFields(req.body, defaultKeys);
		if(Object.keys(data).length != defaultKeys.length){
			return res.error('Params incorrect');
		}

		await sendCoins(data.public_key, data.amount);

		return res.success({message:'success'});

	}catch(err){
		logger.error('get account error ', err);
		console.log(err);
		return res.error('Something went wrong');
	}
})
module.exports = router;
