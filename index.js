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
				var columns = [];
				schema.column.forEach((n)=>{
					var temp=`${n.name} ${n.type}`;
					if(n.len && n.len >0){
						temp +=` (${n.len}) `;
					}
					if(n.ext && n.ext!=""){
						temp +=` ${n.ext}`;
					}
					
					columns.push(temp);
				})
				var indexes=[];
				schema.column.forEach((n)=>{
					var temp="";
					if(n.index===true){
						indexes.push(`INDEX ${schema.name}_index_${n.name} (${n.name})`);
					}else if(n.primary===true){
						indexes.push(`CONSTRAINT ${schema.name}_primary_${n.name} PRIMARY KEY (${n.name})`);
					}else if(n.unique){
						indexes.push(`CONSTRAINT ${schema.name}_unique_${n.name} UNIQUE(${n.unique.join(",")})`);
					}
				})
				var query=`CREATE TABLE ${schema.name} (${columns.join(",")} `;
				if(indexes.length >0){
					query +=`, ${indexes.join(",")}`;
				}
				query +=`)`;
				if(schema.engine && typeof schema.engine=="string"){
				    query +="ENGINE="+schema.engine;
				}
				ModelQuery({string:query},function(result){
					if (result.err){
						setTimeout(function(){
							checkTable(schema);
						},1000)
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
				var query=`ALTER TABLE ${schema.name} ADD ${schema.column[index].name} ${schema.column[index].type}`;
				if(schema.column[index].len &&schema.column[index].len >0){
					query+=`(${schema.column[index].len})`;
				}
				if(schema.column[index].ext &&schema.column[index].ext !=""){
					query+=` ${schema.column[index].ext}`; 
				}
				if(schema.column[index].index===true){
					temp+=`, ADD INDEX ${schema.name}_index_${schema.column[index].name} (${schema.column[index].name})`;
				}else if(schema.column[index].primary===true){
					temp+=`, ADD CONSTRAINT ${schema.name}_primary_${n.name} PRIMARY KEY (${schema.column[index].name})`;
				}else if(schema.column[index].unique){
					temp+=`, ADD CONSTRAINT ${schema.name}_unique_${n.name} UNIQUE(${schema.column[index].unique.join(",")})`;
				}else if(schema.column[index].foreign){
					temp+=`, ADD CONSTRAINT ${schema.name}_foreign_${n.name} FOREIGN KEY (${schema.column[index].name}) REFERENCES ${schema.column[index].foreign.table}(${schema.column[index].foreign.column})`;
					if(typeof schema.column[index].foreign.ext =="string"){
						temp +=` ${schema.column[index].foreign.ext}`;
					}
				}
				ModelQuery({string:query,escape:false},function(result){
					checkColumn(index+1);
				});
			}else{
				var query = `select * from information_schema.columns where table_schema = '${dbconfig.dbname}' and table_name = '${schema.name}' and column_name = '${schema.column[index].name}'`;
				ModelQuery({string:query,escape:false},function(result){
					if(result.error){
						checkColumn(index+1);	
						return;
					}
					var res = result.recordset[0];
					var alter;
					
					if(res.DATA_TYPE.toLowerCase() != schema.column[index].type.toLowerCase()){
						alter = `ALTER TABLE ${schema.name} MODIFY COLUMN ${schema.column[index].name} ${schema.column[index].type}`;
					}
					if(schema.column[index].len && schema.column[index].len > 0 && res.CHARACTER_MAXIMUM_LENGTH != schema.column[index].len){
						alter = `ALTER TABLE ${schema.name} MODIFY COLUMN ${schema.column[index].name} ${schema.column[index].type}(${schema.column[index].len})`;
					}
					if(!alter){
						checkColumn(index+1);	
						return;
					}
					if(schema.column[index].ext &&schema.column[index].ext !=""){
						alter+=` ${schema.column[index].ext}`;
					}
					console.log(alter);
					ModelQuery({string:alter,escape:false},function(result){
						checkColumn(index+1);
					});
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
		var alter;
		var query = `SELECT * FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND Column_name=?`;
		var escape = [dbconfig.database,schema.name,schema.column[index].name];
		if(schema.column[index].index===true){
			alter = `ALTER TABLE ${schema.name} ADD INDEX ${schema.name}_index_${schema.column[index].name} (${schema.column[index].name});`;
			query +=" AND INDEX_NAME=?";
			escape.push(`${schema.name}_index_${schema.column[index].name}`);
		}else if(schema.column[index].primary===true ){
			alter=`ALTER TABLE ${schema.name} ADD CONSTRAINT ${schema.name}_primary_${schema.column[index].name} PRIMARY KEY (${schema.column[index].name})`;
			query +="AND INDEX_NAME=?";
			escape.push(`PRIMARY`);
		}else if(schema.column[index].unique){
			alter=`ALTER TABLE ${schema.name} ADD CONSTRAINT ${schema.name}_unique_${schema.column[index].name} UNIQUE(${schema.column[index].unique.join(",")})`;
			query +=" AND INDEX_NAME=?";
			escape.push(`${schema.name}_unique_${schema.column[index].name}`);
		}else if(schema.column[index].foreign ){
			alter =`ALTER TABLE ${schema.name} ADD CONSTRAINT ${schema.name}_foreign_${schema.column[index].name} FOREIGN KEY (${schema.column[index].name}) REFERENCES ${schema.column[index].foreign.table}(${schema.column[index].foreign.column}) `;
			if(typeof schema.column[index].foreign.ext =="string"){
				alter +=` ${schema.column[index].foreign.ext}`;
			}
			query +=" AND INDEX_NAME=?";
			escape.push(`${schema.name}_foreign_${schema.column[index].name}`);
		}
		if(!alter){
			checkIndexed(index+1);
			return;
		}
		ModelQuery({string:query,escape:escape},function(result){
			if(result.error){
				checkIndexed(index+1);
				return;
			}
			if(result.recordset.length >0){
				checkIndexed(index+1);
				return;
			}
			
			ModelQuery({string:alter},function(result){
				checkIndexed(index+1);
				return;	
			});
			
		});
	}
	function Find(condition,callback){
		if(!finished){
			setTimeout(function(){
				Find(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		condition.string = condition.string || "1";
		var query = `SELECT * FROM ${schema.name} WHERE ${condition.string}`;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function FindOne(condition,callback){			
		if(!finished){
			setTimeout(function(){
				FindOne(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		condition.string = condition.string || "1";
		var query = `SELECT * FROM ${schema.name} WHERE ${condition.string} LIMIT 1`;
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
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		
		condition.string = condition.string || "1";
		condition.top = condition.top || 1;
		var query = `SELECT * FROM ${schema.name} WHERE ${condition.string} LIMIT ${condition.top}` ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function FindPage(condition,callback){	
		if(!finished){
			setTimeout(function(){
				FindTop(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		condition.page = condition.page || "0" ;
		condition.max = condition.max || "10" ;

		var query = `SELECT * FROM ${schema.name} WHERE ${condition.string} LIMIT ${condition.page},${condition.max}` ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result.recordset);}
		});		
	}
	function Delete(condition,callback){			
		if(!finished){
			setTimeout(function(){
				Delete(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		var query = `DELETE FROM ${schema.name} WHERE ${condition.string}`;	

		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});		
	}	
	function DeleteTop(condition,callback){			
		if(!finished){
			setTimeout(function(){
				DeleteTop(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		condition.string = condition.string || "1";
		condition.top = condition.top || 1 ;
		var query = `DELETE FROM ${schema.name} WHERE ${condition.string} LIMIT ${condition.top}` ;
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});		
	}
	function Count(condition,callback){			
		if(!finished){
			setTimeout(function(){
				Count(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		var query;
		condition.string = condition.string || "1";
		query = `SELECT IFNULL(COUNT(*),0) AS CNT FROM ${schema.name} WHERE ${condition.string}`;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (result.err){
				if (callback && typeof(callback) == "function"){callback(0);}	
				return;
			}
			if (callback && typeof(callback) == "function"){callback(result.recordset[0].CNT);}
		});		
	}
	function Sum(col,condition,callback){			
		if(!finished){
			setTimeout(function(){
				Count(condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}

		var query;
		condition.string = condition.string || "1";
		query = `SELECT IFNULL(SUM(${col}),0) AS SUM FROM ${schema.name} WHERE ${condition.string}`;	
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
			},100)
			return;
		}
		if(!condition || !condition.string){
			callback({error:"option.string is not set"});
			return;
		}
		var query = `UPDATE ${schema.name} SET ${condition.string}`;	
		ModelQuery({string:query,escape:condition.escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});	
	}
	function UpdateX(data,condition,callback){
		if(!finished){
			setTimeout(function(){
				UpdateX(data,condition,callback)
			},100)
			return;
		}
		if(typeof condition==="function"){
			callback = condition;
			condition={};
		}
		var updatequery = '';
		var escapequery = [];
		var temp = [];
		for (var attrname in data){
			temp.push(attrname +'=?');
			escapequery.push(data[attrname]);
		}
		updatequery = temp.join(",");
		
		for(i=0;i<condition.escape.length;i++){
			escapequery.push(condition.escape[i]);
		}

		condition.string = condition.string || "1";
		var query = `UPDATE ${schema.name} SET ${updatequery} WHERE ${condition.string}`;
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
			},100)
			return;
		}
		var insertquery="(" +Object.keys(data).join(",") + ")";
		var temp = [];
		for(i=0;i<Object.keys(data).length;i++){
			temp.push("?")
		}
		var insertquery2="(" + temp.join(",") + ")";
		var escape =Object.values(data);

		var query = `INSERT INTO ${schema.name} ${insertquery} VALUES ${insertquery2}`;	
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertIgnore(data,callback){
		if(!finished){
			setTimeout(function(){
				InsertIgnore(data,callback)
			},100)
			return;
		}

		var insertquery="(" +Object.keys(data).join(",") + ")";
		var temp = [];
		for(i=0;i<Object.keys(data).length;i++){
			temp.push("?")
		}
		var insertquery2="(" + temp.join(",") + ")";
		var escape =Object.values(data);
	
		var query = `INSERT IGNORE INTO ${schema.name} ${insertquery} VALUES ${insertquery2}`;
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertDuplicate(data,dup,callback){
		if(!finished){
			setTimeout(function(){
				InsertDuplicate(data,dup,callback)
			},100)
			return;
		}
	    var insertquery="(" +Object.keys(data).join(",") + ")";
		var temp = [];
		for(i=0;i<Object.keys(data).length;i++){
			temp.push("?")
		}
		var insertquery2="(" + temp.join(",") + ")";
		var escape =Object.values(data);
		
		var insertDuplicate = ' ON DUPLICATE KEY UPDATE ';
		temp = [];
		for (i=0;i<dup.length;i++){
			temp.push(dup[i] + ' = VALUES (' + dup[i] + ')');
		}
		insertDuplicate += temp.join(",") +';';
		
		var query = `INSERT INTO ${schema.name} ${insertquery} VALUES ${insertquery2} ${insertDuplicate} `;	
		
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertMultiple(data,callback){
		if(!finished){
			setTimeout(function(){
				InsertMultiple(data,callback)
			},100)
			return;
		}
		if(data.length ==0){
			if (callback && typeof(callback) == "function"){callback({error:1,recordset:[]});}
			return
		}
		
		var insertquery="(" +Object.keys(data[0]).join(",") + ")";
		var temp = [];
		for(i=0;i<Object.keys(data[0]).length;i++){
			temp.push("?")
		}
		var escape =[];
		
		var insertquery2=[];
		for(i=0;i<data.length;i++){
			insertquery2.push("(" + temp.join(",") + ")");
			escape.push(...Object.values(data[i]))
		}
		
		var query = `INSERT IGNORE INTO ${schema.name} ${insertquery} VALUES ${insertquery2.join(",")}`;
		ModelQuery({string:query,escape:escape},function(result){
			if (callback && typeof(callback) == "function"){callback(result);}
		});
	}
	function InsertMultipleWithDuplicate(data,dup,callback){
		if(!finished){
			setTimeout(function(){
				InsertMultipleWithDuplicate(data,dup,callback)
			},100)
			return;
		}
		if(data.length ==0){
			if (callback && typeof(callback) == "function"){callback({error:1,recordset:[]});}
			return
		}
		
		var insertquery="(" +Object.keys(data[0]).join(",") + ")";
		var temp = [];
		for(i=0;i<Object.keys(data[0]).length;i++){
			temp.push("?")
		}
		var escape =[];
		
		var insertquery2=[];
		for(i=0;i<data.length;i++){
			insertquery2.push("(" + temp.join(",") + ")");
			escape.push(...Object.values(data[i]))
		}

		var insertDuplicate = ' ON DUPLICATE KEY UPDATE ';
		temp = [];
		for (i=0;i<dup.length;i++){
			temp.push(dup[i] + ' = VALUES (' + dup[i] + ')');
		}
		insertDuplicate += temp.join(",") +';';

		var query = `${schema.name} ${insertquery} VALUES ${insertquery2.join(",")} ${insertDuplicate}`;
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
				query +=`INSERT IGNORE INTO ${schema.name} ${insertquery} VALUES ${insertquery2}`;
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
		Sum:Sum,
		sqlDate:sqlDate,
		sqlQuery:ModelQuery
	}
}
module.exports=model;