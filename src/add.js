funcs['+'] = {
	arg_type:TYPES.NUMBER,
	return_type:TYPES.NUMBER,
	func:function(args){
		return args.reduce(function(a,b){return a+b},0);
	}
}
