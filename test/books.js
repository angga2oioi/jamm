function author(){
	const table={
		name:'tbl_books',
		column:[
			{
				name:'id',
				type:'VARCHAR',
				len:32,
				primary:true,
			},
			{
				name:'author_id',
				type:'VARCHAR',
                len:16,
                foreign:{
                    table:"tbl_author",
                    column:"id",
                    ext:"ON DELETE CASCADE"
                }
			},
			{
				name:'title',
				type:'TEXT',
				ext:''
			},
			{
				name:'posttime',
				type:'TIMESTAMP',
				ext:'NOT NULL DEFAULT CURRENT_TIMESTAMP',
				index:true
			}
		]
	}
	const database = require('./database.js');
	const mysql_model = require('./../index');
	const model = new mysql_model(table,database,false,()=>{
		console.log(table.name,"created & indexed")
	});
	return model;	
}
module.exports=author();