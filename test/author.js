function author(){
	const table={
		name:'tbl_author',
		column:[
			{
				name:'id',
				type:'VARCHAR',
				len:16,
				primary:true,
			},
			{
				name:'email',
				type:'VARCHAR',
				len:255,
				unique:['email']
			},
			{
				name:'name',
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
	const presetData=[{
		id:new Date().getTime(),
		email:'author-email@gmail.com',
		name:'the author',
	}];
	const database = require('./database.js');
	const mysql_model = require('./../index');
	const model = new mysql_model(table,database,presetData,()=>{
		console.log(table.name,"created & indexed")
	});
	return model;	
}
module.exports=author();