funcs['let'] = {
	arg_type:TYPES.ARRAY,
	return_type:TYPES.ALL,
	func:function(args,variables){
		var local_variables = copy(variables);
		for(var i = 0; i < args.length-1; i++) {
			local_variables[args[i].v[0].v] = args[i].v[1]||{t:TYPES.NULL,v:null};
		}
		return evaluate(args[args.length-1],local_variables).v;
	}
}
