function ApiError(code, body) {
	this.code = code;
	this.errors = [];

	if (body.errors && body.errors.length > 0) {
		this.errors = body.errors;
	}
	else this.errors.push(body);
	return (this);
}

ApiError.prototype = Object.create(Error.prototype);
ApiError.prototype.constructor = ApiError;

ApiError.prototype.toString = function() {
	var str = "CODE: " + this.code;

	for (var error of this.errors) {
		str += "\n";

		if (error.error && error.error_description) {
			str += error.error + ": " + error.error_description;
		} else if (error.error_code && error.error_message) {
			str += error.error_code + ": " + error.error_message;
		} else if (typeof error == 'string') {
			str += error;
		} else {
			var key = Object.keys(error)[0];
			str += key + ": " + error[key];
		}
		
	}
	return (str);
}

module.exports = ApiError;
