var funcs = {};

var TYPES = {
	STR:1<<6,
	VAR:1<<7,
	FNAME:1<<8,
	BOOL:1<<4,
	NUMBER:(1<<2)|(1<<3),
	INT:1<<2,
	FLOAT:1<<3,
	NULL:1<<0,
	ARR:1<<16,
	E:1<<17,
	LE:1<<18,
}

var parse = function(input){
	var c = 0;
	var p = {
		w:['\t','\r','\n','\0',' ','　',undefined].reduce(function(a,b){a[b]=true;return a},{}),
		le:[')',']','}'].reduce(function(a,b){a[b]=true;return a},{}),
		te:['\t','\r','\n','\0',' ','　',')',']','}'].reduce(function(a,b){a[b]=true;return a},{}),
		WM:function(){
			while(p.w[input[c]]) c++;
		},
		W:function(){
			var pc=c;
			while(p.w[input[c]]){
				c++;
			}
			if(pc==c){
				//unoccurable
			}
		},
		COM:function(){
			if(input[c]=='@') c++;
			while(input[c]!='@') c++;
			if(input[c]=='@') c++;
		},
		STR:function(){
			if(input[c]=='"') c++;
			var st = c;
			while(!(input[c]=='"'&&input[c-1]!='\\')) c++;
			if(input[c]=='"') c++;
			return {t:TYPES.STR,v:input.substring(st,c),p:st};
		},
		VAR:function(){
			if(input[c]=="$") c++;
			var st = c;
			while(!p.te[input[c]]) c++;
			return {t:TYPES.VAR,v:input.substring(st,c),p:st};
		},
		TOKEN:function(){
			var st = c;
			while(!p.te[input[c]]) c++;
			var res = input.substring(st,c);
			var val = {t:TYPES.FNAME,v:res,p:st};
			if(res=="true"||res=="false") val = {t:TYPES.BOOL,v:res=="true",p:st};
			if(!isNaN(res)) val = {t:TYPES.NUMBER,v:Number(res),p:st};
			return val;
		},
		T:function(){
			switch(input[c]){
				case '(':
					return p.E();
					break;
				case '{':
					return p.LE();
					break;
				case '[':
					return p.ARR();
					break;
				case '@':
					return p.COM();
					break;
				case '$':
					return p.VAR();
					break;
				case '\"':
					return p.STR();
					break;
				default:
					return p.TOKEN();
			}
		},
		L:function(){
			var arr = [];
			while(true){
				p.WM();
				if(p.le[input[c]]){
					break;
				}else{
					var token = p.T();
					if(token) arr.push(token);
				}
			}
			// if(arr.length<=0)
			return arr;
		},
		ARR:function(){
			var st = c;
			if(input[c]=="[") c++;
			var res = p.L();
			if(input[c]=="]") c++;
			return res;
			return {t:TYPES.ARR,v:res,p:st};
		},
		E:function(){
			var st = c;
			if(input[c]=="(") c++;
			var res = p.L();
			if(input[c]==")") c++;
			return {t:TYPES.E,v:res,p:st};
		},
		LE:function(){
			var st = c;
			if(input[c]=="{") c++;
			var res = p.L();
			if(input[c]=="}") c++;
			return {t:TYPES.LE,v:res,p:st};
		},
		S:function(){
			while(true) {
				p.WM();
				if(input[c]=='@') p.COM();
				else break;
			}
			return p.E();
		}
	}

	var tree = p.S(input);

	function parse_arr_only_value(_arr) {
		var ret = [];
		for(var i = 0; i < _arr.v.length; i++) {
			var elem = _arr.v[i];
			if(elem.v.length>1) elem = parse_arr_only_value(elem);
			else elem = elem.v;
			ret[i] = elem;
		}
		return ret;
	}

	function parse_arr_without_value(_arr) {
		var ret = [];
		var ret = {};
		for(var i = 0; i < _arr.v.length; i++) {
			var elem = _arr.v[i];
			if(elem.v.length>1) elem = parse_arr_without_value(elem);
			else delete elem.v;
			ret[i] = elem;
		}
		return {t:_arr.t,v:ret,p:_arr.p};
	}
	var tree_only_value = parse_arr_only_value(tree);
	var tree_without_value = parse_arr_without_value(tree);
	return [tree_only_value,tree_without_value];
}

function evaluate(v_tree,t_tree,variables){
	if(!variables) variables={};
	if(t_tree.t==TYPES.E||t_tree.t==TYPES.LE) {
		var args = [];
		var t_args = [];
		for(var i = 0; i < v_tree.length; i++) {
			var elem;
			if(t_tree.v[i].t==TYPES.E) {
				elem = evaluate(v_tree[i],t_tree.v[i],variables);
				args[i] = elem.v;
				t_args[i] = elem;
				delete t_args[i].v;
			}else if(t_tree.v[i].t==TYPES.VAR) {
				elem = variables[v_tree[i]]|null;
				args[i] = elem.v|null;
				t_args[i] = elem.t|TYPES.NULL;
			}else {
				args[i] = v_tree[i];
				t_args[i] = t_tree.v[i];
			}
		}
		var fname = args.shift();
		var fname_t = t_args.shift();
		if(type_check(TYPES.STR|TYPES.FNAME,fname_t.t)) {
			if(funcs[fname]){
				return fcall(funcs[fname],args,t_args,variables)
			}
		}
	}
}

function type_check(base_type,check_type) {
	return (base_type&check_type)!=0;
}

function fcall(f,args,t_args,variables) {
	if(typeof f.arg_type == "function") {
		f.arg_type(t_args.map(function(arg){return t_args.t}));
	}else if(typeof f.arg_type == "number") {
		for(var i = 0; i < args.length; i++) {
			type_check(f.arg_type,t_args[i].t);
		}
	}else if(f.arg_type != null && typeof f.arg_type == "object"){
		for(var i = 0; i < f.arg_type.length; i++) {
			type_check(f.arg_type,t_args[i].t|TYPES.NULL);
		}
	}else {

	}
	var result = f.func(args,t_args,variables);

	return {t:f.return_type,v:result};
}

function copy(variables) {
	var local_variables = {};
	var keys = Object.keys(variables);
	for(var i = 0; i < keys.length; i++) {
		local_variables[keys[i]] = variables[i];
	}
	return local_variables;
}
