funcs['let'] = {
	arg_type:TYPES.ARRAY,
	return_type:TYPES.NULL,
	func:function(args,t_args,variables){
		var local_variables = copy(variables);
		for(var i = 0; i < args.length-1; i++) {
			args[i][0]
		}
		evaluate(args[args.length-1],variables);
	}
}
