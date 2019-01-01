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
	ALL:0xffffffff
}

var parse = function(input){
	var c = 0;
	var lines = input.split("\n");
	lines = lines.reduce(function(pre,now){pre.push(pre[pre.length-1]+now.length+1);return pre},[0]);
	console.log(lines);
	function check_pos(_pos) {
		var i = 0;
		while(_pos>lines[i]) i++;
		i=Math.max(i,1);
		return [i,_pos-lines[i-1]];
	}
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
			var pos = check_pos(st);
			return {t:TYPES.STR,v:input.substring(st,c),l:pos[0],p:pos[1]};
		},
		VAR:function(){
			if(input[c]=="$") c++;
			var st = c;
			while(!p.te[input[c]]) c++;
			var pos = check_pos(st);
			return {t:TYPES.VAR,v:input.substring(st,c),l:pos[0],p:pos[1]};
		},
		TOKEN:function(){
			var st = c;
			while(!p.te[input[c]]) c++;
			var res = input.substring(st,c);
			var pos = check_pos(st);
			var val = {t:TYPES.FNAME,v:res,l:pos[0],p:pos[1]};
			if(res=="true"||res=="false") val = {t:TYPES.BOOL,v:res=="true",l:pos[0],p:pos[1]};
			if(!isNaN(res)) val = {t:TYPES.NUMBER,v:Number(res),l:pos[0],p:pos[1]};
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
			var pos = check_pos(st);
			return {t:TYPES.ARR,v:res,l:pos[0],p:pos[1]};
		},
		E:function(){
			var st = c;
			if(input[c]=="(") c++;
			var res = p.L();
			if(input[c]==")") c++;
			var pos = check_pos(st);
			return {t:TYPES.E,v:res,l:pos[0],p:pos[1]};
		},
		LE:function(){
			var st = c;
			if(input[c]=="{") c++;
			var res = p.L();
			if(input[c]=="}") c++;
			var pos = check_pos(st);
			return {t:TYPES.LE,v:res,l:pos[0],p:pos[1]};
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
	return p.S(input);
}

function evaluate(tree,variables){
	try{
		if(!variables) variables = {};
		if(tree.t==TYPES.E||tree.t==TYPES.LE) {
			if(tree.v.length<=0) {
				throw("no function in Evaluation or Lazy-Evaluation");
			}
			var args = [];
			for(var i = 0; i < tree.v.length; i++) {
				//if(tree.v[i].t==TYPES.E) {
				if(type_check(TYPES.E|TYPES.ARR|TYPES.VAR,tree.v[i].t)) {
					args[i] = evaluate(tree.v[i],variables);
					/*
				}else if(tree.v[i].t==TYPES.VAR) {
					args[i] = variables[tree.v[i].v];
					*/
				}else {
					args[i] = tree.v[i];
				}
			}
			var fname = args.shift();
			if(type_check(TYPES.STR|TYPES.FNAME,fname.t)) {
				if(funcs[fname.v]){
					return fcall(funcs[fname.v],args,variables)
				}
			}
		}else if(tree.t==TYPES.ARR) {
			for(var i = 0; i < tree.v.length; i++) {
				tree.v[i] = evaluate(tree.v[i],variables);
			}
			return tree;
		}else if(tree.t==TYPES.VAR) {
			if(!variables[tree.v]) throw("not defined Variable '$"+tree.v+"'");
			return variables[tree.v];
		}else {
			return tree;
		}
	}catch(e) {
		if(e) console.log(e);
		console.log("\tat line "+tree.l+" pos "+tree.p+" , ");
		throw("")
	}
}

function type_check(base_type,check_type) {
	return (base_type&check_type)!=0;
}

function fcall(f,args,variables) {
	if(typeof f.arg_type == "function") {
		f.arg_type(args.map(function(arg){return arg.t}));
	}else if(typeof f.arg_type == "number") {
		for(var i = 0; i < args.length; i++) {
			type_check(f.arg_type,args[i].t);
		}
	}else if(f.arg_type != null && typeof f.arg_type == "object"){
		for(var i = 0; i < f.arg_type.length; i++) {
			type_check(f.arg_type,args[i].t|TYPES.NULL);
		}
	}else {

	}
	var result = f.func(args,variables);

	return {t:f.return_type,v:result};
}

function copy(variables) {
	var local_variables = {};
	var keys = Object.keys(variables);
	for(var i = 0; i < keys.length; i++) {
		local_variables[keys[i]] = variables[keys[i]];
	}
	return local_variables;
}

function get_values(args) {
	return args.map(function(arg){return arg.v})
}
