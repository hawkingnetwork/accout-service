const StellarSdk = require("stellar-sdk");
const sysconfigs = require('../configs');
const logger = require('../helpers/logger');

const isProduction = process.env.NODE_ENV === 'development' ? false: true;

const configs = isProduction ?  sysconfigs.production : sysconfigs.development;


let server;

	

if(isProduction){
	console.log('production')
	server = new StellarSdk.Server("https://horizon.stellar.org");
	StellarSdk.Network.usePublicNetwork();
}else{
	console.log('development');
	server =  new StellarSdk.Server("https://horizon-testnet.stellar.org");
	StellarSdk.Network.useTestNetwork();
}


const hawkingAsset = new StellarSdk.Asset(
  "HAWKING",
  configs.issuingAccount.public_key
);

const isTrusted = (public_key) => {
  	return new Promise(async (resolve, reject) => {
    try{
    	const account = await loadAccount(public_key);
    	let trusted = false;
    	if( account.balances.length>0)
    		for(let i= 0; i<  account.balances.length; i++){
    			let balance =  account.balances[i];
    			if(balance.asset_code === hawkingAsset.code)
    				trusted = true;
    		}
		return resolve(trusted);
    }catch(error){
    	logger.error('check trust account error', error);
    	console.log(error);
    	return reject(error);
    }

	});
}

const fundAccount = destination => {
  return new Promise((resolve, reject) => {
    const sourceKeys = StellarSdk.Keypair.fromSecret(configs.seedingAccount.private_key);
    server.loadAccount(sourceKeys.publicKey())
      .then(function(sourceAccount) {
        let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
          .addOperation(
            StellarSdk.Operation.createAccount({
              destination: destination.public_key,
              startingBalance: '5'
            })
          )
          .build();
        // Sign the transaction to prove you are actually the person sending it.
        transaction.sign(sourceKeys);
        // And finally, send it off to Stellar!
        return server.submitTransaction(transaction);
      })
      .then(function(result) {
        // console.log("Success! Results:", result);
        return resolve(result);
      })
      .catch(function(error) {
      	logger.error('fund account error ', error);
        console.error("Something went wrong!", error);
        return reject(error);
      });
  });
}


//Trust hawking asset
const trustAccount = account => {
  return new Promise(async (resolve, reject) => {
    try {
		const receivingKeys = StellarSdk.Keypair.fromSecret(account.private_key);
		console.log("loading receiver account");
		const receiver = await loadAccount(account.public_key);

		console.log("trusting hawking asset");
		let transaction = new StellarSdk.TransactionBuilder(receiver)
		// The `changeTrust` operation creates (or alters) a trustline
		.addOperation(
		  StellarSdk.Operation.changeTrust({
		    asset: hawkingAsset
		  })
		)
		.build();

		transaction.sign(receivingKeys);

		const submit = await server.submitTransaction(transaction);
		// console.log(submit);
      return resolve(submit);
    } catch (err) {
		logger.error('trust account error ', err);
      	console.log("trust account error", err);
      	return reject(err);
    }
  });
};



const loadAccount = public_key => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await server.loadAccount(public_key);
      account.balances.forEach(function(balance) {
        console.log(
          "Type:",
          balance.asset_type,
          "Asset: ",
          balance.asset_code,
          "Balance:",
          balance.balance
        );
      });
      return resolve(account);
    } catch (err) {
    	logger.error('load account error ', err);
      console.log("loadAccount error ", err);
      return reject(err);
    }
  });
};


const newAccount = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const pair = StellarSdk.Keypair.random();

      const private_key = pair.secret();

      const public_key = pair.publicKey();

      const funding = await fundAccount({public_key,private_key});

      const trustAsset = await trustAccount({ public_key, private_key });

      return resolve({ public_key, private_key });
    } catch (err) {
    	logger.error('create account error ', err);
      console.log("create new account error", err);
      return reject(err);
    }
  });
};

const sendCoins = (public_key, amount = "20", memo="") => {
  return new Promise( async(resolve, reject) => {
    const sourceKeys = StellarSdk.Keypair.fromSecret(configs.distributionAccount.private_key);
    try{

    	const checkTrust = await isTrusted(public_key);
	    if(!checkTrust)
	    	return reject(new Error('Accout not trust'));

	    server.loadAccount(sourceKeys.publicKey())
	      .then(function(sourceAccount) {
	        let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
	          .addOperation(
	            StellarSdk.Operation.payment({
	              destination: public_key,
	              asset: hawkingAsset,
	              amount: amount.toString()
	            })
	          )

	        if(memo)
	          transaction.addMemo(StellarSdk.Memo.text(memo));

         	transaction = transaction.build();
	        transaction.sign(sourceKeys);
	        return server.submitTransaction(transaction);
	      })
	      .then(function(result) {
	        // console.log("Success! Results:", result);
	        return resolve(result);
	      })

    }catch(err){
    	logger.error('sendCoins error', err);
    	console.log(err);
    	return reject(err);

    }
    
      
  });
};

module.exports = {
	newAccount, sendCoins, isTrusted
}
