var sql = require('mysql');
var pool=[];
function getPool(dbconfig){
	var sel_pool = pool.filter(function (el){
	  return el.name == dbconfig.dbname;
	})[0];
	
	//if no connection in pool are idle;
	if(!sel_pool){
		sel_pool={
			name:dbconfig.dbname,
			connection:false,			
		}
		pool.push(sel_pool);
	}
	
	if(!sel_pool.connection){
		if(!dbconfig.connectionLimit){
			dbconfig.connectionLimit = 1;
		}
		sel_pool.connection = sql.createPool(dbconfig);
	}
	return sel_pool;
}
module.exports.query=function(dbconfig,query,callback){		
	var sel_pool = getPool(dbconfig);
	if(!sel_pool){
		var db = this;
		setTimeout(function(){
			db.query(dbconfig,query,callback);
		},10);
		return;
	}
	sel_pool.connection.getConnection(function(err, connection) {
		if(err){
			console.log("mysql-db.js line 37",err);
		}
		connection.query(query.string,query.escape, function(err, recordset){
			connection.release();
			if (err){
			    console.log("mysql-db.js line 42",err);
				callback({err:err,error:err,recordset:false});
				return;
			}
			callback({err:err,error:err,recordset:recordset});
		});
	});
}
module.exports.isDatabaseExists=function(dbconfig,callback){
	delete dbconfig.database;
	var connection = sql.createConnection(dbconfig);
	connection.connect(function(err) {		
		  if (err) {			
			callback(false);
			return;
		  }
		connection.query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",[dbconfig.dbname], function(err, recordset) {	
			
			if (err || recordset.length==0){			
				connection.query("CREATE DATABASE "+dbconfig.dbname,false, function(err, recordset) {	
					connection.end();
					dbconfig.database = dbconfig.dbname;
					callback(true);
				});
			}else{
				connection.end();
				dbconfig.database = dbconfig.dbname;
				callback(true);
			}
		});
		
		  
	});
}
module.exports.isTableExists=function(dbconfig,table,callback){
	var db = this;	
	db.query(dbconfig,{string:"SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",escape:[dbconfig.dbname,table]},function(result){
		if (result.err || !result.recordset ||  result.recordset.length==0){
			callback(false);
			return;
		}
		if (result.recordset[0].cnt==0){
			callback(false);
			return;
		}else{
			callback(true);
			return;
		}
	});
}
module.exports.isColumnExists=function(dbconfig,table,column,callback){
	var db = this;
	db.query(dbconfig,{string:"SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",escape:[dbconfig.dbname,table,column]},function(result){		
		if (result.err ||  result.recordset.length==0){
			callback(false);
		}else{
			callback(true);
		}
	});
}
 