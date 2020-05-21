const http=require('http');
const Express=require('express');
const mysql=require('mysql');
const bodyParser = require('body-parser');
const app=Express();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var request = require('request');
var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database: 'mydb'
  });

 db.connect();
 var id=1;

 app.use( bodyParser.json() );       // to support JSON-encoded bodies
 app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
   extended: true
 })); 
 

 

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

  app.post('/add/compte_complet/', (req, res) => {

   // var xmlhttp = new XMLHttpRequest();
    var url = 'https://api-adresse.data.gouv.fr/search/?q='+req.body.rue+'+'+req.body.ville+'+'+req.body.codepostale;
    var bdy;
    request.get(url,(err,ress,body)=>{bdy=JSON.parse(body);bdy=bdy.features[0].geometry.coordinates;
   var adresse=[req.body.rue,req.body.ville,parseInt(req.body.codepostale)];
    adresse.push(bdy[1]);
    adresse.push(bdy[0]);
   db.query('insert into adresse (rue,ville,code_postale,geo_x_att,geo_y_latt) values (?)',[adresse],(err,result)=>
    {    
        if(err)
        {
            res.status(500).json({erreur:"lors de creation adresse"});
            console.log(err);
        }
        else
        {
        
            var compte=[req.body.email,req.body.password,1,'U','null',result.insertId];
             var profile=[req.body.nom,req.body.prenom,parseInt(req.body.tel)];
             db.query('insert into profile (Nom_utilisateur,Prenom_utilisateur,numero_tel) values (?)',[profile],(err,resultatfinal)=>
             {
                 if(err){res.status(500).json({erreur:"lors de creation profile"});console.log(err)}
                else
                     {
                     compte[4]=resultatfinal.insertId;
                     db.query('insert into compte (Email_compte,ps_compte_utilisateur,active,statut,id_profile,id_adresse) values (?)',[compte],(err,final)=>
                          {
                                 if(err)
                                  {
                                   res.status(500).json({erreur:"lors de creation compte"});
                                   console.log(err);
                                  }
                                 else
                                  {
                                     res.status(200).json({success:'creation du compte est complete'});
                                     }
                          });

                     }
                  });
        }

    
   
   
   
});
  });});



app.get('/messages/:id',(req,res,next)=>
{
    db.query('select * from message where id_compte=?',req.params.id,(err,rows,fields)=>
    {   
        if(err) {res.status('404');res.json({erreur:'erreur est produite'})}
        res.status('201').json(rows);
        res.end();
    });
});

app.get('/annonces/',(req,res,next)=>
{
    db.query('select * from annonce where 1',(err,rows,fields)=>
    {   
        if(err) {res.status('404');res.json({erreur:'erreur est produite'})}
        res.status('201').json(rows);
        res.end();
    });
}
)

app.get('/annonces/:id',(req,res,next)=>
{
    db.query('select * from annonce where ?',req.params.id,(err,rows,fields)=>
    {   
        if(err) {res.status('404');res.json({erreur:'erreur est produite'})}
        res.status('201').json(rows);
        res.end();
    });
}
)

app.get('/profile/:id',(req,res,next)=>
{
    db.query('select * from compte inner join profile using(id_profile) where 1',req.params.id,(err,rows,fields)=>
    {   
        if(err) {res.status('404');res.json({erreur:'erreur est produite'})}
        res.status('201').json(rows);
        res.end();
    });
}
)

/***************************************Calcule des voisins *************************** */
app.get('/voisins/:r',(req,res,next)=>
{   var r= req.params.r;
  var c;
    db.query('select geo_x_att,geo_y_latt from compte inner join adresse using(id_adresse) where id_compte=?',id,(err,rows,fields)=>
    {   
        if(err) {res.status('404');res.json({erreur:'erreur est produite'})}
        console.log(rows[0]);
        c=rows[0];
        db.query('select geo_x_att,geo_y_latt,rue from  adresse  where 1',(err,rows,fields)=>
   
    {   
        if(err) {res.status('404');console.log(err);res.json({erreur:'erreur est produite'})}
     var  result=rows;
    result=result.filter((x)=>{
    var lat1=c.geo_x_att;
    var lat2=x.geo_x_att;
    var lon1=c.geo_y_latt;
    var lon2=x.geo_y_latt;
    const R = 6371; // kmetres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const resultat = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))*R;

    if(resultat<r) return true 
    return false;
        });
        res.status(200).json(result);

})
})})

app.get('/annonce/:r/:latt/:long',(req,res,next)=>
{   
 var r= req.params.r;
  var c;

  var latt=req.params.latt;
  var long=req.params.long;
  c={
      geo_x_att:req.params.latt,
      geo_y_latt:req.params.long
  }
        db.query('select id_compte,Email_compte,date_annonce,contenu,prix,nom_categorie,image_categorie ,geo_x_att,geo_y_latt,rue from compte inner join  adresse using(id_adresse) inner join annonce using(id_compte) inner join categorie_annonce using(idcategorie) where 1',(err,rows,fields)=>
   
    {   
        if(err) {res.status('404');console.log(err);res.json({erreur:'erreur est produite'})}
     var  result=rows;
    result=result.filter((x)=>{
    var lat1=c.geo_x_att;
    var lat2=x.geo_x_att;
    var lon1=c.geo_y_latt;
    var lon2=x.geo_y_latt;
    const R = 6371; // kmetres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const resultat = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))*R;

    if(resultat<r) return true 
    return false;
        });
        res.status(200).json(result);


})})

app.use((req,res)=>res.json({message:'votre reponse est la '}));

module.exports=app;
