var sql = require('mysql');
function model(schema,dbconfig,presetData,callback){
	var finished= false;
	var db=require('./mysql-db.js');
	dbconfig.database = dbconfig.dbname;
	checkTable(schema);
	function ModelQuery(query,callback){
		db.query(dbconfig,query,function(result){
			if(result.error){
				console.log('mysql-model.js line 23',result.error,query);
			}
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function checkTable(schema){
		db.isTableExists(dbconfig,schema.name,function(Exists){
			if (!Exists){
				var query = "CREATE TABLE "+schema.name+" (";
				for (i=0;i<schema.column.length;i++){
					query += schema.column[i].name +" "+ schema.column[i].type;
					if(schema.column[i].ext &&schema.column[i].ext !=""){
						query +=" "+ schema.column[i].ext;
					}
					if (i<schema.column.length-1){
						query +=",";
					}
				}
				
				for (i=0;i<schema.column.length;i++){
					if(schema.column[i].primary===true){
						query +=",PRIMARY KEY ("+schema.column[i].name+")"
					}
					if(schema.column[i].index===true){
						query +=",INDEX "+schema.name+"_index_"+schema.column[i].name+" ("+schema.column[i].name+")";
					}
					if(typeof schema.column[i].foreign==="object"){
						query +=",FOREIGN KEY ("+schema.column[i].name+") REFERENCES "+schema.column[i].foreign.table + "(`"+schema.column[i].foreign.column+"`) ";
						if(typeof schema.column[i].foreign.ext==="string"){
							query+=schema.column[i].foreign.ext;
						}
					}
				}
				query +=")";
				if(schema.engine && typeof schema.engine=="string"){
				    query +="ENGINE="+schema.engine;
				}
				ModelQuery({string:query},function(result){
					if (result.err){
						console.log(result.err);
						process.exit(1);
						return;
					}
					finished = true;
					if (presetData){
        				setData(presetData,callback);
        			}else{
        				if (callback && typeof(callback) == "function"){callback(true);}
        			}
				});
			}else{
				checkColumn(0);
			}
		});
	}
	function checkColumn(index){
		if (index == schema.column.length){
			checkIndexed(0);
			return;
		}
		db.isColumnExists(dbconfig,schema.name,schema.column[index].name,function(Exists){			
			if (!Exists){
				var query = "ALTER TABLE "+schema.name+" ADD "+schema.column[index].name+" "+ schema.column[index].type ;
				if(schema.column[index].ext &&schema.column[index].ext !=""){
					query+=" "+schema.column[index].ext;
				}
				ModelQuery({string:query,escape:false},function(result){
					checkColumn(index+1);
				});
			}else{
				var query = "select data_type from information_schema.columns where table_schema = '"+dbconfig.dbname+"' and table_name = '"+schema.name+"' and column_name = '"+schema.column[index].name+"'";
				ModelQuery({string:query,escape:false},function(result){
					if(typeof result.recordset[0].data_type =='string' && result.recordset[0].data_type.toLowerCase()==schema.column[index].type.toLowerCase()){
						checkColumn(index+1);						
					}else{
						var query = "ALTER TABLE "+schema.name+" MODIFY COLUMN "+schema.column[index].name+" "+ schema.column[index].type;
						if(schema.column[index].ext &&schema.column[index].ext !=""){
							query+=" "+schema.column[index].ext;
						}
						ModelQuery({string:query,escape:false},function(result){
							checkColumn(index+1);
						});

					}
				});				
			}
			
		});		
	}
	function checkIndexed(index){
		if (index >= schema.column.length){
			finished = true;
			if (presetData){
				setData(presetData,callback);
			}else{
				if (callback && typeof(callback) == "function"){callback(true);}
			}
			return;
		}
		if(!schema.column[index].index && !schema.column[index].primary){
			checkIndexed(index+1);
			return;
		}
		var query = "SELECT Column_name FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND Column_name=?";
		var escape = [dbconfig.database,schema.name,schema.column[index].name];
		ModelQuery({string:query,escape:escape},function(result){
			if(result && result.recordset && result.recordset.length >0){
				checkIndexed(index+1);
				return;
			}else{
				var INDEX_PART;
				if(schema.column[index].index===true){
					INDEX_PART =" ADD INDEX `"+schema.name+"_index_"+schema.column[index].name+"`" + " (`"+schema.column[index].name+"`)";
				}
				if(schema.column[index].primary===true){
					INDEX_PART =" ADD PRIMARY KEY " + " (`"+schema.column[index].name+"`)";
				}
				if(typeof schema.column[index].foreign==="object"){
					INDEX_PART +=" ADD FOREIGN KEY ("+schema.column[index].name+") REFERENCES "+schema.column[index].foreign.table + "(`"+schema.column[index].foreign.column+"`) ";
					if(typeof schema.column[index].foreign.ext==="string"){
						INDEX_PART+=schema.column[index].foreign.ext;
					}
				}
				var query = "ALTER TABLE `"+schema.name+"` "+INDEX_PART+";";
				ModelQuery({string:query,escape:false},function(result){
					checkIndexed(index+1);
					return;	
				});
			}
		});
	}
	function Find(condition,callback){
		if(!finished){
			setTimeout(function(){
				Find(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		condition.string = condition.string || "1";
		var query = "SELECT * FROM "+schema.name+" WHERE "+condition.string ;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function FindOne(condition,callback){			
		if(!finished){
			setTimeout(function(){
				FindOne(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		condition.string = condition.string || "1";
		var query = "SELECT * FROM "+schema.name+" WHERE "+condition.string+" LIMIT 1";
		ModelQuery({string:query,escape:condition.escape},function(result){
			if(result.error || !result.recordset || result.recordset.length<1){
				if (callback && typeof(callback) == "function"){callback(false);}
			}else{
				if (callback && typeof(callback) == "function"){callback(result.recordset[0]);}
			}
		});	
	}
	function FindTop(condition,callback){	
		if(!finished){
			setTimeout(function(){
				FindTop(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		
		condition.string = condition.string || "1";
		condition.top = condition.top || 1;
		var query = "SELECT * FROM "+schema.name+" WHERE "+condition.string+" LIMIT "+condition.top ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function FindPage(condition,callback){	
		if(!finished){
			setTimeout(function(){
				FindTop(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		condition.page = condition.page || "0" ;
		condition.max = condition.max || "10" ;

		var query = "SELECT * FROM "+schema.name+" WHERE "+condition.string+" LIMIT "+condition.page+","+condition.max ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function Delete(condition,callback){			
		if(!finished){
			setTimeout(function(){
				Delete(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		var query = "DELETE FROM "+schema.name+" WHERE "+condition.string ;	

		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});		
	}	
	function DeleteTop(condition,callback){			
		if(!finished){
			setTimeout(function(){
				DeleteTop(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		condition.top = condition.top || 1 ;
		var query = "DELETE FROM "+schema.name+" WHERE "+condition.string+" LIMIT "+condition.top ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});		
	}
	function Count(condition,callback){			
		if(!finished){
			setTimeout(function(){
				Count(condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		var query;
		condition.string = condition.string || "1";
		query = "SELECT IFNULL(COUNT(*),0) AS CNT FROM "+schema.name+" WHERE "+condition.string;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (result.err){
				if (callback && typeof(callback) == "function"){callback(0);}	
				return;
			}
			if (callback && typeof(callback) == "function"){callback(result.recordset[0].CNT);}
		});		
	}	
	function Update(condition,callback){
		if(!finished){
			setTimeout(function(){
				Update(condition,callback)
			},500)
			return;
		}
		if(!condition || !condition.string){
			callback({error:"option.string is not set"});
			return;
		}
		var query = "UPDATE "+schema.name+" SET "+condition.string;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});	
	}
	function UpdateX(data,condition,callback){
		if(!finished){
			setTimeout(function(){
				UpdateX(data,condition,callback)
			},500)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		var updatequery = '';
		var escapequery = [];
		for (var attrname in data){
			updatequery += attrname +'=?,';
			escapequery.push(data[attrname]);
		}
		updatequery = updatequery.slice(0,-1);
		for(i=0;i<condition.escape.length;i++){
			escapequery.push(condition.escape[i]);
		}

		condition.string = condition.string || "1";
		var query = "UPDATE " + schema.name + " SET " + updatequery + " WHERE " + condition.string;
		ModelQuery({string:query,escape:escapequery},function(result){
			if(callback && typeof callback=='function'){
				callback(result);
			}
		});
	}
	function Insert(data,callback){
		if(!finished){
			setTimeout(function(){
				Insert(data,callback)
			},500)
			return;
		}
		var insertquery="(";
		var insertquery2="(";
		var escape =[];
		for (var attrname in data) { 
			insertquery += '`'+attrname+'`,';
			insertquery2 += "?,";
			escape.push(data[attrname]);				
		}
		insertquery = insertquery.slice(0, - 1) + ")";
		insertquery2 = insertquery2.slice(0, - 1) + ")";
		var query = "INSERT INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2;	
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertIgnore(data,callback){
		if(!finished){
			setTimeout(function(){
				InsertIgnore(data,callback)
			},500)
			return;
		}
		var insertquery="(";
		var insertquery2="(";
		var escape =[];
		for (var attrname in data) { 
			insertquery += '`'+attrname+'`,';
			insertquery2 += "?,";
			query+= attrname +"=? AND ";
			escape.push(data[attrname]);				
		}
		insertquery = insertquery.slice(0, - 1) + ")";
		insertquery2 = insertquery2.slice(0, - 1) + ")";
		var query = "INSERT IGNORE INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2;
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertDuplicate(data,dup,callback){
		if(!finished){
			setTimeout(function(){
				InsertDuplicate(data,dup,callback)
			},500)
			return;
		}
	    var insertquery="(";
		var insertquery2="(";
		var escape =[];
		for (var attrname in data) { 
			insertquery += '`'+attrname+'`,';
			insertquery2 += "?,";
			query+= attrname +"=? AND ";
			escape.push(data[attrname]);				
		}
		insertquery = insertquery.slice(0, - 1) + ")";
		insertquery2 = insertquery2.slice(0, - 1) + ")";
		
		var insertDuplicate = ' ON DUPLICATE KEY UPDATE ';
		for (i=0;i<dup.length;i++){
			insertDuplicate += dup[i] + '= VALUES (' + dup[i] + '),';
		}
		insertDuplicate = insertDuplicate.slice(0, - 1) + ';';
		
		var query = "INSERT INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2 + insertDuplicate;	
		
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertMultiple(data,callback){
		if(!finished){
			setTimeout(function(){
				InsertMultiple(data,callback)
			},500)
			return;
		}
		if(data.length ==0){
			if (callback && typeof(callback) == "function"){callback({error:1,recordset:[]});}
			return
		}
		
		var insertquery="(";
		var escape =[];
		for (var attrname in data[0]) { 
			insertquery += '`'+attrname+'`,';
		}		
		insertquery = insertquery.slice(0, - 1) + ")";
		
		var insertquery2="";
		for(i=0;i<data.length;i++){
			insertquery2+="(";
			for (var attrname in data[i]) { 
				insertquery2 += "?,";
				escape.push(data[i][attrname]);
			}
			insertquery2 = insertquery2.slice(0, - 1) + "),";
		}
		insertquery2 = insertquery2.slice(0, - 1) + ";";
		
		var query = "INSERT IGNORE INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2;
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertMultipleWithDuplicate(data,dup,callback){
		if(!finished){
			setTimeout(function(){
				InsertMultipleWithDuplicate(data,dup,callback)
			},500)
			return;
		}
		if(data.length ==0){
			if (callback && typeof(callback) == "function"){callback({error:1,recordset:[]});}
			return
		}
		
		var insertquery="(";
		var escape =[];
		for (var attrname in data[0]) { 
			insertquery += '`'+attrname+'`,';
		}		
		insertquery = insertquery.slice(0, - 1) + ")";
		
		var insertquery2="";
		for(i=0;i<data.length;i++){
			insertquery2+="(";
			for (var attrname in data[i]) { 
				insertquery2 += "?,";
				escape.push(data[i][attrname]);
			}
			insertquery2 = insertquery2.slice(0, - 1) + "),";
		}
		insertquery2 = insertquery2.slice(0, - 1);
		var insertDuplicate = ' ON DUPLICATE KEY UPDATE ';
		for (i=0;i<dup.length;i++){
			insertDuplicate += dup[i] + '= VALUES (' + dup[i] + '),';
		}
		insertDuplicate = insertDuplicate.slice(0, - 1) + ';';
		var query = "INSERT INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2 + insertDuplicate;
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function setData(data,callback){		
		addData(0);
			function addData(i){				
				if (i == data.length){				
					if (callback && typeof(callback) == "function"){callback(true);}
					return;
				}
				var query = "";
				var insertquery="(";
				var insertquery2="(";
				var escape =[];
				for (var attrname in data[i]) { 
					insertquery += attrname+',';
					insertquery2 += "?,";
					escape.push(data[i][attrname]);				
				}
				insertquery = insertquery.slice(0, - 1) + ")";
				insertquery2 = insertquery2.slice(0, - 1) + ")";
				query +="INSERT IGNORE INTO "+schema.name+" "+insertquery+" VALUES "+insertquery2;
				escape = escape.concat(escape);					
				ModelQuery({string:query,escape:escape},function(result){
					addData(i+1);
				});
			}
		
	}
	function sqlDate(date){
		var n = new Date(date);
		var m = (n.getMonth() < 10) ? '0'+(n.getMonth()+1) : n.getMonth()+1;
		var d = (n.getDate() < 10) ? '0'+n.getDate() : n.getDate();
		return n.getFullYear() + '-' + m + '-' + d;
	}
	return {
		Schema:schema,
		DBConfig:dbconfig,
		Find:Find,
		FindOne:FindOne,
		FindTop:FindTop,
		FindPage:FindPage,
		Delete:Delete,
		DeleteTop:DeleteTop,
		Update:Update,
		UpdateX:UpdateX,
		Insert:Insert,
		InsertIgnore:InsertIgnore,
		InsertDuplicate:InsertDuplicate,
		InsertMultiple:InsertMultiple,
		InsertMultipleWithDuplicate:InsertMultipleWithDuplicate,
		Count:Count,
		sqlDate:sqlDate,
		sqlQuery:ModelQuery
	}
}
module.exports=model;