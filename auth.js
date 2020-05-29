const jwt=require('jsonwebtoken')
var id;

module.exports.auth=((req,res,next)=>
 {
   try
   {   
       
    const tockenid= req.headers.authorization.split(' ')[1];
    console.log('problem machi di splite ')
    console.log('tocken :'+tockenid)
       var decode=jwt.verify(tockenid,'CLE_DIY_BRICO');
       console.log('athan decodeage+'+decode.id)
     this.id=decode.id;
       
      
       next();
   }
   catch(erreu)
   {
       res.status(500).json({erreur:'une erreur est produite'});
   }

 }
 
 
 );

 module.exports.id=id;
