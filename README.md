# JAMM
An NPM package for simplifying the process of creating & querying table on your MySQL database.

## Installation
```
$ npm install jamm --save
```

## Example
Create few files below:

- database.js

```
module.exports={
	host     : DB_HOSTNAME,
	user     : DB_USERNAME,
	password : DB_PASSWORD,
	dbname:DB_DATABASE
}
```

- author.js

```
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
				name:'score',
				type:'INT',
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
	const mysql_model = require('jamm');
	const model = new mysql_model(table,database,presetData,()=>{
		console.log(table.name,"created & indexed")
	});
	return model;	
}
module.exports=author();
```

- index.js

```
const authorModel = require("./author.js");
```

once done, you can run the script with

```
node index.js
```

if there's no error, you can check your database that the table "tbl_author" is created.

## Table schema

```
const table ={
    name:,
    column:[
        {
            name:,
            type:,
            ext:,
            primary:,
            index:,
			unique:,
            foreign:{
                table:,
                column:
                }
            }
        }
    ]
}
```

- ```table.name``` :[string][required], the name of the Table 
- ```table.column``` : [array][required], list of column inside the table
- ```table.column.name``` : [string][required], the name of column
- ```table.column.type``` : [string][required], sql data type (ie: **TEXT**, **VARCHAR**, **INT**). Please refer to sql data types for all available option.
- ```table.column.len``` : [number][optional], sql data size.
- ```table.column.ext```:[string],[optional], sql extended option for data type, such as length, or unique index. Please refer to sql data types for all available option.
- ```table.column.index``` :[boolean][optional], Determines if column will have **INDEX KEY**
- ```table.column.primary``` : [boolean][optional], Determines if column will have **PRIMARY KEY** index
- ```table.column.unique``` :[array][optional], Determines if column will have **UNIQUE KEY**
- ```table.column.foreign```:[object][optional],Determines if column **FOREIGN KEY**
- ```table.column.foreign.table``` :[string][required], the table for **FOREIGN KEY**
- ```table.column.foreign.column```:[string][required],the column for **FOREIGN KEY**.
- ```table.column.foreign.ext```:[string][optional],the extended option for **FOREIGN KEY**.

## Performing queries
Once created, here's the available method for the authorModel from above example as a shortcut to execute a query.

### sqlQuery(option,callback)
Perform the usual SQL Query. Option are:
- option.string : [string][required], the full sql query, you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 

example:
```
    authorModel.sqlQuery({string:"SELECT * FROM another_table_that_exist_in_database WHERE id=?",escape:['myId']},(result)=>{
       //result.error will be an Error if one occurred during the query
       // result.recordset will contain the results of the query
    })
```

### Find([option],callback)
Perform ```SELECT * FROM ``` query for the table.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.Find({string:"id=?",escape:["myId"]},(result)=>{
    // result is array of record, empty array if not found
})
```
is the same as executing query like this
```
SELECT * FROM tbl_author WHERE id='myId'
```
### FindOne([option],callback)
Perform ```SELECT * FROM ``` query for the table with ```LIMIT 1 ``` appended at the end of query.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.FindOne({string:"id=?",escape:["myId"]},(result)=>{
    // result is object of a record, undefined if not found
})
```
is the same as executing query like this
```
SELECT * FROM tbl_author WHERE id='myId' LIMIT 1
```
### FindTop([option],callback)
Perform ```SELECT * FROM ``` query for the table with ```LIMIT  ``` appended at the end of query.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 
- option.top : [integer][optional][default:1], the number of record requested

performing 
```
authorModel.FindTop({string:"posttime<?",escape:["2019-01-01"],top:10},(result)=>{
    // result is an array of record
  })
```
is the same as executing query like this
```
SELECT * FROM tbl_author WHERE posttime<'2019-01-01' LIMIT 10
```
### FindPage([option],callback)
Shortcut to perform ```SELECT * FROM ``` query for the table with ```LIMIT  ``` appended at the end of query.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 
- option.page: [integer][optional][default:0], offset number
- option.max:[integer][optional][default:10], max record

performing 
```
authorModel.FindPage({string:"posttime<?",escape:["2019-01-01"],page:0,max:10},(result)=>{
    // result is an array of record
  })
```
is the same as executing query like this
```
SELECT * FROM tbl_author WHERE posttime<'2019-01-01' LIMIT 0,10
```

### Delete([option],callback)
Perform ```DELETE FROM ``` query for the selected table.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have option
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.Delete({string:"id=?",escape:["myId"]},(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
DELETE FROM tbl_author WHERE id='myId'
```
### DeleteTop([option],callback)
Perform ```DELETE FROM ``` query for the selected model with ```LIMIT ``` appended at the end of query.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped
- option.escape : [array][optional], the value of the escaped string 
- option.top : [integer][optional][default:1], number of record deleted

performing 
```
authorModel.Delete({string:"id=?",escape:["myId"],top:1},(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
DELETE FROM tbl_author WHERE id='myId' LIMIT 1
```
### Update(option,callback)
Perform ```UPDATE  ``` query for the selected table.  Option are:
- option.string : [string][required], the sql query after a ```SET``` clause , you can use ``?`` characters as placeholders for values you would like to have option
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.Update({string:"name=? WHERE id=?",escape:["new name","myId"]},(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
UPDATE tbl_author SET name='new name' WHERE id='myId'
```
### UpdateX(object,[option],callback)
Simplified form to perform ```UPDATE  ``` query for the selected table.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have option
- option.escape : [array][optional], the value of the escaped string 

performing 
```
let updatedData={
	name:"new name",
	email:"newmail@gmail.com"
}
authorModel.UpdateX(updatedData,{string:"id=?",escape:["myId"]},(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
UPDATE tbl_author SET name='new name', email='newmail@gmail.com' WHERE id='myId'
```

### Insert(object,callback)
Perform ```INSERT INTO``` query for the selected table, performing 
```
let newAuthor={
    id:"newId",
	name:"new Author",
	email:"newauthor@gmail.com"
}
authorModel.Insert(newAuthor,(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
INSERT INTO tbl_author SET (id,name,email) VALUES ('newId','new Author','newauthor@gmail.com')
```

### InsertIgnore(object,callback)
Perform ```INSERT IGNORE INTO ``` query for the selected table, performing 
```
let newAuthor={
    id:"newId",
	name:"new Author",
	email:"newauthor@gmail.com"
}
authorModel.InsertIgnore(newAuthor,(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
INSERT IGNORE INTO tbl_author SET (id,name,email) VALUES ('newId','new Author','newauthor@gmail.com')
```
### InsertDuplicate(object,array,callback)
Perform ```INSERT INTO ``` query for the selected table with ```ON DUPLICATE KEY UPDATE``` appended at the end of query, performing 
```
let newAuthor={
    id:"newId",
	name:"new Author",
	email:"newauthor@gmail.com"
}
authorModel.InsertDuplicate(newAuthor,["name","email"],(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
INSERT INTO tbl_author SET (id,name,email) VALUES ('newId','new Author','newauthor@gmail.com') ON DUPLICATE KEY UPDATE name = VALUES (name),email = VALUES (email)
```
### InsertMultiple(object,callback)
Perform ```INSERT INTO``` query for the selected table for multiple data record, performing 
```
let newAuthorList=[
    {
        id:"newId",
	    name:"new Author",
	    email:"newauthor@gmail.com"
    },
    {
        id:"newerId",
	    name:"newer Author",
	    email:"newerauthor@gmail.com"
    }
]
authorModel.InsertMultiple(newAuthorList,(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
INSERT INTO tbl_author SET (id,name,email) VALUES ('newId','new Author','newauthor@gmail.com'),('newerId','newer Author','newerauthor@gmail.com')
```

### InsertMultipleWithDuplicate(object,array,callback)
Perform ```INSERT INTO``` query for the selected table for multiple data record  with ```ON DUPLICATE KEY UPDATE``` appended at the end of query, performing 
```
let newAuthorList=[
    {
        id:"newId",
	    name:"new Author",
	    email:"newauthor@gmail.com"
    },
    {
        id:"newerId",
	    name:"newer Author",
	    email:"newerauthor@gmail.com"
    }
]
authorModel.InsertMultipleWithDuplicate(newAuthorList,["name","email"],(result)=>{
    //result.error will be an Error if one occurred during the query
})
```
is the same as executing query like this
```
INSERT INTO tbl_author SET (id,name,email) VALUES ('newId','new Author','newauthor@gmail.com'),('newerId','newer Author','newerauthor@gmail.com') ON DUPLICATE KEY UPDATE name = VALUES (name),email = VALUES (email)
```

### Count([option],callback)
Perform ```SELECT IFNULL(COUNT(*),0) FROM ``` query for the table.  Option are:
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.Count({string:"posttime<?",escape:["2019-01-01"]},(result)=>{
    // result the number of record
})
```
is the same as executing query like this
```
SELECT IFNULL(COUNT(*),0) FROM tbl_author WHERE posttime<'2019-01-01';
```
### Sum(column,[option],callback)
Perform ```SELECT IFNULL(SUM(column),0) FROM ``` query for the table.  Option are:
- option.column : [string][required], the column name,
- option.string : [string][optional][default:"1"], the sql query after a ```WHERE``` clause , you can use ``?`` characters as placeholders for values you would like to have escaped,
- option.escape : [array][optional], the value of the escaped string 

performing 
```
authorModel.Sum("score",{string:"posttime<?",escape:["2019-01-01"]},(result)=>{
    // result the number of record
})
```
is the same as executing query like this
```
SELECT IFNULL(SUM(score),0) FROM tbl_author WHERE posttime<'2019-01-01';
```

## License
[ISC](https://opensource.org/licenses/ISC)
