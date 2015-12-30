function ApiError(code, body) {
	this.code = code;
	this.errors = [];

	if (body.errors && body.errors.length > 0) {
		this.errors = body.errors;
	}
	else this.errors.push(body);
	return (this);
}

ApiError.prototype = new Error;

ApiError.prototype.toString = function() {
	var str = "CODE: " + this.code;

	for (var i = 0; i < this.errors.length; i++) {
		str += "\n";

		if (this.errors[i].error && this.errors[i].error_description) {
			str += this.errors[i].error + ": " + this.errors[i].error_description;
		} else if (this.errors[i].error_code && this.errors[i].error_message) {
			str += this.errors[i].error_code + ": " + this.errors[i].error_message;
		} else {
			var key = Object.keys(this.errors[i])[0];
			str += key + ": " + this.errors[i][key];
		}

	}
	return (str);
}

module.exports = ApiError;
