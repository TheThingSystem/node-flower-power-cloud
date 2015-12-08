function ApiError(code, body) {
	this.code = code;
	this.errors = [];

	if (typeof body.errors != 'undefined' && body.errors.length > 0) {
		this.errors = body.errors;
	}
	else this.errors.push(body);
}

ApiError.prototype = new Error;

ApiError.prototype.toString = function() {
	var str = "CODE: " + this.code;

	for (var i = 0; i < this.errors.length; i++) {
		str += "\n";
		if (typeof this.errors[i].error != '!undefined' && typeof this.errors[i].error_description != 'undefined') {
			str += this.errors[i].error + ": " + this.errors[i].error_description;
		}
		else {
			str += this.errors[i].error_code + ": " + this.errors[i].error_message;
		}
	}
	return (str);
}

module.exports = ApiError;
