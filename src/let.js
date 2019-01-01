funcs['let'] = {
	arg_type:TYPES.ARRAY,
	return_type:TYPES.NULL,
	func:function(args,t_args,variables){
		var local_variables = copy(variables);
		for(var i = 0; i < args.length-1; i++) {
			local_variables[args[i][0]] = args[i][1]|null;
		}
		evaluate(args[args.length-1],t_args[t_args.length-1].t,local_variables);
	}
}
