funcs['let'] = {
	arg_type:function(types) {
		var bool = true;
		for(var i = 0; i < types.length-1; i++) bool = bool&&type_check(TYPES.ARR|TYPES.LE,types[i]);
		bool = bool&&type_check(TYPES.LE,types[types.length-1]);
		return bool;
	},
	return_type:TYPES.ALL,
	func:function(args,variables){
		var local_variables = copy(variables);
		for(var i = 0; i < args.length-1; i++) {
			local_variables[args[i].v[0].v] = args[i].v[1]||{t:TYPES.NULL,v:null};
		}
		return evaluate(args[args.length-1],local_variables).v;
	}
}
