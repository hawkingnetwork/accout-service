module.exports = async (req, res, next) => {
	/**
	 * hanlde error
	 * @param error
	 * @param status
	 */
	// let status = ctx.status;
	// ctx.status = status;
	res.error = (error, status) => {
		let message;

		if (error) {
			console.log(error);
			if (error instanceof Error) {
				message = error.message;
			}
			if (typeof error == "string") {
				message = error;
			}
		}
		return res.status(status || 400).json({
			status: "error",
			message: message || "system error"
		});
	};
	/**
	 * hanlder success
	 * @param data
	 * @param status
	 * @returns {*}
	 */
	res.success = (data, status) => {
		let message;
		if (data) {
			if (typeof data == "object" && data.hasOwnProperty("message")) {
				message = data.message;
				delete data.message;
			}
			if (typeof data == "string") {
				message = data;
				data = {};
			}
		}

		return res.status(status || 200).json({
			status: "success",
			message,
			data
		});
			
	};

	await next();
};
